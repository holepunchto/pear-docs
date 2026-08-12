# Confirmed content regressions: published (old) vs PR #326-generated (new) bare module pages

Generated 85 confirmed findings across 28 modules via a two-pass 
workflow (compare, then independent adversarial verify against the actual current page content).
100% of the 85 compare-phase flags were confirmed real on verify (0 false positives).

Each item: a fact/example/class/event present in the OLD `published` page for that module,
confirmed absent from the NEW page (content/reference/bare/modules/<name>.mdx) as of PR #344.

## bare-apk (3)

- **createAppBundle's options (targetSDK, include, resources) with descriptions were documented**
  - Old page quote: "// Additional files and directories to include in uncompressed format"
- **createAPKSet's options (universal, archive, sign, keystore, keystoreKey, keystorePassword) were documented**
  - Old page quote: "universal: false,   archive: true,   sign: false,   keystore,   keystoreKey,   keystorePassword"
- **The `constants` table listed and described ANDROID_HOME, DEFAULT_MINIMUM_SDK, and DEFAULT_TARGET_SDK**
  - Old page quote: "| `ANDROID_HOME`        | The Android SDK root directory.            |"

## bare-atomics (2)

- **Condition.wait() takes a required `mutex` argument and an optional `timeout`**
  - Old page quote: "const success = condition.wait(mutex[, timeout])"
- **bare-channel and bare-broadcast-channel are cross-referenced as higher-level message-passing alternatives built on these primitives**
  - Old page quote: "[`bare-channel`](/reference/bare/modules/bare-channel) and [`bare-broadcast-channel`](/reference/bare/modules/bare-broadcast-channel)—higher-level message passing between threads."

## bare-broadcast-channel (3)

- **A connected Port exposes write/writeSync, read/readSync, createReadStream/createWriteStream/createStream, peers, ref()/unref(), and close(), and emits 'peers' and 'close' events.**
  - Old page quote: "#### `await port.write(value)` · `port.writeSync(value)`  Broadcast a structured-cloneable `value` to peers; returns whether the write flushed.  ### `const value = await port.read()` · `port.readSync()`  Read the next broadcast value.  #### `port.createReadStream([options])` · `port.createWriteStrea…"
- **The module builds on bare-events, bare-stream, and bare-structured-clone.**
  - Old page quote: "Builds on `bare-events`, [`bare-stream`](/reference/bare/modules/bare-stream), and `bare-structured-clone` (see [Bare modules](/reference/modules/bare-modules))."
- **bare-channel is the point-to-point counterpart to this broadcast (multi-producer/multi-consumer) channel.**
  - Old page quote: "[`bare-channel`](/reference/modules/bare-modules)—point-to-point inter-thread messaging."

## bare-channel (3)

- **Channel constructor options (`handle` to rewire to an existing channel, `interfaces` for structured-clone constructors) were documented with an options code block and explanatory prose**
  - Old page quote: "`handle` is an existing `SharedArrayBuffer` returned by `channel.handle` on another thread. When provided, the new channel is wired up to the same underlying channel. If omitted, a fresh channel is created."
- **`channel.interfaces` was documented as its own property (the array of constructors passed to the constructor)**
  - Old page quote: "The array of constructors passed to the constructor."
- **A channel supports exactly two connected ports, with writes on one appearing in the other's read queue**
  - Old page quote: "A channel supports exactly two connected ports; messages written on one port appear in the read queue of the other."

## bare-console (3)

- **A custom `log` object passed to `new Console(log)` must implement debug, info, warn, error, clear(), and format(...data)**
  - Old page quote: "{ debug(...data), info(...data), warn(...data), error(...data), clear(), format(...data) }"
- **bare-console builds on bare-format, bare-hrtime, bare-logger, bare-system-logger, and bare-type**
  - Old page quote: "Builds on [`bare-format`](/reference/modules/bare-modules), `bare-hrtime`, `bare-logger`, `bare-system-logger`, and `bare-type` (see [Bare modules](/reference/modules/bare-modules))."
- **bare-inspector is cross-referenced for deeper debugging via the V8 inspector**
  - Old page quote: "[`bare-inspector`](/reference/bare/modules/bare-inspector)—deeper debugging via the V8 inspector."

## bare-crypto (1)

- **bare-crypto builds on bare-assert (in addition to bare-stream)**
  - Old page quote: "Builds on `bare-assert` and [`bare-stream`](/reference/bare/modules/bare-stream) (see [Bare modules](/reference/modules/bare-modules))."

