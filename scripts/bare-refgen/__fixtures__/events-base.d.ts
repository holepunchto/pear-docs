// Sibling-package stand-in (bare-stream-like) for the events.d.ts fixture:
// a base events interface that a dependent extends.
export interface StreamEvents {
  close: []
  error: [err: Error]
}
