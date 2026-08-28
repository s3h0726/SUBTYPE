#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const categories=['jr','subway','private','other','shinkansen'];
const routes=categories.flatMap(category=>read(`data/lines/${category}.json`).routes);
const master=read('data/stations/tokyo-stations.json').stations;
const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message)};

for(const route of routes){
 const ids=route.stations.map(station=>station.stationMasterId||station.id);
 check(Array.isArray(route.stationSequence),`${route.id}: stationSequence missing`);
 check(JSON.stringify(ids)===JSON.stringify(route.stationSequence),`${route.id}: stationSequence differs from playable order`);
 check(route.geometry?.length>1,`${route.id}: geometry missing`);
 for(let index=1;index<route.stations.length;index++)check(route.stations[index].geometryIndex>=route.stations[index-1].geometryIndex,`${route.id}: geometry order reverses at ${index}`);
}

const graph=new Map();
const node=(key,station)=>{if(!graph.has(key))graph.set(key,{station,edges:[]});return graph.get(key)};
for(const route of routes){
 for(let index=0;index<route.stations.length-1;index++){
  const a=route.stations[index],b=route.stations[index+1],ak=a.stationMasterId||a.id,bk=b.stationMasterId||b.id;
  node(ak,a).edges.push({to:bk,routeId:route.id});
  node(bk,b).edges.push({to:ak,routeId:route.id});
 }
}
const shinjuku=master.find(station=>station.ja==='新宿'&&station.lines?.length>5);
const nearbyEdges=[];
for(const value of graph.values()){
 if(value.station.ja!==shinjuku?.ja)continue;
 const lat=Number(value.station.latitude)-Number(shinjuku.latitude),lon=Number(value.station.longitude)-Number(shinjuku.longitude);
 if(Math.hypot(lat,lon)<=0.008)nearbyEdges.push(...value.edges);
}
const shinjukuLines=new Set(nearbyEdges.map(edge=>edge.routeId));
check(!!shinjuku,'canonical Shinjuku station missing');
check(shinjukuLines.size>=10,`Shinjuku graph exposes only ${shinjukuLines.size} lines`);
check([...graph.values()].some(value=>new Set(value.edges.map(edge=>edge.routeId)).size>1),'no transfer nodes found');

(async()=>{
 const source=fs.readFileSync(path.join(root,'js/statistics-engine.js'),'utf8');
 const module=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
 const perfect=new module.TypingStatistics(0);perfect.observe({value:'신주쿠',state:'correct'});perfect.complete('신주쿠');
 check(perfect.metrics(60000).accuracy===100,'perfect typing accuracy is not 100%');
 const corrected=new module.TypingStatistics(0);corrected.observe({value:'신주각',state:'wrong'});corrected.observe({value:'신주',state:'correct'});corrected.observe({value:'신주쿠',state:'correct'});corrected.complete('신주쿠');
 const metrics=corrected.metrics(60000);
 check(metrics.mistakeUnits===1,'one corrected typo was not counted exactly once');
 check(metrics.accuracy<100,'corrected typo incorrectly reports 100%');
 const quality=read('data/QUALITY_AUDIT.json'),symbols=read('data/LINE_SYMBOL_AUDIT.json');
 console.log(JSON.stringify({routes:routes.length,stationSequence:'PASS',geometryOrder:'PASS',transferNodes:[...graph.values()].filter(value=>new Set(value.edges.map(edge=>edge.routeId)).size>1).length,shinjukuAvailableLines:shinjukuLines.size,accuracy:{perfect:100,corrected:+metrics.accuracy.toFixed(2),mistakes:metrics.mistakeUnits},duplicateRoutes:quality.duplicateRoutes.length,reviewRequired:quality.unlocalizedOrReviewRequired,symbolsApplied:symbols.applied,symbolsPending:symbols.officialRouteCodeExists-symbols.applied,failures},null,2));
 if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
