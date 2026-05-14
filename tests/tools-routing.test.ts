import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import nextConfig from '../next.config.mjs';
import { buildRedirects } from '../scripts/redirects';
import { customTree } from '../src/lib/custom-tree';

const TOOL_SLUGS = [
  'hypershell',
  'hypertele',
  'hyperbeam',
  'hyperssh',
  'drives',
] as const;

const TOOL_PAGE_EXPECTATIONS: Record<(typeof TOOL_SLUGS)[number], readonly string[]> = {
  hypershell: [
    'Desktop only:',
    'npm i -g hypershell',
    '## Common workflows',
    'hypershell-keygen',
    'hypershell-server',
    'hypershell-copy',
  ],
  hypertele: [
    'Desktop only:',
    'npm i -g hypertele',
    '## Common workflows',
    'hypertele-server',
    '## Prerequisites',
    'hyper-cmd-util-keygen',
  ],
  hyperbeam: [
    'Desktop only:',
    'npm i -g hyperbeam',
    '## Common workflows',
    '`-r`',
  ],
  hyperssh: [
    'Desktop only:',
    'npm i -g hyperssh',
    'npm i -g hypertele',
    '## Common workflows',
    'hyperssh-fuse',
    '## Prerequisites',
    'hyper-cmd-util-keygen',
  ],
  drives: [
    'Desktop only:',
    'npm i -g drives',
    '## Common workflows',
    'drives touch',
    'drives mirror',
    'drives seed',
    'read once at startup',
    'either direction',
  ],
};

/**
 * Patterns that must NOT appear in the rewritten tool docs. Each entry has a
 * regex and an explanation so failure messages point at the specific
 * regression we're guarding against rather than a raw pattern.
 */
const TOOL_PAGE_FORBIDDEN: Record<(typeof TOOL_SLUGS)[number], readonly { pattern: RegExp; reason: string }[]> = {
  hypershell: [
    {
      // Sample alias entries must use a valid 32-byte (64 hex char) key, not a
      // truncated literal that wouldn't decode at runtime.
      pattern: /^home\s+[0-9a-f]{1,63}$/m,
      reason: 'known_peers sample key must be a full 64-character hex string',
    },
  ],
  hypertele: [],
  hyperbeam: [],
  hyperssh: [],
  drives: [],
};

function collectUrls(nodes: typeof customTree): string[] {
  const urls: string[] = [];

  for (const node of nodes) {
    if ('url' in node && typeof node.url === 'string') {
      urls.push(node.url);
    }

    if ('index' in node && node.index && 'url' in node.index && typeof node.index.url === 'string') {
      urls.push(node.index.url);
    }

    if ('children' in node && Array.isArray(node.children)) {
      urls.push(...collectUrls(node.children));
    }
  }

  return urls;
}

function stripFrontmatter(mdx: string): string {
  return mdx.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
}

test('dev redirects send legacy tool URLs to canonical reference pages', async () => {
  const redirects = await nextConfig.redirects?.();
  assert.ok(redirects, 'expected next.config.mjs to define redirects()');

  assert.deepEqual(
    redirects.find((redirect) => redirect.source === '/tools/:slug'),
    {
      source: '/tools/:slug',
      destination: '/reference/tools/:slug',
      permanent: true,
    }
  );

  assert.equal(
    redirects.some((redirect) => redirect.source === '/reference/tools/:slug'),
    false,
    'canonical reference tool URLs should not redirect away from their live path'
  );
});

test('static redirect stubs treat root tool URLs as legacy paths', () => {
  const redirects = buildRedirects();

  for (const slug of TOOL_SLUGS) {
    assert.deepEqual(
      redirects.find((redirect) => redirect.from === `/tools/${slug}/`),
      {
        from: `/tools/${slug}/`,
        to: `/reference/tools/${slug}/`,
      }
    );
  }

  assert.equal(
    redirects.some((redirect) => redirect.from === '/reference/tools/hypershell/'),
    false,
    'canonical reference tool URLs should not be emitted as redirect stubs'
  );
});

test('sidebar points readers at canonical reference tool pages', () => {
  const urls = collectUrls(customTree);

  for (const slug of TOOL_SLUGS) {
    assert.ok(
      urls.includes(`/reference/tools/${slug}`),
      `expected sidebar to link to /reference/tools/${slug}`
    );
  }

  assert.equal(
    urls.some((url) => /^\/tools\//.test(url)),
    false,
    'sidebar should not point at legacy root tool URLs'
  );
});

test('reference tool docs are full docs instead of link stubs', () => {
  for (const slug of TOOL_SLUGS) {
    const body = stripFrontmatter(
      readFileSync(`content/reference/tools/${slug}.mdx`, 'utf8')
    );

    assert.ok(
      body.length > 400,
      `expected content/reference/tools/${slug}.mdx to contain the full rewritten doc`
    );
    assert.equal(
      /^\[https?:\/\/[^\]]+\]\(https?:\/\/[^)]+\)$/.test(body),
      false,
      `expected content/reference/tools/${slug}.mdx not to be a single-link stub`
    );

    for (const expected of TOOL_PAGE_EXPECTATIONS[slug]) {
      assert.equal(
        body.includes(expected),
        true,
        `expected content/reference/tools/${slug}.mdx to include ${expected}`
      );
    }

    for (const { pattern, reason } of TOOL_PAGE_FORBIDDEN[slug]) {
      assert.equal(
        pattern.test(body),
        false,
        `content/reference/tools/${slug}.mdx violates: ${reason}`
      );
    }
  }
});

test('duplicate top-level tool stub pages are removed', () => {
  for (const slug of TOOL_SLUGS) {
    assert.equal(
      existsSync(`content/tools/${slug}.mdx`),
      false,
      `expected content/tools/${slug}.mdx to be removed`
    );
  }
});
