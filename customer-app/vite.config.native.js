import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Build config for the NATIVE (Capacitor / iOS) bundle.
//   base: './'  -> assets resolve under the capacitor://localhost origin (there is
//                  no nginx inside the app). The web build keeps the default '/'.
// Build it with:  npm run build:native   (also loads .env.native -> absolute HTTPS API)
export default defineConfig({
  base: './',
  plugins: [vue()],
});
