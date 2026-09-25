// A non-exported base interface extended by exported ones (bare-timers'
// `Task`/`Timeout`/`Immediate` shape). The base's members must flatten into
// each subtype's individually-documented members, not just into the
// subtype's shape-block signature text — `interfaceShapeText` already
// handled the latter; `collectMembers`, which produces per-member docs for
// container types, did not.
interface Task {
  ref(): this
  unref(): this
  hasRef(): boolean
}

export interface Timeout extends Task {
  refresh(): this
}

export interface Immediate extends Task {}
