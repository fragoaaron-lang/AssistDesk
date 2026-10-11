const CACHE_NAME = 'assistdesk-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assistdesk-logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    const visibleClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (visibleClients.some((client) => client.visibilityState === 'visible' && client.focused)) return;

    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
    } catch (error) {
      payload = { body: event.data?.text() || 'You have a new update.' };
    }

    await self.registration.showNotification(payload.title || 'AssistDesk', {
      body: payload.body || 'You have a new support update. Open AssistDesk to view details.',
      icon: '/assistdesk-logo.svg',
      badge: '/assistdesk-logo.svg',
      tag: payload.tag || 'assistdesk-notification',
      data: { url: payload.url || '/dashboard' },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const requestedUrl = new URL(event.notification.data?.url || '/dashboard', self.location.origin);
    const targetUrl = requestedUrl.origin === self.location.origin ? requestedUrl.href : `${self.location.origin}/dashboard`;
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client && client.url !== targetUrl) await client.navigate(targetUrl);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseCopy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  const isApiRequest = requestUrl.pathname.startsWith('/api');
  const isBrowserAsset = ['script', 'style', 'image', 'font'].includes(event.request.destination);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse || isApiRequest || !isBrowserAsset) {
        return cachedResponse || fetch(event.request);
      }

      return fetch(event.request).then((response) => {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        return response;
      });
    })
  );
});