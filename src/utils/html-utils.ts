/**
 * Resolves a selector to one editable HTML element in the current document.
 *
 * @param selector CSS selector produced for a parsed input field target.
 * @returns The single editable element matched by the selector.
 * @throws If the selector is invalid, ambiguous, missing, or not editable.
 */
export function resolveTarget(selector: string): HTMLElement {
  let elements: NodeListOf<Element>;

  try {
    elements = document.querySelectorAll(selector);
  } catch {
    throw new Error(`无效的字段选择器：${selector}`);
  }

  if (elements.length === 0) {
    throw new Error('没有找到对应的页面控件');
  }

  if (elements.length > 1) {
    throw new Error('字段选择器匹配了多个页面控件');
  }

  const element = elements[0];

  if (!(element instanceof HTMLElement)) {
    throw new Error('目标不是可操作的 HTML 元素');
  }

  if (
    element.matches(
      ":disabled, [readonly], [aria-disabled='true']",
    )
  ) {
    throw new Error('目标控件不可编辑');
  }

  return element;
}

/**
 * Dispatches the bubbling events expected after a user-visible value change.
 *
 * @param element Element whose value has changed.
 * @param value Value exposed as the input event data.
 */
export function dispatchValueEvents(element: HTMLElement, value: string): void {
  element.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    inputType: 'insertText',
    data: value,
  }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Sets a native text control value through its prototype setter.
 *
 * Calling the native setter and dispatching events allows controlled UI
 * frameworks to observe the update.
 *
 * @param element Native input or textarea to update.
 * @param value Value to assign.
 * @throws If the browser does not expose the native value setter.
 */
export function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const prototype = element instanceof HTMLInputElement
    ? HTMLInputElement.prototype
    : HTMLTextAreaElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (!setter) {
    throw new Error('无法设置控件值');
  }

  setter.call(element, value);
  dispatchValueEvents(element, value);
}

/**
 * Selects an option by its submitted value or visible text.
 *
 * @param element Native select control to update.
 * @param value Option value or visible text to select.
 * @throws If no option matches or the browser exposes no native value setter.
 */
export function setSelectValue(element: HTMLSelectElement, value: string): void {
  const normalizedValue = value.trim();
  const matchingOption = Array.from(element.options).find(
    (option) => option.value === value || option.text.trim() === normalizedValue,
  );

  if (!matchingOption) {
    throw new Error(`没有匹配的选项：${value}`);
  }

  const setter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    'value',
  )?.set;

  if (!setter) {
    throw new Error('无法设置下拉控件值');
  }

  setter.call(element, matchingOption.value);
  dispatchValueEvents(element, matchingOption.value);
}

/**
 * Updates the checked state of a native checkbox or radio control.
 *
 * @param element Checkbox or radio input to update.
 * @param checked Desired checked state.
 * @throws If the input is not checkable or no native checked setter exists.
 */
export function setNativeChecked(
  element: HTMLInputElement,
  checked: boolean,
): void {
  if (element.type !== 'checkbox' && element.type !== 'radio') {
    throw new Error('目标不是 checkbox 或 radio 控件');
  }

  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'checked',
  )?.set;

  if (!setter) {
    throw new Error('无法设置控件选中状态');
  }

  setter.call(element, checked);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Sets a string value on a supported native or contenteditable control.
 *
 * @param element Editable element to update.
 * @param value Value to assign.
 * @throws If the element is not supported by the generic value setter.
 */
export function setElementValue(element: HTMLElement, value: string): void {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      setNativeChecked(element, value === 'true');
      return;
    }

    setNativeValue(element, value);
    return;
  }

  if (element instanceof HTMLTextAreaElement) {
    setNativeValue(element, value);
    return;
  }

  if (element instanceof HTMLSelectElement) {
    setSelectValue(element, value);
    return;
  }

  if (element.isContentEditable) {
    element.textContent = value;
    dispatchValueEvents(element, value);
    return;
  }

  throw new Error('暂不支持该页面控件');
}
