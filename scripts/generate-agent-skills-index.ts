/**
 * Post-build: generates /.well-known/agent-skills/index.json from the
 * SKILL.md files `next build` already copied into `out/.well-known/agent-skills/`.
 *
 * Per the Agent Skills Discovery RFC v0.2.0, `digest` is a SHA-256 over the
 * exact bytes served at `url`. Computing it here — after `next build` has
 * copied `public/` into `out/` verbatim — guarantees the digest matches what
 * ships. Never hand-write digests in the index: a stale digest is a false
 * claim, and conforming clients MUST reject content that fails verification.
 *
 * Run after `next build`: tsx scripts/generate-agent-skills-index.ts
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseSkillFrontMatter,
  validateSkillDescription,
  validateSkillName,
} from './agent-skills-shared';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'out');
const SKILLS_DIR = path.join(OUT_DIR, '.well-known', 'agent-skills');
const INDEX_PATH = path.join(SKILLS_DIR, 'index.json');
const SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

async function writeIndex(skills: unknown[]): Promise<void> {
  await mkdir(SKILLS_DIR, { recursive: true });
  await writeFile(INDEX_PATH, `${JSON.stringify({ $schema: SCHEMA, skills }, null, 2)}\n`);
}

async function main(): Promise<void> {
  let dirs: string[];
  try {
    dirs = (await readdir(SKILLS_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    console.log(`No ${SKILLS_DIR} — writing an empty skills index`);
    await writeIndex([]);
    return;
  }

  const skills = [];
  for (const dir of dirs) {
    const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    const s = await stat(skillPath).catch(() => null);
    if (!s?.isFile()) throw new Error(`${dir}/ has no SKILL.md`);

    const buf = await readFile(skillPath); // Buffer — hash the exact served bytes
    const { name, description } = parseSkillFrontMatter(buf.toString('utf8'), `${dir}/SKILL.md`);

    if (name !== dir) {
      throw new Error(`${dir}/SKILL.md: front matter name "${name}" must match its directory name`);
    }
    validateSkillName(name, `${dir}/SKILL.md`);
    validateSkillDescription(description, `${dir}/SKILL.md`);

    skills.push({
      name,
      type: 'skill-md',
      description,
      url: `/.well-known/agent-skills/${name}/SKILL.md`,
      digest: `sha256:${createHash('sha256').update(buf).digest('hex')}`,
    });
  }

  await writeIndex(skills);
  console.log(`Wrote ${INDEX_PATH} with ${skills.length} skill(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
