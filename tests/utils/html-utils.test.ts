import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  resolveTarget,
  setElementValue,
  setNativeChecked,
  setNativeValue,
  setSelectValue,
} from '@/src/utils/html-utils';

describe('html-utils', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('resolves exactly one editable HTML element', () => {
    document.body.innerHTML = '<input name="fullName">';

    expect(resolveTarget('input[name="fullName"]')).toBe(
      document.querySelector('input'),
    );
  });

  it('rejects invalid, missing, ambiguous, and disabled targets', () => {
    document.body.innerHTML = '<input disabled><input>';

    expect(() => resolveTarget('[')).toThrow('无效的字段选择器');
    expect(() => resolveTarget('textarea')).toThrow('没有找到对应的页面控件');
    expect(() => resolveTarget('input')).toThrow('字段选择器匹配了多个页面控件');
    expect(() => resolveTarget('input:disabled')).toThrow('目标控件不可编辑');
  });

  it('sets native input and textarea values and dispatches bubbling events', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const inputEvents: string[] = [];
    const textareaEvents: string[] = [];

    for (const type of ['input', 'change']) {
      input.addEventListener(type, () => inputEvents.push(type));
      textarea.addEventListener(type, () => textareaEvents.push(type));
    }

    setNativeValue(input, '张三');
    setNativeValue(textarea, '个人简介');

    expect(input.value).toBe('张三');
    expect(textarea.value).toBe('个人简介');
    expect(inputEvents).toEqual(['input', 'change']);
    expect(textareaEvents).toEqual(['input', 'change']);
  });

  it('selects an option by value or visible text', () => {
    const select = document.createElement('select');
    select.innerHTML = [
      '<option value="bachelor">本科</option>',
      '<option value="master">硕士</option>',
    ].join('');
    const events: string[] = [];

    for (const type of ['input', 'change']) {
      select.addEventListener(type, () => events.push(type));
    }

    setSelectValue(select, 'master');
    expect(select.value).toBe('master');

    setSelectValue(select, ' 本科 ');
    expect(select.value).toBe('bachelor');
    expect(events).toEqual(['input', 'change', 'input', 'change']);
    expect(() => setSelectValue(select, '博士')).toThrow('没有匹配的选项：博士');
  });

  it('updates checkbox and radio state through the native setter', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const events: string[] = [];

    for (const type of ['input', 'change']) {
      checkbox.addEventListener(type, () => events.push(type));
    }

    setNativeChecked(checkbox, true);

    expect(checkbox.checked).toBe(true);
    expect(events).toEqual(['input', 'change']);

    const textInput = document.createElement('input');
    expect(() => setNativeChecked(textInput, true)).toThrow(
      '目标不是 checkbox 或 radio 控件',
    );
  });

  it('delegates supported controls and rejects unsupported elements', () => {
    const input = document.createElement('input');
    setElementValue(input, '李四');
    expect(input.value).toBe('李四');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    setElementValue(checkbox, 'true');
    expect(checkbox.checked).toBe(true);

    expect(() => setElementValue(document.createElement('div'), '值')).toThrow(
      '暂不支持该页面控件',
    );
  });

  it('updates contenteditable text and dispatches value events', () => {
    const editor = document.createElement('div');
    Object.defineProperty(editor, 'isContentEditable', { value: true });
    const events: string[] = [];

    for (const type of ['input', 'change']) {
      editor.addEventListener(type, () => events.push(type));
    }

    setElementValue(editor, '富文本内容');

    expect(editor.textContent).toBe('富文本内容');
    expect(events).toEqual(['input', 'change']);
  });
});
