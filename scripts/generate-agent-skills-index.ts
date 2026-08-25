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
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'out');
const SKILLS_DIR = path.join(OUT_DIR, '.well-known', 'agent-skills');
const INDEX_PATH = path.join(SKILLS_DIR, 'index.json');
const SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

// lowercase alphanumeric + single hyphens; no leading/trailing/double hyphen
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function parseFrontMatter(raw: string, file: string): { name: string; description: string } {
  const match = /^---\n([\s\S]*?)\n---/.exec(raw);
  if (!match) throw new Error(`${file}: missing YAML front matter (--- ... ---)`);

  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = /^([a-zA-Z-]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  if (!fields.name || !fields.description) {
    throw new Error(`${file}: front matter must set both name and description`);
  }
  return { name: fields.name, description: fields.description };
}

async function main(): Promise<void> {
  let dirs: string[];
  try {
    dirs = (await readdir(SKILLS_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    console.log(`No ${SKILLS_DIR} — writing an empty skills index`);
    await writeFile(INDEX_PATH, `${JSON.stringify({ $schema: SCHEMA, skills: [] }, null, 2)}\n`);
    return;
  }

  const skills = [];
  for (const dir of dirs) {
    const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    const s = await stat(skillPath).catch(() => null);
    if (!s?.isFile()) throw new Error(`${dir}/ has no SKILL.md`);

    const buf = await readFile(skillPath); // Buffer — hash the exact served bytes
    const raw = buf.toString('utf8');
    const { name, description } = parseFrontMatter(raw, `${dir}/SKILL.md`);

    if (name !== dir) {
      throw new Error(`${dir}/SKILL.md: front matter name "${name}" must match its directory name`);
    }
    if (!NAME_RE.test(name) || name.length > 64) {
      throw new Error(`${dir}/SKILL.md: name "${name}" violates the a-z0-9/hyphen naming rule`);
    }
    if (description.length > 1024) {
      throw new Error(`${dir}/SKILL.md: description exceeds 1024 characters`);
    }

    skills.push({
      name,
      type: 'skill-md',
      description,
      url: `/.well-known/agent-skills/${name}/SKILL.md`,
      digest: `sha256:${createHash('sha256').update(buf).digest('hex')}`,
    });
  }

  await writeFile(INDEX_PATH, `${JSON.stringify({ $schema: SCHEMA, skills }, null, 2)}\n`);
  console.log(`Wrote ${INDEX_PATH} with ${skills.length} skill(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
