# Reference generation improvement plan — localdrive
Generated from `holepunchto/localdrive` at **v2.2.1** (`e9b7f3326a`) on 2026-06-11T12:37:00.928Z.
**Doc-completeness: 43%** — 6 of 14 source methods fully documented (description + documented params). Return values and examples are reported separately as enhancement signals.
> This replaces OpenAPI/ratemyopenapi scoring, which does not apply to JS library APIs. The score grades the upstream README against the source surface extracted by the AST pass.
## Parity vs curated page
**100%** of the hand-authored page is reproduced — 21 of 21 documented symbols (`content/reference/helpers/localdrive.mdx`).
### Extra in generated model (1)
_Found in source but absent from the curated page — candidate additions (or internal symbols to filter)._
- `metadata`
## Completeness gaps
### Missing description (2)

_Cause: method exists in source but has no prose in the README — upstream README gap._

- `const comparison = drive.compare(entryA, entryB)`
- `const iterator = await drive.readdir([folder])`

### Undocumented parameters (8)

_Cause: parameter present in the signature but not described — README gap or extractor name-mismatch._

- `const entry = await drive.entry(key, [options])` → name
- `const buffer = await drive.get(key, [options])` → key
- `await drive.put(key, buffer, [options])` → buffer
- `const comparison = drive.compare(entryA, entryB)` → a, b
- `const iterator = await drive.list([folder], [options])` → folder
- `const iterator = await drive.readdir([folder])` → folder
- `const mirror = drive.mirror(out, [options])` → out
- `const rs = drive.createReadStream(key, [options])` → key

## Enhancements
### Return value not explained (2)

_Cause: signature captures a scalar return but no prose/shape explains it — clarity enhancement._

- `const mirror = drive.mirror(out, [options])`
- `const ws = drive.createWriteStream(key, [options])`

### No example (9)

_Cause: no code fence under the README entry — add a usage snippet._

- `const buffer = await drive.get(key, [options])`
- `await drive.put(key, buffer, [options])`
- `await drive.del(key)`
- `await drive.symlink(key, linkname)`
- `const comparison = drive.compare(entryA, entryB)`
- `const iterator = await drive.readdir([folder])`
- `const mirror = drive.mirror(out, [options])`
- `drive.root`
- `drive.supportsMetadata`

## Drift
### Undocumented in README (in source) (8)

_Cause: public method in source with no README entry — add upstream docs, or confirm it is internal._

- `await drive.ready()`
- `await drive.close()`
- `await drive.flush()`
- `drive.batch()`
- `drive.checkout()`
- `drive.toPath(key)`
- `await drive.exists(name)`
- `drive.metadata`
