/**
 * STEP BY STEP - Service Worker
 * 提供离线缓存 + PWA 安装能力
 */

const CACHE_NAME = 'stepbystep-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安装：预缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，网络回退
self.addEventListener('fetch', event => {
  // 跳过 API 请求和 chrome-extension 请求
  if (event.request.url.includes('/api/') ||
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// 推送通知（预留）
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || '该打卡啦！记录今天的每一步 ☁️',
    icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="40" fill="#87CEEB"/><text x="96" y="130" text-anchor="middle" font-size="100">☁️</text></svg>'),
    badge: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><circle cx="36" cy="36" r="36" fill="#4D96FF"/></svg>'),
    vibrate: [200, 100, 200],
    tag: 'daily-reminder'
  };
  event.waitUntil(self.registration.showNotification('STEP BY STEP ☁️', options));
});

// 通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsList => {
      const client = clientsList.find(c => c.url.includes(self.location.origin));
      if (client) {
        client.focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
