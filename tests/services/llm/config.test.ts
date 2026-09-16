import { describe, expect, it } from 'vitest';

import { parseStoredLLMConfig } from '@/src/services/llm/config';
import { SUPPORTED_MODELS } from '@/src/services/llm/registry';

describe('stored LLM configuration', () => {
  it('keeps provider and authentication method as independent dimensions', () => {
    const model = SUPPORTED_MODELS.openai[0];

    expect(parseStoredLLMConfig({
      auth_method: 'oauth',
      provider: 'openai',
      model,
    })).toMatchObject({
      auth_method: 'oauth',
      provider: 'openai',
      model,
    });
  });

  it('preserves a complete model object', () => {
    const model = SUPPORTED_MODELS.openai[0];

    expect(parseStoredLLMConfig({
      auth_method: 'api-key',
      provider: 'openai',
      model,
    })).toEqual({
      auth_method: 'api-key',
      provider: 'openai',
      model,
    });
  });

  it('defaults legacy provider-only configurations to API-key auth', () => {
    expect(parseStoredLLMConfig({ provider: 'anthropic' })).toMatchObject({
      auth_method: 'api-key',
      provider: 'anthropic',
    });
  });

  it('rejects invalid stored configuration', () => {
    expect(() => parseStoredLLMConfig({ provider: 'unknown' })).toThrow();
  });
});
