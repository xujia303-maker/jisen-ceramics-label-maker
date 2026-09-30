"use strict";
(function(root){
  function classify(product,items){const byId=items.find(p=>p.recordId===product.recordId);if(byId)return {existing:byId,kind:"recordId 重复",defaultChoice:"skip"};const bySku=product.sku?items.find(p=>p.sku===product.sku):null;if(bySku)return {existing:bySku,kind:"SKU 冲突",defaultChoice:"skip"};return {existing:null,kind:"新商品",defaultChoice:"new"}}
  root.JisenImportRules={classify};
})(typeof window!=="undefined"?window:globalThis);
