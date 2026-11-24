#!/usr/bin/env node
'use strict';
// Write published name-editor overrides into actual playable data, in addition
// to the browser's existing runtime fallbacks. Never alter geometry or IDs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),clean=x=>typeof x==='string'?x.normalize('NFC').trim():'';
const overrides=JSON.parse(fs.readFileSync(path.join(root,'data/editor-overrides.json'),'utf8'));
const stats={indexes:0,routeFiles:0,stationFields:0,lineFields:0,operatorFields:0,serviceFields:0,skippedCompressed:0};
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const write=(relative,text)=>fs.writeFileSync(path.join(root,relative),text);
const validColor=value=>/^#[0-9a-fA-F]{6}$/.test(value||'');
function set(obj,field,value,kind){
 if(!obj||typeof obj!=='object'||!clean(value)||obj[field]===value)return;
 obj[field]=value;stats[kind]++;
}
function entityNames(entity,ko,kind){
 if(!entity||typeof entity!=='object'||!clean(ko))return;
 if(entity.ko!==undefined)set(entity,'ko',ko,kind);
 if(entity.nameKo!==undefined)set(entity,'nameKo',ko,kind);
 if(entity.names&&typeof entity.names==='object')set(entity.names,'ko',ko,kind);
 if(entity.displayNames&&typeof entity.displayNames==='object')set(entity.displayNames,'ko',ko,kind);
}
function stationPatch(lineId){
 return overrides.stations?.[lineId]||{};
}
function patchStation(st,changes){
 if(!st||typeof st!=='object')return;
 const keys=[st.id,st.station_id,st.stationMasterId,st.ja,st.en];
 const want=keys.map(key=>changes[key]).find(value=>clean(value));
 if(!want)return;
 if(st.ko!==want){st.ko=want;stats.stationFields++}
 if(st.nameKo!==undefined)set(st,'nameKo',want,'stationFields');
 if(st.names?.ko!==undefined)set(st.names,'ko',want,'stationFields');
 if(!st.canonicalStationNames)st.canonicalStationNames={ko:st.ko,ja:st.ja||'',kana:st.kana||'',en:st.en||st.romaji||''};
 st.routeSpecificStationName=true;
 st.editorStationNameOverride=true;
}
function patchService(item){
 if(!item||typeof item!=='object')return;
 const want=clean(overrides.services?.[item.id]);
 if(!want)return;
 set(item,'nameKo',want,'serviceFields');
 if(item.ko!==undefined)set(item,'ko',want,'serviceFields');
 if(item.names?.ko!==undefined)set(item.names,'ko',want,'serviceFields');
 if(item.displayNames?.ko!==undefined)set(item.displayNames,'ko',want,'serviceFields');
}
function patchRoute(route){
 if(!route||typeof route!=='object'||!route.id)return;
 const id=route.id,operatorId=route.operatorId;
 const line=overrides.lines?.[id]||overrides.lines?.[route.canonicalLineId]||{};
 const operator=clean(overrides.operators?.[operatorId]);
 if(operator){entityNames(route.operator,operator,'operatorFields');if(route.operator?.ko!==operator)set(route.operator,'ko',operator,'operatorFields')}
 if(clean(line.ko)){
  entityNames(route.line,line.ko,'lineFields');
  if(route.line?.ko!==line.ko)set(route.line,'ko',line.ko,'lineFields');
  if(!route.line&&route.names)set(route.names,'ko',line.ko,'lineFields');
 }
 if(validColor(line.color)){
  set(route,'lineColor',line.color,'lineFields');
  if(route.lineTheme?.color!==undefined)set(route.lineTheme,'color',line.color,'lineFields');
 }
 const changes={...stationPatch(route.canonicalLineId),...stationPatch(id)};
 for(const prop of ['stations','stationCatalog']){
  if(Array.isArray(route[prop]))for(const st of route[prop])patchStation(st,changes);
 }
 for(const d of route.directions||[])if(Array.isArray(d.stops))for(const st of d.stops)patchStation(st,changes);
 for(const p of route.patterns||[]){
  patchService(p);
  for(const st of p.stations||[])patchStation(st,changes);
  if(p.service)patchService(p.service);
 }
 for(const s of route.services||[])patchService(s);
 for(const journey of route.verifiedJourneys||[]){
  for(const st of journey.stations||[])patchStation(st,changes);
  patchService(journey);
  patchService(journey.service);
  const want=clean(overrides.services?.[journey.id]||overrides.services?.[journey.service?.id]);
  if(want){
   if(!journey.patternName)journey.patternName={};
   set(journey.patternName,'ko',want,'serviceFields');
   if(journey.service)set(journey.service,'nameKo',want,'serviceFields');
  }
 }
 if(Array.isArray(route.searchStations)){
  for(const ko of Object.values(changes)){
   if(clean(ko)&&!route.searchStations.includes(ko))route.searchStations.push(ko);
  }
 }
}
const sources=[
 ['data/generated/line-index.json','js/line-workspace-data.js'],
 ['data/kr/generated/index.json','js/korea-index-data.js'],
 ['data/hk/generated/index.json','js/hong-kong-index-data.js'],
 ['data/uk/generated/index.json',null],
 ['data/fr/generated/index.json',null],
 ['data/th/generated/index.json',null],
 ['data/tw/generated/network.json',null]
];
const routeFiles=new Set();
function stringifyLike(before,value){
 return JSON.stringify(value,before.startsWith('{\n')||before.startsWith('[\n')?null:null,before.startsWith('{\n')||before.startsWith('[\n')?2:0)+(before.endsWith('\n')?'\n':'');
}
function writeIfChanged(file,content){
 const current=read(file);if(current===content)return false;
 write(file,content);return true;
}
for(const [file,embedded] of sources){
 if(!fs.existsSync(path.join(root,file)))continue;
 const before=read(file),catalog=JSON.parse(before);
 const initial=JSON.stringify(catalog);
 for(const op of catalog.operators||[]){
  const want=clean(overrides.operators?.[op.id]);
  if(want){if(op.names)entityNames(op,want,'operatorFields');else entityNames(op,want,'operatorFields')}
 }
 for(const route of [...(catalog.routes||[]),...(catalog.lines||[])]) {
  patchRoute(route);
  const src=String(route.lazySource||route.generatedSource||'').replace(/^\.\//,'');
  if(/^data\/(?:generated|(?:kr|hk|uk|fr|th|tw)\/generated)\/routes\/[\w.-]+\.json$/.test(src)&&fs.existsSync(path.join(root,src)))routeFiles.add(src);
 }
 for(const pat of catalog.patterns||[])patchService(pat);
 if(file==='data/tw/generated/network.json'){
  for(const route of catalog.lines||[])for(const station of route.stations||[])patchStation(station,stationPatch(route.id));
 }
 if(JSON.stringify(catalog)!==initial){
  write(file,stringifyLike(before,catalog));stats.indexes++;
  if(embedded&&fs.existsSync(path.join(root,embedded))){
   const src=read(embedded);
   const marker=file.includes('/kr/')?'window.TRT_KOREA_INDEX=':file.includes('/hk/')?'window.TRT_HONG_KONG_INDEX=':null;
   if(marker){
    const at=src.indexOf(marker),end=src.lastIndexOf(';\n');
    if(at<0||end<at)throw Error('Cannot synchronize embedded catalog: '+embedded);
    writeIfChanged(embedded,src.slice(0,at+marker.length)+JSON.stringify(catalog)+src.slice(end));
   }
  }
 }
}
const specialFiles=[
 'data/route-overrides/meitetsu-mikawa-yama.json',
 'data/route-overrides/meitetsu-mikawa-umi.json',
 'data/route-overrides/hakodate-west.json',
 'data/route-overrides/hakodate-east.json'
];
for(const file of specialFiles)if(fs.existsSync(path.join(root,file)))routeFiles.add(file);
// Catch station overrides that appear in a service data shard, not in the index.
const serviceIds=Object.keys(overrides.services||{});
const krRoutes=path.join(root,'data/kr/generated/routes');
if(fs.existsSync(krRoutes))for(const name of fs.readdirSync(krRoutes)){
 if(!name.endsWith('.json'))continue;
 const file='data/kr/generated/routes/'+name;
 if(routeFiles.has(file))continue;
 // Only high-speed rail shards contain the currently edited named services.
 if(!/(rail|highspeed|ktx|srt)/.test(name))continue;
 const raw=read(file);
 if(serviceIds.some(id=>raw.includes(id)))routeFiles.add(file);
}
for(const file of routeFiles){
 const before=read(file);
 let source;try{source=JSON.parse(before)}catch{continue}
 if(source.encoding&&source.data){stats.skippedCompressed++;continue}
 const initial=JSON.stringify(source);
 if(source.route)patchRoute(source.route);
 else if(source.id)patchRoute(source);
 else if(Array.isArray(source.routes))for(const route of source.routes)patchRoute(route);
 if(JSON.stringify(source)!==initial){
  write(file,stringifyLike(before,source));
  stats.routeFiles++;
 }
}
console.log(JSON.stringify({status:'MATERIALIZED',...stats}));
