import { afterEach, describe, expect, it } from 'vitest';

import { fillResultToWebsite } from '@/entrypoints/content/fill';
import type {
  FilledInputFieldResult,
  ParsedInputFieldResult,
} from '@/src/services/llm/types';

describe('fillResultToWebsite', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('fills native text and select controls while reporting missing values', () => {
    document.body.innerHTML = `
      <input name="fullName">
      <select name="education">
        <option value="bachelor">本科</option>
        <option value="master">硕士</option>
      </select>
      <input name="phone">
    `;
    const schema: ParsedInputFieldResult = {
      field: {
        姓名: {
          type: 'text',
          required: true,
          targets: [{ selector: 'input[name="fullName"]' }],
        },
        学历: {
          type: 'select',
          required: false,
          targets: [{ selector: 'select[name="education"]' }],
        },
        电话: {
          type: 'tel',
          required: false,
          targets: [{ selector: 'input[name="phone"]' }],
        },
      },
    };
    const values: FilledInputFieldResult = {
      field: {
        姓名: { value: '张三', found: true, evidence: '姓名：张三' },
        学历: { value: '硕士', found: true, evidence: '学历：硕士' },
        电话: { value: '', found: false, evidence: '' },
      },
    };

    const result = fillResultToWebsite(schema, values);

    expect(document.querySelector<HTMLInputElement>('input[name="fullName"]')?.value)
      .toBe('张三');
    expect(document.querySelector<HTMLSelectElement>('select')?.value).toBe('master');
    expect(result).toEqual({
      filled: ['姓名', '学历'],
      skipped: [{ field: '电话', reason: '未从文档中找到值' }],
    });
  });

  it('selects radio and checkbox controls from their target metadata', () => {
    document.body.innerHTML = `
      <input type="radio" name="gender" value="male">
      <input type="radio" name="gender" value="female">
      <input type="checkbox" name="consent">
    `;
    const schema: ParsedInputFieldResult = {
      field: {
        性别: {
          type: 'radio',
          required: true,
          targets: [
            {
              selector: 'input[name="gender"][value="male"]',
              option_label: '男',
              option_value: 'male',
            },
            {
              selector: 'input[name="gender"][value="female"]',
              option_label: '女',
              option_value: 'female',
            },
          ],
        },
        同意条款: {
          type: 'checkbox',
          required: true,
          targets: [{ selector: 'input[name="consent"]' }],
        },
      },
    };
    const values: FilledInputFieldResult = {
      field: {
        性别: { value: '女', found: true, evidence: '性别：女' },
        同意条款: { value: '是', found: true, evidence: '同意' },
      },
    };

    const result = fillResultToWebsite(schema, values);

    expect(document.querySelector<HTMLInputElement>('input[value="female"]')?.checked)
      .toBe(true);
    expect(document.querySelector<HTMLInputElement>('input[name="consent"]')?.checked)
      .toBe(true);
    expect(result).toEqual({ filled: ['性别', '同意条款'], skipped: [] });
  });

  it('fills checkbox groups and clears options not present in the extracted value', () => {
    document.body.innerHTML = `
      <input type="checkbox" name="hobby" value="reading" checked>
      <input type="checkbox" name="hobby" value="swimming">
      <input type="checkbox" name="hobby" value="music" checked>
    `;
    const schema: ParsedInputFieldResult = {
      field: {
        爱好: {
          type: 'checkbox-group',
          required: false,
          targets: [
            { selector: 'input[value="reading"]', option_label: '阅读', option_value: 'reading' },
            { selector: 'input[value="swimming"]', option_label: '游泳', option_value: 'swimming' },
            { selector: 'input[value="music"]', option_label: '音乐', option_value: 'music' },
          ],
        },
      },
    };
    const values: FilledInputFieldResult = {
      field: {
        爱好: { value: '阅读、游泳', found: true, evidence: '爱好：阅读、游泳' },
      },
    };

    const result = fillResultToWebsite(schema, values);
    const controls = document.querySelectorAll<HTMLInputElement>('input');

    expect(Array.from(controls, (control) => control.checked)).toEqual([true, true, false]);
    expect(result).toEqual({ filled: ['爱好'], skipped: [] });
  });

  it('continues filling later fields after a target fails', () => {
    document.body.innerHTML = '<input name="valid">';
    const schema: ParsedInputFieldResult = {
      field: {
        无效字段: {
          type: 'text',
          required: false,
          targets: [{ selector: '[' }],
        },
        有效字段: {
          type: 'text',
          required: false,
          targets: [{ selector: 'input[name="valid"]' }],
        },
        缺少结果: {
          type: 'text',
          required: false,
          targets: [{ selector: 'input[name="missing"]' }],
        },
      },
    };
    const values: FilledInputFieldResult = {
      field: {
        无效字段: { value: '错误', found: true, evidence: '错误' },
        有效字段: { value: '正确', found: true, evidence: '正确' },
      },
    };

    const result = fillResultToWebsite(schema, values);

    expect(document.querySelector<HTMLInputElement>('input')?.value).toBe('正确');
    expect(result).toEqual({
      filled: ['有效字段'],
      skipped: [
        { field: '无效字段', reason: '无效的字段选择器：[' },
        { field: '缺少结果', reason: '文档解析结果缺少该字段' },
      ],
    });
  });
});
