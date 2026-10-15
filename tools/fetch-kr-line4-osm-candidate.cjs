#!/usr/bin/env node
'use strict';
// Download an OSM-derived Line 4 candidate for offline inspection. Never publish it as a verified railway track.
const fs=require('node:fs');
const path=require('node:path');
const URL='https://raw.githubusercontent.com/matassp/seoul-isochrone/main/public/data/lines.geojson';
const output=path.resolve(__dirname,'../data/kr/osm-candidates/kr-metro-4-unverified.geojson');
const MAX_BYTES=15_000_000;
(async()=>{
 const response=await fetch(URL,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('upstream HTTP '+response.status);
 const body=await response.text();
 if(Buffer.byteLength(body)>MAX_BYTES)throw Error('candidate oversized');
 const geo=JSON.parse(body);
 if(geo.type!=='FeatureCollection'||!Array.isArray(geo.features))throw Error('unexpected GeoJSON collection');
 const matches=geo.features.filter(f=>String(f?.properties?.lineId??f?.properties?.line??f?.properties?.id??f?.properties?.ref??'').replace(/^(line_|Line )/i,'')==='4');
 if(!matches.length)throw Error('no uniquely identifiable Line 4 feature; inspect upstream schema');
 const geometries=matches.flatMap(f=>f.geometry?.type==='LineString'?[f.geometry.coordinates]:f.geometry?.type==='MultiLineString'?f.geometry.coordinates:[]);
 if(!geometries.length||geometries.some(coords=>coords.length<2||coords.some(p=>!Array.isArray(p)||p.length<2||p.slice(0,2).some(v=>typeof v!=='number'||!Number.isFinite(v)))))
  throw Error('missing or invalid Line 4 coordinates');
 const data={type:'FeatureCollection',features:matches};
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(data)+'\n');
 console.log('Candidate extracted:',matches.length,'features;',geometries.reduce((n,g)=>n+g.length,0),'points');
 console.log('UNVERIFIED: no station snapping, branch continuity, or actual track geometry validation; do not mark geometryReady.');
})().catch(e=>{console.error(e);process.exitCode=1});
