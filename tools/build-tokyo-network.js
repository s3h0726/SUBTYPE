const fs=require('fs'),path=require('path'),{loadAll,projectRoot}=require('./lib/line-workspaces');
const data=loadAll(),prefectures=new Set([11,12,13,14]);
const stationPrefecture=station=>Number(data.stations.get(station.id)?.prefectureCode);
// Preserve complete existing routes crossing the boundary; do not synthesize services.
const visible=data.routes.filter(route=>route.category!=='shinkansen'&&route.stations.some(station=>prefectures.has(stationPrefecture(station))));
const catalog=JSON.parse(fs.readFileSync(path.join(projectRoot,'data/tokyo-service-patterns.json'),'utf8'));
const entries=visible.map(route=>({lineId:route.id,operatorId:route.operatorId,names:route.line,stationCount:route.stations.length,koreanNameVerified:route.koreanNameSource?.verified===true,stationsComplete:null,stationCodesPresent:route.stations.filter(s=>s.officialCode).length,stationCodesComplete:null,operatorLogoStatus:route.operatorAsset?'present':'missing',lineSymbolStatus:route.symbolAsset?'present':route.officialSymbolExists?'missing':'unresolved-or-none',branchesReviewed:false,servicePatternsReviewed:false,throughServiceReviewed:false,servicePatterns:catalog.servicePatterns.filter(p=>p.baseRouteId===route.id).map(p=>p.id),geometryStatus:route.geometryReady?'ready':'missing',missingSegments:route.missingSegments?.length||0,outsideCoreStations:route.stations.filter(s=>!prefectures.has(stationPrefecture(s))).length,operatingStatus:'REVIEW_REQUIRED',sources:route.sources}));
const stationIds=[...new Set(visible.flatMap(route=>route.stations.map(s=>s.id)))],operatorIds=[...new Set(visible.map(route=>route.operatorId))];
const registry={_comment:'AUTO-GENERATED. DO NOT EDIT. Derived from canonical station prefectures.',scope:'tokyo-area',prefectureCodes:[11,12,13,14],routeIds:visible.map(route=>route.id),stationIds,operatorIds};
const report={scope:'Tokyo/Kanagawa/Saitama/Chiba and existing connected route continuations',status:'INCOMPLETE',expectedInventoryVerified:false,expected:null,missing:null,implementedRoutes:visible.length,operators:operatorIds.length,stations:stationIds.length,koreanVerified:stationIds.filter(id=>data.stations.get(id)?.koVerified===true).length,geometryReady:entries.filter(e=>e.geometryStatus==='ready').length,entries};
fs.writeFileSync(path.join(projectRoot,'data/generated/tokyo-area-index.json'),JSON.stringify(registry,null,2)+'\n');
fs.writeFileSync(path.join(projectRoot,'data/source-audit/TOKYO_NETWORK_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,operators:report.operators,routes:report.implementedRoutes,stations:report.stations,geometryReady:report.geometryReady,expectedInventoryVerified:false}));
module.exports=registry;
