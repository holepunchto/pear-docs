# Pear Docs

Official documentation for the [Pear](https://pears.com) platform by Holepunch.

* Source code and content of the docs website.
* Automation scripts for link checking and documentation quality.

The docs website is a static site generated via SSG from a Next.js + **Fumadocs** application.

## Installation

### Prerequisites

* Node.js >= 20.0.0
* `npm` >= 10.0.0

### Initialize submodules

`@tetherto/docs-seo-*` packages live in the [`tetherto/docs-template`](https://github.com/tetherto/docs-template) git submodule. Initialize it before installing:

```bash
git submodule update --init --recursive
```

Or clone with submodules in one step:

```bash
git clone --recurse-submodules <repo-url>
```

To keep submodules in sync automatically on every `git pull` or `git checkout`:

```bash
git config submodule.recurse true
```

### Set up `.env`

1. Create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

2. Fill in any required values (see comments in `.env.example`).

### Install dependencies

```bash
npm install
```

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
