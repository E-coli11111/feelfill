import './style.css';

import type { ContentRequest, ContentResponse } from '@/src/types/message';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],

  async main(ctx) {
    // Get html snapshot of the current webpage
    const html = document.documentElement.outerHTML;
    let schema = null;

    const handleMessage = async (message: ContentRequest): Promise<ContentResponse> => {
      switch (message.type) {
        case 'FILL_PAGE':
          if (!schema) {
            schema = await browser.runtime.sendMessage({ type: 'LOCATE', html });
          }

          return { type: 'FILL_PAGE', success: true };
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);
  },
});
