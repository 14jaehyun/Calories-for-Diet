// 버전 기록: dietnote-v10 이후로 버전 번호를 다시 시작(리부트)함. v2.1 다음 업데이트부터 v1.2.1 체계로 정함.
// 캐시 이름은 설정창 하단에 표시되는 버전(index.html의 APP_VERSION)과 같게 맞춘다.
const V = 'dietnote-v1.2.1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './badge-male.png', './badge-female.png', './sfx/tung.wav'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const cdn = url.hostname === 'cdnjs.cloudflare.com';
  if (!same && !cdn) return; // Gemini, ntfy 등은 항상 네트워크
  if (req.mode === 'navigate') {
    // 화면은 네트워크 우선 → 업데이트가 바로 반영, 오프라인이면 캐시
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); }
    return r;
  })));
});
