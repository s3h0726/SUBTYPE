#!/usr/bin/env node
// Classify the old release failures against a freshly acquired OSM snapshot.
// Never copy or "repair" legacy coordinates by adding unproven source labels.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ways=read('data/kr/v2/source/osm-ways.json'),vertices=new Set(),edges=new Set(),key=p=>p.join(',');
for(const w of ways)for(let i=0;i<w.coordinates.length;i++){const p=w.coordinates[i];if(!p)continue;vertices.add(key(p));if(i&&w.coordinates[i-1]){const a=key(w.coordinates[i-1]),b=key(p);edges.add(a+'|'+b);edges.add(b+'|'+a)}}
const segments=[],counts={missingLicense:0,missingWayProvenance:0};
for(const meta of read('data/kr/generated/index.json').routes){const r=read(meta.lazySource).route;for(const dir of r.directions||[])for(const [i,s] of (dir.directedSegments||[]).entries()){
 const errors=[];
 if(s.source?.license!=='ODbL-1.0'){counts.missingLicense++;errors.push('MISSING_LICENSE')}
 if(!(s.source?.osmWayIds?.length||(r.id==='kr-metro-3'&&s.source?.geometryDataset==='matassp-seoul-isochrone-lines-geojson'&&s.source?.featureLineId==='3'))){counts.missingWayProvenance++;errors.push('MISSING_WAY_PROVENANCE')}
 const points=s.geometry||[],missingVertices=points.filter(p=>!vertices.has(key(p))).length;
 let missingEdges=0;for(let j=1;j<points.length;j++)if(!edges.has(key(points[j-1])+'|'+key(points[j])))missingEdges++;
 segments.push({routeId:r.id,directionId:dir.id,segmentIndex:i,fromStationId:s.fromStationId,toStationId:s.toStationId,errors,missingVertices,missingEdges,resolution:errors.length||missingEdges?'REBUILD_FROM_NEW_SOURCE_REQUIRED':'RAW_EDGES_MATCH_REQUIRES_SERVICE_AND_DIRECTION_REVIEW'});
}}
const report={baseline:'f91c820cac511cbd8b8c66f974fc650dad0ee266',status:'INCOMPLETE',counts,totalLegacyErrors:counts.missingLicense+counts.missingWayProvenance,segments,policy:'No legacy artifact is reused in v2; errors remain unresolved until verified replacement is published.'};
fs.writeFileSync(path.join(root,'data/kr/v2/legacy-provenance-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({counts,totalLegacyErrors:report.totalLegacyErrors,legacySegments:segments.length,segmentsWithoutExactSourceEdges:segments.filter(s=>s.missingEdges).length},null,2));
