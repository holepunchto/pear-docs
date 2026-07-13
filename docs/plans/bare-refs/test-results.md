# Test execution results — bare refs

_Run: 2026-07-13 (session 6, Opus 4.8). Executes docs/plans/bare-refs/test-plan.md._

## ⚠️ Blocking finding — an uncommitted `--write` cutover is staged in content/

`content/reference/bare/modules/` currently holds an **uncommitted** full cutover:
all 70 generated pages written in (30 overwriting the prior hand-written pages,
40 new), byte-identical to `generated/bare-refs/`; the 6 no-types hand-written
pages (bare-apk, bare-channel, bare-form-data, bare-mime, bare-sdl,
bare-union-bundle) correctly kept. Files stamped 2026-07-13 10:32, i.e. NOT from
this session's regen — an earlier/scheduled run executed `gen:bare-refs --write`.
It is working-tree only (last content commit is still the #303 baseline).

This includes **bare-fs**, the OOM-blocked page (Phase C-2) — committing +
building this as-is would break `next build`.

**RESOLVED (user decision 2026-07-13): keep, but pull bare-fs.** `bare-fs.mdx`
was reverted to its committed hand-written page (`git checkout --`); the other
**69 generated pages remain staged** in content/ (29 replacing hand-written + 40
new), plus the synced catalog. bare-fs stays on its curated page (the current
live page — OOM-safe) until the processed-markdown site-infra fix lands, at
which point it can be cut over too. Still uncommitted — review + commit is the
user's call. Nothing pushed.

## Phase A — automated gates: PASS

| Gate | Result |
|------|--------|
| `gen:bare-refs --top 80` | ✅ 70/72 written; skipped bare-dgram (stale release), bare-tui (body-less ambient) |
| `check:bare-refs` | ✅ 70 modules OK (coverage + layout-key + MDX) |
| `test:bare-refs` | ✅ all extractor fixtures pass |
| `tsc` (tooling) | ✅ clean |
| `bare-refs:todo` | ✅ 2 no-prose (bare-env, bare-stdio — newly generating), 68 to-review, 34 with-gaps |

## Phase B — content (automated proxy): PASS

Coverage asserted by `check` (every export rendered). Junk/leak scan across all
66 non-empty describe maps (native-code fragments, arrow-fn fragments, leaked
group headings, dangling lead-ins, empty strings): **clean, 0 flags.** Full
editorial sign-off on prose remains a human step, but the 10-agent QA pass
(findings-a.md) already verified every entry against source.

## Phase D — known issues: PASS

- Skipped modules: no bare-dgram.mdx / bare-tui.mdx; `_skipped.json` =
  `["bare-dgram","bare-tui"]`. ✓
- **Source-link resolution: 12/12 sampled links HTTP 200** across the top-6
  modules (bare-events, bare-fs, bare-os, bare-path, bare-url, bare-stream).
  Version pins current (e.g. bare-fs auto-bumped to v4.7.4 on regen, link still
  resolves — confirms the pinning + regen loop). ✓
- Flat-key collisions (bare-crypto update/final, bare-fs path/type/blocks) —
  documented limitation, prose correct for the primary symbol; unchanged.

## Phase C — in-site rendering: PARTIALLY (deferred, see note)

Not re-run this session. C-1 sample renders (bare-events, bare-prom-client) were
verified 200 OK with badge/anchors/source-links in a prior session
(findings-a.md, session 2/3). C-2 (bare-fs OOM) is root-caused and re-confirmed
twice — it is the known blocker, not re-run here to avoid the expensive crash.
The scheduled `execute-bare-refs-test-plan` run will do a fresh C-1 + C-2 via
the dev server.

## Phase E — cutover readiness

Confounded by the staged cutover above (content == generated). Once content/ is
restored to pristine, re-run the hand-written-vs-generated comparison. Heading
counts already match generated for all 70 (they ARE generated right now).

## Net status

Everything mechanically testable is GREEN. The one thing gating "ready to ship"
is the user decision on (a) the staged uncommitted cutover in content/ and
(b) the bare-fs OOM site-infra fix. No new defects found.
