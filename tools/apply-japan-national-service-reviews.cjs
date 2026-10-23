#!/usr/bin/env node
'use strict';
// Source-of-truth review: updates only the Japanese nationwide service catalog.
// Idempotent on previously reviewed catalogs; --check refuses stale output.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const file=path.join(root,'js/nationwide-service-catalog.js');
const source=fs.readFileSync(file,'utf8'),marker='window.TRT_NATIONWIDE_SERVICE_CATALOG=';
if(!source.includes(marker))throw Error('Japanese service catalog symbol missing');
const original=JSON.parse(source.split(marker)[1].trim().replace(/;\s*$/,''));
const review=JSON.parse(fs.readFileSync(path.join(root,'data/japan-national-service-reviews.json'),'utf8'));
const {applyJapanNationalServiceReviews}=require('./lib/japan-national-service-patch.cjs');
const corrected=applyJapanNationalServiceReviews(original,review);
const result=source.slice(0,source.indexOf(marker))+marker+JSON.stringify(corrected)+';\n';
if(process.argv.includes('--check')){
 if(result!==source)throw Error('Japanese operating service catalog requires regeneration');
}else if(result!==source)fs.writeFileSync(file,result);
const all=Object.values(corrected.lines).flatMap(line=>line.patterns);
console.log(JSON.stringify({status:'PASS',lines:Object.keys(corrected.lines).length,patterns:all.length,active:all.filter(p=>!p.status).length,retired:all.filter(p=>p.status==='discontinued').length,superseded:all.filter(p=>p.status==='superseded').length,reviewed:corrected.japanServiceReview.modifiedEntries},null,2));
