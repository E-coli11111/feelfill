import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, AIMessageChunk, SystemMessage } from '@langchain/core/messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { z } from 'zod';

import { invokeModel, listModels } from '@/src/services/llm/models';
import { SUPPORTED_MODELS } from '@/src/services/llm/registry';
import { getStorage } from '@/src/services/llm/storage';

describe('invokeModel', () => {
  it('uses and validates structured output when a schema is provided', async () => {
    const schema = z.object({ answer: z.string() });
    const structuredInvoke = vi.fn().mockResolvedValue({ answer: 'hello' });
    const withStructuredOutput = vi.fn().mockReturnValue({
      invoke: structuredInvoke,
    });
    const model = { withStructuredOutput } as unknown as BaseChatModel;
    const messages = [new SystemMessage('Respond with an answer.')];

    await expect(invokeModel(model, messages, false, schema)).resolves.toBe(
      '{"answer":"hello"}',
    );
    expect(withStructuredOutput).toHaveBeenCalledWith(schema);
    expect(structuredInvoke).toHaveBeenCalledWith(messages);
  });

  it('validates and serializes the final structured stream snapshot', async () => {
    const schema = z.object({ answer: z.string() });
    const stream = vi.fn().mockResolvedValue((async function* () {
      yield { answer: 'hel' };
      yield { answer: 'hello' };
    })());
    const invoke = vi.fn();
    const model = {
      withStructuredOutput: vi.fn().mockReturnValue({ invoke, stream }),
    } as unknown as BaseChatModel;

    await expect(
      invokeModel(model, [new SystemMessage('Respond.')], true, schema),
    ).resolves.toBe('{"answer":"hello"}');
    expect(stream).toHaveBeenCalledOnce();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('rejects an empty structured output stream', async () => {
    const schema = z.object({ answer: z.string() });
    const model = {
      withStructuredOutput: vi.fn().mockReturnValue({
        stream: vi.fn().mockResolvedValue((async function* () {})()),
      }),
    } as unknown as BaseChatModel;

    await expect(
      invokeModel(model, [new SystemMessage('Respond.')], true, schema),
    ).rejects.toThrow('LLM returned an empty structured output stream');
  });

  it('rejects a structured response that does not match the schema', async () => {
    const schema = z.object({ answer: z.string() });
    const model = {
      withStructuredOutput: vi.fn().mockReturnValue({
        invoke: vi.fn().mockResolvedValue({ answer: 42 }),
      }),
    } as unknown as BaseChatModel;

    await expect(
      invokeModel(model, [new SystemMessage('Respond.')], false, schema),
    ).rejects.toThrow();
  });

  it('keeps streaming plain-text responses when no schema is provided', async () => {
    const stream = vi.fn().mockResolvedValue((async function* () {
      yield new AIMessageChunk('hello ');
      yield new AIMessageChunk('world');
    })());
    const invoke = vi.fn().mockResolvedValue(new AIMessage('unused'));
    const model = { invoke, stream } as unknown as BaseChatModel;

    await expect(
      invokeModel(model, [new SystemMessage('Respond.')], true),
    ).resolves.toBe('hello world');
    expect(stream).toHaveBeenCalledOnce();
    expect(invoke).not.toHaveBeenCalled();
  });
});

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
