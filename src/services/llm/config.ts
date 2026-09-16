import { z } from 'zod';

import type { LLMConfig } from '@/src/services/llm/types';

const llmModelSchema = z.object({
  id: z.string().min(1),
  display_name: z.string().min(1),
  provider: z.enum([
    'openai',
    'anthropic',
    'google',
    'openrouter',
    'xai',
    'custom',
  ]),
  auth_methods: z.array(z.enum(['api-key', 'oauth'])),
  capabilities: z.object({
    text: z.boolean(),
    image: z.boolean(),
    file: z.boolean(),
    stream: z.boolean(),
    structured_output: z.boolean(),
  }),
  context_window: z.number().optional(),
  max_output_tokens: z.number().optional(),
  enabled: z.boolean(),
  recommended: z.boolean().optional(),
  description: z.string().optional(),
});

const storedLLMConfigSchema = z.object({
  auth_method: z.enum(['api-key', 'oauth']).optional(),
  base_url: z.string().optional(),
  api_version: z.string().optional(),
  deployment_name: z.string().optional(),
  model: llmModelSchema.optional(),
  provider: z.enum([
    'openai',
    'anthropic',
    'google',
    'openrouter',
    'xai',
    'custom',
  ]),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  top_p: z.number().optional(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
});

/**
 * Validates stored model configuration and applies the default auth method.
 */
export function parseStoredLLMConfig(value: unknown): LLMConfig {
  const parsed = storedLLMConfigSchema.parse(value);

  return {
    ...parsed,
    auth_method: parsed.auth_method ?? 'api-key',
  };
}
