/**
 * Single source of truth for legacy-path -> new-path redirects, used by both
 * the postbuild stub generator (scripts/generate-redirect-stubs.ts) and the
 * CI verifier (scripts/check-redirects.ts).
 *
 * The list is DERIVED FROM THE CURRENT content/ TREE rather than hardcoded,
 * so it auto-extends as new how-tos / building-blocks / helpers / tools are
 * added: any new file under content/{pear,bare}/how-to/<slug>.mdx that isn't
 * a misfiled reference doc gets a /howto/<slug>/ -> /how-to/<topic>/<slug>/
 * stub for free.
 *
 * URLs always carry a trailing slash to match next.config.mjs's
 * `trailingSlash: true` (which is what next-export actually emits in out/).
 *
 * See decisions/0001-adopt-diataxis-ia.md §6 for the full rationale, and
 * docs/plans/PEAR-BARE-SPLIT-PITCH.md's Phase 6 section for the
 * content/pear + content/bare physical reorg that added the /pear and /bare
 * URL prefixes — every redirect below resolves in a single hop straight to
 * the final, now-prefixed URL; there are no redirect chains.
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
 * pass. Legacy URL was /reference/<slug>/, new is /<product>/how-to/<topic>/<slug>/.
 * Topic and product are both inferred from the filesystem at runtime — see
 * buildHowToTopics.
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
 * Walk content/{pear,bare}/how-to/<topic>/<slug>.mdx and return a slug ->
 * {topic, product} map. Used for building both /howto/<slug>/ and
 * /reference/<misfiled>/ redirect destinations. Legacy URLs are flat (no
 * topic or product in the path), so the redirect destination needs both
 * looked up from the live tree — that way new how-tos get a redirect for
 * free, and re-shuffling pages between topics (or between Pear and Bare)
 * doesn't require editing this file.
 */
function buildHowToTopics(
  contentRoot: string,
): Map<string, { topic: string; product: 'pear' | 'bare' }> {
  const slugToTopic = new Map<string, { topic: string; product: 'pear' | 'bare' }>();
  for (const product of ['pear', 'bare'] as const) {
    const howToRoot = join(contentRoot, product, 'how-to');
    for (const topic of listSubdirs(howToRoot)) {
      for (const slug of listSlugs(join(howToRoot, topic))) {
        slugToTopic.set(slug, { topic, product });
      }
    }
  }
  return slugToTopic;
}

