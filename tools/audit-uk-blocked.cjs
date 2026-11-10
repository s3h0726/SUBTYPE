const fs=require('fs'),path=require('path'),z=require('zlib'),{assembleTrack}=require('./lib/uk-osm.cjs'),{UKTrackGraph}=require('./lib/uk-track-graph.cjs');
const root=path.resolve(__dirname,'../data/uk'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(path.join(root,f+'.json.gz'))));
const km=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos((a[0]+b[0])*Math.PI/360));
for(const line of ['dlr','elizabeth']){
 const graph=new UKTrackGraph,relations=[];for(const file of fs.readdirSync(path.join(root,'source/osm'))){const id=Number(file.replace(/\.json.gz$/,'')),d=read('source/osm/'+id),r=d.elements.find(e=>e.type==='relation'&&e.id===id);if(r?.tags?.type!=='route'||!(line==='dlr'?/DLR|Docklands/.test(r.tags.name||''):/Elizabeth line/i.test(r.tags.name||'')))continue;try{const t=assembleTrack(r,d.elements);graph.add(t.refs,t.geometry,id);relations.push(id)}catch(e){console.log('REJECT',id,r.tags.name,e.message)}}
 const tfl=read('source/tfl/'+line),stations=new Map([...tfl.stations,...tfl.stopPointSequences.flatMap(s=>s.stopPoint)].map(s=>[s.id,s]));
 console.log('GRAPH',line,graph.nodes.size,'relations',relations.length);
 for(const p of tfl.orderedLineRoutes){const stops=p.naptanIds.map(id=>stations.get(id));if(line==='dlr'&&!p.name.startsWith('Stratford  '))continue;if(line==='elizabeth'&&!p.name.includes('Terminal 5'))continue;
  console.log('PATTERN',p.name);for(const s of stops){const nearest=[...graph.nodes].map(([id,pt])=>({id,km:km([s.lat,s.lon],pt)})).sort((a,b)=>a.km-b.km);if(nearest[0]?.km>.3)console.log('OUTSIDE',s.id,s.name,s.lat,s.lon,nearest[0])}
  try{graph.resolve(stops);console.log('PASS')}catch(e){console.log('FAIL',e.message,e.details)}
 }
}
