#!/usr/bin/env node
/**
 * Recover real OSM rail graph candidates for Korean missing interstation segments.
 *
 * Usage:
 *   node tools/research-kr-missing-tracks.mjs --line 3 --pair 5
 *   node tools/research-kr-missing-tracks.mjs --line 7 --all --delay-ms 2000
 *
 * Live Overpass graph query uses railway=rail/subway/light_rail.
 * It NEVER writes to generated routes and NEVER marks a geometry ready.
 * Outputs review-only evidence containing actual OSM way/node sequences.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=Object.fromEntries(process.argv.slice(2).flatMap((v,i,a)=>v.startsWith('--')?[[v.slice(2),a[i+1]?.startsWith('--')?true:(a[i+1]||true)]]:[]));
const line=Number(args.line);
if(![3,7].includes(line))throw Error('Supply --line 3 or --line 7');
const targets=JSON.parse(fs.readFileSync(path.join(root,'data/kr/osm-candidates/kr-metro-'+line+'.missing-targets.json'),'utf8')).missingPairs;
const picked=args.all===true?targets:targets.filter(p=>p.index===Number(args.pair));
if (args.all===true && args.limit) picked.splice(Math.max(1,Number(args.limit)||1));
if(!picked.length)throw Error('Use --pair <missing pair index> or --all');
const maxSnap=120; // Station entrance/center is not exact track position; flag wide snaps for review.
const round=x=>Math.round(x*1e6)/1e6;
const meters=(a,b)=>{const phi=(a[0]+b[0])*Math.PI/360;return Math.hypot((a[0]-b[0])*111320,(a[1]-b[1])*111320*Math.cos(phi))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const graphFromOsm=items=>{
  const nodes=new Map,edges=new Map,ways=new Map;
  for(const e of items||[])if(e.type==='node'&&Number.isFinite(e.lat)&&Number.isFinite(e.lon))nodes.set(e.id,[e.lat,e.lon]);
  for(const w of items||[])if(w.type==='way'&&['rail','subway','light_rail'].includes(w.tags?.railway)&&Array.isArray(w.nodes)){
    ways.set(w.id,{id:w.id,nodes:w.nodes,tags:w.tags});
    for(let i=1;i<w.nodes.length;i++){
      const u=w.nodes[i-1],v=w.nodes[i],a=nodes.get(u),b=nodes.get(v);if(!a||!b)continue;
      const cost=meters(a,b);if(cost>1000||cost<0.01)continue;
      for(const [from,to] of [[u,v],[v,u]]){if(!edges.has(from))edges.set(from,[]);edges.get(from).push({to,way:w.id,cost})}
    }
  }
  return{nodes,edges,ways};
};
function snap(graph,coord){const nodes=[...graph.nodes].map(([id,p])=>({id,meters:meters([coord.lat,coord.lon],p)})).sort((a,b)=>a.meters-b.meters);return nodes.slice(0,8).filter(x=>x.meters<=maxSnap)}
function shortest(graph,start,end){
  const dist=new Map([[start,0]]),prev=new Map,closed=new Set,frontier=[[0,start]];
  while(frontier.length){frontier.sort((a,b)=>b[0]-a[0]);const [cost,u]=frontier.pop();if(closed.has(u))continue;closed.add(u);if(u===end)break;
    for(const e of graph.edges.get(u)||[]){const nd=cost+e.cost;if(nd<(dist.get(e.to)??Infinity)){dist.set(e.to,nd);prev.set(e.to,{from:u,way:e.way});frontier.push([nd,e.to])}}
  }
  if(!dist.has(end))return null;
  const seq=[end],wayIds=[];let cur=end;
  while(cur!==start){const p=prev.get(cur);if(!p)return null;wayIds.push(p.way);cur=p.from;seq.push(cur)}
  seq.reverse();wayIds.reverse();return{distanceMeters:round(dist.get(end)),nodeIds:seq,wayIds:[...new Set(wayIds)],coordinates:seq.map(id=>graph.nodes.get(id).map(round))};
}
async function download(pair){
  const mid=[(pair.start.lat+pair.end.lat)/2,(pair.start.lon+pair.end.lon)/2];
  const direct=meters([pair.start.lat,pair.start.lon],[pair.end.lat,pair.end.lon]);
  const radius=Math.min(3500,Math.max(900,Math.ceil(direct/2+450)));
  const query=`[out:json][timeout:120];way(around:${radius},${mid[0]},${mid[1]})["railway"~"^(rail|subway|light_rail)$"];(._;>;);out body qt;`;
  const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let data,lastErr;for(const endpoint of endpoints){try{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),150000);let res;try{res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'SUBTYPE-missing-track-review/1.0'},body:new URLSearchParams({data:query}),signal:controller.signal})}finally{clearTimeout(timeout)};if(!res.ok)throw Error('HTTP '+res.status);data=await res.json();break}catch(err){lastErr=err}}
  if(!data)throw Error('Overpass unavailable: '+lastErr?.message);
  const graph=graphFromOsm(data.elements),starts=snap(graph,pair.start),ends=snap(graph,pair.end),options=[];
  for(const a of starts)for(const b of ends){const r=shortest(graph,a.id,b.id);if(r)options.push({...r,fromSnapMeters:round(a.meters),toSnapMeters:round(b.meters)})}
  options.sort((a,b)=>a.distanceMeters-b.distanceMeters);
  // Rank by physical rail distance including distance from station centroids to the track.
  options.sort((a,b)=>(a.distanceMeters+a.fromSnapMeters+a.toSnapMeters)-(b.distanceMeters+b.fromSnapMeters+b.toSnapMeters));
  const first=options.find(o=>o.nodeIds.length>1&&o.distanceMeters>=Math.max(50,direct*.35))||null;
  const second=options.find(o=>o.nodeIds.length>1&&o.nodeIds.join(',')!==first?.nodeIds.join(',')&&o.distanceMeters>=Math.max(50,direct*.35))||null;
  // Structural-only verdict: no automatic gameplay release, even when geometry looks plausible.
  const plausible=!!first&&first.distanceMeters<=direct*2.8+400&&first.fromSnapMeters<=maxSnap&&first.toSnapMeters<=maxSnap;
  return{routeId:'kr-metro-'+line,stationPairIndex:pair.index,from:pair.from,to:pair.to,queriedAt:new Date().toISOString(),source:{name:'OpenStreetMap via Overpass',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',query,sha256:crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')},stationCoordinatesAreNotTrackGeometry:true,straightLineUsed:false,topologyFromSharedOsmNodeIds:true,requestedDirectDistanceMeters:round(direct),osmWayCount:graph.ways.size,graphNodeCount:graph.nodes.size,firstCandidate:first,alternativeCandidate:second,structurallyPlausible:plausible,geometryReady:false,reviewStatus:plausible?'manual-osm-route-membership-review-required':'missing-or-ambiguous',warning:'Do not publish this report as verified geometry. Verify named route relation, track direction, switches and stop positions.'};
}
for(let i=0;i<picked.length;i++){const pair=picked[i];try{const result=await download(pair);const rel='data/kr/osm-candidates/research/kr-metro-'+line+'-pair-'+pair.index+'.json',file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');console.log(pair.from+' → '+pair.to+': '+result.reviewStatus+' / '+rel)}catch(error){console.error(pair.from+' → '+pair.to+': '+error.message);process.exitCode=1}if(i<picked.length-1)await sleep(Math.max(1000,Number(args['delay-ms'])||2000))}
