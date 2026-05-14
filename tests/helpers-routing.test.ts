import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import nextConfig from '../next.config.mjs';
import { buildRedirects } from '../scripts/redirects';
import { customTree } from '../src/lib/custom-tree';

const HELPER_SLUGS = [
  'corestore',
  'localdrive',
  'mirrordrive',
  'secretstream',
  'compact-encoding',
  'protomux',
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

test('dev redirects send legacy helper URLs to canonical reference pages', async () => {
  const redirects = await nextConfig.redirects?.();
  assert.ok(redirects, 'expected next.config.mjs to define redirects()');

  assert.deepEqual(
    redirects.find((redirect) => redirect.source === '/helpers/:slug'),
    {
      source: '/helpers/:slug',
      destination: '/reference/helpers/:slug',
      permanent: true,
    }
  );

  assert.equal(
    redirects.some((redirect) => redirect.source === '/reference/helpers/:slug'),
    false,
    'canonical reference helper URLs should not redirect away from their live path'
  );
});

test('static redirect stubs treat root helper URLs as legacy paths', () => {
  const redirects = buildRedirects();

  for (const slug of HELPER_SLUGS) {
    assert.deepEqual(
      redirects.find((redirect) => redirect.from === `/helpers/${slug}/`),
      {
        from: `/helpers/${slug}/`,
        to: `/reference/helpers/${slug}/`,
      }
    );
  }

  assert.equal(
    redirects.some((redirect) => redirect.from === '/reference/helpers/corestore/'),
    false,
    'canonical reference helper URLs should not be emitted as redirect stubs'
  );
});

test('sidebar points readers at canonical reference helper pages', () => {
  const urls = collectUrls(customTree);

  for (const slug of HELPER_SLUGS) {
    assert.ok(
      urls.includes(`/reference/helpers/${slug}`),
      `expected sidebar to link to /reference/helpers/${slug}`
    );
  }

  assert.equal(
    urls.some((url) => /^\/helpers\//.test(url)),
    false,
    'sidebar should not point at legacy root helper URLs'
  );
});

test('reference helper docs are full docs instead of link stubs', () => {
  for (const slug of HELPER_SLUGS) {
    const body = stripFrontmatter(readFileSync(`content/reference/helpers/${slug}.mdx`, 'utf8'));

    assert.ok(
      body.length > 200,
      `expected content/reference/helpers/${slug}.mdx to contain the full rewritten doc`
    );
    assert.equal(
      /^\[https?:\/\/[^\]]+\]\(https?:\/\/[^)]+\)$/.test(body),
      false,
      `expected content/reference/helpers/${slug}.mdx not to be a single-link stub`
    );
  }
});

test('legacy helper source pages are removed once redirects are canonical', () => {
  for (const slug of HELPER_SLUGS) {
    assert.equal(
      existsSync(`content/helpers/${slug}.mdx`),
      false,
      `expected content/helpers/${slug}.mdx to be removed after the helper migration`
    );
  }
});
