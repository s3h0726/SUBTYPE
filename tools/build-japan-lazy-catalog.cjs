#!/usr/bin/env node
// Regenerate the Japanese lazy browser catalog from the canonical workspace.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/line-workspace-data.js'),'utf8');
const prefix='window.TRT_EMBEDDED_LINE_WORKSPACES=';
const begin=source.indexOf(prefix);
if(begin<0)throw new Error('Missing canonical browser workspace');
const ws=JSON.parse(source.slice(begin+prefix.length).trim().replace(/;\s*$/,''));
const duplicateAliases=JSON.parse(fs.readFileSync(path.join(root,'data/japan-duplicate-route-aliases.json'),'utf8')).aliases;
for(const [retired,canonical] of Object.entries(duplicateAliases)){
 const old=ws.routes.find(r=>r.id===retired),keep=ws.routes.find(r=>r.id===canonical);
 if(!old)continue;
 if(!keep)throw Error('Duplicate route canonical source missing: '+canonical);
 const names=route=>(route.stations||[]).map(st=>st.ja||st.names?.ja||'').join('|');
 if(old.operatorId!==keep.operatorId||names(old)!==names(keep))
  throw Error('Not an exact duplicate: '+retired+' versus '+canonical);
}
ws.routes=ws.routes.filter(r=>!duplicateAliases[r.id]);

// Legitimate exact-duplicate consolidation reduced 601+ workspaces to 598.
// Preserve a hard safety floor while allowing the canonical deduplicated inventory.
if(!Array.isArray(ws.routes)||ws.routes.length<590)throw new Error('Canonical Japan route count fell below 590');
const dir=path.join(root,'data/jp-canonical');fs.mkdirSync(dir,{recursive:true});
for(const name of fs.readdirSync(dir))if(/^chunk-\d+\.json$/.test(name))fs.unlinkSync(path.join(dir,name));
const chunks=[];let group=[],size=0;
for(const route of ws.routes){const length=JSON.stringify(route).length+2;if(group.length&&size+length>1350000){chunks.push(group);group=[];size=0}group.push(route);size+=length}
if(group.length)chunks.push(group);
const files=new Map();
chunks.forEach((group,i)=>{const name='chunk-'+String(i).padStart(2,'0')+'.json';const contents=JSON.stringify({routes:group});fs.writeFileSync(path.join(dir,name),contents);const digest=crypto.createHash('sha256').update(contents).digest('hex').slice(0,12);for(const route of group)files.set(route.id,'./data/jp-canonical/'+name+'?v='+digest)});
// Lines with operator-specific station signs must hydrate the canonical per-route
// payload, not a stale monolithic chunk that can restore the shared master name.
const stationSignOverrides=JSON.parse(fs.readFileSync(path.join(root,'data/japan-route-station-names.json'),'utf8')).routes||{};
// Operator-specific station signs must not silently revert when a user
// opens a cached route after the Korean/Japanese name editor is rebuilt.
const generatedRouteSource=id=>{
  const file=path.join(root,'data/generated/routes',id+'.json');
  if(!fs.existsSync(file))throw Error('Missing canonical signed route: '+id);
  const digest=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
  return './data/generated/routes/'+id+'.json?v='+digest;
};
const signedRouteSource=id=>stationSignOverrides[id]?generatedRouteSource(id):files.get(id);
const honanchoBranch=ws.routes.find(r=>r.id==='line-28002-honancho-branch');
const honanchoExtraStations=(honanchoBranch?.stations||[]).filter(station=>String(station.id)!=='station-003643');
const passengerStations=r=>r.id==='line-28002'?[...(r.stations||[]),...honanchoExtraStations]:(r.stations||[]);
const categoryOverrides=JSON.parse(fs.readFileSync(path.join(root,'data/japan-route-category-overrides.json'),'utf8')).categoryByRouteId;
const routes=ws.routes.map(r=>({id:r.id,category:categoryOverrides[r.id]||r.category,mode:r.mode||'rail',countryId:r.countryId||'jp',operatorId:r.operatorId,operator:r.operator,line:r.line,code:r.code||'',lineColor:r.lineColor||r.color||'#777777',loop:!!r.loop,...(r.parentLineId?{parentLineId:r.parentLineId}:{}),...(r.visibility?{visibility:r.visibility}:{}),...(r.legacyRouteAliasFor?{legacyRouteAliasFor:r.legacyRouteAliasFor}:{}),stationCount:passengerStations(r).length,lazySource:r.id==='line-28002-honancho-branch'?generatedRouteSource(r.id):signedRouteSource(r.id),searchStations:passengerStations(r).flatMap(s=>[s.names?.ja||s.ja,s.names?.ko||s.ko].filter(Boolean)),...(typeof r.geometryReady==='boolean'?{geometryReady:r.geometryReady}:{}),...(r.playable===false?{playable:false}:(r.geometryReady===true?{playable:true}:{}))}));
// Nationwide interchange graph: shared station identities are authoritative
// across *all* 590+ passenger lines; identical names are joined only if their
// independently measured rail positions are within a narrow walking threshold.
// Differently named IDs still require a documented named-transfer group.
const transferGroups=JSON.parse(fs.readFileSync(path.join(root,'data/japan-named-transfer-groups.json'),'utf8')).groups;
const validPoint=s=>Number.isFinite(Number(s.latitude))&&Number.isFinite(Number(s.longitude))
  &&Math.abs(Number(s.latitude))<=90&&Math.abs(Number(s.longitude))<=180;
