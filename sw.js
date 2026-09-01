const CACHE_NAME = "woyofal-v4";
const CORE_ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Reseau en priorite : on va toujours chercher la derniere version en ligne,
// et on ne se rabat sur le cache que si le reseau echoue (mode hors-ligne).
// C'est l'inverse de "cache en priorite", qui coincait sur la toute
// premiere version installee et ne se mettait jamais a jour tout seul.
self.addEventListener("fetch", (event) => {
  // Ne pas toucher aux requetes non-GET (ecritures Firestore, etc.) -
  // l'API Cache ne sait mettre en cache que du GET, et ce trafic ne
  // nous concerne pas de toute facon.
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
