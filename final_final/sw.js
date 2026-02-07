self.addEventListener("install", (event) => {
  self.skipWaiting();
});

const CACHE_NAME = "legallogic-v1";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/home.html",
  "/roadmap.html",
  "/assistant.html",
  "/judge.html",
  "/login.html",

  "/style.css",
  "/home.css",
  "/roadmap.css",
  "/assistant.css",
  "/judge.css",
  "/login.css",

  "/script.js",
  "/home.js",
  "/roadmap.js",
  "/assistant.js",
  "/judge.js",
  "/login.js",

  "/manifest.json",

  "/json/roadmaps.json",
  "/json/roadmaps_hi.json",
  "/json/lang_en.json",
  "/json/lang_hi.json",

  "/icons/android/android-launchericon-192-192.png",
  "/icons/android/android-launchericon-512-512.png",
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
