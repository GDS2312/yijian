/*
 * Minimal local cross-origin-isolation service worker for GitHub Pages.
 * Inspired by the COOP/COEP service-worker pattern; kept in source so the
 * static artifact has no CDN dependency.  The app remains usable when a
 * browser declines service-worker control.
 */
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  // Keep the worker scoped to this Pages app.  In particular, do not rebuild
  // cross-origin opaque responses (or POST/API requests) as new Responses.
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin || !requestUrl.href.startsWith(self.registration.scope)) return;
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
  event.respondWith((async () => {
    const response = await fetch(event.request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(isolationHeaders)) headers.set(name, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  })());
});
