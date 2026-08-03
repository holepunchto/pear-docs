// scripts/check-docs-versions.ts
//
// Validates the platform version-gating markers under content/ against the
// doc-states declared in src/lib/docs-versions.ts.
//
// Nothing else catches a wrong version string. The remark plugin rejects a
// malformed one at build time, but a WELL-FORMED version that is not a real
// doc-state — `since="3.2.0"` before 3.2 exists, or `since="3.10"` for a typo'd
// 3.1.0 — compiles to a gate whose `data-version-*` can never match any
// selectable option. The section then stays visible in every version with no
// error anywhere: the failure mode is silence, which is exactly what a check
// script is for. It also pins the invariants `DOCS_VERSIONS` has to hold, which
// were previously enforced only by a comment.
//
// Run as `npm run check:docs-versions`. Exit 0 on pass, 1 on any error.
import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import {
  DOCS_VERSIONS,
  DOCS_VERSIONS_NEWEST_FIRST,
  compareVersions,
} from '../src/lib/docs-versions';

const CONTENT_DIR = 'content';

/**
 * Every way a version can be written into a page. Each pattern captures the
 * version in group 1, so one loop handles them all.
 */
const MARKERS: { what: string; re: RegExp }[] = [
  { what: '<VersionSection>', re: /<VersionSection\b[^>]*?\b(?:since|until)="([^"]*)"/g },
  { what: '<VersionGate>', re: /<VersionGate\b[^>]*?\b(?:since|until)="([^"]*)"/g },
  { what: '<Since>/<Until>', re: /<(?:Since|Until)\b[^>]*?\bv="([^"]*)"/g },
  { what: 'fence marker', re: /\[!version\s+(?:since|until)=([^\]\s]+)\]/g },
];

const VERSION_RE = /^\d+(\.\d+){0,2}$/;

interface Problem {
  file: string;
  line: number;
  what: string;
  version: string;
  reason: string;
}

async function findMdx(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await findMdx(path)));
    else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) out.push(path);
  }
  return out;
}

/** Check DOCS_VERSIONS itself. These are invariants other code relies on. */
function checkVersionList(): string[] {
  const errors: string[] = [];

  const stable = DOCS_VERSIONS.filter((v) => v.stable);
  if (stable.length !== 1) {
    errors.push(
      `exactly one entry must be \`stable\`, found ${stable.length}` +
        (stable.length ? ` (${stable.map((v) => v.label).join(', ')})` : ''),
    );
  }

  for (const key of ['label', 'value'] as const) {
    const seen = new Map<string, number>();
    for (const v of DOCS_VERSIONS) seen.set(v[key], (seen.get(v[key]) ?? 0) + 1);
    for (const [val, n] of seen) {
      if (n > 1) errors.push(`duplicate ${key} "${val}" (${n} entries)`);
    }
  }

  for (const v of DOCS_VERSIONS) {
    if (!VERSION_RE.test(v.value)) {
      errors.push(`value "${v.value}" is not a bare version (no "v", no range)`);
    }
    // The dropdown writes `label` into `?v=`, and `resolveDocsVersion` maps it
    // back by comparing against `value`. A label that does not resolve to its
    // own entry would select a different doc-state than the reader clicked.
    if (VERSION_RE.test(v.label) && compareVersions(v.label, v.value) !== 0) {
      errors.push(
        `label "${v.label}" does not compare equal to value "${v.value}", so selecting it would resolve to another doc-state`,
      );
    }
  }

  return errors;
}

async function main(): Promise<void> {
  console.log('🔍 Checking platform version gates against DOCS_VERSIONS...\n');

  const listErrors = checkVersionList();
  const known = new Set(DOCS_VERSIONS.map((v) => v.value));
  const oldest = DOCS_VERSIONS_NEWEST_FIRST.at(-1);

  const files = await findMdx(CONTENT_DIR);
  const problems: Problem[] = [];
  let total = 0;

  for (const file of files) {
    const body = await readFile(file, 'utf-8');
    const lineAt = (index: number) => body.slice(0, index).split('\n').length;

    for (const { what, re } of MARKERS) {
      for (const m of body.matchAll(re)) {
        const version = m[1];
        // The authoring template in the cli.mdx maintainer note uses literal
        // placeholders; skip them rather than making the note un-writable.
        if (version.includes('x.y.z')) continue;
        total++;

        let reason = '';
        if (!VERSION_RE.test(version)) {
          reason = 'not a bare version (no "v", no range)';
        } else if (!known.has(version)) {
          reason = known.size
            ? `not a declared doc-state (have ${[...known].join(', ')})`
            : 'no doc-states declared';
        } else if (oldest && compareVersions(version, oldest.value) <= 0) {
          // A `since` at or below the oldest doc-state is never hidden by any
          // selection, so the gate is inert and the marker is misleading.
          reason = `at or below the oldest doc-state (${oldest.value}), so the gate can never hide anything`;
        }

        if (reason) {
          problems.push({
            file: relative('.', file),
            line: lineAt(m.index ?? 0),
            what,
            version,
            reason,
          });
        }
      }
    }
  }

  console.log(
    `Checked ${total} version marker(s) across ${files.length} files, ` +
      `against ${DOCS_VERSIONS.length} doc-state(s)\n`,
  );

  if (listErrors.length === 0 && problems.length === 0) {
    console.log('✅ All version gates reference a declared doc-state.');
    return;
  }

  if (listErrors.length > 0) {
    console.error('❌ src/lib/docs-versions.ts:');
    for (const e of listErrors) console.error(`   ${e}`);
    console.error('');
  }

  if (problems.length > 0) {
    console.error(`❌ ${problems.length} bad version marker(s):\n`);
    for (const p of problems) {
      console.error(`   ${p.file}:${p.line}`);
      console.error(`     ${p.what} "${p.version}" — ${p.reason}`);
    }
    console.error(
      '\n   Add the release to DOCS_VERSIONS in src/lib/docs-versions.ts, or correct the marker.',
    );
  }

  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
