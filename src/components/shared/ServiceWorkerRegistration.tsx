'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Register the service worker only in production. In development, Next.js
    // regenerates /_next/static/ chunks on every change (HMR, fresh `?v=` query
    // strings), so a cache-first SW would serve stale CSS/JS — which produces the
    // "preloaded but not used" console warnings and hard-to-debug stale-chunk
    // bugs. We also proactively tear down any SW already installed from earlier
    // dev testing so it stops intercepting requests.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      }
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return null;
}
