import { defineStore } from 'pinia';

let nextId = 1;

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),
  actions: {
    push(message, opts = {}) {
      const id = nextId++;
      const item = {
        id,
        message,
        title: opts.title,
        kind: opts.kind || 'info',
        icon: opts.icon,
        action: opts.action,
        ttl: opts.ttl == null ? 4500 : opts.ttl,
      };
      this.items.push(item);
      if (item.ttl > 0) setTimeout(() => this.dismiss(id), item.ttl);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(opts.kind === 'error' ? [40, 30, 40] : 15);
      }
      return id;
    },
    success(message, opts) { return this.push(message, { kind: 'success', icon: 'fa-circle-check', ...opts }); },
    error(message, opts) { return this.push(message, { kind: 'error', icon: 'fa-circle-exclamation', ...opts }); },
    info(message, opts) { return this.push(message, { kind: 'info', icon: 'fa-circle-info', ...opts }); },
    warning(message, opts) { return this.push(message, { kind: 'warning', icon: 'fa-triangle-exclamation', ttl: 7000, ...opts }); },
    dismiss(id) {
      this.items = this.items.filter((i) => i.id !== id);
    },
  },
});
