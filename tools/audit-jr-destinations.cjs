#!/usr/bin/env node
'use strict';
// Every JR passenger operator, current deployed card, and TrainLCD historical
// service destination. Static checks only; not timetable or browser approval.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const unpack=(file,key)=>JSON.parse(read(file).split(key)[1].trim().replace(/;\s*$/,''));
const lite=unpack('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=');
const catalog=unpack('js/nationwide-service-catalog.js','window.TRT_NATIONWIDE_SERVICE_CATALOG=');
const companies=['jr-east','jr-central','jr-west','jr-hokkaido','jr-shikoku','jr-kyushu'];
const jr=lite.routes.filter(r=>companies.includes(r.operatorId));
const byId=new Map(lite.routes.map(r=>[r.id,r]));
const stationNames=r=>(r.searchStations||[]).filter((_,i)=>i%2===0);
function splitLegacyJrSegments(pattern){
  return(pattern?.segments||[]).flatMap(segment=>{
    const stops=segment.stations||[],at=name=>stops.findIndex(stop=>stop[0]===name);
    if(String(segment.lineCode)==='11502'){
      const pivot=at('豊橋');
      if(pivot>0&&pivot<stops.length-1)return [
        {...segment,lineCode:'11501',stations:stops.slice(0,pivot+1)},
        {...segment,lineCode:'11502',stations:stops.slice(pivot)}];
    }
    if(String(segment.lineCode)==='11503'&&at('美濃赤坂')>=0){
      const pivot=at('大垣');
      if(pivot>0&&pivot<stops.length-1)return [
        {...segment,lineCode:'11503',stations:stops.slice(0,pivot+1)},
        {...segment,lineCode:'11503',stations:stops.slice(pivot)}];
    }
    return[segment];
  });
}
const auditSegment=segment=>{
  const code=String(segment.lineCode),needed=(segment.stations||[]).map(s=>s[0]);
  const candidates=[byId.get('line-'+code),...(code==='11503'?[byId.get('line-jr-central-minoakasaka')]:[])].filter(Boolean);
  if(!candidates.length)return{code,status:'NO_ROUTE',origin:needed[0],destination:needed.at(-1)};
  const candidatesWithOrders=candidates.map(card=>{
    const names=stationNames(card),positions=needed.map(name=>names.indexOf(name));
    const missing=needed.filter((_,i)=>positions[i]<0);
    const order=positions.every((p,i)=>i===0||p>positions[i-1])||positions.every((p,i)=>i===0||p<positions[i-1]);
    return{card,missing,order,positions};
  });
  const exact=candidatesWithOrders.find(x=>!x.missing.length&&x.order);
  if(exact){
    if(exact.card.geometryReady===false||exact.card.playable===false)return{code,status:'TRACK_BLOCKED',routeId:exact.card.id,origin:needed[0],destination:needed.at(-1)};
    return{code,status:'STATIC_MATCH',routeId:exact.card.id,origin:needed[0],destination:needed.at(-1)};
  }
  const best=candidatesWithOrders.sort((a,b)=>a.missing.length-b.missing.length)[0];
  return{code,status:best.missing.length?'MISSING_STATIONS':'WRONG_ORDER',
    routeId:best.card.id,missing:best.missing.slice(0,20),
    missingTotal:best.missing.length,origin:needed[0],destination:needed.at(-1)};
};
const byCompany=Object.fromEntries(companies.map(id=>[id,{cards:0,patterns:0,staticMatch:0,blocked:0,missingStations:0,wrongOrder:0,noRoute:0,trackBlocked:0}]));
const patterns=[];
for(const card of jr){
  const group=byCompany[card.operatorId];group.cards++;
  const code=card.id.match(/^line-(\d+)$/)?.[1];
  if(!code)continue;
  for(const pattern of catalog.lines[code]?.patterns||[]){
    group.patterns++;
    const segments=splitLegacyJrSegments(pattern).map(auditSegment),problems=segments.filter(s=>s.status!=='STATIC_MATCH');
    const status=problems.length?'NEEDS_REPAIR':'STATIC_MATCH';
    group[problems.length?'blocked':'staticMatch']++;
    for(const issue of problems){
      if(issue.status==='MISSING_STATIONS')group.missingStations++;
      if(issue.status==='WRONG_ORDER')group.wrongOrder++;
      if(issue.status==='NO_ROUTE')group.noRoute++;
      if(issue.status==='TRACK_BLOCKED')group.trackBlocked++;
    }
    patterns.push({operatorId:card.operatorId,cardId:card.id,cardName:card.line?.ko||'',
      patternId:String(pattern.id),trainType:pattern.type?.ko||pattern.type?.ja||'',
      origin:segments[0]?.origin||'',destination:segments.at(-1)?.destination||'',status,
      problems,segments:problems.length?segments:undefined});
  }
}
const total=patterns.length,blocked=patterns.filter(p=>p.status!=='STATIC_MATCH').length;
const report={schemaVersion:1,generated:new Date().toISOString(),
  source:{name:'TrainLCD/StationAPI',snapshot:catalog.source?.retrieved,railCards:'js/japan-lite-index.js'},
  notice:'STATIC_MATCH means station coverage/order only. Timetables, closures, actual train operations and browser playthrough remain unverified. Never auto-enable failed patterns.',
  totalJRcards:jr.length,totalPatterns:total,staticMatch:total-blocked,needsRepair:blocked,byCompany,patterns};
if(jr.length<220||total<850)throw Error('JR audit inventory unexpectedly incomplete: '+jr.length+'/'+total);
const folder=path.join(root,'reports/jr');fs.mkdirSync(folder,{recursive:true});
fs.writeFileSync(path.join(folder,'destination-audit.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(folder,'destination-audit.md'),
  '# JR 6개사 행선지 점검\n\n'
  +'게임 카드는 전체 6개 JR 여객회사 기준입니다. 정차역 및 구간 순서의 정적 대조 결과로, 실제 시간표 승인/게임 완주 검증은 아닙니다.\n\n'
  +'| 운영사 | 노선 카드 | 연결 패턴 | 정적 일치 | 보수 필요 |\n|---|---:|---:|---:|---:|\n'
  +companies.map(id=>{const x=byCompany[id];return '| '+id+' | '+x.cards+' | '+x.patterns+' | '+x.staticMatch+' | '+x.blocked+' |'}).join('\n')
  +'\n\n'+'상세 오류: [destination-audit.json](./destination-audit.json). 출처 구버전의 폐역/운행 종료 패턴은 현행 운행으로 자동 승인하지 않습니다.\n');
console.log(JSON.stringify({cards:jr.length,patterns:total,staticMatch:total-blocked,needsRepair:blocked,byCompany},null,2));
