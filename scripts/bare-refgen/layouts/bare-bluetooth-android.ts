// scripts/bare-refgen/layouts/bare-bluetooth-android.ts
// Editorial layout for bare-bluetooth-android: param/returns prose grounded in
// the upstream README, index.js, and lib/*.{js,d.ts}. `write`'s `withResponse`
// default (`true`) is read from lib/peripheral.js; `startScan`'s `scanMode`
// from lib/central.js + the `SCAN_MODE_*` constants; the `BluetoothError`
// factory `id` argument from lib/errors.js. Errors surface via the `'error'`
// event rather than being thrown, so there are no `throws` overrides. Bare
// method names are shared across Central/Peripheral/Server, so keys are
// fully qualified. Prose that replaces or extends upstream TSDoc (version
// history, behaviour checked against lib/*.js) is in
// bare-bluetooth-android.patches.json, so a TSDoc change upstream fails the
// render instead of being hidden. bare-bluetooth-android.members.json carries
// what the root `.d.ts` lacks: the `NOT_CONNECTED` factory (lib/errors.js only,
// 0.11.6) and the event maps, which the package root doesn't re-export.

import type { Layout } from '../layout';

const layout: Layout = {
  // The JVM requirement is from binding.cc (bare_context_get on load); the Bare Kit version from its v2.5.0 release.
  intro:
    '[`bare-bluetooth-android`](https://github.com/holepunchto/bare-bluetooth-android) — Android Bluetooth bindings for Bare. It is a native addon that needs the app\'s Java VM, which it reads from the [`bare.android.jvm.v1`](/bare/reference/bare/embedder-context#bareandroidjvmv1) context key when it loads. So it runs only inside an app whose host publishes that key. [Bare Kit](/bare/reference/bare/bare-kit) does so from 2.5.0, so a Bare Kit worklet needs Bare Kit 2.5.0 or later.',
  seeAlso: [
    "Runs on Android only — on Apple platforms use [`bare-bluetooth-apple`](/bare/reference/bare/modules/bare-bluetooth-apple). The two share most concepts under different names: the peripheral role is `Server` here and `PeripheralManager` there, adapter states are `'on'` and `'off'` here and `'poweredOn'` and `'poweredOff'` there, and a peripheral `id` is a hardware address here and a per host UUID there. To connect without a scan, this package builds a `Peripheral` from a `Device`, such as one from `getBondedDevices()`, while that one resolves saved ids with `retrievePeripherals()`.",
    '[`bare-bluetooth`](/bare/reference/bare/modules/bare-bluetooth) — the cross-platform API over this module, `bare-bluetooth-apple` and `bare-bluetooth-linux`.',
    '[One core, many platforms](/bare/explanation/bare-on-native) — using platform bindings from a native shell.',
    '[Connect over Bluetooth](/bare/how-to/connect-over-bluetooth) — how-to guides for scanning, GATT, L2CAP and mobile setup.',
    '[Use platform-specific Bluetooth features](/bare/how-to/connect-over-bluetooth/use-platform-specific-bluetooth-features) — when to use this module directly instead of `bare-bluetooth`.',
  ],
  // 0.11.6 throws NOT_CONNECTED from the Peripheral calls (lib/peripheral.js _assertConnected); the README's Errors section predates it.
  patch: [
    {
      in: 'Errors',
      from: 'Wrap the call in `try`/`catch`.',
      to: "Wrap the call in `try`/`catch`. As of v0.11.6, the `Peripheral` methods that talk to the device (`discoverServices()`, `discoverCharacteristics()`, `read()`, `write()`, `subscribe()`, `unsubscribe()`, `openL2CAPChannel()` and `requestMtu()`) also throw a `BluetoothError` with code `NOT_CONNECTED` before `'connect'` and once the link is gone.",
    },
  ],
  params: {
    'BluetoothError.constructor': {
      msg: 'A human-readable error message.',
      fn: 'The function to omit from the captured stack trace (default `BluetoothError`).',
      code: 'The error code; defaults to `fn.name` (for example `SCAN_FAILED`).',
    },
    'BluetoothError.ADAPTER_UNAVAILABLE': {
      msg: 'A human-readable error message.',
    },
    'BluetoothError.CONNECTION_FAILED': {
      msg: 'A human-readable error message.',
      id: 'The id of the peripheral the connection attempt targeted.',
    },
    'BluetoothError.DISCONNECT': {
      msg: 'A human-readable error message.',
      id: 'The id of the peripheral that disconnected.',
    },
    'Service.constructor': {
      uuid: "The service's UUID.",
      characteristics: 'The characteristics belonging to the service.',
      opts: 'Options; services are primary unless `primary: false` is set.',
    },
    'Characteristic.constructor': {
      uuid: "The characteristic's UUID.",
      opts: 'Options selecting the characteristic `properties`, `permissions`, and initial `value`.',
    },
    'L2CAPChannel.constructor': {
      channelHandle: 'The native channel handle backing the stream; supplied internally when a channel opens, not usually passed directly.',
    },
    'Peripheral.constructor': {
      opts: 'Options carrying the `ScanResult` or the `Device` this peripheral is derived from.',
    },
    'Central.startScan': {
      serviceUUIDs: 'The service UUIDs to filter advertisements by; pass `null` to scan for all peripherals.',
      opts: 'Options; `scanMode` selects the Android scan mode (one of the `Central.SCAN_MODE_*` constants).',
    },
    'Central.connect': {
      peripheral: 'A discovered peripheral, or one built from a `Device`, to connect to.',
    },
    'Central.disconnect': {
      peripheral: 'The connected peripheral to disconnect from.',
    },
    'Peripheral.discoverCharacteristics': {
      service: 'The service to discover characteristics on.',
    },
    'Peripheral.read': {
      characteristic: 'The characteristic to read.',
    },
    'Peripheral.write': {
      characteristic: 'The characteristic to write to.',
      data: 'The bytes to write.',
      withResponse: 'Whether a write confirmation is requested (default `true`).',
    },
    'Peripheral.subscribe': {
      characteristic: 'The characteristic to start receiving notifications for.',
    },
    'Peripheral.unsubscribe': {
      characteristic: 'The characteristic to stop receiving notifications for.',
    },
    'Peripheral.openL2CAPChannel': {
      psm: 'The PSM (Protocol/Service Multiplexer) of the channel to open.',
    },
    'Peripheral.requestMtu': {
      mtu: 'The desired ATT MTU size, in bytes.',
    },
    'Server.addService': {
      service: 'The `Service` to register with the GATT server.',
    },
    'Server.startAdvertising': {
      opts: "Advertising options. `serviceUUIDs` lists the service UUIDs to advertise. When `name` is set, the adapter's own device name is included in the advertisement; only the presence of the option is used, not the string itself. On Apple platforms `name` is advertised as the local name.",
    },
    'Server.respondToRequest': {
      request: 'The read or write request to respond to.',
      result: 'The ATT result code; use the `Server.ATT_*` constants.',
      data: 'The value to return for a read request; omit for write responses.',
    },
    'Server.updateValue': {
      characteristic: 'The characteristic whose value changed.',
      data: 'The new value to send to subscribed clients.',
    },
    'Server.publishChannel': {
      opts: 'Options for the L2CAP channel to publish.',
    },
    'Server.unpublishChannel': {
      psm: 'The PSM of the channel to unpublish, as assigned when it was published.',
    },
  },
  returns: {
    'Server.updateValue': 'Whether the notification was sent to subscribed clients successfully.',
  },
};

export default layout;
