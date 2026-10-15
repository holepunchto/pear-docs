// Links the native addons loaded by the worklets into react-native-bare-kit's
// addon directories, which its native projects already pick up.
import link from 'bare-link'

const worklets = [
  'bare/bluetooth.js',
  'bare/checksum.js',
  'bare/hypercore/hypercore.mjs',
  'bare/hyperdb/hyperdb.mjs',
  'bare/ipc.js',
  'bare/os.js',
  'bare/rocksdb/index.mjs',
  'bare/udx.js',
  'bare/videocapture.js',
  'bare/videoconverter.js'
]

const out = {
  ios: 'node_modules/react-native-bare-kit/ios/addons',
  android: 'node_modules/react-native-bare-kit/android/src/main/addons'
}

const preset = process.argv[2]

if (preset in out === false) {
  throw new Error(`Usage: node scripts/link.mjs <${Object.keys(out).join('|')}>`)
}

for await (const _ of link(worklets, { preset, out: out[preset] })) {
  // Nothing to do; the generator does the linking.
}
