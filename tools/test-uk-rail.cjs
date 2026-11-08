const zlib=require('zlib');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p))),index=read('data/uk/generated/index.json'),segments=read('data/uk/generated/geometry.json').segments;
(async()=>{
 const uk=await import(pathToFileURL(path.join(root,'js/uk-network.js'))),integrity=await import(pathToFileURL(path.join(root,'js/route-integrity.js'))),{buildTypingModel}=await import(pathToFileURL(path.join(root,'js/typing-model.js'))),{FreeDrive}=await import(pathToFileURL(path.join(root,'js/free-drive.js')));
 const sourceEdges=new Set,sourceNodes=new Map;
 for(const file of fs.readdirSync(path.join(root,'data/uk/source/osm'))){const d=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'data/uk/source/osm',file))));for(const e of d.elements){if(e.type==='node')sourceNodes.set(e.id,[e.lat,e.lon]);if(e.type==='way'&&['rail','subway','light_rail','tram'].includes(e.tags?.railway))for(let i=1;i<e.nodes.length;i++){sourceEdges.add(e.nodes[i-1]+'::'+e.nodes[i]);sourceEdges.add(e.nodes[i]+'::'+e.nodes[i-1])}}}
 for(const [id,segment]of Object.entries(segments)){assert.equal(segment.nodeIds.length,segment.geometry.length,id);for(let i=0;i<segment.nodeIds.length;i++){assert.deepEqual(segment.geometry[i],sourceNodes.get(segment.nodeIds[i]),'invented coordinate: '+id);if(i)assert(sourceEdges.has(segment.nodeIds[i-1]+'::'+segment.nodeIds[i]),'invented track edge: '+id)}}
 const ids=new Set,stations=new Map,results=[];let directions=0;
 for(const meta of index.routes){assert(!ids.has(meta.id),'duplicate physical line ID');ids.add(meta.id);const route=read(meta.lazySource);route.ukGeometry=segments;
  for(const station of route.stationCatalog){assert(Number.isFinite(station.latitude)&&Number.isFinite(station.longitude));assert(station.latitude>49&&station.latitude<61);assert(station.longitude>-9&&station.longitude<3);assert(/[가-힣]/.test(station.ko));assert(buildTypingModel(station.ko).inputText.length);if(stations.has(station.stationMasterId))assert.equal(stations.get(station.stationMasterId),station.ko);stations.set(station.stationMasterId,station.ko)}
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
