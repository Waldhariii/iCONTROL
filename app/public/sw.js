/**
 * ICONTROL_SERVICE_WORKER_V1
 * Service Worker pour PWA (cache intelligent, offline)
 */

const CACHE_NAME = "icontrol-v1";
const STATIC_CACHE = "icontrol-static-v1";
const DYNAMIC_CACHE = "icontrol-dynamic-v1";

// Ressources à mettre en cache au démarrage
const STATIC_ASSETS = [
  "/",
  "/cp/",
  "/app/",
  "/index.html"
];

// Installer le Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activer le Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Stratégie: Cache First pour assets statiques, Network First pour données dynamiques
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== "GET") {
    return;
  }

  // Stratégie Cache First pour assets statiques
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          // Mettre en cache si succès
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Stratégie Network First pour HTML et API
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mettre en cache si succès
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback vers cache si réseau échoue
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable"
          });
        });
      })
  );
});
