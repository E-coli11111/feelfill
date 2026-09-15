import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { listModels } from '@/src/services/llm/models';
import { SUPPORTED_MODELS } from '@/src/services/llm/registry';
import { getStorage } from '@/src/services/llm/storage';

describe('listModels', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('does not list models when no authentication method is logged in', async () => {
    await expect(listModels()).resolves.toEqual({});
  });

  it('only lists models for authentication methods with usable credentials', async () => {
    const storage = getStorage();
    await storage.set('llmAuth:openai%3Aapi-key', 'test-api-key');

    await expect(listModels()).resolves.toEqual({
      openai: {
        'api-key': SUPPORTED_MODELS.openai,
      },
    });
  });

  it('groups models under every logged-in authentication method', async () => {
    const storage = getStorage();
    await storage.set('llmAuth:openai%3Aapi-key', 'test-api-key');
    await storage.set('llmAuth:openai%3Aoauth', JSON.stringify({
      access_token: 'access-token',
      id_token: 'id-token',
      refresh_token: 'refresh-token',
    }));

    await expect(listModels()).resolves.toEqual({
      openai: {
        'api-key': SUPPORTED_MODELS.openai,
        oauth: SUPPORTED_MODELS.openai,
      },
    });
  });

  it('treats malformed persisted credentials as unauthenticated', async () => {
    const storage = getStorage();
    await storage.set('llmAuth:openai%3Aapi-key', 'test-api-key');
    await storage.set('llmAuth:openai%3Aoauth', '{invalid json');

    const models = await listModels();

    expect(models).toEqual({
      openai: {
        'api-key': SUPPORTED_MODELS.openai,
      },
    });
    expect(models.openai).not.toHaveProperty('oauth');
  });
});