## bare-fetch (2)

- **bare-fetch is a pure-JavaScript implementation built on top of bare-http1 and bare-https**
  - Old page quote: "It's pure JavaScript, built on [`bare-http1`](/reference/modules/bare-modules) and `bare-https`."
- **Headers is a case-insensitive map of header names**
  - Old page quote: "A case-insensitive header map: `append(name, value)`, `delete(name)`, `get(name)`, `has(name)`, `set(name, value)`, and the iterators `entries()`, `keys()`, `values()`, plus `forEach(callback[, thisArg])`."

## bare-form-data (1)

- **FormData, Blob, and File can be registered as globals via require('bare-form-data/global')**
  - Old page quote: "### Global registration  To register `FormData`, `Blob`, and `File` as globals across the entire application:  ```js require('bare-form-data/global') ```"

## bare-fs (1)

- **bare-fs builds on bare-events, bare-path, bare-stream, and bare-url**
  - Old page quote: "Builds on `bare-events`, [`bare-path`](/reference/modules/bare-modules), [`bare-stream`](/reference/bare/modules/bare-stream), and `bare-url` (see [Bare modules](/reference/modules/bare-modules))."

## bare-inspector (3)

- **Old page positioned bare-inspector as the in-process counterpart to the bare CLI's --inspect flag, and noted that pear-inspect exposes it remotely over Hyperswarm.**
  - Old page quote: "It's the in-process counterpart to the [`bare`](/reference/bare/cli) `--inspect` flag, and what `pear-inspect` exposes remotely over [Hyperswarm](/reference/building-blocks/hyperswarm)."
- **Old page had a 'Related modules' section stating bare-inspector builds on bare-events, bare-http1, bare-stream, bare-url, and bare-ws.**
  - Old page quote: "Builds on `bare-events`, [`bare-http1`](/reference/modules/bare-modules), [`bare-stream`](/reference/bare/modules/bare-stream), [`bare-url`](/reference/bare/modules/bare-url), and [`bare-ws`](/reference/modules/bare-modules)."
- **Old page cross-referenced bare-console for everyday logging/timing as a related module to check out.**
  - Old page quote: "[`bare-console`](/reference/bare/modules/bare-console)—everyday logging and timing."

## bare-ipc (4)

- **Old page noted bare-ipc is pure JavaScript and pointed to bare-kit for the native host↔worklet IPC channel instead.**
  - Old page quote: "It's pure JavaScript. (For the host↔worklet channel in native apps, see [`bare-kit`](/reference/bare/bare-kit) instead.)"
- **Old page documented that errors from the underlying incoming/outgoing pipes propagate to the IPC stream as 'error' events, after which the stream is destroyed.**
  - Old page quote: "Errors emitted by the underlying incoming or outgoing pipes are propagated to the stream as `error` events, after which the stream is destroyed."
- **Old page gave a worked example of the common ref()/unref() pattern tied to Bare's suspend/resume lifecycle events.**
  - Old page quote: "A common pattern is to call `ipc.ref()` on resume and `ipc.unref()` on suspend:  ```js Bare.on('suspend', () => ipc.unref()).on('resume', () => ipc.ref()) ```"
- **Old page had 'Related modules'/'See also' cross-references to bare-channel (inter-thread messaging) and bare-kit (host↔worklet IPC in native apps).**
  - Old page quote: "[`bare-channel`](/reference/bare/modules/bare-channel)—inter-*thread* messaging (same idea, within a process)."

## bare-make (5)

- **Old page instructed installing bare-make globally (-g) since it is used as a CLI tool.**
  - Old page quote: "npm i -g bare-make"
- **Old page described the toolchain bare-make drives (CMake with Ninja and Clang) and noted you can eject to plain CMake underneath.**
  - Old page quote: "It drives CMake with Ninja and Clang for a consistent toolchain across platforms, while staying plain CMake underneath so you can eject."
- **Old page had a full '## CLI' section documenting command-line flags (including short forms) for bare-make generate/build/install/test.**
  - Old page quote: "#### `bare-make generate [flags]`  ```console --source|-s <path>                   Path to the source tree --build|-b <path>                    Path to the build tree --platform|-p <name>                 Target operating system platform --arch|-a <name>                     Target architecture ... ``…"
