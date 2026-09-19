import {
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import type {
  LLMConfig,
  LLMModel,
  LLMProvider,
  ParsedInputFieldResult,
} from '@/src/services/llm/types';

function createTestModel(
  id: string,
  provider: LLMProvider,
  stream = false,
): LLMModel {
  return {
    id,
    display_name: id,
    provider,
    auth_methods: ['api-key'],
    capabilities: {
      text: true,
      image: false,
      file: false,
      stream,
      structured_output: true,
    },
    enabled: true,
  };
}

type MockModelResponse = {
  text: string;
};

type MockModel = {
  invoke: (messages: BaseMessage[]) => Promise<MockModelResponse>;
  stream: (messages: BaseMessage[]) => Promise<AsyncIterable<AIMessageChunk>>;
  withStructuredOutput: (schema: unknown) => {
    invoke: (messages: BaseMessage[]) => Promise<unknown>;
    stream: (messages: BaseMessage[]) => Promise<AsyncIterable<Record<string, unknown>>>;
  };
};

const mocks = vi.hoisted(() => ({
  createAuthenticatedLLMProvider: vi.fn<(config: LLMConfig) => Promise<MockModel>>(),
  invoke: vi.fn<(messages: BaseMessage[]) => Promise<MockModelResponse>>(),
  stream: vi.fn<(messages: BaseMessage[]) => Promise<AsyncIterable<AIMessageChunk>>>(),
  structuredInvoke: vi.fn<(messages: BaseMessage[]) => Promise<unknown>>(),
  structuredStream: vi.fn<
    (messages: BaseMessage[]) => Promise<AsyncIterable<Record<string, unknown>>>
  >(),
  withStructuredOutput: vi.fn<(schema: unknown) => {
    invoke: (messages: BaseMessage[]) => Promise<unknown>;
    stream: (messages: BaseMessage[]) => Promise<AsyncIterable<Record<string, unknown>>>;
  }>(),
}));

vi.mock('@/src/services/llm/provider', () => ({
  createAuthenticatedLLMProvider: mocks.createAuthenticatedLLMProvider,
}));

import { parseDocumentField, parseHTMLField } from '@/src/services/llm';

describe('LLM service', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.clearAllMocks();
    mocks.structuredStream.mockImplementation(async (messages) => {
      const response = await mocks.structuredInvoke(messages);
      return (async function* () {
        yield response as Record<string, unknown>;
      })();
    });
    mocks.withStructuredOutput.mockReturnValue({
      invoke: mocks.structuredInvoke,
      stream: mocks.structuredStream,
    });
    mocks.createAuthenticatedLLMProvider.mockResolvedValue({
      invoke: mocks.invoke,
      stream: mocks.stream,
      withStructuredOutput: mocks.withStructuredOutput,
    });
  });

  it('builds and sends an HTML field parsing request with the stored configuration', async () => {
    const config: LLMConfig = {
      auth_method: 'api-key',
      provider: 'anthropic',
      model: createTestModel('test-model', 'anthropic'),
      temperature: 0,
    };
    const html = '<label for="name">姓名</label><input id="name" required>';
    const response = {
      field: {
        姓名: {
          type: 'text',
          required: true,
          targets: [{ selector: 'input[id="name"]' }],
        },
      },
    };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.structuredInvoke.mockResolvedValue(response);

    const result = await parseHTMLField(html);

    expect(result).toEqual({
      field: {
        姓名: {
          type: 'text',
          required: true,
          targets: [{ selector: 'input[id="name"]' }],
        },
      },
    });
    expect(mocks.createAuthenticatedLLMProvider).toHaveBeenCalledWith(config);
    expect(mocks.withStructuredOutput).toHaveBeenCalledOnce();
    expect(mocks.structuredInvoke).toHaveBeenCalledOnce();
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();

    const messages = mocks.structuredInvoke.mock.calls[0]?.[0];
    expect(messages).toHaveLength(1);
    expect(messages?.[0]).toBeInstanceOf(SystemMessage);
    expect(messages?.[0]?.text).toContain(html);
    expect(messages?.[0]?.text).toContain('<feelfill_html_data>');
  });

  it('uses structured output instead of text streaming for HTML parsing', async () => {
    const config: LLMConfig = {
      auth_method: 'api-key',
      provider: 'openai',
      model: createTestModel('streaming-model', 'openai', true),
    };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.structuredInvoke.mockResolvedValue({ field: {} });

    const result = await parseHTMLField('<input name="name">');

    expect(result).toEqual({ field: {} });
    expect(mocks.withStructuredOutput).toHaveBeenCalledOnce();
    expect(mocks.structuredInvoke).toHaveBeenCalledOnce();
    expect(mocks.stream).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it('converts files to attachments before asking OpenAI to extract document fields', async () => {
    const config: LLMConfig = {
      auth_method: 'api-key',
      provider: 'openai',
      model: createTestModel('test-model', 'openai', true),
    };
    const fields: ParsedInputFieldResult = {
      field: {
        姓名: {
          type: 'text',
          required: true,
          description: '申请人的姓名',
          targets: [{ selector: 'input[id="name"]' }],
        },
      },
    };
    const file = {
      name: 'profile.txt',
      type: 'text/plain',
      content: 'aGVsbG8=',
    };
    const response = {
      field: {
        姓名: {
          value: '张三',
          found: true,
          evidence: '姓名：张三',
        },
      },
    };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.structuredInvoke.mockResolvedValue(response);

    const userInstruction = '优先使用护照上的英文姓名。';
    const result = await parseDocumentField(fields, [file], userInstruction);

    expect(result).toEqual({
      field: {
        姓名: {
          value: '张三',
          found: true,
          evidence: '姓名：张三',
        },
      },
    });
    expect(mocks.createAuthenticatedLLMProvider).toHaveBeenCalledWith(config);

    const messages = mocks.structuredInvoke.mock.calls[0]?.[0];
    expect(messages).toHaveLength(2);
    expect(messages?.[0]).toBeInstanceOf(SystemMessage);
    expect(messages?.[0]?.text).toContain('"姓名"');
    expect(messages?.[0]?.text).toContain(userInstruction);

    const humanMessage = messages?.[1];
    expect(humanMessage).toBeInstanceOf(HumanMessage);
    if (!(humanMessage instanceof HumanMessage)) {
      throw new Error('Expected the second message to be a HumanMessage.');
    }

    expect(humanMessage.contentBlocks).toEqual([
      {
        type: 'text',
        text: '以下是用户提供的文档，请根据提示提取指定字段：',
      },
      {
        type: 'file',
        data: 'aGVsbG8=',
        mimeType: 'text/plain',
        metadata: { filename: 'profile.txt' },
      },
    ]);
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('rejects an invalid structured model response at the service boundary', async () => {
    const config: LLMConfig = {
      auth_method: 'api-key',
      provider: 'openai',
      model: createTestModel('test-model', 'openai'),
    };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.structuredInvoke.mockResolvedValue({
      field: {
        name: {
          type: 'text',
          required: 'yes',
          targets: [],
        },
      },
    });

    await expect(parseHTMLField('<input name="name">')).rejects.toThrow();
    expect(mocks.withStructuredOutput).toHaveBeenCalledOnce();
  });

  it('rejects document parsing for providers that are not yet supported', async () => {
    const config: LLMConfig = {
      auth_method: 'api-key',
      provider: 'google',
      model: createTestModel('test-model', 'google'),
    };
    const fields: ParsedInputFieldResult = { field: {} };

    await fakeBrowser.storage.local.set({ llmConfig: config });

    await expect(parseDocumentField(fields, [])).rejects.toThrow(
      'Unsupported LLM provider: google (only "openai" is supported for document parsing yet)',
    );
    expect(mocks.createAuthenticatedLLMProvider).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

});
