"use strict";
/* Independent, local rule engine. It never writes item.price. */
(function (root) {
  const PRICE_STEPS = [68,88,98,128,168,198,228,268,298,398,498,598,680,880,1280,1680,1980];
  const BASE_PRICES = {"酒呑":98,"小皿":98,"茶碗":128,"湯呑":128,"小鉢":128,"酒器":168,"中型器":168,"花器":198,"小壺":198,"急須":268,"大鉢":268,"大型器":298,"特殊器形":298};
  const FACTORS = [
    {id:"confirmedKiln",label:"确认具体窑口",steps:1,identityRelated:true},
    {id:"knownStudio",label:"明确窑元 / 工房",steps:1,identityRelated:true},
    {id:"knownArtist",label:"作者明确",steps:1,identityRelated:true},
    {id:"originalBox",label:"共箱",steps:1,identityRelated:false},
    {id:"originalAccessories",label:"栞 / 布 / 原附件",steps:1,identityRelated:false},
    {id:"completeSet",label:"完整套装",steps:1,identityRelated:false},
    {id:"excellentShape",label:"器形明显优秀",steps:1,identityRelated:false},
    {id:"excellentSurface",label:"窑变 / 釉景 / 绘付明显优秀",steps:1,identityRelated:false},
    {id:"rareShape",label:"特殊尺寸 / 少见器形",steps:1,identityRelated:false},
    {id:"earlyPeriod",label:"年代明确且较早",steps:1,identityRelated:false}
  ];
  const CONDITION = {"良好":0,"使用感あり":0,"経年感あり":0,"小傷あり":-1,"小欠けあり":-1,"貫入あり":0,"補修あり":-2,"詳細はスタッフまで":null,"正常中古痕迹":0,"小伤 / 小磕":-1,"明显磕口":-2,"冲线 / 裂纹":-2,"修补":-2,"严重影响使用":null};
  const copy = value => JSON.parse(JSON.stringify(value));
  function defaultSettings(){return {priceSteps:[...PRICE_STEPS],basePrices:{...BASE_PRICES},fallbackBase:128,factors:copy(FACTORS),conditionAdjustments:{...CONDITION}}}
  function normalizeSettings(raw){const out=defaultSettings();if(!raw||typeof raw!=="object")return out;
    if(Array.isArray(raw.priceSteps)){const steps=[...new Set(raw.priceSteps.map(Number).filter(v=>Number.isFinite(v)&&v>0))].sort((a,b)=>a-b);if(steps.length>=2)out.priceSteps=steps}
    if(raw.basePrices&&typeof raw.basePrices==="object")for(const [name,value] of Object.entries(raw.basePrices)){const n=Number(value);if(name.trim()&&Number.isFinite(n)&&n>0)out.basePrices[name.trim()]=n}
    if(Number.isFinite(Number(raw.fallbackBase))&&Number(raw.fallbackBase)>0)out.fallbackBase=Number(raw.fallbackBase);
    if(Array.isArray(raw.factors)){const factors=raw.factors.filter(f=>f&&typeof f.id==="string"&&typeof f.label==="string").map(f=>({id:f.id.slice(0,80),label:f.label.slice(0,100),steps:Math.max(0,Math.min(10,Number(f.steps)||0)),identityRelated:f.identityRelated===true}));if(factors.length)out.factors=factors}
    if(raw.conditionAdjustments&&typeof raw.conditionAdjustments==="object")for(const [name,value] of Object.entries(raw.conditionAdjustments)){const n=Number(value);if(name.trim())out.conditionAdjustments[name.trim()]=value===null?null:Number.isFinite(n)?Math.min(0,Math.max(-10,Math.trunc(n))):0}
    return out}
  function defaultItem(){return {pricingBase:0,pricingScore:0,priceAdjustmentSteps:0,suggestedPrice:0,finalPrice:"",identityConfidence:"D_UNKNOWN",researchRequired:false,researchReasons:[],pricingFactors:[],aiResearchResult:null,conditionAdjustment:0,identityConflict:false,possibleCollectible:false,manualDeepResearch:false,bottomMarkNote:""}}
  function normalizeItem(raw){const out=defaultItem();if(!raw||typeof raw!=="object")return out;
    out.identityConfidence=["A_CONFIRMED","B_PROBABLE","C_STYLE","D_UNKNOWN"].includes(raw.identityConfidence)?raw.identityConfidence:"D_UNKNOWN";
    out.pricingFactors=Array.isArray(raw.pricingFactors)?[...new Set(raw.pricingFactors.filter(v=>typeof v==="string"))]:[];
    out.finalPrice=String(raw.finalPrice??"").slice(0,30);out.aiResearchResult=raw.aiResearchResult&&typeof raw.aiResearchResult==="object"?raw.aiResearchResult:null;
    out.identityConflict=raw.identityConflict===true;out.possibleCollectible=raw.possibleCollectible===true;out.manualDeepResearch=raw.manualDeepResearch===true;out.bottomMarkNote=String(raw.bottomMarkNote??"").slice(0,500);
    return out}
  function nearestIndex(steps,price){let best=0;for(let i=1;i<steps.length;i++)if(Math.abs(steps[i]-price)<Math.abs(steps[best]-price))best=i;return best}
  function calculate(item,settings){const cfg=normalizeSettings(settings);const type=item.itemType==="自定义"?item.customItemName:item.itemType;const base=cfg.basePrices[type]??cfg.fallbackBase;const baseIndex=nearestIndex(cfg.priceSteps,base);const trusted=["A_CONFIRMED","B_PROBABLE"].includes(item.identityConfidence);const chosen=new Set(item.pricingFactors||[]);const applied=cfg.factors.filter(f=>chosen.has(f.id)&&(!f.identityRelated||trusted));const ignored=cfg.factors.filter(f=>chosen.has(f.id)&&f.identityRelated&&!trusted);const positive=applied.reduce((sum,f)=>sum+f.steps,0);const condition=Object.prototype.hasOwnProperty.call(cfg.conditionAdjustments,item.condition)?cfg.conditionAdjustments[item.condition]:0;const review=condition===null;const net=positive+(review?0:condition);const index=Math.max(0,Math.min(cfg.priceSteps.length-1,baseIndex+net));const suggested=cfg.priceSteps[index];
    const reasons=[];if(item.artist?.trim()||chosen.has("knownArtist"))reasons.push("作者信息需要核查");if((item.accessories||"").includes("共箱")&&(item.artist?.trim()||chosen.has("knownArtist")))reasons.push("作者与共箱需要交叉核对");if(/戦前|战前|明治|大正|江戸|江户/.test(item.period||""))reasons.push("年代为战前或更早");if(suggested>=680)reasons.push(`建议价达到¥${suggested}`);if(chosen.has("rareShape"))reasons.push("特殊器型 / 稀有器");if(item.identityConflict)reasons.push("身份信息存在冲突");if(item.possibleCollectible)reasons.push("可能为收藏级");if(item.manualDeepResearch)reasons.push("手动要求深查");if(review)reasons.push("品相需要人工审核");
    let template="STANDARD";if(trusted&&(chosen.has("knownArtist")||suggested>=880))template="JISEN ARCHIVE";else if(trusted&&(chosen.has("confirmedKiln")||positive>0||suggested>=268))template="JISEN SELECT";
    return {pricingBase:cfg.priceSteps[baseIndex],pricingScore:positive,priceAdjustmentSteps:net,conditionAdjustment:condition,researchRequired:reasons.length>0,researchReasons:reasons,suggestedPrice:suggested,baseIndex,applied,ignored,review,templateSuggestion:template,baseUnrounded:base}
  }
  function applyCalculation(item,settings){const result=calculate(item,settings);for(const key of ["pricingBase","pricingScore","priceAdjustmentSteps","conditionAdjustment","suggestedPrice","researchRequired","researchReasons"])item[key]=result[key];return result}
  function makePrompt(item,calculation){return `你是日本中古陶瓷市场调查助手。请调查资料，不要自动鉴定或决定零售价。所有结论标明证据和不确定性，挂牌价不得当作成交价。\n\n商品资料：\n窑口：${item.kiln||"未填"}\n器型：${item.itemType==="自定义"?item.customItemName:item.itemType||"未填"}\n身份可信度：${item.identityConfidence}\n年代：${item.period||"未填"}\n工艺：${item.technique||"未填"}\n作者：${item.artist||"未填"}\n窑元 / 工房：${item.studio||"未填"}\n共箱：${(item.accessories||"").includes("共箱")?"有":"未确认"}\n附件：${item.accessories||"未填"}\n底款备注：${item.bottomMarkNote||"未填"}\n状态：${item.condition||"未填"}\nSKU：${item.sku||"未填"}\n当前规则建议价：¥${calculation.suggestedPrice}\n\n任务：1 确认作者或窑元身份；2 调查作者履历；3 查相似器物市场记录，优先实际成交；4 严格区分成交价和挂牌价；5 查 Yahoo Auctions、Mercari、Rakuma、eBay 及可靠来源；6 核对共箱、箱书、落款；7 不把推测当事实；8 资料不足时明确写“无法确认”。\n\n请只返回 JSON 对象，字段：identityAssessment, artistAssessment, marketEvidence, soldComparables, askingPrices, risks, recommendedRetailRange, confidence, sources。每条价格记录标明币种、日期、来源及成交/挂牌属性；来源给出可核查 URL。`}
  root.PricingAssistant={defaultSettings,normalizeSettings,defaultItem,normalizeItem,calculate,applyCalculation,makePrompt};
})(typeof window!=="undefined"?window:globalThis);
