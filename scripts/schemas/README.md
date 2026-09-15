# Vendored schemas

`ard-ai-catalog.schema.json` — the normative JSON Schema for the ARD
(Agentic Resource Discovery) `ai-catalog.json` manifest, used to validate
`public/.well-known/ai-catalog.json` in `scripts/check-agent-ready-metadata.ts`.

Vendored (rather than fetched at check time) so validation works offline
and in CI without a network call. Source, fetched 2026-08-25:
https://raw.githubusercontent.com/ards-project/ard-spec/main/spec/schemas/ai-catalog.schema.json

The spec is a draft (v0.9) and may still change. Re-fetch and diff against
this file periodically; a schema change that breaks validation here means
`public/.well-known/ai-catalog.json` needs a matching update.
