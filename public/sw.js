// Service Worker for LifeBlocks Web Push & Background Notifications
const CACHE_NAME = 'lifeblocks-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push notifications from a Push Service or server
self.addEventListener('push', (event) => {
  let data = {
    title: 'LifeBlocks Alerta',
    body: 'Tienes un recordatorio de tus tareas o hábitos programados.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'lifeblocks-push',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      tag: data.tag || 'lifeblocks-notification',
      data: data.data || { url: '/' },
      vibrate: [200, 100, 200]
    })
  );
});

// Handle click on notification: focus tab or open application
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.registration.scope) && 'navigate' in client) {
            client.focus();
            return client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
