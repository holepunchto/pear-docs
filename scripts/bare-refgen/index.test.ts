// scripts/bare-refgen/index.test.ts
//
// Locks the `--only`-narrowed-run merge behaviour for `_skipped.json` — a
// run scoped to a handful of modules must not clobber skip status recorded
// for every other module by earlier (full or differently-scoped) runs.
//
// Run: npm run test:bare-refs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { updateSkipped } from './index';

test('updateSkipped: an --only run does not drop unrelated modules from the cache', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bare-refgen-skipped-'));
  const skippedPath = join(dir, '_skipped.json');
  try {
    await writeFile(skippedPath, JSON.stringify(['bare-apk', 'bare-channel', 'bare-tui'], null, 2) + '\n');

    // --only bare-fs,bare-os narrows this run to two modules neither of
    // which are skipped — the pre-existing unrelated entries must survive.
    await updateSkipped(skippedPath, ['bare-fs', 'bare-os'], []);

    const result = JSON.parse(await readFile(skippedPath, 'utf8'));
    assert.deepEqual(result, ['bare-apk', 'bare-channel', 'bare-tui']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('updateSkipped: a touched module still gets its own status replaced', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bare-refgen-skipped-'));
  const skippedPath = join(dir, '_skipped.json');
  try {
    await writeFile(skippedPath, JSON.stringify(['bare-apk', 'bare-fs'], null, 2) + '\n');

    // bare-fs was previously skipped but is touched by this run and now
    // succeeds (not in `skipped`) — it should drop out of the cache, while
    // bare-os (also touched) newly fails and should be added.
    await updateSkipped(skippedPath, ['bare-fs', 'bare-os'], ['bare-os']);

    const result = JSON.parse(await readFile(skippedPath, 'utf8'));
    assert.deepEqual(result, ['bare-apk', 'bare-os']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
