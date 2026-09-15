import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { getStorage } from '@/src/services/llm/storage';

describe('LLM configuration storage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('returns null when model configuration has not been stored', async () => {
    const storage = getStorage();

    await expect(storage.getLLMConfig()).resolves.toBeNull();
  });

  it('validates model configuration when saving and loading it', async () => {
    const storage = getStorage();
    await storage.setLLMConfig({
      auth_method: 'oauth',
      provider: 'openai',
      model_name: 'gpt-5.6-terra',
      temperature: 0.2,
    });

    await expect(storage.getLLMConfig()).resolves.toEqual({
      auth_method: 'oauth',
      provider: 'openai',
      model_name: 'gpt-5.6-terra',
      temperature: 0.2,
    });
    await expect(
      fakeBrowser.storage.local.get('llmConfig'),
    ).resolves.toHaveProperty('llmConfig');
  });

  it('rejects invalid model configuration before writing it', async () => {
    const storage = getStorage();

    await expect(storage.setLLMConfig({
      auth_method: 'api-key',
      provider: 'unknown',
    })).rejects.toThrow();

    await expect(
      fakeBrowser.storage.local.get('llmConfig'),
    ).resolves.toEqual({});
  });
});
