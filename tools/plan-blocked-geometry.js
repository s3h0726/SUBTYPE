#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const{projectRoot,loadAll,writeAtomic}=require('./lib/line-workspaces');

const audit=JSON.parse(fs.readFileSync(path.join(projectRoot,'data','source-audit','PLAYABILITY_AUDIT.json'),'utf8'));
const data=loadAll(),byId=new Map(data.routes.map(route=>[route.id,route]));
const report={generated:new Date().toISOString(),policy:{straightLineFallback:false,sourcePriority:['existing-workspace-segment','OSM railway geometry','MLIT railway spatial data','official/public GIS']},lines:audit.blocked.map(row=>{const route=byId.get(row.id),segments=(row.missingSegments||[]).map(key=>{const[fromStationId,toStationId]=key.split('::'),from=route.stations.find(station=>station.id===fromStationId),to=route.stations.find(station=>station.id===toStationId);return{key,fromStationId,toStationId,from:{ja:from?.ja||'',ko:from?.ko||'',lat:from?.latitude??null,lng:from?.longitude??null},to:{ja:to?.ja||'',ko:to?.ko||'',lat:to?.latitude??null,lng:to?.longitude??null},selfSegment:fromStationId===toStationId}});return{lineId:row.id,operatorId:route?.operatorId||'',lineKo:row.lineKo,lineJa:row.lineJa,stationCount:row.stations,segmentCount:Math.max(0,row.stations-1),missingGeometrySegments:segments,existingReusableSegments:[],externalGeometryRequired:segments.map(segment=>segment.key),status:'EXTERNAL_REAL_GEOMETRY_REQUIRED'}})};
report.summary={lines:report.lines.length,missingSegments:report.lines.reduce((sum,line)=>sum+line.missingGeometrySegments.length,0),selfSegments:report.lines.reduce((sum,line)=>sum+line.missingGeometrySegments.filter(segment=>segment.selfSegment).length,0)};
writeAtomic(path.join(projectRoot,'data','source-audit','BLOCKED_GEOMETRY_PLAN.json'),report);
console.log(JSON.stringify({summary:report.summary,lines:report.lines.map(line=>({lineId:line.lineId,lineJa:line.lineJa,missing:line.missingGeometrySegments.length}))},null,2));
