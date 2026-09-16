import type {
  FilledInputFieldResult,
  InputField,
  InputFieldTarget,
  ParsedInputFieldResult,
} from '@/src/services/llm/types';
import {
  resolveTarget,
  setElementValue,
  setNativeChecked,
} from '@/src/utils/html-utils';

/** Reason a parsed field was not filled. */
export interface WebsiteFillIssue {
  /** Semantic field name returned by the model. */
  field: string;

  /** User-facing explanation of why the field was skipped. */
  reason: string;
}

/** Summary of applying extracted document values to the current page. */
export interface WebsiteFillResult {
  /** Semantic names of fields filled successfully. */
  filled: string[];

  /** Fields that were not filled and their failure reasons. */
  skipped: WebsiteFillIssue[];
}

function normalizeValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function targetMatchesValue(target: InputFieldTarget, value: string): boolean {
  const normalizedValue = normalizeValue(value);
  return [target.option_value, target.option_label]
    .some((candidate) => candidate !== undefined
      && normalizeValue(candidate) === normalizedValue);
}

function requireNativeCheckable(
  target: InputFieldTarget,
): HTMLInputElement {
  const element = resolveTarget(target.selector);

  if (
    !(element instanceof HTMLInputElement)
    || (element.type !== 'checkbox' && element.type !== 'radio')
  ) {
    throw new Error('目标不是原生 checkbox 或 radio 控件');
  }

  return element;
}

function parseBooleanValue(value: string, target: InputFieldTarget): boolean {
  const normalizedValue = normalizeValue(value);
  const truthyValues = new Set([
    'true', '1', 'yes', 'y', 'on', '是', '有', '同意', '选中', '勾选',
  ]);
  const falsyValues = new Set([
    'false', '0', 'no', 'n', 'off', '否', '无', '不同意', '未选中', '不勾选',
  ]);

  if (truthyValues.has(normalizedValue) || targetMatchesValue(target, value)) {
    return true;
  }

  if (falsyValues.has(normalizedValue)) {
    return false;
  }

  throw new Error(`无法判断是否应选中控件：${value}`);
}

function fillRadio(field: InputField, value: string): void {
  const matchingTarget = field.targets.find(
    (target) => targetMatchesValue(target, value),
  );

  if (!matchingTarget) {
    throw new Error(`没有匹配的单选项：${value}`);
  }

  const element = requireNativeCheckable(matchingTarget);
  if (element.type !== 'radio') {
    throw new Error('匹配目标不是 radio 控件');
  }

  setNativeChecked(element, true);
}

function splitGroupValues(value: string): string[] {
  return value
    .split(/[,，、;；\n]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fillCheckboxGroup(field: InputField, value: string): void {
  const requestedValues = splitGroupValues(value);
  if (requestedValues.length === 0) {
    throw new Error('多选字段没有可填写的选项值');
  }

  const unmatchedValues = requestedValues.filter(
    (requestedValue) => !field.targets.some(
      (target) => targetMatchesValue(target, requestedValue),
    ),
  );

  if (unmatchedValues.length > 0) {
    throw new Error(`没有匹配的多选项：${unmatchedValues.join('、')}`);
  }

  const controls = field.targets.map((target) => ({
    element: requireNativeCheckable(target),
    selected: requestedValues.some(
      (requestedValue) => targetMatchesValue(target, requestedValue),
    ),
  }));

  if (controls.some(({ element }) => element.type !== 'checkbox')) {
    throw new Error('多选字段包含非 checkbox 控件');
  }

  for (const { element, selected } of controls) {
    setNativeChecked(element, selected);
  }
}

function fillSingleTarget(field: InputField, value: string): void {
  if (field.targets.length !== 1) {
    throw new Error('当前不支持将一个值填入多个分段控件');
  }

  const target = field.targets[0];
  if (!target) {
    throw new Error('字段没有定位目标');
  }

  const element = resolveTarget(target.selector);

  if (field.type === 'checkbox' || field.type === 'switch') {
    if (!(element instanceof HTMLInputElement) || element.type !== 'checkbox') {
      throw new Error('目标不是原生 checkbox 控件');
    }

    setNativeChecked(element, parseBooleanValue(value, target));
    return;
  }

  if (field.type === 'file') {
    throw new Error('暂不支持自动填写文件控件');
  }

  setElementValue(element, value);
}

function fillField(field: InputField, value: string): void {
  if (field.targets.length === 0) {
    throw new Error('字段没有定位目标');
  }

  if (field.type === 'radio') {
    fillRadio(field, value);
    return;
  }

  if (field.type === 'checkbox-group') {
    fillCheckboxGroup(field, value);
    return;
  }

  fillSingleTarget(field, value);
}

/**
 * Applies extracted field values to matching controls in the current document.
 *
 * A failure in one field is recorded without preventing later fields from being
 * processed. The function never submits the host page form.
 *
 * @param schema Parsed webpage fields and their DOM targets.
 * @param filledResult Values extracted from the user's documents.
 * @returns Names of filled fields and per-field skip reasons.
 */
export function fillResultToWebsite(
  schema: ParsedInputFieldResult,
  filledResult: FilledInputFieldResult,
): WebsiteFillResult {
  const result: WebsiteFillResult = {
    filled: [],
    skipped: [],
  };

  for (const [fieldName, fieldSchema] of Object.entries(schema.field)) {
    const fieldData = filledResult.field[fieldName];

    if (!fieldData) {
      result.skipped.push({
        field: fieldName,
        reason: '文档解析结果缺少该字段',
      });
      continue;
    }

    if (!fieldData.found) {
      result.skipped.push({
        field: fieldName,
        reason: '未从文档中找到值',
      });
      continue;
    }

    try {
      fillField(fieldSchema, fieldData.value);
      result.filled.push(fieldName);
    } catch (error) {
      result.skipped.push({
        field: fieldName,
        reason: error instanceof Error ? error.message : '填充失败',
      });
    }
  }

  return result;
}
