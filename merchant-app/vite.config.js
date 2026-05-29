import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // Served under /merchant/ in nginx; without this, built assets reference
  // /assets/... which the / nginx location routes to customer-app's dist
  // (wrong hashes -> falls through to customer index.html -> MIME error -> white screen).
  base: '/merchant/',
  plugins: [vue()],
  server: { host: '0.0.0.0', port: 5174 },
});
