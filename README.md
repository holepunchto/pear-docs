# Pear Docs

Official documentation for the [Pear](https://pears.com) platform by Holepunch.

* Source code and content of the docs website.
* Automation scripts for link checking and documentation quality.

The docs website is a static site generated via SSG from a Next.js + **Fumadocs** application.

## Installation

### Prerequisites

* Node.js >= 20.0.0
* `npm` >= 10.0.0

### Set up `.env`

`@tetherto/docs-seo-*` is installed from **GitHub Packages**, which `.npmrc` authenticates against using `${GITHUB_TOKEN}` read from the **process environment** at install time. Next.js loads `.env*` files for the app, but `npm` does **not** — you have to put the token in your shell before running `npm install`.

1. Create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

2. Set `GITHUB_TOKEN` to a classic GitHub PAT with at least `read:packages` scope (generate at <https://github.com/settings/tokens>). See `docs-template`'s [README](https://github.com/tetherto/docs-template#using-these-packages-from-another-repository) for the full PAT flow (scopes, expiration, SSO).

3. Source `.env` into your shell once per session:

   ```bash
   set -a && source .env && set +a
   ```

   Or use [`direnv`](https://direnv.net) / [`dotenv-cli`](https://www.npmjs.com/package/dotenv-cli) if you prefer auto-loading.

### Install dependencies

```bash
npm install
```

If `npm install` fails with `401 Unauthorized` against `npm.pkg.github.com`, your shell doesn't have `GITHUB_TOKEN` exported — re-run the source step above.

## Development

Run dev server:
```bash
npm run dev
```

Check broken internal links:
```bash
npm run check:internal-links
```

Check broken external links:
```bash
npm run check:external-links
```

Audit cross-link coverage and orphan pages (informational; `--strict`
fails the build on coverage <50% for high-mention canonical terms or any
page with <2 inbound links):
```bash
npm run check:cross-links
# or enforce thresholds in CI:
npm run check:cross-links -- --strict
```

Check that legacy URL redirects still resolve to live pages:
```bash
npm run check:redirects        # requires a build first; reads out/_redirects + stubs
```

Check that every page's `docType` frontmatter matches the Diátaxis quadrant
it lives in (a how-to in `content/how-to/`, an explanation in
`content/explanation/`, etc.):
```bash
npm run check:doctypes
```

Validate (and optionally execute) the code examples in `content/how-to/**`.
Every fenced block under `content/how-to/` must carry either `example=<id>`
meta (runnable, grouped into a scenario) or `skip="<reason>"` meta
(non-runnable in CI — live DHT, signed installer, sample output, etc.):
```bash
npm run check:examples:lint   # validate annotations only (fast, no runtimes needed)
npm run check:examples        # scaffold each scenario, execute end-to-end, assert output
```

The full `check:examples` run scaffolds isolated projects under
`.examples-tmp/` (gitignored) and requires `bash`, `npm`, `pear`, and `bare`
on `PATH`. Install pear-runtime per the [Pear install guide](https://docs.pears.com/getting-started/install)
and `bare` via `npm i -g bare-runtime`.

Authoring conventions for code fences are documented at the top of
[`scripts/check-examples.ts`](scripts/check-examples.ts). In short:

- `example=<id> step=setup` — bash setup script (run as-is).
- `example=<id> step=write file=<rel>` — overwrite a file in the scenario cwd.
- `example=<id> step=run process=<name> [expect=...] [capture-<x>="regex"] [cmd=...]` —
  spawn a long-lived process. The first non-empty line of the body is the
  command unless overridden by `cmd=`.
- `skip="reason"` — explicitly mark a block as not runnable in CI.
- `{/* @harness example=<id> step=send|expect|copy ... */}` — JSX-comment
  directives for orchestration steps that don't fit naturally as visible
  code blocks (sends to stdin, cross-process asserts, fixture copies).

## Build

Generate static website:
```bash
npm run build
```

Regenerate Open Graph images only (without a full Next build):
```bash
npm run build:og
```

Preview the production build locally:
```bash
npm run serve                  # serves ./out on :8080 via the `serve` package
```

## Repository Layout

```
├── content/      # Documentation MDX files (one directory per Diátaxis quadrant)
├── src/          # Next.js app and React components
├── public/       # Static assets (logos, OG images precomputed by build:og)
├── scripts/      # Link checks, doctype validation, OG generation, redirects
├── decisions/    # ADRs (architectural decision records)
└── out/          # Static export output (generated; not checked in)
```

## Architectural decisions

Substantive shape changes (information architecture, redirect strategy,
front-matter conventions) are recorded as Architecture Decision Records
under `decisions/`. The current site IA is documented in
[`decisions/0001-adopt-diataxis-ia.md`](decisions/0001-adopt-diataxis-ia.md).

## Contributing

1. Create a new branch from `main`
2. Add or edit MDX files under `content/`
3. Run `npm run check:internal-links` to verify links
4. Submit a pull request

## Resources

* [Pear Website](https://pears.com)
* [Holepunch](https://holepunch.to)
* [Fumadocs](https://fumadocs.dev)
