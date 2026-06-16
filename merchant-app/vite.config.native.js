import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Build config for the NATIVE (Capacitor / iOS) bundle.
// IMPORTANT: the web build uses base '/merchant/' (nginx routing). That path 404s
// under capacitor://localhost, so the native build MUST override it to './'.
// Build it with:  npm run build:native   (also loads .env.native -> absolute HTTPS API)
export default defineConfig({
  base: './',
  plugins: [vue()],
});
