import { describe, expect, it } from 'vitest';

import { parseStoredLLMConfig } from '@/src/services/llm/config';

describe('stored LLM configuration', () => {
  it('keeps provider and authentication method as independent dimensions', () => {
    expect(parseStoredLLMConfig({
      auth_method: 'oauth',
      provider: 'openai',
      model_name: 'codex-test',
    })).toMatchObject({
      auth_method: 'oauth',
      provider: 'openai',
      model_name: 'codex-test',
    });
  });

  it('migrates the legacy OpenAI Codex provider configuration', () => {
    expect(parseStoredLLMConfig({
      provider: 'openai-codex',
      model_name: 'codex-test',
    })).toMatchObject({
      auth_method: 'oauth',
      provider: 'openai',
      model_name: 'codex-test',
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
