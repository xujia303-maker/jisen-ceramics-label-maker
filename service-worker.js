"use strict";
const CACHE="jisen-mobile-v21-20261001-mobile-ai-frozen";
const CORE=["./mobile.html","./mobile.css","./mobile.js","./ai-config.js","./vision-core.js","./mobile-vision.js","./capture-core.js","./pricing.js","./mobile-store.js","./transfer.js","./vendor/jszip.min.js","./manifest.webmanifest","./mobile-icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("jisen-mobile-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}))) });
