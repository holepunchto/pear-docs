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
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface Redirect {
  from: string;
  to: string;
}

/**
 * Reference docs that were always logically how-tos; they moved out of
 * /reference/ into /how-to/<topic>/ across subtask 2 + the by-topic nesting
 * pass. Legacy URL was /reference/<slug>/, new is /how-to/<topic>/<slug>/.
 * The topic is inferred from the filesystem at runtime — see buildHowToTopics.
 */
const MISFILED_HOWTOS: ReadonlySet<string> = new Set([
  'deployment',
  'migration',
]);

function listSlugs(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx') && f !== 'index.mdx')
    .map((f) => f.replace(/\.mdx$/, ''));
}

function listSubdirs(dir: string): string[] {
  return readdirSync(dir).filter((entry) => statSync(join(dir, entry)).isDirectory());
}

function withSlash(p: string): string {
  return p.endsWith('/') ? p : p + '/';
}

/**
 * Walk content/how-to/<topic>/<slug>.mdx and return a slug -> topic map.
 * Used for building both /howto/<slug>/ and /reference/<misfiled>/ redirect
 * destinations. Legacy URLs are flat (no topic in the path), so the redirect
 * destination needs the topic looked up from the live tree — that way new
 * how-tos get a redirect for free, and re-shuffling pages between topics
 * doesn't require editing this file.
 */
function buildHowToTopics(howToRoot: string): Map<string, string> {
  const slugToTopic = new Map<string, string>();
  for (const topic of listSubdirs(howToRoot)) {
    for (const slug of listSlugs(join(howToRoot, topic))) {
      slugToTopic.set(slug, topic);
    }
  }
  return slugToTopic;
}

export function buildRedirects(contentRoot = 'content'): Redirect[] {
  const out: Redirect[] = [];

  // The how-to quadrant is nested by topic now: content/how-to/<topic>/<slug>.mdx.
  // Legacy URLs (/howto/<slug>/, /reference/<misfiled>/) are flat, so we look up
  // the topic from the filesystem and emit a single-hop redirect to the deeply-
  // nested final URL. No chained redirects.
  const slugToTopic = buildHowToTopics(`${contentRoot}/how-to`);

  for (const [slug, topic] of slugToTopic) {
    const finalDestination = withSlash(`/how-to/${topic}/${slug}`);
    if (MISFILED_HOWTOS.has(slug)) {
      // /reference/<slug>/  ->  /how-to/<topic>/<slug>/
      out.push({ from: withSlash(`/reference/${slug}`), to: finalDestination });
    } else {
      // /howto/<slug>/  ->  /how-to/<topic>/<slug>/
      out.push({ from: withSlash(`/howto/${slug}`), to: finalDestination });
    }
  }

  // Building-block reference docs live at /reference/building-blocks/<slug>/.
  // Keep /building-blocks/<slug>/ as a legacy path only.
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

  // /reference/faq/ -> /explanation/. Most FAQ Q&As were explanation-shaped
  // and moved into /explanation/{runtime-and-languages,storage-and-distribution,
  // dependencies-and-network}; the explanation index carries a "Coming from
  // the old FAQ?" lookup table mapping each old anchor to its new home.
  // Static stubs can't dispatch on URL fragment, so a single page-level
  // redirect to /explanation/ is the best we can do without JavaScript.
  // See decisions/0001-adopt-diataxis-ia.md §5 (FAQ resolution).
  out.push({ from: '/reference/faq/', to: '/explanation/' });

  // Desktop release npm scripts is reference-shaped, so it moved out of the
  // task-oriented operating-an-app how-to section.
  out.push({
    from: '/how-to/operate-an-app/desktop-release-npm-scripts/',
    to: '/reference/desktop-release-npm-scripts/',
  });
  out.push({
    from: '/howto/desktop-release-npm-scripts/',
    to: '/reference/desktop-release-npm-scripts/',
  });

  // Release pipeline glossary was folded into the release-pipeline explanation
  // as a "Glossary" section, so the standalone reference page is gone.
  out.push({
    from: '/reference/release-pipeline-glossary/',
    to: '/explanation/release-pipeline/#glossary',
  });

  // Troubleshooting and manage-installed-applications were promoted to
  // top-level how-tos (out of operate-an-app), so they're no longer
  // topic-nested and need explicit legacy redirects.
  out.push({ from: '/reference/troubleshooting/', to: '/how-to/troubleshooting/' });

  // "Apply recommended practices" was split into callouts on the Corestore
  // and Hyperswarm how-tos and the dependencies-and-network explanation, so
  // the standalone page is gone; land legacy links on the how-to index.
  out.push({ from: '/reference/recommended-practices/', to: '/how-to/' });

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
