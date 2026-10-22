/* Disney Resort Line: the only regular passenger movement is a one-way,
 * counter-clockwise four-station loop. Source railway shape is the MLIT
 * N02-2025 railway geometry previously rendered in the national rail SVG;
 * the listed projected vertices below are its ordered, precision-reduced
 * curve, NOT hand-drawn chords between stations.
 * Geographic fit uses four OSM stop positions separately to reverse the SVG
 * view projection. Review required before claiming centimetre accuracy.
 * Direction and names: https://www.tokyodisneyresort.jp/en/tdr/resortline
 * Physical relation for external OSM audit: https://www.openstreetmap.org/relation/9246714
 */
(()=>{
  const componentPaths=[
    [[6071.43,7515.57],[6071.82,7515.95]],
    [[6069.74,7511.22],[6070.72,7511.56],[6071.37,7512.16],[6071.70,7512.49],[6072.01,7512.86],[6072.01,7513.17],[6070.78,7514.49],[6070.75,7514.64],[6070.73,7514.76],[6070.79,7514.95],[6071.43,7515.57]],
    [[6069.14,7510.98],[6069.74,7511.22]],
    [[6071.82,7515.95],[6072.27,7516.39],[6072.28,7516.81],[6072.23,7516.95],[6071.66,7517.56],[6071.23,7518.00],[6071.10,7518.13],[6070.97,7518.21],[6070.81,7518.34],[6070.54,7518.34],[6069.89,7518.15],[6067.32,7517.42],[6067.22,7517.32],[6067.16,7517.21],[6067.12,7517.10],[6067.12,7516.42],[6067.12,7516.23],[6067.02,7516.07],[6066.92,7515.91],[6065.54,7515.47]],
    [[6066.10,7510.75],[6066.51,7510.58]],
    [[6066.51,7510.58],[6066.73,7510.50],[6067.70,7510.75],[6068.41,7511.07],[6069.14,7510.98]],
    [[6065.05,7515.31],[6065.54,7515.47]],
    [[6065.05,7515.31],[6064.69,7515.20],[6064.59,7515.02],[6064.57,7512.85],[6065.17,7511.41],[6065.29,7511.24],[6065.56,7510.98],[6066.10,7510.75]]
  ];
  const directions=[[2,true],[5,true],[4,true],[7,true],[6,false],[3,true],[0,true],[1,true]];
  const pixels=[];
  for(const [partId,reverse] of directions){
    const part=reverse?componentPaths[partId].slice().reverse():componentPaths[partId];
    if(pixels.length&&pixels.at(-1)[0]===part[0][0]&&pixels.at(-1)[1]===part[0][1])pixels.push(...part.slice(1));
    else pixels.push(...part);
  }
  // The first/last station splits the outgoing track at the real station.
  const split=[6069.44,7511.10];
  pixels.splice(0,1,split);pixels.push(split);
  const toGeo=([x,y])=>[
    Number((-0.0016924153271703506*y+48.347108877517776).toFixed(7)),
    Number((0.0020719224571747*x+127.3096424828524).toFixed(7))
  ];
  const geometry=pixels.map(toGeo);
  const stopInfo=[
    {id:'dr-01',ja:'リゾートゲートウェイ・ステーション',kana:'りぞーとげーとうぇい・すてーしょん',ko:'리조트 게이트웨이 스테이션',en:'Resort Gateway Station',lat:35.63524,lon:139.88510,osm:2270963951,geometryIndex:0},
    {id:'dr-02',ja:'東京ディズニーランド・ステーション',kana:'とうきょうでぃずにーらんど・すてーしょん',ko:'도쿄디즈니랜드 스테이션',en:'Tokyo Disneyland Station',lat:35.63593,lon:139.87867,osm:8073893293,geometryIndex:5},
    {id:'dr-03',ja:'ベイサイド・ステーション',kana:'べいさいど・すてーしょん',ko:'베이사이드 스테이션',en:'Bayside Station',lat:35.62786,lon:139.87637,osm:2270963950,geometryIndex:14},
    {id:'dr-04',ja:'東京ディズニーシー・ステーション',kana:'とうきょうでぃずにーしー・すてーしょん',ko:'도쿄디즈니씨 스테이션',en:'Tokyo DisneySea Station',lat:35.62740,lon:139.88952,osm:2270963949,geometryIndex:34},
    {id:'dr-01-return',ja:'リゾートゲートウェイ・ステーション',kana:'りぞーとげーとうぇい・すてーしょん',ko:'리조트 게이트웨이 스테이션',en:'Resort Gateway Station',lat:35.63524,lon:139.88510,osm:2270963951,geometryIndex:geometry.length-1}
  ];
  const stations=stopInfo.map((item,index)=>({
    id:item.id,internalId:item.id,ja:item.ja,kana:item.kana,ko:item.ko,en:item.en,romaji:item.en,
    koVerified:true,koSource:'https://www.tokyodisneyresort.jp/kr/tdr/resortline',
    latitude:item.lat,longitude:item.lon,geometryIndex:item.geometryIndex,
    sourceStationId:'osm-node-'+item.osm,stationMasterId:'disney-'+item.osm,
    stationCode:'',officialCode:'',order:index+1
  }));
  globalThis.TRT_DISNEY_RESORT_ROUTE={
    id:'jp-disney-resort-line',countryId:'jp',category:'other',mode:'monorail',
    operatorId:'maihama-resort-line',operator:{ja:'舞浜リゾートライン',ko:'마이하마 리조트라인',en:'Maihama Resort Line'},
    line:{ja:'ディズニーリゾートライン',ko:'디즈니 리조트라인',en:'Disney Resort Line'},
    code:'DR',lineColor:'#D699B8',loop:true,oneWay:true,
    sourceUrl:'https://www.tokyodisneyresort.jp/en/tdr/resortline',verifiedDate:'2026-10-22',
    geometrySource:'MLIT N02-2025 rail centerline; source SVG rounded to 0.01 SVG units',
    geometryStatus:'reviewed-n02-precision-reduced',geometryReady:true,
    serviceNote:'리조트 게이트웨이 출발, 4역 단방향 순환, 1바퀴 약 13분',
    stations,geometry,
    services:[{id:'disney-loop',nameJa:'環状運転',nameKo:'순환운행',nameEn:'Clockwise? no: counter-clockwise loop',stops:stations.map(s=>s.id)}]
  };
})();
