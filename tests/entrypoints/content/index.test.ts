import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { handleMessage } from '@/entrypoints/content';

describe('content handleMessage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    document.documentElement.innerHTML = '<head></head><body><input name="fullName"></body>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('locates fields, extracts values, and fills the current page', async () => {
    const file = {
      content: 'Zml4dHVyZQ==',
      name: 'profile.txt',
      type: 'text/plain',
    };
    const parsedFields = {
      field: {
        姓名: {
          type: 'text',
          required: true,
          targets: [{ selector: 'input[name="fullName"]' }],
        },
      },
    };
    const sendMessage = vi.spyOn(browser.runtime, 'sendMessage')
      .mockResolvedValueOnce({
        type: 'LOCATE',
        success: true,
        data: parsedFields,
      } as never)
      .mockResolvedValueOnce({
        type: 'FILL',
        success: true,
        data: {
          field: {
            姓名: { value: '张三', found: true, evidence: '姓名：张三' },
          },
        },
      } as never);

    const response = await handleMessage({
      type: 'FILL_PAGE',
      files: [file],
      userInstruction: '优先使用护照上的英文姓名。',
    });

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenNthCalledWith(1, {
      type: 'LOCATE',
      html: expect.stringContaining('<input name="fullName">'),
    });
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      type: 'FILL',
      field: parsedFields,
      files: [file],
      userInstruction: '优先使用护照上的英文姓名。',
    });
    expect(document.querySelector<HTMLInputElement>('input')?.value).toBe('张三');
    expect(response.success).toBe(true);
    expect(JSON.parse(response.data ?? '{}')).toEqual({
      filled: ['姓名'],
      skipped: [],
    });
  });

  it('stops when page field recognition returns no fields', async () => {
    const sendMessage = vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue({
      type: 'LOCATE',
      success: true,
      data: { field: {} },
    } as never);

    const response = await handleMessage({ type: 'FILL_PAGE', files: [] });

    expect(sendMessage).toHaveBeenCalledOnce();
    expect(response).toEqual({
      type: 'FILL_PAGE',
      success: false,
      error: '当前页面没有可填写字段',
    });
  });

  it('returns a background fill error without touching the page', async () => {
    vi.spyOn(browser.runtime, 'sendMessage')
      .mockResolvedValueOnce({
        type: 'LOCATE',
        success: true,
        data: {
          field: {
            姓名: {
              type: 'text',
              required: true,
              targets: [{ selector: 'input[name="fullName"]' }],
            },
          },
        },
      } as never)
      .mockResolvedValueOnce({
        type: 'FILL',
        success: false,
        error: '文档解析失败',
      } as never);

    const response = await handleMessage({ type: 'FILL_PAGE', files: [] });

    expect(document.querySelector<HTMLInputElement>('input')?.value).toBe('');
    expect(response).toEqual({
      type: 'FILL_PAGE',
      success: false,
      error: '文档解析失败',
    });
  });
});
