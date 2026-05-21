self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const data = (() => { try { return event.data?.json() || {}; } catch { return {}; } })();
  const title = data.title || 'Happy Hour';
  const body = data.body || 'New offer near you!';
  const url = data.url || '/';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url },
    vibrate: [60, 30, 60],
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(self.clients.openWindow(url));
});
