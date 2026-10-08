# Reference generation improvement plan — mirrordrive
Generated from `holepunchto/mirror-drive` at **v1.14.2** (`6963e8905e`) on 2026-06-11T12:37:02.155Z.
**Doc-completeness: 100%** — 3 of 3 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 20 of 20 documented symbols (`content/reference/helpers/mirrordrive.mdx`).
### Extra in generated model (28)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `batch`
- `dedup`
- `downloadSpeed`
- `downloadedBlocksEstimate`
- `dryRun`
- `dst`
- `emit`
- `entries`
- `filter`
- `ignore`
- `includeEquals`
- `includeProgress`
- `index`
- `interval`
- `iterator`
- `metadataEquals`
- `mirror`
- `monitors`
- `off`
- `on`
- `once`
- `prefix`
- `preload`
- `prune`
- `src`
- `transformers`
- `update`
- `uploadSpeed`
## Completeness gaps
## Enhancements
### No example (2)

_Cause: no code fence under the README entry — add a usage snippet._

- `await mirror.done()`
- `mirror.count`

## Drift
### Undocumented in README (in source) (47)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `mirror.peers`
- `mirror.downloadProgress`
- `mirror.monitor(opts)`
- `mirror.src`
- `mirror.dst`
- `mirror.prefix`
- `mirror.dedup`
- `mirror.dryRun`
- `mirror.prune`
- `mirror.preload`
- `mirror.preloaded`
- `mirror.includeProgress`
- `mirror.includeEquals`
- `mirror.filter`
- `mirror.metadataEquals`
- `mirror.batch`
- `mirror.entries`
- `mirror.transformers`
- `mirror.bytesRemoved`
- `mirror.bytesAdded`
- `mirror.ignore`
- `mirror.finished`
- `mirror.downloadedBlocks`
- `mirror.downloadedBlocksEstimate`
- `mirror.downloadedBytes`
- `mirror.downloadSpeed`
- `mirror.uploadedBlocks`
- `mirror.uploadedBytes`
- `mirror.uploadSpeed`
- `mirror.monitors`
- `mirror.iterator`
- `new Monitor(mirror, { interval = 250 } = {})`
- `monitor.preloaded`
- `monitor.destroyed`
- `monitor.update()`
- `monitor.destroy()`
- `monitor.on(event, listener)`
- `monitor.once(event, listener)`
- `monitor.off(event, listener)`
- `monitor.emit(event, [...args])`
- `monitor.mirror`
- `monitor.interval`
- `monitor.stats`
- `monitor.index`
- `monitor.on('update', stats)`
- `monitor.on('destroy', listener)`
- `monitor.on('preloaded', listener)`
