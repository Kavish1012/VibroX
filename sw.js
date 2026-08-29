/* VibroX service worker
 * - App shell: network-first with cache fallback (whole app is a single index.html)
 * - Music audio + covers from Supabase Storage / Pexels art: stale-while-revalidate, bounded
 * - Fonts: stale-while-revalidate
 * - Supabase API/auth requests are never cached
 */
const VERSION = "vibrox-v1";
const STATIC_CACHE = `${VERSION}-static`;
const MEDIA_CACHE = `${VERSION}-media`;
const MAX_MEDIA = 60;

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

const SUPABASE_HOST = "zrsxemqfrgrdcvgbmujk.supabase.co";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch {
        /* precache is best-effort */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await trimCache(MEDIA_CACHE, MAX_MEDIA);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  /* App shell (navigations): network-first, fall back to the cached shell. */
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(STATIC_CACHE);
          cache.put("./index.html", fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          return (
            (await cache.match("./index.html")) ||
            (await cache.match("./")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  /* Range (seek) requests: prefer network, fall back to whatever is cached. */
  if (req.headers.has("Range")) {
    event.respondWith(
      fetch(req).catch(() => caches.open(MEDIA_CACHE).then((c) => c.match(req))).catch(
        () => Response.error(),
      ),
    );
    return;
  }

  /* Shared music (Supabase storage public objects) + album art: SWR, bounded. */
  const isMusicSource =
    (url.hostname === SUPABASE_HOST && url.pathname.startsWith("/storage/")) ||
    url.hostname === "images.pexels.com";
  if (isMusicSource) {
    event.respondWith(staleWhileRevalidate(req, MEDIA_CACHE, true));
    return;
  }

  /* Fonts: SWR. */
  if (url.hostname.endsWith("gstatic.com") || url.hostname === "fonts.googleapis.com") {
    event.respondWith(staleWhileRevalidate(req, STATIC_CACHE, false));
    return;
  }

  /* Other same-origin files (manifest, icons): cache-first. */
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          }),
      ),
    );
  }
  /* Everything else (incl. Supabase API/auth): untouched. */
});

async function staleWhileRevalidate(req, cacheName, trim) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok) {
        cache.put(req, res.clone()).catch(() => {});
        if (trim) trimCache(cacheName, MAX_MEDIA);
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    void network;
    return cached;
  }
  const fresh = await network;
  return fresh || Response.error();
}

async function trimCache(cacheName, max) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const excess = keys.length - max;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]); // oldest first
    }
  } catch {
    /* ignore */
  }
}
