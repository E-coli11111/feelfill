import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { ApiKeyAuth } from '@/src/services/llm/auth/api-auth';

describe('ApiKeyAuth', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('implements the API-key adapter identity', () => {
    const auth = new ApiKeyAuth('openai');

    expect(auth.provider).toBe('openai');
    expect(auth.type).toBe('api-key');
  });

  it('stores and retrieves an API key for a provider', async () => {
    const auth = new ApiKeyAuth('openai');

    await auth.setCredentials('test-api-key');

    expect(await auth.getCredentials()).toBe('test-api-key');
    expect(await auth.getProviderCredential()).toBe('test-api-key');
  });

  it('isolates API keys by provider', async () => {
    const openAIAuth = new ApiKeyAuth('openai');
    const anthropicAuth = new ApiKeyAuth('anthropic');

    await openAIAuth.setCredentials('openai-key');
    await anthropicAuth.setCredentials('anthropic-key');

    expect(await openAIAuth.getCredentials()).toBe('openai-key');
    expect(await anthropicAuth.getCredentials()).toBe('anthropic-key');
  });

  it('rejects an empty API key without replacing stored credentials', async () => {
    const auth = new ApiKeyAuth('openai');
    await auth.setCredentials('existing-key');

    await expect(auth.setCredentials('   ')).rejects.toThrow(
      'API key must not be empty',
    );
    expect(await auth.getCredentials()).toBe('existing-key');
  });

  it('clears stored credentials', async () => {
    const auth = new ApiKeyAuth('openai');
    await auth.setCredentials('test-api-key');

    await auth.clearCredentials();

    expect(await auth.getCredentials()).toBeNull();
  });
});
