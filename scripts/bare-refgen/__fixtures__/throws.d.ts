// A `@throws {TYPE} condition` JSDoc tag — TypeScript parses the `{TYPE}`
// brace group as the tag's own `typeExpression`, not as text inside
// `comment`, unlike most other JSDoc tags.
/**
 * @throws {ALREADY_SENT} the request has already been sent.
 */
export declare function risky(): void

// `@param name - description` (no `{type}` before the name) — unlike
// `@throws`, TypeScript leaves the `- ` separator as literal text inside
// `comment`; emit-tsdoc.ts writes exactly this style.
/**
 * @param buffer - The buffer to fill.
 */
export declare function fill(buffer: unknown): void