- **Old page had a 'Related modules' section listing bare-env, bare-fs, bare-os, bare-path, and bare-process as dependencies.**
  - Old page quote: "Builds on `bare-env`, [`bare-fs`](/reference/bare/modules/bare-fs), [`bare-os`](/reference/bare/modules/bare-os), [`bare-path`](/reference/modules/bare-modules), and [`bare-process`](/reference/modules/bare-modules)."
- **Old page cross-referenced the 'Bundle a Bare app' how-to guide and the bare-pack module as related reading for where addon compilation fits into packaging.**
  - Old page quote: "[Bundle a Bare app](/how-to/run-on-native/bundle-a-bare-app)—where addon compilation fits in packaging."

## bare-mime (1)

- **Old page documented specific MIME.parse behaviors: it returns null on failure, lowercases type/subtype, strips leading/trailing HTTP whitespace from the input, and keeps only the first occurrence of a duplicated parameter name.**
  - Old page quote: "Returns `null` on failure. The `type` and `subtype` are lowercased, and leading/trailing HTTP whitespace is stripped from the input. If the same parameter name appears more than once, the first occurrence is used and subsequent duplicates are ignored."

## bare-module (5)

- **The entire `import.meta` API surface (import.meta.url, .main, .cache, .dirname, .filename, .resolve, .addon) documented in the old page is completely absent from the new page — no mention of `import.meta` anywhere, in prose or as a type.**
  - Old page quote: "plus `import.meta.url`, `import.meta.main`, `import.meta.cache`, `import.meta.dirname`, `import.meta.filename`, `import.meta.resolve(specifier[, parentURL])`, and `import.meta.addon([specifier][, parentURL])`."
- **The old intro describes bare-module as implementing CommonJS and ESM with bidirectional interop; this specific characterization is gone.**
  - Old page quote: "implements [Bare](/reference/bare/runtime)'s module system: CommonJS and ESM with bidirectional interop, native-addon and asset resolution, and the `require` / `import.meta` surfaces."
- **The old page's 'Related modules' section states bare-module builds on bare-module-resolve, bare-module-lexer, bare-bundle, bare-path, and bare-url.**
  - Old page quote: "Builds on [`bare-module-resolve`](/reference/bare/modules/bare-module-resolve), `bare-module-lexer`, [`bare-bundle`](/reference/modules/bare-modules), [`bare-path`](/reference/modules/bare-modules), and [`bare-url`](/reference/bare/modules/bare-url)."
- **The old page notes that Module.createRequire's parentURL-bound require is useful in REPL scenarios where the parent URL is set to a directory.**
  - Old page quote: "Useful in REPL scenarios where the parent URL should be set to a directory so relative paths resolve correctly."
- **The old page states that require.addon is the loader that Bare.Addon (from the Bare runtime API) builds on.**
  - Old page quote: "[Bare runtime API](/reference/bare/runtime#bareaddon)—`Bare.Addon`, the native-addon loader `require.addon` builds on."

## bare-os (5)

- **The old page states bare-os is a native addon requiring Bare >=1.14.0.**
  - Old page quote: "It's a native addon and requires Bare `>=1.14.0`."
- **The old page notes many bare-* modules depend on bare-os.**
  - Old page quote: "Many `bare-*` modules depend on it."
- **The old page notes the higher-level bare-env module wraps the raw env functions into a process.env-style object.**
  - Old page quote: "The higher-level [`bare-env`](/reference/modules/bare-modules) wraps these into a `process.env`-style object."
- **The old page's See also links bare-subprocess as spawning processes that build on bare-os.**
  - Old page quote: "[`bare-subprocess`](/reference/bare/modules/bare-subprocess)—spawn processes that build on this module."
- **The old page's See also notes Bare.platform and Bare.arch are the compile-time identifiers, contrasting with this module's runtime os.platform()/os.arch().**
  - Old page quote: "[Bare runtime API](/reference/bare/runtime)—`Bare.platform` and `Bare.arch` for compile-time identifiers."

## bare-pipe (5)

- **The old page states that transferred IPC handles arrive as 'handle' events in arrival order, before the corresponding 'data' event — an ordering guarantee relevant to correctly consuming handles.**
  - Old page quote: "The peer receives a `'handle'` event for each transferred handle, in arrival order, before the corresponding `'data'` event."
- **The old page includes full worked sender/receiver code examples showing how to pass a TCP socket handle over an IPC-enabled pipe.**
  - Old page quote: "const left = new Pipe(fd, { ipc: true }) const socket = tcp.createConnection(port)  socket.on('connect', () => {   left.write(Buffer.from('here'), socket) })"
