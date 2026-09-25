// A thin, property-only class (error-shape) that should render as a code block,
// not expand into per-member `####` entries.
export class Err extends Error {
  readonly code: string
}
