'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {bindStopsToShape}=require('./lib/kr-road-binding.cjs'),{validateRoute}=require('./lib/kr-canonical.cjs');
test('sparse actual road retains its corner and inserts collinear stop points',()=>{
 const shape=[[37,127],[37,127.01],[37.01,127.01]],stops=[{posY:37,posX:127.002,guganLen:0},{posY:37.002,posX:127.01,guganLen:1100},{posY:37.008,posX:127.01,guganLen:660}];
 const result=bindStopsToShape(shape,stops);assert(result.geometry.some(p=>p[0]===37&&p[1]===127.01));assert.equal(result.maximumOffsetKm,0);assert(result.indexes.every((n,i)=>!i||n>result.indexes[i-1]));
});
test('unrelated stops and disconnected source roads fail closed',()=>{
 assert.throws(()=>bindStopsToShape([[37,127],[37,127.01]],[{posY:37,posX:127},{posY:37.1,posX:127.01}]));
 assert.throws(()=>bindStopsToShape([[37,127],[38,127]],[{posY:37,posX:127},{posY:38,posX:127}]));
});
test('every recovered service preserves official direction, stop IDs and complete source edges',()=>{
 const dir=path.resolve(__dirname,'../data/kr/canonical'),batch=JSON.parse(fs.readFileSync(path.join(dir,'bus-recovered-batch.json'),'utf8'));
 for(const route of batch.routes){assert.deepEqual(validateRoute(route),[],route.id);const rid=route.id.replace('kr-bus-seoul-','');
  const read=kind=>{const fresh=path.join(dir,'bus-recovered-source',rid+'-'+kind+'.json.gz'),file=fs.existsSync(fresh)?fresh:path.join(dir,'bus-source/topis',rid+'-'+kind+'.json.gz');return JSON.parse(zlib.gunzipSync(fs.readFileSync(file))).rows};
  const shape=read('geometry').map(r=>[Number(r.posY),Number(r.posX)]).filter((p,i,a)=>!i||JSON.stringify(p)!==JSON.stringify(a[i-1]));
  const ordered=read('stops').sort((a,b)=>a.stationOrd-b.stationOrd),groups=[];for(const s of ordered){if(groups.at(-1)?.name!==s.dir)groups.push({name:s.dir,stops:[]});groups.at(-1).stops.push(s)}
  for(const journey of route.verifiedJourneys){const group=groups[Number(journey.directionId.split('-').at(-1))-1];assert.equal(group.name,journey.sourceDirection);assert.deepEqual(journey.stations.map(s=>s.sourceStopId),group.stops.map(s=>String(s.stnId)));
   const positions=journey.geometrySourcePositions;assert.equal(positions.length,journey.geometry.length);
   for(let i=0;i<positions.length;i++){const pos=positions[i],edge=Math.min(shape.length-2,Math.floor(pos)),t=pos-edge,a=shape[edge],b=shape[edge+1],expected=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];assert(Math.hypot(expected[0]-journey.geometry[i][0],expected[1]-journey.geometry[i][1])<1e-10);if(i){assert(pos>positions[i-1]);assert(Math.floor(pos)-Math.ceil(positions[i-1])<=1,'source corner skipped')}}
   for(let v=Math.ceil(positions[0]);v<=Math.floor(positions.at(-1));v++)assert(positions.includes(v),'original vertex omitted');
  }
 }
 console.log(JSON.stringify({recoveredRoutes:batch.routes.length,directions:batch.routes.reduce((n,r)=>n+r.verifiedJourneys.length,0)}));
});
