/* Split Meitetsu Mikawa Line at Chiryu into operating sectors:
 * Sea (MU, Chiryu–Hekinan) / Mountain (MY, Chiryu–Sanage).
 * The original 23-station physical source is preserved for legacy references.
 * This runtime patch survives generated japan-lite-index.js catalog rebuilds.
 */
(()=>{
 'use strict';
 const sourceId='line-30005',paths={
   umi:'./data/route-overrides/meitetsu-mikawa-umi.json?v=20261029-mikawa-split',
   yama:'./data/route-overrides/meitetsu-mikawa-yama.json?v=20261029-mikawa-split'
 };
 function split(rows){
   if(!Array.isArray(rows))return;
   const source=rows.find(r=>r?.id===sourceId);
   if(!source){console.error('Meitetsu Mikawa Line split: source route missing');return}
   const copies=[
     {id:'line-30005-yama',tag:'yama',ja:'名鉄三河線（山線）',ko:'메이테츠 미카와선(산선)',en:'Meitetsu Mikawa Line (Mountain Section)',kana:'めいてつみかわせん（やません）',start:11,end:23},
     {id:'line-30005-umi',tag:'umi',ja:'名鉄三河線（海線）',ko:'메이테츠 미카와선(해선)',en:'Meitetsu Mikawa Line (Sea Section)',kana:'めいてつみかわせん（うみせん）',start:0,end:12}
   ];
   const stations=source.searchStations||[];
   source.visibility='internal';
   source.playable=false;
   source.legacyFullRoute=true;
   for(const item of copies){
     if(rows.some(r=>r?.id===item.id))continue;
     const searchStations=stations.slice(item.start*2,item.end*2);
     const areaNames=item.tag==='umi'?[...searchStations].reverse():searchStations;
     const card={...source,
       id:item.id,line:{...source.line,ja:item.ja,ko:item.ko,en:item.en,kana:item.kana},
       lazySource:paths[item.tag],
       visibility:'public',playable:true,geometryReady:true,stationCount:12,
       searchStations:areaNames,sourcePhysicalRouteId:sourceId,sectionType:item.tag,
       code:item.tag==='yama'?'MY':'MU'
     };
     rows.push(card);
   }
 }
 split(globalThis.TRT_JAPAN_LITE_INDEX?.routes);
 split(globalThis.TRT_EMBEDDED_NATIONWIDE?.index?.routes);
})();