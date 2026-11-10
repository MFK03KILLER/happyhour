import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/main.css';
import { installFormFeedback } from './lib/notify';

installFormFeedback();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
