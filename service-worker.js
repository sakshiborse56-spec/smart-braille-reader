const CACHE_NAME = "smart-braille-reader-v3";
const APP_FILES = ["./", "./index.html", "./style.css", "./script.js", "./manifest.json"];
const DB_NAME = "smart-braille-share";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
function saveSharedText(text){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains("shared"))request.result.createObjectStore("shared");};
    request.onsuccess=()=>{const db=request.result,tx=db.transaction("shared","readwrite");tx.objectStore("shared").put(text,"latest");tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};};
    request.onerror=()=>reject(request.error);
  });
}
self.addEventListener("fetch", event => {
  const url=new URL(event.request.url);
  if(event.request.method==="POST" && url.pathname.endsWith("/share/")){
    event.respondWith((async()=>{
      const form=await event.request.formData();
      const text=[form.get("text"),form.get("title"),form.get("url")].filter(v=>typeof v==="string"&&v.trim()).join("\n");
      await saveSharedText(text);
      const base=new URL("./index.html?shared=1",self.registration.scope);
      return Response.redirect(base.href,303);
    })());
    return;
  }
  if(event.request.method==="GET" && url.origin===self.location.origin){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }
});
