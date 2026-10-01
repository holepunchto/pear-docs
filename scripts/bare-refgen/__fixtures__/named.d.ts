// Named exports: functions, a const, an interface, a type alias.
export function foo(a: string, b?: number): Promise<void>
export const K: 42
export interface Opts {
  x: string
  y?: number
}
export type Name = string | number
