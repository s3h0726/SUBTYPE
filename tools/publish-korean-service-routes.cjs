#!/usr/bin/env node
'use strict';
// Publish all structurally playable Korean OSM service paths in the regular
// in-game catalog. This is a GAME release, NOT operator timetable certification.
// Preserve original OSM evidence and the source preview as a build input.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const abs=p=>path.join(root,p);
const parse=p=>JSON.parse(fs.readFileSync(abs(p),'utf8'));
const indexPath='data/kr/generated/index.json';
const main=parse(indexPath),source=parse('data/kr/preview/index.json');
assert.equal(source.routes.length,123,'Unexpected source-route inventory');
const obsolete=new Set(['13695367','13695368']); // Discontinued Dongincheon limited express
const blocked=new Set(['20500831']); // Safety policy: partial route
const byId=new Map();
const skipped=[];
const operators=new Map([...main.operators,...source.operators].map(x=>[x.id,x]));
for(const route of main.routes){
 // The independently assembled passenger Line 1 journeys supersede five
 // legacy fragments. Never delete other legacy passenger lines.
 if(/^kr-metro-1-(main|gyeongin|gyeongbu|gwangmyeong|seodongtan)$/.test(route.id))continue;
 byId.set(route.id,route);
}
const audit={schemaVersion:1,note:'Game-publication only. Neither operator timetable verification nor national official approval is implied.',source:'OpenStreetMap service relations; source geometry/evidence retained in data/kr/preview and data/kr/v2',published:{},unreleased:[]};
let published=0;
for(const entry of source.routes){
 const relationId=String(entry.sourceRelationId||'');
 assert.match(relationId,/^\d+$/);
 if(obsolete.has(relationId)||blocked.has(relationId)){
  skipped.push({relationId,reason:obsolete.has(relationId)?'discontinued service':'access restriction'});
  audit.unreleased.push({relationId,reason:skipped.at(-1).reason});
  continue;
 }
 const inFile='data/kr/preview/routes/'+entry.id+'.json';
 const original=parse(inFile).route;
 assert(original&&original.id===entry.id&&original.sourceRelationId===relationId);
 assert.equal(original.playable,true);
 assert.equal(original.geometryReady,true);
 assert(Array.isArray(original.stations)&&original.stations.length>=2);
 assert(Array.isArray(original.geometry)&&original.geometry.length>=2);
 assert.equal(original.directedSegments.length,original.stations.length-1);
 const id='kr-service-'+relationId;
 const sha=crypto.createHash('sha256').update(JSON.stringify({stations:original.stations,geometry:original.geometry,directedSegments:original.directedSegments})).digest('hex');
 const serviceName=String(original.line?.ko||'').replace(/:\s*/g,' · ').trim();
 const material={...original,id,releaseStatus:'released',playStatus:'RELEASED',visibility:'public',
   serviceValidationStatus:'external-timetable-unverified',
   schemaVersion:2,sourceStatus:'osm-service-geometry',
   sourceServiceId:original.sourceServiceId,
   line:{...original.line,ko:serviceName||original.line?.ko,ja:original.line?.ja||serviceName},
   passengerLineName:String(original.passengerLineName||'').replace(/:\s*/g,' · ')};
 delete material.previewContract;
 delete material.researchEvidence;
 delete material.researchPreview;
 if(Array.isArray(material.services)){
  material.services=material.services.map(s=>({...s,nameKo:serviceName||s.nameKo,nameJa:serviceName||s.nameJa}));
 }
 const outfile='data/kr/generated/routes/'+id+'.json';
 const rendered=JSON.stringify({route:material})+'\n';
 fs.mkdirSync(path.dirname(abs(outfile)),{recursive:true});
 fs.writeFileSync(abs(outfile),rendered);
 const compact={...material,stations:[],geometry:[],directedSegments:[],services:[],lazy:true,
   lazySource:outfile+'?v='+crypto.createHash('sha256').update(rendered).digest('hex').slice(0,12),
   stationCount:material.stations.length,serviceCount:material.services?.length||0};
 byId.set(id,compact);
 audit.published[id]={sourceRelationId:relationId,legacyId:entry.id,geometrySha256:sha,
   sourceEvidence:original.researchEvidence||null,externalTimetableVerified:false};
 published++;
}
assert.equal(published,source.routes.length-skipped.length);
const index={...main,operators:[...operators.values()],routes:[...byId.values()]};
index.counts={...main.counts,gamePublishedServices:published,sourceRelationExclusions:skipped.length};
fs.writeFileSync(abs(indexPath),JSON.stringify(index)+'\n');
fs.writeFileSync(abs('js/korea-index-data.js'),'/* Published Korean game catalog; external timetables require separate verification. */\nwindow.TRT_KOREA_INDEX='+JSON.stringify(index)+';\n');
fs.mkdirSync(abs('data/kr/evidence'),{recursive:true});
fs.writeFileSync(abs('data/kr/evidence/regular-service-source-audit.json'),JSON.stringify(audit,null,2)+'\n');
const count=index.routes.filter(r=>/^kr-service-/.test(r.id)).length;
assert.equal(count,published);
console.log('KR_REGULAR_GAME_PUBLICATION '+JSON.stringify({existingPassengerRoutes:main.routes.length,regularServiceRoutes:count,skipped,finalCatalog:index.routes.length}));
