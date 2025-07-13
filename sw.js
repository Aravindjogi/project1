self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("portfolio-cache").then((cache) =>
      cache.addAll(["/", "/index.html", "/output.css"])
    )
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
