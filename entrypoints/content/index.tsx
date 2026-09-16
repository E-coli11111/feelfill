import './style.css';

import type {
  BackgroundRequest,
  BackgroundResponse,
  ContentRequest,
  ContentResponse,
} from '@/src/types';
import { fillResultToWebsite } from './fill';

/** Handles a request to identify, extract, and fill fields on the current page. */
export async function handleMessage(
  message: ContentRequest,
): Promise<ContentResponse> {
  try {
    const locateResponse: BackgroundResponse = await browser.runtime.sendMessage({
      type: 'LOCATE',
      html: document.documentElement.outerHTML,
    } satisfies BackgroundRequest);

    if (locateResponse.type !== 'LOCATE' || !locateResponse.success) {
      return {
        type: 'FILL_PAGE',
        success: false,
        error: locateResponse.error ?? '解析 HTML 字段失败',
      };
    }

    if (!locateResponse.data) {
      return {
        type: 'FILL_PAGE',
        success: false,
        error: '页面字段识别返回了空数据',
      };
    }

    if (Object.keys(locateResponse.data.field).length === 0) {
      return {
        type: 'FILL_PAGE',
        success: false,
        error: '当前页面没有可填写字段',
      };
    }

    const fillResponse: BackgroundResponse = await browser.runtime.sendMessage({
      type: 'FILL',
      field: locateResponse.data,
      files: message.files,
    } satisfies BackgroundRequest);

    if (fillResponse.type !== 'FILL' || !fillResponse.success) {
      return {
        type: 'FILL_PAGE',
        success: false,
        error: fillResponse.error ?? '解析文档字段失败',
      };
    }

    if (!fillResponse.data) {
      return {
        type: 'FILL_PAGE',
        success: false,
        error: '文档字段解析返回了空数据',
      };
    }

    const result = fillResultToWebsite(locateResponse.data, fillResponse.data);

    return {
      type: 'FILL_PAGE',
      success: result.filled.length > 0,
      error: result.filled.length > 0 ? undefined : '没有成功填充任何字段',
      data: JSON.stringify(result),
    };
  } catch (error) {
    return {
      type: 'FILL_PAGE',
      success: false,
      error: error instanceof Error ? error.message : '页面填充失败',
    };
  }
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],

  main() {
    browser.runtime.onMessage.addListener(handleMessage);
  },
});