- **The old page notes Pipe and bare-tcp's Socket implement the IPCAcceptable protocol natively, so a bare-tcp socket can be passed via bare-pipe IPC without extra glue code.**
  - Old page quote: "`Pipe`, `bare-tcp`'s `Socket`, and any compatible package implement this protocol natively, so a `bare-tcp` socket can be passed and received via `bare-pipe` IPC without extra glue code."
- **The old page's See also cross-links bare-tcp (same stream shape over TCP) and bare-subprocess (uses pipes for child-process stdio).**
  - Old page quote: "[`bare-tcp`](/reference/bare/modules/bare-tcp)—the same stream shape over TCP. - [`bare-subprocess`](/reference/bare/modules/bare-subprocess)—uses pipes for child-process stdio."
- **The old page explains that the required ipcHandle getter must return an ArrayBuffer backing a libuv uv_stream_t/uv_udp_t struct, and describes the optional ipcAccept method's purpose (e.g. address lookup).**
  - Old page quote: "`Symbol.for('bare.ipc.handle')` (required): A getter returning the underlying libuv handle (an `ArrayBuffer` whose first bytes are a `uv_stream_t` / `uv_udp_t`)."

## bare-posix (1)

- **The old page's See also cross-links bare-os as the portable OS utility module that includes userInfo/groupInfo, a natural next stop from these low-level POSIX identity calls.**
  - Old page quote: "[`bare-os`](/reference/bare/modules/bare-os)—portable OS utilities, including `userInfo` / `groupInfo`."

## bare-rpc (3)

- **The entire RPCCommandRouter class/pattern (an alternative way to define commands and handlers via router.respond(), with a full working example and the requestEncoding/responseEncoding compact-encoding options) is documented in the old page but is completely absent from the new page.**
  - Old page quote: "### RPCCommandRouter  An alternative way to define commands and their handlers. Pass a router as the `onrequest` argument to `new RPC()` instead of a plain callback.  #### `const router = new RPC.CommandRouter()`  Create a new command router.  #### `router.respond(command[, options], async (req, dat…"
- **The old page documents that bare-rpc builds on bare-stream and pairs with hyperschema and compact-encoding to generate typed message codecs.**
  - Old page quote: "## Related modules  Builds on [`bare-stream`](/reference/bare/modules/bare-stream). Pairs with [`hyperschema`](https://github.com/holepunchto/hyperschema) and [`compact-encoding`](/reference/helpers/compact-encoding) to generate typed message codecs."
- **The old page links out to the 'Type a native RPC bridge' how-to (for the end-to-end typed-codec pattern) and to 'One core, many platforms' for architectural context.**
  - Old page quote: "- [Type a native RPC bridge](/how-to/run-on-native/type-a-native-rpc-bridge)—generate a typed seam over this layer. - [One core, many platforms](/explanation/bare-on-native)—where the RPC seam fits architecturally."

## bare-sdl (3)

- **bare-sdl provides an AudioStream class representing an audio stream that is bound to an AudioDevice via bindStream(stream).**
  - Old page quote: "- **`AudioStream`**— an audio stream you bind to an `AudioDevice` with `bindStream(stream)`."
- **bare-sdl provides a Camera class for video capture, documented in its own 'Video' subsection.**
  - Old page quote: "### Video  - **`Camera`**— a video capture device; see the [repository README](https://github.com/holepunchto/bare-sdl) for its surface."
- **AudioDevice exposes a static `defaultRecordingDevice([spec])` helper alongside `defaultPlaybackDevice([spec])`.**
  - Old page quote: "`AudioDevice.defaultPlaybackDevice([spec])`, `AudioDevice.defaultRecordingDevice([spec])`, `AudioDevice.playbackDeviceFormats()`, and `AudioDevice.recordingDeviceFormats()`."

## bare-semver (2)

- **Range.parse supports several distinct range syntaxes beyond plain comparators and OR: caret ranges, tilde ranges, X-ranges/wildcards, and hyphen ranges.**
  - Old page quote: "- caret ranges (`^1.2.3`) - tilde ranges (`~1.2.3` or `~>1.2.3`) - X-ranges and wildcards (`1.2.x`, `1.*`, `*`) - hyphen ranges (`1.2.3 - 2.3.4`)"
- **bare-semver underpins Bare's module/addon resolution, and bare-module-resolve is called out as a related module that uses semver ranges during resolution.**
  - Old page quote: "It's pure JavaScript and underpins Bare's module/addon resolution."

## bare-sidecar (4)

