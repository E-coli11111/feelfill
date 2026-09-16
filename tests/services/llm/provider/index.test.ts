import { ChatOpenAI } from '@langchain/openai';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import {
  getProviderAuthMethod,
  SUPPORTED_AUTH_METHODS,
} from '@/src/services/llm/registry';
import {
  createAuthenticatedLLMProvider,
  createLLMProvider,
} from '@/src/services/llm/provider';
import type { LLMAuthMethod, LLMModel, LLMProvider } from '@/src/services/llm/types';

function createTestModel(
  id: string,
  provider: LLMProvider,
  authMethod: LLMAuthMethod = 'api-key',
): LLMModel {
  return {
    id,
    display_name: id,
    provider,
    auth_methods: [authMethod],
    capabilities: {
      text: true,
      image: false,
      file: false,
      stream: false,
      structured_output: false,
    },
    enabled: true,
  };
}

describe('LLM provider authentication', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('selects different auth adapters for the same OpenAI provider', () => {
    const apiKey = getProviderAuthMethod('openai', 'api-key');
    const oauth = getProviderAuthMethod('openai', 'oauth');

    expect(apiKey?.type).toBe('api-key');
    expect(apiKey?.provider).toBe('openai');
    expect(oauth?.type).toBe('oauth');
    expect(oauth?.provider).toBe('openai');
  });

  it('creates a provider with the credential resolved by its auth adapter', async () => {
    const authMethod = SUPPORTED_AUTH_METHODS['api-key'].openai;
    await authMethod.setCredentials('stored-openai-key');

    const model = await createAuthenticatedLLMProvider({
      auth_method: 'api-key',
      provider: 'openai',
      model: createTestModel('gpt-test', 'openai'),
    });

    expect(model).toBeInstanceOf(ChatOpenAI);
  });

  it('fails before provider construction when credentials are missing', async () => {
    await expect(createAuthenticatedLLMProvider({
      auth_method: 'api-key',
      provider: 'anthropic',
      model: createTestModel('claude-test', 'anthropic'),
    })).rejects.toThrow('No credentials configured for LLM provider: anthropic/api-key');
  });

  it('keeps direct provider construction independent from browser storage', () => {
    const model = createLLMProvider({
      auth_method: 'api-key',
      provider: 'openai',
      model: createTestModel('gpt-test', 'openai'),
    }, 'explicit-key');

    expect(model).toBeInstanceOf(ChatOpenAI);
  });

  it('selects the Codex transport for OpenAI OAuth', () => {
    expect(() => createLLMProvider({
      auth_method: 'oauth',
      provider: 'openai',
      model: createTestModel('codex-test', 'openai', 'oauth'),
    }, 'not-a-codex-jwt')).toThrow(
      'OpenAI Codex access token is invalid or missing the ChatGPT account ID',
    );
  });

  it('rejects an unsupported provider and auth-method combination', async () => {
    await expect(createAuthenticatedLLMProvider({
      auth_method: 'oauth',
      provider: 'anthropic',
      model: createTestModel('claude-test', 'anthropic', 'oauth'),
    })).rejects.toThrow(
      'Unsupported authentication method for LLM provider: anthropic/oauth',
    );
  });
});
