/**
 * Minimal ambient types for `@qvac/sdk`, covering only what
 * `scripts/mcp-embedder.ts` calls.
 *
 * The package is deliberately not a declared dependency of this repo — it pulls
 * ~176 packages including native binaries, for one script that only the manual
 * "Build MCP search index" workflow runs. Without this file `npm run
 * types:check` would fail with TS2307 for every contributor, which is a worse
 * trade than a hand-written surface for three functions.
 *
 * If the SDK's real shape drifts from this, the workflow fails at runtime
 * rather than at typecheck. Keep it narrow so there is less to drift.
 */
declare module '@qvac/sdk' {
  export function loadModel(opts: {
    modelSrc: string;
    modelType: string;
    modelConfig?: Record<string, unknown>;
  }): Promise<string>;

  export function embed(opts: {
    modelId: string;
    text: string | string[];
  }): Promise<{
    /** A single vector for a string input, or one per element for an array. */
    embedding: number[] | number[][];
    stats?: { backendDevice?: string };
  }>;

  export function unloadModel(opts: { modelId: string; clearStorage?: boolean }): Promise<void>;
}