- **bare-sidecar emits a documented `"close"` event, fired after the sidecar process has exited and its underlying stream has been destroyed.**
  - Old page quote: "#### event: `"close"`  Emitted after the sidecar process has exited and its underlying stream has been destroyed."
- **The Sidecar instance extends a duplex stream where destroying the stream kills the sidecar process.**
  - Old page quote: "destroying the stream kills the sidecar process"
- **bare-sidecar builds on a specific stack of modules: bare-subprocess, bare-pipe, bare-module, bare-fs, bare-os, bare-path, bare-stream, and bare-url.**
  - Old page quote: "## Related modules  Builds on [`bare-subprocess`](/reference/bare/modules/bare-subprocess), [`bare-pipe`](/reference/bare/modules/bare-pipe), [`bare-module`](/reference/bare/modules/bare-module), [`bare-fs`](/reference/bare/modules/bare-fs), [`bare-os`](/reference/bare/modules/bare-os), `bare-path`,…"
- **The old page links to bare-subprocess as 'the lower-level process API' and to 'One core, many platforms' for the architectural pattern of running a Bare core beside a host.**
  - Old page quote: "- [`bare-subprocess`](/reference/bare/modules/bare-subprocess)—the lower-level process API. - [One core, many platforms](/explanation/bare-on-native)—running a Bare core beside a host."

## bare-sqlite (1)

- **bare-sqlite's DatabaseSync/StatementSync API closely mirrors Node.js's built-in node:sqlite module.**
  - Old page quote: "The API mirrors Node.js's [`node:sqlite`](https://nodejs.org/api/sqlite.html) (`DatabaseSync` + prepared statements)."

## bare-stream (2)

- **bare-stream ships a `bare-stream/promises` entry point that exposes a promise-returning `pipeline()` for async/await use, with its own usage example.**
  - Old page quote: "`require('bare-stream/promises')` exports promise-based variants of the pipeline utility for use with async/await."
- **bare-stream exposes `isEnding` and `isFinishing` state-predicate helpers alongside its other `is*` stream-state functions.**
  - Old page quote: "`isStream`, `isEnding`, `isEnded`, `isFinishing`, `isFinished`, `isDisturbed`, `isErrored`, `isReadable`, `isWritable`, and `getStreamError(stream[, options])`."

## bare-subprocess (5)

- **bare-subprocess is documented as available only on desktop platforms (Windows, macOS, Linux).**
  - Old page quote: "it's available on desktop (Windows, macOS, Linux)."
- **When `shell: true`, the shell used defaults to a platform-specific binary: `/bin/sh`, `/system/bin/sh` on Android, or `cmd.exe` on Windows.**
  - Old page quote: "`shell` may be a string identifying the shell to use, or `true` to use the platform default (`/bin/sh`, `/system/bin/sh` on Android, or `cmd.exe` on Windows)."
- **The `serialization` modes have specific documented wire formats: `'json'` is newline-delimited JSON (the default, JSON-serializable values only), and `'advanced'` is a length-prefixed structured clone via bare-structured-clone supporting Date/Map/Buffer.**
  - Old page quote: "`'json'` | Newline-delimited JSON. Only JSON-serializable values are supported. Default. | `'advanced'` | Length-prefixed structured clone via `bare-structured-clone`. Supports `Date`, `Map`, `Buffer`, etc."
- **A Subprocess emits a `close` event in addition to exit/message/disconnect/error.**
  - Old page quote: "A `Subprocess` emits `exit`, `close`, `message`, `disconnect`, and `error`."
- **bare-subprocess re-exports bare-os's signal constants (`os.constants.signals`) and makes them available via a separate `bare-subprocess/constants` sub-path.**
  - Old page quote: "Re-exports the signal constants from `bare-os` (`os.constants.signals`). Also available as `require('bare-subprocess/constants')`."

## bare-tcp (2)

- **TCPSocket instances are bare-stream duplex streams, with a direct cross-reference to the bare-stream module.**
  - Old page quote: "Sockets are [`bare-stream`](/reference/bare/modules/bare-stream) duplex streams."
- **connect() accepts a `family` option that can be set to `4` or `6` to force resolution to IPv4-only or IPv6-only.**
  - Old page quote: "Set `options.family` to `4` or `6` to restrict to IPv4 or IPv6."

## bare-timers (7)

- **The timer functions are installed as globals inside Bare, so most code calls them directly without importing the module at all.**
  - Old page quote: "Inside Bare these functions are installed as globals, so most code calls them directly without importing anything."
