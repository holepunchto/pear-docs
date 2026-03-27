# PearPass Docs

Official documentation and single source of truth for PearPass:

* Source code and content of the docs website.
* Automation scripts for link checking and documentation quality.

PearPass docs website is a static website generated via SSG functionality from a Next.js + **Fumadocs** application.

## Installation

### Prerequisites:

* Node.js >= 20.0.0
* `npm` >= 10.0.0

### Install dependencies:
```bash
npm install
```

## Development

Check broken internal links:
```bash
npm run check:internal-links
```

Check broken external links:
```bash
npm run check:external-links
```

Run dev server:
```bash
npm run dev
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

## Deployment

Docs are deployed automatically via CI/CD on push to `main` branch.

**Production URL:** [https://docs.pass.pears.com](https://docs.pass.pears.com)

## Repository Layout
```
├── src/
│   ├── app/                # Next.js app router pages and layouts
│   ├── components/         # Custom React components (Image, ImageGrid, icons)
│   ├── lib/                # Utility functions and Fumadocs configuration
│   └── mdx-components.tsx  # MDX component mappings
├── content/docs/           # Documentation content (MDX files)
│   ├── index.mdx           # Overview page
│   ├── installation/       # Installation guides
│   │   ├── desktop-installation.mdx
│   │   ├── mobile-installation.mdx
│   │   └── browser-extension-installation.mdx
│   ├── getting-started/    # Getting started guides
│   │   ├── master-password-setup.mdx
│   │   ├── creating-your-first-vault.mdx
│   │   ├── adding-your-first-item.mdx
│   │   ├── editing-an-item-in-your-vault.mdx
│   │   └── delete-an-item-from-your-vault.mdx
│   ├── how-to-guides/      # How-to guides
│   │   ├── how-to-activate-the-browser-extension.mdx
│   │   ├── how-to-turn-on-autofill.mdx
│   │   ├── how-to-sync-vault-between-devices.mdx
│   │   ├── how-to-export-your-vault.mdx
│   │   ├── how-to-import-credentials-from-other-password-managers.mdx
│   │   ├── how-to-save-and-use-pass-keys.mdx
│   │   └── how-to-create-a-strong-password.mdx
│   ├── references/         # Reference documentation
│   │   ├── supported-import-formats.mdx
│   │   ├── pearpass-functions.mdx
│   │   ├── pear-runtime.mdx
│   │   └── search.mdx
│   └── technical-support-and-troubleshooting.mdx
├── public/                 # Static assets (images, logos)
└── scripts/                # Link checking and automation scripts
```

## Contributing

1. Create a new branch from `main`
2. Add or edit MDX files in `content/docs/`
3. Run `npm run check:internal-links` to verify links
4. Submit a pull request

## Resources

* [PearPass Website](https://pass.pears.com)
* [Fumadocs Documentation](https://fumadocs.dev)
* [Pear Runtime](https://pears.com)