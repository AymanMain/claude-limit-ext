import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import { cp } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function getManifest() {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'manifest.json'), 'utf-8'));
}

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
    webExtension({ browser: 'chrome', manifest: getManifest }),
    copyIconsPlugin,
  ],
  publicDir: false,
  build: {
    outDir: 'dist',
    modulePreload: { polyfill: false },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