- **Bare's timer handles are objects (like Node.js), unlike browsers where timer functions return a numeric id.**
  - Old page quote: "Unlike browsers—where the timer functions return a numeric id—Bare returns an object handle, as Node.js does."
- **Every timer handle implements Symbol.dispose, so a `using` declaration auto-cancels the timer when the scope exits.**
  - Old page quote: "Every handle also implements `[Symbol.dispose]()`, so a `using timer = setTimeout(…)` declaration cancels the timer when the scope exits."
- **Delay clamping also covers NaN/non-numeric delays, and Bare's maximum delay ceiling (Number.MAX_SAFE_INTEGER) is explicitly larger than Node's cap (2147483647).**
  - Old page quote: "A `delay` that is less than `1`, `NaN`, non-numeric, or greater than `Number.MAX_SAFE_INTEGER` is clamped to `1` ms. (Node caps the maximum at `2147483647`; Bare's ceiling is `Number.MAX_SAFE_INTEGER`.)"
- **The recommended suspension pattern is to clear timers on suspend, with unref() as the alternative for timers that must keep running — the same pattern bare-ipc uses for its channel.**
  - Old page quote: "The usual suspension pattern is to clear timers outright on `suspend`; `unref()` is the alternative for a timer that must keep running across the cycle—the same pattern [`bare-ipc`](/reference/bare/modules/bare-ipc#ipcunref) uses for its channel."
- **refresh() reschedules a Timeout to fire again using the same handle, callback, and args, and reactivates it if it had been cleared.**
  - Old page quote: "Reschedule a `Timeout` to fire `delay` milliseconds from now, reusing the same handle, callback, and `args`; reactivates the handle if it had been cleared."
- **The promise-based API's AbortSignal cancellation comes from bare-abort-controller, an optional peer dependency, and the module hooks into the runtime's idle/resume/wakeup lifecycle events to pause/restart the native timer.**
  - Old page quote: "Hooks into the [Bare runtime](/reference/bare/runtime)'s lifecycle events (`idle`, `resume`, `wakeup`) to pause and restart the underlying native timer. The [promise-based API](#promise-based-timers) integrates with [`bare-abort-controller`](https://github.com/holepunchto/bare-abort-controller)—an o…"

## bare-tls (6)

- **Hostname verification behaves differently for DNS names vs IP literals: DNS names are sent as the SNI extension, while IP literals are matched against the certificate's IP SANs and SNI is suppressed per RFC 6066.**
  - Old page quote: "For DNS names it is also sent as the SNI extension; for IP literals it is matched against the certificate's IP SANs and SNI is suppressed per RFC 6066."
- **When a custom `ca` list is provided, only those CAs are used for verification instead of the bundled Mozilla root certificates.**
  - Old page quote: "When provided, only these CAs are used for verification instead of the bundled Mozilla root certificates."
- **If `isServer` is true, `cert` and `key` must be provided.**
  - Old page quote: "Whether the socket acts as a TLS server or client. If `true`, `cert` and `key` must be provided."
- **bare-tls typically wraps bare-tcp as the underlying duplex socket, layering it with an encrypted bare-stream.**
  - Old page quote: "wrapping an underlying duplex socket (typically [`bare-tcp`](/reference/bare/modules/bare-tcp)) in an encrypted [`bare-stream`](/reference/bare/modules/bare-stream)"
- **The TLS server exposes `listen(...args)`, `address()`, `close([onclose])`, `ref()`/`unref()`, and a `listening` property.**
  - Old page quote: "Create a TLS server: `server.listen(...args)`, `server.address()`, `server.close([onclose])`, `server.ref()` / `server.unref()`, and `server.listening`."
- **Connecting can also be done with the positional form `tls.connect(port[, host][, onconnect])`, not just an options object.**
  - Old page quote: "`const socket = tls.connect(options[, onconnect])` · `tls.connect(port[, host][, onconnect])`"

## bare-url (2)

- **URL exposes a static `format(parts)` method.**
  - Old page quote: "`URL.parse(input[, base])`, `URL.canParse(input[, base])`, `URL.isURL(value)`, `URL.format(parts)`, and the file-URL helpers `URL.fileURLToPath(url)` and `URL.pathToFileURL(pathname)`."
- **bare-fetch accepts these URL objects as request input.**
  - Old page quote: "[`bare-fetch`](/reference/bare/modules/bare-fetch)—accepts these `URL` objects as request input."
