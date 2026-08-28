#!/usr/bin/env node
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
(async()=>{
  const moduleSource=fs.readFileSync(path.join(root,'js','route-integrity.js'),'utf8'),integrity=await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`),index=read('data/nationwide/index.json'),curatedFiles=['jr','subway','private','other','shinkansen'],byId=new Map;
  for(const meta of index.routes){const route=read(meta.lazySource.replace(/^\.\//,'')).route;byId.set(route.id,route)}
  for(const name of curatedFiles)for(const route of read(`data/lines/${name}.json`).routes||[])byId.set(route.id,route);
  const rows=[],totals={routes:byId.size,passed:0,blocked:0,stations:0,forwardSegments:0,reverseSegments:0,missingStations:0,missingSegments:0,endpointMismatch:0,reverseOrderMismatch:0,defaultServiceSkips:0};
  for(const route of byId.values()){
    const stationIds=(route.stations||[]).map(station=>String(station.id)),unknownStops=[];for(const service of route.services||[])for(const stop of service.stops||[])if(!stationIds.includes(String(stop)))unknownStops.push(String(stop));
    const report=integrity.auditRouteIntegrity(route),reverseExpected=stationIds.slice().reverse(),reverseActual=report.reverseOrder.map(station=>station.id),reverseOrderMismatch=reverseActual.length===stationIds.length&&JSON.stringify(reverseExpected)!==JSON.stringify(reverseActual),local=(route.services||[]).find(service=>service.id==='local'),defaultServiceSkips=!!local&&(local.stops||[]).length!==stationIds.length;
    if(unknownStops.length)report.errors.push(`unknown service stops: ${unknownStops.join(', ')}`);if(defaultServiceSkips)report.errors.push('local/default service does not include all stations');if(reverseOrderMismatch)report.errors.push('reverse order mismatch');report.pass=report.errors.length===0;
    const row={routeId:route.id,lineJa:route.line?.ja||'',lineKo:route.line?.ko||'',stations:stationIds.length,forwardSegments:report.forwardSegments,reverseSegments:report.reverseSegments,missingSegments:report.missingSegments,endpointMismatch:report.geometryEndpointMismatch,reverseOrderMismatch,defaultServiceSkips,errors:report.errors,warnings:report.warnings,pass:report.pass};rows.push(row);
    totals.stations+=row.stations;totals.forwardSegments+=row.forwardSegments;totals.reverseSegments+=row.reverseSegments;totals.missingSegments+=row.missingSegments;totals.endpointMismatch+=row.endpointMismatch;totals.reverseOrderMismatch+=Number(reverseOrderMismatch);totals.defaultServiceSkips+=Number(defaultServiceSkips);totals[row.pass?'passed':'blocked']++;
  }
  const report={generated:new Date().toISOString(),status:totals.blocked?'BLOCKED_WITH_EXPLICIT_DATA_GAPS':'PASS',totals,blockedRoutes:rows.filter(row=>!row.pass),routes:rows};fs.writeFileSync(path.join(root,'data','nationwide','ROUTE_INTEGRITY_AUDIT.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,totals,blockedRoutes:report.blockedRoutes.slice(0,20)},null,2));
  if(totals.reverseOrderMismatch||totals.defaultServiceSkips)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
