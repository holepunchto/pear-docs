// `export =` where a second class is declared in the same file but never
// exported (directly or via the namespace) — only reachable through a
// method's return type (bare-broadcast-channel's `connect(): Port<T>`).
// `Port` must still be promoted to a top-level sibling.
interface Channel<T = unknown> {
  connect(): Port<T>
}

declare class Channel<T = unknown> {
  constructor()
}

interface Port<T = unknown> {
  read(): T
}

declare class Port<T = unknown> {
  constructor(channel: Channel<T>)
}

export = Channel
