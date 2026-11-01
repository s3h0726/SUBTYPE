const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),route=id=>read('data/hk/generated/routes/'+id+'.json');
test('all 103 previously released directions preserve geometry, station records and identities',()=>{
 const prior=JSON.parse(cp.execFileSync('git',['show','b86eb416:data/hk/generated/index.json'],{encoding:'utf8'}));assert.equal(prior.routes.filter(r=>r.playable).length,103);
 for(const m of prior.routes.filter(r=>r.playable)){const a=route(m.id),b=JSON.parse(cp.execFileSync('git',['show','b86eb416:'+m.lazySource],{encoding:'utf8',maxBuffer:8e6}));assert.equal(a.playable,true,m.id);assert.deepEqual(a.geometry,b.geometry,m.id);assert.deepEqual(a.stations,require('./lib/hk-missing-stations.cjs').with507PTransfer(b.stations),m.id);assert.equal(a.validationFingerprint,b.validationFingerprint,m.id);}
});
test('507P follows official 19 calls and joins exact directed source sections without a connector',()=>{
 const r=route('hk-light-rail-507p-morning'),a=route('hk-light-rail-615-osm-3680520'),b=route('hk-light-rail-507-osm-6481316'),stopIds=read('data/hk/master/missing-service-reviews.json').compoundServices[0].stopStationIds;
 assert.deepEqual(r.stations.map(s=>s.id),stopIds);assert.equal(r.stations.length,19);assert(!r.stations.some(s=>s.id==='hk-lr-110'),'615P-only Kei Lun must not be inserted');assert.equal(r.stations[4].sourceStopNodeId,1716515044);
 const first=a.stations.findIndex(s=>s.id==='hk-lr-100'),join=a.stations.findIndex(s=>s.id==='hk-lr-150');
 const expected=[...a.directedSegments.slice(first,join),...b.directedSegments.slice(1)];assert.equal(expected.length,18);
 r.directedSegments.forEach((e,i)=>{assert.deepEqual(e.geometry,expected[i].geometry);assert.deepEqual(e.sourceWayIds,expected[i].sourceWayIds);assert.equal(e.sourceUrl,expected[i].sourceUrl);});
 assert.equal(r.validWhen.type,'weekday-morning-special');assert.deepEqual(r.validWhen.departureTimes,['07:42']);assert.equal(r.validWhen.schoolHolidayCondition,'not-stated');assert.equal(r.canonicalLineId,'hk-light-rail-507p');assert.equal(r.lineTheme.colorVerified,false);
});
test('Racecourse Lok Ma Chau restores Sha Tin on an original railway vertex without changing ways',()=>{
 const raw=read('data/hk/sources/osm-network.json').elements,r=route('hk-east-rail-racecourse-4250434'),review=read('data/hk/master/missing-service-reviews.json').intermediateStops[0],relation=raw.find(e=>e.type==='relation'&&e.id===review.relationId);
 assert(!relation.members.some(m=>m.type==='node'&&m.ref===review.nodeId),'raw source must retain omission');assert(raw.find(e=>e.type==='way'&&e.id===review.wayId).nodes.includes(review.nodeId));
 assert.equal(r.stations.length,14);assert.deepEqual(r.stations.slice(5,9).map(s=>s.id),['hk-mtr-TAW','hk-mtr-SHT','hk-mtr-RAC','hk-mtr-UNI']);assert.equal(r.stations[6].sourceStopNodeId,review.nodeId);assert.equal(r.stations[6].stopPosition.snapMeters,0);assert.equal(r.stations.at(-1).id,'hk-mtr-LMC');assert.equal(r.validWhen.raceDaysOnly,true);
 const relationWays=new Set(relation.members.filter(m=>m.type==='way').map(m=>m.ref));assert(r.directedSegments.every(e=>e.sourceWayIds.every(w=>relationWays.has(w))));
});
test('HK TAB boarding starts at the new platform; normal movement and other countries retain next-stop behavior',()=>{
 const vm=require('node:vm'),elements=new Map,$=id=>{if(!elements.has(id))elements.set(id,{textContent:'',classList:{add(){},remove(){}},offsetWidth:0});return elements.get(id)},c={console,$,railDataRepository:{resolveRoute:r=>r},resolvePlayableRoute:r=>({stations:r.stations,geometry:r.geometry,segments:r.directedSegments}),renderGameMap:()=>Promise.resolve()};vm.createContext(c);
 vm.runInContext(fs.readFileSync('js/game.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';this.G=Game',c);
 const r=route('hk-light-rail-615-osm-3680520'),at=r.stations.findIndex(s=>s.id==='hk-lr-140');
 const run=(country,sameNode,sameRoute)=>{const g=Object.create(c.G.prototype),current={...r,countryId:country};let boarding,next;g.freeDriveAwaitingStart=false;g.freeDriveState={node:{key:sameNode?'tin-king':'kin-sang'},routeId:sameRoute?r.id:'another'};g.applyActiveBrand=()=>{};g.stationKoDisplay=s=>s||'';g.setFreeDriveStartTarget=s=>boarding=s;g.setFreeDriveTypingTarget=(_,s)=>next=s;
 g.renderFreeDriveState({node:{key:'tin-king'},routeId:r.id,route:current,station:r.stations[at],stationIndex:at,edges:[{routeId:r.id,direction:1,index:at+1,route:current}]});return{boarding,next};};
 assert.equal(run('hk',true,false).boarding.id,'hk-lr-140');assert.equal(run('hk',true,true).next.id,'hk-lr-150');assert.equal(run('hk',false,false).next.id,'hk-lr-150');assert.equal(run('jp',true,false).next.id,'hk-lr-150');assert.equal(run('kr',true,false).next.id,'hk-lr-150');
});
