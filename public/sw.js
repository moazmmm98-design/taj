// Simple offline-first service worker for مخيم تاج الوقار
const CACHE = "taj-cache-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests over http/https (skip Supabase POST, etc.)
  if (req.method !== "GET" || !req.url.startsWith("http")) return;

  const url = new URL(req.url);

  // Never cache API calls (e.g. Supabase) — always go to network.
  if (url.origin !== self.location.origin) return;

  // Network-first for same-origin requests: always fresh when online (keeps
  // the Vite dev server / HMR working), falls back to cache when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === "navigate") return caches.match("/index.html");
          return Response.error();
        })
      )
  );
});
