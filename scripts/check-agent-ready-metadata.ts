/**
 * Validates the two static agent-discovery files.
 *
 * The `public/.well-known/ai-catalog.json` and SKILL.md checks read only
 * from `public/` (the committed source) and run without a build, so this is
 * safe to wire into CI even though a full `next build` isn't available
 * there (see docs-lint.yml — it can't `npm install` the token-gated
 * `@tetherto/*` packages).
 *
 * If `out/` exists (i.e. this runs after `npm run build`, which triggers
 * `postbuild` as a lifecycle hook — don't run `postbuild` again separately,
 * it will re-run and its manifest-delete step is not idempotent against a
 * second invocation), this additionally cross-checks the generated
 * `out/.well-known/agent-skills/index.json` against the `public/` source:
 * each digest must match a fresh hash of the *source* SKILL.md, not the
 * `out/` copy — hashing the `out/` copy against a digest the generator just
 * computed from those same bytes moments earlier would only prove the
 * generator can hash, not that anything shipped correctly.
 */
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020';
import {
  parseSkillFrontMatter,
  validateSkillDescription,
  validateSkillName,
} from './agent-skills-shared';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUT_DIR = path.join(ROOT, 'out');
const SCHEMA_PATH = path.join(ROOT, 'scripts', 'schemas', 'ard-ai-catalog.schema.json');
const AGENT_SKILLS_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

const errors: string[] = [];

async function checkAiCatalog(): Promise<void> {
  const catalogPath = path.join(PUBLIC_DIR, '.well-known', 'ai-catalog.json');
  const [schema, raw] = await Promise.all([
    readFile(SCHEMA_PATH, 'utf8').then(JSON.parse),
    readFile(catalogPath, 'utf8'),
  ]);
  const doc = JSON.parse(raw);

  // strict:false — the vendored schema references "uri"/"date-time" formats
  // that ajv doesn't validate without the separate ajv-formats package;
  // structural checks (required, enum, additionalProperties, oneOf) still
  // run in full, which is what actually catches a broken manifest.
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const validate = ajv.compile(schema);
  if (!validate(doc)) {
    for (const e of validate.errors ?? []) {
      errors.push(`ai-catalog.json: ${e.instancePath || '(root)'} ${e.message}`);
    }
  }
}

async function checkAgentSkillsSource(): Promise<string[]> {
  const dir = path.join(PUBLIC_DIR, '.well-known', 'agent-skills');
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter((d) => d.isDirectory()).map((d) => d.name).sort();

  for (const name of dirs) {
    const label = `${name}/SKILL.md`;
    const raw = await readFile(path.join(dir, name, 'SKILL.md'), 'utf8').catch(() => null);
    if (raw === null) {
      errors.push(`agent-skills: ${label} does not exist`);
      continue;
    }
    try {
      const fm = parseSkillFrontMatter(raw, label);
      if (fm.name !== name) {
        errors.push(`agent-skills: ${label} front matter name "${fm.name}" must match its directory name`);
      }
      validateSkillName(fm.name, label);
      validateSkillDescription(fm.description, label);
    } catch (err) {
      errors.push((err as Error).message);
    }
  }
  return dirs;
}

async function checkGeneratedIndex(sourceDirs: string[]): Promise<void> {
  const indexPath = path.join(OUT_DIR, '.well-known', 'agent-skills', 'index.json');
  const raw = await readFile(indexPath, 'utf8').catch(() => null);
  if (raw === null) {
    console.log('No out/.well-known/agent-skills/index.json — skipping generated-index cross-check (run npm run build first for full coverage)');
    return;
  }

  const doc = JSON.parse(raw);
  if (doc.$schema !== AGENT_SKILLS_SCHEMA) {
    errors.push(`index.json: $schema must be "${AGENT_SKILLS_SCHEMA}"`);
  }
  if (!Array.isArray(doc.skills)) {
    errors.push('index.json: skills must be an array');
    return;
  }

  const seen = new Set<string>();
  for (const skill of doc.skills) {
    if (skill.type !== 'skill-md') {
      errors.push(`index.json: ${skill.name}: type must be "skill-md"`);
    }
    if (typeof skill.url !== 'string' || !skill.url.startsWith('/.well-known/agent-skills/')) {
      errors.push(`index.json: ${skill.name}: url "${skill.url}" is not a well-known agent-skills path`);
      continue;
    }
    seen.add(skill.name);

    // Cross-check against the SOURCE bytes in public/, not the out/ copy —
    // this is what actually catches a stale or corrupted build artifact.
    const sourcePath = path.join(PUBLIC_DIR, skill.url);
    const sourceBuf = await readFile(sourcePath).catch(() => null);
    if (!sourceBuf) {
      errors.push(`index.json: ${skill.name}: url resolves to ${sourcePath}, which doesn't exist in public/`);
      continue;
    }
    const digest = `sha256:${createHash('sha256').update(sourceBuf).digest('hex')}`;
    if (digest !== skill.digest) {
      errors.push(`index.json: ${skill.name}: digest doesn't match ${sourcePath} — regenerate the index`);
    }
  }

  for (const dir of sourceDirs) {
    if (!seen.has(dir)) {
      errors.push(`index.json: public/.well-known/agent-skills/${dir}/ has no matching entry`);
    }
  }
}

async function main(): Promise<void> {
  const sourceDirs = await checkAgentSkillsSource();
  await Promise.all([checkAiCatalog(), checkGeneratedIndex(sourceDirs)]);

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('agent-ready metadata OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
