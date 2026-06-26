// Service worker for the pre-registration portal (spec §5.2).
// Strategies:
//  - Quiz questions (/api/quiz?*): Network-first, falls back to cache.
//  - Pre-registration page (/ and /<locale>): Cache-first for the shell.
//  - Quiz and pre-reg form pages: Cache-first.
//  - Everything else: Network-only (no silent stale data for dynamic ERP content).

const CACHE_NAME = 'portal-v2';

const PRECACHE_URLS = [
  '/',
];

// Paths that benefit from caching (quiz questions + form shells).
const CACHEABLE_API_PREFIX = '/api/quiz';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Quiz API: network-first, fall back to cache for offline quiz play.
  if (url.pathname.startsWith(CACHEABLE_API_PREFIX)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Navigation requests (HTML pages): network-first, fall back to cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r ?? fetch(request))),
    );
    return;
  }

  // Static assets: cache-first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          // Clone synchronously: caches.open() is async, so cloning inside its
          // callback runs after `res` is already being consumed by the browser
          // ("Response body is already used"). Mirrors the other two handlers.
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        });
      }),
    );
  }
});
