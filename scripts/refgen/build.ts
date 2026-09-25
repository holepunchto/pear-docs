// scripts/refgen/build.ts
//
// Stage 2c — merge AST ground truth with README semantics into the ApiModel.
//
// Rule: the AST is authoritative for which methods exist, their arity and
// async-ness; the README supplies signatures, descriptions, parameter docs,
// returns and examples. Symbols seen in only one source are still emitted, tagged
// via `source`, so score.ts can report drift.

import type { ApiModel, RefClass, RefMethod, RefParam, RefSection, MethodKind } from './model';
import type { AstResult, AstClass, AstMethod } from './extract-ast';
import type { ReadmeEntry, ReadmeSection } from './extract-readme';
import { eventName } from './extract-readme';
import { githubBlobUrl, type RepoConfig } from './repos';

function astParamsToRef(m: AstMethod): RefParam[] {
  return m.params.map((p) => ({ name: p.name, optional: p.optional, default: p.default }));
}

/**
 * Overlay JSDoc `@param` type + description onto params by name. Structural
 * fields (name/optional/default) stay as-is; the JSDoc type always fills in
 * (the README never carries types) and the description fills in only where one
 * isn't already present.
 */
function overlayJsDocParams(
  params: RefParam[],
  jsdoc: { name: string; type?: string; description?: string }[]
): RefParam[] {
  const byName = new Map(jsdoc.map((p) => [p.name, p]));
  return params.map((p) => {
    const j = byName.get(p.name);
    if (!j) return p;
    return {
      ...p,
      type: p.type ?? j.type,
      description: p.description ?? (j.description || undefined),
    };
  });
}

function reconstructSignature(className: string, m: AstMethod, receiver: string | null): string {
  const args = m.params
    .map((p) => (p.default ? `${p.name} = ${p.default}` : p.optional ? `[${p.name}]` : p.name))
    .join(', ');
  if (m.kind === 'constructor') return `new ${className}(${args})`;
  // Static members are called on the class; instance members on the receiver the
  // README uses (e.g. `base`), falling back to the lowercased class name.
  const recv = m.static ? className : (receiver ?? className.charAt(0).toLowerCase() + className.slice(1));
  // Events: `recv.on('name', arg1, arg2)` (listener args), or a plain listener.
  if (m.kind === 'event' && m.event) {
    const listenerArgs = m.params.length ? m.params.map((p) => p.name).join(', ') : 'listener';
    return `${recv}.on('${m.event}', ${listenerArgs})`;
  }
  // Getters/setters/fields are property accesses, not calls.
  if (m.kind === 'getter' || m.kind === 'setter' || m.kind === 'property') return `${recv}.${m.name}`;
  const call = `${recv}.${m.name}(${args})`;
  return m.async ? `await ${call}` : call;
}

/**
 * Ensure an async member's signature carries `await`. Only ADDS it (AST async
 * detection has false negatives — e.g. `hash`/`pause` read as sync but the README
 * awaits them), so a sync member documented with `await` is never stripped.
 */
function ensureAwait(signature: string, async: boolean): string {
  if (!async || /\bawait\b/.test(signature) || !signature.includes('(')) return signature;
  const assign = signature.match(/^((?:const|let|var)\s+.+?=\s*)(.*)$/);
  return assign ? `${assign[1]}await ${assign[2]}` : `await ${signature}`;
}

/** README-only symbol is static when its signature calls on a Capitalized name. */
function staticFromSignature(signature: string, className: string): boolean {
  return new RegExp(`\\b${className}\\.`).test(signature);
}

function eventKind(signature: string): MethodKind | null {
  return eventName(signature) ? 'event' : null;
}

// Identity for merge/dedup: static-ness + name, plus the event name so the nine
// `core.on('…')` events stay distinct symbols instead of colliding on `on`.
const mapKey = (name: string, isStatic: boolean, event?: string) =>
  `${isStatic ? 'S' : 'I'}:${name}${event ? `:${event}` : ''}`;

