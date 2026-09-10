// scripts/check-includes.ts
//
// Validates that every Fumadocs `<include>…</include>` directive under content/
// resolves to a real file. Fumadocs resolves the path *relative to the including
// file*, so a page renders its snippet iff the resolved target exists.
//
// Nothing else guards this: `types:check` compiles frontmatter but does not
// resolve includes, so a wrong relative path — after moving a page, renaming a
// snippet, or hand-writing the `../` depth — would ship a page with a missing
// snippet and no build error. This check turns that into a CI failure.
//
// Run as `npm run check:includes`. Exit 0 on pass, 1 on any unresolved include.
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, normalize, relative } from 'path';

const CONTENT_DIR = 'content';
const INCLUDE_RE = /<include>\s*([^<\s]+?)\s*<\/include>/g;

/** Recursively collect every .md/.mdx under a directory (snippets included). */
async function findMdx(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findMdx(path)));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      out.push(path);
    }
  }
  return out;
}

interface Broken {
  file: string;
  target: string;
  resolved: string;
}

async function main(): Promise<void> {
  console.log('🔍 Checking <include> directives resolve...\n');

  const files = await findMdx(CONTENT_DIR);
  const broken: Broken[] = [];
  let total = 0;

  for (const file of files) {
    const body = await readFile(file, 'utf-8');
    for (const m of body.matchAll(INCLUDE_RE)) {
      total++;
      const target = m[1];
      const resolved = normalize(join(dirname(file), target));
      if (!existsSync(resolved)) {
        broken.push({ file: relative('.', file), target, resolved: relative('.', resolved) });
      }
    }
  }

  console.log(`Checked ${total} <include> directive(s) across ${files.length} files\n`);

  if (broken.length > 0) {
    console.log('❌ These <include> directives do not resolve:\n');
    for (const b of broken) {
      console.log(`   ${b.file}`);
      console.log(`     include:      ${b.target}`);
      console.log(`     resolves to:  ${b.resolved} (missing)\n`);
    }
    console.log(
      'The path is resolved from the including file. Fix the relative `../` depth,\n' +
        'or restore the snippet it points to under content/_snippets/.',
    );
    process.exit(1);
  }

  console.log('✅ All <include> directives resolve.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
