#!/usr/bin/env node
'use strict';
// Import externally verified OSM rail alignment for ONE Korean route.
// Usage: node tools/import-korea-osm-geometry.js --route kr-metro-2 --file /tmp/line2.geojson --relation 12345
// The GeoJSON must have a known, inspected OSM route relation ID. No station-to-station straight lines.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);
const opt=name=>args[args.indexOf(name)+1],id=opt('--route'),input=opt('--file'),relation=opt('--relation');
if(!id||!input||!relation||!/^\d+$/.test(relation))throw Error('Need --route, --file and numeric --relation (verified OSM relation)');
const idx=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8')),meta=idx.routes.find(r=>r.id===id);
if(!meta||meta.countryId!=='kr')throw Error('Unknown Korea route '+id);
const source=JSON.parse(fs.readFileSync(input,'utf8'));
const features=source.type==='FeatureCollection'?source.features:[source];
const tuples=[];
for(const feature of features){
  const p=feature.properties||{},fId=p['@id']||p.osm_id||feature.id||'';
  if(String(fId).replace(/^relation\//,'')!==String(relation))continue;
  const g=feature.geometry||feature;
  if(g.type==='LineString')tuples.push(g.coordinates);
  if(g.type==='MultiLineString')tuples.push(...g.coordinates);
}
if(!tuples.length)throw Error('No LineString for verified OSM relation '+relation);
const checkPoint=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>=124&&p[0]<=132&&p[1]>=33&&p[1]<=39;
if(tuples.some(segment=>segment.length<2||segment.some(p=>!checkPoint(p))))throw Error('Geometry has invalid or out-of-Korea coordinates');
const detailPath=path.join(root,meta.lazySource),json=JSON.parse(fs.readFileSync(detailPath,'utf8'));
const d=json.route;
const raw={status:'awaiting-station-segment-matching',osmRelationId:Number(relation),sourceFile:path.basename(input),type:'MultiLineString',coordinates:tuples,source:'OpenStreetMap contributors (ODbL)',verifiedRelationId:true,coordinateSystem:'EPSG:4326'};
const target=path.join(root,'data/kr/geometry/osm/'+id+'.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(raw,null,2)+'\n');
// Keep geometryReady=false until way ordering and every station-to-station segment identity are verified.
d.geometryReady=false;d.geometryStatus='missing';meta.geometryReady=false;meta.geometryStatus='missing';
fs.writeFileSync(detailPath,JSON.stringify(json,null,2)+'\n');
fs.writeFileSync(path.join(root,'data/kr/generated/index.json'),JSON.stringify(idx,null,2)+'\n');
console.log(JSON.stringify({status:'IMPORTED_FOR_REVIEW',route:id,osmRelationId:Number(relation),trackSegments:tuples.length,ready:false},null,2));
