import { defaultHandlers, type Handle, type Options, type State } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { mdxToMarkdown } from 'mdast-util-mdx';

type Peek = (node: never, parent: never, state: State) => string;
type Peekable = Handle & { peek?: Peek };

const flatten = (extension: Options): Options[] => [extension, ...(extension.extensions ?? []).flatMap(flatten)];

// The handler tables the pipeline serializes with: core, plus the mdx and gfm extensions.
const TABLES = [
  defaultHandlers as Record<string, Peekable>,
  ...[mdxToMarkdown(), gfmToMarkdown()].flatMap(flatten).map((e) => (e.handlers ?? {}) as Record<string, Peekable>),
];

// fumadocs-mdx 14.2.14+ drops `peek` when it wraps handlers; without it `*` and `` ` `` get entity-encoded.
const PEEK: Record<string, Peek> = {
  ...Object.fromEntries(
    TABLES.flatMap((handlers) =>
      Object.entries(handlers).flatMap(([type, handle]) => (handle.peek ? [[type, handle.peek]] : [])),
    ),
  ),
  mdxTextExpression: () => '{',
};

const restored = new WeakSet<State>();

/** `stringify` hook for `includeProcessedMarkdown`: puts `peek` back, then defers. */
export function restoreMarkdownPeek(_node: unknown, _parent: unknown, state: State): undefined {
  if (restored.has(state)) return;
  restored.add(state);
  const handlers = state.handlers as Record<string, Peekable | undefined>;
  for (const [type, peek] of Object.entries(PEEK)) {
    const handle = handlers[type];
    if (handle && !handle.peek) handle.peek = peek;
  }
}
