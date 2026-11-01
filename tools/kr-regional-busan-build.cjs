#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{validateRoute,korean,distance}=require('./lib/kr-canonical.cjs');
const dir=path.resolve(__dirname,'../data/kr/canonical/regional-busan-source'),out=path.dirname(dir),base='http://bus.busan.go.kr/busanBIMS/';
const village=process.argv.includes('--village'),stem=village?'regional-busan-village':'regional-busan';
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const parse=(t,tag)=>[...t.matchAll(new RegExp('<'+tag+'\\s+([^>]+)/>','g'))].map(m=>Object.fromEntries([...m[1].matchAll(/(\w+)=["']([^"']*)["']/g)].map(m=>[m[1],m[2].replaceAll('&amp;','&').replaceAll('&quot;','"')])));
const read=f=>fs.readFileSync(path.join(dir,f),'utf8');
// Preserve official identities verbatim in sourceName. The Korean typing game
// spells embedded Latin initialisms with letter names, without guessing a new
// place or expanding an abbreviation into a different landmark.
const letters=['에이','비','씨','디','이','에프','지','에이치','아이','제이','케이','엘','엠','엔','오','피','큐','알','에스','티','유','브이','더블유','엑스','와이','제트'];
const hangul=value=>value.replace(/[A-Za-z]/g,c=>letters[c.toUpperCase().charCodeAt(0)-65]);
function bind(stops,geometry){
 const scale=[111195,Math.cos(35.2*Math.PI/180)*111195];let previous=[];
 for(const [si,s]of stops.entries()){
  const candidates=[];
  for(let i=0;i<geometry.length-1;i++){
   const a=geometry[i],b=geometry[i+1],dx=(b[0]-a[0])*scale[0],dy=(b[1]-a[1])*scale[1],px=(s.latitude-a[0])*scale[0],py=(s.longitude-a[1])*scale[1],len=dx*dx+dy*dy;
   const t=len?Math.max(0,Math.min(1,(px*dx+py*dy)/len)):0,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],m=distance(p,[s.latitude,s.longitude])*1000;
   if(m<=150)candidates.push({pos:i+t,p,m,cost:Infinity});
  }
  candidates.sort((a,b)=>a.pos-b.pos);
  if(!candidates.length)throw Error('정류소의 실제 도로 연결 미확인: '+s.ko);
  let pi=0,best;
  for(const c of candidates){if(!si){c.cost=c.m*c.m+c.pos*.001;continue}while(pi<previous.length&&previous[pi].pos<c.pos-1e-7){if(!best||previous[pi].cost<best.cost)best=previous[pi];pi++}if(best){c.prev=best;c.cost=best.cost+c.m*c.m}}
  previous=candidates.filter(c=>Number.isFinite(c.cost));
  if(!previous.length)throw Error('공식 정차 순서와 도로 순서 불일치: '+s.ko);
 }
 let best=previous.reduce((a,b)=>a.cost<b.cost?a:b),bindings=[];while(best){bindings.unshift(best);best=best.prev}return bindings;
}
function journey(routeId,stops,bindings,full,di){
 const first=bindings[0].pos,last=bindings.at(-1).pos;
 const points=[...full.map((p,i)=>({pos:i,p})).filter(x=>x.pos>first&&x.pos<last),...bindings.map((b,i)=>({pos:b.pos,p:b.p,stop:i}))].sort((a,b)=>a.pos-b.pos);
 const geometry=[],indices=[];for(const x of points){if(!geometry.length||JSON.stringify(geometry.at(-1))!==JSON.stringify(x.p))geometry.push(x.p);if(x.stop!==undefined)indices[x.stop]=geometry.length-1}
 const stations=stops.map((s,i)=>({...s,ja:s.ko,kana:s.ko,romaji:s.ko,geometryIndex:indices[i],sourceRef:{url:base+'Ajax/busLineList.asp?optBusNum='+routeId,sourceStopId:s.sourceStopId},stopOffsetMeters:Math.round(bindings[i].m*100)/100}));
 const id='kr-bus-busan-'+routeId+'-'+di,nameKo=stations.at(-1).ko+' 방면';
 return{id,patternId:'kr-bus-busan-'+routeId,patternName:{ko:nameKo},directionId:di,tripIds:[routeId+':'+di],stations,geometry,directedSegments:stations.slice(1).map((s,i)=>({fromStationId:stations[i].id,toStationId:s.id,geometry:geometry.slice(stations[i].geometryIndex,s.geometryIndex+1)})),service:{id,nameKo,stops:stations.map(s=>s.id)}};
}
const routes=[],queue=[],stats={inventory:0,validGeometryCandidates:0};
for(const row of parse(read(village?'inventory-village.xml':'inventory.xml'),'lineno')){
 stats.inventory++;const key=row.val1;
 try{
  const coords=parse(read('shape-'+key+'.xml'),'coord'),rid=coords[0]?.value1;
  const geometry=coords.slice(1).map(c=>[Number(c.value3),Number(c.value2)]);
  if(geometry.length<2||geometry.some(p=>!p.every(Number.isFinite)||p[0]<32||p[0]>39||p[1]<124||p[1]>132))throw Error('실제 도로 경로 누락');
  if(geometry.some((p,i)=>i&&distance(p,geometry[i-1])>2))throw Error('도로 경로의 원본 간격 초과');
  stats.validGeometryCandidates++;
  const details=parse(read('detail-'+key+'.xml'),'line'),header=details[0];
  const stops=details.slice(2).map(s=>({id:'kr-busan-stop-'+s.value1,sourceStopId:s.value1,arsId:s.text4,sourceName:s.text1,ko:hangul(s.text1),nameRendering:'공식 이름의 영문 글자를 한국어 글자명으로 표기',latitude:Number(s.text3),longitude:Number(s.text2)}));
  if(stops.length<2||stops.some(s=>!s.sourceStopId||!korean(s.ko)))throw Error('한국어 정류소 이름 미확인');
  // The village company endpoint returns the supervising district in text3.
  // Only the route's official detail header text6 identifies its companies.
  const ops=(village?String(header.text6||'').split(/[,·]/):parse(read('operator-'+key+'.xml'),'bus').map(b=>b.text3)).map(o=>o.replaceAll('㈜','').replaceAll('(주)','').trim()).filter(Boolean);
  if(!ops.length||ops.some(o=>!korean(o)))throw Error('공식 한국어 운영사명 미확인');
  if(village&&ops.some(o=>/^(?:부산광역시)?(?:강서|금정|기장|남|동|동래|부산진|북|사상|사하|서|수영|연제|영도|중|해운대)(?:구|군)$/.test(o)))throw Error('관할구 이름을 운영사로 사용할 수 없음');
  const bindings=bind(stops,geometry),dest=hangul(header.text4);
  const turns=stops.map((s,i)=>({s,i})).filter(({s,i})=>i>0&&i<stops.length-1&&s.ko===dest);
  if(turns.length!==1)throw Error('공식 종점명과 회차 정류소의 유일한 일치 미확인: '+dest);
  const turn=turns[0].i;
  const journeys=[journey(rid,stops.slice(0,turn+1),bindings.slice(0,turn+1),geometry,'outbound'),journey(rid,stops.slice(turn),bindings.slice(turn),geometry,'inbound')];
  const op=ops.join('·'),lineKo='부산 '+hangul(header.text1)+'번';
  const sourceRefs=['shape-'+key+'.xml','detail-'+key+'.xml','operator-'+key+'.xml'].map(f=>({url:manifest[f].url,sourceDate:'2026-11-01',license:'부산광역시 공개 버스정보; 사실정보 추출',attribution:'부산광역시 버스정보관리시스템'}));
  const categoryKo=header.text2,mode=/마을/.test(categoryKo)?'village_bus':/급행|좌석/.test(categoryKo)?'express_bus':'bus';
  const route={schemaVersion:2,id:'kr-bus-busan-'+rid,countryId:'kr',regionId:'busan',regionKo:'부산광역시',mode,category:mode==='village_bus'?'village_bus':mode==='express_bus'?'express_bus':'city_bus',categoryKo,line:{ko:lineKo},operator:{ko:op},operatorId:'kr-busan-operator-'+crypto.createHash('sha256').update(op).digest('hex').slice(0,12),operatorNamesKo:ops,routeNumber:header.text1,color:mode==='village_bus'?'#4aa544':mode==='express_bus'?'#ef333b':'#3169b2',releaseStatus:'verified',geometryReady:true,sourceRefs,operationalEvidence:{url:base+'bus_map/map_main.asp?menuNum=2&mapGubun=daum',checkedAt:'2026-11-01',routeId:rid},directionEvidence:{kind:'official-ordered-roundtrip-and-exact-destination-stop',destinationKo:dest,turnStopId:stops[turn].id,turnSequence:turn+1},verifiedJourneys:journeys,stations:journeys[0].stations,geometry:journeys[0].geometry,directedSegments:journeys[0].directedSegments,services:journeys.map(j=>j.service)};
  const errors=validateRoute(route);if(errors.length)throw Error(errors.join('; '));routes.push(route);
 }catch(error){queue.push({routeKey:key,routeNumber:row.val2,regionKo:'부산광역시',blockers:[error.message]})}
}
fs.writeFileSync(path.join(out,stem+'-batch.json'),JSON.stringify({schemaVersion:2,countryId:'kr',routes},null,2)+'\n');
fs.writeFileSync(path.join(out,stem+'-queue.json'),JSON.stringify({schemaVersion:2,candidates:queue},null,2)+'\n');
const report={schemaVersion:2,checkedAt:'2026-11-01',...stats,publicRoutes:routes.length,playableDirections:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),uniqueStops:new Set(routes.flatMap(r=>r.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)))).size,queued:queue.length,reasons:Object.fromEntries([...new Set(queue.map(q=>q.blockers[0]))].map(reason=>[reason,queue.filter(q=>q.blockers[0]===reason).length]))};
fs.writeFileSync(path.join(out,stem+'-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
