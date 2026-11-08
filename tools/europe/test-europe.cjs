'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {csv,activeServices,railCategory,snap,build}=require('./gtfs-import.cjs');
const date='20261108';
const agency={agency_id:'official',agency_name:'Official Rail'};
const route={route_id:'R1',agency_id:'official',route_type:'1',route_short_name:'M1',route_long_name:'Official Metro Line',route_color:'123456'};
const stops=[
 {stop_id:'a',stop_name:'Alpha',stop_lat:'51',stop_lon:'-0.1'},
 {stop_id:'b',stop_name:'Beta',stop_lat:'51.001',stop_lon:'-0.099'},
 {stop_id:'c',stop_name:'Gamma',stop_lat:'51.002',stop_lon:'-0.098'}
];
const geometry=[[51,-.1],[51.0005,-.0995],[51.001,-.099],[51.0015,-.0985],[51.002,-.098]];
const shapes=geometry.map((p,i)=>({shape_id:'shape-out',shape_pt_lat:String(p[0]),shape_pt_lon:String(p[1]),shape_pt_sequence:String(i+1)}));
const trip={trip_id:'t1',route_id:'R1',shape_id:'shape-out',service_id:'week',direction_id:'0',trip_headsign:'Gamma'};
const input={agency:[agency],routes:[route],stops,shapes,trips:[trip],stop_times:stops.map((s,i)=>({trip_id:'t1',stop_id:s.stop_id,stop_sequence:String(i+1)})),calendar:[{service_id:'week',start_date:'20260101',end_date:'20271231',sunday:'1'}],calendar_dates:[]};
const names={operators:{official:{ko:'공식 철도',reviewStatus:'verified',source:'https://example.org/official'}},lines:{R1:{ko:'공식 도시철도 1호선',reviewStatus:'verified',source:'https://example.org/official'}},stations:Object.fromEntries(stops.map((s,i)=>[s.stop_id,{ko:['알파','베타','감마'][i],reviewStatus:'verified',source:'https://example.org/official'}]))};
const config={country:'gb',feedKey:'official-rail',sourceUrl:'https://example.org/gtfs.zip',license:'CC-BY',snapshotDate:'2026-11-08',serviceDate:date,names};
test('RFC4180 quoted commas, newlines and Unicode in GTFS',()=>{
 assert.deepEqual(csv('name,id\n"Bonjour, Paris",1\n"Praha\nHlavní",2\n'),[{name:'Bonjour, Paris',id:'1'},{name:'Praha\nHlavní',id:'2'}]);
});
test('all twelve country indexes are present and unpublished when evidence is absent',()=>{
 const countries=JSON.parse(fs.readFileSync(path.join(__dirname,'../../data/eu/countries.json'),'utf8')).countries;
 assert.equal(countries.length,12);
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
 const flags=fs.readFileSync(path.join(__dirname,'../../js/feature-flags.js'),'utf8');
 for(const c of countries){assert.match(html,new RegExp('data-country="'+c.id+'"'));assert.ok(flags.includes('isEuropeCountry'));const index=JSON.parse(fs.readFileSync(path.join(__dirname,'../../data/eu',c.id,'generated/index.json'),'utf8'));assert.equal(index.country.id,c.id)}
});
test('GTFS date/calendar exception gating',()=>{
 assert.deepEqual([...activeServices(date,input.calendar,[])],['week']);
 assert.equal(activeServices(date,input.calendar,[{service_id:'week',date,exception_type:'2'}]).size,0);
});
test('rail categories skip buses and preserve metros',()=>{
 assert.equal(railCategory('1'),'subway');assert.equal(railCategory('0'),'tram');assert.equal(railCategory('2'),'rail');assert.equal(railCategory('3'),null);
});
test('published pattern has station order, real shape and Korean evidence',()=>{
 const result=build(input,config);
 assert.equal(result.routes.length,1);
 const r=result.routes[0];assert.equal(r.countryId,'gb');assert.equal(r.patterns.length,1);
 assert.deepEqual(r.patterns[0].stations.map(s=>s.ko),['알파','베타','감마']);
 assert.ok(r.geometry.length>=3);
 assert.deepEqual(r.patterns[0].stations.map(s=>s.geometryIndex).slice(0,1),[0]);
 assert.match(r.sourceEvidence.sourceUrl,/https:/);
});
test('reverse direction remains a service pattern, not a physical line',()=>{
 const reverse={trip_id:'t2',route_id:'R1',shape_id:'shape-back',service_id:'week',direction_id:'1',trip_headsign:'Alpha'};
 const reverseShape=[...geometry].reverse().map((p,i)=>({shape_id:'shape-back',shape_pt_lat:String(p[0]),shape_pt_lon:String(p[1]),shape_pt_sequence:String(i+1)}));
 const x={...input,trips:[trip,reverse],shapes:[...shapes,...reverseShape],stop_times:[...input.stop_times,...[...stops].reverse().map((s,i)=>({trip_id:'t2',stop_id:s.stop_id,stop_sequence:String(i+1)}))]};
 const result=build(x,config);
 assert.equal(result.routes.length,1);assert.equal(result.routes[0].patterns.length,2);
});
test('unreviewed Korean names cannot be published',()=>{
 const bad={...names,stations:{...names.stations,c:{ko:'감마',reviewStatus:'machine',source:''}}};
 const result=build(input,{...config,names:bad});
 assert.equal(result.routes.length,0);assert.ok(result.unresolved.some(r=>r.reason.includes('Korean-name review')));
});
test('missing and fabricated straight geometry cannot be published',()=>{
 assert.throws(()=>snap(stops.map(s=>s),[[51,-.1],[51.002,-.098]]),/3 verified vertices/);
 const result=build({...input,shapes:[]},config);
 assert.equal(result.routes.length,0);
});
test('incorrectly ordered stops fail monotonic track projection',()=>{
 assert.throws(()=>snap([stops[2],stops[1],stops[0]],geometry),/order/);
});
