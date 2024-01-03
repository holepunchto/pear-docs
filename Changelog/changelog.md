# Changelog

## March 2023

| Module     | Version | Description                                                                                                                                                                 |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hypercore  | 10.8.1  | • Added indexedLength                                                                                                                                                       |
| Hyperswarm | 4.4.0   | <p>• Fixed connection reset by peer on test<br>• Enabled MacOS tests, and run retry-timer test only on Linux<br>• Added 'update' event, and .connecting property public</p> |
| HyperDHT   | 6.5.2   | <p>• Upgraded dht-rpc<br>• Renamed @hyperswarm/dht to hyperdht</p>                                                                                                          |
|            | 6.5.1   | • Set ipv4 as default while the ttl issue is being examined                                                                                                                 |
| Hyperbee   | 2.7.1   | • Modified db.watch to return an array                                                                                                                                      |
|            | 2.7.0   | • Modified bee.watch(\[range]) to be an async iterator                                                                                                                      |
|            | 2.6.2   | • Added failing oob diff test                                                                                                                                               |
|            | 2.6.1   | <p>• Fixed close snapshot on watch run<br>• Added simpler error handling for watch<br>• Fixed early return not returning null</p>                                           |
|            | 2.6.0   | • Added bee.watch(\[range], \[onchange])                                                                                                                                    |
|            | 2.5.0   | • Added support for encoded checkout                                                                                                                                        |
| Localdrive | 1.6.0   | • Added drive.readdir()                                                                                                                                                     |

## February 2023

| Module     | Version | Description                                                     |
| ---------- | ------- | --------------------------------------------------------------- |
| Hypercore  | 10.8.0  | • seek() options were added (wait and timeout)                  |
| HyperDHT   | 6.5.0   | • Enabled holepunching on local networks                        |
| Corestore  | 6.5.1   | • bootstrap renamed to \_bootstrap in namespace                 |
|            | 6.5.0   | • Ability to create a namespace from a bootstrap core was added |
|            | 6.4.3   | • A major session leak identified and fixed                     |
| Localdrive | 1.5.0   | • Dummy checkout for compat was added                           |

## January 2023

| Module      | Version | Description                                                                                                                                                                                                  |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hypercore   | 10.7.0  | <p>• Added timeout option for core.get()<br>• Added more docs for core.update([opts])<br>• Added constructor timeout, and session inherits timeout<br>• Added decrypt option to core.get() for disabling</p> |
|             | 10.6.1  | • Used core-wide finding peers for remote wait                                                                                                                                                               |
|             | 10.6.0  | <p>• Avoid async tick in close<br>• Fixed examples/http.js<br>• Updated is fully local per default<br>• Removed unsupported feature test</p>                                                                 |
|             | 10.5.4  | <p>• Dependency bumps<br>• Minor bug fixes<br>• Fixed links</p>                                                                                                                                              |
| Hyperswarm  | 4.3.7   | • If destroy gives network errors, ignore as destroying                                                                                                                                                      |
|             | 4.3.6   | <p>• Added a link to documentation<br>• Updated Git URL, README.md, test/all.js<br>• Added failing to dup test<br>• Moved to a simple key tiebreaker for duplicates</p>                                      |
| HyperDHT    | 6.4.4   | • Changed destroyed to destroying                                                                                                                                                                            |
|             | 6.4.3   | • Skewed random generation towards distinct prefixes                                                                                                                                                         |
|             | 6.4.2   | • Updated sodium-universal                                                                                                                                                                                   |
|             | 6.4.1   | <p>• Added link to documentation<br>• Updated Git URL<br>• Removed localAddress() and remoteAddress()<br>• Removed udx-native and _udx property, return server on listen()</p>                               |
| Corestore   | 6.4.2   | • The core events not being emitted on root ns were fixed                                                                                                                                                    |
|             | 6.4.1   | <p>• Added link to the documentation<br>• Updated Git URL<br>• Dependency bumps</p>                                                                                                                          |
| Hyperbee    | 2.4.2   | • Made isHyperbee wait or return null for an empty core                                                                                                                                                      |
|             | 2.4.1   | • Diff key encoding opt was fixed                                                                                                                                                                            |
|             | 2.4.0   | • Deprecated the feed property, which will be core going forward                                                                                                                                             |
|             | 2.3.0   | <p>• Added isHyperbee<br>• Added link to the documentation<br>• Updated Git URL<br>• Added support for the update option in Batch<br>• Added isHyperbee</p>                                                  |
| Localdrive  | 1.4.1   | • The filter option was removed                                                                                                                                                                              |
| Mirrordrive | 1.2.2   | • Fixed filter for hyperdrives                                                                                                                                                                               |