/** Merge one AST class with the README entries assigned to it. */
function buildClassMethods(
  astClass: AstClass,
  entries: ReadmeEntry[],
  className: string,
  receiver: string | null,
  cfg: RepoConfig,
  tag: string
): RefMethod[] {
  const readmeStatic = (e: ReadmeEntry) => staticFromSignature(e.signature, className);

  // A README entry documents a different symbol than an AST member of the same
  // bare name when its own receiver disagrees with this class's receiver — e.g.
  // compact-encoding's per-encoder contract method `enc.encode(state, val)`
  // (## Encoder API) has nothing to do with the AST's top-level namespace helper
  // `cenc.encode(enc, val)` (## Helpers) even though both are named "encode".
  // Only compare when both sides have an opinion and the entry isn't a static
  // call (`ClassName.member`, a different receiver shape entirely).
  const receiverConflicts = (e: ReadmeEntry) =>
    !!e.receiver && !!receiver && !readmeStatic(e) && e.receiver !== receiver;

  // Key on name AND static-ness so a `static key(manifest)` and an instance
  // `get key()` match their respective README entries instead of colliding.
  // Entries that conflict on receiver are excluded here (tracked in
  // `conflictKeys` instead) so they never get merged onto an unrelated AST
  // member — they surface as their own README-only entry in step 2.
  const readmeByKey = new Map<string, ReadmeEntry>();
  const conflictKeys = new Set<string>();
  for (const e of entries) {
    const k = mapKey(e.name, readmeStatic(e), e.event);
    if (receiverConflicts(e)) {
      if (!readmeByKey.has(k)) conflictKeys.add(k);
      continue;
    }
    if (!readmeByKey.has(k)) readmeByKey.set(k, e);
  }

  const methods: RefMethod[] = [];
  const usedReadme = new Set<string>();

  // 1) Every AST member, enriched with README prose where available. AST events
  // (from `this.emit('…')`) carry an event name and merge with the README event
  // of the same name when one exists.
  for (const m of astClass.methods) {
    const k = mapKey(m.name, m.static, m.event);
    const doc = readmeByKey.get(k);
    if (doc) usedReadme.add(k);
    // This AST member has no real doc, and the only README entry sharing its
    // bare key documents an unrelated receiver (see `conflictKeys` above) — drop
    // the AST-only version so it doesn't shadow the correctly-documented entry
    // step 2 adds under the same key.
    if (!doc && conflictKeys.has(k)) continue;

    // JSDoc fills facts the README is silent on. Param TYPES always come from
    // JSDoc (the README has none); descriptions/returns/examples fill gaps.
    const jsdoc = m.jsdoc;
    let params: RefParam[] = doc?.params.length ? mergeParams(astParamsToRef(m), doc.params) : astParamsToRef(m);
    if (jsdoc?.params.length) params = overlayJsDocParams(params, jsdoc.params);

    const returns = doc?.returns ?? jsdoc?.returns;
    const returnType = jsdoc?.returnType;
    const description = doc?.description ?? jsdoc?.description;
    const examples = doc?.examples?.length ? doc.examples : (jsdoc?.examples ?? []);
    // `@throws` only comes from JSDoc — the README has no structured equivalent.
    const throws = jsdoc?.throws ?? [];
    // Record jsdoc in `source` only when it actually supplied something the
    // README didn't — so drift/provenance tooling sees where facts came from.
    const usedJsDoc =
      !!jsdoc &&
      ((!doc?.description && !!jsdoc.description) ||
        (!doc?.returns && !!jsdoc.returns) ||
        !!jsdoc.returnType ||
        !!jsdoc.throws.length ||
        (!doc?.examples?.length && !!jsdoc.examples.length) ||
        jsdoc.params.some((p) => p.type || p.description));
    const source: ('ast' | 'readme' | 'jsdoc')[] = ['ast'];
    if (doc) source.push('readme');
    if (usedJsDoc) source.push('jsdoc');

    methods.push({
      name: m.name,
      ...(m.event ? { event: m.event } : {}),
      // A README signature that isn't call-shaped (no `(` at all — e.g. a bare
      // `state` heading documenting an object's shape rather than a function
      // call) is less informative as a heading than the AST's reconstructed
      // call signature, even though its prose/params are the right content to
      // merge. Prefer the reconstruction for display in that case only.
      signature: ensureAwait(
        doc?.signature?.includes('(') ? doc.signature : reconstructSignature(className, m, receiver),
        m.async
      ),
      kind: m.kind,
      static: m.static,
      async: m.async,
      params,
      returns,
      ...(returnType ? { returnType } : {}),
      description,
      ...(throws.length ? { throws } : {}),
      ...(doc?.options?.length ? { options: doc.options } : {}),
      examples,
      // Inherited members live in the base package, not this repo — no link.
      ...(m.inherited ? {} : { sourceLink: githubBlobUrl(cfg, tag, m.file, m.line) }),
      source,
    });
  }

  // 2) README-only symbols (events, getters or helpers the AST walk missed).
  for (const e of entries) {
    const isStatic = readmeStatic(e);
    const k = mapKey(e.name, isStatic, e.event);
    if (usedReadme.has(k)) continue;
    // Dedup on full identity (incl. event name) so the nine events all survive.
    if (methods.some((x) => x.name === e.name && x.static === isStatic && x.event === e.event)) continue;
    methods.push({
      name: e.name,
      ...(e.event ? { event: e.event } : {}),
      signature: e.signature,
      kind: eventKind(e.signature) ?? 'method',
      static: isStatic,
      async: /^await\b/.test(e.signature),
      params: e.params.map((p) => ({
        name: p.name,
        optional: p.optional,
        default: p.default,
        description: p.description,
      })),
      returns: e.returns,
      description: e.description,
      ...(e.options.length ? { options: e.options } : {}),
      examples: e.examples,
      source: ['readme'],
    });
  }

  return methods;
}

