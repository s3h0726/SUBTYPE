#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),list=['gb','fr','de','es','it','ch','nl','at','be','pt','cz','pl'];
let errors=0,counts={};
for(const country of list){
 const dir=path.join(root,'data/eu',country),index=JSON.parse(fs.readFileSync(path.join(dir,'generated/index.json'),'utf8'));
 JSON.parse(fs.readFileSync(path.join(dir,'korean-names.json'),'utf8'));
 if(index.country?.id!==country||!Array.isArray(index.routes))throw Error('Invalid country index: '+country);
 const ids=new Set();let patterns=0;
 for(const route of index.routes){
  if(ids.has(route.id))throw Error('Duplicate '+route.id);ids.add(route.id);
  if(route.countryId!==country||!route.id.startsWith('eu-'+country+'-')||route.playable!==true||route.geometryReady!==true||!route.lazySource)throw Error('Invalid published route '+route.id);
  const filename=path.join(root,route.lazySource);
  if(!fs.existsSync(filename))throw Error('Missing lazy route '+route.id);
  const full=JSON.parse(fs.readFileSync(filename,'utf8')).route;
  if(full.id!==route.id||!full.sourceEvidence?.sourceUrl||!full.sourceEvidence?.license||!full.sourceEvidence?.snapshotDate)throw Error('Missing source evidence '+route.id);
  if(!Array.isArray(full.patterns)||!full.patterns.length)throw Error('No patterns '+route.id);
  for(const p of full.patterns){
   if(p.stations.length<2||p.geometry.length<3||!p.sourceTripId||!p.sourceShapeId)throw Error('Invalid shape '+p.id);
   let before=-1;
   for(const s of p.stations){
    if(!s.id.startsWith('eu-'+country+'-stop-')||s.nameReviewStatus!=='verified'||!s.koSource||!/[가-힣]/u.test(s.ko)||!Number.isInteger(s.geometryIndex)||s.geometryIndex<=before||s.geometryIndex>=p.geometry.length)throw Error('Invalid station '+s.id);
    before=s.geometryIndex;
   }
   patterns++;
  }
 }
 counts[country]={lines:index.routes.length,patterns};
}
console.log(JSON.stringify({status:errors?'FAIL':'PASS',countries:list.length,counts},null,2));
process.exitCode=errors?1:0;
