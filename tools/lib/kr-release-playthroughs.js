'use strict';
const crypto=require('node:crypto');const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
// A source approval alone never publishes an untested service. Evidence is an
// authored review of an actual report, pinned to the deployed engine and path.
function gateReleasedRoutes(routes,reviews,bundleSha256){
 const blocked=[],published=[];
 for(const route of routes){const journeys=route.verifiedJourneys.filter(j=>{const p=reviews.find(p=>p.serviceId===j.id),valid=p?.status==='verified'&&p.scope==='RELEASED'&&p.bundleSha256===bundleSha256&&p.journeySha256===digest({stations:j.stations,geometry:j.geometry,directedSegments:j.directedSegments})&&/^\d{4}-\d{2}-\d{2}$/.test(p.reviewedOn||'')&&/^https:\/\//.test(p.testReportUrl||'')&&['desktop','mobile'].every(k=>p[k]?.status==='PASS'&&p[k].completedStops===j.stations.length&&p[k].finishEvents===1);if(!valid)blocked.push({serviceId:j.id,reason:'PINNED_PC_MOBILE_RELEASE_REVIEW_REQUIRED'});return valid});
  if(journeys.length)published.push({...route,...journeys[0],id:route.id,verifiedJourneys:journeys,services:journeys.map(j=>j.service),playStatus:'RELEASED'});
 }return {routes:published,blocked};
}
module.exports={gateReleasedRoutes,digest};
