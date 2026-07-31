// scripts/check-internal-links.ts
import { readFile } from 'fs/promises';
import {
  CONTENT_DIR,
  getFiles,
  extractLinks,
  buildSlugSet,
  buildAnchorMap,
  buildAnchorGateMap,
  fileToSlug,
  isAssetLink,
  assetExists,
  type AnchorGate,
} from './helpers';
import {
  DOCS_VERSIONS_NEWEST_FIRST,
  STABLE_DOCS_VERSION,
  isGateHidden,
} from '../src/lib/docs-versions';

interface BrokenLink {
  file: string;
  link: string;
  type: 'page' | 'asset' | 'fragment' | 'version';
  detail?: string;
}

/**
 * Exact membership: an authored link may only name a declared label or value.
 *
 * Deliberately NOT `resolveDocsVersion`, which is lenient by design — it maps a
 * reader's arbitrary `?v=9.9` forward onto the newest doc-state. That leniency is
 * right for user input and wrong here, where it would let a typo'd version in our
 * own content resolve to something plausible and pass silently.
 */
function isDeclaredDocState(version: string): boolean {
  return DOCS_VERSIONS_NEWEST_FIRST.some(
    (v) => v.label === version || v.value === version,
  );
}

/** Whether an anchor's enclosing gates all apply to `version`. */
function anchorVisibleAt(gates: AnchorGate[], version: string): boolean {
  return !gates.some((g) => isGateHidden(version, g.since, g.until));
}

/** The declared doc-states an anchor does resolve on — used to suggest a fix. */
function versionsShowing(gates: AnchorGate[]): string[] {
  return DOCS_VERSIONS_NEWEST_FIRST.filter((v) =>
    anchorVisibleAt(gates, v.label),
  ).map((v) => v.label);
}

async function main() {
  console.log('🔍 Checking internal links...\n');

  const files = await getFiles(CONTENT_DIR);
  const allSlugs = buildSlugSet(files);
  const anchorMap = await buildAnchorMap(files);
  const anchorGateMap = await buildAnchorGateMap(files);
  const brokenLinks: BrokenLink[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const { internal } = extractLinks(content);
    const currentSlug = fileToSlug(file);

    for (const link of internal) {
      // Asset links bypass slug + fragment validation; they live in /public.
      if (link.path && isAssetLink(link.path)) {
        const exists = await assetExists(link.path);
        if (!exists) {
          brokenLinks.push({ file, link: link.raw, type: 'asset' });
        }
        continue;
      }

      // Resolve the slug to look up in the anchor map.
      const targetSlug = link.path === '' ? currentSlug : link.path;

      // Validate the page itself exists (skip for in-page links since they
      // always target the current file, which exists by construction).
      if (link.path && !allSlugs.has(link.path)) {
        brokenLinks.push({ file, link: link.raw, type: 'page' });
        continue;
      }

      // A `?v=` naming no declared doc-state can never filter to anything
      // sensible, so flag it wherever it appears.
      if (link.version && !isDeclaredDocState(link.version)) {
        brokenLinks.push({
          file,
          link: link.raw,
          type: 'version',
          detail:
            `?v=${link.version} is not a declared doc-state ` +
            `(have ${DOCS_VERSIONS_NEWEST_FIRST.map((v) => v.label).join(', ')})`,
        });
        continue;
      }

      // Validate the fragment, if any, against the target file's anchor set.
      if (link.fragment) {
        const anchors = anchorMap.get(targetSlug);
        if (!anchors || !anchors.has(link.fragment)) {
          brokenLinks.push({
            file,
            link: link.raw,
            type: 'fragment',
            detail: `target page ${targetSlug} has no anchor "${link.fragment}"`,
          });
          continue;
        }

        // The anchor exists in the source — but version gating can hide it, and a
        // link to a hidden section drops the reader at the top of the page. An
        // unversioned link is judged against the current stable release, because
        // that is what a reader following it is assumed to be running; a link
        // carrying `?v=` is judged against that release instead.
        const gates = anchorGateMap.get(targetSlug)?.get(link.fragment) ?? [];
        const target = link.version || STABLE_DOCS_VERSION.label;
        if (!anchorVisibleAt(gates, target)) {
          const showing = versionsShowing(gates);
          brokenLinks.push({
            file,
            link: link.raw,
            type: 'fragment',
            detail: link.version
              ? `"${link.fragment}" is gated away at ?v=${link.version}` +
                (showing.length ? `; it resolves on ${showing.join(', ')}` : '')
              : `"${link.fragment}" does not exist in Pear ${target} (current stable)` +
                (showing.length
                  ? `; add ?v=${showing[0]} to link at it deliberately`
                  : '; it is gated away on every declared version'),
          });
        }
      }
    }
  }

  console.log(`Checked ${files.length} files\n`);

  if (brokenLinks.length > 0) {
    const brokenPages = brokenLinks.filter((l) => l.type === 'page');
    const brokenAssets = brokenLinks.filter((l) => l.type === 'asset');
    const brokenFragments = brokenLinks.filter((l) => l.type === 'fragment');

    if (brokenPages.length > 0) {
      console.log('❌ Broken page links:\n');
      for (const { file, link } of brokenPages) {
        console.log(`   ${file}`);
        console.log(`   → ${link}\n`);
      }
    }

    if (brokenAssets.length > 0) {
      console.log('❌ Missing assets in /public:\n');
      for (const { file, link } of brokenAssets) {
        console.log(`   ${file}`);
        console.log(`   → ${link}\n`);
      }
    }

    if (brokenFragments.length > 0) {
      console.log('❌ Broken fragment links:\n');
      for (const { file, link, detail } of brokenFragments) {
        console.log(`   ${file}`);
        console.log(`   → ${link}`);
        if (detail) console.log(`     ${detail}`);
        console.log('');
      }
    }

    const badVersions = brokenLinks.filter((l) => l.type === 'version');
    if (badVersions.length > 0) {
      console.log('❌ Unknown ?v= platform versions:\n');
      for (const { file, link, detail } of badVersions) {
        console.log(`   ${file}`);
        console.log(`   → ${link}`);
        if (detail) console.log(`     ${detail}`);
        console.log('');
      }
    }

    process.exit(1);
  }

  console.log('✅ All internal links and assets are valid!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
