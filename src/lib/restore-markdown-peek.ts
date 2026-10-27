import { defaultHandlers, type Handle, type State } from 'mdast-util-to-markdown';

type Peek = (node: never, parent: never, state: State) => string;
type Peekable = Handle & { peek?: Peek };

// fumadocs-mdx 14.2.14+ drops `peek` when it wraps handlers; without it `*` and `` ` `` get entity-encoded.
const PEEK: Record<string, Peek> = {
  ...Object.fromEntries(
    Object.entries(defaultHandlers as Record<string, Peekable>).flatMap(([type, handle]) =>
      handle.peek ? [[type, handle.peek]] : [],
    ),
  ),
  delete: () => '~',
  footnoteReference: () => '[',
  mdxJsxTextElement: () => '<',
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
