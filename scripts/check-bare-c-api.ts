// scripts/check-bare-c-api.ts
//
// Compares the C API that Bare declares in its public headers with the C API
// these docs describe, and reports what is missing in either direction.
//
// Why this exists: the C embedding API on /bare/reference/bare/runtime is
// written by hand from include/bare.h and include/bare/module.h. Unlike the
// `Bare` global, it is not in npm/index.d.ts, so the doc-state generator
// (scripts/gen-bare-docs-states.ts) cannot see it, and a Bare release that adds
// a function would otherwise go unnoticed. A 2026-10 audit found that only
// bare_setup, bare_load, bare_run and bare_teardown were documented, out of
// about thirty declarations.
//
// Like check-upstream-pins.ts this is deliberately NOT a CI gate: a Bare release
// that adds a function should prompt a docs update, not turn every unrelated PR
// red. It exits 0 unless --strict is passed.
//
// Run as `npm run check:bare-c-api`.
//   --ref <tag>  the holepunchto/bare ref to read the headers at
//                (default: the latest release)
//   --strict     exit 1 if anything is undocumented or stale
import { readFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

const REPO = "holepunchto/bare";

/** Public headers that declare the C API, relative to the repo root. */
const HEADERS = ["include/bare.h", "include/bare/module.h"];

/** Pages that document it. A name has to appear on at least one of them. */
const PAGES = [
  "content/bare/reference/bare/runtime.mdx",
  "content/bare/reference/bare/embedder-context.mdx",
];

/**
 * Declarations that are intentionally not documented by name.
 *
 * `bare_module_t` and its callback typedefs are documented through
 * `BARE_MODULE()` and `bare_module_register()`, which are what an addon author
 * touches.
 */
const IGNORED = new Set([
  "bare_module_t",
  "bare_module_name_cb",
  "bare_module_register_cb",
]);

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

async function latestRelease(): Promise<string> {
  const { stdout } = await exec("gh", [
    "api",
    `repos/${REPO}/releases/latest`,
    "--jq",
    ".tag_name",
  ]);
  return stdout.trim();
}

async function fetchHeader(ref: string, path: string): Promise<string> {
  const { stdout } = await exec(
    "gh",
    [
      "api",
      `repos/${REPO}/contents/${path}?ref=${ref}`,
      "-H",
      "Accept: application/vnd.github.raw",
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );
  return stdout;
}

/**
 * Names the header declares: functions (the header puts the return type on one
 * line and the name at the start of the next), struct and callback typedefs, and
 * the struct tags behind the typedefs. A page may use a tag, as the
 * `bare_options_t` listing does with `struct bare_options_s`, but need not.
 */
function declaredNames(header: string): {
  functions: string[];
  types: string[];
  tags: string[];
} {
  const functions = [...header.matchAll(/^(bare_[a-z0-9_]+)\(/gm)].map(
    (m) => m[1],
  );
  const structs = [
    ...header.matchAll(/typedef\s+struct\s+(\w+)\s+(bare_[a-z0-9_]+);/g),
  ];
  const callbacks = [
    ...header.matchAll(/typedef\s+[^;(]*\(\*(bare_[a-z0-9_]+)\)/g),
  ].map((m) => m[1]);
  return {
    functions,
    types: [...structs.map((m) => m[2]), ...callbacks],
    tags: structs.map((m) => m[1]),
  };
}

/** Every `bare_*` identifier used in a page's prose or code. */
function mentionedNames(content: string): Set<string> {
  return new Set(
    [...content.matchAll(/\bbare_[a-z0-9_]+\b/g)].map((m) => m[0]),
  );
}

async function main() {
  const ref = argValue("--ref") ?? (await latestRelease());

  const functions = new Set<string>();
  const types = new Set<string>();
  const tags = new Set<string>();
  for (const path of HEADERS) {
    const found = declaredNames(await fetchHeader(ref, path));
    for (const f of found.functions) functions.add(f);
    for (const t of found.types) types.add(t);
    for (const t of found.tags) tags.add(t);
  }

  const mentioned = new Set<string>();
  for (const page of PAGES) {
    for (const name of mentionedNames(await readFile(page, "utf8")))
      mentioned.add(name);
  }

  const undocumented = [...functions, ...types]
    .filter((name) => !IGNORED.has(name) && !mentioned.has(name))
    .sort();

  // A documented `bare_*` that no header declares is stale. Drop the names that
  // are not declarations: macros are upper case and already excluded by the
  // pattern, and `bare_register_module_v0` and `bare_get_module_name_v0` are the
  // symbols the BARE_MODULE() macro generates.
  const GENERATED = /^bare_(register_module|get_module_name)_v\d+$/;
  const declared = new Set([...functions, ...types, ...tags, ...IGNORED]);
  const stale = [...mentioned]
    .filter((name) => !declared.has(name) && !GENERATED.test(name))
    .sort();

  console.log(
    `Bare C API at ${ref}: ${functions.size} functions and ${types.size} types declared, ` +
      `${mentioned.size} names used in the docs.`,
  );

  if (undocumented.length > 0) {
    console.log(`\nDeclared but not documented (${undocumented.length}):`);
    for (const name of undocumented) console.log(`  - ${name}`);
  }
  if (stale.length > 0) {
    console.log(`\nDocumented but not declared at ${ref} (${stale.length}):`);
    for (const name of stale) console.log(`  - ${name}`);
  }
  if (undocumented.length === 0 && stale.length === 0) {
    console.log("\nThe documented C API matches the headers.");
  }

  if (
    process.argv.includes("--strict") &&
    (undocumented.length > 0 || stale.length > 0)
  ) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
