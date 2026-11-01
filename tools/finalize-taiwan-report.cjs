const fs=require('fs'),crypto=require('crypto');
const network=JSON.parse(fs.readFileSync('data/tw/generated/network.json')),report=JSON.parse(fs.readFileSync('data/tw/generated/report.json')),browser=JSON.parse(fs.readFileSync(process.argv.find(a=>a.startsWith('--browser='))?.slice(10)||'reports/taiwan/browser.json'));
if(browser.status!=='PASS'||browser.runs.length<13)throw Error('Representative browser evidence is incomplete');
const tested=new Set(browser.runs.map(r=>r.serviceId));
for(const id of tested)if(!network.patterns.some(p=>p.id===id))throw Error('Stale browser evidence for missing service '+id);
const held=JSON.parse(fs.readFileSync('data/tw/generated/held-services.json'));
report.heldTimetableRows=held.length;report.incompleteServiceVariants=new Set(held.map(s=>s.typeZh+'|'+s.callKeys.join('>'))).size;
report.playableValidated=tested.size;report.implementedUnverifiedDirections=network.patterns.length-tested.size;report.representativeCardsTested=new Set(browser.runs.map(r=>r.lineId)).size;report.playableStatusScope='Only the exact tested directional service IDs; other variants remain IMPLEMENTED_UNVERIFIED.';
for(const p of network.patterns)p.status=tested.has(p.id)?'PLAYABLE':'IMPLEMENTED_UNVERIFIED';
for(const op of report.operators){const runs=browser.runs.filter(r=>network.lines.find(l=>l.id===r.lineId)?.operatorId===op.operatorId);op.playableDirections=new Set(runs.map(r=>r.serviceId)).size;op.unverifiedDirections=op.directions-op.playableDirections;op.representativeCardsTested=new Set(runs.map(r=>r.lineId)).size;}
report.limitations=report.limitations.filter(s=>!s.startsWith('Taiwan is implemented-unverified'));
report.checks=JSON.parse(fs.readFileSync('reports/taiwan/checks.json'));
report.browserEvidence={file:process.argv.find(a=>a.startsWith('--browser='))?.slice(10)||'reports/taiwan/browser.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(process.argv.find(a=>a.startsWith('--browser='))?.slice(10)||'reports/taiwan/browser.json')).digest('hex'),scope:browser.scope};
fs.writeFileSync('data/tw/generated/report.json',JSON.stringify(report,null,2)+'\n');
// The status is a QA annotation. Track/service source inputs stay reproducible.
fs.writeFileSync('data/tw/generated/network.json',JSON.stringify(network)+'\n');
console.log(JSON.stringify({physicalLines:report.totalPhysicalLines,stations:report.uniqueOperatorStations,stationMemberships:report.totalStationRecords,servicePatterns:report.servicePatterns,directions:report.directions,playableDirections:report.playableValidated,unverifiedDirections:report.implementedUnverifiedDirections,research:report.researchRoutes}));
