import type { Layout } from '../layout';

const layout: Layout = {
  groups: [],
  seeAlso: [
    "It's a native addon and requires Bare `>=1.7.0`; it's available on desktop (Windows, macOS, Linux).",
  ],
  describe: {
    'SpawnOptions.shell':
      "A shell path, or `true` to use the platform default (`/bin/sh`, `/system/bin/sh` on Android, or `cmd.exe` on Windows).",
    'SpawnOptions.stdio':
      "Per-stream stdio configuration. `'pipe'` creates a pipe; `'overlapped'` is like `'pipe'` but opens the pipe in Windows overlapped mode; `'ignore'`/`'inherit'`/`'ipc'` behave as their names suggest. At most one slot may be `'ipc'`.",
    'SpawnOptions.serialization':
      "The IPC message serialization mode. `'json'` sends `JSON.stringify`-encoded, newline-delimited messages. `'advanced'` is length-prefixed structured clone via `bare-structured-clone`, supporting `Date`, `Map`, `Buffer`, etc. `'binary'` is an unframed raw pipe — no message boundaries.",
    'SpawnSyncOptions.input': "Written to the child's `stdin` before it starts.",
    'SpawnSyncOptions.maxBuffer': "The size of the buffer allocated to capture each `'pipe'` stdio slot.",
  },
  params: {
    spawn: {
      file: 'The executable to spawn; a string path or a `file://` URL.',
      args: 'Arguments to pass to `file`; may be `null` or omitted to spawn with none. If omitted, the second argument is treated as `opts`.',
      opts: 'Options controlling the environment, stdio, and behavior of the new subprocess; see `SpawnOptions`.',
    },
    'Subprocess.kill': {
      signum: "Signal to send, as a signal number or name (for example `'SIGTERM'`); defaults to `SIGTERM`.",
    },
    'Subprocess.send': {
      message: 'The value to send to the child over the IPC channel.',
      handle: 'A `bare-pipe` `Pipe` or `bare-tcp` `Socket` to transfer to the child along with `message`.',
      cb: 'Called with `(err)` once `message` has been written, or with an error if there is no connected IPC channel.',
    },
    'SubprocessChannel.send': {
      message: 'The value to send to the other side of the channel.',
      handle: 'A `bare-pipe` `Pipe` or `bare-tcp` `Socket` to transfer along with `message`.',
      cb: 'Called with `(err)` once `message` has been written, or with an error if the channel is disconnected.',
    },
    'SubprocessParentChannel.send': {
      message: 'The value to send to the parent process over the IPC channel.',
      handle: 'A `bare-pipe` `Pipe` or `bare-tcp` `Socket` to transfer to the parent along with `message`.',
      cb: 'Called with `(err)` once `message` has been written, or with an error if the channel is disconnected.',
    },
  },
  returns: {
    'Subprocess.send':
      '`false` if the subprocess has no IPC channel or it has disconnected (`cb`, if given, is then invoked asynchronously with an error); otherwise the underlying pipe write result.',
    'SubprocessChannel.send':
      '`false` if the channel is disconnected (`cb`, if given, is then invoked asynchronously with a `CHANNEL_DISCONNECTED` error); otherwise the underlying pipe write result.',
    'SubprocessParentChannel.send':
      '`false` if the channel is disconnected (`cb`, if given, is then invoked asynchronously with a `CHANNEL_DISCONNECTED` error); otherwise the underlying pipe write result.',
  },
  throws: {
    spawn: [
      "`UNKNOWN_SERIALIZATION_MODE` — thrown if `opts.serialization` is not `'json'`, `'advanced'`, or `'binary'`.",
      "`IPC_CHANNEL_ALREADY_DEFINED` — thrown if `opts.stdio` requests more than one `'ipc'` slot.",
    ],
    'Subprocess.kill': [
      "`UNKNOWN_SIGNAL` — thrown if `signum` is a string that isn't a recognized signal name.",
    ],
    'SubprocessParentChannel.constructor': [
      '`NO_IPC_CHANNEL` — thrown if the `BARE_CHANNEL_FD` environment variable is not set.',
      "`UNKNOWN_SERIALIZATION_MODE` — thrown if `BARE_CHANNEL_SERIALIZATION_MODE` is set to something other than `'json'` or `'advanced'`.",
    ],
  },
};

export default layout;
