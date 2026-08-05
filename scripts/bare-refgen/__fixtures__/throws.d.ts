// A `@throws {TYPE} condition` JSDoc tag — TypeScript parses the `{TYPE}`
// brace group as the tag's own `typeExpression`, not as text inside
// `comment`, unlike most other JSDoc tags.
/**
 * @throws {ALREADY_SENT} the request has already been sent.
 */
export declare function risky(): void
