// The Hmong app moved to pastordhauck.github.io/hmong-directory (5 Nov 2026): clear this old copy.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith("hmong-dir-")).map(n => caches.delete(n)))).then(() => self.registration.unregister())));