const distanceKm=(a,b)=>Math.hypot((Number(a.latitude)-Number(b.latitude))*111.195,
  (Number(a.longitude)-Number(b.longitude))*111.195*Math.cos(Number(b.latitude)*Math.PI/180));
const transferEntries=ws.routes.filter(r=>r.visibility!=='internal'&&r.playable!==false)
  .flatMap(route=>(route.stations||[]).filter(validPoint).map(station=>({routeId:route.id,
    stationId:String(station.transferStationId||station.stationMasterId||station.id||''),
    name:String(station.ja||''),latitude:Number(station.latitude),longitude:Number(station.longitude)})));
const byIdentity=new Map,byName=new Map;
for(const entry of transferEntries){
  if(entry.stationId){if(!byIdentity.has(entry.stationId))byIdentity.set(entry.stationId,[]);byIdentity.get(entry.stationId).push(entry)}
  if(entry.name){if(!byName.has(entry.name))byName.set(entry.name,[]);byName.get(entry.name).push(entry)}
}
const transferNeighbors=new Map(ws.routes.map(r=>[r.id,new Set]));
const transferAudit={identityLinks:0,nearbySameNameLinks:0,namedGroupLinks:0,farApartSharedIds:0};
const connectedPairs=new Set;
function addTransfer(a,b,kind){
  if(a.routeId===b.routeId)return;
  const pair=[a.routeId,b.routeId].sort().join('::');
  if(connectedPairs.has(pair))return;
  connectedPairs.add(pair);
  transferNeighbors.get(a.routeId)?.add(b.routeId);
  transferNeighbors.get(b.routeId)?.add(a.routeId);
  transferAudit[kind]++;
}
for(const stops of byIdentity.values()){
  for(let i=0;i<stops.length;i++)for(let j=i+1;j<stops.length;j++){
    const a=stops[i],b=stops[j];if(a.routeId===b.routeId)continue;
    if(distanceKm(a,b)<=1.2)addTransfer(a,b,'identityLinks');
    else transferAudit.farApartSharedIds++;
  }
}
for(const stops of byName.values()){
  if(stops.length>100)continue;
  for(let i=0;i<stops.length;i++)for(let j=i+1;j<stops.length;j++){
    const a=stops[i],b=stops[j];
    // 250 m safety fence for independent IDs with exactly matching names.
    if(a.stationId!==b.stationId&&distanceKm(a,b)<=0.25)
      addTransfer(a,b,'nearbySameNameLinks');
  }
}
for(const group of transferGroups){
  if(group.disabledNamedJoin)continue;
  const matching=transferEntries.filter(stop=>
    group.names.includes(stop.name)&&distanceKm(stop,{latitude:group.center[0],longitude:group.center[1]})<=group.radiusKm);
  const perRoute=new Map;
  for(const stop of matching)perRoute.set(stop.routeId,(perRoute.get(stop.routeId)||0)+1);
  const unique=matching.filter(stop=>perRoute.get(stop.routeId)===1);
  for(let i=0;i<unique.length;i++)for(let j=i+1;j<unique.length;j++)
    if(unique[i].name!==unique[j].name)addTransfer(unique[i],unique[j],'namedGroupLinks');
}
const neighboringLines=Object.fromEntries([...transferNeighbors].filter(([,ids])=>ids.size)
  .map(([id,ids])=>[id,[...ids].sort()]));
const neighborAudit={schemaVersion:1,generated:ws.generated,routeCount:ws.routes.length,
  neighborRouteCount:Object.keys(neighboringLines).length,groupCount:transferGroups.length,
  ...transferAudit};
fs.writeFileSync(path.join(root,'data/generated/japan-transfer-neighbors.json'),
  JSON.stringify({audit:neighborAudit,neighbors:neighboringLines}));
const lite={version:1,generated:ws.generated,source:'js/line-workspace-data.js',operators:ws.index?.operators||[],assets:ws.assets||{},transferNeighbors:neighboringLines,routes};
fs.writeFileSync(path.join(root,'js/japan-lite-index.js'),'/* AUTO-GENERATED by tools/build-japan-lazy-catalog.cjs; canonical Japanese routes, loaded per chunk. */\nwindow.TRT_JAPAN_LITE_INDEX='+JSON.stringify(lite)+';\n');
const all=chunks.flat();if(all.length!==ws.routes.length||new Set(all.map(r=>r.id)).size!==ws.routes.length)throw new Error('Japanese lazy data loss or duplicate');
console.log(JSON.stringify({status:'PASS',routes:all.length,chunks:chunks.length,indexBytes:JSON.stringify(lite).length,transfers:neighborAudit}));
