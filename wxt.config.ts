import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  vite: () => ({
    plugins: [tailwindcss()],
  }),

  manifest: {
    name: 'FillFeel',
    description: 'A React + TypeScript browser extension starter built with WXT.',
    permissions: ['storage'],
  },
});