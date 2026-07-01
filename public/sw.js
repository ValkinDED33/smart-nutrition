const CACHE_NAME = "smart-nutrition-runtime-v4";
const SHELL_ASSETS = ["/manifest.webmanifest", "/favicon.svg"];

const createOfflineResponse = () =>
  new Response(
    "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Smart Nutrition</title></head><body><main style=\"font-family:system-ui,sans-serif;padding:24px\"><h1>Smart Nutrition</h1><p>The app is online-only. Check your connection and refresh.</p></main></body></html>",
    {
      status: 503,
      statusText: "Offline",
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );

const createOfflineAssetResponse = () =>
  new Response("", {
    status: 503,
    statusText: "Offline",
    headers: {
      "Cache-Control": "no-store",
    },
  });

const shouldCacheStaticRequest = (request, url) =>
  url.origin === self.location.origin &&
  !url.pathname.startsWith("/assets/") &&
  (request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "manifest");

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request, { cache: "reload" }).catch(createOfflineResponse));
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(fetch(request, { cache: "no-store" }).catch(createOfflineAssetResponse));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (
          response &&
          response.status === 200 &&
          response.type !== "opaque" &&
          shouldCacheStaticRequest(request, url)
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => caches.match(request).then((cachedResponse) => cachedResponse ?? createOfflineAssetResponse()))
  );
});
