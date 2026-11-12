// Keep caches isolated from other Pages projects on the same github.io origin.
const SCOPE=new URL('./',self.location.href);
const CACHE_PREFIX=`pastel-shanghai:${SCOPE.pathname}:`;
const CACHE=CACHE_PREFIX+'v1.3.0';
const ASSETS=['./','./index.html','./src/app.js','./src/engine.js','./src/storage.js','./src/tiles.js','./src/audio.js','./src/shuffle-animation.js','./src/style.css','./src/readability.css','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request)).then(cached=>cached||fetch(event.request)));
});
