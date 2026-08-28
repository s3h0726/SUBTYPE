#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data','nationwide');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const index=read(path.join(dir,'index.json')),base=read(path.join(dir,'AUDIT.json'));
const chunks=index.routes.map(meta=>read(path.join(root,meta.lazySource.replace(/^\.\//,''))).route);
const stations=chunks.flatMap(route=>route.stations),unique=new Map(stations.map(station=>[station.stationMasterId,station]));
const missingGeometry=read(path.join(dir,'GEOMETRY_MISSING.json'));
const uiAuditPath=path.join(dir,'UI_AUDIT.json'),uiAudit=fs.existsSync(uiAuditPath)?read(uiAuditPath):null;
const japanese=/[一-龯々〆ヵヶぁ-ゖァ-ヺ]/;
const koreanFieldExceptions=[...unique.values()].filter(station=>japanese.test(station.ko||'')).map(station=>({id:station.stationMasterId,ja:station.ja,ko:station.ko}));
const report={
 generated:new Date().toISOString(),status:'PARTIAL_WITH_AUDITED_GAPS',
 scope:{operators:index.operators.length,lines:index.routes.length,uniqueStations:unique.size,routeChunks:chunks.length},
 completeness:{routeChunksPresent:chunks.length===index.routes.length,requiredStationFields:stations.filter(s=>s.ja&&s.kana&&s.romaji&&s.ko&&Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)).length,totalStationEntries:stations.length,missingKoreanLines:index.routes.filter(route=>!route.line.ko).length,missingKoreanStations:[...unique.values()].filter(station=>!station.ko).length},
 geometry:{matched:base.geometryReady,missing:missingGeometry.length,failedStationPairs:base.failedStationPairs,distanceOutliers:base.distanceOutliers,yurikamomeLoop:base.yurikamomeLoop,missingFile:'./GEOMETRY_MISSING.json'},
 names:{humanReviewRequired:base.reviewRequired,japaneseCharactersInKorean:koreanFieldExceptions.length,exceptions:koreanFieldExceptions,reviewFile:'./REVIEW_REQUIRED.json'},
 symbols:{realAssets:fs.readdirSync(path.join(root,'assets','route-symbols')).filter(name=>name.endsWith('.svg')).length,policy:'Render verified local official assets only. Hide the symbol area when no verified asset is available. No pseudo-symbols or generic wrappers.',nationwideCoverageAudit:'INCOMPLETE'},
 ui:uiAudit,
 strictPass:false,
 blockers:[`${missingGeometry.length} routes do not have accepted MLIT geometry.`,`${base.reviewRequired} station names still require human Korean-name review.`,'Nationwide official symbol asset coverage is incomplete.',`${base.distanceOutliers.length} rail-distance outliers and ${base.failedStationPairs} disconnected station pair(s) require manual geometry review.`]
};
fs.writeFileSync(path.join(dir,'FINAL_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
