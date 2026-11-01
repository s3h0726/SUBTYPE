'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {validateRoute,distance}=require('./lib/kr-canonical.cjs');
const base=path.resolve(__dirname,'../data/kr/canonical'),source=path.join(base,'provincial-gbis-source');
const wgs84=(x,y)=>[Math.atan(Math.sinh(Number(y)/6378137))*180/Math.PI,Number(x)/6378137*180/Math.PI];
const files=fs.readdirSync(base).filter(n=>/^provincial-gbis-.*-batch\.json$/.test(n));
assert(files.length,'no municipal batches');
const ids=new Set,stops=new Set;let directions=0,routes=0,points=0;
for(const file of files){
 const batch=JSON.parse(fs.readFileSync(path.join(base,file),'utf8'));
 for(const route of batch.routes){
  assert(!ids.has(route.id),route.id);ids.add(route.id);routes++;
  assert.deepEqual(validateRoute(route),[],route.id);
  const rid=route.id.replace('kr-bus-gbis-','');
  const read=kind=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(source,`${rid}-${kind}.json.gz`)))).result;
  const detail=read('detail').gg,rawGeometry=read('geometry').gg;
  assert(detail.route.adminNm.startsWith('경기도'),'non-Gyeonggi duplicate authority');
  assert.equal(route.municipalityKo,detail.route.adminNm.replace(/^경기도\s*/,'')||'경기도');
  for(const journey of route.verifiedJourneys){
   const direction=journey.directionId;
   const boarding=detail[direction].list.filter(s=>String(s.stationTp)!=='6'&&!/\((경유|미정차)\)/.test(s.stationNm));
   assert.deepEqual(journey.stations.map(s=>s.sourceStopId),boarding.map(s=>s.stationId),'actual independent direction stop order');
   const shape=rawGeometry[direction+'Line'].list.map(p=>wgs84(p.lon,p.lat)).filter((p,i,a)=>!i||JSON.stringify(p)!==JSON.stringify(a[i-1]));
   const positions=journey.geometryEvidence.sourcePositions;
   assert.equal(positions.length,journey.geometry.length);
   const originalPositions=new Set;
   for(let i=0;i<positions.length;i++){
    const pos=positions[i],edge=Math.min(Math.floor(pos),shape.length-2),t=pos-edge;
    assert(i===0||positions[i]>positions[i-1],'source shape order must increase');
    const expected=shape[edge].map((v,k)=>v+t*(shape[edge+1][k]-v));
    assert(distance(expected,journey.geometry[i])<1e-7,'point must lie on its exact original source road segment');
    if(Number.isInteger(pos))originalPositions.add(pos);
   }
   for(let pos=Math.ceil(positions[0]);pos<=Math.floor(positions.at(-1));pos++){
    assert(originalPositions.has(pos),'source road bend must remain intact');
   }
   for(const stop of journey.stations){assert(!/[A-Za-z\u3040-\u30ff\u3400-\u9fff]/u.test(stop.ko));stops.add(stop.id)}
   points+=journey.geometry.length;directions++;
  }
 }
}
const report={passed:true,municipalBatches:files.length,publicRoutes:routes,independentDirections:directions,
 uniqueStops:stops.size,actualRoadPoints:points,checks:['duplicate route IDs','current operating authority','canonical schema','Korean labels',
 'official independent direction stop sequences','pass-through node exclusion','exact source road segments','every source curve vertex preserved']};
fs.writeFileSync(path.join(base,'provincial-gbis-test-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
