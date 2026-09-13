import { HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import type { LLMConfig, ParsedInputFieldResult } from '@/src/services/llm/types';

type MockModelResponse = {
  text: string;
};

type MockModel = {
  invoke: (messages: BaseMessage[]) => Promise<MockModelResponse>;
};

const mocks = vi.hoisted(() => ({
  createLLMProvider: vi.fn<(config: LLMConfig) => MockModel>(),
  invoke: vi.fn<(messages: BaseMessage[]) => Promise<MockModelResponse>>(),
}));

vi.mock('@/src/services/llm/provider', () => ({
  createLLMProvider: mocks.createLLMProvider,
}));

import { parseDocumentField, parseHTMLField } from '@/src/services/llm';

describe('LLM service', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.clearAllMocks();
    mocks.createLLMProvider.mockReturnValue({ invoke: mocks.invoke });
  });

  it('builds and sends an HTML field parsing request with the stored configuration', async () => {
    const config: LLMConfig = {
      provider: 'anthropic',
      model_name: 'test-model',
      temperature: 0,
    };
    const html = '<label for="name">姓名</label><input id="name" required>';
    const response = { text: '{"field":{"姓名":{"type":"text","required":true}}}' };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.invoke.mockResolvedValue(response);

    const result = await parseHTMLField(html);

    expect(result).toBe(response);
    expect(mocks.createLLMProvider).toHaveBeenCalledWith(config);
    expect(mocks.invoke).toHaveBeenCalledOnce();

    const messages = mocks.invoke.mock.calls[0]?.[0];
    expect(messages).toHaveLength(1);
    expect(messages?.[0]).toBeInstanceOf(SystemMessage);
    expect(messages?.[0]?.text).toContain(html);
    expect(messages?.[0]?.text).toContain('<feelfill_html_data>');
  });

  it('converts files to attachments before asking OpenAI to extract document fields', async () => {
    const config: LLMConfig = {
      provider: 'openai',
      model_name: 'test-model',
    };
    const fields: ParsedInputFieldResult = {
      field: {
        姓名: {
          type: 'text',
          required: true,
          description: '申请人的姓名',
        },
      },
    };
    const file = new File(['hello'], 'profile.txt', { type: 'text/plain' });
    const response = { text: '{"field":{"姓名":{"value":"张三","found":true,"evidence":"姓名：张三"}}}' };

    await fakeBrowser.storage.local.set({ llmConfig: config });
    mocks.invoke.mockResolvedValue(response);

    const result = await parseDocumentField(fields, [file]);

    expect(result).toBe(response);
    expect(mocks.createLLMProvider).toHaveBeenCalledWith(config);

    const messages = mocks.invoke.mock.calls[0]?.[0];
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
  });

  it('rejects document parsing for providers that are not yet supported', async () => {
    const config: LLMConfig = {
      provider: 'google',
      model_name: 'test-model',
    };
    const fields: ParsedInputFieldResult = { field: {} };

    await fakeBrowser.storage.local.set({ llmConfig: config });

    await expect(parseDocumentField(fields, [])).rejects.toThrow(
      'Unsupported LLM provider: google (only "openai" is supported for document parsing yet)',
    );
    expect(mocks.createLLMProvider).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
});
