# Pear 3.7.0 docs update, how-tos, and launch comms

## Context

Pear 3.6.0 is fully documented on `published` (`2d5a61b3`): `docs-versions.ts` marks 3.6 `stable`, `cli.mdx` says "This page tracks **Pear 3.6.0**", and the Release Overview has the 2026-10-15 entry. Upstream has cut `v3.7.0-rc.0` (2026-10-14) but **no `v3.7.0` tag, GitHub release, or CHANGELOG section exists yet** (checked 2026-11-02). This plan covers what 3.7.0 adds as it stands now, what to re-check when the tag lands, the how-tos the new surface supports, and a short blog post and tweet.

Same process as `docs/plans/PEAR-3.6.0-RELEASE-PLAN.md`: diff upstream, update the reference pages with version gates, register the doc-state, write the Release Overview entry, run the drift checks. First implementation step: copy this plan to `docs/plans/PEAR-3.7.0-RELEASE-PLAN.md`, as earlier releases did.

## 1. Upstream delta (`holepunchto/pear`, scratch clone in the session scratchpad)

Topology repeats 3.6.0's: `v3.6.0` is not an ancestor of `main`, and the rc.0 tag (`371981d`) is a side commit off `ad75867` (CHANGELOG update) that carries 3.6.0's content. The 3.7.0 work is the 9 commits on `main` after rc.0. **Diff trees (`git diff v3.6.0 <v3.7.0>`), not logs.** Today: 10 files, +248/−138.

| Commit | Change | Docs impact |
| --- | --- | --- |
| `056afaf` #1256 | `pear info` output redesign. Labeled rows (`Info:`, `Verlink:`, `App: name@version`, `Product Name:`, `Writable:`, `Drive Key/Fork/Length/Size`, `Blobs Key/Fork/Length/Size`, `Discovery Key:`, `Content Key:`, `Upgrade:`) replace the `keys` and `info` tables. New **`Targets:`** section lists each `by-arch/<platform>` in the drive with its byte size. A loading status shows while it fetches. Multisig rows relabeled (`Multisig Quorum:`, `Public Signing Keys:`). `--json`: `info` gains `targets: [{platform, size}]`, `blobs` gains `key`, and **`retrieving.data.z32` becomes `retrieving.data.link`** (a `pear://` link). Undefined `productName`/`upgrade` rows are omitted | **High.** Headline |
| `69756c1` #1250 | `pear seed` network status. The `Network:` row (or the `--no-tty` network line) shows `joining` (DHT not bootstrapped), `unstable` (degraded), or `unreachable` (offline) in place of peer and transfer stats. `--json` `stats` gains `dht: {bootstrapped, degraded, online}` | Medium |
| `d3f0537` #1247 | `pear seed` exits with code 1 when the sidecar connection closes. TTY prints `x-x sidecar lost`, `--no-tty` prints `x-x sidecar disconnected`, `--json` emits an `error` object with `code: ERR_CONNECTION`, `message: sidecar disconnected` | Medium. Makes `pear seed` supervisable |
| `36068ab` #1258 | `pear seed` `Seeding:` row shows the parsed link's origin, not the raw argument (so no quotes from a quoted link). No longer bold | Low. Check what a verlink argument renders as |
| `321eed3` #1254 | `pear --menu` groups commands into **Ship** (touch, stage, seed, build), **Install & inspect** (info, changelog, dump, install), **Release** (provision, multisig …), **Network** (blind-relay, blind-peer, identity …), and **Platform** (collapsed: sidecar, cores, gc, data, versions, help), each with a help panel. `bare-tui-paparam` 0.1.0 → 0.2.0 | Medium. How-to and screenshots |
| `f886c26` #1257 | **`pear sidecar inspect` removed.** Drops `bare-inspector` and `pear-inspect` | Breaking. Reference callout |
| `748e0f5` #1255 | **`pear dump` accepts only `pear://` links and verlinks.** `file:` URLs and local directory paths are rejected. Help hints on `info`, `dump`, `changelog` shortened | Breaking. Was never documented as an input on `cli.mdx` |
| `4f68336` #1253 | `pear cores` no longer fails on a drive whose `package.json` cannot be decoded. The name falls back to `-` | Fix bullet only |
| `debb14e` #1252 | README refresh | Skip |

