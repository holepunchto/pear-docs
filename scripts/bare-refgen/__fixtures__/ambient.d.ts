// Ambient module declaration (bare-mdns-discovery-like): the file itself has no
// top-level exports; the API lives inside `declare module '<name>' { … }`.
declare module 'ambient-fixture' {
  export interface Info {
    x: number
  }

  export function ping(msg: string): Info

  export const N: 1
}
