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

/* Keio runtime asset bridge. KO is used on the Keio Line family; IN is used on the Inokashira Line. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260918',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const ko=commonsAsset('Number prefix Keio-line.svg');
  const ino=commonsAsset('Number prefix Keio-Inokashira-line.svg');
  const operatorAsset={asset:'./data/operators/keio/logo.svg?v=20260918',file:'./data/operators/keio/logo.svg',version:'20260918',exists:true,verified:true,source:'https://commons.wikimedia.org/wiki/File:KeioRailway_logo.svg',officialExists:true};
  const lines={
    'line-24001':{asset:ko,code:'KO'},
    'line-24002':{asset:ko,code:'KO'},
    'line-24003':{asset:ko,code:'KO'},
    'line-24004':{asset:ko,code:'KO'},
    'line-24005':{asset:ko,code:'KO'},
    'line-24006':{asset:ino,code:'IN'},
    'line-24007':{asset:ko,code:'KO'}
  };
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};
  data.assets.operators.keio=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,entry] of Object.entries(lines)){
    data.assets.lines[id]=entry.asset;
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:entry.code,color:entry.code==='IN'?'#000088':'#DD0077',style:'private',operatorMark:'KEIO',colorVerified:true,colorSource:'https://www.keio.co.jp/train/map/'};
  }
  if(window.TRT_LINE_BADGES?.routeCodes){
    for(const [id,entry] of Object.entries(lines)) window.TRT_LINE_BADGES.routeCodes[id]=entry.code;
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='keio') route.operatorAsset=operatorAsset;
    const entry=lines[route.id];
    if(entry){
      route.symbolAsset=entry.asset;
      route.symbolMeta={...(route.symbolMeta||{}),asset:entry.asset.asset,officialSymbolExists:true,verified:false,identificationSource:'wikimedia-commons',assetSource:'wikimedia-commons',assetSourceUrl:entry.asset.source};
      route.officialSymbolExists=true;
      route.code=entry.code;
    }
  }
})();
