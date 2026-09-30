"use strict";
(function(root){
  const Pricing=root.PricingAssistant;
  const TEMPLATE_NAMES={STANDARD:"己森标准","JISEN SELECT":"己森精选","JISEN ARCHIVE":"己森典藏"};
  const OPTIONS={
    kiln:["備前焼","信楽焼","常滑焼","丹波焼","越前焼","瀬戸焼","九谷焼","有田焼","伊万里","日本中古","その他","不明"],
    itemType:["茶碗","湯呑","酒呑","徳利","急須","小皿","皿","鉢","花器","壺","甕","食器","茶器","酒器","装飾器","その他"],
    period:["昭和前期頃","昭和中期頃","昭和後期頃","平成頃","現代","年代不詳"],
    technique:["無釉焼締","自然釉","灰釉","施釉","朱泥","染付","色絵","金彩","青磁","上絵","焼締","窯変","その他"],
    accessories:["なし","共箱","木箱","栞","布","共箱・栞","その他"],
    condition:["良好","使用感あり","経年感あり","小傷あり","小欠けあり","貫入あり","補修あり","詳細はスタッフまで"]
  };
  const PHOTO_SLOTS=["main","mark","box","condition","other"];
  const now=()=>new Date().toISOString();
  function uuid(){return root.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}
  function newProduct(batchId,deviceId,previous){const recordId=uuid();const product={
    id:recordId,recordId,batchId,deviceId,createdAt:now(),updatedAt:now(),exportedAt:null,captureStatus:"DRAFT",ownerReviewRequired:false,
    sku:"",templateType:"STANDARD",kiln:"",itemType:"",customItemName:"",period:"",technique:"",artist:"",studio:"",accessories:"",condition:"",price:"",note:"",priceIsProvisional:true,
    showPeriod:true,showTechnique:true,showArtist:true,showAccessories:true,showCondition:true,showSku:true,
    ...Pricing.defaultItem(),imageAnalysisResult:null
  };if(previous)for(const key of ["kiln","itemType","customItemName","period","technique","accessories"])product[key]=previous[key]||"";Pricing.applyCalculation(product,Pricing.defaultSettings());return product}
  function recalculate(product,pricingSettings){Pricing.applyCalculation(product,pricingSettings);return product}
  function statusFor(product,manualReview=false){if(manualReview||product.ownerReviewRequired||product.researchRequired)return "REVIEW";return product.itemType&&product.itemType!=="自定义"||product.customItemName?"READY":"DRAFT"}
  function safeStem(product){const sku=String(product.sku||"").toUpperCase().replace(/[^A-Z0-9_-]/g,"-").replace(/-+/g,"-").replace(/^[-_]+|[-_]+$/g,"").slice(0,50);return sku||`rec-${String(product.recordId||product.id||uuid()).replace(/[^A-Za-z0-9]/g,"").slice(0,8)}`}
  function batchIdFor(date,existing){const day=new Date(date).toISOString().slice(0,10).replace(/-/g,"");const used=new Set(existing.map(b=>b.batchId));let n=1;while(used.has(`${day}-${String(n).padStart(2,"0")}`))n++;return `${day}-${String(n).padStart(2,"0")}`}
  function csvCell(value){const s=String(value??"");return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
  function csvFor(products){const columns=[["sku","SKU"],["itemType","器型"],["kiln","窑口"],["identityConfidence","可信度"],["period","年代"],["technique","工艺"],["artist","作者"],["accessories","附件"],["condition","品相"],["suggestedPrice","建议价"],["price","暂定售价"],["captureStatus","审核状态"],["note","备注"]];const lines=[columns.map(v=>v[1]).join(",")];for(const product of products)lines.push(columns.map(([key])=>csvCell(key==="itemType"&&product.itemType==="自定义"?product.customItemName:product[key])).join(","));return "\uFEFF"+lines.join("\r\n")+"\r\n"}
  root.JisenCapture={TEMPLATE_NAMES,OPTIONS,PHOTO_SLOTS,uuid,newProduct,recalculate,statusFor,safeStem,batchIdFor,csvFor};
})(typeof window!=="undefined"?window:globalThis);