export function buildModel(opts: {
  slug: string;
  cfg: RepoConfig;
  tag: string;
  sha: string;
  description?: string;
  ast: AstResult;
  readme: ReadmeEntry[];
  sections: ReadmeSection[];
}): ApiModel {
  const { slug, cfg, tag, sha, description, ast, readme, sections } = opts;

  const astClasses: AstClass[] = ast.classes.length ? ast.classes : [{ name: null, methods: [], main: true }];
  const mainAst = astClasses.find((c) => c.main) ?? astClasses[0];
  const mainIdx = astClasses.indexOf(mainAst);

  // Main class display name, even when the export shape was unusual.
  const ctorName = readme
    .find((e) => /\bnew\s+([A-Za-z_$][\w$]*)/.test(e.signature))
    ?.signature.match(/\bnew\s+([A-Za-z_$][\w$]*)/)?.[1];
  const classNameOf = (c: AstClass) => (c.main ? (c.name ?? ctorName ?? slug) : (c.name ?? 'Object'));

  // Infer each class's receiver (e.g. `channel`) by majority vote over README
  // entries whose member name belongs to that class, then route entries to the
  // class they belong to. Disambiguates same-named members across classes
  // (e.g. `channel.close()` vs `mux.opened()`).
  const receiverToClass = new Map<string, number>();
  const classReceiver: (string | null)[] = astClasses.map(() => null);
  astClasses.forEach((c, i) => {
    const names = new Set(c.methods.map((m) => m.name));
    const votes = new Map<string, number>();
    for (const e of readme) {
      if (e.receiver && names.has(e.name)) votes.set(e.receiver, (votes.get(e.receiver) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestN = 0;
    for (const [r, n] of votes) if (n > bestN) ((best = r), (bestN = n));
    classReceiver[i] = best;
    if (best && !receiverToClass.has(best)) receiverToClass.set(best, i);
  });

  // A configured receiver wins over the README vote for the main class. Used by
  // module-of-functions packages whose namespace alias isn't derivable from the
  // source (e.g. compact-encoding's `cenc`); see RepoConfig.receiver. Only the
  // reconstruct fallback is affected — README-sourced signatures stay verbatim.
  if (cfg.receiver) classReceiver[mainIdx] = cfg.receiver;

  // A sub-object class must not share the main class's receiver. That happens
  // when its method names overlap the main API (e.g. hyperbee's `Batch.put` vs
  // `db.put`), polluting the vote toward the main receiver. Fall back to the
  // lowercased class name (`batch`, `watcher`, `entryWatcher`), which is how
  // these returned objects are conventionally used.
  const mainRecv = classReceiver[mainIdx];
  astClasses.forEach((c, i) => {
    if (i === mainIdx || !c.name) return;
    if (!classReceiver[i] || classReceiver[i] === mainRecv) {
      const recv = c.name.charAt(0).toLowerCase() + c.name.slice(1);
      classReceiver[i] = recv;
      if (!receiverToClass.has(recv)) receiverToClass.set(recv, i);
    }
  });

  const groups: ReadmeEntry[][] = astClasses.map(() => []);
  for (const e of readme) {
    const idx = e.receiver && receiverToClass.has(e.receiver) ? receiverToClass.get(e.receiver)! : mainIdx;
    groups[idx].push(e);
  }

  const refClasses: RefClass[] = astClasses
    .map((c, i) => ({ name: classNameOf(c), methods: buildClassMethods(c, groups[i], classNameOf(c), classReceiver[i], cfg, tag) }))
    // Keep the main class always; drop sub-object classes that resolved empty.
    .filter((rc, i) => astClasses[i].main || rc.methods.length > 0);

  const refSections: RefSection[] = sections.map((s) => ({ title: s.title, markdown: s.markdown }));
  const typedefs = (ast.typedefs ?? []).map((t) => ({
    name: t.name,
    ...(t.description ? { description: t.description } : {}),
    properties: t.properties.map((p) => ({
      name: p.name,
      optional: p.optional,
      ...(p.default ? { default: p.default } : {}),
      ...(p.type ? { type: p.type } : {}),
      ...(p.description ? { description: p.description } : {}),
    })),
  }));
  return {
    slug,
    repo: { org: cfg.org, repo: cfg.repo },
    ...(description ? { description } : {}),
    tag,
    sha,
    generatedAt: new Date().toISOString(),
    sections: refSections,
    classes: refClasses,
    ...(typedefs.length ? { typedefs } : {}),
  };
}

/** Keep AST arity/order; overlay README descriptions and optional defaults. */
function mergeParams(astParams: RefParam[], docParams: { name: string; optional: boolean; default?: string; description?: string }[]): RefParam[] {
  const byName = new Map(docParams.map((p) => [p.name.replace(/[`\[\]]/g, ''), p]));
  return astParams.map((p, i) => {
    const doc = byName.get(p.name) ?? docParams[i];
    return {
      name: p.name,
      optional: p.optional || !!doc?.optional,
      default: p.default ?? doc?.default,
      description: doc?.description,
    };
  });
}
