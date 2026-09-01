const CACHE_NAME="catinvestimentos-v32t-1";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./logo.png",
  "./icon-192.png",
  "./icon-512.png",
  "./catalog-background.png",
  "./produto-luva.png",
  "./produto-sonic.png",
  "./produto-kitty.png",
  "./produto-ghostface.png",
  "./produto-foxy.png",
  "./produto-chaves.png",
  "./produto-coracoes.png",
  "./produto-livro.png",
  "./produto-arcoiris.png",
  "./produto-brincos-rosa.png"
];

self.addEventListener("install",(event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",(event)=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",(event)=>{
  const request=event.request;
  if(request.method!=="GET") return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  if(request.mode==="navigate"){
    event.respondWith(
      fetch(request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put("./index.html",copy));
          return response;
        })
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      if(cached) return cached;
      return fetch(request).then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
        }
        return response;
      });
    })
  );
});


self.addEventListener("push",(event)=>{
  let payload={};
  try{payload=event.data?event.data.json():{}}catch(e){payload={message:event.data?.text?.()||""}}
  const title=payload.title||"CATinvestimentos";
  const appUrl=payload.url||"./";
  const icon=new URL("./icon-192.png",self.location.href).href;
  const badge=new URL("./icon-192.png",self.location.href).href;
  event.waitUntil(
    self.registration.showNotification(title,{
      body:payload.message||"Você tem uma nova atualização.",
      icon,
      badge,
      tag:payload.tag||"catinvestimentos",
      renotify:true,
      data:{url:appUrl}
    })
  );
});

self.addEventListener("notificationclick",(event)=>{
  event.notification.close();
  const target=event.notification.data?.url||"./";
  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows){
      if("focus" in client){
        try{if("navigate" in client)await client.navigate(target)}catch(e){}
        return client.focus();
      }
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
