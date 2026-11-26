// `export =` with interface + class + namespace declaration merging (URL-like).
interface Thing {
  value: string
  toString(): string
}

declare class Thing {
  constructor(input: string)
}

declare namespace Thing {
  export function parse(input: string): Thing | null
  export { Thing }
}

export = Thing
