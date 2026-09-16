import { describe, expect, it } from 'vitest';

import { buildParseHtmlPrompt } from '@/src/services/llm/prompt';

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
