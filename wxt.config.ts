import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  vite: () => ({
    plugins: [tailwindcss()],
  }),

  manifest: ({ browser }) => ({
    name: 'FillFeel',
    description: 'A React + TypeScript browser extension starter built with WXT.',
    permissions: ['storage', 'tabs'],
    action: browser === 'firefox'
      ? undefined
      : { default_title: '打开 FeelFill 侧边栏' },
    host_permissions: [
      'https://auth.openai.com/*',
      'https://chatgpt.com/*',
      'http://localhost:1455/*',
    ],
  }),
});
