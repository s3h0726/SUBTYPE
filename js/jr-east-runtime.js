/* JR East runtime asset normalization.
   - Official Tokyo-area line codes use their Wikimedia Commons line symbol.
   - JR East routes without an official line code fall back to the JR EAST operator logo.
   - No synthetic route symbol is created for uncoded regional lines or Shinkansen. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;

  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};

  const operatorAsset={
    asset:'./data/operators/jr-east/logo.svg?v=20260918',
    file:'./data/operators/jr-east/logo.svg',
    version:'20260918',
    exists:true,
    verified:true,
    source:'https://www.jreast.co.jp/',
    officialExists:true
  };

  const officialCodes=new Set(['JT','JO','JK','JH','JN','JY','JC','JB','JU','JJ','JA','JM','JE','JS']);
  const commonsAsset=(code)=>{
    const filename=`JR ${code} line symbol.svg`;
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {
      asset:file,
      file,
      version:'commons-20260918',
      exists:true,
      verified:false,
      source,
      assetSource:'wikimedia-commons',
      assetSourceUrl:source,
      officialExists:true
    };
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

    window.TRT_LINE_THEMES[route.id]={
      ...theme,
      ...(code?{code}:{}),
      color:route.color||theme.color||'#00843D',
      style:'jr',
      operatorMark:'JR EAST',
      colorSource:theme.colorSource||'https://www.jreast.co.jp/map/'
    };

    if(code){
      const symbol=symbols[code];
      data.assets.lines[route.id]=symbol;
      route.symbolAsset=symbol;
      route.symbolMeta={
        ...(route.symbolMeta||{}),
        asset:symbol.asset,
        officialSymbolExists:true,
        verified:false,
        identificationSource:'wikimedia-commons',
        assetSource:'wikimedia-commons',
        assetSourceUrl:symbol.source
      };
      route.officialSymbolExists=true;
      route.code=code;
      coded++;
      continue;
    }

    /* Uncoded JR East lines intentionally use the operator mark as a visual fallback. */
    data.assets.lines[route.id]=operatorAsset;
    route.symbolAsset=operatorAsset;
    route.symbolMeta={
      ...(route.symbolMeta||{}),
      asset:operatorAsset.asset,
      officialSymbolExists:false,
      verified:true,
      fallbackToOperator:true,
      identificationSource:'jr-east-operator-logo',
      assetSource:'local',
      assetSourceUrl:'./data/operators/jr-east/logo.svg'
    };
    route.officialSymbolExists=false;
    fallback++;
  }

  window.TRT_JR_EAST_RUNTIME={coded,fallback,officialCodes:[...officialCodes]};
})();
