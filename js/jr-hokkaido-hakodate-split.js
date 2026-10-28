/* JR Hokkaido Hakodate line operating sectors, split at Sapporo.
 * Keep legacy line-11103 only for historic run identity and physical source.
 * New passenger cards are independently playable with verified track geometry.
 */
(()=>{
'use strict';
const sourceId='line-11103',sectorDefs=[
 {id:'line-11103-otaru-sapporo',kind:'west',ja:'函館本線(小樽～札幌)',ko:'하코다테 본선(오타루~삿포로)',en:'Hakodate Main Line (Otaru–Sapporo)',kana:'はこだてほんせん(おたる～さっぽろ)',start:0,end:15},
 {id:'line-11103-sapporo-asahikawa',kind:'east',ja:'函館本線(札幌～旭川)',ko:'하코다테 본선(삿포로~아사히카와)',en:'Hakodate Main Line (Sapporo–Asahikawa)',kana:'はこだてほんせん(さっぽろ～あさひかわ)',start:14,end:41}
];
function patchIndex(index){
 const rows=index?.routes;if(!Array.isArray(rows))return;
 const original=rows.find(r=>r?.id===sourceId);
 if(!original){console.error('Hakodate sector split: missing Otaru–Asahikawa source');return;}
 original.visibility='internal';original.playable=false;original.legacyFullRoute=true;
 const names=original.searchStations||[];
 for(const spec of sectorDefs){
   const section=rows.find(r=>r.id===spec.id);
   const route=section||{...original};
   route.id=spec.id;
   route.line={...original.line,ja:spec.ja,ko:spec.ko,en:spec.en,kana:spec.kana};
   route.lazy=true;route.lazySource='./data/route-overrides/hakodate-'+spec.kind+'.json?v=20261029-sapporo-asahikawa-v1';
   route.visibility='public';route.playable=true;route.geometryReady=true;
   route.stationCount=spec.end-spec.start;
   route.searchStations=names.slice(spec.start*2,spec.end*2);
   if(spec.kind==='east')for(let i=1;i<route.searchStations.length;i+=2){
     if(route.searchStations[i-1]==='厚別')route.searchStations[i]='아쓰베쓰';
     if(route.searchStations[i-1]==='大麻')route.searchStations[i]='오아사';
   }
   route.sourcePhysicalRouteId=sourceId;
   route.sectionType=spec.kind;
   if(!section)rows.push(route);
 }
 const neighbors=index.transferNeighbors;
 if(neighbors&&typeof neighbors==='object'){
   const originalNeighbors=neighbors[sourceId]||[];
   for(const section of sectorDefs){
     const own=new Set([...originalNeighbors,...sectorDefs.filter(x=>x.id!==section.id).map(x=>x.id)]);
     neighbors[section.id]=[...own];
     for(const other of originalNeighbors){
       if(!Array.isArray(neighbors[other]))continue;
       for(const child of sectorDefs)if(!neighbors[other].includes(child.id))neighbors[other].push(child.id);
     }
   }
 }
}
patchIndex(globalThis.TRT_JAPAN_LITE_INDEX);
patchIndex(globalThis.TRT_EMBEDDED_NATIONWIDE?.index);
})();