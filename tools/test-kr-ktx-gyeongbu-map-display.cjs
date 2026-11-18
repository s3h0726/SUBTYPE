'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const test=require('node:test'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const {distance,readBatches,validateRoute}=require('./lib/kr-canonical.cjs');
const {indexTracks,nearest,samples}=require('./audit-kr-ktx-track-alignment.cjs');
const record=JSON.parse(fs.readFileSync(path.join(root,'data/kr/physical/ktx-gyeongbu-display.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'js/ktx-gyeongbu-map-display.js'),'utf8').replace(/\bexport\s+/g,'');
const ctx=vm.createContext({console,globalThis:{TRT_KTX_GYEONGBU_DISPLAY_REFERENCE:record}});
vm.runInContext(source+'\nglobalThis.fn={validateKtxMapReference,mapOnlyKtxJourneySegments};',ctx,{timeout:5000});
const {validateKtxMapReference,mapOnlyKtxJourneySegments}=ctx.globalThis.fn;
const routes=readBatches(root).flatMap(b=>b.routes||[]);
const find=id=>{
 for(const route of routes){const j=route.verifiedJourneys?.find(x=>x.id===id);if(j)return {route,j}}
 throw Error('KTX_JOURNEY_NOT_FOUND '+id);
};
const len=p=>p.reduce((v,pt,i)=>i?v+distance(p[i-1],pt):v,0);
test('map-only Haengsin and Daejeon references are real detailed train source tracks',()=>{
 assert.equal(validateKtxMapReference(record),record);
 for(const [key,corridor,min]of [['haengsinToSeoul',null,0],['daejeonToDongdaegu','경부고속선',.95]]){
  const ref=record.tracks[key];
  assert.equal(ref.mayUseForOperationalRouting,false);
  assert.ok(ref.geometry.length>30);
  assert.ok(ref.km>10);
  if(corridor){
   const tracks=indexTracks(JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8')));
   const obs=samples(ref.geometry,2).slice(1,-1);
   const covered=obs.filter(p=>nearest(p,corridor,tracks).distanceKm<=.3).length/obs.length;
   assert.ok(covered>=min,'display corridor follows original mapped high-speed railway');
  }
 }
});
test('Haengsin-origin KTX detour and Daejeon-to-Dongdaegu are corrected ONLY in displayed game map',()=>{
 const {route,j}=find('kr-network-pattern-3404bcd3714767b5');
 const input=JSON.stringify(j);
 const out=mapOnlyKtxJourneySegments(route,j,record);
 assert.ok(out&&out.length===j.directedSegments.length);
 const good={};
 for(let i=0;i<out.length;i++){
  assert.equal(out[i].fromStationId,j.directedSegments[i].fromStationId);
  assert.equal(out[i].toStationId,j.directedSegments[i].toStationId);
  const from=j.stations[i].ko,to=j.stations[i+1].ko;
  if(from==='행신'&&to==='서울역'||from==='대전'&&to==='동대구'){
   assert.ok(out[i].gameMapVisualCorrection);
   assert.ok(len(out[i].geometry)<len(j.directedSegments[i].geometry)-1);
   assert.deepEqual(Array.from(out[i].geometry[0]),Array.from(j.directedSegments[i].geometry[0]));
   assert.deepEqual(Array.from(out[i].geometry.at(-1)),Array.from(j.directedSegments[i].geometry.at(-1)));
   good[from+'-'+to]=[+len(j.directedSegments[i].geometry).toFixed(2),+len(out[i].geometry).toFixed(2)];
  }else assert.equal(JSON.stringify(out[i].geometry),JSON.stringify(j.directedSegments[i].geometry));
 }
 assert.ok(good['행신-서울역'][0]>=18&&good['행신-서울역'][1]<16.5);
 assert.ok(good['대전-동대구'][0]>150&&good['대전-동대구'][1]<130);
 assert.equal(JSON.stringify(j),input,'no mutation of source data');
 assert.deepEqual(validateRoute(route),[],'canonical route and timetables remain untouched');
 console.log('KTX_HAENGSIN_SOUTH_MAP_CORRECTED '+JSON.stringify(good));
});
test('already-correct Haengsin source track is not changed; reverse trains unchanged',()=>{
 const a=find('kr-continuity-pattern-ce3c807f4962c1fb');
 const out=mapOnlyKtxJourneySegments(a.route,a.j,record);
 const hi=a.j.stations.findIndex((s,i)=>s.ko==='행신'&&a.j.stations[i+1]?.ko==='서울역');
 assert.ok(out);
 assert.equal(JSON.stringify(out[hi].geometry),JSON.stringify(a.j.directedSegments[hi].geometry));
 const b=find('kr-continuity-pattern-59b7693515160112');
 assert.equal(mapOnlyKtxJourneySegments(b.route,b.j,record),null);
});
test('map-only overlay never changes via-station order or name and skips all non-KTX routes',()=>{
 const a=find('kr-network-pattern-3404bcd3714767b5');
 const original={...a.j,patternName:{ko:'ITX 새마을'},service:{...a.j.service,nameKo:'ITX 새마을'}};
 assert.equal(mapOnlyKtxJourneySegments(a.route,original,record),null);
 const result=mapOnlyKtxJourneySegments(a.route,a.j,record);
 for(let i=1;i<result.length;i++){
  const x=result[i-1].geometry.at(-1),y=result[i].geometry[0];
  assert.equal(JSON.stringify(x),JSON.stringify(y),'visual track must be connected at timetable calls');
 }
});
