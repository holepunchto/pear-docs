import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import nextConfig from '../next.config.mjs';
import { buildRedirects } from '../scripts/redirects';
import { customTree } from '../src/lib/custom-tree';

const BUILDING_BLOCK_SLUGS = [
  'hypercore',
  'hyperbee',
  'hyperdrive',
  'autobase',
  'hyperdht',
  'hyperswarm',
] as const;

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

test('dev redirects send legacy building-block URLs to canonical reference pages', async () => {
  const redirects = await nextConfig.redirects?.();
  assert.ok(redirects, 'expected next.config.mjs to define redirects()');

  assert.deepEqual(
    redirects.find((redirect) => redirect.source === '/building-blocks/:slug'),
    {
      source: '/building-blocks/:slug',
      destination: '/reference/building-blocks/:slug',
      permanent: true,
    }
  );

  assert.equal(
    redirects.some((redirect) => redirect.source === '/reference/building-blocks/:slug'),
    false,
    'canonical reference building-block URLs should not redirect away from their live path'
  );
});

test('static redirect stubs treat root building-block URLs as legacy paths', () => {
  const redirects = buildRedirects();

  for (const slug of BUILDING_BLOCK_SLUGS) {
    assert.deepEqual(
      redirects.find((redirect) => redirect.from === `/building-blocks/${slug}/`),
      {
        from: `/building-blocks/${slug}/`,
        to: `/reference/building-blocks/${slug}/`,
      }
    );
  }

  assert.equal(
    redirects.some((redirect) => redirect.from === '/reference/building-blocks/hypercore/'),
    false,
    'canonical reference building-block URLs should not be emitted as redirect stubs'
  );
});

test('sidebar points readers at canonical reference building-block pages', () => {
  const urls = collectUrls(customTree);

  for (const slug of BUILDING_BLOCK_SLUGS) {
    assert.ok(
      urls.includes(`/reference/building-blocks/${slug}`),
      `expected sidebar to link to /reference/building-blocks/${slug}`
    );
  }

  assert.equal(
    urls.some((url) => /^\/building-blocks\//.test(url)),
    false,
    'sidebar should not point at legacy root building-block URLs'
  );
});

test('reference building-block docs are full docs instead of link stubs', () => {
  for (const slug of BUILDING_BLOCK_SLUGS) {
    const body = stripFrontmatter(
      readFileSync(`content/reference/building-blocks/${slug}.mdx`, 'utf8')
    );

    assert.ok(
      body.length > 200,
      `expected content/reference/building-blocks/${slug}.mdx to contain the full rewritten doc`
    );
    assert.equal(
      /^\[https?:\/\/[^\]]+\]\(https?:\/\/[^)]+\)$/.test(body),
      false,
      `expected content/reference/building-blocks/${slug}.mdx not to be a single-link stub`
    );
  }
});
