/* Офлайн-режим: сайт открывается без интернета после первого захода */
var CACHE = 'ovu-v2';
var FILES = ['./', 'index.html', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'maskable-192.png', 'maskable-512.png', 'site.webmanifest'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('ovu-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Страница: сначала сеть (чтобы приходили обновления), без сети — из кэша
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', copy); }); return res;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  // Шрифты Google: из кэша, в фоне обновляются
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE + '-fonts').then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }
  // Остальное своё: кэш, затем сеть
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
  }
});
