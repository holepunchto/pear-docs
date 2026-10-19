# bare-bluetooth examples (documentation snapshot)

`example/` is vendored from [holepunchto/bare-bluetooth](https://github.com/holepunchto/bare-bluetooth),
branch **`main`**, at commit `d1ef344`
([tree](https://github.com/holepunchto/bare-bluetooth/tree/d1ef34487f57cc183b5d7a0d6c588d95447eb420/example)).
The repository has no `LICENSE` file; its `package.json` declares Apache-2.0.

`example/scan.js`, `example/l2cappong.js` and `example/gattpong.js` back the code imports in
`content/bare/how-to/connect-over-bluetooth/` (via
`file=<rootDir>/examples/how-to/connect-over-bluetooth/bare-bluetooth/example/…#L…`).
`example/README.md` is upstream's own.

The scripts `require('..')`, the package root of an upstream checkout, so they only run from
there: clone the repository, `npm install`, and run them with `bare` as `example/README.md`
describes. They need a Bluetooth radio, and two machines for the two pong examples, so they are
not in `scripts/test-examples.ts`.

The examples arrived after the 0.6.2 release, alongside Linux support, and are not in the npm
package.
