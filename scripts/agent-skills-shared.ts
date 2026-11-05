/**
 * Shared between generate-agent-skills-index.ts (writes the index) and
 * check-agent-ready-metadata.ts (validates it), so both agree on what a
 * valid SKILL.md looks like.
 *
 * Front matter is parsed with js-yaml rather than a hand-rolled regex:
 * js-yaml rejects duplicate keys by default and handles quoted, folded
 * (`>-`) and multi-line scalars correctly, none of which a per-line
 * `key: value` regex can do safely.
 */
import { load as loadYaml } from 'js-yaml';

// lowercase alphanumeric + single hyphens; no leading/trailing/double hyphen
export const SKILL_NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SKILL_NAME_MAX_LENGTH = 64;
export const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

// The closing `---` must be a line of its own, immediately after the opening
// one — this keeps a stray `---` thematic break further down in the body
// from being mistaken for the delimiter (which would otherwise swallow body
// text into "front matter" and hand it to the YAML parser).
const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export interface SkillFrontMatter {
  name: string;
  description: string;
}

export function parseSkillFrontMatter(raw: string, label: string): SkillFrontMatter {
  const match = FRONT_MATTER_RE.exec(raw);
  if (!match) {
    throw new Error(`${label}: missing YAML front matter (--- ... ---) at the start of the file`);
  }

  let data: unknown;
  try {
    data = loadYaml(match[1]);
  } catch (err) {
    throw new Error(`${label}: front matter is not valid YAML: ${(err as Error).message}`);
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${label}: front matter must be a YAML mapping`);
  }

  const { name, description } = data as Record<string, unknown>;
  if (typeof name !== 'string' || !name) {
    throw new Error(`${label}: front matter "name" must be a non-empty string`);
  }
  if (typeof description !== 'string' || !description) {
    throw new Error(`${label}: front matter "description" must be a non-empty string`);
  }

  return { name, description };
}

export function validateSkillName(name: string, label: string): void {
  if (!SKILL_NAME_RE.test(name) || name.length > SKILL_NAME_MAX_LENGTH) {
    throw new Error(`${label}: name "${name}" violates the a-z0-9/hyphen naming rule (max ${SKILL_NAME_MAX_LENGTH} chars)`);
  }
}

export function validateSkillDescription(description: string, label: string): void {
  if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
    throw new Error(`${label}: description exceeds ${SKILL_DESCRIPTION_MAX_LENGTH} characters`);
  }
}
