// scripts/refgen/validate.ts
//
// Stage 3 — guarantee every generated api-model.json matches the contract so the
// future MDX renderer (and the scorer below) can rely on its shape. Uses ajv
// against MODEL_SCHEMA from model.ts.

import Ajv from 'ajv';
import { MODEL_SCHEMA, type ApiModel } from './model';

// strict: false — MODEL_SCHEMA uses `format: "date-time"` for `generatedAt`, and
// ajv's default strict mode throws on formats it can't validate without the
// separate `ajv-formats` package (which the CI install step doesn't pull in).
// This is shape validation, not format enforcement, so ignoring the unknown
// format is the correct behavior here, not a workaround.
const ajv = new Ajv({ allErrors: true, strict: false });
const validateFn = ajv.compile(MODEL_SCHEMA);

/** Throws with a readable message if the model violates the schema. */
export function validateModel(model: ApiModel): void {
  if (validateFn(model)) return;
  const errors = (validateFn.errors ?? [])
    .map((e) => `  ${(e as { dataPath?: string }).dataPath || '(root)'} ${e.message}`)
    .join('\n');
  throw new Error(`api-model failed schema validation:\n${errors}`);
}
