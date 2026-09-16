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
      structured_output: false,
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
};

const mocks = vi.hoisted(() => ({
  createAuthenticatedLLMProvider: vi.fn<(config: LLMConfig) => Promise<MockModel>>(),
  invoke: vi.fn<(messages: BaseMessage[]) => Promise<MockModelResponse>>(),
  stream: vi.fn<(messages: BaseMessage[]) => Promise<AsyncIterable<AIMessageChunk>>>(),
}));

vi.mock('@/src/services/llm/provider', () => ({
  createAuthenticatedLLMProvider: mocks.createAuthenticatedLLMProvider,
}));

import { parseDocumentField, parseHTMLField } from '@/src/services/llm';

describe('LLM service', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.clearAllMocks();
    mocks.createAuthenticatedLLMProvider.mockResolvedValue({
      invoke: mocks.invoke,
      stream: mocks.stream,
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
      text: '{"field":{"姓名":{"type":"text","required":true,"targets":[{"selector":"input[id=\\"name\\"]"}]}}}',
    };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.invoke.mockResolvedValue(response);

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
    expect(mocks.invoke).toHaveBeenCalledOnce();
    expect(mocks.stream).not.toHaveBeenCalled();

    const messages = mocks.invoke.mock.calls[0]?.[0];
    expect(messages).toHaveLength(1);
    expect(messages?.[0]).toBeInstanceOf(SystemMessage);
    expect(messages?.[0]?.text).toContain(html);
    expect(messages?.[0]?.text).toContain('<feelfill_html_data>');
  });

  it('prefers streaming and combines HTML parsing response chunks', async () => {
    const config: LLMConfig = {
      auth_method: 'api-key',
      provider: 'openai',
      model: createTestModel('streaming-model', 'openai', true),
    };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.stream.mockResolvedValue((async function* () {
      yield new AIMessageChunk('{"field":');
      yield new AIMessageChunk('{}}');
    })());

    const result = await parseHTMLField('<input name="name">');

    expect(result).toEqual({ field: {} });
    expect(mocks.stream).toHaveBeenCalledOnce();
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
    const file = new File(['hello'], 'profile.txt', { type: 'text/plain' });
    const response = { text: '{"field":{"姓名":{"value":"张三","found":true,"evidence":"姓名：张三"}}}' };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.stream.mockResolvedValue((async function* () {
      yield new AIMessageChunk(response.text.slice(0, 20));
      yield new AIMessageChunk(response.text.slice(20));
    })());

    const result = await parseDocumentField(fields, [file]);

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

    const messages = mocks.stream.mock.calls[0]?.[0];
    expect(messages).toHaveLength(2);
    expect(messages?.[0]).toBeInstanceOf(SystemMessage);
    expect(messages?.[0]?.text).toContain('"姓名"');

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
