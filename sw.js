// App shell cache. Data never goes through here: it comes from the GitHub API with the user's token.
const CACHE='habayit-v28';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('habayit-v')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(_){d={body:e.data&&e.data.text()}}
  // one more unread update: raise the number on the app icon (the app sets the exact number when it opens)
  const bump=caches.open('habayit-badge').then(c=>c.match('./badge-count').then(r=>r?r.text():'0').then(t=>{const n=(parseInt(t,10)||0)+1;
    return c.put('./badge-count',new Response(String(n))).then(()=>self.navigator.setAppBadge?self.navigator.setAppBadge(n):null)})).catch(()=>{});
  e.waitUntil(Promise.all([bump,self.registration.showNotification(d.title||'הבית שלנו',{body:d.body||'',tag:d.tag||undefined,icon:'icons/icon-192.png',badge:'icons/icon-192.png',lang:'he',dir:'rtl',data:{url:d.url||'./'}})]));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  // the app already open: bring it forward and tell it where to go; otherwise open it at that place
  const url=e.notification.data&&e.notification.data.url||'./',m=url.match(/#go=(.+)$/),ref=m?decodeURIComponent(m[1]):null;
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c){if(ref)c.postMessage({type:'go',ref});return c.focus()}}return clients.openWindow(url)}));
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.hostname==='api.github.com')return;
  if(u.origin===location.origin){
    // network first, so a new version shows up as soon as it is online
    e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return n})));
  }
});
