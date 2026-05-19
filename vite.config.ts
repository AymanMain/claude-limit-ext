import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';

const copyIconsPlugin = {
  name: 'copy-icons',
  async closeBundle() {
    await cp(
      resolve(process.cwd(), 'icons'),
      resolve(process.cwd(), 'dist', 'icons'),
      { recursive: true }
    );
  },
};

export default defineConfig({
  plugins: [
    react(),
    webExtension({ browser: 'chrome' }),
    copyIconsPlugin,
  ],
  publicDir: false,
  build: {
    modulePreload: { polyfill: false },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
