// scripts/refgen/extract-readme.ts
//
// Stage 2b — human semantics from the upstream README.
//
// The README is the canonical, hand-written API contract for these libraries.
// Method entries are headings whose text is a backticked signature, e.g.
//   #### `await core.append(block, [options])`
// followed by prose, parameter/option bullet lists and example code fences. We
// parse with mdast and collect, per entry: signature, description, params,
// returns and examples — the prose the AST cannot provide.

import { fromMarkdown } from 'mdast-util-from-markdown';

export interface ReadmeParam {
  name: string;
  optional: boolean;
  default?: string;
  description?: string;
}

export interface ReadmeOption {
  name: string;
  default?: string;
  description?: string;
}

export interface ReadmeEntry {
  /** Primary identifier parsed from the signature, e.g. `append` (`on` for events). */
  name: string;
  /** Event name when this entry documents an event (e.g. `close`), else undefined. */
  event?: string;
  /** Receiver the member is called on, e.g. `core`, `channel`, `m` (null for ctors). */
  receiver: string | null;
  signature: string;
  description?: string;
  returns?: string;
  params: ReadmeParam[];
  options: ReadmeOption[];
  examples: string[];
}

/**
 * Parse an options object fence — the `{ key: default, // comment }` block these
 * READMEs use to document an options argument — into structured fields. Default
 * values are kept only when they are a simple literal (number/bool/string/ident),
 * since arrow-function and object defaults aren't useful in a table cell.
 */
export function parseOptionsFence(examples: string[]): ReadmeOption[] {
  const fence = examples.find((ex) => {
    const t = ex.trim();
    return t.startsWith('{') && t.endsWith('}') && /^\s*[A-Za-z_$][\w$]*\s*[,:]/m.test(t);
  });
  if (!fence) return [];

  const inner = fence.trim().replace(/^\{/, '').replace(/\}$/, '');
  const options: ReadmeOption[] = [];
  let depth = 0;
  let line = '';
  const flush = () => {
    const raw = line.trim().replace(/,$/, '').trim();
    line = '';
    if (!raw) return;
    const m = raw.match(/^([A-Za-z_$][\w$]*)\s*(?::\s*([\s\S]*?))?\s*,?\s*(?:\/\/\s*(.*))?$/);
    if (!m) return;
    const name = m[1];
    const rawDefault = (m[2] ?? '').trim().replace(/,$/, '').trim();
    const simple = /^(-?\d[\d_.]*|true|false|null|undefined|'[^']*'|"[^"]*"|[A-Za-z_$][\w$]*)$/.test(rawDefault);
    options.push({
      name,
      ...(simple ? { default: rawDefault } : {}),
      ...(m[3] ? { description: m[3].trim() } : {}),
    });
  };
  // Split on newlines and top-level commas; arrow/object bodies stay on one line.
  for (const ch of inner) {
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    if (ch === '\n' && depth <= 0) flush();
    else line += ch;
  }
  flush();
  return options;
}

/** The object a member is accessed on, e.g. `channel` in `channel.open(...)`. */
export function receiverOf(signature: string, name: string): string | null {
  const m = signature.match(new RegExp(`([\\w$]+)\\.${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`));
  return m ? m[1] : null;
}

export interface ReadmeSection {
  title: string;
  markdown: string;
}

/**
 * README headings whose sections are narrative/setup prose worth keeping
 * verbatim (everything that is NOT the API method list). Matched case- and
 * punctuation-insensitively against the heading text.
 */
const NARRATIVE_HEADINGS = new Set([
  'install',
  'installation',
  'prerequisite',
  'prerequisites',
  'requirement',
  'requirements',
  'setup',
  'usage',
  'quickstart',
  'gettingstarted',
  'features',
  'workflow',
  'workflows',
  'example',
  'examples',
]);

function normalizeHeading(title: string): string {
  return title.toLowerCase().replace(/[^a-z]/g, '');
}

/** Flatten an mdast node's text content (text + inlineCode), losing formatting. */
function toText(node: any): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (Array.isArray(node.children)) return node.children.map(toText).join('');
  return '';
}

