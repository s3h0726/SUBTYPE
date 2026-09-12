window.TRT_LINE_BADGES={"verifiedDate":"2026-08-22","operatorStyles":{"op-2":{"style":"jr","source":"https://www.jreast.co.jp/en/multi/downloads/"},"op-3":{"style":"jr-central","source":"https://railway.jr-central.co.jp/route-map/"},"op-18":{"style":"metro","source":"https://www.tokyometro.jp/lang_en/station/index.html"},"op-119":{"style":"toei","source":"https://www.kotsu.metro.tokyo.jp/eng/maps/"},"op-16":{"style":"tokyu","source":"https://www.tokyu.co.jp/railway/map/"},"op-15":{"style":"odakyu","source":"https://www.odakyu.jp/station/"},"op-14":{"style":"keio","source":"https://www.keio.co.jp/global/howto/railwaymap/"},"op-12":{"style":"seibu","source":"https://www.seiburailway.jp/railway/station/"},"op-11":{"style":"tobu","source":"https://www.tobu.co.jp/en/service/route.html"},"op-17":{"style":"keikyu","source":"https://www.keikyu.co.jp/ride/kakueki/"},"op-13":{"style":"keisei","source":"https://www.keisei.co.jp/keisei/tetudou/skyliner/us/access/vmap/facility.php"}},"routeCodes":{"line-11301":"JT","line-11302":"JY","line-11303":"JN","line-11305":"JM","line-11306":"JH","line-11307":"JK","line-11308":"JO","line-11311":"JC","line-11312":"JC","line-11313":"JB","line-11314":"JO","line-11315":"JC","line-11316":"JC","line-11319":"JU","line-11320":"JJ","line-11321":"JA","line-11322":"JA","line-11323":"JU","line-11326":"JE","line-11328":"N'EX","line-11332":"JK","line-11333":"JS","line-11343":"JU","line-21001":"TJ","line-21002":"TS","line-21005":"TS","line-21006":"TS","line-22001":"SI","line-22003":"SI","line-22004":"SI","line-22006":"SY","line-22007":"SS","line-22008":"SS","line-22009":"SK","line-22010":"SK","line-22011":"ST","line-22012":"SW","line-23001":"KS","line-23002":"KS","line-23003":"KS","line-23006":"KS","line-24001":"KO","line-24002":"KO","line-24003":"KO","line-24004":"KO","line-24005":"KO","line-24006":"IN","line-24007":"KO","line-25001":"OH","line-25002":"OE","line-25003":"OT","line-26001":"TY","line-26002":"MG","line-26003":"DT","line-26004":"OM","line-26005":"IK","line-26006":"TM","line-26007":"SG","line-27001":"KK","line-27002":"KK","line-99307":"SR","line-99309":"TX","line-99311":"U","line-99316":"B","line-99334":"TT","line-99336":"MO","line-99337":"R","line-99340":"HS","line-99343":"G"}};

/* Temporary runtime bridge for Yokohama Municipal Subway assets.
   Canonical logo/symbol files already exist, but the checked-in generated workspace
   bundle predates those assets. Patch the embedded bundle before app.bundle boots. */
(()=>{
  const data=window.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data)return;
  data.assets=data.assets||{};
  data.assets.operators=data.assets.operators||{};
  data.assets.lines=data.assets.lines||{};

  const operatorAsset={
    asset:'./data/operators/yokohama-municipal-subway/logo.svg?v=707ec20d1113',
    file:'./data/operators/yokohama-municipal-subway/logo.svg',
    version:'707ec20d1113',
    exists:true,
    verified:true,
    source:'',
    officialExists:true
  };
  const blueAsset={
    asset:'./data/lines/yokohama-municipal-subway/blue-line/symbol.svg?v=8aa3d4070127',
    file:'./data/lines/yokohama-municipal-subway/blue-line/symbol.svg',
    version:'8aa3d4070127',
    exists:true,
    verified:true,
    source:'',
    officialExists:true
  };
  const greenAsset={
    asset:'./data/lines/yokohama-municipal-subway/green-line/symbol.svg?v=3d3eed0f9eca',
    file:'./data/lines/yokohama-municipal-subway/green-line/symbol.svg',
    version:'3d3eed0f9eca',
    exists:true,
    verified:true,
    source:'',
    officialExists:true
  };

  data.assets.operators['yokohama-municipal-subway']=operatorAsset;
  data.assets.lines['line-99316']=blueAsset;
  data.assets.lines['line-99343']=greenAsset;

  for(const route of data.routes||[]){
    if(route.operatorId==='yokohama-municipal-subway') route.operatorAsset=operatorAsset;
    if(route.id==='line-99316'){
      route.symbolAsset=blueAsset;
      route.symbolMeta={...(route.symbolMeta||{}),asset:'./symbol.svg',officialSymbolExists:true,verified:true};
      route.officialSymbolExists=true;
    }
    if(route.id==='line-99343'){
      route.symbolAsset=greenAsset;
      route.symbolMeta={...(route.symbolMeta||{}),asset:'./symbol.svg',officialSymbolExists:true,verified:true};
      route.officialSymbolExists=true;
    }
  }
})();
