import { z } from 'zod';

import type { LLMConfig } from '@/src/services/llm/types';

const storedLLMConfigSchema = z.object({
  auth_method: z.enum(['api-key', 'oauth']).optional(),
  base_url: z.string().optional(),
  api_version: z.string().optional(),
  deployment_name: z.string().optional(),
  model_name: z.string().optional(),
  provider: z.enum([
    'openai',
    'openai-codex',
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
 * Validates stored model configuration and normalizes the legacy Codex
 * provider ID into the provider/auth-method pair used by the current model.
 */
export function parseStoredLLMConfig(value: unknown): LLMConfig {
  const parsed = storedLLMConfigSchema.parse(value);
  const provider = parsed.provider === 'openai-codex'
    ? 'openai'
    : parsed.provider;

  return {
    ...parsed,
    provider,
    auth_method: parsed.provider === 'openai-codex'
      ? 'oauth'
      : parsed.auth_method ?? 'api-key',
  };
}
