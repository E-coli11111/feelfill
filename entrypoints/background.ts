import type { BackgroundRequest, BackgroundResponse } from '@/src/types';
import { parseHTMLField, parseDocumentField } from '@/src/services/llm';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      void browser.storage.local.set({ enabled: true });
    }
  });

  browser.runtime.onMessage.addListener(async (message: BackgroundRequest): Promise<BackgroundResponse> => {
    switch (message.type) {
      case 'SET':
        return { type: 'SET', success: false, error: '暂未实现设置功能' };
      case 'LOCATE': {
        const result = await parseHTMLField(message.html);
        return { type: 'LOCATE', success: true, data: result.text };
      }
      case 'FILL':
        const result = await parseDocumentField(message.field, message.files);
        return { type: 'FILL', success: false, error: '暂未实现填充功能' };
    }
  });
});

