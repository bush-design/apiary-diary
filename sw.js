const CACHE = 'apiary-v7';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(['/']);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Let API/CDN calls go to network — app handles offline queuing itself
  if (url.includes('supabase.co') || url.includes('emailjs') || url.includes('jsdelivr')) {
    return;
  }

  // Navigation requests (loading the app) — cache first, then network
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/').then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put('/', clone));
          return res;
        }).catch(() => caches.match('/'));
      })
    );
    return;
  }

  // Everything else — cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/'));
    })
  );
});
