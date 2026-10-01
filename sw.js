/* Service worker for "Geur en geheugen".

   Two jobs:
   1. Its presence (with a fetch handler) is what lets Android Chrome install
      the tablet page as an app, so the home-screen icon opens fullscreen
      instead of in a browser tab.
   2. It keeps the last loaded copy of this site's own files, so reopening the
      app during a Wi-Fi hiccup still shows the page.

   It always asks the network first (and revalidates past the HTTP cache), so
   a new version pushed to GitHub shows up on the next load. Firebase, the
   fonts and the SDK are never touched: they are on other domains. */

const CACHE = "geur-geheugen-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(new Request(req.url, { cache: "no-cache", credentials: "same-origin" }))
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || Response.error()))
  );
});
