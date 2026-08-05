// scripts/bare-refgen/layouts/bare-bluetooth-android.ts
// Editorial layout for bare-bluetooth-android: param/returns prose grounded in
// the upstream README, index.js, and lib/*.{js,d.ts}. `write`'s `withResponse`
// default (`true`) is read from lib/peripheral.js; `startScan`'s `scanMode`
// from lib/central.js + the `SCAN_MODE_*` constants; the `BluetoothError`
// factory `id` argument from lib/errors.js. Errors surface via the `'error'`
// event rather than being thrown, so there are no `throws` overrides. Bare
// method names are shared across Central/Peripheral/Server, so keys are
// fully qualified.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'BluetoothError.constructor': {
      msg: 'A human-readable error message.',
      fn: 'The function to omit from the captured stack trace (default `BluetoothError`).',
      code: 'The error code; defaults to `fn.name` (for example `SCAN_FAILED`).',
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
      opts: 'Options; set `primary: true` to mark this a primary service.',
    },
    'Characteristic.constructor': {
      uuid: "The characteristic's UUID.",
      opts: 'Options selecting the characteristic `properties`, `permissions`, and initial `value`.',
    },
    'L2CAPChannel.constructor': {
      channelHandle: 'The native channel handle backing the stream; supplied internally when a channel opens, not usually passed directly.',
    },
    'Peripheral.constructor': {
      opts: 'Options carrying the `ScanResult` this peripheral is derived from.',
    },
    'Central.startScan': {
      serviceUUIDs: 'The service UUIDs to filter advertisements by; pass `null` to scan for all peripherals.',
      opts: 'Options; `scanMode` selects the Android scan mode (one of the `Central.SCAN_MODE_*` constants).',
    },
    'Central.connect': {
      peripheral: 'A discovered peripheral to connect to.',
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
      opts: 'Advertising options such as the local `name` and the `serviceUUIDs` to advertise.',
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
