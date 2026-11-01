'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const {validateRoute,distance}=require('./lib/kr-canonical.cjs'),{encode,decode}=require('./lib/kr-payload.cjs');
const base=path.resolve(__dirname,'../data/kr/canonical'),dir=path.join(base,'tsbis-source');
const read=(kind,id)=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,kind+'-'+id+'.json.gz'))));
const inventory=new Map(JSON.parse(fs.readFileSync(path.join(dir,'inventory.json'),'utf8')).routes.map(r=>[r.route_id,r]));
const operators=JSON.parse(fs.readFileSync(path.join(dir,'operators.json'),'utf8')).operators;
(async()=>{const module=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.resolve(__dirname,'../js/route-payload.js'))).toString('base64'));
const ids=new Set;let routes=0,directions=0,vertices=0,codecCases=0;
for(const name of fs.readdirSync(base).filter(n=>/^tsbis-.*-batch\.json$/.test(n))){for(const route of JSON.parse(fs.readFileSync(path.join(base,name),'utf8')).routes){
 assert(!ids.has(route.id));ids.add(route.id);assert.deepEqual(validateRoute(route),[]);routes++;
 for(const j of route.verifiedJourneys){
 const rid=j.sourcePattern.routeId,meta=inventory.get(rid),calls=read('stops',rid),wfs=read('wfsstops',rid).features.map(f=>f.properties).sort((a,b)=>Number(a.sequence)-Number(b.sequence));
 assert.equal(meta.use_yn,'Y');assert.equal(route.operator.ko,operators[meta.company_id].name);assert.equal(calls[0].station_id,meta.st_sta_id);assert.equal(calls.at(-1).station_id,meta.ed_sta_id);
 assert.deepEqual(wfs.map(s=>[s.station_id,Number(s.sequence)]),calls.map(s=>[s.station_id,Number(s.sequence)]));
 const features=read('shape',rid).features.sort((a,b)=>Number(a.properties.up_down)-Number(b.properties.up_down)||Number(a.properties.link_seq)-Number(b.properties.link_seq)),shape=[];
 for(const f of features){const points=f.geometry.coordinates.map(p=>[p[1],p[0]]);if(shape.length)assert.deepEqual(shape.at(-1),points[0]);for(const p of points)if(!shape.length||JSON.stringify(p)!==JSON.stringify(shape.at(-1)))shape.push(p);}
 const p=j.sourcePattern,expected=calls.filter(s=>Number(s.sequence)>=p.startSequence&&Number(s.sequence)<=p.endSequence);assert.deepEqual(j.stations.map(s=>s.sourceStopId),expected.map(s=>s.station_id));
  if(j.directionId!=='complete'){assert(meta.md_sta_id&&Number(meta.md_sta_index)>0);assert(j.stations.some(s=>s.sourceStopId===meta.md_sta_id&&s.sourceSequence===Number(meta.md_sta_index)));}
  const positions=j.geometryEvidence.sourcePositions,kept=new Set;
  for(let i=0;i<positions.length;i++){const pos=positions[i],edge=Math.min(Math.floor(pos),shape.length-2),t=pos-edge;assert(!i||pos>positions[i-1]);const expected=shape[edge].map((v,k)=>v+t*(shape[edge+1][k]-v));assert(distance(expected,j.geometry[i])<1e-7);if(Number.isInteger(pos))kept.add(pos);}
  for(let n=Math.ceil(positions[0]);n<=Math.floor(positions.at(-1));n++)assert(kept.has(n),'original road corner lost');directions++;vertices+=j.geometry.length;
 }
 const payload=encode(route);assert.deepEqual(decode(payload).route,route);
 if(codecCases<10){assert.deepEqual((await module.decodeRoutePayload(payload)).route,route);await assert.rejects(()=>module.decodeRoutePayload({...payload,routeId:'wrong'}));codecCases++;}
 }}const result={passed:true,routes,directions,vertices,codecCases,checks:['current authoritative route ID','official company ID mapping','complete ordered stops and official midpoint','source directions join only at identical coordinates','every original road vertex retained','lossless Node and browser payload codec']};fs.writeFileSync('reports/kr-rebuild/nationwide-source-tests.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));})();
