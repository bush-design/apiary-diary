const CACHE = 'apiary-v9';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(['/']))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Listen for skip waiting message from app
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if(url.includes('supabase.co') || url.includes('emailjs') || url.includes('jsdelivr')) return;

  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put('/', clone));
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res && res.status === 200){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/'));
    })
  );
});
