import { describe, expect, it } from 'vitest';

import {
  buildParseDocumentPrompt,
  buildParseHtmlPrompt,
} from '@/src/services/llm/prompt';

describe('buildParseHtmlPrompt', () => {
  it('requires fields to include selectors derived from the supplied HTML', () => {
    const html = '<label for="name">姓名</label><input id="name" name="fullName">';

    const prompt = buildParseHtmlPrompt(html);

    expect(prompt).toContain('"targets"');
    expect(prompt).toContain('"selector"');
    expect(prompt).toContain('不得编造、改写或补全 id、name、class、role、data-* 或其他属性');
    expect(prompt).toContain('radio 或 checkbox-group 字段的 targets');
    expect(prompt).toContain(html);
    expect(prompt).toContain('<feelfill_html_data>');
    expect(prompt).toContain('</feelfill_html_data>');
  });
});

describe('buildParseDocumentPrompt', () => {
  const fields = {
    field: {
      姓名: {
        type: 'text',
        required: true,
        targets: [{ selector: 'input[name="name"]' }],
      },
    },
  };

  it('includes additional user instructions within explicit boundaries', () => {
    const instruction = '优先使用护照上的英文姓名。';

    const prompt = buildParseDocumentPrompt(fields, instruction);

    expect(prompt).toContain('<feelfill_user_instruction>');
    expect(prompt).toContain(instruction);
    expect(prompt).toContain('</feelfill_user_instruction>');
    expect(prompt).toContain('不得据此增加、删除或改名字段，也不得改变输出结构');
  });

  it('omits the additional instruction section when none is supplied', () => {
    const prompt = buildParseDocumentPrompt(fields);

    expect(prompt).not.toContain('<feelfill_user_instruction>');
    expect(prompt).not.toContain('## 用户额外指令');
  });
});
