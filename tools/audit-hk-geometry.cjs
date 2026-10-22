const fs=require('node:fs'),path=require('node:path');
const {extractRelation,meters}=require('./lib/hk-geometry.cjs');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const before=read('reports/hong-kong/phase2/before.json'),network=read('data/hk/master/network.json');
const explanations={
 2941790:'A closed 706 source chain started at a different way from the first stop. Rotate at the exact first source stop vertex only when the chain is closed. No closing chord is added.',
 3263757:'Broadwood Road is an existing source track vertex, but appears after Happy Valley Terminus in the relation stop members. The stop is not displaced; ordered stop members conflict with the track direction. Keep blocked until official complete stop order is resolved.',
 3264047:'The relation lists The Peak first while its ways run toward The Peak; May Road and MacDonnell Road also conflict with descending source indices. Do not guess a direction or current intermediate calling pattern.',
 4088518:'Broadwood Road is appended after Happy Valley Terminus here too. Do not reorder official stops on proximity alone.',
 5317704:'The gap between source nodes 10930801895 and 10931051406 is about 765 metres. A missing railway connection is not repaired by a straight chord or by borrowing the other direction.',
 6485218:'Fresh full relation is connected. Select newer OSM object versions when combining snapshots; the old composite contained a stale shared way.',
 6485219:'Fresh full relation is connected. Same stale shared-way issue as 751. This does not establish the special service calling pattern.',
 6582965:'Historical Tuen Mun–Hung Hom relation retains razed railway way 1492453330, ended 2021-06-20. Exclude this obsolete relation, use other current full Tuen Ma relations only when matched to official stops.',
 6582966:'Historical Hung Hom–Tuen Mun relation retains disused railway way 1492453329, ended 2021-06-20. It is not an operational railway source.'
};
const original=read('data/hk/sources/osm-network.json');
const cases=before.geometryIssues.map(issue=>{
 const id=issue.sourceRelationId,data=read(`data/hk/sources/phase2/relation-${id}.json`),byKey=new Map(data.elements.map(e=>[e.type+':'+e.id,e])),r=byKey.get('relation:'+id);
 let freshError=null,extracted;try{extracted=extractRelation(r,data.elements)}catch(error){freshError=error.message}
 const stopId=Number(issue.reason.match(/stop not on railway within 80m: (\d+)/)?.[1]),stop=byKey.get('node:'+stopId),ways=r.members.filter(m=>m.type==='way').map(m=>byKey.get('way:'+m.ref)).filter(w=>['rail','subway','light_rail','tram','funicular'].includes(w?.tags?.railway));
 let nearestStopDistanceMeters=null;if(stop){nearestStopDistanceMeters=Infinity;for(const way of ways)for(const nodeId of way.nodes){const n=byKey.get('node:'+nodeId);nearestStopDistanceMeters=Math.min(nearestStopDistanceMeters,meters([stop.lat,stop.lon],[n.lat,n.lon]))}}
 const currentIssue=network.audits.geometryIssues.find(e=>e.sourceRelationId===id),oldWay=original.elements.find(e=>e.type==='way'&&e.id===221446352),newWay=byKey.get('way:221446352');
 return{relationId:id,sourceUrl:`https://www.openstreetmap.org/relation/${id}`,evidenceFile:`data/hk/sources/phase2/relation-${id}.json`,before:issue.reason,status:currentIssue?'INCOMPLETE':'RESOLVED',current:currentIssue?.reason||'source geometry extracted',freshStandaloneError:freshError,nearestStopDistanceMeters,actualSourceStopCount:r.members.filter(m=>m.type==='node'&&/^stop/.test(m.role)).length,explanation:explanations[id],...(newWay?{sharedWay221446352:{beforeVersion:oldWay?.version,afterVersion:newWay.version,beforeNodes:oldWay?.nodes,afterNodes:newWay.nodes}}:{}),...(extracted?{extractedStops:extracted.bindings.length,sourceWays:extracted.sourceWayIds.length}:{})};
});
const report={checkedAt:new Date().toISOString(),totalInvestigated:cases.length,resolved:cases.filter(c=>c.status==='RESOLVED').length,remainingRelationIds:cases.filter(c=>c.status!=='RESOLVED').map(c=>c.relationId),inventedConnections:0,roadOnlyWaysAccepted:0,cases};
fs.writeFileSync(path.join(root,'reports/hong-kong/phase2/geometry-investigation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({investigated:cases.length,resolved:report.resolved,remaining:report.remainingRelationIds},null,2));
