/**
 * Post-build: adds a Content-Signal directive to `out/robots.txt`.
 *
 * `src/app/robots.ts` builds robots.txt through Next's `MetadataRoute.Robots`,
 * whose type only models user-agent/allow/disallow/sitemap — there is no way to
 * emit a `Content-Signal:` line from it. So the directive is injected here
 * instead, into every `User-Agent` group (a crawler obeys only its most
 * specific group).
 *
 * Signals mirror the crawl rules in robots.txt: the docs are open, so search,
 * AI answers and model training are all allowed.
 *
 * Run after `next build`. See https://contentsignals.org.
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROBOTS_PATH = path.join(ROOT, 'out', 'robots.txt');

const SIGNAL = 'Content-Signal: search=yes, ai-input=yes, ai-train=yes';

const PREAMBLE = `# Content Signals (https://contentsignals.org) declare how this site's content
# may be used. The directive below states:
#   search=yes    - build a search index and link back to the source
#   ai-input=yes  - use as input to an AI answer that cites the source
#   ai-train=yes  - may be used to train a generative AI model
# Absence of a signal is not permission. Signals are a statement of the site
# owner's preferences, not a licence grant or a technical access control.
`;

async function main(): Promise<void> {
  const robots = await readFile(ROBOTS_PATH, 'utf8');

  if (robots.includes('Content-Signal:')) {
    console.log('robots.txt already carries a Content-Signal directive');
    return;
  }

  const group = /^User-Agent: \*$/m;
  if (!group.test(robots)) {
    throw new Error(
      `No "User-Agent: *" group in ${ROBOTS_PATH} to attach Content-Signal to`,
    );
  }

  let groups = 0;
  const withSignals = robots
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      const last = lines.findLastIndex((l) => /^User-Agent: /i.test(l));
      if (last === -1) return block;
      lines.splice(last + 1, 0, SIGNAL);
      groups++;
      return lines.join('\n');
    })
    .join('\n\n');
  await writeFile(ROBOTS_PATH, `${PREAMBLE}\n${withSignals}`, 'utf8');
  console.log(`Injected Content-Signal directive into ${groups} robots.txt groups`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
