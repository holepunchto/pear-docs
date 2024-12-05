# Bare on Mobile

Bare can be embedded into mobile applications to serve as the "Pear-end" where the peer-to-peer code of the application is run.

To get started with embedding [Bare](../reference/bare/overview.md) into an [Expo](https://expo.dev/) mobile application use the [Bare on Expo](https://github.com/holepunchto/bare-expo) example as reference. This example integrates Bare as an isolated thread, called a worklet[^1], via [`react-native-bare-kit`](https://github.com/holepunchto/react-native-bare-kit). All code passed when starting the worklet will run in the Bare runtime and can be communicated with via remote procedure calls.

[^1]: This term was chosen to avoid ambiguity with worker threads as implemented by <https://github.com/holepunchto/bare-worker>.

For deeper integration with a mobile application, the following examples can be used as references:

- [Bare Android](https://github.com/holepunchto/bare-android)
- [Bare iOS](https://github.com/holepunchto/bare-ios)

> The Bare JavaScript runtime runs equally well on both mobile and desktop applications.

For further reference on using Bare, please refer to [GitHub (Bare)](https://github.com/holepunchto/bare).
