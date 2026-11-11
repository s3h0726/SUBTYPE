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
 'uk-elizabeth':['PARTIAL_SOURCE_REVIEW','https://content.tfl.gov.uk/elizabeth-line-17-may-12-december-2026.pdf','2026-05-17 to 2026-12-12 TfL schedule located; all 19 stored patterns require train/day-specific reconciliation'],
 'uk-tyne-wear-green':['PARTIAL_TERMINUS_CHECK','https://www-azure.nexus.org.uk/metro/timetables-and-stations/airport/timetable','Airport platform confirms trains toward South Hylton; intermediate trips not audited'],
 'uk-sheffield-yellow':['PARTIAL_TERMINUS_CHECK','https://www.travelsouthyorkshire.com/en-gb/timetabledetails/1996d28e-8689-453a-8426-328cde2a1f4c','Meadowhall Interchange to Middlewood normal terminals confirmed; past October temporary diversion separate']
};
const esc=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const fields=['country','route_id','operator_id','line_name','registered_directions','audit_status','checked_official_source','finding','next_source'];
const csv=[fields.join(',')];
assert.equal(index.routes.length,56);
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
