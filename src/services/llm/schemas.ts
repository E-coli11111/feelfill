import { z } from 'zod';

import type {
  FilledInputFieldResult,
  ParsedInputFieldResult,
} from './types';

const inputFieldTargetSchema = z.object({
  selector: z.string(),
  part: z.string().optional(),
  option_label: z.string().optional(),
  option_value: z.string().optional(),
});

const inputFieldSchema = z.object({
  type: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
  targets: z.array(inputFieldTargetSchema),
});

const filledInputFieldSchema = z.object({
  value: z.string(),
  found: z.boolean(),
  evidence: z.string(),
});

/** Schema for webpage fields identified by the language model. */
export const parsedInputFieldResultSchema: z.ZodType<ParsedInputFieldResult> = z.object({
  field: z.record(z.string(), inputFieldSchema),
});

/** Schema for document values extracted by the language model. */
export const filledInputFieldResultSchema: z.ZodType<FilledInputFieldResult> = z.object({
  field: z.record(z.string(), filledInputFieldSchema),
});
