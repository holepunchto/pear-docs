// An events interface extending one from another file (bare-sidecar's
// `SidecarEvents extends DuplexEvents` pattern, where DuplexEvents lives in
// bare-stream). The rendered shape must include `close`/`error` — inherited
// via `extends` — not just `exit`.
import { StreamEvents } from './events-base'

export interface ThingEvents extends StreamEvents {
  exit: [code: number]
}
