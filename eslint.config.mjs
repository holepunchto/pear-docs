// eslint.config.mjs
//
// Flat-config setup for ESLint 9. `eslint-config-next` (v16+) ships a flat
// config array directly, including `next`, `next/typescript`, the import /
// react / a11y / next plugins, and global ignores for `.next`, `out`,
// `build`, and `next-env.d.ts`.
//
// We extend it with project-specific ignores and a scripts/ override so the
// CLI tools under scripts/ aren't held to the same React rules as src/.
import next from 'eslint-config-next';

const config = [
  ...next,
  {
    ignores: [
      // Fumadocs generated MDX cache (regenerated on `postinstall`).
      '.source/**',
      // Takumi-generated OG images.
      'public/og/**',
      // Static export output (already covered by next defaults, listed here
      // for clarity and so future tooling sees the full set in one place).
      'out/**',
      // Legacy Pear Book scaffolding — slated for removal alongside the
      // Pear Book workflow; not part of the Fumadocs site.
      'pearbook/**',
    ],
  },
  {
    // Node CLIs under scripts/ aren't React/JSX, so silence the React /
    // browser-flavored rules that would otherwise fire on Node-only code.
    files: ['scripts/**/*.{ts,tsx,mts,cts,js,mjs,cjs}'],
    rules: {
      'react/jsx-key': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/alt-text': 'off',
      // `scripts/generate-og.tsx` builds Takumi `<img>` markup, not Next.js
      // pages — `next/image` doesn't apply.
      '@next/next/no-img-element': 'off',
    },
  },
];

export default config;
