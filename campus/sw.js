const CACHE = "sip-universe-v10";
const SHELL = [
  "./",
  "./index.html",
  "./css/app.css",
  "./css/flagship.css",
  "./css/visual.css",
  "./js/campus.iife.js",
  "./vendor/d3.min.js",
  "./vendor/anime.umd.min.js",
  "./vendor/rough.js",
  "./vendor/confetti.browser.js",
  "./vendor/markmap-view.js",
  "./vendor/three.min.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./favicon.ico",
  "./data/catalog.json",
  "./data/guidebot.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(event.request);
      if (fresh.ok) cache.put(event.request, fresh.clone());
      return fresh;
    } catch (err) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        const home = await cache.match("./index.html");
        if (home) return home;
      }
      throw err;
    }
  })());
});
