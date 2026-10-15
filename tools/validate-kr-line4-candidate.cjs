#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../data/kr/osm-candidates/kr-metro-4-unverified.geojson');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const assert=(condition,message)=>{if(!condition)throw Error('Line 4 candidate: '+message)};
assert(data.type==='FeatureCollection'&&data.features.length===1,'expected single line 4 feature');
const feature=data.features[0];
assert(String(feature.properties?.lineId)==='4','incorrect line');
assert(feature.geometry?.type==='MultiLineString','unsupported geometry');
const lines=feature.geometry.coordinates;
assert(lines.length>0,'no track segments');
let points=0;
for(const segment of lines){
 assert(segment.length>=2,'empty segment');
 for(const pair of segment){
  assert(Array.isArray(pair)&&pair.length>=2&&pair.slice(0,2).every(Number.isFinite),'invalid coordinates');
  assert(pair[0]>126&&pair[0]<128&&pair[1]>36&&pair[1]<38,'coordinate outside Seoul metropolitan envelope');
  points++;
 }
}
assert(points>=1000,'candidate unexpectedly sparse');
console.log('PASS: Line 4 candidate '+lines.length+' raw line pieces, '+points+' coordinates');
console.log('UNVERIFIED: piece ordering, station snapping, continuous tracks, current services, and geometryReady.');
