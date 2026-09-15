// `export =` of a function merged with a namespace (structuredClone-like):
// `declare function X(...)` + `declare namespace X { export ... }`. Distinct
// from exporteq.d.ts's class+interface+namespace merge — here the base
// declaration is a *function*, and `symbolKind` prefers 'function' over
// 'namespace' in KIND_PRECEDENCE, so the namespace's exports need their own
// container-detection path (see extract.ts's `isContainer`).
declare function clone<T>(value: T): T

declare namespace clone {
  export function serialize(value: unknown): string

  export const tag: number
}

export = clone
