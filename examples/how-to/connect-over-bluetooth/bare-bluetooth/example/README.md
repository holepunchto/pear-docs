# Examples

Run with [Bare](https://github.com/holepunchto/bare). Bluetooth must be powered on; on Linux that is `bluetoothctl power on`.

## scan.js

Scans for 10 seconds and prints what it sees. The quickest way to tell whether a backend is wired up at all.

```
bare example/scan.js
```

## l2cappong.js

Two machines bouncing a message over an L2CAP channel, one second apart. Exercises advertising, scanning, connecting and duplex streaming in one go.

The listener advertises itself and prints the PSM its channel landed on. Neither CoreBluetooth nor BlueZ lets you pick that number, so it has to reach the other side by hand.

```
bare example/l2cappong.js listen
```

```
bare example/l2cappong.js connect <psm>
```

Runs on every platform.

## gattpong.js

The same rally over GATT instead of L2CAP. The listener publishes one characteristic that can be written and subscribed to; the other side scans, connects, subscribes, writes "ping" and gets "pong" back as a notification, one second apart. No PSM to carry across this time: the service UUID is enough to find each other.

```
bare example/gattpong.js listen
```

```
bare example/gattpong.js connect
```
