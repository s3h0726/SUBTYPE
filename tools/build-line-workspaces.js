#!/usr/bin/env node
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{loadAll,projectRoot,writeAtomic}=require('./lib/line-workspaces');
const outputRoot=path.join(projectRoot,'data','generated'),baselineFile=path.join(outputRoot,'build-baseline.json'),data=loadAll(),counts={lines:data.routes.length,operators:data.operators.size,stations:data.stations.size,relations:data.routes.reduce((sum,route)=>sum+route.stations.length,0),segments:data.routes.reduce((sum,route)=>sum+route.directedSegments.length,0)};
const previous=fs.existsSync(baselineFile)?JSON.parse(fs.readFileSync(baselineFile,'utf8')):{lines:601,operators:161,stations:9145,relations:counts.relations,segments:counts.segments},unsafe=Object.keys(counts).filter(key=>counts[key]<Number(previous[key]||0)*.9);if(!counts.lines||!counts.relations||unsafe.length)throw new Error(`Workspace data-loss guard blocked build: ${unsafe.map(key=>`${key} ${previous[key]} -> ${counts[key]}`).join(', ')}`);
// Editor overrides are authoritative for the Japanese display/catalog build.
// Apply at the final route-composition boundary, never mutate unrelated KR sources.
const editorOverridesPath=path.join(projectRoot,'data','editor-overrides.json');
const editorOverrides=fs.existsSync(editorOverridesPath)?JSON.parse(fs.readFileSync(editorOverridesPath,'utf8')):{};
const editorOps=editorOverrides.operators||{},editorLines=editorOverrides.lines||{},editorStations=editorOverrides.stations||{};
const stationsOverridden=[];
for(const route of data.routes){
  const opName=editorOps[route.operatorId];
  if(typeof opName==='string'&&opName.trim())route.operator.ko=opName.trim();
  const change=editorLines[route.id];
  if(change&&typeof change==='object'){
    if(typeof change.ko==='string'&&change.ko.trim())route.line.ko=change.ko.trim();
    if(typeof change.color==='string'&&/^#[0-9a-fA-F]{6}$/.test(change.color))route.lineColor=change.color;
  }
  const stationChanges=editorStations[route.id]||{};
  for(const station of route.stations){
    const target=stationChanges[station.id]??stationChanges[station.ja];
    if(typeof target==='string'&&target.trim()){
      station.ko=target.trim();
      stationsOverridden.push([route.id,station.id]);
    }
  }
}
// Exact Japanese-name exceptions, reviewed individually. Applied after editor changes,
// so a stale CSV/override cannot reintroduce invalid long vowels or aspirated consonants.
const nameExceptionFile=path.join(projectRoot,'data','japan-name-exceptions.json');
const nameExceptions=JSON.parse(fs.readFileSync(nameExceptionFile,'utf8')).stations||{};
let nameExceptionsApplied=0;
for(const route of data.routes){
  if(route.countryId==='kr')continue;
  for(const station of route.stations){
    const override=nameExceptions[station.ja];
    if(override&&station.ko!==override.ko){
      station.ko=override.ko;
      nameExceptionsApplied++;
    }
  }
}
// Publish a transparent audit: geometry-matched platforms, stale/unverified
// fallbacks and stations whose purported railway endpoint is implausible.
const coordinateCoverage=data.routes.map(route=>{
  const lineTrack=route.stations.filter(station=>station.coordinateSource==='line-track-geometry').length;
  const fallback=route.stations.filter(station=>station.coordinateSource==='station-master-fallback').length;
  return{id:route.id,lineKo:route.line.ko,stations:route.stations.length,lineTrack,fallback,
    unverified:route.stations.length-lineTrack-fallback,geometryReady:route.geometryReady};
});
const coordinateTotals=coordinateCoverage.reduce((sum,entry)=>({
  lineTrack:sum.lineTrack+entry.lineTrack,
  fallback:sum.fallback+entry.fallback,
  unverified:sum.unverified+entry.unverified
}),{lineTrack:0,fallback:0,unverified:0});
const coordinateExceptions=data.routes.flatMap(route=>route.stations.filter(station=>
  Number.isFinite(station.trackEndpointOffsetKm)).map(station=>({
    routeId:route.id,stationId:station.id,stationJa:station.ja,stationKo:station.ko,
    offsetKm:station.trackEndpointOffsetKm,coordinateSource:station.coordinateSource
  }))).sort((a,b)=>b.offsetKm-a.offsetKm);
const coordinateAuditPath=path.join(projectRoot,'reports','jr','route-station-coordinate-audit.json');
fs.mkdirSync(path.dirname(coordinateAuditPath),{recursive:true});
writeAtomic(coordinateAuditPath,{
  schemaVersion:1,source:'canonical railway segment endpoint / shared station master fallback',
  maxAcceptedTrackOffsetKm:0.5,generated:new Date().toISOString(),
  stationTotal:counts.relations,totals:coordinateTotals,
  routeCoverage:coordinateCoverage,exceptions:coordinateExceptions
});
// All routes for one operator must receive the same override, including legacy ids
// whose physical workspace operator identifiers differ from the editor's old ID.
const routeRoot=path.join(outputRoot,'routes');fs.mkdirSync(routeRoot,{recursive:true});const index=[];for(const route of data.routes){const file=`routes/${route.id.replace(/[^a-zA-Z0-9._-]/g,'-')}.json`;writeAtomic(path.join(outputRoot,file),{route});index.push({id:route.id,operatorId:route.operatorId,operator:route.operator,line:route.line,category:route.category,code:route.code,lineColor:route.lineColor,loop:route.loop,stationCount:route.stations.length,stationSequence:route.stations.map(station=>station.id),workspace:route.workspace,generatedSource:`./data/generated/${file}`,geometryReady:route.geometryReady,searchStations:route.stations.flatMap(station=>[station.ja,station.kana,station.romaji,station.ko]).filter(Boolean)})}
const versionedAsset=(folder,stem,metadata={})=>{const name=['svg','png','webp'].map(extension=>`${stem}.${extension}`).find(candidate=>fs.existsSync(path.join(folder,candidate)));if(!name)return null;const file=path.join(folder,name),relative=path.relative(projectRoot,file).split(path.sep).join('/'),version=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);return{asset:`./${relative}?v=${version}`,file:`./${relative}`,version,exists:true,verified:metadata.verified===true,source:metadata.source||'',officialExists:metadata.officialLogoExists===true||metadata.officialSymbolExists===true}};
const operators=Array.from(data.operators.values()).map(operator=>({id:operator.id,names:{...operator.names,...(typeof editorOps[operator.id]==='string'&&editorOps[operator.id].trim()?{ko:editorOps[operator.id].trim()}:{})},logo:operator.logo,stationSignTemplate:operator.stationSignTemplate}));
const assets={operators:Object.fromEntries(Array.from(data.operators.values()).map(operator=>[operator.id,versionedAsset(operator._folder,'logo',operator.logo)]).filter(([,asset])=>asset)),lines:Object.fromEntries(data.workspaces.map(workspace=>[workspace.line.id,versionedAsset(workspace.folder,'symbol',workspace.line.symbol)]).filter(([,asset])=>asset))};
writeAtomic(path.join(outputRoot,'asset-registry.json'),{schemaVersion:1,generated:new Date().toISOString(),...assets});writeAtomic(path.join(outputRoot,'line-index.json'),{schemaVersion:1,generated:new Date().toISOString(),counts,routes:index,operators,assets});writeAtomic(baselineFile,{...counts,generated:new Date().toISOString(),maximumUnapprovedLossRatio:.1});const embedded={schemaVersion:1,generated:new Date().toISOString(),counts,index:{routes:index,operators},assets,routes:data.routes};fs.writeFileSync(path.join(projectRoot,'js','line-workspace-data.js'),`/* AUTO-GENERATED by tools/build-line-workspaces.js. DO NOT EDIT. */\nwindow.TRT_EMBEDDED_LINE_WORKSPACES=${JSON.stringify(embedded)};\n`);console.log(JSON.stringify({status:'PASS',source:'data/lines/**/line.json',...counts,geometryReady:data.routes.filter(route=>route.geometryReady).length,operatorAssets:Object.keys(assets.operators).length,lineAssets:Object.keys(assets.lines).length,generatedIndex:'data/generated/line-index.json',generatedAssetRegistry:'data/generated/asset-registry.json',generatedBrowserData:'js/line-workspace-data.js',stationCoordinates:coordinateTotals,coordinateAudit:'reports/jr/route-station-coordinate-audit.json'},null,2));
