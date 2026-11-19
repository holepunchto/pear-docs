// `export =` whose namespace re-exports a distinct sibling class, plus generics
// (bare-stream-like). The generic `M` must not leak as a member; `Sub` must be
// promoted to a top-level export; `helper` stays a static of `Base`.
declare class Base<M = unknown> {
  destroy(): void
}

declare class Sub<M = unknown> extends Base<M> {
  read(): void
}

declare namespace Base {
  export function helper(x: Base): boolean
  export { Base, Sub }
}

export = Base
