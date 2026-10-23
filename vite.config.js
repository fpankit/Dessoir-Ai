import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  const n8nBaseUrl = env.N8N_BASE_URL || 'http://localhost:5678';
  const sharedSecret = env.N8N_SHARED_SECRET || '';

  const proxyTo = (upstream) => ({
    target: n8nBaseUrl,
    changeOrigin: true,
    rewrite: () => upstream,
    headers: { 'x-shared-secret': sharedSecret }
  });

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          pricing: resolve(root, 'pricing.html'),
          auth: resolve(root, 'auth.html'),
          dashboard: resolve(root, 'dashboard.html')
        }
      }
    },
    server: {
      port: 5173,
      open: false,
      proxy: {
        '/api/n8n/health': proxyTo('/healthz'),
        '/api/n8n/test/company-summary': proxyTo('/webhook-test/company-summary'),
        '/api/n8n/company-summary': proxyTo('/webhook/company-summary'),
        '/api/n8n/test/customer-agent-chat': proxyTo('/webhook-test/customer-agent-chat'),
        '/api/n8n/customer-agent-chat': proxyTo('/webhook/customer-agent-chat')
      }
    }
  };
});
