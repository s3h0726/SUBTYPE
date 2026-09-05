#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const{projectRoot,loadAll,writeAtomic}=require('./lib/line-workspaces');

const patterns=[
  ['double-o','오오'],['long-jo','조우'],['long-kyo','쿄우'],['long-ryo','료우'],
  ['long-sho','쇼우'],['long-cho','쵸우'],['long-to','토우'],['long-ko','코우'],
  ['long-yu','유우'],['double-u','우우'],['keitou',/케이토(?!쿠)/],['onsen-suffix','온선'],
  ['wrong-shinkansen','신칸선'],['line-sen',/(?<!칸)센(?:$|[【(（])/]
];
const matches=(value,needle)=>typeof needle==='string'?String(value).includes(needle):needle.test(String(value));
const data=loadAll(),records=[];
const scan=(type,id,names,extra={})=>{const ko=names?.ko||'',hits=patterns.filter(([,needle])=>matches(ko,needle)).map(([key])=>key);if(hits.length)records.push({type,id,ja:names?.ja||'',romaji:names?.en||'',currentKo:ko,hits,status:'REVIEW',...extra})};
for(const operator of data.operators.values())scan('operator',operator.id,operator.names);
for(const workspace of data.workspaces){scan('line',workspace.line.id,workspace.line.names,{operatorId:workspace.line.operatorId,canonicalFile:path.relative(projectRoot,path.join(workspace.folder,'line.json')).replaceAll('\\','/')});for(const service of workspace.line.services||[])scan('service',`${workspace.line.id}:${service.id}`,service.names,{lineId:workspace.line.id})}
for(const station of data.stations.values())scan('station',station.id,station.names,{canonicalFile:path.relative(projectRoot,data.stationShards.get(station.id)).replaceAll('\\','/')});
const summary={operators:data.operators.size,lines:data.workspaces.length,stations:data.stations.size,services:data.workspaces.reduce((count,item)=>count+(item.line.services||[]).length,0),candidates:records.length,byType:Object.fromEntries(['operator','line','station','service'].map(type=>[type,records.filter(item=>item.type===type).length])),byPattern:Object.fromEntries(patterns.map(([key])=>[key,records.filter(item=>item.hits.includes(key)).length]))};
const output={schemaVersion:1,generated:new Date().toISOString(),scope:'canonical Japanese transport names',summary,records};
writeAtomic(path.join(projectRoot,'data','source-audit','JAPANESE_KOREAN_NAME_AUDIT.json'),output);
console.log(JSON.stringify({status:'AUDIT_COMPLETE',output:'data/source-audit/JAPANESE_KOREAN_NAME_AUDIT.json',...summary},null,2));
