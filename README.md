# Pear Docs

Official documentation for the [Pear](https://pears.com) platform by Holepunch.

* Source code and content of the docs website.
* Automation scripts for link checking and documentation quality.

The docs website is a static site generated via SSG from a Next.js + **Fumadocs** application.

## Installation

### Prerequisites

* Node.js >= 20.0.0
* `npm` >= 10.0.0

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

## Build

Generate static website:
```bash
npm run build
```

Preview the production build locally:
```bash
npx serve out
```

## Repository Layout

```
├── src/          # Next.js app and React components
├── content/      # Documentation MDX files
├── public/       # Static assets
└── scripts/      # Link checking and automation
```

## Contributing

1. Create a new branch from `main`
2. Add or edit MDX files under `content/`
3. Run `npm run check:internal-links` to verify links
4. Submit a pull request

## Resources

* [Pear Website](https://pears.com)
* [Holepunch](https://holepunch.to)
* [Fumadocs](https://fumadocs.dev)
