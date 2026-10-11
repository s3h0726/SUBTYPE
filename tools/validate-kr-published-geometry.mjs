#!/usr/bin/env node
/* Korean game geometry release gate.
   This checks topology shape and provenance; it does NOT replace visual/manual OSM QA. */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname||path.dirname(new URL(import.meta.url).pathname),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const index=read('data/kr/generated/index.json');
const fail=[];
const invariant=(condition,what)=>{if(!condition)fail.push(what)};
const equal=(a,b)=>Math.abs(a[0]-b[0])<1e-7&&Math.abs(a[1]-b[1])<1e-7;
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=32&&p[0]<=40&&p[1]>=123&&p[1]<=133;
const ids=new Set();
for(const meta of index.routes||[]){
  const id=meta.id;
  invariant(!ids.has(id),'duplicate route '+id);ids.add(id);
  invariant(meta.geometryReady===true,'unverified geometry in published index '+id);
  invariant(meta.source?.license==='ODbL-1.0','missing OSM license '+id);
  invariant(meta.lazySource==='data/kr/generated/routes/'+id+'.json','unexpected route file '+id);
  if(!fs.existsSync(path.join(root,String(meta.lazySource)))){fail.push('missing data '+id);continue}
  const doc=read(meta.lazySource),route=doc.route;
  invariant(route?.id===id,'route id mismatch '+id);
  invariant(route?.geometryReady===true,'route not ready '+id);
  invariant(route?.directions?.length===meta.directionCount,'direction count mismatch '+id);
  for(const dir of route?.directions||[]){
    const prefix=id+'/'+dir.id,stops=dir.stops||[],segs=dir.directedSegments||[];
    invariant(stops.length>=2,prefix+' too few stops');
    invariant(segs.length===stops.length-1,prefix+' segment count mismatch');
    invariant(Array.isArray(dir.geometry)&&dir.geometry.length>1,prefix+' missing track geometry');
    let stitched=[];
    for(let i=0;i<segs.length;i++){
      const s=segs[i],points=s.geometry||[],p=prefix+' segment '+i;
      invariant(s.geometryStatus==='ready',p+' not ready');
      invariant(s.fromStationId===stops[i]?.id&&s.toStationId===stops[i+1]?.id,p+' stop IDs mismatch');
      invariant(points.length>=2&&points.every(validPoint),p+' coordinates invalid');
      invariant(s.source?.license==='ODbL-1.0',p+' missing license');
      invariant(Array.isArray(s.source?.osmWayIds)&&s.source.osmWayIds.length>0,p+' missing OSM way IDs');
      // Some legacy verified line-2 artifacts preserve OSM way IDs but not node IDs.\n      // Do not invent node IDs: keep this check optional until re-extraction from OSM.\n      if(s.source?.osmNodeIds!==undefined)invariant(Array.isArray(s.source.osmNodeIds)&&s.source.osmNodeIds.length>1,p+' malformed OSM node IDs');
      if(i&&stitched.length&&points.length)invariant(equal(stitched.at(-1),points[0]),p+' disconnected track');
      if(points.length)stitched.push(...(i?points.slice(1):points));
    }
    if(stitched.length&&dir.geometry?.length)invariant(equal(stitched[0],dir.geometry[0])&&equal(stitched.at(-1),dir.geometry.at(-1)),prefix+' track endpoints mismatch');
    console.log(prefix+': '+stops.length+' stops / '+segs.length+' connected rail segments / '+stitched.length+' points');
  }
}
for(const id of ['kr-metro-3','kr-metro-7'])invariant(!ids.has(id),'unverified '+id+' was published');
if(!fs.existsSync(path.join(root,'tools/validate-kr-osm-candidates.mjs')))fail.push('candidate validation script missing');
if(fail.length){console.error('KR GEOMETRY GATE FAILED:\n'+fail.join('\n'));process.exitCode=1}
else console.log('KR GEOMETRY GATE PASS: '+ids.size+' OSM-backed route artifacts; 3/7 gated');
