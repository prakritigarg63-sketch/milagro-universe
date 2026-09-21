/*
 * Milagro Universe service worker (M8).
 *
 * Deliberately minimal and hand-rolled — no build-tool integration, so it is
 * safe on Next 16 + Turbopack. It does two jobs and nothing risky:
 *
 *   1. Offline shell: navigations are network-first; when the network fails,
 *      serve the precached /offline.html instead of the browser's error page.
 *   2. Static assets (Next's immutable build output, icons, photos) are served
 *      cache-first (stale-while-revalidate), so a repeat visit paints instantly.
 *
 * It never touches auth or API traffic, and never caches HTML documents (which
 * are user- and session-specific), so it cannot serve one user another's page.
 */

const VERSION = "milagro-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// A same-origin GET for an immutable static asset — cache-first is safe here.
function isCacheableAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/photos/") ||
      url.pathname.startsWith("/logo/"))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // 1. Page navigations: network-first, fall back to the offline shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html", { ignoreSearch: true })),
    );
    return;
  }

  // 2. Immutable static assets: stale-while-revalidate.
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
  // Everything else (API, auth, HTML data) falls through to the network.
});
