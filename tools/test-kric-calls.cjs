const test=require('node:test'),assert=require('node:assert/strict');
const {decodeKricTrip}=require('./lib/kric-calls');
const trip=(names,arrival,departure)=>({id:'fixture',calls:[{operationalStationName:names,arrival,departure,sourceRow:17,dataReferenceDate:'2022-08-31'}],reviewRequired:['CURRENT_TIMETABLE_VALIDITY','STOP_VERSUS_PASS']});
test('parallel KRIC cells join by source code while preserving station order',()=>{
 const t=decodeKricTrip(trip('014-가+015-나+016-다','015-05:36+016-05:38','016-05:39+014-05:35+015-05:37'));
 assert.deepEqual(t.calls.map(c=>[c.sourceSequence,c.operationalStationName,c.arrival,c.departure]),[['014','가',null,'05:35'],['015','나','05:36','05:37'],['016','다','05:38','05:39']]);
 assert(t.calls.every(c=>c.sourceRow===17&&c.dataReferenceDate==='2022-08-31'));
 assert.deepEqual(t.reviewRequired,['CURRENT_TIMETABLE_VALIDITY','STOP_VERSUS_PASS']);
});
test('descending alphanumeric keys, slash times and airport alternating fields decode exactly',()=>{
 const a=decodeKricTrip(trip('D19-가+D12-나',null,'D19-10:19/D12-  :'));
 assert.deepEqual(a.calls.map(c=>c.sourceSequence),['D19','D12']);assert.equal(a.calls[1].departure,null);assert.equal(a.calls[1].sourceTimeMarkers.departure,':');
 const b=decodeKricTrip(trip('001-가+002-나+003-다',null,'001+06:00+002+06:45+003+06:51'));
 assert.deepEqual(b.calls.map(c=>c.departure),['06:00','06:45','06:51']);
});
test('zero-time placeholders, operational names, repeated visits and raw single calls remain literal',()=>{
 const a=decodeKricTrip(trip('001-가+002-가','001-00:00+002-05:33','001-05:30+002-00:00'));
 assert.equal(a.calls[0].arrival,'00:00');assert.equal(a.calls[1].departure,'00:00');assert.equal(a.calls.length,2);
 const input=trip('신판교','05:30:00','05:30:30');assert.deepEqual(decodeKricTrip(input).calls,input.calls);
});
test('malformed columns retain review failures and cannot become partial matched trains',()=>{
 for(const [names,time] of [['001-가+001-나','001-05:30'],['001-가+002-나','003-05:30'],['001-가+002-나','001-05:99'],['001-가+002-나','운영시간 - 17:00 ~ 20:00']]){
  const a=decodeKricTrip(trip(names,null,time));assert.equal(a.calls.length,0);assert(a.decodeIssues.length);assert.deepEqual(a.unparsedRows,[17]);assert(a.reviewRequired.includes('UNPARSED_PACKED_CALLS'));
 }
});
test('decoding does not mutate the archived source cells',()=>{const input=trip('001-가+002-나',null,'001-05:30+002-05:32'),before=JSON.stringify(input);decodeKricTrip(input);assert.equal(JSON.stringify(input),before)});
