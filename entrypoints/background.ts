export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      void browser.storage.local.set({ enabled: true });
    }
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'PING'
    ) {
      return Promise.resolve({ message: 'Background 已连接' });
    }
  });
});

