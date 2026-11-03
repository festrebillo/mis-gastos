/* Service worker: guarda la "cáscara" de la app para que abra al instante y sin conexión.
   Los datos NUNCA se guardan aquí: las llamadas al script de Google no pasan por este caché. */
const VERSION = "mis-gastos-v22";
const ARCHIVOS = ["./", "index.html", "styles.css", "app.js", "demo.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "jsqr.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;       // solo los archivos de la propia app
  e.respondWith(
    fetch(e.request).then((r) => {                                              // red primero: así siempre ves la versión nueva
      const copia = r.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
