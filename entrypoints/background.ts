import type { BackgroundRequest, BackgroundResponse } from '@/src/types';
import { parseHTMLField, parseDocumentField } from '@/src/services/llm';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      void browser.storage.local.set({ enabled: true });
    }
  });

  browser.runtime.onMessage.addListener(async (message: BackgroundRequest): Promise<BackgroundResponse> => {
    console.log('Received message in background script:', message);
    switch (message.type) {
      case 'SET':
        return { type: 'SET', success: false, error: '暂未实现设置功能' };
      case 'LOCATE': 
        console.log('Received LOCATE request with HTML:', message.html);
        try {
          const result = await parseHTMLField(message.html);
          return { type: 'LOCATE', success: true, data: result };
        } catch (error) {
          console.error('Error processing LOCATE request:', error);
          return { type: 'LOCATE', success: false, error: (error as Error).message };
        }
      case 'FILL':
        try {
          const result =await parseDocumentField(message.field, message.files);
          return { type: 'FILL', success: true, data: result };
        } catch (error) {
          console.error('Error processing FILL request:', error);
          return { type: 'FILL', success: false, error: (error as Error).message };
        }
    }
  });
});
