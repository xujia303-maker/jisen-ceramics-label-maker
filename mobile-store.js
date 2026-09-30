"use strict";
(function(root){
  const NAME="JISENCeramicsDB",VERSION=1;
  let dbPromise;
  function open(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open(NAME,VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("products"))db.createObjectStore("products",{keyPath:"recordId"});if(!db.objectStoreNames.contains("batches"))db.createObjectStore("batches",{keyPath:"batchId"});if(!db.objectStoreNames.contains("settings"))db.createObjectStore("settings",{keyPath:"key"});if(!db.objectStoreNames.contains("photos")){const photos=db.createObjectStore("photos",{keyPath:"photoId"});photos.createIndex("recordId","recordId",{unique:false})}};request.onsuccess=()=>resolve(request.result);request.onerror=()=>{dbPromise=null;reject(request.error||Error("无法打开 IndexedDB"))}});return dbPromise}
  async function transact(names,mode,work){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(names,mode);let result;try{result=work(tx)}catch(error){tx.abort();reject(error);return}tx.oncomplete=()=>resolve(result?.value);tx.onerror=()=>reject(tx.error||Error("本地存储失败"));tx.onabort=()=>reject(tx.error||Error("本地存储已取消"))})}
  function single(store,mode,action){return transact([store],mode,tx=>{const output={value:undefined};const req=action(tx.objectStore(store));if(req)req.onsuccess=()=>{output.value=req.result};return output})}
  const putProduct=product=>single("products","readwrite",store=>store.put(product));
  const getProduct=id=>single("products","readonly",store=>store.get(id));
  const listProducts=()=>single("products","readonly",store=>store.getAll());
  const deleteProduct=id=>single("products","readwrite",store=>store.delete(id));
  const putBatch=batch=>single("batches","readwrite",store=>store.put(batch));
  const getBatch=id=>single("batches","readonly",store=>store.get(id));
  const listBatches=()=>single("batches","readonly",store=>store.getAll());
  const putPhoto=photo=>single("photos","readwrite",store=>store.put(photo));
  const deletePhoto=id=>single("photos","readwrite",store=>store.delete(id));
  const listPhotos=()=>single("photos","readonly",store=>store.getAll());
  const photosForRecord=id=>single("photos","readonly",store=>store.index("recordId").getAll(id));
  const putSetting=(key,value)=>single("settings","readwrite",store=>store.put({key,value}));
  const getSetting=async key=>(await single("settings","readonly",store=>store.get(key)))?.value;
  const listSettings=()=>single("settings","readonly",store=>store.getAll());
  async function replaceBackup(data){const names=["products","photos","batches","settings"];await transact(names,"readwrite",tx=>{for(const name of names){const store=tx.objectStore(name);store.clear();for(const entry of data[name]||[])store.put(entry)}return {value:true}})}
  root.JisenStore={open,putProduct,getProduct,listProducts,deleteProduct,putBatch,getBatch,listBatches,putPhoto,deletePhoto,listPhotos,photosForRecord,putSetting,getSetting,listSettings,replaceBackup};
})(typeof window!=="undefined"?window:globalThis);
