/* Same-origin cache. The lab does not phone home.
   SHELL is rewritten by scripts/build_precache.mjs. Keep the markers. */
var CACHE = "sip-university-v6";
var SHELL = [
  /* precache:start */
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./favicon.ico",
  "./start.html",
  "./play.html",
  "./simulator.html",
  "./rooms/T02-dialogs.html",
  "./assets/js/university.js",
  "./assets/js/pwa.js",
  "./assets/js/sip-sim.js",
  "./assets/js/onboard.js",
  "./assets/js/canon.js",
  "./assets/js/theme-boot.js",
  "./assets/js/home-hero-loader.js",
  "./assets/js/hero-scene.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-192.png",
  "./assets/icons/icon-maskable-512.png",
  "./guide/guide.js",
  "./guide/guide.css",
  "./guide/dragbot.js",
  "./guide/engine.mjs",
  "./shared/pybot-chat/engine.js",
  "./shared/pybot-chat/ui.js",
  "./shared/pybot-chat/chat.css",
  "./js/content/sipbot-index.json",
  "./vendor/three.module.min.js",
  "./assets/css/canon.css",
  "./assets/css/footer.css",
  "./assets/css/frame.css",
  "./assets/css/polish.css",
  "./assets/css/shell.css",
  "./assets/css/sim.css",
  "./assets/css/sip.css",
  "./assets/css/university.css",
  "./assets/css/wow.css",
  "./assets/js/frame.js",
  "./assets/js/phone-nav.js",
  "./assets/js/wow.js",
  "./assets/js/brand.js",
  "./assets/js/polish.js",
  /* precache:end */
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return fetch(req).then(function (res) {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(function () {
      return cache.match(req).then(function (hit) {
        if (hit) return hit;
        if (req.mode === "navigate") return cache.match("./offline.html");
        return Promise.reject(new Error("offline"));
      });
    });
  }));
});
