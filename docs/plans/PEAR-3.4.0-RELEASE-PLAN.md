# Pear 3.4.0 docs update — review and execution plan

Status: implemented against the final `v3.4.0` tag (upstream cut it before this pass started—no rc gap to track down, unlike 3.3.0).

Base branch: `feat/3.4.0-updates`, cut from `published` after fast-forwarding local `published` 13 commits to match `origin/published` (it had drifted behind since before 3.2.0 shipped).

This plan mirrors the process used for 3.3.0 (`PEAR-3.3.0-RELEASE-PLAN.md`, PR #357): review the upstream surface diff, update the reference pages with version-gated badges, register the new doc-state, extend the release-overview changelog, and re-run the drift checks.

## 0. Baseline correction

Two bookkeeping pins were never advanced past their pre-3.2.0-review values despite 3.2.0 and 3.3.0 both having shipped and been fully documented:

- `scripts/upstream-commits-state.json`'s `pear-cli` was still `e388e63c7571613fb99d3b519821fbb2db9f78a2`.
- `scripts/upstream-releases-state.json`'s `holepunchto/pear` was still `v3.2.0`.

Both are bumped straight to `v3.4.0` / its commit SHA as part of this release (§5)—no separate catch-up pass.

## 1. Review the upstream delta

### 1.1 Commits in scope

`v3.3.0..v3.4.0` is 16 commits (from a scratch clone of `holepunchto/pear`):

| Commit | Subject |
| --- | --- |
| `16204fa` | 3.4.0 |
| `392b007` | CHANGELOG |
| `983c1c2` | Implement `pear seed --blind-peer <key>` (#1210) |
| `12479ac` | output hints through std err (#1213) |
| `d133cc3` | add relay flag (#1209) |
| `aa01463` | fix blind relay (#1212) |
| `aee742c` | stage without package.json (#1207) |
| `4616ab6` | adjust hint tabs (#1208) |
| `a0e71f0` | remove tests numbers (#1206) |
| `a124322` | use inner sidecar error details in CLI output (#1196) |
| `c68e7db` | Add blind-peer (#1195) |
| `b0fe863` | pear seed blobs size (#1205) |
| `6580285` | pear seed: field `App: {name}@{version}` (#1202) |
| `f45db56` | Fix error handling in pear seed and blind-relay (#1204) |
| `d0c575f` | bump deps (#1203) |
| `7ce9260` | Implement pear blind-relay start (#1201) |
| `0536b1c` | `$ pear cores` improvements (#1198) |
| `a79f418` | 3.4.0-rc.0 (#1200) |

Files touched (`git diff v3.3.0 v3.4.0 --stat -- cmd/ lib/ subsystems/`): two new commands—`cmd/blind-peer.js` (118 lines), `cmd/blind-relay.js` (177 lines)—plus `cmd/index.js`, `cmd/cores.js`, `cmd/seed.js`, `cmd/stage.js`, `lib/cmd.js`, `lib/terminal.js`, a new `lib/package.js`, and matching `subsystems/sidecar/` wiring. 16 files, +1166/-124.

### 1.2 Upstream's own CHANGELOG.md for v3.4.0

**Features:** `pear blind-peer` (`start --trusted-peer <peer>`, `identity`, `request <key> [--peer <peer>] [--core-only]`); `pear blind-relay start [--no-tty] [--stats-interval <ms>]`; `pear seed --blind-peer <key>` (implies exit-on-complete like `--until-sync`); global `pear --relay <key>`; `pear stage --skip-package-json`.

**Improvements:** `pear cores` gains a header row plus `Length`/`Writable`/`Size` columns and a total-size summary; `pear seed` gains an `App: <name>@<version>` field and blobs size in its output; hints now write to stderr instead of stdout, with adjusted alignment; `pear stage`'s `package.json` validation is hardened—no more upward search through parent directories; internal deps bump.

No "Fixes" section this release. Nothing is called out as breaking upstream, but two items affect existing automation (see §2.5, §2.6).

## 2. API and CLI surface changes to document

All in `content/reference/pear/cli.mdx`, using `<Since v="3.4.0" />`, `<VersionSection>`, `<VersionGate>`, or `[!version since=3.4.0]` per `docs/plans/VERSIONED-REFERENCE-AUTHORING.md`.

### 2.1 `pear blind-peer` — new command group (highest-impact item)

From `cmd/blind-peer.js` + the `cmd/index.js` registration:

- `pear blind-peer start [--trusted-peer <peer>]`—starts a blind peer server. `--trusted-peer` is repeatable (`.multiple()`); each value must be a valid hypercore-id key or the command rejects with `A valid trusted peer key must be specified`. Prints `Blind peer started listening using public key: <publicKey>`.
- `pear blind-peer identity`—prints the running peer's own public key (unconditionally to stdout, even under most flag combinations), then a hint suggesting `pear blind-peer start --trusted-peer=<key>`.
- `pear blind-peer request <key> --peer <peer> [--core-only]`—asks a specific blind peer (`--peer`, required, validated) to seed `<key>`. `<key>` may be a `pear://` link (parsed as a drive link, or a core key under `--core-only`) or a raw hypercore-id key; both `--peer` and `<key>` reject with `ERR_INVALID_INPUT` when missing/invalid. Prints `Requested blind peer to seed {core|drive} <key> (announce: <announce>)`.
- `--json` is declared on the parent `blind-peer` command (applies to all three subcommands).

This is new territory for the CLI reference—no existing section to extend, so it needs a new `##` heading. Group it near `pear seed`/`pear install` ("Distributing and running apps") since it's part of the same seeding/availability story, not with the maintenance commands.

Concept cross-link: **`docs/plans` note—do not re-explain blind peering from scratch.** `content/explanation/availability-and-blind-peering.mdx` and `content/how-to/blind-peering/keep-data-available-with-blind-peering.mdx` already document the concept in depth, built around the standalone `blind-peer-cli` package (`npm i -g blind-peer-cli`) and the `blind-peering` client library. Both need updating to mention `pear blind-peer` as the now-native alternative that ships with the platform—not a new page. See §6.

### 2.2 `pear blind-relay` — new command group

From `cmd/blind-relay.js`:

- `pear blind-relay start [--no-tty] [--stats-interval <milliseconds>]`—runs a blind relay: a host that relays UDX/Protomux stream messages between two peers that cannot hole-punch directly (TURN-like). Confirmed against the upstream `blind-relay` package's own README (protocol + stats shape).
- Live stats table (TTY) / NDJSON-per-line (`--no-tty`) fields: `Public Key`, `Sessions {Accepted,Opened,Closed,Active}`, `Pairings {Requested,Matched,Cancelled,Pending,Active}`, `Streams {Opened,Closed,Errors,Active}`. `--stats-interval` defaults to 500ms with the live UI, 3000ms under `--no-tty`—same convention as `pear seed`.
- `--no-tty`'s hint text: "In the interactive form this appears as an unchecked 'tty' box; checking it passes --no-tty and turns off the live UI"—reuse or paraphrase for the reference prose.

This pairs with the new global `--relay <key>` flag (§2.4)—a blind relay is the server; `--relay` is how a peer *uses* one. Cross-link both directions, and add a concrete pointer to this from `content/explanation/peer-to-peer-demystified.mdx`'s existing (currently vague) "Pear also supports relay paths when direct connectivity fails" sentence (§6).

### 2.3 `pear seed --blind-peer <key>`

- New flag, positioned between `--until-sync` and `--stats-interval` in the flags block. Validated as a z32 key (`ERR_INVALID_INPUT` otherwise). Adds the drive being seeded to the given blind peer; like `--until-sync`, causes the session to exit once the add-to-blind-peer flow completes rather than seeding indefinitely (confirmed: `if (ctrlTTY && (untilSync || blindPeer)) Bare.exit(0)`).
- New live-log lines while it runs: `adding core <key> to blind peer <peer>`, `confirming add core <key> to blind peer <peer>`, `added core <key> to blind peer <peer>`.
- **Table shape change** (not called out in upstream's CHANGELOG, found in the diff): the stats table's standalone `Semantic Version:` row (added in 3.2.0) is replaced by `App:` (`<name>@<version>`, or `-` when the manifest has neither) and a new `Blobs Size:` row. The underlying `--json` `stats` data gains matching `name` and `blobsByteLength` fields—`semver` was already present, `name` is new.
- This is the one-flag alternative to hand-wiring the `blind-peering` client library shown in the existing how-to guide—worth a sentence in `content/how-to/blind-peering/keep-data-available-with-blind-peering.mdx` (§6), not a full rewrite.

### 2.4 Global `--relay <key>` flag

Declared in `lib/cmd.js` alongside `--log-level`, `--sidecar`, `--dht-bootstrap`, `--menu`. Validated in `cmd/index.js`: must be a valid hypercore-id public key or the command prints `--relay <key> must supply a valid public key` and exits 1; otherwise calls `ipc.relay({ publicKey })` before running the actual command. Usable with any command, like `--log-level`. Document it near the new `pear blind-relay` section rather than inventing a "global flags" table that doesn't otherwise exist on this page (the existing convention documents `--menu` under its own heading and `--log-level` under `pear sidecar`).

### 2.5 `pear stage --skip-package-json` and hardened validation

- New flag: `--skip-package-json`—stage a folder without a `package.json`.
- **Behavior change:** `localPkg()` no longer searches upward through parent directories for a `package.json` (confirmed via the `subsystems/sidecar/ops/stage.js` diff—the old recursive-parent-search function is deleted outright, replaced by the new `lib/package.js` which reads exactly `dir`). The `<dir>` arg's hint text is updated to match (the "Pear searches upward through parent directories" sentence is removed upstream).
- If `package.json` is missing and `--skip-package-json` is not passed:
  - Under `--json` or a non-TTY shell: fails immediately with `ERR_INVALID_PROJECT_DIR`, message `package.json not found in <dir>. Pass --skip-package-json to stage without one`.
  - Interactively: prompts for typed `STAGE` confirmation (`ansi.warning` + "The folder does not contain a valid package.json file. To confirm type \"STAGE\"", re-prompting on anything else with `✖ uppercase STAGE to confirm`)—same confirmation pattern as 3.3.0's `pear gc cores`, but note the difference: **scripts get a clear error, not a hang**, since the `--json`/non-TTY branch never reaches the prompt.
  - If `package.json` exists but isn't valid JSON or isn't an object: new error code `ERR_INVALID_MANIFEST` (added to the CLI's error codemap as message-only).
- `staging` output's header line falls back to the directory name when there's no `package.json` name to show (`Staging ${name || dir}`).

This is the item worth a `<Callout type="warn">` similar to 3.3.0's `gc cores` one—it's the only genuinely breaking-ish behavior change this release (a project that relied on the upward parent search now fails, or needs `--skip-package-json`/a `package.json` at the exact stage dir).

### 2.6 `pear cores` — table format changed again

Second rework in two releases (3.3.0 added the name/type columns; this replaces that table wholesale):

- Real header row (`Name  Type  Link  Length  Writable  Size`, bold) plus a separator rule above and below, and between groups of cores belonging to different drives.
- `Type` values are now bare `core`/`blobs` (no brackets—3.3.0's `[core]`/`[blobs]` are gone).
- New `Size` column (byte-formatted, via the existing `byteSize` helper), `Writable` renders `✔` or blank instead of the old `(length: N, writable)` suffix.
- `blobs` rows render dimmed/gray.
- Summary line: `Total cores: N (writable: M)` on one line, `Total size:  <byteSize>` on the next—replaces 3.3.0's `Total cores: N | Writable: M`.
- Empty state: `[ No cores ]`, replacing the bare `No cores`.
- `--json`: each `"tag": "core"` object gains `byteLength`; the closing `final` object gains `byteLength` (total).

This fully supersedes the 3.3.0 sample block at `content/reference/pear/cli.mdx` around the `pear cores` section—replace it rather than layering another `<VersionGate>` on top, and gate the *new* block `since="3.4.0"`, keeping the 3.3.0 block behind its existing gate for readers on that doc-state.

### 2.7 Hints move to stderr, and re-indent

`lib/terminal.js`'s `hint()`: was `stdio.out.write(out)` (title indented 2 spaces, items indented 4); now `stdio.err.write(out + '\n')` (title flush left, items indented 2, trailing blank line). This directly affects the `<Callout type="info">` at `content/reference/pear/cli.mdx` around the `--json`/`pear touch` interaction (lines 92–94 as of 3.3.0), which explicitly says the next-step hint goes to **stdout** and is captured by command substitution—**that becomes false in 3.4.0** and needs a `<Since v="3.4.0" />` correction, not just an addition. Same for the "Next-step hints" section's general framing (§67–81 as of 3.3.0), which never mentions a stream at all—now worth stating explicitly.

### 2.8 Hint text/tabs and internal error-plumbing

`4616ab6` "adjust hint tabs" and `a124322` "use inner sidecar error details in CLI output" are internal formatting/plumbing changes with no distinct user-facing surface beyond what §2.7 already covers—skip separate documentation, matching how 3.3.0's plan treated similarly internal commits (`a0e71f0` "remove tests numbers" is a test-only change, also skip).

## 3. Dependency updates (full audit, per your instruction)

From `git diff v3.3.0 v3.4.0 -- package.json`:

| Package | From | To | Action |
| --- | --- | --- | --- |
| `hyperdht` | (indirect) | `^6.33.2` (direct pin) | Already a documented building-block (`content/reference/building-blocks/hyperdht.mdx`); confirm its `upstreamVersion` pin is current via `check:upstream-pins`—Release Overview already notes Pear 3.3.0 bundled 6.33.1 vs. current 6.33.2, so this may already be settled. |
| `pear-ipc` | `^6.12.0` | `^6.15.0` | No dedicated reference page (internal IPC transport, listed only in the `pear-modules.mdx` catalog table). Check its GitHub releases for anything observably different; likely an "Internal — deps bump" line. |
| `blind-peer` | — (new) | `^3.12.6` | Server library `pear blind-peer` wraps. **No dedicated reference page**—matches existing precedent: `content/explanation/availability-and-blind-peering.mdx` already links `blind-peer` externally rather than documenting its API, because its own README documents almost no public surface beyond a bare `require('blind-peer')` (it's meant to be run via a CLI, not called directly). |
| `blind-peering` | — (new, already a dependency of end-user apps, now also embedded in Pear itself) | `^2.6.3` | Real documented client API (`BlindPeering` class: `addCore`, `addAutobase`, `sendNotification`, `suspend`/`resume`/`close`, etc.)—**but already covered externally** by the existing explanation/how-to pages, which link straight to its README rather than duplicating it in `/reference/helpers/`. Keep that precedent; don't add a new reference page. |
| `blind-relay` | — (new) | `^1.6.1` | Protocol-level (wire messages + stats), already covered inline by §2.2's CLI reference section. No dedicated reference page, same reasoning. |

**Ran `npm run check:upstream-pins`.** Result: `hyperdht`'s existing 6.33.2 pin already matches exactly what Pear 3.4.0 bundles—no change needed. `pear-ipc` has no dedicated reference page to pin. The checker also reports 30 pages of drift (19 patch, 9 minor, 1 major, 6 unpinned)—but every one of those is pre-existing site-wide drift against each package's current npm latest, unrelated to Pear's own 3.4.0 lockfile bump (e.g. `bare-tty`, `bare-ws`, `bare-https`, `hypercore`, `corestore`—none of these moved in Pear's `package.json` between 3.3.0 and 3.4.0). Scoping "full audit" to what this release actually bumped (per your instruction, "every bumped package") means none of that backlog belongs in this PR—same call the 3.3.0 plan made for its own leftover drift (§7.7 there). Left alone as a separate, pre-existing pass.

## 4. Update the Release Overview

New `## <ship-date> — Pear 3.4.0` section, directly below the `changelog:insert` marker and above `## 2026-08-24 — Pear 3.3.0`. Lede: feature release, not breaking by upstream's own classification, but flag the `package.json` upward-search removal (§2.5) as the one item that can break an existing project layout. `### pear (CLI) — v3.4.0` subheadings per §2.1–2.7, deep-linking into the new `cli.mdx` anchors and into `/explanation/availability-and-blind-peering` and `/explanation/peer-to-peer-demystified` for the new commands' concepts. Add module subheadings for `blind-peer`, `blind-peering`, and `blind-relay` (all new to the lockfile) and `pear-ipc` if its bump is observable; fold `hyperdht` in only if its patch delta between what 3.3.0 bundled and 3.4.0 bundles has anything new (likely already covered per §3).

Run `npm run sync:upstream-releases` first and edit its draft rather than hand-writing from scratch.

## 5. Bookkeeping

| File | Change |
| --- | --- |
| `src/lib/docs-versions.ts` | Add `{ label: '3.4', value: '3.4.0', stable: true }`; drop `stable` from 3.3. |
| `scripts/upstream-commits-state.json` | `pear-cli`: `e388e63c7571613fb99d3b519821fbb2db9f78a2` → `16204fad1dc0769ea30048fb096ce2f837dce131` (the `v3.4.0` tag's commit). |
| `scripts/upstream-releases-state.json` | `holepunchto/pear`: `v3.2.0` → `v3.4.0`. |
| `content/reference/pear/cli.mdx` | Tracking callout → 3.4.0. |
| `content/release-overview/index.mdx` | New section (§4). |

## 6. Concept/how-to pages to update (not create)

Discovered mid-pass: `content/explanation/availability-and-blind-peering.mdx` and `content/how-to/blind-peering/*.mdx` already document blind peering in depth, built around the standalone `blind-peer-cli` package and manual `blind-peering` client wiring—predating Pear 3.4.0's native CLI integration. Updates, not new pages:

- `content/explanation/availability-and-blind-peering.mdx`: in "Running a blind peer server," add `pear blind-peer start [--trusted-peer <key>]` as the platform-native alternative to `npm i -g blind-peer-cli`. In "Registering cores from an application," note `pear seed --blind-peer <key>` as a zero-code shortcut for the common single-drive case, alongside the full `BlindPeering` client for multi-core/Autobase registration.
- `content/how-to/blind-peering/keep-data-available-with-blind-peering.mdx`: update the "Two roles" table and "Run your own blind peer" section the same way.
- `content/explanation/peer-to-peer-demystified.mdx`: the "Hole punching and NAT traversal" section's sentence "Pear also supports relay paths when direct connectivity fails" is currently vague/forward-looking—make it concrete with a pointer to `pear blind-relay` and `--relay <key>` (in prose, since explanation pages carry no version axis—express the version as "As of Pear 3.4.0" rather than a `<Since>` badge).

## 7. Output samples

Derive `pear cores`, `pear seed`, `pear stage`, `pear blind-peer`, `pear blind-relay` sample output from source (the scratch clone's `cmd/*.js`, `lib/terminal.js`) since the local `pear` install here is 3.3.0. Flag each for recapture against a real 3.4.0 build.

## 8. Verification

```bash
npm run check:docs-versions
npm run check:upstream-pins
npm run check:internal-links && npm run check:cross-links && npm run check:doctypes
npm run types:check && npm run lint && npm run build
npm run check:examples && npm run check:includes
```

## 9. Flagged: items that needed a decision, not just an edit

1. **New commands vs. new pages.** Given the existing blind-peering explanation/how-to content, the right move is updating it in place rather than writing a parallel concept page—confirmed by reading both files before writing anything new.
2. **`blind-peering`'s real API doesn't get its own reference page.** It has one (unlike `blind-peer`/`blind-relay`), but the docs team already chose to cover it via the explanation/how-to pages rather than `/reference/helpers/`—matching that precedent instead of introducing a second, redundant treatment.
3. **`package.json` upward-search removal is this release's `gc cores`-confirmation-equivalent**—the one item that deserves a warning callout, not just a bullet, because it can silently change which `package.json` a project stages against (or fail where it previously succeeded).
4. **Hint stream change invalidates existing prose**, not just adds new prose—the `--json`/`pear touch` callout's claim that hints go to stdout needs correcting, not appending to.
