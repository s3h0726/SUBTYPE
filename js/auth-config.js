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

/* Sotetsu runtime asset bridge. All three Sotetsu lines share the SO symbol. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260918',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const symbol=commonsAsset('Sotetsu line symbol.svg');
  const operatorAsset=commonsAsset('SOTETSU logo.svg');
  const ids=['line-29001','line-29002','line-29003'];
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};
  data.assets.operators.sotetsu=operatorAsset;
  for(const id of ids) data.assets.lines[id]=symbol;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const id of ids){
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:'SO',color:'#0066B3',style:'private',operatorMark:'SOTETSU',colorVerified:true,colorSource:'https://www.sotetsu.co.jp/train/'};
  }
  if(window.TRT_LINE_BADGES?.routeCodes){
    for(const id of ids) window.TRT_LINE_BADGES.routeCodes[id]='SO';
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='sotetsu') route.operatorAsset=operatorAsset;
    if(ids.includes(route.id)){
      route.symbolAsset=symbol;
      route.symbolMeta={...(route.symbolMeta||{}),asset:symbol.asset,officialSymbolExists:true,verified:false,identificationSource:'wikimedia-commons',assetSource:'wikimedia-commons',assetSourceUrl:symbol.source};
      route.officialSymbolExists=true;
      route.code='SO';
    }
  }
})();

/* JR East full-network normalization.
   Official Tokyo-area line codes use real line symbols; uncoded regional lines and Shinkansen
   intentionally use the JR EAST operator mark rather than a synthetic route symbol. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};

  const operatorAsset={asset:'./data/operators/jr-east/logo.svg?v=20260918',file:'./data/operators/jr-east/logo.svg',version:'20260918',exists:true,verified:true,source:'https://www.jreast.co.jp/',officialExists:true};
  const officialCodes=new Set(['JT','JO','JK','JH','JN','JY','JC','JB','JU','JJ','JA','JM','JE','JS']);
  const commonsAsset=(code)=>{
    const filename=`JR ${code} line symbol.svg`;
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260918',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const symbols={};
  for(const code of officialCodes) symbols[code]=commonsAsset(code);

  data.assets.operators['jr-east']=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  let coded=0;
  let fallback=0;

  for(const route of data.routes||[]){
    if(route.operatorId!=='jr-east') continue;
    route.operatorAsset=operatorAsset;

    const theme=window.TRT_LINE_THEMES[route.id]||{};
    const badgeCode=window.TRT_LINE_BADGES?.routeCodes?.[route.id]||'';
    const rawCode=String(route.code||badgeCode||theme.code||'').trim();
    const code=officialCodes.has(rawCode)?rawCode:'';

    window.TRT_LINE_THEMES[route.id]={...theme,...(code?{code}:{}),color:route.color||theme.color||'#00843D',style:'jr',operatorMark:'JR EAST',colorSource:theme.colorSource||'https://www.jreast.co.jp/map/'};

    if(code){
      const symbol=symbols[code];
      data.assets.lines[route.id]=symbol;
      route.symbolAsset=symbol;
      route.symbolMeta={...(route.symbolMeta||{}),asset:symbol.asset,officialSymbolExists:true,verified:false,identificationSource:'wikimedia-commons',assetSource:'wikimedia-commons',assetSourceUrl:symbol.source};
      route.officialSymbolExists=true;
      route.code=code;
      coded++;
    }else{
      data.assets.lines[route.id]=operatorAsset;
      route.symbolAsset=operatorAsset;
      route.symbolMeta={...(route.symbolMeta||{}),asset:operatorAsset.asset,officialSymbolExists:false,verified:true,fallbackToOperator:true,identificationSource:'jr-east-operator-logo',assetSource:'local',assetSourceUrl:'./data/operators/jr-east/logo.svg'};
      route.officialSymbolExists=false;
      fallback++;
    }
  }

  window.TRT_JR_EAST_RUNTIME={coded,fallback,officialCodes:[...officialCodes]};
})();


/* Kintetsu full-network runtime asset bridge. Official Kintetsu route letters follow the current network map. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};

  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260919',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };

  const operatorAsset=commonsAsset('Kintetsu Logo full.svg');
  const symbol=(code)=>commonsAsset(`KT number-${code}.svg`);
  const lines={
    'line-31001':'A',
    'line-31020':'A',
    'line-31002':'B',
    'line-31025':'B',
    'line-31023':'C',
    'line-31005':'D',
    'line-31027':'E',
    'line-31003':'F',
    'line-31007':'F',
    'line-31016':'G',
    'line-31011':'H',
    'line-31017':'I',
    'line-31021':'J',
    'line-31008':'K',
    'line-31019':'L',
    'line-31009':'M',
    'line-31010':'M',
    'line-31015':'M',
    'line-31012':'N',
    'line-31022':'O',
    'line-31018':'P',
    'line-31026':'Y',
    'line-31024':'Z'
  };
  const symbols={};
  for(const code of new Set(Object.values(lines))) symbols[code]=symbol(code);

  data.assets.operators.kinkinihontetsudo=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};

  for(const [id,code] of Object.entries(lines)){
    const asset=symbols[code];
    data.assets.lines[id]=asset;
    const theme=window.TRT_LINE_THEMES[id]||{};
    window.TRT_LINE_THEMES[id]={...theme,code,color:theme.color||'#E60012',style:'private',operatorMark:'긴키 일본 철도',colorVerified:true,colorSource:'https://www.kintetsu.co.jp/station/'};
    if(window.TRT_LINE_BADGES?.routeCodes) window.TRT_LINE_BADGES.routeCodes[id]=code;
  }

  for(const route of data.routes||[]){
    if(route.operatorId==='kinkinihontetsudo') route.operatorAsset=operatorAsset;
    const code=lines[route.id];
    if(!code) continue;
    const asset=symbols[code];
    route.symbolAsset=asset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:asset.asset,officialSymbolExists:true,verified:false,identificationSource:'kintetsu-official-map',assetSource:'wikimedia-commons',assetSourceUrl:asset.source};
    route.officialSymbolExists=true;
    route.code=code;
  }
})();

/* Hanshin Electric Railway runtime asset bridge. All Hanshin lines use the HS prefix. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};

  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260919',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };

  const symbol=commonsAsset('Number prefix Hanshin line.svg');
  const operatorAsset=commonsAsset('Hanshin logo.svg');
  const ids=['line-35001','line-35002','line-35003'];

  data.assets.operators.hanshindentetsu=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};

  for(const id of ids){
    data.assets.lines[id]=symbol;
    const theme=window.TRT_LINE_THEMES[id]||{};
    window.TRT_LINE_THEMES[id]={...theme,code:'HS',color:theme.color||'#1B5DAA',style:'private',operatorMark:'한신 전기철도',colorVerified:true,colorSource:'https://www.hanshin.co.jp/station/'};
    if(window.TRT_LINE_BADGES?.routeCodes) window.TRT_LINE_BADGES.routeCodes[id]='HS';
  }

  for(const route of data.routes||[]){
    if(route.operatorId==='hanshindentetsu') route.operatorAsset=operatorAsset;
    if(!ids.includes(route.id)) continue;
    route.symbolAsset=symbol;
    route.symbolMeta={...(route.symbolMeta||{}),asset:symbol.asset,officialSymbolExists:true,verified:false,identificationSource:'hanshin-official-numbering',assetSource:'wikimedia-commons',assetSourceUrl:symbol.source};
    route.officialSymbolExists=true;
    route.code='HS';
  }
})();

/* Hankyu Railway runtime asset bridge. Use the three real HK route-symbol variants. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260922',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const operatorAsset=commonsAsset('Hankyu Railway Logo.svg');
  const kobe=commonsAsset('Number prefix Hankyu Kōbe line.svg');
  const takarazuka=commonsAsset('Number prefix Hankyu Takarazuka line.svg');
  const kyoto=commonsAsset('Number prefix Hankyu Kyōto line.svg');
  const lines={
    'line-34001':kobe,
    'line-34004':kobe,
    'line-34005':kobe,
    'line-34006':kobe,
    'line-34002':takarazuka,
    'line-34007':takarazuka,
    'line-34003':kyoto,
    'line-34008':kyoto,
    'line-34009':kyoto
  };
  data.assets.operators.hankyudentetsu=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,symbol] of Object.entries(lines)){
    data.assets.lines[id]=symbol;
    const theme=window.TRT_LINE_THEMES[id]||{};
    window.TRT_LINE_THEMES[id]={...theme,code:'HK',color:'#702029',style:'private',operatorMark:'한큐 전철',colorVerified:true,colorSource:'https://www.hankyu.co.jp/station/'};
    if(window.TRT_LINE_BADGES?.routeCodes) window.TRT_LINE_BADGES.routeCodes[id]='HK';
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='hankyudentetsu') route.operatorAsset=operatorAsset;
    const symbol=lines[route.id];
    if(!symbol) continue;
    route.symbolAsset=symbol;
    route.symbolMeta={...(route.symbolMeta||{}),asset:symbol.asset,officialSymbolExists:true,verified:true,identificationSource:'verified-commons',assetSource:'wikimedia-commons',assetSourceUrl:symbol.source};
    route.officialSymbolExists=true;
    route.code='HK';
  }
})();

/* Osaka Metro runtime asset bridge. Official line letters: M/T/Y/C/S/K/N/I and New Tram P. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260919',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const operatorAsset={asset:'./data/operators/osaka-metro/logo.svg?v=20260919',file:'./data/operators/osaka-metro/logo.svg',version:'20260919',exists:true,verified:true,source:'https://subway.osakametro.co.jp/',officialExists:true};
  const lines={
    'line-99618':{code:'M',color:'#E5171F'},
    'line-99619':{code:'T',color:'#522886'},
    'line-99620':{code:'Y',color:'#0078BA'},
    'line-99621':{code:'C',color:'#019A66'},
    'line-99622':{code:'S',color:'#E44D93'},
    'line-99623':{code:'K',color:'#814721'},
    'line-99624':{code:'N',color:'#A9CC51'},
    'line-99652':{code:'I',color:'#EE7B1A'},
    'line-99625':{code:'P',color:'#00A0DE'}
  };
  const symbolFiles={
    M:'Osaka Metro Midosuji line symbol.svg',
    T:'Osaka Metro Tanimachi line symbol.svg',
    Y:'Osaka Metro Yotsubashi line symbol.svg',
    C:'Osaka Metro Chuo line symbol.svg',
    S:'Osaka Metro Sennichimae line symbol.svg',
    K:'Osaka Metro Sakaisuji line symbol.svg',
    N:'Osaka Metro Nagahori Tsurumi-ryokuchi line symbol.svg',
    I:'Osaka Metro Imazatosuji line symbol.svg',
    P:'Osaka Metro Nanko Port Town line symbol.svg'
  };
  const symbols={};
  for(const [code,filename] of Object.entries(symbolFiles)) symbols[code]=commonsAsset(filename);
  data.assets.operators['osaka-metro']=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,entry] of Object.entries(lines)){
    const asset=symbols[entry.code];
    data.assets.lines[id]=asset;
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:entry.code,color:entry.color,style:'subway',operatorMark:'Osaka Metro',colorVerified:true,colorSource:'https://subway.osakametro.co.jp/guide/routemap.php'};
    if(window.TRT_LINE_BADGES?.routeCodes) window.TRT_LINE_BADGES.routeCodes[id]=entry.code;
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='osaka-metro') route.operatorAsset=operatorAsset;
    const entry=lines[route.id];
    if(!entry) continue;
    const asset=symbols[entry.code];
    route.symbolAsset=asset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:asset.asset,officialSymbolExists:true,verified:false,identificationSource:'osaka-metro-official-numbering',assetSource:'wikimedia-commons',assetSourceUrl:asset.source};
    route.officialSymbolExists=true;
    route.code=entry.code;
    route.color=entry.color;
  }
})();

/* Nankai Electric Railway runtime asset bridge. Current network uses NK station numbering. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260919',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const operatorAsset=commonsAsset('Nankai logo with its slogan.svg');
  const mainSymbol=commonsAsset('Nankai mainline symbol.svg');
  const koyaSymbol=commonsAsset('Nankai koya line symbol.svg');
  const lines={
    'line-32001':mainSymbol,
    'line-32002':commonsAsset('Nankai airport line symbol.svg'),
    'line-32003':mainSymbol,
    'line-32004':mainSymbol,
    'line-32005':mainSymbol,
    'line-32006':mainSymbol,
    'line-32007':koyaSymbol,
    'line-32008':koyaSymbol,
    'line-32009':koyaSymbol
  };
  data.assets.operators.nankaidentetsu=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,asset] of Object.entries(lines)){
    data.assets.lines[id]=asset;
    const theme=window.TRT_LINE_THEMES[id]||{};
    window.TRT_LINE_THEMES[id]={...theme,code:'NK',color:theme.color||'#009A41',style:'private',operatorMark:'난카이 전기철도',colorVerified:true,colorSource:'https://www.nankai.co.jp/railway/'};
    if(window.TRT_LINE_BADGES?.routeCodes) window.TRT_LINE_BADGES.routeCodes[id]='NK';
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='nankaidentetsu') route.operatorAsset=operatorAsset;
    const asset=lines[route.id];
    if(!asset) continue;
    route.symbolAsset=asset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:asset.asset,officialSymbolExists:true,verified:false,identificationSource:'nankai-official-numbering',assetSource:'wikimedia-commons',assetSourceUrl:asset.source};
    route.officialSymbolExists=true;
    route.code='NK';
  }
})();

/* Toei non-subway lines: Nippori-Toneri Liner (NT) and Tokyo Sakura Tram (SA). */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260919',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const lines={
    'line-99342':{code:'NT',color:'#D6C447',asset:commonsAsset('Nippori-Toneri Liner symbol.svg')},
    'line-99305':{code:'SA',color:'#E85298',asset:commonsAsset('Tokyo Sakura Tram symbol.svg')}
  };
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,entry] of Object.entries(lines)){
    data.assets.lines[id]=entry.asset;
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:entry.code,color:entry.color,style:'public',operatorMark:'東京都交通局',colorVerified:true,colorSource:'https://www.kotsu.metro.tokyo.jp/'};
    if(window.TRT_LINE_BADGES?.routeCodes) window.TRT_LINE_BADGES.routeCodes[id]=entry.code;
  }
  for(const route of data.routes||[]){
    const entry=lines[route.id];
    if(!entry) continue;
    route.symbolAsset=entry.asset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:entry.asset.asset,officialSymbolExists:true,verified:false,identificationSource:'toei-official-numbering',assetSource:'wikimedia-commons',assetSourceUrl:entry.asset.source};
    route.officialSymbolExists=true;
    route.code=entry.code;
    route.color=entry.color;
  }
})();