/**
 * Flatten an mdast node to Markdown, preserving inline code and links — used for
 * prose (descriptions, returns, param sentences) that ends up rendered in MDX, so
 * `core.key` stays code and README cross-links survive.
 */
function toRichText(node: any): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'inlineCode') return `\`${node.value}\``;
  if (node.type === 'link') return `[${(node.children ?? []).map(toRichText).join('')}](${node.url})`;
  if (Array.isArray(node.children)) return node.children.map(toRichText).join('');
  return '';
}

/**
 * Heading text that looks like a call/constructor signature. Requires a call
 * with no space before `(` (so narrative headings like "Usage (advanced)" are
 * not mistaken for code) and either a `new X(` constructor or a `recv.method(` /
 * `fn(` call. Catches sub-object entries the README writes as plain `#####`
 * headings (e.g. `ext.send(message, peer)`) rather than backticked code.
 */
const SIGNATURE_RE =
  /^(?:await\s+|(?:const|let|var)\s+[^=]+=\s*)?(?:new\s+[A-Z][\w$]*\(|[\w$]+(?:\.[\w$]+)*\()/;

/** A heading is a method entry when it is, or reads as, a signature. */
function signatureFromHeading(node: any): string | null {
  if (node.type !== 'heading' || node.depth < 2) return null;

  // Preferred form: a single backticked signature.
  const codes = (node.children ?? []).filter((c: any) => c.type === 'inlineCode');
  const others = (node.children ?? []).filter(
    (c: any) => c.type !== 'inlineCode' && toText(c).trim() !== ''
  );
  if (codes.length === 1 && others.length === 0) return codes[0].value.trim();

  // Fallback: plain-text heading that reads like a signature (sub-object docs).
  const text = toText(node).trim();
  if (NARRATIVE_HEADINGS.has(normalizeHeading(text))) return null;
  if (SIGNATURE_RE.test(text)) return text;

  return null;
}

/** Primary method/function name from a signature string. */
export function primaryName(signature: string): string | null {
  // `await core.append(...)` / `core.createReadStream(...)` -> last `.method`
  const dotted = [...signature.matchAll(/\.([a-zA-Z_$][\w$]*)\s*(?:\(|$)/g)];
  if (dotted.length > 0) return dotted[dotted.length - 1][1];
  // `new Hypercore(...)` -> constructor
  if (/\bnew\s+[A-Za-z_$]/.test(signature)) return 'constructor';
  // bare `fn(...)`
  const fn = signature.match(/^([a-zA-Z_$][\w$]*)\s*\(/);
  if (fn) return fn[1];
  // trailing `.prop`
  const prop = signature.match(/\.([a-zA-Z_$][\w$]*)\s*$/);
  if (prop) return prop[1];
  // Bare lowercase identifier, no call/dot/new at all — a heading documenting an
  // object's SHAPE via a following field list (e.g. compact-encoding's `state`)
  // rather than a call signature. Capitalized bare words (AutoStore, Stats, Dir,
  // …) are class/type names introducing a nested section of #### method
  // headings, not shape entries — restricting to a lowercase first letter by
  // convention excludes them (verified against 20 holepunchto READMEs).
  const bareValue = signature.match(/^([a-z_$][\w$]*)$/);
  if (bareValue) return bareValue[1];
  return null;
}

/**
 * The event name documented by a heading, or null when it is not an event.
 * Handles both the form hypercore-era READMEs use (`core.on('close')`) and the
 * canonical Bare README convention (`event: 'close'`). Events all share the
 * method name `on`, so the event name is what distinguishes them as symbols.
 */
export function eventName(signature: string): string | null {
  const on = signature.match(/\.on\(\s*['"]([^'"]+)['"]/);
  if (on) return on[1];
  const ev = signature.match(/^event:\s*['"]([^'"]+)['"]/);
  if (ev) return ev[1];
  return null;
}

/** Split the argument list of a signature into individual params. */
function paramsFromSignature(signature: string): ReadmeParam[] {
  const open = signature.indexOf('(');
  if (open === -1) return [];
  // Match the parens balancing depth so nested ({}) defaults don't truncate.
  let depth = 0;
  let end = -1;
  for (let i = open; i < signature.length; i++) {
    if (signature[i] === '(') depth++;
    else if (signature[i] === ')') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return [];
  const inner = signature.slice(open + 1, end).trim();
  if (!inner) return [];

  const parts = splitTopLevel(inner);
  return parts.map((raw) => {
    let token = raw.trim();
    let optional = false;
    // README marks optionals as [name] or name = default.
    if (token.startsWith('[') && token.endsWith(']')) {
      optional = true;
      token = token.slice(1, -1).trim();
    }
    let def: string | undefined;
    const eq = token.indexOf('=');
    if (eq !== -1) {
      def = token.slice(eq + 1).trim();
      token = token.slice(0, eq).trim();
      optional = true;
    }
    return { name: token, optional, default: def };
  });
}

/** Comma-split that respects (), [], {} nesting. */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** Pull `name` + description out of a bullet like `` `block` - the data ``. */
function paramFromListItem(item: any): ReadmeParam | null {
  const text = toText(item).trim();
  const m = text.match(/^`?([.\w$\[\]]+)`?\s*[-–:]\s*(.+)$/s);
  if (m) {
    let name = m[1].replace(/[`\[\]]/g, '');
    return { name, optional: false, description: m[2].trim().replace(/\s+/g, ' ') };
  }
  // Some READMEs write field bullets as plain subject-verb sentences instead of
  // a dash/colon list, e.g. "`start` is the byte offset to start encoding/
  // decoding at." (compact-encoding's `state` shape). Reuse PARAM_SUBJECT_VERB,
  // the same pattern assignParamDescriptions() uses for paragraph prose below —
  // only fires when the dash/colon form above didn't already match.
  const sv = text.match(/^`?([.\w$\[\]]+)`?\s+(.+)$/s);
  if (sv && PARAM_SUBJECT_VERB.test(sv[2])) {
    let name = sv[1].replace(/[`\[\]]/g, '');
    return { name, optional: false, description: sv[2].trim().replace(/\s+/g, ' ') };
  }
  return null;
}

/**
 * Lift narrative sections (Install, Prerequisites, Usage, …) verbatim from the
 * README. Each section spans its heading to the next heading of the same or
 * shallower depth, sliced from the raw source via mdast node offsets.
 */
export function extractSections(readme: string): ReadmeSection[] {
  const tree = fromMarkdown(readme);
  const nodes = tree.children;
  const out: ReadmeSection[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node: any = nodes[i];
    if (node.type !== 'heading') continue;
    const title = toText(node).trim();
    if (!NARRATIVE_HEADINGS.has(normalizeHeading(title))) continue;

    const depth = node.depth;
    const start = node.position?.start?.offset ?? 0;
    let end = readme.length;
    for (let j = i + 1; j < nodes.length; j++) {
      const next: any = nodes[j];
      if (next.type === 'heading' && next.depth <= depth) {
        end = next.position?.start?.offset ?? end;
        break;
      }
    }
    out.push({ title, markdown: readme.slice(start, end).trim() });
  }

  return out;
}

/** Verbs that mark "<param> <verb> …" as a description OF the param. */
const PARAM_SUBJECT_VERB =
  /^(?:is|are|can|could|should|shall|must|may|might|will|takes?|defaults?|specifies|sets?|controls?|enables?|disables?|contains?|accepts?|holds?|overrides?|determines?|indicates?|points?|maps?|configures?|represents?|defines?|includes?|expects?|allows?|optional)\b/i;

/**
 * Recover param descriptions these READMEs embed in prose ("`bg` is set to
 * `true`, …") rather than in a bullet list. To avoid mis-attributing the method's
 * own sentence, a sentence is only taken as a param's description when that param
 * is its SUBJECT — it leads the sentence (optionally after If/When/The/`) and is
 * followed by a descriptive verb. So "`opts` are the same options as core.get(…)"
 * documents `opts`, but "Insert a new key" documents nothing. First match wins per
 * param; unmatched params stay blank rather than guessing.
 */
function assignParamDescriptions(params: ReadmeParam[], paragraphs: string[]): void {
  // Skip destructured/object params — their "name" isn't a real identifier.
  const named = params.filter((p) => !p.description && /^[A-Za-z_$][\w$]*$/.test(p.name));
  if (named.length === 0) return;
  for (const para of paragraphs) {
    for (const raw of para.split(/(?<=[.!?])\s+/)) {
      const sentence = raw.trim();
      if (/^(returns?|resolves?|yields?)\b/i.test(sentence)) continue;
      // Skip option-table lead-ins ("opts takes the following options:").
      if (/the following/i.test(sentence)) continue;
      for (const p of named) {
        if (p.description) continue;
        const name = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // `<param>` (optionally after If/When/The, optionally backticked) leads
        // the sentence; the remainder must open with a descriptive verb.
        const lead = sentence.match(new RegExp(`^(?:if|when|the)?\\s*\`?${name}\`?\\s+(.*)`, 'is'));
        if (lead && PARAM_SUBJECT_VERB.test(lead[1])) {
          // These READMEs run sentences together (no period before the next
          // param's lead-in), so a naive grab bleeds "<this> … <next> can
          // include:" into one. Truncate before another param's clause or an
          // options lead-in.
          let desc = sentence;
          for (const other of named) {
            if (other === p) continue;
            const oname = other.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const i = desc.search(new RegExp(`\\s\`?${oname}\`?[\\s.]`, 'i'));
            if (i > 0) desc = desc.slice(0, i);
          }
          const li = desc.search(/\s+(can include\b|includes?:|are the following\b)/i);
          if (li > 0) desc = desc.slice(0, li);
          p.description = desc.replace(/[\s:,;-]+$/, '').trim();
          break;
        }
      }
    }
  }
}

export function extractReadme(readme: string): ReadmeEntry[] {
  const tree = fromMarkdown(readme);
  const nodes = tree.children;
  const entries: ReadmeEntry[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const sig = signatureFromHeading(nodes[i]);
    if (!sig) continue;
    const event = eventName(sig);
    // Events all bind to the `on` method; the event name carries their identity.
    const name = event ? 'on' : primaryName(sig);
    if (!name) continue;

    const depth = (nodes[i] as any).depth;
    const params = paramsFromSignature(sig);
    const examples: string[] = [];
    const paragraphs: string[] = [];
    let description: string | undefined;
    let returns: string | undefined;

    // Walk the body until the next heading of same-or-shallower depth.
    for (let j = i + 1; j < nodes.length; j++) {
      const node: any = nodes[j];
      if (node.type === 'heading' && node.depth <= depth) break;

      if (node.type === 'paragraph') {
        const text = toRichText(node).trim().replace(/\s+/g, ' ');
        paragraphs.push(text);
        // A leading "Returns/Resolves/Yields …" sentence documents the return.
        // Take only that sentence so trailing param/behaviour prose isn't dragged
        // into the return, and remains available for description/param extraction.
        if (!returns && /^(returns?|resolves?|yields?)\b/i.test(text)) {
          returns = text.split(/(?<=[.!?])\s+/)[0];
        } else if (!description && text) {
          description = text;
        }
      } else if (node.type === 'code') {
        examples.push(node.value);
      } else if (node.type === 'list') {
        for (const item of node.children) {
          const p = paramFromListItem(item);
          if (!p) continue;
          const existing = params.find((x) => x.name === p.name);
          if (existing) existing.description = p.description;
          else params.push({ ...p, optional: true });
        }
      }
    }

    // These READMEs usually describe params in prose ("If `bg` is set to…")
    // rather than bullet lists; recover those into structured param descriptions.
    assignParamDescriptions(params, paragraphs);

    entries.push({
      name,
      ...(event ? { event } : {}),
      receiver: name === 'constructor' ? null : receiverOf(sig, name),
      signature: sig,
      description,
      returns,
      params,
      options: parseOptionsFence(examples),
      examples,
    });
  }

  return entries;
}
