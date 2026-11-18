/* CAN Report service worker: precache the app shell, serve cache-first, refresh in the background. */
const CACHE = "can-report-efc1be4d371f";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("can-report-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  const u = new URL(req.url);
  // never cache cloud sync (Supabase auth / data / functions): those always go straight to the network
  if (req.method !== "GET" || u.origin !== location.origin || /\.supabase\.co$/.test(u.hostname) || /\/(rest|auth|functions)\/v1\//.test(u.pathname)) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; });
    if (hit) { net.catch(() => {}); return hit; }
    return net.catch(() => req.mode === "navigate" ? caches.match("index.html") : Response.error());
  }));
});
