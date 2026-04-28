/**
 * Single source of truth for legacy-path -> new-path redirects, used by both
 * the postbuild stub generator (scripts/generate-redirect-stubs.ts) and the
 * CI verifier (scripts/check-redirects.ts).
 *
 * The list is DERIVED FROM THE CURRENT content/ TREE rather than hardcoded,
 * so it auto-extends as new how-tos / building-blocks / helpers / tools are
 * added: any new file under content/how-to/<slug>.mdx that isn't a misfiled
 * reference doc gets a /howto/<slug>/ -> /how-to/<slug>/ stub for free.
 *
 * URLs always carry a trailing slash to match next.config.mjs's
 * `trailingSlash: true` (which is what next-export actually emits in out/).
 *
 * See decisions/0001-adopt-diataxis-ia.md §6 for the full rationale.
 */
import { readdirSync } from 'fs';

export interface Redirect {
  from: string;
  to: string;
}

/**
 * Reference docs that were always logically how-tos; they moved out of
 * /reference/ into /how-to/ in subtask 2. /reference/<slug>/ -> /how-to/<slug>/.
 */
const MISFILED_HOWTOS: ReadonlySet<string> = new Set([
  'deployment',
  'troubleshooting',
  'recommended-practices',
  'migration',
]);

function listSlugs(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx') && f !== 'index.mdx')
    .map((f) => f.replace(/\.mdx$/, ''));
}

function withSlash(p: string): string {
  return p.endsWith('/') ? p : p + '/';
}

export function buildRedirects(contentRoot = 'content'): Redirect[] {
  const out: Redirect[] = [];

  // /howto/<slug>/  ->  /how-to/<slug>/
  // Excludes the four misfiled how-tos (they had a different legacy prefix:
  // /reference/<slug>/, handled below) so we don't emit a wrong stub from
  // /howto/deployment/ which never existed.
  for (const slug of listSlugs(`${contentRoot}/how-to`)) {
    if (MISFILED_HOWTOS.has(slug)) continue;
    out.push({ from: withSlash(`/howto/${slug}`), to: withSlash(`/how-to/${slug}`) });
  }

  // /reference/<slug>/  ->  /how-to/<slug>/  (the four misfiled how-tos)
  for (const slug of MISFILED_HOWTOS) {
    out.push({ from: withSlash(`/reference/${slug}`), to: withSlash(`/how-to/${slug}`) });
  }

  // /building-blocks/<slug>/  ->  /reference/building-blocks/<slug>/
  for (const slug of listSlugs(`${contentRoot}/reference/building-blocks`)) {
    out.push({
      from: withSlash(`/building-blocks/${slug}`),
      to: withSlash(`/reference/building-blocks/${slug}`),
    });
  }

  // /helpers/<slug>/  ->  /reference/helpers/<slug>/
  for (const slug of listSlugs(`${contentRoot}/reference/helpers`)) {
    out.push({
      from: withSlash(`/helpers/${slug}`),
      to: withSlash(`/reference/helpers/${slug}`),
    });
  }

  // /tools/<slug>/  ->  /reference/tools/<slug>/
  for (const slug of listSlugs(`${contentRoot}/reference/tools`)) {
    out.push({
      from: withSlash(`/tools/${slug}`),
      to: withSlash(`/reference/tools/${slug}`),
    });
  }

  out.sort((a, b) => a.from.localeCompare(b.from));
  return out;
}

/**
 * Static HTML stub used as a portable fallback when the hosting layer
 * doesn't honor the _redirects file. Browsers redirect immediately
 * (refresh content="0"), search engines follow the canonical link, and
 * the stub itself is noindex'd so the duplicate URL doesn't pollute the
 * index.
 */
export function stubHtml(absoluteTo: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <meta http-equiv="refresh" content="0; url=${absoluteTo}">
  <link rel="canonical" href="${absoluteTo}">
  <meta name="robots" content="noindex">
</head>
<body>
  <p>This page has moved to <a href="${absoluteTo}">${absoluteTo}</a>.</p>
</body>
</html>
`;
}
