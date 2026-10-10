#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const root=path.resolve(__dirname,'..');
const args=Object.fromEntries(process.argv.slice(2).flatMap((value,index,list)=>value.startsWith('--')?[[value.slice(2),list[index+1]]]:[]));
const master=String(args.master||'');
const slug=String(args.slug||'').replace(/[^a-z0-9-]/g,'');
if(!master||!slug)throw new Error('Usage: node tools/fetch-osm-route-master.js --master ID --slug file-slug');
const query=`[out:json][timeout:180];relation(${master});(._;>>;);out body qt;`;
const endpoints=[args.endpoint,'https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'].filter(Boolean);

(async()=>{
  let osm=null,endpoint='',lastError=null;
  for(const candidate of endpoints){try{const response=await fetch(candidate,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','User-Agent':'SUBTYPE-geometry-audit/1.0 (build-time; contact via project repository)'},body:new URLSearchParams({data:query})});if(!response.ok)throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0,300)}`);osm=await response.json();endpoint=candidate;break}catch(error){lastError=error}}
  if(!osm)throw new Error(`All Overpass endpoints failed: ${lastError?.message||'unknown error'}`);
  const stable=JSON.stringify(osm);
  const output={schemaVersion:1,source:{provider:'OpenStreetMap',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',relationId:Number(master),retrieved:new Date().toISOString().slice(0,10),endpoint,query,sha256:crypto.createHash('sha256').update(stable).digest('hex')},validation:{rawElementCount:osm.elements?.length||0,coordinateSystem:'WGS84 / EPSG:4326',transformation:'none'},osm};
  const relative=`data/kr/source/osm/${slug}-relation-${master}.json`,target=path.join(root,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',target:relative,elements:output.validation.rawElementCount,sha256:output.source.sha256},null,2));
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
