#!/usr/bin/env node
// GTX-A south: inspect exact OSM ways already pinned in the Korean source store.
// Read-only source diagnosis: never publishes synthetic railway coordinates.
'use strict';
const fs=require('node:fs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ways=read('data/kr/v2/source/osm-ways.json');
const services=read('data/kr/v2/services.json');
const stops=read('data/kr/v2/stops.json');
const stations=read('data/kr/v2/stations.json');
const geometry=read('data/kr/v2/geometry.json');
const named=[['수서',37.487444,127.102111],['성남',37.39472,127.11944],['구성',37.29861,127.10556],['동탄',37.201167,127.095111]];
const km=(a,b)=>{let R=Math.PI/180;return 111.195*Math.hypot(a[0]-b[0],(a[1]-b[1])*Math.cos(((a[0]+b[0])/2)*R))};
const near=(c,a,b)=>{const x=Math.cos(c[0]*Math.PI/180),ux=(b[1]-a[1])*x,uy=b[0]-a[0],vx=(c[1]-a[1])*x,vy=c[0]-a[0],t=Math.max(0,Math.min(1,(ux*vx+uy*vy)/(ux*ux+uy*uy||1))),p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];return{p,d:km(c,p),t}};
const rail=ways.filter(w=>w.tags?.railway==='rail'&&w.coordinates?.some(p=>p[0]>=37.15&&p[0]<=37.53&&p[1]>=126.98&&p[1]<=127.21));
const classify=w=>{const tags=w.tags||{};return{name:tags.name||null,usage:tags.usage||null,service:tags.service||null,tunnel:tags.tunnel||null,maxspeed:tags.maxspeed||null,highspeed:tags.highspeed||null,railway:tags.railway||null,passenger:tags.passenger||null}};
console.log('SOURCE_TOTAL',JSON.stringify({ways:ways.length,services:services.length,stops:stops.length,geometry:geometry.length,railInBbox:rail.length}));
console.log('CLASSIFICATIONS',JSON.stringify(Object.entries(rail.reduce((m,w)=>{const t=w.tags||{};let key=JSON.stringify({railway:t.railway,usage:t.usage,name:t.name||'',tunnel:t.tunnel});m[key]=(m[key]||0)+1;return m},{})).sort((a,b)=>b[1]-a[1]).slice(0,30)));
for(const [name,lat,lon] of named){const c=[lat,lon],closest=rail.map(w=>{let best=Infinity,index=-1,at=null;for(let i=1;i<w.coordinates.length;i++){const s=near(c,w.coordinates[i-1],w.coordinates[i]);if(s.d<best){best=s.d;index=i;at=s.p}}return{wayId:String(w.id),dKm:Number(best.toFixed(4)),index,point:at,nodes:w.nodeIds.length,...classify(w)}}).sort((a,b)=>a.dKm-b.dKm).slice(0,12);
 console.log('NEAR_STATION',name,JSON.stringify(closest))}
const byId=new Map(geometry.map(g=>[g.id,g])),stopId=new Map(stops.map(s=>[s.id,s])),stationId=new Map(stations.map(s=>[s.id,s]));
for(const s of services.filter(s=>['kr-osm-service-17413294','kr-osm-service-17413296'].includes(s.id)||s.stops?.some(c=>/수서/.test(stationId.get(stopId.get(c.stopId)?.stationId)?.names?.ko||''))&&s.stops?.some(c=>/동탄/.test(stationId.get(stopId.get(c.stopId)?.stationId)?.names?.ko||'')))){
 console.log('MATCHED_SERVICE',JSON.stringify({id:s.id,name:s.names,passengerLineId:s.passengerLineId,issues:s.issues,paths:s.paths?.map(p=>({wayId:byId.get(p.geometryId)?.sourceRef?.id,reverse:p.reverse,nodeCount:byId.get(p.geometryId)?.coordinates?.length})).slice(0,18),pathCount:s.paths?.length,stops:s.stops?.map(c=>{const st=stopId.get(c.stopId),station=stationId.get(st?.stationId);return {name:station?.names?.ko,stopId:c.stopId,geometryIndex:c.geometryIndex,node:st?.osmNodeId,coords:st?.coordinates}})}).slice(0,10000))
}

console.log('NAMED_STOPS',JSON.stringify(stops.filter(s=>{const n=stationId.get(s.stationId)?.names?.ko||'';return /성남|수서|구성|동탄/.test(n)&&s.coordinates?.lat>=37.18&&s.coordinates?.lat<=37.51}).map(s=>({id:s.id,name:stationId.get(s.stationId)?.names?.ko,node:s.osmNodeId,coords:s.coordinates})).slice(0,120)));
const waysById=new Map(ways.map(w=>[String(w.id),w]));
for(const service of services.filter(s=>['kr-osm-service-17413294','kr-osm-service-17413296'].includes(s.id))){
 const byId=new Map(geometry.map(g=>[g.id,g])),parts=service.paths.map(p=>{const g=byId.get(p.geometryId),w=waysById.get(String(g.sourceRef.id)),pts=p.reverse?[...g.coordinates].reverse():g.coordinates,ids=p.reverse?[...g.nodeIds].reverse():g.nodeIds;return{wayId:w.id,reverse:p.reverse,nodeIds:ids,coordinates:pts,tags:w.tags}});
 let all=[],nodes=[],connected=true;const links=[];
 for(const p of parts){const joins=nodes.length?String(nodes.at(-1))===String(p.nodeIds[0]):true;links.push(joins);if(!joins)connected=false;all.push(...p.coordinates.slice(nodes.length&&joins?1:0));nodes.push(...p.nodeIds.slice(nodes.length&&joins?1:0));}
 const seong=[37.39472,127.11944];let matches=[];for(let i=0;i<all.length;i++){let d=km(all[i],seong);if(d<.4)matches.push({index:i,node:nodes[i],latlon:all[i],dKm:Number(d.toFixed(5))});}
 console.log('GTX_ROUTE_CONTINUITY',JSON.stringify({id:service.id,connected,links,points:all.length,lenKm:all.slice(1).reduce((n,p,i)=>n+km(all[i],p),0),nearSeongnam:matches.slice(0,50),parts:parts.map((p,i)=>({wayId:p.wayId,connectedFromPrevious:links[i],tag:{railway:p.tags.railway,name:p.tags.name,service:p.tags.service,highspeed:p.tags.highspeed},first:p.coordinates[0],last:p.coordinates.at(-1),lengthKm:Number(p.coordinates.slice(1).reduce((n,q,j)=>n+km(p.coordinates[j],q),0).toFixed(3))}))}).slice(0,18000))
}
