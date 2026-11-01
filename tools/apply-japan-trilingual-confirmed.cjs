#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/japan-trilingual-confirmed-corrections.json'),'utf8'));
function collect(dir,name){let out=[];function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name===name||name==='station-shards'&&/^stations-\d+\.json$/.test(e.name))out.push(p);}}walk(path.join(root,dir));return out.sort();}
const descriptors=[
 {key:'stations',files:collect('data/shared-stations','station-shards'),array:true},
 {key:'operators',files:collect('data/operators','operator.json'),array:false},
 {key:'lines',files:collect('data/lines','line.json'),array:false}
];
const changes=[];
for(const desc of descriptors){
 const mapping=new Map(manifest[desc.key].map(v=>[v.id,v]));
 if(mapping.size!==manifest[desc.key].length)throw Error('Duplicate manifest ID in '+desc.key);
 for(const file of desc.files){
  const contents=JSON.parse(fs.readFileSync(file,'utf8')),records=desc.array?contents:[contents];
  let dirty=false;
  for(const record of records){
   const patch=mapping.get(record.id);
   if(!patch)continue;
   mapping.delete(record.id);
   if(record.names?.ja!==patch.ja)throw Error('JA identity mismatch at '+record.id+' '+file);
   const changesForId=[];
   for(const field of ['kana','en','ko']){
    if(!(field in patch))continue;
    const before=record.names[field]||'',after=patch[field];
    if(before===after)continue;
    if(field==='en'&&!/[\u3040-\u30ff\u3400-\u9fff]/u.test(before))throw Error('EN field changed unexpectedly before audit: '+record.id);
    const verified=desc.key==='stations'?record.koVerified===true:record.sources?.koreanName?.verified===true;
    if(field==='ko'&&verified)throw Error('Do not replace independently verified Korean name: '+record.id);
    record.names[field]=after;changesForId.push({field,before,after});
   }
   if(changesForId.length){
    dirty=true;
    record.trilingualNameAudit={evidence:patch.reference,sourceNameJa:patch.ja,englishNameMethod:'reference-crosscheck',koreanNameMethod:patch.koreanNameStatus,verifiedKoreanName:false};
    changes.push({kind:desc.key,id:record.id,ja:patch.ja,file:path.relative(root,file).replace(/\\/g,'/'),reference:patch.reference,changes:changesForId});
   }
  }
  if(dirty)fs.writeFileSync(file,JSON.stringify(contents,null,2)+'\n');
 }
 if(mapping.size)throw Error('Missing manifest identities: '+desc.key+' '+[...mapping.keys()].join(', '));
}
const out=path.join(root,'reports/names/japan-confirmed-corrections-applied.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify({schemaVersion:1,scope:'only 44 previously contaminated Japanese source names',total:manifest.stations.length+manifest.lines.length+manifest.operators.length,changed:changes.length,changes},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',checked:44,changed:changes.length,byKind:Object.fromEntries(descriptors.map(x=>[x.key,changes.filter(v=>v.kind===x.key).length]))}));
