#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {loadStations,read}=require('./lib/line-workspaces'),root=path.resolve(__dirname,'..'),master=loadStations().map;
const file=path.join(root,'data/tokyo-service-patterns.json'),patterns=read(file);let destinationFields=0;
for(const d of patterns.destinations){const s=master.get(d.stationId);if(!s||d.names.ja!==s.names.ja)continue;for(const f of ['ko','en'])if(d.names[f]!==s.names[f]){d.names[f]=s.names[f];destinationFields++}}
fs.writeFileSync(file,JSON.stringify(patterns,null,2)+'\n');
patterns.branches=patterns.branches.map(b=>({...b,geometryData:b.geometrySource?read(path.join(root,b.geometrySource)):null}));
const serviceFile=path.join(root,'js/service-data.js'),oldService=fs.readFileSync(serviceFile,'utf8');
const marker=/window\.TRT_TOKYO_SERVICE_PATTERNS=[^\r\n]+;/;
if(!marker.test(oldService))throw Error('Missing Tokyo service catalog assignment');
const service=oldService.replace(marker,'window.TRT_TOKYO_SERVICE_PATTERNS='+JSON.stringify(patterns)+';');
fs.writeFileSync(serviceFile,service);
for(const script of ['build-line-workspaces.js','build-japan-lazy-catalog.cjs','build-app-bundle.js','export-korean-names.js','audit-japan-station-registry.cjs'])cp.execFileSync(process.execPath,[path.join(__dirname,script)],{cwd:root,stdio:'inherit'});
const index=path.join(root,'index.html'),hash=crypto.createHash('sha256').update(service).digest('hex').slice(0,12);
fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace(/(\.\/js\/service-data\.js)(?:\?v=[^"']*)?/g,'$1?v='+hash));
console.log(JSON.stringify({status:'PASS',destinationFields,japanOnlyBuild:true}));