/* Yurikamome: company logo and official U line symbol are separate assets. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260919',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const operatorAsset={asset:null,file:null,version:'official-company-wordmark-unavailable',exists:false,verified:true,source:'https://www.yurikamome.co.jp/business/permission.html',assetSource:'official',assetSourceUrl:'https://www.yurikamome.co.jp/business/permission.html',officialExists:true};
  const lineAsset=commonsAsset('Yurikamome line symbol.svg');
  const id='line-99311';
  data.assets.operators.yurikamome=operatorAsset;
  data.assets.lines[id]=lineAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:'U',color:'#0067B0',style:'private',operatorMark:'株式会社ゆりかもめ',colorVerified:true,colorSource:'https://www.yurikamome.co.jp/'};
  if(window.TRT_LINE_BADGES?.routeCodes) window.TRT_LINE_BADGES.routeCodes[id]='U';
  for(const route of data.routes||[]){
    if(route.operatorId==='yurikamome') route.operatorAsset=operatorAsset;
    if(route.id!==id) continue;
    route.symbolAsset=lineAsset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:lineAsset.asset,officialSymbolExists:true,verified:false,identificationSource:'yurikamome-official-numbering',assetSource:'wikimedia-commons',assetSourceUrl:lineAsset.source};
    route.officialSymbolExists=true;
    route.code='U';
    route.color='#0067B0';
  }
})();

/* Metropolitan Intercity Railway / Tsukuba Express: separate company identity and TX line mark. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260919',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };
  const operatorAsset=commonsAsset('Tsukuba Express logo.svg');
  const lineAsset=commonsAsset('Tsukuba Express symbol.svg');
  const id='line-99309';
  data.assets.operators['metropolitan-intercity-railway']=operatorAsset;
  data.assets.lines[id]=lineAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:'TX',color:'#003399',style:'private',operatorMark:'首都圏新都市鉄道',colorVerified:true,colorSource:'https://www.mir.co.jp/company/ci.html'};
  if(window.TRT_LINE_BADGES?.routeCodes) window.TRT_LINE_BADGES.routeCodes[id]='TX';
  for(const route of data.routes||[]){
    if(route.operatorId==='metropolitan-intercity-railway') route.operatorAsset=operatorAsset;
    if(route.id!==id) continue;
    route.symbolAsset=lineAsset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:lineAsset.asset,officialSymbolExists:true,verified:true,identificationSource:'mir-official-ci',assetSource:'wikimedia-commons',assetSourceUrl:lineAsset.source};
    route.officialSymbolExists=true;
    route.code='TX';
    route.color='#003399';
  }
})();

/* Tokyo Monorail: verified company logo and MO route symbol. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.operators=data.assets.operators||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260919',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const operatorAsset=commonsAsset('Tokyo Monorail Logo.svg');
  const lineAsset=commonsAsset('Tokyo Monorail Line symbol.svg');
  const id='line-99336';
  data.assets.operators['tokyo-monorail']=operatorAsset;data.assets.lines[id]=lineAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:'MO',color:'#0099CC',style:'private',operatorMark:'東京モノレール',colorVerified:true,colorSource:'https://www.tokyo-monorail.co.jp/'};
  if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]='MO';
  for(const route of data.routes||[]){if(route.operatorId==='tokyo-monorail')route.operatorAsset=operatorAsset;if(route.id!==id)continue;route.symbolAsset=lineAsset;route.symbolMeta={...(route.symbolMeta||{}),asset:lineAsset.asset,officialSymbolExists:true,verified:true,identificationSource:'verified-commons',assetSource:'wikimedia-commons',assetSourceUrl:lineAsset.source};route.officialSymbolExists=true;route.code='MO';route.color='#0099CC';}
})();

/* Tokyo Waterfront Area Rapid Transit / Rinkai Line: verified company and R route marks. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.operators=data.assets.operators||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260919',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const operatorAsset=commonsAsset('東京臨海高速鉄道ロゴマーク.svg');
  const lineAsset=commonsAsset('Rinkai Line symbol.svg');
  const id='line-99337';
  data.assets.operators['tokyo-waterfront-area-rapid-transit']=operatorAsset;data.assets.lines[id]=lineAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:'R',color:'#00B48D',style:'private',operatorMark:'東京臨海高速鉄道',colorVerified:true,colorSource:'https://www.twr.co.jp/'};
  if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]='R';
  for(const route of data.routes||[]){if(route.operatorId==='tokyo-waterfront-area-rapid-transit')route.operatorAsset=operatorAsset;if(route.id!==id)continue;route.symbolAsset=lineAsset;route.symbolMeta={...(route.symbolMeta||{}),asset:lineAsset.asset,officialSymbolExists:true,verified:true,identificationSource:'verified-commons',assetSource:'wikimedia-commons',assetSourceUrl:lineAsset.source};route.officialSymbolExists=true;route.code='R';route.color='#00B48D';}
})();

/* Nishi-Nippon Railroad (Nishitetsu): official station-number prefixes by line. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.operators=data.assets.operators||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260922',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const operatorAsset=commonsAsset('NNR logo.svg');
  const lines={
    'line-36001':{code:'T',color:'#106CB5',asset:commonsAsset('西鉄天神大牟田線(ナンバリング).png')},
    'line-36002':{code:'D',color:'#E83828',asset:commonsAsset('西鉄太宰府線(ナンバリング).png')},
    'line-36003':{code:'A',color:'#009A44',asset:commonsAsset('西鉄甘木線(ナンバリング).png')},
    'line-36004':{code:'NK',color:'#F39800',asset:commonsAsset('西鉄貝塚線.png')}
  };
  data.assets.operators.nishinihontetsudo=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,e] of Object.entries(lines)){
    data.assets.lines[id]=e.asset;
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:e.code,color:e.color,style:'private',operatorMark:'西日本鉄道',colorVerified:true,colorSource:'https://www.nishitetsu.jp/train/rosen/'};
    if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]=e.code;
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='nishinihontetsudo')route.operatorAsset=operatorAsset;
    const e=lines[route.id];if(!e)continue;
    route.code=e.code;route.color=e.color;
    route.symbolAsset=e.asset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:e.asset.asset,officialSymbolExists:true,verified:true,identificationSource:'wikipedia-commons-station-numbering',assetSource:'wikimedia-commons',assetSourceUrl:e.asset.source};
    route.officialSymbolExists=true;
  }
})();

/* Keihan Electric Railway: KH for Keihan lines, OT for Otsu lines; cable uses operator mark fallback. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.operators=data.assets.operators||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260922',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const operatorAsset=commonsAsset('Keihan Symbol.svg');
  const kh=commonsAsset('Number prefix Keihan lines.svg');
  const ot=commonsAsset('Keihan Keishin line symbol.svg');
  const lines={
    'line-33001':{code:'KH',asset:kh},
    'line-33002':{code:'KH',asset:kh},
    'line-33003':{code:'KH',asset:kh},
    'line-33004':{code:'KH',asset:kh},
    'line-33008':{code:'KH',asset:kh},
    'line-33005':{code:'KH',asset:kh},
    'line-33006':{code:'OT',asset:ishiyama},
    'line-33007':{code:'OT',asset:keishin}
  };
  data.assets.operators.keihandentetsu=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,e] of Object.entries(lines)){
    data.assets.lines[id]=e.asset;
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:e.code,style:'private',operatorMark:'京阪電気鉄道',colorVerified:true,colorSource:'https://www.keihan.co.jp/traffic/station/'};
    if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]=e.code;
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='keihandentetsu')route.operatorAsset=operatorAsset;
    const e=lines[route.id];
    if(e){route.symbolAsset=e.asset;route.symbolMeta={...(route.symbolMeta||{}),asset:e.asset.asset,officialSymbolExists:true,verified:true,identificationSource:'keihan-official-numbering',assetSource:'wikimedia-commons',assetSourceUrl:e.asset.source};route.officialSymbolExists=true;route.code=e.code;}

  }
})();

/* Sendai City Transportation Bureau / Sendai Subway. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.operators=data.assets.operators||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260923',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const operatorAsset=commonsAsset('Transportation Bureau City of Sendai Logo.svg');
  const subwayAsset=commonsAsset('Sendai City Subway Logo.svg');
  const lines={
    'line-99214':{code:'N',color:'#00A650'},
    'line-99218':{code:'T',color:'#00A7DB'}
  };
  data.assets.operators.sendaishikotsukyoku=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,e] of Object.entries(lines)){
    data.assets.lines[id]=subwayAsset;
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:e.code,color:e.color,style:'subway',operatorMark:'仙台市交通局',colorVerified:true,colorSource:'https://www.kotsu.city.sendai.jp/subway/station/station.html'};
    if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]=e.code;
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='sendaishikotsukyoku')route.operatorAsset=operatorAsset;
    const e=lines[route.id];if(!e)continue;
    route.code=e.code;route.color=e.color;route.symbolAsset=subwayAsset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:subwayAsset.asset,officialSymbolExists:true,verified:true,identificationSource:'sendai-official-and-commons',assetSource:'wikimedia-commons',assetSourceUrl:subwayAsset.source};
    route.officialSymbolExists=true;
  }
})();

/* Fukuoka City Transportation Bureau / Fukuoka City Subway. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.operators=data.assets.operators||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260923',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const operatorAsset=commonsAsset('Fukuoka City Subway Logo.svg');
  const lines={
    'line-99905':{code:'K',color:'#EE7E00',asset:commonsAsset('Subway FukuokaKuko.svg')},
    'line-99906':{code:'H',color:'#0077C0',asset:commonsAsset('Subway FukuokaHakozaki.svg')},
    'line-99907':{code:'N',color:'#00A650',asset:commonsAsset('Subway FukuokaNanakuma.svg')}
  };
  data.assets.operators.fukuokashikotsukyoku=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,e] of Object.entries(lines)){
    data.assets.lines[id]=e.asset;
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:e.code,color:e.color,style:'subway',operatorMark:'福岡市交通局',colorVerified:true,colorSource:'https://subway.city.fukuoka.lg.jp/'};
    if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]=e.code;
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='fukuokashikotsukyoku')route.operatorAsset=operatorAsset;
    const e=lines[route.id];if(!e)continue;
    route.code=e.code;route.color=e.color;route.symbolAsset=e.asset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:e.asset.asset,officialSymbolExists:true,verified:true,identificationSource:'verified-commons-and-fukuoka-official',assetSource:'wikimedia-commons',assetSourceUrl:e.asset.source};
    route.officialSymbolExists=true;
  }
})();

/* Nagoya City Transportation Bureau / Nagoya Municipal Subway. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.operators=data.assets.operators||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260923',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const operatorAsset=commonsAsset('Nagoya Municipal Subway Logo.svg');
  const lines={
    'line-99513':{code:'H',color:'#FAB123',asset:commonsAsset('Nagoya Subway Logo V2 (Higashiyama Line).svg')},
    'line-99514':{code:'M',color:'#9C7EB1',asset:commonsAsset('Nagoya Subway Logo V2 (Meijo Line).svg')},
    'line-99515':{code:'E',color:'#9C7EB1',asset:commonsAsset('Nagoya Subway Logo V2 (Meiko Line).svg')},
    'line-99516':{code:'T',color:'#009BBF',asset:commonsAsset('Nagoya Subway Logo V2 (Tsurumai Line).svg')},
    'line-99517':{code:'S',color:'#E9797A',asset:commonsAsset('Nagoya Subway Logo V2 (Sakura-dori Line).svg')},
    'line-99518':{code:'K',color:'#E89AAB',asset:commonsAsset('Nagoya Subway Logo V2 (Kamiiida Line).svg')}
  };
  data.assets.operators.nagoyashikotsukyoku=operatorAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  for(const [id,e] of Object.entries(lines)){
    data.assets.lines[id]=e.asset;
    window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:e.code,color:e.color,style:'subway',operatorMark:'名古屋市交通局',colorVerified:true,colorSource:'https://www.kotsu.city.nagoya.jp/'};
    if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]=e.code;
  }
  for(const route of data.routes||[]){
    if(route.operatorId==='nagoyashikotsukyoku')route.operatorAsset=operatorAsset;
    const e=lines[route.id];if(!e)continue;
    route.code=e.code;route.color=e.color;route.symbolAsset=e.asset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:e.asset.asset,officialSymbolExists:true,verified:true,identificationSource:'nagoya-official-and-commons',assetSource:'wikimedia-commons',assetSourceUrl:e.asset.source};
    route.officialSymbolExists=true;
  }
})();

/* Yokohama Minatomirai Railway / Minatomirai Line. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.operators=data.assets.operators||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260923',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const operatorAsset=commonsAsset('Yokohama Minatomirai Railway logo.svg');
  const lineAsset=commonsAsset('Minatomirai Line symbol.svg');
  const id='line-99310';
  data.assets.operators['yokohama-minatomirai-railway']=operatorAsset;data.assets.lines[id]=lineAsset;
  window.TRT_LINE_THEMES=window.TRT_LINE_THEMES||{};
  window.TRT_LINE_THEMES[id]={...(window.TRT_LINE_THEMES[id]||{}),code:'MM',color:'#0067C0',style:'private',operatorMark:'横浜高速鉄道',colorVerified:true,colorSource:'https://www.mm21railway.co.jp/'};
  if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]='MM';
  for(const route of data.routes||[]){
    if(route.operatorId==='yokohama-minatomirai-railway')route.operatorAsset=operatorAsset;
    if(route.id!==id)continue;route.code='MM';route.color='#0067C0';route.symbolAsset=lineAsset;
    route.symbolMeta={...(route.symbolMeta||{}),asset:lineAsset.asset,officialSymbolExists:true,verified:true,identificationSource:'verified-commons-and-mm21-official',assetSource:'wikimedia-commons',assetSourceUrl:lineAsset.source};route.officialSymbolExists=true;
  }
})();

/* Final municipal-subway route-symbol override: keep verified line artwork from being replaced by later fallbacks. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  data.assets=data.assets||{};data.assets.lines=data.assets.lines||{};
  const commonsAsset=(filename)=>{const encoded=encodeURIComponent(filename);const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;return {asset:file,file,version:'commons-20260924-final',exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};};
  const entries={
    'line-99513':{code:'H',asset:commonsAsset('Nagoya Subway Logo V2 (Higashiyama Line).svg')},
    'line-99514':{code:'M',asset:commonsAsset('Nagoya Subway Logo V2 (Meijo Line).svg')},
    'line-99515':{code:'E',asset:commonsAsset('Nagoya Subway Logo V2 (Meiko Line).svg')},
    'line-99516':{code:'T',asset:commonsAsset('Nagoya Subway Logo V2 (Tsurumai Line).svg')},
    'line-99517':{code:'S',asset:commonsAsset('Nagoya Subway Logo V2 (Sakura-dori Line).svg')},
    'line-99518':{code:'K',asset:commonsAsset('Nagoya Subway Logo V2 (Kamiiida Line).svg')},
    'line-99905':{code:'K',asset:commonsAsset('Subway FukuokaKuko.svg')},
    'line-99906':{code:'H',asset:commonsAsset('Subway FukuokaHakozaki.svg')},
    'line-99907':{code:'N',asset:commonsAsset('Subway FukuokaNanakuma.svg')}
  };
  for(const [id,e] of Object.entries(entries)){
    data.assets.lines[id]=e.asset;
    if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]=e.code;
    const route=(data.routes||[]).find(r=>r.id===id);if(!route)continue;
    route.code=e.code;route.symbolAsset=e.asset;route.officialSymbolExists=true;
    route.symbolMeta={...(route.symbolMeta||{}),asset:e.asset.asset,officialSymbolExists:true,verified:true,identificationSource:'verified-commons-final',assetSource:'wikimedia-commons',assetSourceUrl:e.asset.source};
  }
  // Sendai has a verified subway emblem, while N/T are station-number prefixes rather than separate reusable Commons line-logo files.
  const sendai=commonsAsset('Sendai City Subway Logo.svg');
  for(const [id,code] of [['line-99214','N'],['line-99218','T']]){
    data.assets.lines[id]=sendai;
    if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]=code;
    const route=(data.routes||[]).find(r=>r.id===id);if(!route)continue;
    route.code=code;route.symbolAsset=sendai;route.officialSymbolExists=true;
    route.symbolMeta={...(route.symbolMeta||{}),asset:sendai.asset,officialSymbolExists:true,verified:true,identificationSource:'sendai-subway-emblem',assetSource:'wikimedia-commons',assetSourceUrl:sendai.source};
  }
})();

/* FINAL_VISIBLE_ROUTE_SYMBOLS_20260926 */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;if(!data)return;
  const commons=(name)=>{const encoded=encodeURIComponent(name);const asset=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;return {asset,file:asset,exists:true,verified:true,officialExists:true,assetSource:'wikimedia-commons',assetSourceUrl:`https://commons.wikimedia.org/wiki/File:${encoded}`};};
  const map={
    'line-99214':['N','Sendai City Subway Logo.svg'],
    'line-99218':['T','Sendai City Subway Logo.svg'],
    'line-99905':['K','Subway FukuokaKuko.svg'],
    'line-99906':['H','Subway FukuokaHakozaki.svg'],
    'line-99907':['N','Subway FukuokaNanakuma.svg'],
    'line-99513':['H','Nagoya Subway Logo V2 (Higashiyama Line).svg'],
    'line-99514':['M','Nagoya Subway Logo V2 (Meijo Line).svg'],
    'line-99515':['E','Nagoya Subway Logo V2 (Meiko Line).svg'],
    'line-99516':['T','Nagoya Subway Logo V2 (Tsurumai Line).svg'],
    'line-99517':['S','Nagoya Subway Logo V2 (Sakura-dori Line).svg'],
    'line-99518':['K','Nagoya Subway Logo V2 (Kamiiida Line).svg']
  };
  data.assets=data.assets||{};data.assets.lines=data.assets.lines||{};
  for(const [id,[code,name]] of Object.entries(map)){
    const a=commons(name);data.assets.lines[id]=a;
    const r=(data.routes||[]).find(x=>x.id===id);if(r){r.code=code;r.symbolAsset=a;r.officialSymbolExists=true;r.symbolMeta={...(r.symbolMeta||{}),asset:a.asset,officialSymbolExists:true,verified:true,assetSource:'wikimedia-commons',assetSourceUrl:a.assetSourceUrl};}
    if(window.TRT_LINE_BADGES?.routeCodes)window.TRT_LINE_BADGES.routeCodes[id]=code;
  }
})();