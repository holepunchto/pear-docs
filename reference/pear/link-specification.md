# Pear Link Specification

Pear links are clickable links for running Pear applications with deep linking support via [`Pear.config.linkData`](/reference/pear/api.md#pear.config.linkdata-less-than-string-greater-than).

## Specification

The `pear:` protocol supports the following syntax:

```
pear://[<fork>.][<length>.]<keyOrAlias>[.<dhash>]<path>[?<search>][#<lochash>]
```

- `fork` is the [fork id](https://github.com/holepunchto/hypercore#corefork) for the underlying hypercore.
- `length` is the [length](https://github.com/holepunchto/hypercore#corelength) of the underlying hypercore.
- `keyOrAlias` is the z32 or hex encoded key or an alias for the key.
- `path` is zero or more path segments separated by a `/`.
- `search` is a query string of non-hierarchical data proceeded by a question
mark (`?`).
- `lochash` is the fragment proceeded by a hash (`#`).

## Parsing

To parse a Pear link, use [`pear-link`](https://github.com/holepunchto/pear-link)'s `plink.parse(url)`. For example:

```js
import PearLink from 'pear-link'
import hypercoreid from 'hypercore-id-encoding'

const ALIASES = {
  runtime: hypercoreid.decode('nkw138nybdx6mtf98z497czxogzwje5yzu585c66ofba854gw3ro')
}
const plink = new PearLink(ALIASES)

const { protocol, pathname, search, hash, origin, drive } = plink.parse('pear://runtime')
console.log('protocol', protocol) // Prints 'pear:'
console.log('drive.key', drive.key.toString('hex')) // Prints '12a92c9c4008dfe5c4bf3df5feb2ef81af44a360bcf67db3de814383ef46a649'
```
