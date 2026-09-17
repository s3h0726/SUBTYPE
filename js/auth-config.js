window.TRT_SUPABASE_CONFIG={url:'',anonKey:''};

/* Keikyu runtime asset bridge. This file loads after line/workspace data and before app.bundle.js. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  const encoded=encodeURIComponent('Number prefix Keikyū.svg');
  const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
  const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
  const symbol={asset:file,file,version:'commons-20260918',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  const operatorAsset={asset:'./data/operators/keikyu/logo.svg?v=20260918',file:'./data/operators/keikyu/logo.svg',version:'20260918',exists:true,verified:true,source:'https://commons.wikimedia.org/wiki/File:Keikyu_Logo_full.svg',officialExists:true};
  const ids=['line-27001','line-27002','line-27003','line-27004','line-27005'];
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};
  data.assets.operators.keikyu=operatorAsset;
  for(const id of ids) data.assets.lines[id]=symbol;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const id of ids){
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:'KK',color:'#00A0E9',style:'private',operatorMark:'KEIKYU',colorVerified:true,colorSource:'https://www.keikyu.co.jp/ride/kakueki/'};
  }
  if(window.TRT_LINE_BADGES?.routeCodes){
    for(const id of ids) window.TRT_LINE_BADGES.routeCodes[id]='KK';
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='keikyu') route.operatorAsset=operatorAsset;
    if(ids.includes(route.id)){
      route.symbolAsset=symbol;
      route.symbolMeta={...(route.symbolMeta||{}),asset:symbol.asset,officialSymbolExists:true,verified:false,identificationSource:'wikimedia-commons',assetSource:'wikimedia-commons',assetSourceUrl:source};
      route.officialSymbolExists=true;
      route.code='KK';
    }
  }
})();
