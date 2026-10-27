#!/usr/bin/env node
'use strict';
// Keep one audited nationwide list as the source of truth. Compiles browser
// constants before building the application; never infer transfers by spelling.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const file='data/japan-named-transfer-groups.json';
const groups=JSON.parse(read(file)).groups;
if(!Array.isArray(groups)||groups.length<25)throw Error('JP_NAMED_TRANSFERS_TOO_FEW');
const seen=new Set,regions=new Set;
for(const group of groups){
 if(typeof group.id!=='string'||!group.id||seen.has(group.id))throw Error('DUPLICATE_TRANSFER_ID:'+group.id);
 seen.add(group.id);
 if(!Array.isArray(group.names)||new Set(group.names).size<2)throw Error('INVALID_TRANSFER_NAMES:'+group.id);
 if(!group.names.every(s=>typeof s==='string'&&s.trim()))throw Error('INVALID_NAME:'+group.id);
 if(!Array.isArray(group.center)||group.center.length!==2||!group.center.every(Number.isFinite))
   throw Error('INVALID_TRANSFER_POINT:'+group.id);
 if(!(group.radiusKm>=.1&&group.radiusKm<=1.0))throw Error('INVALID_TRANSFER_RADIUS:'+group.id);
 if(!/^https:\/\//.test(group.source||''))throw Error('MISSING_TRANSFER_EVIDENCE:'+group.id);
 if(typeof group.region!=='string')throw Error('MISSING_TRANSFER_REGION:'+group.id);
 regions.add(group.region);
}
if(regions.size<7)throw Error('JP_NAMED_TRANSFERS_NOT_NATIONWIDE');
const target='js/free-drive.js';
const old=read(target);
const begin=old.indexOf('const JP_NAMED_TRANSFER_GROUPS=');
const end=old.indexOf(';\nexport function japaneseNamedTransferNamesForRoute(',begin);
if(begin<0||end<begin)throw Error('JP_TRANSFER_RUNTIME_ANCHOR_NOT_FOUND');
const next=old.slice(0,begin)+'const JP_NAMED_TRANSFER_GROUPS='+JSON.stringify(groups,null,2)+old.slice(end);
if(next!==old)fs.writeFileSync(path.join(root,target),next);
console.log(JSON.stringify({status:'PASS',groups:groups.length,regions:[...regions],source:file}));
