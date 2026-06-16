import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Capacitor } from '@capacitor/core';
import App from './App.vue';
import router from './router';
import './styles/main.css';

// Service worker only for the web / PWA build — never inside the native app.
// WKWebView caches the SW aggressively and would serve a stale white screen
// after each app update.
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
