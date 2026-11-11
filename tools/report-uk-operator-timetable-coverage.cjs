'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const index=read('data/uk/generated/index.json');
const net='https://www.thetram.net/timetables';
const edinburgh='https://edinburghtrams.com/plan-journey/timetables';
const glasgow='https://www.spt.co.uk/subway/subway-timetables/';
const statuses={
 'uk-net-hucknall-toton':['SHORT_TURNS_IMPLEMENTED',net,'3 verified late terminal patterns; full train-day timetable pending'],
 'uk-net-phoenix-clifton':['SHORT_TURNS_IMPLEMENTED',net,'3 verified late terminal patterns; full train-day timetable pending'],
 'uk-edinburgh-trams':['SHORT_TURNS_IMPLEMENTED',edinburgh,'1 early Gyle Centre-Newhaven trip and both full-length termini; full daily matrix pending'],
 'uk-glasgow-subway':['OFFICIAL_DIRECTION_SEQUENCE_MATCH',glasgow,'15 stations and both clockwise/anticlockwise loops match SPT, first/last sample checked'],
 'uk-elizabeth':['ONE_OFFICIAL_TRAIN_FULL_CALLS_MATCH','https://content.tfl.gov.uk/elizabeth-line-17-may-12-december-2026.pdf','TfL Mon-Fri Shenfield 04:44 → Liverpool Street 05:27: all 14 station calls and times recorded; 18 other directions and other trains remain unverified'],
 'uk-metrolink':['ALL_20_PATTERNS_SERVICE_WINDOWS_CLASSIFIED','https://tfgm.com/plan-a-journey/schedules/tram-schedule','20 registered directions matched to 10 official service types and day/time operating windows. Actual individual departures and exception calendars not fully audited'],
 'uk-tyne-wear-green':['PARTIAL_TERMINUS_CHECK','https://www-azure.nexus.org.uk/metro/timetables-and-stations/airport/timetable','Airport platform confirms trains toward South Hylton; intermediate trips not audited'],
 'uk-sheffield-yellow':['PARTIAL_TERMINUS_CHECK','https://www.travelsouthyorkshire.com/en-gb/timetabledetails/1996d28e-8689-453a-8426-328cde2a1f4c','Meadowhall Interchange to Middlewood normal terminals confirmed; past October temporary diversion separate'],
 'uk-heathrow-express':['MISSING_REVERSE_DIRECTION_CONFIRMED','https://www.heathrowexpress.com/timetable','Official operator runs Paddington to Heathrow T5 and Heathrow T5 to Paddington every 15 minutes; game publishes only Heathrow T5 to Paddington. Reverse real track geometry must be verified before adding.']
};
const esc=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const fields=['country','route_id','operator_id','line_name','registered_directions','audit_status','checked_official_source','finding','next_source'];
const csv=[fields.join(',')];
assert.equal(index.routes.length,56);
const metrolink=read('data/uk/generated/routes/uk-metrolink.json');
assert.equal(metrolink.patterns.filter(p=>p.officialSchedule).length,20,'Expected Metrolink audited operating rules');
const elizabeth=read('data/uk/generated/routes/uk-elizabeth.json');
assert.equal(elizabeth.patterns.filter(p=>p.officialTrainSample).length,1,'Expected one TfL audited actual train');
const heathrow=read('data/uk/generated/routes/uk-heathrow-express.json');
const heathrowNames=new Map(heathrow.stationCatalog.map(s=>[s.id,s.en]));
assert.equal(heathrow.patterns.length,1,'Heathrow Express direction count changed; reassess the official omission');
assert.deepEqual(heathrow.patterns[0].stationIds.map(x=>heathrowNames.get(x)),['Heathrow Terminal 5','Heathrow Terminals 2 & 3','London Paddington']);
let completed=0;
for(const entry of index.routes){
 const result=statuses[entry.id];
 if(result)completed++;
 const [status,url,notes]=result||['NOT_YET_AUDITED','','No current operator timetable mapped to all stored patterns'];
 csv.push([ 'UK',entry.id,entry.operatorId,entry.line?.en,entry.serviceCount,status,url,notes,entry.geometrySource?.officialUrl||''].map(esc).join(','));
}
assert.equal(completed,Object.keys(statuses).length);
assert.equal(index.routes.reduce((n,r)=>n+r.serviceCount,0),291);
const target=path.join(root,'docs/timetable-audit/UK_ROUTE_AUDIT_56.csv');
fs.writeFileSync(target,csv.join('\n')+'\n','utf8');
console.log(JSON.stringify({ukRoutes:index.routes.length,partiallyCompared:completed,notYetAudited:56-completed,directions:291}));
