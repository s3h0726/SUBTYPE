#!/usr/bin/env node
'use strict';
/* Publish canonically preserved actual 3호선 railway alignment. No fabricated geometry. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const file=p=>path.join(root,p);
const source='data/kr/source/routes/kr-metro-3.json';
const destination='data/kr/generated/routes/kr-metro-3.json';
const indexPath='data/kr/generated/index.json';
const route=JSON.parse(fs.readFileSync(file(source),'utf8')).route;
const eq=(a,b)=>a?.length===2&&b?.length===2&&Math.abs(a[0]-b[0])<1e-7&&Math.abs(a[1]-b[1])<1e-7;
if(route.id!=='kr-metro-3'||!route.geometryReady||route.stations.length!==44||route.directedSegments.length!==43||route.directions.length!==2)
  throw Error('3호선 canonical geometry is not complete');
for(const d of route.directions){
  if(d.stops.length!==44||d.directedSegments.length!==43||d.geometry.length!==route.geometry.length)
    throw Error('3호선 '+d.id+' station or geometry count mismatch');
  for(let i=0;i<43;i++){
    const seg=d.directedSegments[i],from=d.stops[i],to=d.stops[i+1],points=seg.geometry;
    if(seg.fromStationId!==from.id||seg.toStationId!==to.id||points.length<2||
      !eq(points[0],d.geometry[from.geometryIndex])||!eq(points.at(-1),d.geometry[to.geometryIndex])||
      seg.source?.geometryDataset!=='matassp-seoul-isochrone-lines-geojson'||seg.source?.license!=='ODbL-1.0'||
      (i>0&&!eq(d.directedSegments[i-1].geometry.at(-1),points[0])))
      throw Error('3호선 broken or unsourced track: '+d.id+'/'+i);
  }
}
fs.writeFileSync(file(destination),JSON.stringify({schemaVersion:1,countryId:'kr',route}));
const idx=JSON.parse(fs.readFileSync(file(indexPath),'utf8'));
const meta={
 id:route.id,countryId:'kr',mode:'subway',category:'subway',
 operatorId:route.operatorId,operator:route.operator,operators:route.operators,operatorIds:route.operatorIds,
 names:route.names,line:route.line,code:route.code,color:route.color,lineColor:route.lineColor,loop:false,
 geometryStatus:'ready',geometryReady:true,sourceStatus:route.sourceStatus,source:route.source,
 lazy:true,lazySource:destination,stationCount:route.stations.length,directionCount:route.directions.length,
 searchStations:route.stations.map(s=>s.ko),passengerLineId:route.passengerLineId,passengerLineName:route.passengerLineName,
 releaseStatus:route.releaseStatus,serviceValidationStatus:route.serviceValidationStatus
};
idx.routes=[...(idx.routes||[]).filter(r=>r.id!==route.id),meta];
idx.counts={...(idx.counts||{}),routes:idx.routes.length,operators:idx.operators.length,
 stops:idx.routes.reduce((n,r)=>n+(r.stationCount||0),0)};
fs.writeFileSync(file(indexPath),JSON.stringify(idx));
fs.writeFileSync(file('js/korea-index-data.js'),'/* Korean transport routes; includes OSM-derived Line 3. */\nwindow.TRT_KOREA_INDEX='+JSON.stringify(idx)+';\n');
console.log('Line 3 PUBLISHED: 44 stops, 43 real OSM derived segments, 2 directions, '+route.geometry.length+' points');
