// scripts/bare-refgen/layouts/bare-bluetooth-linux.ts
// Editorial layout for bare-bluetooth-linux: the lead paragraph comes from the upstream README; the API prose is the .d.ts TSDoc.

import type { Layout } from '../layout';

const layout: Layout = {
  intro:
    "[`bare-bluetooth-linux`](https://github.com/holepunchto/bare-bluetooth-linux) — BlueZ bindings for Bare. Provides central and peripheral roles, GATT services and characteristics, and L2CAP channels on Linux. It is a native addon that talks to the BlueZ daemon (`bluetoothd`) over D-Bus, so `bluetoothd` must be running and the adapter powered on. Upstream marks it experimental: its API is subject to change and may break at any time.",
  seeAlso: [
    '[`bare-bluetooth`](/bare/reference/bare/modules/bare-bluetooth) — the cross-platform API, which wraps this module on Linux.',
    '[`bare-bluetooth-apple`](/bare/reference/bare/modules/bare-bluetooth-apple) and [`bare-bluetooth-android`](/bare/reference/bare/modules/bare-bluetooth-android) — the same for Apple platforms and Android.',
  ],
};

export default layout;
