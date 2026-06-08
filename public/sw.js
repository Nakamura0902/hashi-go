// はしGO Service Worker（軽量・network-first）
// 開発時のHMRを壊さないよう、ナビゲーションと静的アセットはネット優先、
// オフライン時のみキャッシュにフォールバックする。

const CACHE = "hashigo-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 外部（Supabase / Mapbox / Unsplash）はSWを介さない
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
  );
});

// プッシュ通知（Web Push）受信時の表示（送信バックエンドは将来実装）
self.addEventListener("push", (event) => {
  let data = { title: "はしGO", body: "新しいお知らせがあります" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    /* noop */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/merchant"));
});
