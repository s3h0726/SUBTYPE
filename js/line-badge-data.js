window.TRT_LINE_BADGES={"verifiedDate":"2026-09-17","operatorStyles":{"op-2":{"style":"jr","source":"https://www.jreast.co.jp/en/multi/downloads/"},"op-3":{"style":"jr-central","source":"https://railway.jr-central.co.jp/route-map/"},"op-18":{"style":"metro","source":"https://www.tokyometro.jp/lang_en/station/index.html"},"op-119":{"style":"toei","source":"https://www.kotsu.metro.tokyo.jp/eng/maps/"},"op-16":{"style":"tokyu","source":"https://www.tokyu.co.jp/railway/map/"},"op-15":{"style":"odakyu","source":"https://www.odakyu.jp/station/"},"op-14":{"style":"keio","source":"https://www.keio.co.jp/global/howto/railwaymap/"},"op-12":{"style":"seibu","source":"https://www.seiburailway.jp/railway/station/"},"op-11":{"style":"tobu","source":"https://www.tobu.co.jp/en/service/route.html"},"op-17":{"style":"keikyu","source":"https://www.keikyu.co.jp/ride/kakueki/"},"op-13":{"style":"keisei","source":"https://www.keisei.co.jp/keisei/tetudou/skyliner/us/access/vmap/facility.php"}},"routeCodes":{"line-11301":"JT","line-11302":"JY","line-11303":"JN","line-11305":"JM","line-11306":"JH","line-11307":"JK","line-11308":"JO","line-11311":"JC","line-11312":"JC","line-11313":"JB","line-11314":"JO","line-11315":"JC","line-11316":"JC","line-11319":"JU","line-11320":"JJ","line-11321":"JA","line-11322":"JA","line-11323":"JU","line-11326":"JE","line-11328":"N'EX","line-11332":"JK","line-11333":"JS","line-11343":"JU","line-21001":"TJ","line-21002":"TS","line-21005":"TS","line-21006":"TS","line-22001":"SI","line-22003":"SI","line-22004":"SI","line-22006":"SY","line-22007":"SS","line-22008":"SS","line-22009":"SK","line-22010":"SK","line-22011":"ST","line-22012":"SW","line-23001":"KS","line-23002":"KS","line-23003":"KS","line-23006":"KS","line-24001":"KO","line-24002":"KO","line-24003":"KO","line-24004":"KO","line-24005":"KO","line-24006":"IN","line-24007":"KO","line-25001":"OH","line-25002":"OE","line-25003":"OT","line-26001":"TY","line-26002":"MG","line-26003":"DT","line-26004":"OM","line-26005":"IK","line-26006":"TM","line-26007":"SG","line-27001":"KK","line-27002":"KK","line-28001":"G","line-28002":"M","line-28003":"H","line-28004":"T","line-28005":"C","line-28006":"Y","line-28008":"Z","line-28009":"N","line-28010":"F","line-99301":"E","line-99302":"A","line-99303":"I","line-99304":"S","line-99307":"SR","line-99309":"TX","line-99311":"U","line-99316":"B","line-99334":"TT","line-99336":"MO","line-99337":"R","line-99340":"HS","line-99343":"G"}};

