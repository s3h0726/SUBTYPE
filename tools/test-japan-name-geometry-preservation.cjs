#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const base=require('../data/source-audit/japan-name-corrections-20261101.json').rebasedOn;
const index=require('../data/generated/line-index.json');
const files=index.routes.map(r=>'data/generated/routes/'+r.id+'.json');
const data=cp.execFileSync('git',['cat-file','--batch'],{input:files.map(p=>base+':'+p+'\n').join(''),maxBuffer:512000000});
let offset=0,count=0;const mismatches=[];
const shape=r=>({id:r.id,operatorId:r.operatorId,loop:r.loop,playable:r.playable,geometryReady:r.geometryReady,geometry:r.geometry,directedSegments:r.directedSegments,missingSegments:r.missingSegments,stations:r.stations.map(s=>({id:s.id,order:s.order,latitude:s.latitude,longitude:s.longitude,geometryIndex:s.geometryIndex,transfers:s.transfers,transferStationId:s.transferStationId})),services:r.services.map(s=>({id:s.id,stops:s.stops}))});
for(const file of files){const end=data.indexOf(10,offset),header=data.subarray(offset,end).toString();offset=end+1;if(header.endsWith(' missing'))throw Error('BASELINE_ROUTE_MISSING:'+file);const size=Number(header.split(' ').at(-1)),old=JSON.parse(data.subarray(offset,offset+size)).route;offset+=size+1;const now=JSON.parse(fs.readFileSync(file)).route;if(JSON.stringify(shape(old))!==JSON.stringify(shape(now)))mismatches.push(now.id);count++}
assert.deepEqual(mismatches,[],'Name build changed track/platform/transfer/service identity');
console.log(JSON.stringify({status:'PASS',routes:count,baseline:base,stationIdsAndPlatformsUnchanged:true,trackGeometryUnchanged:true,transfersAndServiceStopIdsUnchanged:true}));
