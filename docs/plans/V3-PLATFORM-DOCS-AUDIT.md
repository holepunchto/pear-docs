# Pear v3 platform docs audit — task & progress

**Branch:** `feat/add-json-flags-and-new-version-updates`
**Started:** 2026-07-27 · **Last updated:** 2026-07-28
**Status:** in progress — see [Task board](#task-board)

Living handover doc. Another agent should be able to pick this up cold: read
[Version landscape](#version-landscape) and [Method](#method), then work the
[Task board](#task-board) top to bottom.

---

## Goal

Two threads of work, both aimed at reference-doc *correctness*:

1. **`--json` / scripting onboarding** (the original ask, from a Slack thread — Andrei:
   *"maybe `--json` is under-documented, e.g. `pear info --json`, most commands have this
   flag"*; Keith: scripts depending on exact human-readable output are fragile).
2. **Bring reference docs up to date with the current platform** and purge
   confidently-stated-but-false API claims.

**Non-goal:** completeness. We are not adding docs for every undocumented symbol.
We fix things that are *wrong*. Undocumented-but-real symbols are noted, not necessarily added.

---

## Version landscape

**TARGET VERSION: 3.1.0** — confirmed by the requester. Concretely that means the tag
**`v3.1.0-rc.1`** (`ce1bb758d2`), the tip of the 3.1.0 line. Verified 2026-07-28:

| Thing | Version | Notes |
| --- | --- | --- |
| **Doc target** | **`v3.1.0-rc.1`** | Tip of the 3.1.0 line. All `cmd/*.js` source links are pinned here. |
| Latest *stable* release | `v3.0.1` | GitHub release exists only for `v3.0.0`. This is what most users have. |
| Locally installed CLI | `3.0.1` | 3.1.0-rc.1 also installed side-by-side in scratch — see [runtime verification](#-310-is-now-runtime-verified-gap-closed-2026-07-28) |
| npm `pear` package | `3.0.0` (`latest`) | Only a bootstrap shim that spawns the real binary; **not** the platform version. Don't use it to infer the platform version. |
| `v3.1.0-rc.0` | tagged 2026-07-10 | Superseded by `-rc.1`. Diverged from `v3.0.1` (1 ahead — a bare version bump — but 10 behind), which is why it initially looked abandoned. |
| `main` / `v3.2.0-rc.0` | `3.2.0-rc.0` | Forward edge, beyond our target. |

**Key finding that makes this tractable:** `cmd/index.js` at `v3.1.0-rc.1` is **byte-identical
to `main`**. So the CLI surface we document for 3.1.0 is also current on the forward edge —
no divergence to reconcile at the command/flag level.

### ✅ 3.1.0 is now RUNTIME-verified (gap closed 2026-07-28)

The earlier caveat — that 3.1.0 claims were source-only — **has been closed**. 3.1.0-rc.1 was
installed and every claim re-checked by running it.

**How to get a 3.1.0 build without disturbing a production install.** The platform ships
three release lines, listed in `package.json`'s `upgrade` field:

| Channel | Link |
| --- | --- |
| `production` | `pear://smw4thqaqed9iq6bae7a9cxd4fesruixgkafe38jny33ahs33igy` |
| `stage` | `pear://ixhpogtfu9fd3drcbwqf7rebab8wsr1idwmmqchaxuoby4math9o` |
| `dev` | `pear://w35om9zdgi6nwdbtjhk3m378tne3izsnotpd7syfiebgzcd6czio` |

**`stage` serves 3.1.0-rc.1.** Confirm a channel's version *without installing* via
`pear dump pear://<link>/package.json -`. Then install **side-by-side** with `--to` rather
than switching lines (`npx pear-install <link>` replaces the platform):

```sh
pear install pear://ixhpogtfu9fd3drcbwqf7rebab8wsr1idwmmqchaxuoby4math9o --to /some/scratch/pear310
/some/scratch/pear310/pear versions      # -> pear: 3.1.0-rc.1
```

**Safety check done first:** the platform DB schema is identical between the two versions —
`subsystems/sidecar/lib/db.js` diffs clean and the whole `spec/` tree matches at sha level —
so running 3.1.0 against the shared platform dir (`~/Library/Application Support/pear`;
there is **no env var** to relocate it) cannot trigger a schema migration. It does take over
the sidecar, which is harmless and self-healing. The 3.0.1 binary was also backed up to
`scratchpad/pear-3.0.1.backup`.

Verified on the real 3.1.0-rc.1 binary: `pear cores` output format and its exact NDJSON
(`tag:"core"` `{link,writable}`, final `{success,count,writable}`); sidecar help showing
**only** `--log-level`; `touch --vanity` present; `multisig link --vanity` present;
`pear versions --json` still emitting **no** `final` tag; and the whole `--json` position
matrix unchanged from 3.0.1.

#### One doc error this caught

**The `pear.log` line format I had documented was wrong** — I had derived it from the
console-formatting call and the PR description. Real file output:

```
INF   2026-07-28T18:29:43.869Z [ sidecar ] - Sidecar Booted
```

`bare-file-logger` writes `label.padEnd(5) + ' ' + toISOString() + ' ' + format(...)`, so the
**level comes first, then the timestamp** — whereas the *terminal* prints timestamp-first
(`logger.js` does `format(new Date().toISOString(), names[level], …)`). The two differ.
`cli.mdx` now documents the file format with the real example and notes the terminal
difference. Lesson: source-reading gave the wrong answer here because two different format
strings feed two different sinks.

#### `--vanity` behaviour confirmed end-to-end

- 2-char prefix → stdout is exactly `pear://abpcxcgk…` (prefix honoured), stderr empty, so
  `LINK=$(pear touch --vanity ab)` is safe
- 5-char prefix → `Warning: Vanity strings longer than 4 characters may take a long time to
  generate.` on **stderr**, stdout empty — the exact stdout/stderr split Keith asked about
- non-z32 (`0`) → `✖ Vanity key must contain only z32 characters (Invalid character in base32
  input: "0" …)`

⚠️ **Upstream nit worth reporting:** that *error* goes to **stdout**, not stderr. So a failing
`LINK=$(pear touch --vanity 0)` captures the error text into `$LINK` instead of failing
cleanly. Not currently documented; candidate for the original Slack thread's stderr fix.

### Dependency churn v3.0.1 → v3.1.0-rc.1

Worth knowing because it explains several CLI changes:

- **added** `bare-file-logger` (drives the new persisted-log behaviour), `bare-worker`,
  `hypercore` (now a direct dep)
- **removed** `bare-hrtime`
- **major bump** `bare-subprocess` `^5.1.5` → `^6.1.0`
- bumps: `bare-daemon`, `bare-events`, `bare-fs` (4.1→4.7), `bare-os`, `bare-path`,
  `bare-stream`, `bare-tty`, `pear-gracedown`, `pear-inspect`, `pear-ipc`
- **apparent downgrades** `pear-build ^1.1.1 → ^1.0.0`, `pear-install ^1.2.2 → ^1.0.8`
  — an artifact of the 3.1.0 line branching before those v3.0.1 bumps. Harmless in
  practice because the caret ranges still resolve to the same latest 1.x, but do not read
  the declared floors as "3.1.0 ships older pear-build/pear-install".

`bare-subprocess` going 5→6 is a **major** bump and there is a
`content/reference/bare/modules/bare-subprocess.mdx` page. That page tracks the bare module
on its own cadence (see the `bare-refgen` pipeline), so it was **not** touched here — but it
is worth a separate look.

The platform also self-updates OTA from the `production` link above, so the GitHub tag is not
the only release surface — hence the `pear dump …/package.json -` recipe for checking what a
channel actually serves.

### The 3.1.0 changes — all now documented

Derived from `gh api repos/holepunchto/pear/compare/v3.0.1...v3.1.0-rc.1`. Every item below
has been written up in `cli.mdx`; kept here as the provenance record.

- **`pear cores`** — new CLI command (`cmd/cores.js`, PR #1145, merged 2026-07-23).
- `pear info` verlink output (#1151)
- `pear info` / `pear changelog` fixes (#1137) — this is what fixed the
  `Cannot read properties of undefined (reading 'key')` failure seen on 3.0.1
- `Fix output of pear --unknown-flags` (#1155) — relevant, we document unknown-flag
  behaviour for the removed `pear init`
- multisig password confirmation (#1135) + backspace in password input (#1134)
- Persist sidecar errors (#1138)
- Multithreaded vanity (#1131)
- Linux libatomic check (#1140), Windows Bare detection (#1153)
- provision err fixes (#1150)

---

## Method

What made the earlier findings trustworthy — **keep doing this**:

1. **Test against the real thing, don't read prose.** Run the actual CLI; `npm pack` the
   actual package into a scratch dir and read *its* source; instantiate and call the API
   in plain Node/Bare. Most of these libraries need no network (hypercore, hyperbee,
   corestore, localdrive, protomux, compact-encoding, secretstream all work against a
   tmpdir or in-memory streams).
2. **Verify `[src]` line-number citations.** A large share of real defects are citations
   pointing at the wrong function or past EOF. Fetch the file at the pinned tag
   (`gh api "repos/<org>/<repo>/contents/<path>?ref=<tag>" -H "Accept: application/vnd.github.raw"`)
   and confirm the line.
3. **Distrust `generated/refs/*`** as ground truth. Those snapshots are from 2026-06-11 /
   2026-07-14. Their `improvement-plan.md` "Parity 100%" only means *our documented
   symbols existed at that snapshot* — it does **not** mean our descriptions,
   signatures, defaults, or line numbers are right. Use them as leads only.
4. **Upstream-inherited bugs still count** if the doc is demonstrably broken (e.g. a
   code sample that throws). Note the provenance, fix it anyway.
5. **Deliberate simplifications are not bugs.** `hyperswarm.mdx` intentionally collapses
   some nested config objects; `peerInfo.ban(banStatus = false)` matches upstream's own
   simplification. Only flag what is *false*.

### Validation (run after every edit)

```sh
vale --minAlertLevel=error content/<changed>.mdx   # vale is installed locally
npx tsx scripts/check-internal-links.ts
npx tsx scripts/check-includes.ts
npx tsx scripts/check-doctypes.ts
```

`check-doctypes` always warns `content/release-overview/index.mdx: no rule for this path
(skipped)` — pre-existing, ignore. Fuller set in `.github/workflows/docs-lint.yml`.

> ⚠️ **Do not run `npx tsx scripts/gen-curated.ts --check` casually.** Despite the `--check`
> name it **writes**: it rewrote five `generated/refs/*/curated-preview.mdx` files
> (−1730/+467 lines), dropping `Type` columns and blanking descriptions — i.e. the
> generator's output is *lower fidelity* than the curated pages, which is the whole reason
> those pages are hand-maintained. Those writes were reverted with `git checkout --`.
> If you do run it, check `git status generated/` afterwards and revert unintended churn.

### Naming gotchas (cost time already)

| Doc slug | Real npm package | GitHub repo |
| --- | --- | --- |
| `secretstream` | `@hyperswarm/secret-stream` | `holepunchto/hyperswarm-secret-stream` |
| `mirrordrive` | `mirror-drive` | `holepunchto/mirror-drive` |

---

## Task board

### ✅ Done — Pear platform pages

| File | Change |
| --- | --- |
| `content/reference/pear/cli.mdx` | Added **"Scripting with `--json`"** section: NDJSON contract (`{cmd,tag,data}` per line, terminal `tag:"final"` with `success`), filter on `tag` not line count; `pear touch` exception (bare link, `LINK=$(pear touch)` safe); **gotcha: `--json` must precede a subcommand** (`pear data --json dht`, *not* `pear data dht --json`, which the subcommand parser rejects). Also inline note in the `pear touch` section. |
| `content/reference/pear/cli.mdx` | **Fixed false claim:** doc said `pear -v --json` prints "a single JSON object"; it actually throws `UNKNOWN_FLAG: json`. Repointed to `pear versions --json`. |
| `content/reference/pear/api.mdx` | **Removed 3 fabricated APIs** (verified absent by live `bare -e` on 3 Bare versions): `Bare.suspended`, `Bare.exiting`, `Addon.unload`. |
| `content/reference/pear/api.mdx` | Added real-but-undocumented: `Bare.wakeup()`, `Bare.on('wakeup')`, `Addon.cache`, `Addon.host`, `addon.url`, `addon.exports`, `thread.wakeup()`, `thread.terminate()`, and a whole missing **`Bare.IPC`** section. Added `riscv64` to `Bare.arch`. |
| `content/reference/pear/runtime.mdx` | Added **Lifecycle** section — `pear.ready()` / `pear.close()` were entirely undocumented despite being required for clean teardown. |
| `content/reference/pear/configuration.mdx` | `pear.assets` **DEPRECATED → REMOVED** with past-tense rewrite. Four corroborating checks: `pear-state@1.1.0` never populates it from `package.json`; `pear gc assets` subcommand gone from v3.0.1; zero refs in `pear`/`pear-runtime`/`pear-runtime-updater`; sole consumer `pear-electron` is pre-v3. Left a maintainer note. Fixed broken anchor `#pearappassets--string` → `#pear-app-assets`. |

**`pear.pre` investigated, no change needed** — correctly marked REMOVED. `pear-electron`'s
README still tells you to set it, but `pear-electron@1.7.28` (2026-02-09, five months
*before* `pear@3.0.0`) still depends on `pear-state@^1.0.2` + `pear-cmd`/`pear-tryboot`,
i.e. the removed `pear run` stack. Even its `1.9.0-rc.0` prerelease is unchanged.
**`pear-electron` has not been updated for Pear v3.**

### ✅ Done — module reference pages (2 of 12)

| File | Change |
| --- | --- |
| `content/reference/building-blocks/hyperswarm.mdx` | 3 `[src]` citations pointed at unrelated functions. `discovery.refresh()` → `lib/peer-discovery.js#L310` (was `#L159`, the internal no-arg version); `discovery.destroy()` → `lib/peer-discovery.js#L333` (was `index.js#L588`, actually `swarm.destroy`); `peerInfo.topics` → `lib/peer-info.js#L33` (was `index.js#L659`, actually `swarm.topics()`). All substantive claims (defaults `maxPeers:64`, `maxParallel:3`, etc.) verified correct against v4.17.0 + live instantiation. |
| `content/reference/helpers/secretstream.mdx` | **Install command 404'd** — `npm i hyperswarm-secret-stream` → `@hyperswarm/secret-stream`. **Code example threw** — `new SecretStream({autoStart:false})` passes opts as `isInitiator`, dies with `isInitiator should be a boolean`; → `new SecretStream(true, null, {autoStart:false})` (bug inherited from upstream README). 3 `[src]` lines wrong incl. one past EOF (`#L775` in a 645-line file). |

### 📊 Module-page audit status (12 pages)

Two rounds of parallel audits ran; **both were cut short by session limits.** Round 2 was a
`Workflow` (audit → adversarial-verify pipeline) in which **10 of 14 agents died and no
verify stage completed at all**. Net effect: a lot of edits are in the tree with *no
independent verification*.

| Page | Edits in tree | Audit | Independently verified |
| --- | --- | --- | --- |
| `hyperswarm` | 3 citation fixes | ✅ complete | ✅ auditor self-validated + reported |
| `secretstream` | install cmd, throwing example, 3 citations | ✅ complete | ✅ auditor self-validated + reported |
| `protomux` | 4 substantive fixes | ✅ complete, very thorough | ❌ **verify agent died** |
| `localdrive` | ~9 lines | ✅ complete | ❌ **verify agent died** |
| `mirrordrive` | ~10 lines | ✅ complete | ❌ **verify agent died** |
| `compact-encoding` | ~35 lines | ✅ complete | ❌ **verify agent died** + ⚠️ *safety classifier was unavailable when reviewing this agent's work* |
| `autobase` | ~15 lines | ❌ **died mid-edit** | ❌ |
| `hyperdht` | ~6 lines | ❌ **died mid-edit** | ❌ |
| `corestore` | ~10 lines | ❌ **died mid-edit** | ❌ |
| `hypercore` | 3 fixes (incl. a nonexistent option) | ✅ **done by hand** (agent died 3×) | ✅ self-verified live + mechanical citation sweep |
| `hyperbee` | 2 fixes | ✅ complete (agent) | ✅ sample re-verified live by hand |
| `hyperdrive` | 5 fixes | ✅ **done by hand** (agent died 3×) | ✅ self-verified against source |

#### ✅ Manual spot-verification of the unverified edits (done 2026-07-28)

Since no automated verify stage survived, the landed edits were spot-checked by hand against
upstream source at the pinned tags and by live execution. **All 12 checks confirmed the
agents' fixes — no regressions, nothing reverted.**

| Claim checked | Method | Result |
| --- | --- | --- |
| autobase `ackInterval` default `1000`→`10000` | `DEFAULT_ACK_INTERVAL = 10_000` (index.js L43) | ✅ correct |
| autobase 4 event `[src]` lines (L2060/L838/L1502/L1712) | read each line at v7.28.1 | ✅ all 4 land exactly on `emit('update')`, `emit('interrupt', …)`, `emit('fast-forward', to, from)`, `emit('is-indexer')` |
| autobase "interrupt does *not* close the base" | `_interrupt()` L667-673 only sets `_interrupting`/`interrupted` and throws; the dependency runs the other way — `_close()` sets `_interrupting` | ✅ correct |
| autobase "later `append()` calls reject" | `_appendBatch` L1018 `if (this._interrupting) throw new Error('Autobase is closing')` | ✅ correct |
| localdrive `roots` option removed from table | `grep -c roots index.js@v2.2.1` → **0** | ✅ option does not exist; removal right |
| localdrive `entry()` opts table replaced with `follow` | L47 `if (!opts \|\| !opts.follow)` | ✅ correct — old table listed `key`/`value`/`mtime`, which are *return* fields (same defect class as the hyperdht one) |
| mirror-drive iterator `op` values | source yields `'remove'`, `'equal'`, `'change'`, `'add'` (L262/280/295/304) | ✅ correct; old `'put'`/`'del'` was wrong |
| mirror-drive `'equal'` gated on `includeEquals` | L83 + L279-280 | ✅ correct |
| mirror-drive `preloaded` citation → L187 | `sed -n 187p` → `m.emit('preloaded')` | ✅ correct |
| protomux `alloc` default | L339-340 `alloc \|\| (typeof stream.alloc === 'function' ? stream.alloc.bind(stream) : b4a.allocUnsafe)` | ✅ correct — stream's own alloc wins |
| protomux `ChannelKey.id` exact-key semantics | `toKey` L832-834 `protocol + '##' + hex(id)` | ✅ correct |
| **corestore `ASSERTION` → `ERR_ASSERTION`** | ⚠️ source *imports/throws* `ASSERTION`, so this looked like a possible wrong→wrong "fix". Ran it live: `new Corestore(dir, {primaryKey})` → `name: HypercoreError`, **`code: ERR_ASSERTION`** | ✅ correct — the factory is `ASSERTION`, the emitted **code** is `ERR_ASSERTION` |
| corestore `[src]` L205 → L236 | L236 is `constructor(storage, opts = {})` | ✅ correct |
| compact-encoding — all 3 claims (⚠️ *classifier-unavailable agent*) | ran live against 3.3.0: `cenc.uint.encode(state,42)` → `undefined` + writes `<Buffer 2a>`, while `cenc.encode(cenc.uint,42)` → `Buffer`; `record` decode proto **is** null (`[Object: null prototype] { a: 1, b: 2 }`); empty `cenc.buffer` decodes to `<Buffer >`, **not** `null` | ✅ all correct despite the classifier warning |

Incidental finding while testing: `cenc.buffer` **throws** `TypeError: Cannot read properties
of null` when encoding `null` — which is consistent with our page's separate
`cenc.optionalBuffer` description ("round-trips `null`/absent values"), so no change needed.

Also noted: `corestore` npm latest is now **7.12.0** while the page pins `[src]` links to
`v7.11.0`. Pinning is fine and the verified line numbers match the pin — just be aware when
re-auditing.

**Highest-value remaining work:**

1. **Audit the 3 never-touched pages** — `hypercore` (highest value: ~1364 lines,
   most-referenced), `hyperbee`, `hyperdrive`.
2. Optionally re-run the verify stage for the 7 pages above as a second opinion; the manual
   pass covered the substantive claims but not every line of every diff.

Re-running the workflow is cheap and replays completed agents from cache:

```
Workflow({scriptPath: "…/workflows/scripts/v3-module-docs-audit-wf_3714b5a6-23e.js",
          resumeFromRunId: "wf_3714b5a6-23e"})
```

Per-agent returns (including full findings for agents whose results were truncated in the
summary) are in that run's `journal.jsonl` under
`…/subagents/workflows/wf_3714b5a6-23e/`.

#### `protomux` — 4 fixes applied, awaiting verification

Recorded here because the reasoning was unusually well-evidenced and is worth preserving:

1. **`alloc` default was wrong.** Page said it defaults to `Buffer.allocUnsafe`; source
   (`index.js` L339-340) prefers **the stream's own `alloc`** when present. Not academic —
   `@hyperswarm/secret-stream`, the transport this very page recommends, ships a
   padding-aware `alloc()` reserving room for the encryption header and MAC.
2. **`ChannelKey.id` semantics were backwards.** "Optional binary id to narrow the match"
   implies omitting it broadens the lookup; for `opened`/`getLastChannel` the opposite holds
   (`toKey` builds `protocol##hex(id)`, so omitting `id` yields a *different* key). The
   wildcard behaviour exists for `pair`/`unpair` only.
3. **`getLastChannel` return claim falsified.** "or `null` if none is open" is wrong: it
   returns `null` once the most-recent channel closes *even while older matching channels are
   still open* (`_close` nulls the pointer without falling back).
4. **`messages` registration timing.** Registered in the `Channel` constructor, not on
   `open()`.

Left alone deliberately (noted, not fixed): `Protomux.isProtomux(null)` *throws* instead of
returning false (`typeof null === 'object'`) — an upstream robustness gap the page never
claims otherwise about; and a stale `value`/`mux` parameter-name mismatch in prose.

### 🔶 Earlier round — also unverified, agents died mid-edit

These edits are **already in the working tree** but the agents were killed before running
validation or reporting in full. I reviewed each diff and they look correct, but they need
verification and possible completion. **Do not assume these are finished.**

- [ ] **`content/reference/building-blocks/hyperdht.mdx`** — removed a bogus `| Option |`
      table under `node.lookup()` that listed `from`/`to`/`peers` (those are
      *return-value* fields, not options). Agent's last words: it was mid-fix on exactly
      this. Check whether it had further findings.
- [ ] **`content/reference/helpers/corestore.mdx`** — `[src]` L205→L236; `ASSERTION` →
      `ERR_ASSERTION`; dropped a mangled `Default` value (`> {}`) for a callback param.
      Agent had said "Quickstart verified working, now applying the confirmed fixes" —
      so the fix list may be incomplete.
- [ ] **`content/reference/helpers/compact-encoding.mdx`** — the substantive one. Fixes
      a real conflation: `enc.encode(state, val)` (per-codec method, writes into
      `state.buffer`, returns `undefined`) vs `cenc.encode(enc, val)` (top-level helper,
      returns a Buffer). Old doc claimed the method returns "a newly allocated buffer".
      Also: `cenc.record` decode shows `[Object: null prototype]`; removed false
      "`cenc.buffer` decoding an empty buffer returns `null`". Removed two `[src]` links
      rather than fixing them (defensible — `enc.encode`/`enc.decode` are a *contract*
      implemented per codec, not one source line — but confirm that was intentional).
      Agent reported through "Fix 4" and had more queued.

### ✅ The last 3 pages — now audited (2026-07-28)

A third workflow run also lost 10/14 agents to session limits (`hypercore`, `hyperdrive`,
`autobase`, `corestore`, `hyperdht`, `protomux` audits + every verify stage). `hyperbee`
completed; **`hypercore` and `hyperdrive` were then done by hand in the main loop**, since
subagents were reliably failing.

#### `hyperbee` — 2 fixes (agent), spot-verified by hand

Its own report was strong: all 30 `[src]` citations exact, tarball byte-identical to the tag.

1. `createDiffStream`'s yielded-object table header `Option | Default` → `Property | Type`.
   `left`/`right` are properties of each yielded pair (the Returns line above says so), and
   the "Default" column held `Object`, a type.
2. The `db.sub()` sample claimed `{ key: 'b', value: 'hello')` — wrong, and with a mismatched
   paren inherited verbatim from upstream's README. **Re-verified live:** with no encodings you
   get `{ seq: 1, key: <Buffer 62>, value: <Buffer 68 65 6c 6c 6f> }`; the fix adds
   `keyEncoding`/`valueEncoding: 'utf-8'` to the sample so the stated output is true —
   confirmed `{ seq: 1, key: 'b', value: 'hello' }`.

#### `hyperdrive` — 5 fixes (both original leads confirmed)

- **`symlink` heading was wrong.** Source is `symlink(name, dst, { metadata })`; the heading
  said `symlink(path, linkname)` and omitted the options arg, while the params table was
  already correct. Fixed heading + prose to `name`/`dst`.
- **`replicate` heading** said `replicate(isInitiatorOrStream)`; source is
  `replicate(isInitiator, opts)`. Fixed to `replicate(isInitiator, [opts])`.
  (Checked first that no page links to either old anchor and neither has an explicit
  `<a name>`, so renaming was safe; link check passes.)
- **Three more mislabeled tables**, the same repeating defect: `drive.entry()`'s return shape
  and `diff`'s yielded `{left,right}` pairs were both headed `Option | Default` → now
  `Property | Type`; and `createReadStream`'s options table had `Number` sitting in the
  *Default* column for `start`/`end`/`length` → column relabelled `Type`, with the two real
  defaults (`wait` true, `timeout` 0) moved into the descriptions. Deliberately did **not**
  invent defaults for start/end/length — they are forwarded into `hyperblobs`.

#### `hypercore` — 3 fixes, incl. a documented option that does not exist

Verified all **62** `[src]` citations mechanically (paired each heading to its cited line and
checked the symbol appears there). **59 exact.** Two apparent misses were my regex tripping
over event emitters (`core.on('close')` → `this.emit('close')`) — both fine. The real finds:

- **`new Hypercore(...)` cited `lib/streams.js#L61`** — which is `ByteStream`'s constructor.
  The most prominent citation on the most-referenced page pointed at an unrelated class.
  → `index.js#L46`.
- **`core.snapshot()` cited `lib/streams.js#L10`** — a *property assignment* named
  `snapshot` inside a stream class. → `index.js#L210`. Both are textbook extractor
  attribution bugs (identifier matched in the wrong file), matching the known refgen issue.
- **`sparse` is not a Hypercore v11 option** — it was documented in **three** tables
  (`HypercoreOptions`, `SessionOptions`, `DefaultStorageOptions`). Evidence: zero occurrences
  in `index.js@v11.34.0`; zero in the whole `hypercore-storage` package (the only hits
  anywhere are the unrelated `big-sparse-array` dependency); `session()` never reads it; and
  passing `sparse: false` is **silently ignored** (`core.sparse === undefined`). A v9/v10
  leftover. All three rows removed; `DefaultStorageOptions` became prose since `sparse` was
  its only row (its opts are forwarded verbatim to `hypercore-storage`).
  - Prose mention of "sparse replication" in the intro was **kept** — that is accurate
    default behaviour, just not a configurable option.

Defaults that were verified **correct** and left alone: `writable` true, `weak` false,
`timeout` 0, `wait` true, `exclusive` false, `snapshot` false, `compat` false, and
`append()` returning `{length, byteLength}` (live: `{"length":1,"byteLength":5}`).

⚠️ **Version drift to watch:** `hypercore` npm latest is **11.35.1** but the page pins
`v11.34.0`; `corestore` latest is **7.12.0** vs pinned `v7.11.0`. Citations were verified
against the pins (correct), but neither page has been diffed for behavioural change in the
newer releases.

### ✅ Done — 3.1.0 platform delta

**Policy applied (after the target was confirmed as 3.1.0):** `cli.mdx` now documents
**3.1.0** as its baseline — the top callout says so, and all `cmd/*.js` source links are
pinned to `v3.1.0-rc.1`. Because 3.0.1 is still the stable release most readers are running,
anything that differs is flagged inline as **"New in 3.1.0"** / **"Changed in 3.1.0"** with a
note on the 3.0.1 behaviour.

> *Superseded approach, for context:* an earlier pass treated 3.0.1 as the baseline and
> marked 3.1.0 items with `<Status level="upcoming" />`. That framing has been fully removed
> (`grep -n "upcoming" content/reference/pear/cli.mdx` → no hits). Note `upcoming` still
> exists in `src/components/Status.tsx` with **zero** usages anywhere in `content/`.

Established the full command-surface delta authoritatively by diffing `cmd/index.js`
between tags (this is the reliable way to catch flag-level changes):

```sh
gh api "repos/holepunchto/pear/contents/cmd/index.js?ref=v3.0.1"      -H "Accept: application/vnd.github.raw" > a.js
gh api "repos/holepunchto/pear/contents/cmd/index.js?ref=v3.1.0-rc.1" -H "Accept: application/vnd.github.raw" > b.js
diff -u a.js b.js
```

That diff is the *complete* 3.0.1 → 3.1.0 CLI surface change — and it is exactly four items:

| Delta | Verified how | Doc treatment |
| --- | --- | --- |
| **`pear cores`** — new command, `summary('List platform cores')` | `cmd/cores.js` 404s at `v3.0.1`, 200 at `v3.1.0-rc.1`; `pear cores` on the local 3.0.1 → `✖ Unrecognized Argument at index 0 with value cores` | New `## pear cores` section + "New in 3.1.0" callout. Behaviour and NDJSON shape read from `cmd/cores.js` and `subsystems/sidecar/ops/cores.js`: per-core `tag:"core"` `{link, writable}`, final `{count, writable}`; human output `<link> (writable)` then `Total cores: n \| Writable: n`, or `No cores`. Explicitly disambiguated from `pear gc cores`, which *clears* cores rather than listing them. |
| **`pear touch --vanity <vanity>`** | absent from `pear touch --help` on 3.0.1; impl read from `cmd/touch.js` | Added to the flags block + prose. Source gave specifics worth having: value must be **z32 chars only** (else `Vanity key must contain only z32 characters`), and prefixes **> 4 chars** print a warning. That warning goes to **stderr** via `console.warn`, so `LINK=$(pear touch --vanity pear)` still captures only the link — which is exactly the stdout/stderr split Keith raised in the original Slack thread. |
| **`pear multisig link --vanity <vanity>`** | source shows it on the **`link` leaf subcommand only**, not at top level | Added to the multisig flags block using the page's existing `(subcommand)` annotation style |
| **`pear sidecar`: `--log-labels`, `--log-fields`, `--log-stacks` REMOVED** | all three present in `pear sidecar --help` on local 3.0.1; gone from `cmd/index.js` at the 3.1.0 tag | **Removed from the flags block** (the page targets 3.1.0) + "Changed in 3.1.0" callout noting they still work on 3.0.1 |

**Bonus, verified from source: the 3.1.0 logging rework** (PR #1138 "Persist sidecar errors",
which is *why* those three flags disappeared — the logger was simplified). Added a
`### Persisted logs` subsection under `pear sidecar`:

- writes to **`pear.log`** in the platform directory, rotating at **10 MB** to `pear.old.log`
  (only ever two files; the older rotation is deleted)
- line format `<ISO-8601> <ERR|INF|TRC> [ label ] message`
- `--log-level` takes `0`–`3` or `OFF`/`ERR`/`INF`/`TRC`, default `INF`; entries above the
  active level are dropped from the file *and* the terminal

⚠️ **The PR description is wrong about the filename** — it says
`${PLATFORM_DIR}/sidecar.crash.log`, but the merged `constants.js` has
`_logPath = dir('pear.log')`. I documented `pear.log` per the code. Do not "correct" this
back based on the PR text.

**Also fixed: source-link drift.** All 13 `Command source on GitHub` links pointed at
`/blob/main/cmd/*.js`, and `main` is `3.2.0-rc.0` — so a reader clicking through for
`pear sidecar` saw code *without* the log flags the page listed. All 13 (now 14, with
`cores.js`) are pinned to `/blob/v3.1.0-rc.1/`, each path verified HTTP 200 at that tag. The
two `/blob/main/subsystems/sidecar/ops/stage.js` links in `configuration.mdx` were pinned to
the same tag (also verified 200). The page's maintainer note — whose premise "Pear v3 is not
yet tagged" had become false — was rewritten to record the tag and the diff recipe above.

**`pear init` sample verified accurate, no change** — the page quotes
`✖ Unrecognized Argument at index 0 with value init` + usage; reproduced exactly on v3.0.1.
PR #1155 (`Fix output of pear --unknown-flags`, merged 2026-07-27) only sets `bails: false`
in `lib/cmd.js`'s bootstrap parser, which fixes the raw `Uncaught Bail: UNKNOWN_FLAG`
stack trace on things like `pear -v --json`. Our wording is version-agnostic and holds
on both. (#1151 verlink / #1137 info+changelog fixes not separately re-checked — `pear info`
and `pear changelog` are both broken locally, see [Known local breakage](#known-local-breakage).)

### ⚠️ Two of my OWN earlier `--json` claims were wrong — corrected

Worth recording, because it is the same defect class this audit exists to catch, and it
came from reasoning about source rather than running the command:

1. **Flag position for subcommands — I had it backwards for `multisig`.** I originally
   wrote that `pear data`, `pear gc`, *and* `pear multisig` all take `--json` **before**
   the subcommand. Tested matrix on v3.0.1:

   | Invocation | Result |
   | --- | --- |
   | `pear data --json dht` | ✅ NDJSON |
   | `pear data dht --json` | ❌ `Unrecognized Flag` |
   | `pear gc --json sidecars` / `--json cores` | ✅ NDJSON |
   | `pear gc sidecars --json` / `cores --json` | ❌ `Unrecognized Flag` |
   | `pear multisig keys list --json` | ✅ NDJSON |
   | `pear multisig --json keys list` | ❌ `Unrecognized Flag` |
   | `pear multisig link --json` | ✅ accepted (then `ENOENT`, no `pear.json` in cwd) |

   Cause: `data`/`gc` declare `--json` on the **parent**; `multisig` declares it on each
   **leaf** subcommand (20 `flag('--json')` declarations in `cmd/index.js`). Replaced the
   prose with a table showing both directions. Documenting this backwards would have
   actively broken someone's script.

2. **"Every stream ends with a `final` object carrying `success`" — false.** Actual:

   | Command | `final`? | `success`? |
   | --- | --- | --- |
   | `pear touch --json` | yes | yes (`{success, key, link}`) |
   | `pear gc --json sidecars` | yes | yes (`{success}`) |
   | `pear data --json dht` | yes | yes (`{success, nodes}`) |
   | `pear multisig keys list --json` | yes | **no `data` at all** |
   | `pear versions --json` | **no `final` at all** | n/a |

   Rewrote to "most commands…" plus both exceptions, and advised treating a missing
   `success` as "no status reported" rather than failure. (The `pear changelog` →
   `tag: "changelog"` claim *did* check out — confirmed in `cmd/changelog.js`'s
   `outputter('changelog', …)`.)

**Lesson for whoever continues:** run the command. Do not infer behaviour from reading
`cmd/index.js`, because flag *declaration site* determines accepted *position*.

### ⬜ Remaining

- [ ] Decide whether `content/release-overview/index.mdx` should also list the upcoming
      `pear cores` / `--vanity` / sidecar-flag changes — it is described as "the curated
      record of the v3 command removals and other module changes", so it is arguably the
      right home for the aggregate view. Deliberately not done yet (scope).
- [ ] Consider reporting the local `pear info` / `pear changelog` breakage upstream.

### ⬜ Wrap-up

- [ ] Full validation sweep (all four scripts + `vale` over `content/`).
- [ ] `npx tsx scripts/check-cross-links.ts` (advisory coverage report).
- [ ] Consider whether `docs/REFERENCE_DOCS_REVIEW_LOG.md` should record this round.

---

## Known breakage — RESOLVED

- ~~`pear info` / `pear changelog` fail with `✖ Cannot read properties of undefined (reading
  'key')`.~~ **Diagnosed: a real 3.0.1 bug, fixed in 3.1.0.** Both commands were re-run on the
  3.1.0-rc.1 build and work correctly (`pear info` prints the keys/info tables; `pear changelog
  --max 2` prints the platform changelog). This is PR #1137 ("`pear info`/`changelog` fixes &
  improvements"). Not env-specific — nothing to report upstream.
  - ✅ **`pear info` has since been verified live on 3.1.0** and its docs were accurate: all six
    flags and both arguments (`[link]`, `[dir=.]`) match exactly. Its `--json` tag structure was
    added to the page — `retrieving` → `keys` → `info` → `final`, with the `info` object
    carrying `link`/`verlink`/`name`/`version`/`productName`/`upgrade`. The `verlink` field is
    PR #1151. This is the command Andrei called out by name in the original thread, so
    documenting its shape closes that specific request.
  - A "fails on 3.0.1" callout was added under `pear info` so users on the stable release
    recognise the error instead of assuming a broken install.
- `pear -v --json`, `pear --version`, `pear help --json` all throw `UNKNOWN_FLAG`
  (documented correctly now; noting so nobody "fixes" it back).

## PR base

Per project memory, pear-docs PRs target **`published`** (the live branch), not `main` or
`preview`. `git rev-parse HEAD origin/published` were equal at session start, so the
diff for this work is exactly the uncommitted tree changes.
