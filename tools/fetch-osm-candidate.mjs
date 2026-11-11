#!/usr/bin/env node
// Build-time OSM relation snapshot only. Never updates canonical rail geometry.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const args=process.argv.slice(2),arg=(name)=>args[args.indexOf(name)+1];
const id=args.includes('--relation')?arg('--relation'):null;
if(!/^\d{1,15}$/.test(id||'')){console.error('Usage: node tools/fetch-osm-candidate.mjs --relation <OSM_ROUTE_RELATION_ID>');process.exit(2)}
const root=path.resolve(import.meta.dirname,'..');
const outDir=path.join(root,'reports','osm','candidates');
const q='[out:xml][timeout:90];relation('+id+');(._;>>;);out meta;';
const endpoint='https://overpass.kumi.systems/api/interpreter';
const timeout=AbortSignal.timeout(110000);
const res=await fetch(endpoint,{method:'POST',body:new URLSearchParams({data:q}),headers:{'User-Agent':'SUBTYPE-geometry-review/1.0 (manual; https://github.com/s3h0726/SUBTYPE)','Content-Type':'application/x-www-form-urlencoded'},signal:timeout});
if(!res.ok)throw Error('Overpass HTTP '+res.status);
const max=50_000_000,reader=res.body.getReader(),chunks=[];let bytes=0;
while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>max){await reader.cancel();throw Error('OSM candidate exceeds 50 MB; use an offline regional extract')}chunks.push(value)}
const data=Buffer.concat(chunks.map(x=>Buffer.from(x)));
if(!data.toString('utf8',0,1500).includes('<osm'))throw Error('OSM XML not returned');
await fs.mkdir(outDir,{recursive:true});
const file='relation-'+id+'.osm',sha256=crypto.createHash('sha256').update(data).digest('hex');
await fs.writeFile(path.join(outDir,file),data);
await fs.writeFile(path.join(outDir,'relation-'+id+'.manifest.json'),JSON.stringify({relationId:id,source:endpoint,downloadedAt:new Date().toISOString(),sha256,bytes,license:'ODbL 1.0 / © OpenStreetMap contributors',status:'REVIEW_ONLY',appliedToGame:false},null,2)+'\n');
console.log(JSON.stringify({status:'REVIEW_ONLY',file:'reports/osm/candidates/'+file,bytes,sha256,appliedToGame:false}));
