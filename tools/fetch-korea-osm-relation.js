#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const https=require('https');
const crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
const value=name=>args[args.indexOf(name)+1];
const relationId=value('--relation');
const slug=value('--slug');
if(!/^\d+$/.test(relationId||'')||!/^[a-z0-9-]+$/.test(slug||''))throw new Error('Usage: --relation <numeric OSM relation id> --slug <route-slug>');
const query=`[out:json][timeout:180];relation(${relationId});(._;>>;);out body qt;`;
const body=new URLSearchParams({data:query}).toString();
const request=https.request({hostname:'overpass-api.de',path:'/api/interpreter',method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body),'user-agent':'SUBTYPE-Korea-rebuild/1.0 (source audit)'}},response=>{
  const chunks=[];
  response.on('data',chunk=>chunks.push(chunk));
  response.on('end',()=>{
    if(response.statusCode!==200)throw new Error(`Overpass HTTP ${response.statusCode}: ${Buffer.concat(chunks).toString('utf8').slice(0,500)}`);
    const raw=Buffer.concat(chunks),payload=JSON.parse(raw.toString('utf8'));
    const relation=payload.elements?.find(element=>element.type==='relation'&&String(element.id)===relationId);
    if(!relation)throw new Error(`OSM relation ${relationId} missing from response`);
    const output={schemaVersion:1,source:{provider:'OpenStreetMap',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',relationId:Number(relationId),retrieved:'2026-10-10',endpoint:'https://overpass-api.de/api/interpreter',query,sha256:crypto.createHash('sha256').update(raw).digest('hex')},validation:{status:'raw-not-topology-verified',geometryReady:false},osm:payload};
    const target=path.join(root,'data/kr/source/osm',`${slug}-relation-${relationId}.json`);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,JSON.stringify(output)+'\n');
    console.log(JSON.stringify({status:'IMPORTED_FOR_REVIEW',relationId:Number(relationId),slug,elements:payload.elements.length,target:path.relative(root,target).replaceAll('\\','/'),geometryReady:false},null,2));
  });
});
request.setTimeout(200000,()=>request.destroy(new Error('Overpass request timed out')));
request.on('error',error=>{console.error(error.stack||error.message);process.exitCode=1});
request.end(body);
