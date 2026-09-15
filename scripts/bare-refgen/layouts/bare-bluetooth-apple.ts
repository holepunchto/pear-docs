// scripts/bare-refgen/layouts/bare-bluetooth-apple.ts
// Editorial layout for bare-bluetooth-apple: param/returns prose grounded in
// the upstream README, index.js, and lib/*.{js,d.ts}. `write`'s `withResponse`
// default (`true`) is read from lib/peripheral.js; option shapes from the lib
// `.d.ts` interfaces. Errors surface via the `'error'` event rather than being
// thrown, so there are no `throws` overrides. Bare method names are shared
// across Central/Peripheral/PeripheralManager, so keys are fully qualified.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    'Runs on Apple platforms (iOS and macOS) — on Android use [`bare-bluetooth-android`](/reference/bare/modules/bare-bluetooth-android).',
    '[One core, many platforms](/explanation/bare-on-native) — using platform bindings from a native shell.',
  ],
  params: {
    'Service.constructor': {
      uuid: "The service's UUID.",
      characteristics: 'The characteristics belonging to the service.',
      opts: 'Options; set `primary: true` to mark this a primary service.',
    },
    'Characteristic.constructor': {
      uuid: "The characteristic's UUID.",
      opts: 'Options selecting the characteristic `properties` (`read`, `write`, `writeWithoutResponse`, `notify`, `indicate`) and its optional `permissions` and initial `value`.',
    },
    'L2CAPChannel.constructor': {
      channelHandle: 'The native channel handle backing the stream; supplied internally when a channel opens, not usually passed directly.',
    },
    'Peripheral.constructor': {
      peripheralHandle: "The native peripheral handle; supplied internally when Central emits `'connect'`, not usually passed directly.",
      opts: "Options carrying the peripheral's advertised metadata.",
    },
    'Central.startScan': {
      serviceUUIDs: 'The service UUIDs to filter advertisements by; omit to discover all peripherals.',
    },
    'Central.connect': {
      peripheral: 'A discovered peripheral to connect to.',
    },
    'Central.disconnect': {
      peripheral: 'The connected peripheral to disconnect from.',
    },
    'Peripheral.discoverServices': {
      serviceUUIDs: 'The service UUIDs to discover; omit to discover all services.',
    },
    'Peripheral.discoverCharacteristics': {
      service: 'The service to discover characteristics on.',
      characteristicUUIDs: 'The characteristic UUIDs to discover; omit to discover all characteristics of the service.',
    },
    'Peripheral.read': {
      characteristic: 'The characteristic to read.',
    },
    'Peripheral.write': {
      characteristic: 'The characteristic to write to.',
      data: 'The bytes to write.',
      withResponse: 'Whether the peripheral confirms the write (default `true`).',
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
    'PeripheralManager.addService': {
      service: 'The `Service` to register with the system, along with its characteristics.',
    },
    'PeripheralManager.startAdvertising': {
      opts: 'Advertising options such as the local `name` and the `serviceUUIDs` to advertise.',
    },
    'PeripheralManager.respondToRequest': {
      request: "The read or write request to respond to, as delivered by the `'readRequest'`/`'writeRequest'` event.",
      result: 'The ATT result code, for example `PeripheralManager.ATT_SUCCESS`.',
      data: 'The value to return for a read request; omit for write responses.',
    },
    'PeripheralManager.updateValue': {
      characteristic: 'The characteristic whose value changed.',
      data: 'The new value to send to subscribed centrals.',
    },
    'PeripheralManager.publishChannel': {
      opts: 'Options for the L2CAP channel to publish.',
    },
    'PeripheralManager.unpublishChannel': {
      psm: 'The PSM of the channel to unpublish, as assigned when it was published.',
    },
  },
  returns: {
    'PeripheralManager.updateValue': 'Whether the notification was sent to subscribed centrals successfully.',
  },
};

export default layout;
