# Bare

Small and modular JavaScript runtime for desktop and mobile. Like Node.js, it provides an asynchronous, event-driven architecture for writing applications in the lingua franca of modern software. Unlike Node.js, it makes embedding and cross-device support core use cases, aiming to run just as well on your phone as on your laptop. The result is a runtime ideal for networked, peer-to-peer applications that can run on a wide selection of hardware.

```sh
npm i -g bare
```

## Usage

```console
bare [flags] <filename> [...args]

Evaluate a script or start a REPL session if no script is provided.

Arguments:
  <filename>            The name of a script to evaluate
  [...args]             Additional arguments made available to the script

Flags:
  --version|-v          Print the Bare version
  --eval|-e <script>    Evaluate an inline script
  --print|-p <script>   Evaluate an inline script and print the result
  --inspect             Activate the inspector
  --help|-h             Show help
```

The specified `<script>` or `<filename>` is run using `Module.load()`. For more information on the module system and the supported formats, see <https://github.com/holepunchto/bare-module>.

## Architecture

Bare is built on top of <https://github.com/holepunchto/libjs>, which provides low-level bindings to V8 in an engine independent manner, and <https://github.com/libuv/libuv>, which provides an asynchronous I/O event loop. Bare itself only adds a few missing pieces on top to support a wider ecosystem of modules:

1. A module system supporting both CJS and ESM with bidirectional interoperability between the two.
2. A native addon system supporting both statically and dynamically linked addons.
3. Light-weight thread support with synchronous joins and shared array buffer support.

Everything else if left to userland modules to implement using these primitives, keeping the runtime itself succint and _bare_. By abstracting over both the underlying JavaScript engine using `libjs` and platform I/O operations using `libuv`, Bare allows module authors to implement native addons that can run on any JavaScript engine that implements the `libjs` ABI and any system that `libuv` supports.

## API

Bare makes it easy to craft applications that can run effectively across a broad spectrum of devices. To get started, find the Bare API specs [here](./api.md).

### Modules

Bare provides no standard library beyond the core JavaScript API available through the `Bare` namespace. Instead, there is a comprehensive collection of external modules built specifically for Bare, see [Bare Modules](./bare-modules.md)

### Embedding

Bare can easily be embedded using the C API defined in [`include/bare.h`](https://github.com/holepunchto/bare/blob/main/include/bare.h):

```c
#include <bare.h>
#include <uv.h>

bare_t *bare;
bare_setup(uv_default_loop(), platform, &env /* Optional */, argc, argv, options, &bare);

bare_load(bare, filename, source, &module /* Optional */);

bare_run(bare);

int exit_code;
bare_teardown(bare, &exit_code);
```

If `source` is `NULL`, the contents of `filename` will instead be read at runtime. For examples of how to embed Bare on mobile platforms, see [Bare Android](https://github.com/holepunchto/bare-android) and [Bare iOS](https://github.com/holepunchto/bare-ios).

### Suspension

Bare provides a mechanism for implementing process suspension, which is needed for platforms with strict application lifecycle constraints, such as mobile platforms. When suspended, a `suspend` event will be emitted on the `Bare` namespace. Then, when the loop has no work left and would otherwise exit, an `idle` event will be emitted and the loop blocked, keeping it from exiting. When the process is later resumed, a `resume` event will be emitted and the loop unblocked, allowing it to exit when no work is left.

The suspension API is available through `bare_suspend()` and `bare_resume()` from C and `Bare.suspend()` and `Bare.resume()` from JavaScript.

## Building

<https://github.com/holepunchto/bare-make> is used for compiling Bare. Start by installing the tool globally:

```console
npm i -g bare-make
```

Next, install the required build and runtime dependencies:

```console
npm i
```

Then, generate the build system:

```console
bare-make generate
```

This only has to be run once per repository checkout. When updating `bare-make` or your compiler toolchain it might also be necessary to regenerate the build system. To do so, run the command again with the `--no-cache` flag set to disregard the existing build system cache:

```console
bare-make generate --no-cache
```

With a build system generated, Bare can be compiled:

```console
bare-make build
```

When completed, the `bare(.exe)` binary will be available in the `build/bin` directory and the `libbare.(a|lib)` and `(lib)bare.(dylib|dll|lib)` libraries will be available in the root of the `build` directory.

### Linking

When linking against the static `libbare.(a|lib)` library, make sure to use whole archive linking as Bare relies on constructor functions for registering native addons. Without whole archive linking, the linker will remove the constructor functions as they aren't referenced by anything.

## Platform support

Bare uses a tiered support system to manage expectations for the platforms that it targets. Targets may move between tiers between minor releases and as such a change in tier will not be considered a breaking change.

**Tier 1:** Platform targets for which prebuilds are provided as defined by the [`.github/workflows/prebuild.yml`](https://github.com/holepunchto/bare/blob/main/.github/workflows/prebuild.yml) workflow. Compilation and test failures for these targets will cause workflow runs to go red.

**Tier 2:** Platform targets for which Bare is known to work, but without automated compilation and testing. Regressions may occur between releases and will be considered bugs.

> [!NOTE]  
> Development happens primarily on Apple hardware with Linux and Windows systems running as virtual machines.

| Platform  | Architecture | Version                              | Tier | Notes                       |
| :-------- | :----------- | :----------------------------------- | :--- | :-------------------------- |
| GNU/Linux | `arm64`      | >= Linux 5.15, >= GNU C Library 2.35 | 1    | Ubuntu 22.04, OpenWrt 23.05 |
| GNU/Linux | `x64`        | >= Linux 5.15, >= GNU C Library 2.35 | 1    | Ubuntu 22.04, OpenWrt 23.05 |
| GNU/Linux | `arm64`      | >= Linux 5.10, >= musl 1.2           | 2    | Alpine 3.13, OpenWrt 22.03  |
| GNU/Linux | `x64`        | >= Linux 5.10, >= musl 1.2           | 2    | Alpine 3.13, OpenWrt 22.03  |
| GNU/Linux | `mips`       | >= Linux 5.10, >= musl 1.2           | 2    | OpenWrt 22.03               |
| GNU/Linux | `mipsel`     | >= Linux 5.10, >= musl 1.2           | 2    | OpenWrt 22.03               |
| Android   | `arm`        | >= 9                                 | 1    |
| Android   | `arm64`      | >= 9                                 | 1    |
| Android   | `ia32`       | >= 9                                 | 1    |
| Android   | `x64`        | >= 9                                 | 1    |
| macOS     | `arm64`      | >= 11.0                              | 1    |
| macOS     | `x64`        | >= 11.0                              | 1    |
| iOS       | `arm64`      | >= 14.0                              | 1    |
| iOS       | `x64`        | >= 14.0                              | 1    | Simulator only              |
| Windows   | `arm64`      | >= Windows 11                        | 1    |
| Windows   | `x64`        | >= Windows 10                        | 1    |
