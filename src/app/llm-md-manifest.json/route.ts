import { getLLMText, source } from '@/lib/source';

// Resolves at build time → `out/llm-md-manifest.json` under `output: 'export'`.
export const dynamic = 'force-static';
export const revalidate = false;

/**
 * Build-time manifest for `scripts/generate-llm-md-files.ts`, which writes one
 * `out/<slug>.md` per page for Copy page / AI fetch. Deleted after postbuild.
 */
export async function GET() {
  const entries = await Promise.all(
    source.getPages().map(async (page) => ({
      url: page.url,
      slugs: page.slugs,
      content: await getLLMText(page),
    })),
  );

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}
