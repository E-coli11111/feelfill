import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'FeelFill',
    description: 'A React + TypeScript browser extension starter built with WXT.',
    permissions: ['storage'],
  },
});

