#!/usr/bin/env node
'use strict';
// Read-only audit of all released Korean KTX journeys against OSM rail infrastructure.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
let validateRoute;
const anchors={
 '경부고속선':['광명','천안아산','오송','대전','김천구미','동대구','경주','울산','부산'],
 '호남고속선':['오송','공주','익산','정읍','광주송정'],
 '수서평택고속선':['수서','동탄','평택지제'],
 '강릉선':['만종','횡성','둔내','평창','진부','강릉']
};
const variants=/구포|밀양|수원|영등포|서대전|계룡|논산|김제|장성|동해|묵호|정동진|부전|경전선|중앙선|서해선|중부내륙/;
const clean=s=>String(s||'').replace(/역$/,'').replace(/\s/g,'').replace(/\([^)]*\)/g,'');
function expectedCorridor(from,to,names){
 const ai=names.indexOf(clean(from)),bi=names.indexOf(clean(to));
 if(ai>=0&&bi>=0&&names.slice(Math.min(ai,bi),Math.max(ai,bi)+1).some(s=>variants.test(s)))return null;
 for(const [label,stops]of Object.entries(anchors)){
  const a=stops.indexOf(clean(from)),b=stops.indexOf(clean(to));
  if(a>=0&&b>=0&&a!==b)return label;
 }
 return null;
}
function km(a,b){
 const r=Math.PI/180,dy=(a[0]-b[0])*r,dx=(a[1]-b[1])*r;
 return 12742*Math.asin(Math.min(1,Math.sqrt(Math.sin(dy/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dx/2)**2)));
}
function segmentDistanceKm(p,a,b){
 const ky=111.195,kx=Math.cos(p[0]*Math.PI/180)*111.195,x=(b[1]-a[1])*kx,y=(b[0]-a[0])*ky;
 const t=Math.min(1,Math.max(0,((p[1]-a[1])*kx*x+(p[0]-a[0])*ky*y)/(x*x+y*y||1)));
 return Math.hypot((p[1]-a[1]-(b[1]-a[1])*t)*kx,(p[0]-a[0]-(b[0]-a[0])*t)*ky);
}
function indexTracks(ways){
 const grid=new Map(),cellSize=.02,stats={},add=(key,edge)=>{if(!grid.has(key))grid.set(key,[]);grid.get(key).push(edge)};
 for(const way of ways){
  const tags=way.tags||{},name=[tags.name,tags['name:ko'],tags.ref].filter(Boolean).join(' ');
  if(!['rail','subway','light_rail'].includes(tags.railway))continue;
  const corridor=Object.keys(anchors).find(x=>name.includes(x))||
   (tags.highspeed==='yes'||parseFloat(tags.maxspeed)>=200?'unlabeled-highspeed':null);
  if(!corridor)continue;
  const points=way.coordinates||[];
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   if(!Array.isArray(a)||!Array.isArray(b)||km(a,b)>5)continue;
   const edge={a,b,corridor,wayId:way.id};
   const minY=Math.floor(Math.min(a[0],b[0])/cellSize),maxY=Math.floor(Math.max(a[0],b[0])/cellSize);
   const minX=Math.floor(Math.min(a[1],b[1])/cellSize),maxX=Math.floor(Math.max(a[1],b[1])/cellSize);
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)add(y+':'+x,edge);
   stats[corridor]=(stats[corridor]||0)+1;
  }
 }
 return{grid,stats,cellSize};
}
function nearest(p,corridor,tracks){
 const{grid,cellSize}=tracks,y=Math.floor(p[0]/cellSize),x=Math.floor(p[1]/cellSize);
 let best=Infinity,named=Infinity;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  for(const edge of grid.get((y+dy)+':'+(x+dx))||[]){
   if(edge.corridor!==corridor&&edge.corridor!=='unlabeled-highspeed')continue;
   const d=segmentDistanceKm(p,edge.a,edge.b);
   if(d<best)best=d;
   if(edge.corridor===corridor&&d<named)named=d;
  }
 }
 return{distanceKm:Number.isFinite(best)?+best.toFixed(3):null,namedDistanceKm:Number.isFinite(named)?+named.toFixed(3):null};
}
function samples(points,stepKm=1.5){
 if(points.length<2)return points;
 const out=[points[0]];let remaining=stepKm;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],len=km(a,b);if(len<=0)continue;
  let consumed=0;
  while(len-consumed>=remaining){
   const t=(consumed+remaining)/len;
   out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
   consumed+=remaining;remaining=stepKm;
  }
  remaining-=len-consumed;
 }
 out.push(points.at(-1));return out;
}
function auditJourney(journey,route,tracks){
 const statuses=[],issues=[],stations=journey.stations||[],geometry=journey.geometry||[],legs=journey.directedSegments||[];
 if(!stations.length||!geometry.length)return{id:journey.id,status:'INVALID',issues:['NO_GEOMETRY'],legs:[]};
 const structural=validateRoute({...route,verifiedJourneys:[journey],services:[journey.service],stations,geometry,directedSegments:legs});
 if(structural.length)issues.push(...structural.map(x=>'STRUCTURAL: '+x));
 let checkedLegs=0,matchedLegs=0;const names=stations.map(s=>clean(s.ko));
 for(let i=0;i<legs.length;i++){
  const corridor=expectedCorridor(stations[i]?.ko,stations[i+1]?.ko,names),points=legs[i]?.geometry||[];
  if(!corridor||points.length<2)continue;
  checkedLegs++;
  const drawnKm=points.reduce((n,p,k)=>k?n+km(points[k-1],p):n,0),straightKm=km(points[0],points.at(-1));
  const obs=samples(points).slice(1,-1).map(p=>({p,...nearest(p,corridor,tracks)}));
  const known=obs.filter(x=>x.distanceKm!==null),matched=known.filter(x=>x.distanceKm<=.3);
  const named=obs.filter(x=>x.namedDistanceKm!==null&&x.namedDistanceKm<=1);
  const coverage=obs.length?matched.length/obs.length:0,density=obs.length?known.length/obs.length:0,namedDensity=obs.length?named.length/obs.length:0;
  let status='REVIEW_REFERENCE_GAP';
  if(drawnKm>20&&drawnKm/Math.max(straightKm,1)>1.8)status='REVIEW_DETOUR';
  else if(density>=.65&&coverage<.6&&namedDensity>=.2)status='REVIEW_ALIGNMENT';
  else if(density>=.75&&coverage>=.8){status='MATCH';matchedLegs++}
  const mismatch=known.filter(x=>x.distanceKm>1).slice(0,8).map(x=>({lat:+x.p[0].toFixed(5),lon:+x.p[1].toFixed(5),offsetKm:x.distanceKm}));
  statuses.push({from:names[i],to:names[i+1],corridor,status,drawnKm:+drawnKm.toFixed(2),straightKm:+straightKm.toFixed(2),coverage:+coverage.toFixed(3),referenceDensity:+density.toFixed(3),namedDensity:+namedDensity.toFixed(3),mismatch});
 }
 if(statuses.some(x=>x.status==='REVIEW_ALIGNMENT'||x.status==='REVIEW_DETOUR'))issues.push('TRACK_DEVIATION_REQUIRES_REVIEW');
 if(statuses.some(x=>x.status==='REVIEW_REFERENCE_GAP'))issues.push('INSUFFICIENT_OSM_CORRIDOR_REFERENCE');
 return{id:journey.id,routeId:route.id,name:journey.patternName?.ko||journey.service?.nameKo,stations:stations.map(x=>x.ko),checkedLegs,matchedLegs,status:issues.some(x=>x.startsWith('STRUCTURAL'))?'INVALID':issues.length?'REVIEW':'MATCH',issues,legs:statuses};
}
function main(){
 const{readBatches,assembleCanonicalRoutes,validateRoute:check}=require('./lib/kr-canonical.cjs');validateRoute=check;
 const tracks=indexTracks(read('data/kr/v2/source/osm-ways.json'));
 const{routes,rejected}=assembleCanonicalRoutes(readBatches(root));
 const ktx=routes.filter(r=>r.countryId==='kr'&&r.mode==='high_speed_rail'&&!/SRT|에스알티/.test(r.line?.ko||'')&&
  (r.verifiedJourneys||[]).some(j=>/KTX|케이티엑스|고속철도|고속선/.test([j.patternName?.ko,j.service?.nameKo,r.line?.ko].join(' '))));
 const results=ktx.flatMap(r=>(r.verifiedJourneys||[]).filter(j=>!/SRT|에스알티/.test([j.patternName?.ko,j.service?.nameKo].join(' '))||/KTX|케이티엑스/.test([j.patternName?.ko,j.service?.nameKo].join(' '))).map(j=>auditJourney(j,r,tracks)));
 const summary={routes:ktx.length,journeys:results.length,checkedLegs:results.reduce((a,r)=>a+r.checkedLegs,0),matchedLegs:results.reduce((a,r)=>a+r.matchedLegs,0),byStatus:{},referenceEdges:tracks.stats,compiledRejected:rejected.length};
 for(const r of results)summary.byStatus[r.status]=(summary.byStatus[r.status]||0)+1;
 const report={checkedAt:new Date().toISOString(),method:'Read-only comparison to mapped OSM high-speed track ways; conventional service diversions are excluded; reference gaps require review',summary,results};
 const out=path.join(root,'reports/kr-ktx-track-alignment.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
 const problems=results.filter(r=>r.issues.length).sort((a,b)=>b.legs.filter(x=>x.status==='REVIEW_ALIGNMENT'||x.status==='REVIEW_DETOUR').length-a.legs.filter(x=>x.status==='REVIEW_ALIGNMENT'||x.status==='REVIEW_DETOUR').length);
 for(const r of problems.slice(0,60))console.log(JSON.stringify({route:r.routeId,id:r.id,name:r.name,issues:r.issues,legs:r.legs.filter(x=>x.status!=='MATCH').slice(0,12)}));
 if(process.argv.includes('--strict')&&(summary.byStatus.INVALID||summary.byStatus.REVIEW))process.exitCode=1;
}
if(require.main===module)main();
module.exports={km,segmentDistanceKm,expectedCorridor,samples,indexTracks,nearest,auditJourney};
