// scripts/bare-refgen/poll.ts
//
// Release poll for the regenerate-bare-refs workflow. Compares the npm `latest` version of each documented
// module against the committed version cache (scripts/bare-refgen/versions.json)
// and prints the modules that bumped as a comma-separated list on stdout, so the
// workflow can skip when nothing changed and regenerate only what moved. Prints
// the sentinel `*` when there's no cache yet (→ regenerate everything).
//
// Run: npm run bare-refs:poll

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { VERSIONS_JSON } from './config';

async function latestVersion(name: string): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
    if (!res.ok) return null;
    const json = (await res.json()) as { version?: string };
    return json.version ?? null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  if (!existsSync(VERSIONS_JSON)) {
    console.log('*'); // no cache → caller should regenerate everything
    console.error('No version cache yet — signalling a full regeneration.');
    return;
  }
  const cache = JSON.parse(await readFile(VERSIONS_JSON, 'utf8')) as Record<string, string>;
  const names = Object.keys(cache);

  const changed: string[] = [];
  await Promise.all(
    names.map(async (name) => {
      const latest = await latestVersion(name);
      if (latest && latest !== cache[name]) {
        changed.push(name);
        console.error(`  ${name}: ${cache[name]} → ${latest}`);
      }
    }),
  );

  changed.sort();
  console.error(changed.length ? `${changed.length} module(s) changed.` : 'No modules changed.');
  console.log(changed.join(',')); // stdout: the machine-readable list (empty = none)
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
