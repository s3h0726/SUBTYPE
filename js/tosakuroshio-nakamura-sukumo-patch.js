/* SUBTYPE: public Nakamura–Sukumo passenger line is one card.
 * The two canonical physical line IDs remain available for historical
 * references, but the browser hydrates this verified 22-station through route.
 * Not an auto-generated catalog: survives nationwide catalog rebuilds.
 */
(()=>{
 'use strict';
 const parentId='line-99814',legacyId='line-99815';
 const routeSource='./data/route-overrides/tosakuroshio-nakamura-sukumo.json?v=20261029';
 function update(rows){
   if(!Array.isArray(rows))return;
   const parent=rows.find(r=>r?.id===parentId);
   const branch=rows.find(r=>r?.id===legacyId);
   if(!parent||!branch){console.error('Tosa Kuroshio merge: both physical sections required');return}
   parent.line={...(parent.line||{}),ja:'中村・宿毛線',ko:'나카무라·스쿠모선',en:'Nakamura–Sukumo Line',kana:'なかむら・すくもせん'};
   parent.stationCount=22;
   parent.lazySource=routeSource;
   parent.geometryReady=true;
   parent.playable=true;
   parent.searchStations=[...(parent.searchStations||[]),...(branch.searchStations||[]).slice(2)];
   parent.sourcePhysicalRouteIds=[parentId,legacyId];
   branch.parentLineId=parentId;
   branch.legacyRouteAliasFor=parentId;
   branch.visibility='internal';
   branch.playable=false;
 }
 update(globalThis.TRT_JAPAN_LITE_INDEX?.routes);
 update(globalThis.TRT_EMBEDDED_NATIONWIDE?.index?.routes);
})();