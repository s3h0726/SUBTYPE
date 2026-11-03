'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const audit=read('data/th/namuwiki-station-names.json'),catalog=read('data/th/generated/names.json'),index=read('data/th/generated/index.json');
const byId=new Map(catalog.stations.map(s=>[s.id,s]));
const fromIndex=new Map(index.routes.flatMap(r=>(r.stationSequence||[]).map(s=>[s.id,s])));
const source=read('data/th/korean-urban.json');
const srtSource=fs.readFileSync(path.join(root,'data/th/korean-stations.txt'),'utf8');
const routeToKey={'th-bts-sukhumvit':'sukhumvit','th-bts-silom':'silom','th-bts-gold':'gold','th-bem-blue':'blue','th-bem-purple':'purple','th-ebm-yellow':'yellow','th-nbm-pink':'pink','th-aera1-arl':'arl','th-srtet-darkred':'darkred','th-srtet-lightred':'lightred'};
let checked=0;
for(const [id,entry] of Object.entries(audit.stations)){
 assert(entry.ko&&entry.source&&entry.th&&entry.en,id+' missing source/name');
 const catalogStation=byId.get(id),indexStation=fromIndex.get(id);
 assert(catalogStation,id+' missing catalog station');
 assert(indexStation,id+' missing indexed station');
 assert.equal(catalogStation.ko,entry.ko,id+' catalog Korean name');
 assert.equal(indexStation.ko,entry.ko,id+' indexed Korean name');
 assert.equal(catalogStation.th,entry.th,id+' Thai name preserved');
 assert.equal(catalogStation.en,entry.en,id+' English name preserved');
 if(id.startsWith('th-srt-')){
  const number=id.slice('th-srt-'.length);
  assert(srtSource.split(/\r?\n/).includes(number+'|'+entry.ko),id+' missing SRT Korean source');
 }else{
  const prefix=Object.keys(routeToKey).find(r=>id.startsWith(r+'-'));
  assert(prefix,id+' unknown urban source line');
  const key=id.includes('-MT0')?'pink-impact':routeToKey[prefix];
  assert(source[key].includes(entry.ko),id+' missing urban Korean source');
 }
 checked++;
}
const app=fs.readFileSync(path.join(root,'js/app.bundle.js'),'utf8');
assert(app.includes('thailandNameEvidence[id]?.ko'),'runtime must read audited Korean names');
assert(app.includes('data/th/namuwiki-station-names.json'),'runtime must fetch audited mapping');
assert.equal(checked,Object.keys(audit.stations).length);
console.log('Thailand Namuwiki name consistency PASS:',checked,'station corrections');
