import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        pricing: resolve(root, 'pricing.html'),
        auth: resolve(root, 'auth.html'),
        onboarding: resolve(root, 'onboarding.html'),
        scraper: resolve(root, 'scraper.html')
      }
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
