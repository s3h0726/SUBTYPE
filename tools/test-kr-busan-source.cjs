'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {validateRoute,distance}=require('./lib/kr-canonical.cjs'),{projection}=require('./lib/kr-road-binding.cjs');
const dir=path.resolve(__dirname,'../data/kr/canonical'),source=path.join(dir,'regional-busan-source');
const parse=(t,tag)=>[...t.matchAll(new RegExp('<'+tag+'\\s+([^>]+)/>','g'))].map(m=>Object.fromEntries([...m[1].matchAll(/(\w+)=["']([^"']*)["']/g)].map(m=>[m[1],m[2].replaceAll('&amp;','&').replaceAll('&quot;','"')])));
let routes=0,directions=0;
for(const suffix of process.argv.includes('--village')?['','-village']:['']){
 const batch=JSON.parse(fs.readFileSync(path.join(dir,'regional-busan'+suffix+'-batch.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));
 for(const route of batch.routes){assert.deepEqual(validateRoute(route),[],route.id);routes++;
  const shapeRef=route.sourceRefs.find(r=>r.url.includes('busLineCoordList'));
  const key=Object.keys(manifest).find(k=>manifest[k].url===shapeRef.url);assert(key,'shape source missing');
  const raw=fs.readFileSync(path.join(source,key),'utf8'),shape=parse(raw,'coord').slice(1).map(p=>[Number(p.value3),Number(p.value2)]);
  const detail=fs.readFileSync(path.join(source,key.replace('shape-','detail-')),'utf8'),rows=parse(detail,'line'),stops=rows.slice(2);
  const turn=route.directionEvidence.turnSequence-1;assert.equal(stops[turn].value1,route.directionEvidence.turnStopId.replace('kr-busan-stop-',''));
  assert.equal(route.verifiedJourneys.length,2);
  for(const [i,journey]of route.verifiedJourneys.entries()){
   assert.deepEqual(journey.stations.map(s=>s.sourceStopId),(i?stops.slice(turn):stops.slice(0,turn+1)).map(s=>s.value1));
   let sourceCursor=0;for(const point of journey.geometry){let matched=false;for(let k=sourceCursor;k<shape.length-1;k++){const p=projection(point,shape[k],shape[k+1]);if(p.offset<1e-7){sourceCursor=k;matched=true;break}}assert(matched,'published point leaves official road '+route.id)}
   directions++;
  }
  if(suffix){assert.equal(route.operator.ko,rows[0].text6.replaceAll('㈜','').replaceAll('(주)','').split(/[,·]/).map(s=>s.trim()).filter(Boolean).join('·'));assert(!/^(강서구|금정구|기장군|해운대구)$/.test(route.operator.ko),'district used as company')}
 }
}
console.log(JSON.stringify({passed:true,routes,directions,checks:['official road segments','official full direction calls','exact official turn stop','actual company field']}));
