/**
 * Validates the static agent-discovery files against `out/` so a bad
 * hand-edit or stale build artifact fails loudly instead of shipping silently.
 * Run after `npm run build && npm run postbuild` (postbuild regenerates both
 * files this checks, so a failure here means the source SKILL.md/ai-catalog
 * content itself is malformed, not just stale).
 */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'out');

const URN_RE = /^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/;
const errors: string[] = [];

async function checkAiCatalog() {
  const raw = await readFile(path.join(OUT_DIR, '.well-known', 'ai-catalog.json'), 'utf8');
  const doc = JSON.parse(raw);
  if (doc.specVersion !== '1.0') errors.push('ai-catalog.json: specVersion must be "1.0"');
  if (!Array.isArray(doc.entries)) errors.push('ai-catalog.json: entries must be an array');
  for (const e of doc.entries ?? []) {
    if (!URN_RE.test(e.identifier)) errors.push(`ai-catalog.json: bad identifier "${e.identifier}"`);
    const hasUrl = 'url' in e;
    const hasData = 'data' in e;
    if (hasUrl === hasData) errors.push(`ai-catalog.json: ${e.identifier} must have exactly one of url/data`);
    if (e.representativeQueries && (e.representativeQueries.length < 2 || e.representativeQueries.length > 5)) {
      errors.push(`ai-catalog.json: ${e.identifier} representativeQueries must have 2-5 items`);
    }
  }
}

async function checkAgentSkills() {
  const dir = path.join(OUT_DIR, '.well-known', 'agent-skills');
  const raw = await readFile(path.join(dir, 'index.json'), 'utf8');
  const doc = JSON.parse(raw);
  for (const skill of doc.skills ?? []) {
    const file = path.join(dir, skill.name, 'SKILL.md');
    const buf = await readFile(file).catch(() => null);
    if (!buf) {
      errors.push(`agent-skills: ${skill.name} has no SKILL.md on disk`);
      continue;
    }
    const digest = `sha256:${createHash('sha256').update(buf).digest('hex')}`;
    if (digest !== skill.digest) {
      errors.push(`agent-skills: ${skill.name} digest mismatch — index.json is stale, regenerate it`);
    }
  }
}

async function main() {
  await checkAiCatalog();
  await checkAgentSkills();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('agent-ready metadata OK');
}
main();
