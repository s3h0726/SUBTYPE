#!/usr/bin/env node
// Review a GeoJSON line, station snapping, length and suspicious coordinate jumps.
// Input GeoJSON must have [longitude, latitude]. SUBTYPE runtime uses [latitude, longitude].
import fs from 'node:fs';
import path from 'node:path';
import {lineString,point,pointToLineDistance,length as turfLength,distance} from '@turf/turf';
const args=process.argv.slice(2),input=args[args.indexOf('--input')+1];
if(!input||input.startsWith('--')){console.error('Usage: node tools/audit-geometry-turf.mjs --input <candidate.geojson>');process.exit(2)}
const data=JSON.parse(fs.readFileSync(path.resolve(input),'utf8'));
const features=data.type==='FeatureCollection'?data.features:data.type==='Feature'?[data]:[{type:'Feature',geometry:data,properties:{}}];
const lines=features.filter(f=>f.geometry?.type==='LineString');
const stations=features.filter(f=>f.geometry?.type==='Point');
if(lines.length!==1)throw Error('Exactly one LineString is required per candidate');
const coordinates=lines[0].geometry.coordinates;
const valid=c=>Array.isArray(c)&&c.length>=2&&Number.isFinite(c[0])&&Number.isFinite(c[1])&&Math.abs(c[0])<=180&&Math.abs(c[1])<=90;
if(coordinates.length<2||!coordinates.every(valid))throw Error('Invalid WGS84 [longitude,latitude] coordinates');
const railway=lineString(coordinates),lengthKm=turfLength(railway,{units:'kilometers'});
const gaps=coordinates.slice(1).map((c,i)=>distance(point(coordinates[i]),point(c),{units:'kilometers'}));
const outliers=stations.map(f=>({station:f.properties?.name||f.properties?.id||'?',distanceM:Math.round(pointToLineDistance(point(f.geometry.coordinates),railway,{units:'kilometers'})*1000)})).filter(s=>s.distanceM>350);
const jumps=gaps.map((km,i)=>({index:i+1,km:Number(km.toFixed(3))})).filter(x=>x.km>5);
const result={status:!Number.isFinite(lengthKm)||lengthKm<=0||outliers.length?'FAIL':jumps.length?'REVIEW':'PASS',lengthKm:Number(lengthKm.toFixed(3)),vertices:coordinates.length,stationCount:stations.length,stationsBeyond350m:outliers,suspiciousJumpsAbove5km:jumps,canonicalDataChanged:false};
console.log(JSON.stringify(result,null,2));
if(result.status==='FAIL')process.exitCode=1;
