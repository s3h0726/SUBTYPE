#!/usr/bin/env node
'use strict';
/*
 * JR operating-service audit for all six passenger companies.
 * STATIC_VALID means station order/geometry references are consistent in the
 * source snapshot; it is NOT timetable approval or a successful browser run.
 * Preserve every blocked pattern with the concrete reason for repair.
 */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('js/nationwide-service-catalog.js').split('window.TRT_NATIONWIDE_SERVICE_CATALOG=')[1].trim().replace(/;\s*$/,''));
const names=['jr-east','jr-central','jr-west','jr-hokkaido','jr-shikoku','jr-kyushu'];
const dir=path.join(root,'data/generated/routes');
const routes=fs.readdirSync(dir).filter(name=>name.endsWith('.json')).map(name=>{
  try{return JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')).route}catch(e){return null}
}).filter(Boolean);
const jr=routes.filter(r=>names.includes(r.operatorId)),byId=new Map(routes.map(r=>[r.id,r])),byName=new Map();
for(const r of routes){const key=r.line?.ja;if(key){if(!byName.has(key))byName.set(key,[]);byName.get(key).push(r)}}
const sameCode=(r,code)=>r.id==='line-'+code||r.legacyId==='line-'+code;
function candidates(segment){
  const code=String(segment.lineCode||''),names=segment.stations?.map(s=>String(s[0]))||[];
  const ja=catalog.lines[code]?.ja;
  const matches=routes.filter(r=>sameCode(r,code)||r.line?.ja===ja);
  return matches.map(r=>{
    const sequence=r.stations||[],indices=names.map(n=>sequence.findIndex(s=>s.ja===n));
    const all=indices.every(n=>n>=0),asc=all&&indices.every((v,i)=>!i||v>indices[i-1]),desc=all&&indices.every((v,i)=>!i||v<indices[i-1]);
    const first=indices[0],last=indices.at(-1);
    return {route:r,all,order:asc||desc,first,last,
      missing:names.filter((n,i)=>indices[i]<0),hasGeometry:r.geometryReady===true&&r.playable!==false,
      score:(all?10000:0)+(asc||desc?5000:0)+(r.geometryReady===true?1000:0)-names.filter((n,i)=>indices[i]<0).length*100};
  }).sort((a,b)=>b.score-a.score);
}
const report=[],counts={};
for(const operatorId of names)counts[operatorId]={cards:0,patterns:0,staticValid:0,blocked:0,unmappedSegments:0,missingStation:0,wrongOrder:0,missingGeometry:0,boundaryMismatch:0};
for(const r of jr){
  counts[r.operatorId].cards++;
  const code=String(r.id).match(/^line-(\d+)$/)?.[1];
  for(const p of (code?catalog.lines[code]?.patterns:[])||[]){
    const parts=p.segments||[],problems=[],resolved=[];
    if(!parts.length)problems.push('EMPTY_SEGMENTS');
    for(const [i,s] of parts.entries()){
      if(!Array.isArray(s.stations)||s.stations.length<2){problems.push('NO_STATION_ORDER:'+i);continue}
      const candidatesFor=candidates(s),best=candidatesFor[0];
      if(!best){problems.push('MISSING_LINE:'+String(s.lineCode));continue}
      if(!best.all){problems.push('UNMATCHED_STATIONS:'+s.lineCode+':'+best.missing.slice(0,8).join('|'));continue}
      if(!best.order){problems.push('INVALID_STATION_ORDER:'+s.lineCode);continue}
      if(!best.hasGeometry){problems.push('UNVERIFIED_GEOMETRY:'+best.route.id);continue}
      resolved.push({routeId:best.route.id,start:s.stations[0][0],end:s.stations.at(-1)[0],
        startIndex:best.first,endIndex:best.last});
    }
    if(resolved.length===parts.length)for(let i=1;i<resolved.length;i++)
      if(resolved[i-1].end!==resolved[i].start)
        problems.push('UNMATCHED_BOUNDARY:'+resolved[i-1].end+'!='+resolved[i].start);
    const status=problems.length?'BLOCKED_STATIC':'STATIC_VALID';
    counts[r.operatorId].patterns++;counts[r.operatorId][status==='STATIC_VALID'?'staticValid':'blocked']++;
    for(const error of problems){
      if(error.startsWith('MISSING_LINE'))counts[r.operatorId].unmappedSegments++;
      else if(error.startsWith('UNMATCHED_STATIONS'))counts[r.operatorId].missingStation++;
      else if(error.startsWith('INVALID_STATION_ORDER'))counts[r.operatorId].wrongOrder++;
      else if(error.startsWith('UNVERIFIED_GEOMETRY'))counts[r.operatorId].missingGeometry++;
      else if(error.startsWith('UNMATCHED_BOUNDARY'))counts[r.operatorId].boundaryMismatch++;
    }
    report.push({operatorId:r.operatorId,cardId:r.id,cardName:r.line?.ko,patternId:String(p.id),
      trainName:p.type?.ko||p.type?.ja||'',status,segments:resolved,problems});
  }
}
const out={schemaVersion:1,generated:new Date().toISOString(),
  notice:'STATIC_VALID does not imply current timetable verification or browser playability. BLOCKED_STATIC never auto-enabled.',
  totalCards:jr.length,totalPatterns:report.length,staticValid:report.filter(x=>x.status==='STATIC_VALID').length,
  blocked:report.filter(x=>x.status==='BLOCKED_STATIC').length,byOperator:counts,patterns:report};
const output=path.join(root,'reports/jr');fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'service-audit.json'),JSON.stringify(out,null,2)+'\n');
const table=names.map(id=>{const c=counts[id];return '| '+id+' | '+c.cards+' | '+c.patterns+' | '+c.staticValid+' | '+c.blocked+' |'}).join('\n');
const summary='# JR group service route consistency audit\n\nGenerated by tools/audit-jr-operating-services.cjs. All six JR passenger operators.\n\n| Company | Cards | Patterns | Static mapping passes | Needs repair |\n|---|---:|---:|---:|---:|\n'+table+'\n\nSTATIC_VALID is **not** verified game playability or timetable approval. For missing geometry, invalid stations and discontinuous through routes, do not synthesize tracks. See service-audit.json for every pattern ID, card and reason.\n';
fs.writeFileSync(path.join(output,'README.md'),summary);
console.log(JSON.stringify({JRcards:out.totalCards,patterns:out.totalPatterns,staticValid:out.staticValid,blocked:out.blocked,byOperator:counts},null,2));
