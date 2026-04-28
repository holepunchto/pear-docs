import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import {
  precomputeTakumiOgImages,
  type RenderTemplateContext,
} from '@tetherto/docs-seo-og/build';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Pear color tokens. Mirrors `src/app/global.css` and the `pear-1.svg` logo
// so OG images match the docs site's dark-mode palette.
const COLORS = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  muted: '#a3a3a3',
  primary: '#bbde5c',
  divider: '#262626',
};

function buildPearOgTemplate(
  logoDataUrl: string,
): (ctx: RenderTemplateContext) => React.ReactElement {
  return function PearOgTemplate({ title, description, site }) {
    const displayTitle = title || site;
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: COLORS.background,
          backgroundImage:
            'radial-gradient(ellipse at top right, rgba(187,222,92,0.12), transparent 60%)',
          padding: '80px',
          fontFamily: 'Poppins',
          color: COLORS.foreground,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '36px',
          }}
        >
          <img
            src={logoDataUrl}
            width={108}
            height={146}
            style={{ flexShrink: 0 }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: 78,
              fontWeight: 700,
              color: COLORS.foreground,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            {displayTitle}
          </div>
        </div>

        {description ? (
          <div
            style={{
              display: 'flex',
              marginTop: 44,
              fontSize: 34,
              fontWeight: 400,
              color: COLORS.muted,
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        ) : null}

        <div style={{ display: 'flex', flex: 1 }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 28,
            borderTop: `1px solid ${COLORS.divider}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              fontWeight: 600,
              color: COLORS.primary,
              letterSpacing: '0.02em',
            }}
          >
            {site} Docs
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 400,
              color: COLORS.muted,
            }}
          >
            docs.pears.com
          </div>
        </div>
      </div>
    );
  };
}

async function main(): Promise<void> {
  if (process.env.SKIP_OG_BUILD === '1') {
    console.log('[og] SKIP_OG_BUILD=1 — skipping Takumi prebuild.');
    return;
  }

  // Logo: encoded once and reused across all OG renders.
  const logoSvg = await readFile(path.join(root, 'public', 'pear-1.svg'));
  const logoDataUrl = `data:image/svg+xml;base64,${logoSvg.toString('base64')}`;

  // Poppins matches `next/font/google` Poppins in `src/app/layout.tsx`.
  // `loadDefaultFonts: false` keeps renders deterministic.
  const fontDir = path.join(
    root,
    'node_modules',
    '@fontsource',
    'poppins',
    'files',
  );
  const [poppinsRegular, poppinsSemiBold, poppinsBold] = await Promise.all([
    readFile(path.join(fontDir, 'poppins-latin-400-normal.woff')),
    readFile(path.join(fontDir, 'poppins-latin-600-normal.woff')),
    readFile(path.join(fontDir, 'poppins-latin-700-normal.woff')),
  ]);

  await precomputeTakumiOgImages({
    contentDocsDir: path.join(root, 'content'),
    publicDir: path.join(root, 'public'),
    site: process.env.DOCS_OG_SITE_LABEL ?? 'Pear',
    ogRouteBase: '/og/docs',
    concurrency: Number(process.env.DOCS_OG_CONCURRENCY ?? '3') || 3,
    renderTemplate: buildPearOgTemplate(logoDataUrl),
    imageResponseOptions: {
      loadDefaultFonts: false,
      fonts: [
        { name: 'Poppins', data: poppinsRegular, weight: 400, style: 'normal' },
        {
          name: 'Poppins',
          data: poppinsSemiBold,
          weight: 600,
          style: 'normal',
        },
        { name: 'Poppins', data: poppinsBold, weight: 700, style: 'normal' },
      ],
    },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
