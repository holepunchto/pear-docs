/**
 * Origin of the search + MCP service (see `service/README.md`).
 *
 * ⚠️ TEMPORARY TEST PIN — drop this commit before merging.
 *
 * The default below is hardcoded to a LOCAL service so the deployed Sevalla
 * preview can be exercised before the search Application exists. The preview page
 * is served over HTTPS and calls plain HTTP here, which works only because
 * browsers treat `localhost` as a potentially-trustworthy origin and exempt it
 * from mixed-content blocking. It therefore works on one machine — whichever one
 * is running `npm --prefix service start` — and silently falls back to the static
 * Orama index for everyone else.
 *
 * The reason a pin is needed at all: `NEXT_PUBLIC_*` is inlined at BUILD time by
 * the static export. Unset during the build, it compiles to a `process.env` lookup
 * against a shim that is empty in the browser, so the value is `undefined` at
 * runtime no matter what is configured on the pod afterwards. That is what left
 * the MCP action unrendered in the `commit-6c4eb69` preview.
 *
 * Once the Application exists, delete this file's default and set
 * NEXT_PUBLIC_SEARCH_API_URL in the STATIC SITE's build environment.
 */
const TEST_PIN = 'http://localhost:8787';

export const SEARCH_SERVICE_ORIGIN = (
  process.env.NEXT_PUBLIC_SEARCH_API_URL || TEST_PIN
).replace(/\/$/, '');

/** Streamable-HTTP MCP endpoint clients connect to. */
export const MCP_ENDPOINT = `${SEARCH_SERVICE_ORIGIN}/mcp`;