export function buildRedirects(contentRoot = 'content'): Redirect[] {
  const out: Redirect[] = [];

  // The how-to quadrant is nested by topic and split by product now:
  // content/{pear,bare}/how-to/<topic>/<slug>.mdx. Legacy URLs
  // (/howto/<slug>/, /reference/<misfiled>/) are flat, so we look up the
  // topic and product from the filesystem and emit a single-hop redirect to
  // the deeply-nested, product-prefixed final URL. No chained redirects.
  const slugToTopic = buildHowToTopics(contentRoot);

  for (const [slug, { topic, product }] of slugToTopic) {
    const finalDestination = withSlash(`/${product}/how-to/${topic}/${slug}`);
    if (MISFILED_HOWTOS.has(slug)) {
      // /reference/<slug>/  ->  /<product>/how-to/<topic>/<slug>/
      out.push({ from: withSlash(`/reference/${slug}`), to: finalDestination });
    } else {
      // /howto/<slug>/  ->  /<product>/how-to/<topic>/<slug>/
      out.push({ from: withSlash(`/howto/${slug}`), to: finalDestination });
    }
  }

  // Building-block reference docs live at /bare/reference/building-blocks/<slug>/
  // (100% Bare-tagged — see docs/plans/PEAR-BARE-SPLIT-PITCH.md). Keep
  // /building-blocks/<slug>/ as a legacy path only.
  for (const slug of listSlugs(`${contentRoot}/bare/reference/building-blocks`)) {
    out.push({
      from: withSlash(`/building-blocks/${slug}`),
      to: withSlash(`/bare/reference/building-blocks/${slug}`),
    });
  }

  // /helpers/<slug>/  ->  /bare/reference/helpers/<slug>/
  for (const slug of listSlugs(`${contentRoot}/bare/reference/helpers`)) {
    out.push({
      from: withSlash(`/helpers/${slug}`),
      to: withSlash(`/bare/reference/helpers/${slug}`),
    });
  }

  // /tools/<slug>/  ->  /bare/reference/tools/<slug>/
  for (const slug of listSlugs(`${contentRoot}/bare/reference/tools`)) {
    out.push({
      from: withSlash(`/tools/${slug}`),
      to: withSlash(`/bare/reference/tools/${slug}`),
    });
  }

  // /reference/faq/ -> /pear/explanation/. Most FAQ Q&As were explanation-shaped
  // and moved into /explanation/{runtime-and-languages,storage-and-distribution,
  // dependencies-and-network} (now /pear/explanation/...); the explanation index
  // carries a "Coming from the old FAQ?" lookup table mapping each old anchor to
  // its new home. Static stubs can't dispatch on URL fragment, so a single
  // page-level redirect to /pear/explanation/ is the best we can do without
  // JavaScript. See decisions/0001-adopt-diataxis-ia.md §5 (FAQ resolution).
  out.push({ from: '/reference/faq/', to: '/pear/explanation/' });

  // Desktop release npm scripts is reference-shaped, so it moved out of the
  // task-oriented operating-an-app how-to section.
  out.push({
    from: '/how-to/operate-an-app/desktop-release-npm-scripts/',
    to: '/pear/reference/ci-and-release/desktop-release-npm-scripts/',
  });
  out.push({
    from: '/howto/desktop-release-npm-scripts/',
    to: '/pear/reference/ci-and-release/desktop-release-npm-scripts/',
  });

  // Release pipeline glossary was folded into the release-pipeline explanation
  // as a "Glossary" section, so the standalone reference page is gone.
  out.push({
    from: '/reference/release-pipeline-glossary/',
    to: '/pear/explanation/deployment-releasing-apps-p2p/#glossary',
  });

  // "Release pipeline" was renamed "Deployment - Releasing Apps P2P"; the slug moved with it.
  out.push({
    from: '/explanation/release-pipeline/',
    to: '/pear/explanation/deployment-releasing-apps-p2p/',
  });

  // Troubleshooting and manage-installed-applications were promoted to
  // top-level how-tos (out of operate-an-app), so they're no longer
  // topic-nested and need explicit legacy redirects.
  out.push({ from: '/reference/troubleshooting/', to: '/pear/how-to/troubleshooting/' });

  // "Apply recommended practices" was split into callouts on the Corestore
  // and Hyperswarm how-tos and the dependencies-and-network explanation, so
  // the standalone page is gone; land legacy links on the how-to index.
  out.push({ from: '/reference/recommended-practices/', to: '/pear/how-to/' });

  // Stale Google-indexed paths from pre-reorganisation structure.
  // /pear-runtime/* was the old top-level section for runtime docs.
  out.push({ from: '/pear-runtime/api/', to: '/pear/reference/pear/api/' });
  out.push({ from: '/pear-runtime/troubleshooting/', to: '/pear/how-to/troubleshooting/' });
  // FAQ content was explanation-shaped; consistent with /reference/faq/ -> /pear/explanation/.
  out.push({ from: '/pear-runtime/faq/', to: '/pear/explanation/' });
  // /guides/best-practices/ was the old how-to landing page.
  out.push({ from: '/guides/best-practices/', to: '/pear/how-to/' });
  // /reference/api/ was an ambiguous alias; canonical path is /reference/pear/api/.
  out.push({ from: '/reference/api/', to: '/pear/reference/pear/api/' });
  // /examples/react-app-using-pear/ no longer exists; closest equivalent is the
  // hello-pear-electron template walkthrough.
  out.push({
    from: '/examples/react-app-using-pear/',
    to: '/pear/getting-started/from-a-template/start-from-hello-pear-electron/',
  });

  // /reference/{cli,configuration,runtime}/ moved under /reference/pear/ in the
  // pear/ subfolder pass. Confirmed by both gitbook main branch and content/ renames.
  out.push({ from: '/reference/cli/', to: '/pear/reference/pear/cli/' });
  out.push({ from: '/reference/configuration/', to: '/pear/reference/pear/configuration/' });
  out.push({ from: '/reference/runtime/', to: '/pear/reference/pear/runtime/' });

  // Other /reference/ structural moves from content/ renames.
  out.push({ from: '/reference/bare-modules/', to: '/bare/reference/modules/bare-modules/' });
  // /reference/modules/ was a single pear-modules page before the modules/ subdir was created.
  out.push({ from: '/reference/modules/', to: '/pear/reference/modules/pear-modules/' });
  out.push({
    from: '/reference/desktop-release-npm-scripts/',
    to: '/pear/reference/ci-and-release/desktop-release-npm-scripts/',
  });

  // Gitbook-era /reference/ pages with no direct successor; land on closest current equivalent.
  // node-compat and bare-overview are both covered by the runtime-and-languages explanation.
  out.push({ from: '/reference/node-compat/', to: '/pear/explanation/runtime-and-languages/' });
  out.push({ from: '/reference/bare-overview/', to: '/pear/explanation/runtime-and-languages/' });
  // templates page covered `pear init` template authoring, now part of the CLI reference.
  out.push({ from: '/reference/templates/', to: '/pear/reference/pear/cli/' });

  // /getting-started/ restructure: flat pages moved into subdirectories.
  out.push({
    from: '/getting-started/start-from-hello-pear-electron/',
    to: '/pear/getting-started/from-a-template/start-from-hello-pear-electron/',
  });
  out.push({
    from: '/getting-started/chat/',
    to: '/pear/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat/',
  });
  out.push({
    from: '/getting-started/production-shape/',
    to: '/pear/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app/',
  });
  out.push({ from: '/getting-started/ship/', to: '/pear/getting-started/build-a-peer-to-peer-chat/ship/' });
  out.push({ from: '/getting-started/update/', to: '/pear/getting-started/build-a-peer-to-peer-chat/update/' });

  // /how-to/operate-an-app/ internal restructure: pages moved into sub-sections.
  out.push({
    from: '/how-to/operate-an-app/manage-installed-applications/',
    to: '/pear/how-to/manage-installed-applications/',
  });
  out.push({ from: '/how-to/operate-an-app/troubleshooting/', to: '/pear/how-to/troubleshooting/' });
  out.push({
    from: '/how-to/operate-an-app/build-desktop-distributables/',
    to: '/pear/how-to/operate-an-app/build-and-package/build-desktop-distributables/',
  });
  out.push({
    from: '/how-to/operate-an-app/distribute-as-binary/',
    to: '/pear/how-to/operate-an-app/build-and-package/distribute-as-binary/',
  });
  out.push({
    from: '/how-to/operate-an-app/deployment/',
    to: '/pear/how-to/operate-an-app/manual-deployment/deployment/',
  });
  out.push({
    from: '/how-to/operate-an-app/troubleshoot-desktop-releases/',
    to: '/pear/how-to/operate-an-app/manual-deployment/troubleshoot-desktop-releases/',
  });
  out.push({ from: '/how-to/operate-an-app/recommended-practices/', to: '/pear/how-to/' });

  // Gitbook-era /guide/ paths. No operate-an-app index exists, so release/sharing
  // guides fall back to the how-to index.
  out.push({ from: '/guide/getting-started/', to: '/pear/getting-started/' });
  out.push({
    from: '/guide/starting-a-pear-desktop-project/',
    to: '/pear/getting-started/from-a-template/start-from-hello-pear-electron/',
  });
  out.push({
    from: '/guide/making-a-pear-desktop-app/',
    to: '/pear/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat/',
  });
  out.push({ from: '/guide/starting-a-pear-terminal-project/', to: '/pear/getting-started/' });
  out.push({ from: '/guide/making-a-pear-terminal-app/', to: '/pear/getting-started/' });
  out.push({
    from: '/guide/making-a-bare-mobile-app/',
    to: '/pear/getting-started/from-a-template/start-from-hello-pear-bare/',
  });
  out.push({ from: '/guide/releasing-a-pear-app/', to: '/pear/how-to/' });
  out.push({ from: '/guide/sharing-a-pear-app/', to: '/pear/how-to/' });
  out.push({ from: '/guide/debugging-a-pear-terminal-app/', to: '/pear/how-to/troubleshooting/' });
  out.push({ from: '/guide/creating-a-pear-init-template/', to: '/pear/reference/pear/cli/' });

  // "The Pears stack" was renamed "The Pear stack" then retired entirely as
  // a named term (superseded by "How Pear and Bare fit together"); both old
  // slugs collapse straight to the current, now-prefixed URL.
  out.push({ from: '/explanation/the-pears-stack/', to: '/pear/explanation/pear-and-bare/' });
  out.push({ from: '/explanation/the-pear-stack/', to: '/pear/explanation/pear-and-bare/' });

  // --- Phase 6: product-prefix migration ------------------------------------
  // docs/plans/PEAR-BARE-SPLIT-PITCH.md. Every page that already existed
  // right before the physical content/pear + content/bare reorg gets a
  // single-hop redirect straight from its pre-reorg URL to its final,
  // now-prefixed one. The site root (`/`) and Bare's own root (`/bare`)
  // aren't here because neither one's URL changed.
  out.push({ from: withSlash('/explanation'), to: withSlash('/pear/explanation') });
  out.push({ from: withSlash('/explanation/availability-and-blind-peering'), to: withSlash('/pear/explanation/availability-and-blind-peering') });
  out.push({ from: withSlash('/explanation/bare-on-native'), to: withSlash('/bare/explanation/bare-on-native') });
  out.push({ from: withSlash('/explanation/bare-runtime'), to: withSlash('/bare/explanation/bare-runtime') });
  out.push({ from: withSlash('/explanation/dependencies-and-network'), to: withSlash('/pear/explanation/dependencies-and-network') });
  out.push({ from: withSlash('/explanation/deployment-releasing-apps-p2p'), to: withSlash('/pear/explanation/deployment-releasing-apps-p2p') });
  out.push({ from: withSlash('/explanation/from-logs-to-files'), to: withSlash('/bare/explanation/from-logs-to-files') });
  out.push({ from: withSlash('/explanation/migrating-from-nodejs'), to: withSlash('/bare/explanation/migrating-from-nodejs') });
  out.push({ from: withSlash('/explanation/pear-desktop-architecture'), to: withSlash('/pear/explanation/pear-desktop-architecture') });
  out.push({ from: withSlash('/explanation/peer-to-peer-demystified'), to: withSlash('/pear/explanation/peer-to-peer-demystified') });
  out.push({ from: withSlash('/explanation/runtime-and-languages'), to: withSlash('/pear/explanation/runtime-and-languages') });
  out.push({ from: withSlash('/explanation/storage-and-distribution'), to: withSlash('/pear/explanation/storage-and-distribution') });
  out.push({ from: withSlash('/explanation/pear-and-bare'), to: withSlash('/pear/explanation/pear-and-bare') });
  out.push({ from: withSlash('/explanation/use-bare-standalone'), to: withSlash('/bare/explanation/use-bare-standalone') });
  out.push({ from: withSlash('/explanation/workers'), to: withSlash('/pear/explanation/workers') });
  out.push({ from: withSlash('/getting-started'), to: withSlash('/pear/getting-started') });
  out.push({ from: withSlash('/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat'), to: withSlash('/pear/getting-started/build-a-peer-to-peer-chat/build-a-peer-to-peer-chat') });
  out.push({ from: withSlash('/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app'), to: withSlash('/pear/getting-started/build-a-peer-to-peer-chat/reshape-into-a-production-app') });
  out.push({ from: withSlash('/getting-started/build-a-peer-to-peer-chat/ship'), to: withSlash('/pear/getting-started/build-a-peer-to-peer-chat/ship') });
  out.push({ from: withSlash('/getting-started/build-a-peer-to-peer-chat/update'), to: withSlash('/pear/getting-started/build-a-peer-to-peer-chat/update') });
  out.push({ from: withSlash('/getting-started/from-a-template'), to: withSlash('/pear/getting-started/from-a-template') });
  out.push({ from: withSlash('/getting-started/from-a-template/start-from-hello-pear-bare'), to: withSlash('/pear/getting-started/from-a-template/start-from-hello-pear-bare') });
  out.push({ from: withSlash('/getting-started/from-a-template/start-from-hello-pear-electron'), to: withSlash('/pear/getting-started/from-a-template/start-from-hello-pear-electron') });
  out.push({ from: withSlash('/how-to'), to: withSlash('/pear/how-to') });
  out.push({ from: withSlash('/how-to/browse-commands-with-the-interactive-menu'), to: withSlash('/pear/how-to/browse-commands-with-the-interactive-menu') });
  out.push({ from: withSlash('/how-to/blind-peering'), to: withSlash('/pear/how-to/blind-peering') });
  out.push({ from: withSlash('/how-to/blind-peering/add-blind-peering-to-a-chat-app'), to: withSlash('/pear/how-to/blind-peering/add-blind-peering-to-a-chat-app') });
  out.push({ from: withSlash('/how-to/blind-peering/keep-data-available-with-blind-peering'), to: withSlash('/bare/how-to/blind-peering/keep-data-available-with-blind-peering') });
  out.push({ from: withSlash('/how-to/connect-to-peers'), to: withSlash('/pear/how-to/connect-to-peers') });
  out.push({ from: withSlash('/how-to/connect-to-peers/connect-to-many-peers-by-topic-with-hyperswarm'), to: withSlash('/bare/how-to/connect-to-peers/connect-to-many-peers-by-topic-with-hyperswarm') });
  out.push({ from: withSlash('/how-to/connect-to-peers/connect-two-peers-by-key-with-hyperdht'), to: withSlash('/bare/how-to/connect-to-peers/connect-two-peers-by-key-with-hyperdht') });
  out.push({ from: withSlash('/how-to/connect-to-peers/host-multiple-rooms-in-one-chat-app'), to: withSlash('/pear/how-to/connect-to-peers/host-multiple-rooms-in-one-chat-app') });
  out.push({ from: withSlash('/how-to/manage-identity'), to: withSlash('/pear/how-to/manage-identity') });
  out.push({ from: withSlash('/how-to/manage-identity/add-keet-identity-to-a-chat-app'), to: withSlash('/pear/how-to/manage-identity/add-keet-identity-to-a-chat-app') });
  out.push({ from: withSlash('/how-to/manage-identity/create-a-portable-identity-with-keet-identity-key'), to: withSlash('/bare/how-to/manage-identity/create-a-portable-identity-with-keet-identity-key') });
  out.push({ from: withSlash('/how-to/manage-installed-applications'), to: withSlash('/pear/how-to/manage-installed-applications') });
  out.push({ from: withSlash('/how-to/migrate-a-nodejs-app-to-bare'), to: withSlash('/bare/how-to/migrate-a-nodejs-app-to-bare') });
  out.push({ from: withSlash('/how-to/operate-an-app'), to: withSlash('/pear/how-to/operate-an-app') });
  out.push({ from: withSlash('/how-to/operate-an-app/build-and-package'), to: withSlash('/pear/how-to/operate-an-app/build-and-package') });
  out.push({ from: withSlash('/how-to/operate-an-app/build-and-package/build-desktop-distributables'), to: withSlash('/pear/how-to/operate-an-app/build-and-package/build-desktop-distributables') });
  out.push({ from: withSlash('/how-to/operate-an-app/build-and-package/distribute-as-binary'), to: withSlash('/pear/how-to/operate-an-app/build-and-package/distribute-as-binary') });
  out.push({ from: withSlash('/how-to/operate-an-app/build-and-package/submit-to-app-stores'), to: withSlash('/pear/how-to/operate-an-app/build-and-package/submit-to-app-stores') });
  out.push({ from: withSlash('/how-to/operate-an-app/github-actions'), to: withSlash('/pear/how-to/operate-an-app/github-actions') });
  out.push({ from: withSlash('/how-to/operate-an-app/github-actions/build-and-sign-in-ci'), to: withSlash('/pear/how-to/operate-an-app/github-actions/build-and-sign-in-ci') });
  out.push({ from: withSlash('/how-to/operate-an-app/github-actions/publish-with-github-actions'), to: withSlash('/pear/how-to/operate-an-app/github-actions/publish-with-github-actions') });
  out.push({ from: withSlash('/how-to/operate-an-app/manual-deployment'), to: withSlash('/pear/how-to/operate-an-app/manual-deployment') });
  out.push({ from: withSlash('/how-to/operate-an-app/manual-deployment/deployment'), to: withSlash('/pear/how-to/operate-an-app/manual-deployment/deployment') });
  out.push({ from: withSlash('/how-to/operate-an-app/manual-deployment/troubleshoot-desktop-releases'), to: withSlash('/pear/how-to/operate-an-app/manual-deployment/troubleshoot-desktop-releases') });
  out.push({ from: withSlash('/how-to/operate-an-app/migration'), to: withSlash('/pear/how-to/operate-an-app/migration') });
  out.push({ from: withSlash('/how-to/operate-an-app/multisig'), to: withSlash('/pear/how-to/operate-an-app/multisig') });
  out.push({ from: withSlash('/how-to/operate-an-app/multisig/set-up-multisig'), to: withSlash('/pear/how-to/operate-an-app/multisig/set-up-multisig') });
  out.push({ from: withSlash('/how-to/operate-an-app/multisig/sign-with-multisig'), to: withSlash('/pear/how-to/operate-an-app/multisig/sign-with-multisig') });
  out.push({ from: withSlash('/how-to/operate-an-app/multisig/troubleshoot-multisig'), to: withSlash('/pear/how-to/operate-an-app/multisig/troubleshoot-multisig') });
  out.push({ from: withSlash('/how-to/operate-an-app/publish-a-changelog'), to: withSlash('/pear/how-to/operate-an-app/publish-a-changelog') });
  out.push({ from: withSlash('/how-to/run-on-native'), to: withSlash('/bare/how-to/run-on-native') });
  out.push({ from: withSlash('/how-to/run-on-native/bundle-a-bare-app'), to: withSlash('/bare/how-to/run-on-native/bundle-a-bare-app') });
  out.push({ from: withSlash('/how-to/run-on-native/embed-bare-in-react-native'), to: withSlash('/bare/how-to/run-on-native/embed-bare-in-react-native') });
  out.push({ from: withSlash('/how-to/run-on-native/handle-app-suspension'), to: withSlash('/bare/how-to/run-on-native/handle-app-suspension') });
  out.push({ from: withSlash('/how-to/run-on-native/type-a-native-rpc-bridge'), to: withSlash('/bare/how-to/run-on-native/type-a-native-rpc-bridge') });
  out.push({ from: withSlash('/how-to/store-and-replicate'), to: withSlash('/bare/how-to/store-and-replicate') });
  out.push({ from: withSlash('/how-to/store-and-replicate/replicate-and-persist-with-hypercore'), to: withSlash('/bare/how-to/store-and-replicate/replicate-and-persist-with-hypercore') });
  out.push({ from: withSlash('/how-to/store-and-replicate/share-append-only-databases-with-hyperbee'), to: withSlash('/bare/how-to/store-and-replicate/share-append-only-databases-with-hyperbee') });
  out.push({ from: withSlash('/how-to/store-and-replicate/work-with-many-hypercores-using-corestore'), to: withSlash('/bare/how-to/store-and-replicate/work-with-many-hypercores-using-corestore') });
  out.push({ from: withSlash('/how-to/stream-and-share-media'), to: withSlash('/pear/how-to/stream-and-share-media') });
  out.push({ from: withSlash('/how-to/stream-and-share-media/back-up-photos-in-a-peer-to-peer-app'), to: withSlash('/pear/how-to/stream-and-share-media/back-up-photos-in-a-peer-to-peer-app') });
  out.push({ from: withSlash('/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive'), to: withSlash('/bare/how-to/stream-and-share-media/create-a-full-peer-to-peer-filesystem-with-hyperdrive') });
  out.push({ from: withSlash('/how-to/stream-and-share-media/share-files-in-a-peer-to-peer-app'), to: withSlash('/pear/how-to/stream-and-share-media/share-files-in-a-peer-to-peer-app') });
  out.push({ from: withSlash('/how-to/stream-and-share-media/store-and-serve-large-media-with-hyperblobs'), to: withSlash('/bare/how-to/stream-and-share-media/store-and-serve-large-media-with-hyperblobs') });
  out.push({ from: withSlash('/how-to/stream-and-share-media/stream-a-live-camera-in-a-peer-to-peer-app'), to: withSlash('/pear/how-to/stream-and-share-media/stream-a-live-camera-in-a-peer-to-peer-app') });
  out.push({ from: withSlash('/how-to/stream-and-share-media/stream-stored-video-in-a-peer-to-peer-app'), to: withSlash('/pear/how-to/stream-and-share-media/stream-stored-video-in-a-peer-to-peer-app') });
  out.push({ from: withSlash('/how-to/troubleshooting'), to: withSlash('/pear/how-to/troubleshooting') });
  out.push({ from: withSlash('/reference'), to: withSlash('/pear/reference') });
  out.push({ from: withSlash('/reference/bare/bare-kit'), to: withSlash('/bare/reference/bare/bare-kit') });
  out.push({ from: withSlash('/reference/bare/cli'), to: withSlash('/bare/reference/bare/cli') });
  out.push({ from: withSlash('/reference/bare/modules/bare-abort'), to: withSlash('/bare/reference/bare/modules/bare-abort') });
  out.push({ from: withSlash('/reference/bare/modules/bare-abort-controller'), to: withSlash('/bare/reference/bare/modules/bare-abort-controller') });
  out.push({ from: withSlash('/reference/bare/modules/bare-addon-resolve'), to: withSlash('/bare/reference/bare/modules/bare-addon-resolve') });
  out.push({ from: withSlash('/reference/bare/modules/bare-ansi-escapes'), to: withSlash('/bare/reference/bare/modules/bare-ansi-escapes') });
  out.push({ from: withSlash('/reference/bare/modules/bare-apk'), to: withSlash('/bare/reference/bare/modules/bare-apk') });
  out.push({ from: withSlash('/reference/bare/modules/bare-assert'), to: withSlash('/bare/reference/bare/modules/bare-assert') });
  out.push({ from: withSlash('/reference/bare/modules/bare-atomics'), to: withSlash('/bare/reference/bare/modules/bare-atomics') });
  out.push({ from: withSlash('/reference/bare/modules/bare-bluetooth-android'), to: withSlash('/bare/reference/bare/modules/bare-bluetooth-android') });
  out.push({ from: withSlash('/reference/bare/modules/bare-bluetooth-apple'), to: withSlash('/bare/reference/bare/modules/bare-bluetooth-apple') });
  out.push({ from: withSlash('/reference/bare/modules/bare-broadcast-channel'), to: withSlash('/bare/reference/bare/modules/bare-broadcast-channel') });
  out.push({ from: withSlash('/reference/bare/modules/bare-buffer'), to: withSlash('/bare/reference/bare/modules/bare-buffer') });
  out.push({ from: withSlash('/reference/bare/modules/bare-bundle'), to: withSlash('/bare/reference/bare/modules/bare-bundle') });
  out.push({ from: withSlash('/reference/bare/modules/bare-bundle-id'), to: withSlash('/bare/reference/bare/modules/bare-bundle-id') });
  out.push({ from: withSlash('/reference/bare/modules/bare-channel'), to: withSlash('/bare/reference/bare/modules/bare-channel') });
  out.push({ from: withSlash('/reference/bare/modules/bare-collabora'), to: withSlash('/bare/reference/bare/modules/bare-collabora') });
  out.push({ from: withSlash('/reference/bare/modules/bare-console'), to: withSlash('/bare/reference/bare/modules/bare-console') });
  out.push({ from: withSlash('/reference/bare/modules/bare-crypto'), to: withSlash('/bare/reference/bare/modules/bare-crypto') });
  out.push({ from: withSlash('/reference/bare/modules/bare-dns'), to: withSlash('/bare/reference/bare/modules/bare-dns') });
  out.push({ from: withSlash('/reference/bare/modules/bare-encoding'), to: withSlash('/bare/reference/bare/modules/bare-encoding') });
  out.push({ from: withSlash('/reference/bare/modules/bare-env'), to: withSlash('/bare/reference/bare/modules/bare-env') });
  out.push({ from: withSlash('/reference/bare/modules/bare-events'), to: withSlash('/bare/reference/bare/modules/bare-events') });
  out.push({ from: withSlash('/reference/bare/modules/bare-fetch'), to: withSlash('/bare/reference/bare/modules/bare-fetch') });
  out.push({ from: withSlash('/reference/bare/modules/bare-file-logger'), to: withSlash('/bare/reference/bare/modules/bare-file-logger') });
  out.push({ from: withSlash('/reference/bare/modules/bare-form-data'), to: withSlash('/bare/reference/bare/modules/bare-form-data') });
  out.push({ from: withSlash('/reference/bare/modules/bare-format'), to: withSlash('/bare/reference/bare/modules/bare-format') });
  out.push({ from: withSlash('/reference/bare/modules/bare-fs'), to: withSlash('/bare/reference/bare/modules/bare-fs') });
  out.push({ from: withSlash('/reference/bare/modules/bare-hrtime'), to: withSlash('/bare/reference/bare/modules/bare-hrtime') });
  out.push({ from: withSlash('/reference/bare/modules/bare-http1'), to: withSlash('/bare/reference/bare/modules/bare-http1') });
  out.push({ from: withSlash('/reference/bare/modules/bare-https'), to: withSlash('/bare/reference/bare/modules/bare-https') });
  out.push({ from: withSlash('/reference/bare/modules/bare-inspect'), to: withSlash('/bare/reference/bare/modules/bare-inspect') });
  out.push({ from: withSlash('/reference/bare/modules/bare-inspector'), to: withSlash('/bare/reference/bare/modules/bare-inspector') });
  out.push({ from: withSlash('/reference/bare/modules/bare-ipc'), to: withSlash('/bare/reference/bare/modules/bare-ipc') });
  out.push({ from: withSlash('/reference/bare/modules/bare-logger'), to: withSlash('/bare/reference/bare/modules/bare-logger') });
  out.push({ from: withSlash('/reference/bare/modules/bare-make'), to: withSlash('/bare/reference/bare/modules/bare-make') });
  out.push({ from: withSlash('/reference/bare/modules/bare-mdns-discovery'), to: withSlash('/bare/reference/bare/modules/bare-mdns-discovery') });
  out.push({ from: withSlash('/reference/bare/modules/bare-mime'), to: withSlash('/bare/reference/bare/modules/bare-mime') });
  out.push({ from: withSlash('/reference/bare/modules/bare-module'), to: withSlash('/bare/reference/bare/modules/bare-module') });
  out.push({ from: withSlash('/reference/bare/modules/bare-module-lexer'), to: withSlash('/bare/reference/bare/modules/bare-module-lexer') });
  out.push({ from: withSlash('/reference/bare/modules/bare-module-resolve'), to: withSlash('/bare/reference/bare/modules/bare-module-resolve') });
  out.push({ from: withSlash('/reference/bare/modules/bare-module-traverse'), to: withSlash('/bare/reference/bare/modules/bare-module-traverse') });
  out.push({ from: withSlash('/reference/bare/modules/bare-net'), to: withSlash('/bare/reference/bare/modules/bare-net') });
  out.push({ from: withSlash('/reference/bare/modules/bare-os'), to: withSlash('/bare/reference/bare/modules/bare-os') });
  out.push({ from: withSlash('/reference/bare/modules/bare-pack'), to: withSlash('/bare/reference/bare/modules/bare-pack') });
  out.push({ from: withSlash('/reference/bare/modules/bare-path'), to: withSlash('/bare/reference/bare/modules/bare-path') });
  out.push({ from: withSlash('/reference/bare/modules/bare-pipe'), to: withSlash('/bare/reference/bare/modules/bare-pipe') });
  out.push({ from: withSlash('/reference/bare/modules/bare-posix'), to: withSlash('/bare/reference/bare/modules/bare-posix') });
  out.push({ from: withSlash('/reference/bare/modules/bare-process'), to: withSlash('/bare/reference/bare/modules/bare-process') });
  out.push({ from: withSlash('/reference/bare/modules/bare-prom-client'), to: withSlash('/bare/reference/bare/modules/bare-prom-client') });
  out.push({ from: withSlash('/reference/bare/modules/bare-querystring'), to: withSlash('/bare/reference/bare/modules/bare-querystring') });
  out.push({ from: withSlash('/reference/bare/modules/bare-readline'), to: withSlash('/bare/reference/bare/modules/bare-readline') });
  out.push({ from: withSlash('/reference/bare/modules/bare-realm'), to: withSlash('/bare/reference/bare/modules/bare-realm') });
  out.push({ from: withSlash('/reference/bare/modules/bare-rpc'), to: withSlash('/bare/reference/bare/modules/bare-rpc') });
  out.push({ from: withSlash('/reference/bare/modules/bare-sdl'), to: withSlash('/bare/reference/bare/modules/bare-sdl') });
  out.push({ from: withSlash('/reference/bare/modules/bare-semver'), to: withSlash('/bare/reference/bare/modules/bare-semver') });
  out.push({ from: withSlash('/reference/bare/modules/bare-sidecar'), to: withSlash('/bare/reference/bare/modules/bare-sidecar') });
  out.push({ from: withSlash('/reference/bare/modules/bare-signals'), to: withSlash('/bare/reference/bare/modules/bare-signals') });
  out.push({ from: withSlash('/reference/bare/modules/bare-sqlite'), to: withSlash('/bare/reference/bare/modules/bare-sqlite') });
  out.push({ from: withSlash('/reference/bare/modules/bare-sqlite-vector'), to: withSlash('/bare/reference/bare/modules/bare-sqlite-vector') });
  out.push({ from: withSlash('/reference/bare/modules/bare-stdio'), to: withSlash('/bare/reference/bare/modules/bare-stdio') });
  out.push({ from: withSlash('/reference/bare/modules/bare-stow'), to: withSlash('/bare/reference/bare/modules/bare-stow') });
  out.push({ from: withSlash('/reference/bare/modules/bare-stream'), to: withSlash('/bare/reference/bare/modules/bare-stream') });
  out.push({ from: withSlash('/reference/bare/modules/bare-string-decoder'), to: withSlash('/bare/reference/bare/modules/bare-string-decoder') });
  out.push({ from: withSlash('/reference/bare/modules/bare-structured-clone'), to: withSlash('/bare/reference/bare/modules/bare-structured-clone') });
  out.push({ from: withSlash('/reference/bare/modules/bare-subprocess'), to: withSlash('/bare/reference/bare/modules/bare-subprocess') });
  out.push({ from: withSlash('/reference/bare/modules/bare-system-logger'), to: withSlash('/bare/reference/bare/modules/bare-system-logger') });
  out.push({ from: withSlash('/reference/bare/modules/bare-tcp'), to: withSlash('/bare/reference/bare/modules/bare-tcp') });
  out.push({ from: withSlash('/reference/bare/modules/bare-timers'), to: withSlash('/bare/reference/bare/modules/bare-timers') });
  out.push({ from: withSlash('/reference/bare/modules/bare-tls'), to: withSlash('/bare/reference/bare/modules/bare-tls') });
  out.push({ from: withSlash('/reference/bare/modules/bare-tty'), to: withSlash('/bare/reference/bare/modules/bare-tty') });
  out.push({ from: withSlash('/reference/bare/modules/bare-type'), to: withSlash('/bare/reference/bare/modules/bare-type') });
  out.push({ from: withSlash('/reference/bare/modules/bare-type-stripper'), to: withSlash('/bare/reference/bare/modules/bare-type-stripper') });
  out.push({ from: withSlash('/reference/bare/modules/bare-union-bundle'), to: withSlash('/bare/reference/bare/modules/bare-union-bundle') });
  out.push({ from: withSlash('/reference/bare/modules/bare-url'), to: withSlash('/bare/reference/bare/modules/bare-url') });
  out.push({ from: withSlash('/reference/bare/modules/bare-vm'), to: withSlash('/bare/reference/bare/modules/bare-vm') });
  out.push({ from: withSlash('/reference/bare/modules/bare-ws'), to: withSlash('/bare/reference/bare/modules/bare-ws') });
  out.push({ from: withSlash('/reference/bare/modules/bare-zlib'), to: withSlash('/bare/reference/bare/modules/bare-zlib') });
  out.push({ from: withSlash('/reference/bare/runtime'), to: withSlash('/bare/reference/bare/runtime') });
  out.push({ from: withSlash('/reference/building-blocks/autobase'), to: withSlash('/bare/reference/building-blocks/autobase') });
  out.push({ from: withSlash('/reference/building-blocks/hyperbee'), to: withSlash('/bare/reference/building-blocks/hyperbee') });
  out.push({ from: withSlash('/reference/building-blocks/hypercore'), to: withSlash('/bare/reference/building-blocks/hypercore') });
  out.push({ from: withSlash('/reference/building-blocks/hyperdht'), to: withSlash('/bare/reference/building-blocks/hyperdht') });
  out.push({ from: withSlash('/reference/building-blocks/hyperdrive'), to: withSlash('/bare/reference/building-blocks/hyperdrive') });
  out.push({ from: withSlash('/reference/building-blocks/hyperswarm'), to: withSlash('/bare/reference/building-blocks/hyperswarm') });
  out.push({ from: withSlash('/reference/ci-and-release/desktop-release-npm-scripts'), to: withSlash('/pear/reference/ci-and-release/desktop-release-npm-scripts') });
  out.push({ from: withSlash('/reference/ci-and-release/github-actions'), to: withSlash('/pear/reference/ci-and-release/github-actions') });
  out.push({ from: withSlash('/reference/ci-and-release/pear-ci-action'), to: withSlash('/pear/reference/ci-and-release/pear-ci-action') });
  out.push({ from: withSlash('/reference/helpers/compact-encoding'), to: withSlash('/bare/reference/helpers/compact-encoding') });
  out.push({ from: withSlash('/reference/helpers/corestore'), to: withSlash('/bare/reference/helpers/corestore') });
  out.push({ from: withSlash('/reference/helpers/localdrive'), to: withSlash('/bare/reference/helpers/localdrive') });
  out.push({ from: withSlash('/reference/helpers/mirrordrive'), to: withSlash('/bare/reference/helpers/mirrordrive') });
  out.push({ from: withSlash('/reference/helpers/protomux'), to: withSlash('/bare/reference/helpers/protomux') });
  out.push({ from: withSlash('/reference/helpers/secretstream'), to: withSlash('/bare/reference/helpers/secretstream') });
  out.push({ from: withSlash('/reference/modules/bare-modules'), to: withSlash('/bare/reference/modules/bare-modules') });
  out.push({ from: withSlash('/reference/modules/pear-modules'), to: withSlash('/pear/reference/modules/pear-modules') });
  out.push({ from: withSlash('/reference/pear/api'), to: withSlash('/pear/reference/pear/api') });
  out.push({ from: withSlash('/reference/pear/cli'), to: withSlash('/pear/reference/pear/cli') });
  out.push({ from: withSlash('/reference/pear/configuration'), to: withSlash('/pear/reference/pear/configuration') });
  out.push({ from: withSlash('/reference/pear/runtime'), to: withSlash('/pear/reference/pear/runtime') });
  out.push({ from: withSlash('/reference/tools/drives'), to: withSlash('/bare/reference/tools/drives') });
  out.push({ from: withSlash('/reference/tools/hyperbeam'), to: withSlash('/bare/reference/tools/hyperbeam') });
  out.push({ from: withSlash('/reference/tools/hypershell'), to: withSlash('/bare/reference/tools/hypershell') });
  out.push({ from: withSlash('/reference/tools/hyperssh'), to: withSlash('/bare/reference/tools/hyperssh') });
  out.push({ from: withSlash('/reference/tools/hypertele'), to: withSlash('/bare/reference/tools/hypertele') });
  out.push({ from: withSlash('/release-overview'), to: withSlash('/pear/release-overview') });

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