/* Runtime asset bridge. Yokohama keeps local canonical assets. Tokyo Metro, Toei and
   JR East line symbols are sourced from Wikimedia Commons file pages. Commons copies
   are provenance-marked and are not claimed to be operator-distributed originals. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};

  const makeAsset=(file,version='20260917')=>({asset:`${file}?v=${version}`,file,version,exists:true,verified:true,source:'',officialExists:true});
  const commonsAsset=(filename)=>{
    const encoded=encodeURIComponent(filename);
    const file=`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}`;
    const source=`https://commons.wikimedia.org/wiki/File:${encoded}`;
    return {asset:file,file,version:'commons-20260917',exists:true,verified:false,source,assetSource:'wikimedia-commons',assetSourceUrl:source,officialExists:true};
  };

  const yokohamaOperator=makeAsset('./data/operators/yokohama-municipal-subway/logo.svg','707ec20d1113');
  const yokohamaLines={
    'line-99316':makeAsset('./data/lines/yokohama-municipal-subway/blue-line/symbol.svg','8aa3d4070127'),
    'line-99343':makeAsset('./data/lines/yokohama-municipal-subway/green-line/symbol.svg','3d3eed0f9eca')
  };
  data.assets.operators['yokohama-municipal-subway']=yokohamaOperator;
  Object.assign(data.assets.lines,yokohamaLines);

  const tokyoMetroOperator=makeAsset('./data/operators/tokyo-metro/logo.svg','2adb037e61b1');
  const tokyoMetroLines={
    'line-28001':commonsAsset('Logo of Tokyo Metro Ginza Line.svg'),
    'line-28002':commonsAsset('Logo of Tokyo Metro Marunouchi Line.svg'),
    'line-28003':commonsAsset('Logo of Tokyo Metro Hibiya Line.svg'),
    'line-28004':commonsAsset('Logo of Tokyo Metro Tōzai Line.svg'),
    'line-28005':commonsAsset('Logo of Tokyo Metro Chiyoda Line.svg'),
    'line-28006':commonsAsset('Logo of Tokyo Metro Yūrakuchō Line.svg'),
    'line-28008':commonsAsset('Logo of Tokyo Metro Hanzōmon Line.svg'),
    'line-28009':commonsAsset('Logo of Tokyo Metro Namboku Line.svg'),
    'line-28010':commonsAsset('Logo of Tokyo Metro Fukutoshin Line.svg')
  };
  data.assets.operators['tokyo-metro']=tokyoMetroOperator;
  Object.assign(data.assets.lines,tokyoMetroLines);

  const jrEastOperator=makeAsset('./data/operators/jr-east/logo.svg','20260917');
  const jrEastLines={
    'line-11301':commonsAsset('JR JT line symbol.svg'),
    'line-11302':commonsAsset('JR JY line symbol.svg'),
    'line-11303':commonsAsset('JR JN line symbol.svg'),
    'line-11305':commonsAsset('JR JM line symbol.svg'),
    'line-11306':commonsAsset('JR JH line symbol.svg'),
    'line-11307':commonsAsset('JR JK line symbol.svg'),
    'line-11308':commonsAsset('JR JO line symbol.svg'),
    'line-11311':commonsAsset('JR JC line symbol.svg'),
    'line-11312':commonsAsset('JR JC line symbol.svg'),
    'line-11313':commonsAsset('JR JB line symbol.svg'),
    'line-11314':commonsAsset('JR JO line symbol.svg'),
    'line-11315':commonsAsset('JR JC line symbol.svg'),
    'line-11316':commonsAsset('JR JC line symbol.svg'),
    'line-11319':commonsAsset('JR JU line symbol.svg'),
    'line-11320':commonsAsset('JR JJ line symbol.svg'),
    'line-11321':commonsAsset('JR JA line symbol.svg'),
    'line-11322':commonsAsset('JR JA line symbol.svg'),
    'line-11323':commonsAsset('JR JU line symbol.svg'),
    'line-11326':commonsAsset('JR JE line symbol.svg'),
    'line-11332':commonsAsset('JR JK line symbol.svg'),
    'line-11333':commonsAsset('JR JS line symbol.svg'),
    'line-11343':commonsAsset('JR JU line symbol.svg')
  };
  data.assets.operators['jr-east']=jrEastOperator;
  Object.assign(data.assets.lines,jrEastLines);

  const toeiOperator=makeAsset('./data/operators/toei/logo.svg','20260913');
  const toeiLines={
    'line-99301':commonsAsset('Toei Oedo line symbol.svg'),
    'line-99302':commonsAsset('Toei Asakusa line symbol.svg'),
    'line-99303':commonsAsset('Toei Mita line symbol.svg'),
    'line-99304':commonsAsset('Toei Shinjuku line symbol.svg')
  };
  data.assets.operators.toei=toeiOperator;
  Object.assign(data.assets.lines,toeiLines);

  for(const route of data.routes||[]){
    if(route.operatorId==='yokohama-municipal-subway') route.operatorAsset=yokohamaOperator;
    if(yokohamaLines[route.id]){
      route.symbolAsset=yokohamaLines[route.id];
      route.symbolMeta={...(route.symbolMeta||{}),asset:'./symbol.svg',officialSymbolExists:true,verified:true};
      route.officialSymbolExists=true;
    }
    if(route.operatorId==='tokyo-metro') route.operatorAsset=tokyoMetroOperator;
    if(tokyoMetroLines[route.id]){
      const asset=tokyoMetroLines[route.id];
      route.symbolAsset=asset;
      route.symbolMeta={...(route.symbolMeta||{}),asset:asset.asset,officialSymbolExists:true,verified:false,identificationSource:'wikimedia-commons',assetSource:'wikimedia-commons',assetSourceUrl:asset.source};
      route.officialSymbolExists=true;
    }
    if(route.operatorId==='jr-east') route.operatorAsset=jrEastOperator;
    if(jrEastLines[route.id]){
      const asset=jrEastLines[route.id];
      route.symbolAsset=asset;
      route.symbolMeta={...(route.symbolMeta||{}),asset:asset.asset,officialSymbolExists:true,verified:false,identificationSource:'wikimedia-commons',assetSource:'wikimedia-commons',assetSourceUrl:asset.source};
      route.officialSymbolExists=true;
    }
    if(route.operatorId==='toei') route.operatorAsset=toeiOperator;
    if(toeiLines[route.id]){
      const asset=toeiLines[route.id];
      route.symbolAsset=asset;
      route.symbolMeta={...(route.symbolMeta||{}),asset:asset.asset,officialSymbolExists:true,verified:false,identificationSource:'wikimedia-commons',assetSource:'wikimedia-commons',assetSourceUrl:asset.source};
      route.officialSymbolExists=true;
    }
  }
})();
