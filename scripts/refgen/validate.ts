// scripts/refgen/validate.ts
//
// Stage 3 — guarantee every generated api-model.json matches the contract so the
// future MDX renderer (and the scorer below) can rely on its shape. Uses ajv
// against MODEL_SCHEMA from model.ts.

import Ajv from 'ajv';
import { MODEL_SCHEMA, type ApiModel } from './model';

const ajv = new Ajv({ allErrors: true });
const validateFn = ajv.compile(MODEL_SCHEMA);

/** Throws with a readable message if the model violates the schema. */
export function validateModel(model: ApiModel): void {
  if (validateFn(model)) return;
  const errors = (validateFn.errors ?? [])
    .map((e) => `  ${(e as { dataPath?: string }).dataPath || '(root)'} ${e.message}`)
    .join('\n');
  throw new Error(`api-model failed schema validation:\n${errors}`);
}
