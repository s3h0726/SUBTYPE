#!/usr/bin/env node
/* Preserve actual OpenStreetMap-based Line 1 routes across build:data rebuilds. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ids=['kr-metro-1-main','kr-metro-1-gyeongin','kr-metro-1-gyeongbu','kr-metro-1-gwangmyeong','kr-metro-1-seodongtan'];
const file='data/kr/generated/index.json',index=read(file);
const metas=ids.map(id=>{
 const route=read('data/kr/generated/routes/'+id+'.json').route;
 if(route.geometryStatus!=='ready'||route.directions?.length!==2||route.geometry?.length<2)throw Error(id+': invalid verified track data');
 return {id:route.id,countryId:route.countryId,mode:route.mode,category:route.category,operatorId:route.operatorId,operator:route.operator,operators:route.operators,names:route.names,line:route.line,code:route.code,color:route.color,lineColor:route.lineColor,loop:false,geometryStatus:'ready',geometryReady:true,sourceStatus:route.sourceStatus,source:route.source,lazy:true,lazySource:'data/kr/generated/routes/'+id+'.json',stationCount:route.stations.length,directionCount:2,searchStations:route.stations.map(s=>s.ko),operatorIds:route.operatorIds,passengerLineId:'kr-passenger-metro-1',passengerLineName:'수도권 전철 1호선',releaseStatus:route.releaseStatus,serviceValidationStatus:route.serviceValidationStatus};
});
index.routes=[...metas,...(index.routes||[]).filter(route=>!ids.includes(route.id))];
index.operators=index.operators||[];
if(!index.operators.some(op=>op.id==='kr-korail'))index.operators.push({id:'kr-korail',countryId:'kr',names:{ko:'한국철도공사',en:'Korail'},modes:['commuter_rail']});
index.counts={...(index.counts||{}),routes:index.routes.length,operators:index.operators.length,stops:index.routes.reduce((sum,r)=>sum+(r.stationCount||0),0)};
fs.writeFileSync(path.join(root,file),JSON.stringify(index));
fs.writeFileSync(path.join(root,'js/korea-index-data.js'),'/* OSM-verified Korean railway routes. */\nwindow.TRT_KOREA_INDEX='+JSON.stringify(index)+';\n');
console.log('Line 1 registered:',ids.length,'sections');
