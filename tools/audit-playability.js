#!/usr/bin/env node
const path=require('path');
const{loadAll,projectRoot,writeAtomic}=require('./lib/line-workspaces');

(async()=>{
  const moduleText=require('fs').readFileSync(path.join(projectRoot,'js','route-integrity.js'),'utf8');
  const integrity=await import(`data:text/javascript;base64,${Buffer.from(moduleText).toString('base64')}`);
  const data=loadAll(),blocked=[],playable=[];let skippedStations=0,reverseErrors=0;
  for(const route of data.routes){
    try{
      const forward=integrity.resolvePlayableRoute(route,{direction:'forward'});
      const reverse=integrity.resolvePlayableRoute(route,{direction:'reverse'}),expected=route.stations.map(station=>String(station.id));
      if(JSON.stringify(forward.stations.map(station=>String(station.id)))!==JSON.stringify(expected))throw new Error(`${route.id}: forward station sequence mismatch`);
      if(JSON.stringify(reverse.stations.map(station=>String(station.id)))!==JSON.stringify(expected.slice().reverse()))throw new Error(`${route.id}: reverse station sequence mismatch`);
      playable.push({id:route.id,stations:route.stations.length,forwardSegments:forward.segments.length,reverseSegments:reverse.segments.length,reusedSegments:route.reusedSegments||[]});
    }catch(error){const message=error.message||String(error);if(/sequence mismatch/.test(message)){if(/reverse/.test(message))reverseErrors++;else skippedStations++}blocked.push({id:route.id,lineJa:route.line.ja,lineKo:route.line.ko,stations:route.stations.length,missingSegments:route.missingSegments||[],error:message})}
  }
  const report={generated:new Date().toISOString(),status:blocked.length?'INCOMPLETE_GEOMETRY':'PASS',totals:{lines:data.routes.length,playable:playable.length,blocked:blocked.length,geometryReady:data.routes.filter(route=>route.geometryReady).length,reusedGeometrySegments:data.routes.reduce((count,route)=>count+(route.reusedSegments?.length||0),0),skippedStations,reverseErrors},blocked,playable};
  writeAtomic(path.join(projectRoot,'data','source-audit','PLAYABILITY_AUDIT.json'),report);
  console.log(JSON.stringify({status:report.status,totals:report.totals,blocked:blocked.map(row=>({id:row.id,lineJa:row.lineJa,missing:row.missingSegments.length,error:row.error}))},null,2));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
