const zlib=require('zlib');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p))),index=read('data/uk/generated/index.json'),segments=read('data/uk/generated/geometry.json').segments;
const baseline=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'data/uk/source/released-baseline-20261108.json.gz'))));
const expansionBaseline=read('data/uk/source/expansion-ii-baseline.json');
const hashPattern=p=>require('node:crypto').createHash('sha256').update(JSON.stringify([p.familyId,p.stationIds,p.segmentIds])).digest('hex');
for(const old of expansionBaseline.routes){
 const current=read('data/uk/generated/routes/'+old.id+'.json');
 assert.equal(current.operatorId,old.operatorId);
 const stations=new Set(current.stationCatalog.map(s=>s.id));
 const patterns=new Map(current.patterns.map(p=>[p.id,p]));
 for(const station of old.stations)assert(stations.has(station),'published station removed: '+station);
 for(const [id,hash] of old.patterns){assert(patterns.has(id),'published pattern removed: '+id);assert.equal(hashPattern(patterns.get(id)),hash,id)}
}
for(const old of baseline.routes){const current=read('data/uk/generated/routes/'+old.id+'.json');for(const p of old.patterns){const preserved=current.patterns.find(q=>q.id===p.id);assert(preserved,'published pattern removed: '+p.id);assert.deepEqual(preserved.stationIds,p.stationIds);assert.deepEqual(preserved.segmentIds,p.segmentIds)}}
if(index.routes.every(r=>r.geometryFiles)){
 const files=[...new Set(index.routes.flatMap(r=>r.geometryFiles))],stored=new Set();
 for(const file of files)for(const [id,s]of Object.entries(read(file).segments)){assert(!stored.has(id),'segment duplicated across geometry partitions');stored.add(id);assert.deepEqual(s,segments[id])}
 for(const meta of index.routes){const available=new Set(meta.geometryFiles.flatMap(file=>Object.keys(read(file).segments))),route=read(meta.lazySource);assert.deepEqual(route.geometryFiles,meta.geometryFiles);for(const p of route.patterns)for(const id of p.segmentIds)assert(available.has(id),'lazy partition omits '+id)}
}
const metrolink=index.routes.find(r=>r.id==='uk-metrolink');if(metrolink)assert.equal(metrolink.stationCount,99,'TfGM publishes 99 Metrolink stops');
const net=index.routes.filter(r=>r.operatorId==='uk-net');if(net.length)assert.equal(new Set(net.flatMap(r=>r.stationSequence)).size,50,'NET network has 50 physical stops');
const internationalTermini={
 'uk-eurostar-london-paris':'Paris Gare du Nord',
 'uk-eurostar-london-brussels':'Bruxelles-Midi / Brussel-Zuid'
};
const eurostarAmsterdam='uk-eurostar-london-amsterdam';
for(const eurostar of index.routes.filter(r=>r.operatorId==='uk-eurostar')){
 const route=read(eurostar.lazySource);
 const names=new Map(route.stationCatalog.map(station=>[station.id,station.en]));
 const terminus=internationalTermini[eurostar.id];
 const london='London St Pancras International';
 const outward=eurostar.id===eurostarAmsterdam?[london,'Bruxelles-Midi / Brussel-Zuid','Rotterdam Centraal','Amsterdam Centraal']:[london,terminus];
 assert.deepEqual(route.patterns.map(p=>p.stationIds.map(id=>names.get(id))),[outward,outward.slice().reverse()]);
 for(const pattern of route.patterns){
  const snapshot=path.join(root,'data/uk/source/osm',pattern.sourceRelationId+'.json.gz');
  const source=JSON.parse(zlib.gunzipSync(fs.readFileSync(snapshot)));
  const routeNodes=new Set(pattern.segmentIds.flatMap(id=>segments[id].nodeIds));
  const tunnel=source.elements.filter(e=>e.type==='way'&&e.tags?.railway==='rail'&&e.tags?.tunnel==='yes'&&/Channel Tunnel/.test(e.tags?.name));
  assert(tunnel.length>0&&tunnel.every(w=>w.nodes.every(id=>routeNodes.has(id))),'Channel Tunnel rail ways must appear in '+pattern.id);
 }
}
(async()=>{
 const uk=await import(pathToFileURL(path.join(root,'js/uk-network.js'))),integrity=await import(pathToFileURL(path.join(root,'js/route-integrity.js'))),{buildTypingModel}=await import(pathToFileURL(path.join(root,'js/typing-model.js'))),{FreeDrive}=await import(pathToFileURL(path.join(root,'js/free-drive.js')));
 const sourceEdges=new Set,sourceNodes=new Map;
 for(const file of fs.readdirSync(path.join(root,'data/uk/source/osm'))){const d=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'data/uk/source/osm',file))));for(const e of d.elements){if(e.type==='node')sourceNodes.set(e.id,[e.lat,e.lon]);if(e.type==='way'&&['rail','subway','light_rail','tram'].includes(e.tags?.railway))for(let i=1;i<e.nodes.length;i++){sourceEdges.add(e.nodes[i-1]+'::'+e.nodes[i]);sourceEdges.add(e.nodes[i]+'::'+e.nodes[i-1])}}}
 for(const [id,segment]of Object.entries(segments)){assert.equal(segment.nodeIds.length,segment.geometry.length,id);for(let i=0;i<segment.nodeIds.length;i++){assert.deepEqual(segment.geometry[i],sourceNodes.get(segment.nodeIds[i]),'invented coordinate: '+id);if(i)assert(sourceEdges.has(segment.nodeIds[i-1]+'::'+segment.nodeIds[i]),'invented track edge: '+id)}}
 const ids=new Set,stations=new Map,results=[];let directions=0;
 for(const meta of index.routes){assert(!ids.has(meta.id),'duplicate physical line ID');ids.add(meta.id);const route=read(meta.lazySource);route.ukGeometry=segments;
  for(const station of route.stationCatalog){
   const {latitude,longitude,en}=station;
   assert(Number.isFinite(latitude)&&Number.isFinite(longitude));
   const ukBounds=latitude>49&&latitude<61&&longitude>-9&&longitude<3;
   const continentalBounds=meta.category==='international'&&(
    en==='Paris Gare du Nord'&&latitude>48.87&&latitude<48.89&&longitude>2.34&&longitude<2.37||
    en==='Bruxelles-Midi / Brussel-Zuid'&&latitude>50.82&&latitude<50.85&&longitude>4.31&&longitude<4.36||
    en==='Rotterdam Centraal'&&latitude>51.91&&latitude<51.94&&longitude>4.45&&longitude<4.49||
    en==='Amsterdam Centraal'&&latitude>52.36&&latitude<52.40&&longitude>4.88&&longitude<4.92
   );
   assert(ukBounds||continentalBounds,en);
   assert(/[가-힣]/.test(station.ko));assert(buildTypingModel(station.ko).inputText.length);
   if(stations.has(station.stationMasterId))assert.equal(stations.get(station.stationMasterId),station.ko);
   stations.set(station.stationMasterId,station.ko);
  }
  const choices=uk.ukOperatingChoices(route);assert.equal(choices.length,meta.serviceCount);
  for(const choice of choices){assert(!ids.has(choice.id),'duplicate service ID');ids.add(choice.id);const resolved=uk.resolveUKChoice(choice,route),p=resolved.route,audit=integrity.auditRouteIntegrity(p);assert(audit.pass,JSON.stringify(audit.errors));assert.equal(audit.geometryEndpointMismatch,0);assert.equal(p.stations[0].id,choice.originId);assert.equal(p.stations.at(-1).id,choice.destinationId);assert.equal(p.directedSegments.length,p.stations.length-1);const playable=integrity.resolvePlayableRoute(p,{service:resolved.service});assert.deepEqual(playable.stations.map(s=>s.id),p.stations.map(s=>s.id));assert(!playable.fallbackGeometry);results.push({lineId:meta.id,patternId:choice.id,stations:p.stations.length,geometryPoints:p.geometry.length,status:'PASS'});directions++}
 }
 // Global station overrides affect every line sharing that station ID.
 const shared=[...stations.keys()].find(id=>index.routes.filter(r=>r.stationSequence.includes(id)).length>1);assert(shared);
 uk.configureUKNames({stations:{'uk-test':{[shared]:'공통역명 검증'}},operators:{},lines:{},services:{}});
 for(const meta of index.routes.filter(r=>r.stationSequence.includes(shared))){const r=uk.ukPresentation(read(meta.lazySource));assert.equal(r.stationCatalog.find(s=>s.id===shared).ko,'공통역명 검증')}
 uk.configureUKNames({});
 const report={status:'PASS',lines:index.routes.length,operators:index.operators.length,directions,stationIds:stations.size,source:'all generated routes through production UK resolver and route-integrity engine',patterns:results};
 fs.mkdirSync(path.join(root,'reports/uk'),{recursive:true});fs.writeFileSync(path.join(root,'reports/uk/data-tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,patterns:undefined}));
})().catch(e=>{console.error(e);process.exitCode=1});
