// scripts/check-workers-in-sync.ts
//
// Enforces that every example updater worker stays byte-identical to the
// canonical one. All `examples/**/workers/main.js` files are inlined copies of
// upstream's `hello-pear-worker` package (holepunchto/hello-pear-worker) — the
// same worker `hello-pear-bare` and `hello-pear-electron` ship as
// `require('hello-pear-worker')`. The pear-chat scaffold and every how-to app
// that extends it reuse that exact worker.
//
// Because the host that spawns the worker passes its runtime config as
// positional arguments in one fixed order, the worker's argv parsing and the
// host's spawn array are a contract. If one worker copy drifts (a hand edit, or
// a partial re-sync after an upstream change), the contract silently breaks.
// This check makes that drift a CI failure instead of a runtime surprise.
//
// Canonical source: examples/getting-started/hello-pear-electron/workers/main.js
// (the copy embedded in the docs). When upstream `hello-pear-worker` changes,
// update the canonical first, then re-sync every other copy — see
// scripts/README or the getting-started reshape guide.
//
// Run as `npm run check:workers-in-sync`. Exit 0 on pass, 1 on any drift.
import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';

const EXAMPLES_DIR = 'examples';
const WORKER_SUFFIX = join('workers', 'main.js');
const CANONICAL = join(
  'examples',
  'getting-started',
  'hello-pear-electron',
  'workers',
  'main.js',
);

/** Recursively collect every `workers/main.js` under a directory. */
async function findWorkers(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findWorkers(path)));
    } else if (path.endsWith(WORKER_SUFFIX)) {
      out.push(path);
    }
  }
  return out;
}

async function main(): Promise<void> {
  console.log('🔍 Checking example updater workers are in sync...\n');

  const canonical = await readFile(CANONICAL, 'utf-8');
  const workers = (await findWorkers(EXAMPLES_DIR)).sort();

  const drifted: string[] = [];
  for (const worker of workers) {
    const body = await readFile(worker, 'utf-8');
    const rel = relative('.', worker);
    if (body === canonical) {
      console.log(`  ✓ ${rel}`);
    } else {
      console.log(`  ✗ ${rel}`);
      drifted.push(rel);
    }
  }

  console.log(
    `\nChecked ${workers.length} worker(s) against ${relative('.', CANONICAL)}\n`,
  );

  if (drifted.length > 0) {
    console.log('❌ These updater workers have drifted from the canonical copy:\n');
    for (const file of drifted) console.log(`   ${file}`);
    console.log(
      `\nEvery examples/**/workers/main.js must be byte-identical to\n` +
        `${relative('.', CANONICAL)} (an inline of hello-pear-worker).\n` +
        `Re-sync the drifted copies, and update every host's PearRuntime.run\n` +
        `spawn order to match if the worker's argv contract changed.`,
    );
    process.exit(1);
  }

  console.log('✅ All example updater workers are in sync.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
