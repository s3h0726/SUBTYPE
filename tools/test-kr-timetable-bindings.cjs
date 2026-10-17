const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {load,validate}=require('./lib/kr-network'),{verifyBinding}=require('./verify-kr-timetable-bindings');
const base=path.join(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8'));
const {maps}=validate(load(base)),bindings=read('timetable-service-bindings'),trips=read('seoulmetro-trip-candidates');
test('thirty-eight official complete patterns preserve the original twenty-three and all published day groups',()=>{
 const r=bindings.map(b=>verifyBinding(b,maps,trips));assert.equal(r.length,38);const count=rs=>rs.reduce((n,v)=>n+v.groups.reduce((s,g)=>s+g.trainCount,0),0);assert.equal(count(r.slice(0,23)),1999);assert.equal(count(r.slice(23)),272);assert.equal(count(r),2271);
 for(const v of r){assert.deepEqual(v.groups.map(g=>g.calendarLabel),['DAY','SAT','END']);assert(v.groups.every(g=>g.trains.every(t=>t.calls.length===v.calls.length)));assert(v.verificationScope.includes('not track/platform'))}
});
test('missing calendar, incomplete stops and nonmonotonic official clocks cannot certify a pattern',()=>{
 const b=bindings[0],eligible=trips.filter(t=>t.sourceId===b.sourceId&&t.officialLineCode===b.officialLineCode&&t.originOperationalName===b.origin&&t.destinationOperationalName===b.destination);
 assert.throws(()=>verifyBinding(b,maps,eligible.filter(t=>t.calendarLabel!=='END')),/NO_COMPLETE_END/);
 for(const mutation of [t=>t.calls.pop(),t=>t.calls[1].arrival='00:00:00',t=>delete t.calls[0].sourceRow,t=>t.calls[0].officialStationCode='wrong']){
  const changed=structuredClone(eligible);changed.forEach(mutation);assert.throws(()=>verifyBinding(b,maps,changed),/NO_COMPLETE_DAY/)
 }
 const changed=structuredClone(b);changed.calls[0].stopId='wrong';assert.throws(()=>verifyBinding(changed,maps,trips),/STOP_BINDING_DRIFT/)
});