**Dependencies:** only `bare-tui-paparam` moved, plus the two removed inspector packages. `bare-runtime` and every P2P module resolve to the same versions as 3.6.0, so there is **no Bare callout change and no companion P2P module-updates entry**. Re-check on the tag.

### Open upstream PRs to re-check on release day

| PR | State | If it lands in 3.7.0 |
| --- | --- | --- |
| #1260 Rename content → blobs | Open, not draft (2026-10-31) | `pear info` drops `Content Key:`. `pear seed` relabels `Content Key:` → `Blobs Key:` and moves it above `Discovery Key:` (`--no-tty`: `... blobs key`). `pear gc cores` prints `Cleared blobs ~`. Hints say "blobs core". Update the seed samples in `cli.mdx` (~481, ~500) and `p2p/getting-started/build-a-peer-to-peer-chat/ship.mdx` (~89) behind a 3.7.0 gate. Likely to land |
| #1259 Implement `pear make` | Draft (2026-11-02), needs `pear-ipc` #68 | New command that builds a Pear **CLI** app from `package.json` `bin` (`--host`, `--path`, `--name`, `--no-install`, `--json`). It installs `pear-make` from a pear link after a typed `INSTALL` confirmation. It would become the headline, need a new `cli.mdx` section, and justify a how-to (§4 item 4). Likely 3.8 |
| #1214 Pear tip | Draft since 2026-09-11 | Same as in 3.6.0. Ignore unless it moves |

## 2. Reference changes (`content/pear/reference/pear/cli.mdx`)

Use `<Since v="3.7.0" />`, `<VersionGate since="3.7.0">`, and `<Until v="3.7.0">` per `docs/plans/VERSIONED-REFERENCE-AUTHORING.md`. Keep each 3.6.0 sample under `<VersionGate since="3.6.0" until="3.7.0">`, following the existing pattern in the `pear seed` section (~470–506).

1. **`pear info`** (~714–780). Gate the current table sample and the "`writable` row between `productName` and `length`" sentence to 3.6.0. Add the 3.7.0 sample, captured on a real binary, with a staged multi-arch drive so `Targets:` shows. Explain `Targets:`: one line per `by-arch/<platform-arch>` folder, size summed from blob byte lengths, omitted when the drive has no `by-arch/`. Update the `--json` tag table: `retrieving` → `link` <Since 3.7.0> (`z32` until 3.7.0), `info` adds `targets`, and `blobs` adds `key`. Update the JSON sample. Update the `pear-info-writable` anchor text ("`Writable:` row"). Add a breaking-change callout: scripts that parse the human table break, so use `--json`.
2. **`pear seed`** (~449–546). New `<Since v="3.7.0" />` callouts for network status (the three words, what each DHT state means, and `stats.dht`) and for exit on sidecar loss (exit code, three output forms). Add one sentence on the `Seeding:` row normalizing the link. If #1260 lands, add a 3.7.0 sample with `Blobs Key:` and leave the 3.6.0 sample gated.
3. **`pear sidecar`** (~901–915). Mark the `inspect` row `<Until v="3.7.0" />` and add a removal callout (no replacement). Capture the error 3.7.0 prints for `pear sidecar inspect`.
4. **`pear dump`** (~784). `<Since v="3.7.0" />`: `<link>` must be a `pear://` link or verlink. 3.6.0 and earlier also accepted a `file:` URL or a local directory path. Capture the 3.7.0 error text.
5. **`## Interactive menu`** (~64). One sentence on groups, linking the how-to. Also `content/_snippets/_interactive-menu-callout.mdx` if it describes the list.
6. **`pear cores`**: no prose. Fix bullet in the Release Overview only.
7. Tracking callout (~18) → "This page tracks **Pear 3.7.0**".

Other pages that quote the changed output:

