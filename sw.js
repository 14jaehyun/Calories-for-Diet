// 버전 기록: dietnote-v10 이후로 버전 번호를 다시 시작(리부트)함. v2.1 다음 업데이트부터 v1.2.1 체계로 정함.
// 캐시 이름은 설정창 하단에 표시되는 버전(index.html의 APP_VERSION)과 같게 맞춘다.
const V = 'dietnote-v1.5.0';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './badge-male.png', './badge-female.png', './badge-male-jc.png', './badge-female-jc.png', './sfx/tung.wav'];
self.addEventListener('install', e => {
  // 설치할 때도 캐시 말고 서버에서 새로 받음
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
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
    // 깃허브 페이지의 10분 캐시를 건너뛰고 항상 서버에 새 버전이 있는지 확인 (바뀐 게 없으면 304로 가볍게 끝남)
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(r => { const c = r.clone(); caches.open(V).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); }
    return r;
  })));
});
