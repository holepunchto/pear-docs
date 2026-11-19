// Turns fumadocs' processed Markdown (mdast serialized, so MDX components survive as JSX) into plain Markdown.

const CONTAINERS = /^(Callout|Steps?|Tabs|Cards|Accordions|VersionGate)$/;
// GitHub alert kinds, which models read as callouts.
const CALLOUT_KINDS: Record<string, string> = {
  info: 'NOTE',
  warn: 'WARNING',
  warning: 'WARNING',
  tip: 'TIP',
  idea: 'TIP',
};
const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;

function decode(value: string): string {
  return value.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of source.matchAll(/([A-Za-z-]+)="([^"]*)"/g)) attrs[m[1]] = decode(m[2]);
  return attrs;
}

// Keeps the language and `title=`; drops `file=`, `skip=`, `example=`, `step=`, `lineNumbers` and `{1,3}` highlights.
function cleanFenceInfo(info: string): string {
  const [lang = ''] = info.trim().split(/\s+/);
  const title = info.match(/\btitle=("[^"]*"|\S+)/)?.[1];
  return [lang, title && `title=${title}`].filter(Boolean).join(' ');
}

function versionLabel({ since, until }: Record<string, string>): string {
  const parts = [since && `Added in ${since}`, until && `removed in ${until}`].filter(Boolean);
  return parts.length ? `*${parts.join(', ')}.*` : '';
}

// Inline JSX; runs on text with code spans masked out.
function cleanInline(text: string): string {
  return text
    .replace(/<Since\s+([^>]*?)\s*\/>/g, (_, a: string) => `(since ${parseAttrs(a).v})`)
    .replace(/<Until\s+([^>]*?)\s*\/>/g, (_, a: string) => {
      const { v, label } = parseAttrs(a);
      return `(${label ?? `until ${v}`})`;
    })
    .replace(/<Status\s+([^>]*?)\s*\/>/g, (_, a: string) => parseAttrs(a).level ?? '');
}

function cleanInlineKeepingCode(line: string): string {
  if (!line.includes('<')) return line;
  const spans: string[] = [];
  const masked = line.replace(/`[^`\n]*`/g, (m) => `@@SPAN${spans.push(m) - 1}@@`);
  return cleanInline(masked).replace(/@@SPAN(\d+)@@/g, (_, i: string) => spans[Number(i)]);
}

export function cleanProcessedMarkdown(markdown: string): string {
  const out: string[] = [];
  const stack: { name: string; quote: boolean }[] = [];
  let fence: { char: string; length: number } | null = null;
  let mermaid: string[] | null = null;

  const emit = (line: string, inCode = false) => {
    const quotes = stack.filter((s) => s.quote).length;
    const text = quotes ? `${'> '.repeat(quotes)}${line}`.trimEnd() : line;
    if (!inCode && text.trim() === '' && (out.length === 0 || out.at(-1)!.replace(/[> ]/g, '') === '')) return;
    out.push(text);
  };

  const emitMermaid = (source: string) => {
    const { chart = '' } = parseAttrs(source.replace(/^\s*<Mermaid\s*/, '').replace(/\/>\s*$/, ''));
    emit('```mermaid');
    for (const l of chart.split('\n')) emit(l, true);
    emit('```');
  };

  // Handles a component tag that sits alone on its line; false leaves the line as text.
  const handleTag = ([, closing, name, attrSource = '', selfClosing]: RegExpMatchArray): boolean => {
    const attrs = parseAttrs(attrSource);
    if (closing) {
      const at = stack.map((s) => s.name).lastIndexOf(name);
      if (at < 0) return false;
      stack.length = at;
      return true;
    }
    if (selfClosing) {
      if (name === 'Card') {
        const { title = '', href = '', description } = attrs;
        emit(`- [${title}](${href})${description ? `: ${description}` : ''}`);
      } else if (name === 'Status') {
        emit(`**Status:** ${attrs.level ?? ''}`);
      } else if (name !== 'ProductRelationship') {
        return false;
      }
      return true;
    }
    if (name === 'Tab' || name === 'Accordion') {
      stack.push({ name, quote: false });
      emit(`**${(name === 'Tab' ? attrs.value : attrs.title) ?? ''}**`);
      emit('');
    } else if (CONTAINERS.test(name)) {
      stack.push({ name, quote: name === 'Callout' });
      if (name === 'Callout') emit(`[!${CALLOUT_KINDS[attrs.type] ?? 'NOTE'}]`);
      else if (name === 'VersionGate') {
        emit(versionLabel(attrs));
        emit('');
      }
    } else {
      return false;
    }
    return true;
  };

  for (const raw of markdown.split('\n')) {
    const strip = Math.min(stack.length * 2, raw.length - raw.trimStart().length);
    const line = raw.slice(strip);
    const trimmed = line.trim();

    if (mermaid) {
      mermaid.push(raw);
      if (/\/>\s*$/.test(trimmed)) {
        emitMermaid(mermaid.join('\n'));
        mermaid = null;
      }
      continue;
    }

    if (fence) {
      emit(line, true);
      if (new RegExp(`^\\s*${fence.char}{${fence.length},}\\s*$`).test(line)) fence = null;
      continue;
    }

    const open = line.match(FENCE);
    if (open) {
      fence = { char: open[2][0], length: open[2].length };
      emit(`${open[1]}${open[2]}${cleanFenceInfo(open[3])}`);
      continue;
    }

    if (/^<Mermaid\b/.test(trimmed)) {
      if (/\/>$/.test(trimmed)) emitMermaid(line);
      else mermaid = [line];
      continue;
    }

    const tag = trimmed.match(/^<(\/)?([A-Z][A-Za-z]*)(\s[^]*?)?(\/)?>$/);
    if (tag && handleTag(tag)) continue;

    if (/^<a name="[^"]*" ?\/>$/.test(trimmed)) continue; // heading anchor
    if (trimmed === '' && stack.at(-1)?.name === 'Cards') continue;

    emit(cleanInlineKeepingCode(line));
  }

  return out.join('\n').trim();
}