| Page | Change |
| --- | --- |
| `content/pear/how-to/operate-an-app/manual-deployment/preflight-a-release.mdx` (~68) | "the `writable` row" → `Writable:` row (3.7.0). The `jq` gates read `--json` `info`, which is unchanged, so no code change |
| `…/manual-deployment/troubleshoot-desktop-releases.mdx` (~128), `…/multisig/troubleshoot-multisig.mdx` (~60) | Same wording fix. Add a desktop-releases entry: when `pear install` reports `Not found: …/by-arch/<platform>`, run `pear info <link>` and read `Targets:` |
| `content/pear/explanation/availability-and-blind-peering.mdx` (~50–56) | "The `project` and `content` rows" → `Drive Key:` and `Content Key:` (or `Blobs Key:` if #1260 lands) |
| `content/pear/how-to/browse-commands-with-the-interactive-menu.mdx` | §4 item 1 |
| `content/p2p/getting-started/build-a-peer-to-peer-chat/ship.mdx` (~89) | Only if #1260 lands |
| `public/.well-known/agent-skills/pear-cli/SKILL.md` | New `pear info` shape and `targets`, seed status and exit code, `sidecar inspect` and `dump` local-path removals |

Re-grep `content/` and `public/` for `sidecar inspect`, `Content Key`, `"z32"`, `pear dump` with a path, and `info              value` before opening the PR.

## 3. Release Overview and bookkeeping

`content/pear/release-overview/index.mdx`: run `npm run sync:upstream-releases` (with `GITHUB_TOKEN`), then edit its draft into `## <ship-date> — Pear 3.7.0` below `changelog:insert`.

- **Lede:** feature release on 3.6.0. `pear info` shows which platforms a release contains, and `pear seed` reports network state and exits when its sidecar goes away, so a supervisor can restart it. List what can break a script: `pear sidecar inspect` removed, `pear dump` rejects local paths, the human `pear info` output is new, `--json` `retrieving` reports `link` instead of `z32`, and the seed network line can be a status word (plus the #1260 renames if they land).
- `### pear (CLI) — v3.7.0`: Added (`Targets:` / `targets`, `blobs.key`, seed `dht` status, menu groups), Changed (info layout, `retrieving.link`, seed exit on sidecar loss, `Seeding:` link), Removed (`sidecar inspect`, `dump` local sources), Fixed (`pear cores` decode error).
- `### Internal — deps bump`: `bare-tui-paparam` 0.2.0. Keep the "apps pin their own copies" callout pattern only if the tag's lockfile moves a bundled P2P or Bare module.

| File | Change |
| --- | --- |
| `src/lib/docs-versions.ts` | Draft PR: add `{ label: '3.7', value: '3.7.0', prerelease: true }` and leave 3.6 `stable`. On release day, make 3.7 stable and drop `stable` from 3.6 |
| `scripts/upstream-commits-state.json` | `pear-cli` → the latest `cmd/index.js` commit reachable from `v3.7.0` (`gh api "repos/holepunchto/pear/commits?path=cmd/index.js&sha=main&per_page=1"`, then confirm it is reachable from the tag). Today that is `748e0f5` |
| `scripts/upstream-releases-state.json` | `holepunchto/pear`: `v3.6.0` → `v3.7.0` |

Keep the PR in draft until the tag exists (3.4.0's revert lesson). Branch `docs/pear-3.7.0`, cut from fresh `origin/published`, PR against `published`.

## 4. How-tos

There is enough new content for one new page and several edits. Ranked:

1. **Edit `browse-commands-with-the-interactive-menu.mdx`** (in the release PR). Rewrite "Find a command" around the five groups and the help panel, note that Platform starts collapsed, and replace `public/pear-menu-find-command.png` with a 3.7.0 capture. Bump the "Requires" callout to mention groups from 3.7.0.
2. **New: Run an always-on seeder** (`content/pear/how-to/operate-an-app/run-an-always-on-seeder.mdx`, **follow-up PR**). This was deferred in the 3.6.0 plan (§6 item 2), and 3.7.0 now makes it worth writing: exit code 1 on sidecar loss lets systemd `Restart=on-failure` or launchd `KeepAlive` restart it, `stats.dht` and the status words give a health signal, 3.6.0's uptime and `App:` refresh cover long runs, and `--blind-peer` keeps data available when the box is down. Include a systemd unit, a launchd plist, and a `--json` health check with `jq` on `stats.dht.online` and `uptime`. Link, do not repeat, `p2p/how-to/blind-peering/keep-data-available-with-blind-peering.mdx`. Register it in `src/lib/pear-tree.ts` and `content/pear/how-to/operate-an-app/index.mdx`.
3. **Edit: check a staged release's platforms.** Add an "After staging" step to `preflight-a-release.mdx`: `pear info --json <link> | jq '[.data.targets[]?.platform]'` compared with the expected list. Mirror it in `github-actions/build-and-sign-in-ci.mdx` or `publish-with-github-actions.mdx`, wherever the stage step lives. This covers the gap `pear build --json` leaves: what actually reached the link.
4. **Conditional: Package a CLI app with `pear make`.** Only if #1259 ships in 3.7.0. Otherwise it goes in the 3.8.0 plan.

## 5. Launch comms: `~/Documents/tether/drafts/pear/`

**Order:** do not start on the blog until the docs work (§2, §3, and the §4 item 1 and item 3 edits) is done. Then stop and give the user a high-level summary for review: which 3.7.0 features the post will use, and the USP of each, meaning what Pear now does that a reader can't get another way. Write the drafts only after the user reacts to that summary.

Starting candidates for that summary, to confirm against the finished docs and captured output:

- **`pear info` `Targets:`.** Why it matters: you can read which platforms a peer-to-peer release actually carries, and how big each one is, straight from the link. No download, and no access to the build machine. This closes the loop with 3.6.0's `pear build --json`, which checks what was built: now you can check what reached the link.
- **`pear seed` exits on sidecar loss, and reports network status.** Why it matters: a seeder is the always-on piece of a P2P release. An exit code and a DHT health signal let standard supervisors (systemd, launchd) keep it running with no custom wrapper.
- **Grouped `pear --menu`.** Why it matters: the CLI is laid out by workflow (Ship, Install & inspect, Release, Network, Platform), so a new user learns the deploy order from the menu itself.
- **Leaner surface.** Removing `sidecar inspect` and `dump` local paths cuts a remote-debugging entry point and an input path with no P2P purpose. Frame this as a breaking-change note, not a selling point.
- **`pear make`**, only if #1259 ships: Pear packages CLI apps that update from a pear link, not just desktop apps. It would become the lead USP.

After the user signs off, create `~/Documents/tether/drafts/pear/` (beside `bare/`):

- `pear-3.7.0-announcement.md`: about 450–600 words, roughly a third of the 3.6.0 post. Follow the voice memory: terse, mechanism first, Title Case title that states the news, flat sentences, sections named for their topic, no "just works", "shows its work", "simply", or em dashes. Working title: **"Pear 3.7: Release Targets in `pear info`, Supervisable Seeders"**. If `pear make` ships, it leads instead.
  1. Lede (two sentences with versions) and a three-to-four-bullet summary with anchors.
  2. `pear info` lists release targets: a before/after snippet (3.6.0 table vs 3.7.0 labeled rows with `Targets:`), why it matters (confirm a stage carries every platform before users run `pear install`), and the `jq` one-liner. Link `cli#pear-info` and the preflight how-to.
  3. Run `pear seed` under a supervisor: the exit code on sidecar loss, the status words, `stats.dht`, and a five-line systemd snippet. Link `cli#pear-seed` (and the seeder how-to if it merged).
  4. Grouped `--menu`: two sentences and the new screenshot.
  5. Changes that can break scripts: `sidecar inspect`, `dump` local paths, `pear info` text output and `retrieving.link` (plus #1260 renames).
  6. Get Pear 3.7.0: OTA for v3 installs, `npm i -g pear`, `pear versions`, and a link to the Release Overview entry. Close with the Pear Development group on Keet, as earlier posts do.
- `pear-3.7.0-tweet.md`: a single post of about 250 characters with the link counted, no code fences, plus a three-post thread option (info targets, seed supervision, breaking changes and link).
- `fact-check.md` (as in `drafts/bare/`): each claim with the upstream commit and the command run that confirms it.

Use doc URLs of the form `https://docs.pears.com/pear/reference/pear/cli/#pear-info`. Publish only after the docs PR merges and the tag ships.

## 6. Release-day sequence

1. Confirm the `v3.7.0` tag and release exist, and record the date. Re-diff `v3.6.0..v3.7.0` against §1. Read the CHANGELOG `v3.7.0` section and reconcile §3. Decide #1260 and #1259.
2. Build and run the tag isolated on a local testnet (memory: "Pear CLI local verification", using the Python pty to capture the live seed table; the sidecar spins down after 60 s). Capture: `pear info` (human and `--json`, multi-arch drive, multisig link), `pear seed` with the sidecar killed mid-session (exit code and all three outputs), the network status words (start offline for `unreachable`/`joining`), `Seeding:` for a verlink argument, `pear sidecar inspect` and `pear dump ./dir` errors, and `pear --menu` screenshots. Replace every source-derived sample.
3. Write §2 and §3 and the §4 item 1 and item 3 edits. Item 2 follows in its own PR.
4. Hand the user the §5 feature and USP summary. Write the drafts with the captured output only after their review.

## 7. Verification

In a worktree (memory: `cp -Rc` the main `node_modules`, revert `next-env.d.ts` after the build), with `export GITHUB_TOKEN=$(gh auth token)`:

```bash
npm run check:docs-versions
npm run check:upstream-pins
npm run check:upstream-commits -- --check
npm run check:internal-links && npm run check:cross-links && npm run check:doctypes
npm run check:agent-ready
npm run types:check && npm run lint && npm run build
npm run check:examples && npm run check:includes
vale content/pear content/p2p/getting-started
```

Then check the built `cli` page renders both the 3.6 and 3.7 samples through the version dropdown, and grep the new MDX for a literal `*/` inside `{/* */}` comments (memory gotcha). For the blog, grep for the banned phrases and em dashes, and open every link.

## Open questions

1. Does #1260 (content → blobs) land in 3.7.0? It decides the seed samples and part of the breaking-change list.
2. Does `pear make` (#1259) ship in 3.7.0? If so, it becomes the headline and needs its own section and how-to.
3. What did `pear seed` do on 3.6.0 when the sidecar died: hang, or exit 0? The answer sets the "before" wording in the reference, the Release Overview, and the blog.

## Findings from the 2026-11-02 capture run

Captured on `holepunchto/pear` `main` at `056afaf` (`3.7.0-rc.0` plus the nine commits), on a local HyperDHT testnet, with `v3.6.0` run beside it. Re-run everything on the tag.

1. **Open question 3 answered.** On `v3.6.0`, `pear seed` does not exit when the sidecar is killed. The process keeps running with the last stats frame frozen and prints nothing. On `main` it prints `x-x sidecar lost` (live view) or `x-x sidecar disconnected` (`--no-tty`), or an `error` object with `code: ERR_CONNECTION` (`--json`), and exits 1. All three forms were captured.
2. **`pear dump` is not a breaking change.** On `v3.6.0`, `pear dump <dir>` and `pear dump file:///<dir>` both already fail with `✖ A valid pear link must be specified.`, because `lib/link.js` (added in 3.2.0) rejects any link without a drive key. Only the help text (`May be file:, pear: or dir`) and the dead local-source code changed. The reference and the Release Overview treat it as a clean-up, not a break, and §1's "Breaking" label is wrong.
3. **The `jq` one-liner in §4 item 3 was wrong.** `--json` output is one JSON document per line, so `jq '[.data.targets[]?.platform]'` prints `[]` for every line that is not the `info` line. The documented form selects the line: `jq -r 'select(.tag == "info") | .data.targets[].platform'`. The gate form (missing platforms named, exit 4 on a Pear without `targets`) was run against the captured output.
4. **The USP holds, with a condition.** A second peer with a fresh platform directory ran `pear info <link>` against a seeded link and read `Targets:` with sizes. Its platform directory grew by 44 KB for a 13.6 MB release, so the blobs are not downloaded. It needs a reachable seeder: the first attempt, 8 seconds after the seeder started, printed `[ Empty ]`, and the retry 40 seconds later worked.
5. **Network status words were not reproduced live.** Pointing the sidecar at a dead bootstrap node, and killing the testnet mid-seed, both left `dht.online` true: `joining` is only visible before the bootstrap query finishes, and `online`/`degraded` need real traffic loss to flip. The words in the reference come from `cmd/seed.js` and `dht-rpc`'s `health.js`. Capture `unstable` and `unreachable` on the tag with the machine's network actually down.
6. `pear sidecar inspect` on `main` prints `✖ Unexpected argument  'inspect'` and the `pear sidecar` help, exit 1. `Seeding:` for a verlink argument and for a quoted link both print `pear://<key>`.
7. The `--menu` captures were taken through a pty and rendered to PNG from the screen buffer. Recapture on the tag if the groups or help text change.
