# Bare

[Bare](https://github.com/holepunchto/bare) is a small and modular JavaScript runtime for desktop and mobile. Like Node.js, it provides an asynchronous, event-driven architecture for writing applications in the lingua franca of modern software. Unlike Node.js, it makes embedding and cross-device support core use cases, aiming to run well on any system whether that is a phone or desktop. The result is a runtime ideal for networked, peer-to-peer applications that can run on a wide selection of hardware.

## Installation

Prebuilt binaries are provided by [Bare Runtime](https://github.com/holepunchto/bare-runtime) and can be installed using `npm`:

```sh
npm i -g bare-runtime
```

## Usage

```sh
bare [-e, --eval <script>] [-p, --print <script>] [<filename>]
```

The specified `<script>` or `<filename>` is run using `Module.load()`. For more information on the module system and the supported formats, see [Bare Modules](./bare-modules.md).

## Architecture

Bare is built on top of [libjs](https://github.com/holepunchto/libjs), which provides low-level bindings to V8, and [libuv](https://github.com/libuv/libuv), which provides an asynchronous I/O event loop. Bare itself only adds a few missing pieces on top to support a wider ecosystem of modules:

1. A module system supporting both CJS and ESM with bidirectional interoperability between the two.
2. A native addon system supporting both statically and dynamically linked addons.
3. Light-weight thread support with synchronous joins and shared array buffer support.

Everything else if left to userland modules to be implemented using these primitives, keeping the runtime itself succinct and _bare_.

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
bare_setup(uv_default_loop(), platform, &env, argc, argv, options, &bare);

bare_run(bare, filename, source);

int exit_code;
bare_teardown(bare, &exit_code);
```

If `source` is `NULL`, the contents of `filename` will instead be read at runtime. For examples of how to embed Bare on mobile platforms, see [Bare Android](https://github.com/holepunchto/bare-android) and [Bare iOS](https://github.com/holepunchto/bare-ios).

### Suspension

Bare provides a mechanism for implementing process suspension, which is needed for platforms with strict application lifecycle constraints, such as mobile platforms. When suspended, a `suspend` event will be emitted on the `Bare` namespace. Then, when the loop has no work left and would otherwise exit, an `idle` event will be emitted and the loop blocked, keeping it from exiting. When the process is later resumed, a `resume` event will be emitted and the loop unblocked, allowing it to exit when no work is left.

The suspension API is available through `bare_suspend()` and `bare_resume()` from C and `Bare.suspend()` and `Bare.resume()` from JavaScript. See [`example/suspend.js`](https://github.com/holepunchto/bare/blob/main/example/suspend.js) for an example of using the suspension API from JavaScript.

## Building

The `bare-dev` toolkit, which we'll be invoking with `npx`, is used for building Bare and acts as a convenient wrapper around CMake and other tools. After cloning the repository, start by synchronizing the vendored dependencies such as git submodules:

```sh
npx bare-dev vendor sync
```

Then, configure the build tree before performing the first build:

```sh
npx bare-dev configure [--debug]
```

Finally, perform the build:

```sh
npx bare-dev build
```

When completed, the `bare` binary will be available in the `build/bin` directory and the `libbare.(a|lib)` and `(lib)bare.(dylib|dll)` libraries will be available in the root of the `build` directory.

### Linking

When linking against the static `libbare.(a|lib)` library, make sure to use whole archive linking as Bare relies on constructor functions for registering native addons. Without whole archive linking, the linker will remove the constructor functions as they aren't referenced by anything.

