'use strict';
const crypto=require('node:crypto');
const {hash}=require('./kr-source-member-repairs');
const {orientOrderedWays}=require('./kr-osm-order');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function supplementSourceTrack(relation,ways,nodes,config,evidence){
 const fail=code=>{throw Error(code+':'+relation.id)};
 if(relation.id!==config.relationId||hash(relation)!==config.relationSha256||hash([...ways.values()])!==config.sourceWaysSha256)fail('STALE_TRACK_SUPPLEMENT');
 const original=relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role)),members=original.map(m=>({...m}));
 const swap=config.swap;
 if(members[swap.firstIndex]?.ref!==swap.firstWayId||members[swap.secondIndex]?.ref!==swap.secondWayId||swap.secondIndex!==swap.firstIndex+1)fail('STALE_REVIEWED_SWAP');
 [members[swap.firstIndex],members[swap.secondIndex]]=[members[swap.secondIndex],members[swap.firstIndex]];
 for(const insert of config.insertions){
  const w=ways.get(insert.wayId),bytes=evidence.wayFiles.get(insert.sourceFile);
  if(!w||original.some(m=>m.ref===w.id)||hash(w)!==insert.waySha256||!bytes||sha(bytes)!==insert.fileSha256||w.tags.railway!=='rail'||w.tags.highspeed!=='yes'||w.tags.usage!=='main'||w.tags.name!=='경부고속선'||w.tags.operator!=='한국철도공사'||w.tags.service||w.tags.highway)fail('UNPROVEN_MAINLINE_SUPPLEMENT');
  const elements=JSON.parse(bytes).elements,latest=elements.filter(e=>e.type==='way'),sourceNodes=new Map(elements.filter(e=>e.type==='node').map(e=>[String(e.id),e]));
  if(latest.length!==1||String(latest[0].id)!==w.id||latest[0].version!==w.version||JSON.stringify(latest[0].nodes.map(String))!==JSON.stringify(w.nodeIds)||Object.entries(w.tags).some(([k,v])=>latest[0].tags[k]!==v)||w.nodeIds.some((id,i)=>sourceNodes.get(id)?.lat!==w.coordinates[i][0]||sourceNodes.get(id)?.lon!==w.coordinates[i][1]))fail('LATEST_OSM_GEOMETRY_DRIFT');
  const i=members.findIndex((m,i)=>i&&members[i-1].ref===insert.beforeWayId&&m.ref===insert.afterWayId);
  if(i<1)fail('MISSING_SUPPLEMENT_ANCHOR');
  const before=members[i-1],after=members[i];
  if(orientOrderedWays([before,after],ways,[]).status!=='DISCONNECTED_ORDERED_WAYS'||orientOrderedWays([before,{ref:w.id,role:''},after],ways,[]).status!=='UNIQUE_SOURCE_ORDER')fail('UNPROVEN_EXACT_NODE_JOIN');
  const candidates=[...ways.values()].filter(candidate=>candidate.tags.railway==='rail'&&orientOrderedWays([before,{ref:candidate.id,role:''},after],ways,[]).status==='UNIQUE_SOURCE_ORDER');
  if(candidates.length!==1||candidates[0].id!==w.id)fail('AMBIGUOUS_REAL_TRACK_JOIN');
  members.splice(i,0,{type:'w',ref:w.id,role:''});
 }
 if(members.length!==original.length+config.insertions.length||original.some(m=>members.filter(q=>q.ref===m.ref&&q.role===m.role).length!==original.filter(q=>q.ref===m.ref&&q.role===m.role).length))fail('ORIGINAL_TRACK_REMOVED');
 const stops=relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role)),order=orientOrderedWays(members,ways,stops.map(m=>m.ref));
 if(stops.length<2||order.status!=='UNIQUE_SOURCE_ORDER')fail('INCOMPLETE_SUPPLEMENTED_ROUTE');
 for(const p of order.parts){const w=ways.get(p.wayId);if(['yard','siding','spur'].includes(w.tags.service)||(w.tags.oneway==='yes'&&p.reverse)||(w.tags.oneway==='-1'&&!p.reverse))fail('UNREVIEWED_OPERATIONAL_TRACK')}
 const official=config.officialPattern,source=evidence.sources.find(s=>s.id===official.sourceId);
 if(!source||source.kind!=='official-timetable'||source.sha256!==official.workbookSha256||sha(evidence.workbook)!==official.workbookSha256||sha(evidence.researchBytes)!==official.researchSha256)fail('STALE_SUPPLEMENT_TIMETABLE');
 const calls=stops.map(m=>{const n=nodes.get(m.ref);if(n?.tags.railway!=='stop'||n.tags.public_transport!=='stop_position')fail('UNPROVEN_SOURCE_STOP_POSITION');return n.tags.name});
 if(calls[0]!==relation.tags.from||calls.at(-1)!==relation.tags.to)fail('WRONG_SUPPLEMENT_ENDPOINTS');
 const trains=JSON.parse(evidence.researchBytes).trains.filter(t=>official.tripIds.includes(t.id));
 if(trains.length!==official.tripIds.length||trains.length!==2)fail('INCOMPLETE_SUPPLEMENT_TRAINS');
 for(const t of trains)if(t.sourceId!==source.id||t.publishedDirection!=='DOWN'||JSON.stringify(t.calls.map(c=>c.stationName))!==JSON.stringify(calls)||t.operatingDayNote!==official.operatingDayNotes[t.trainNumber])fail('UNVERIFIED_FULL_CALL_PATTERN');
 if(JSON.stringify(trains.map(t=>t.operatingDayNote).sort())!==JSON.stringify(['금토일','월화수목'].sort()))fail('MISSING_PUBLISHED_OPERATING_DAYS');
 return {members,evidence:{...config,scope:'Research reconstruction from pinned real OSM mainline ways and complete published train calls/day notes; platforms, exceptional dates, licensing and release remain unverified',releaseApproved:false,platformDirectionVerified:false}};
}
function applyTrainStationNames(stations,stops,nodes,reviews,evidence){
 for(const r of reviews){
  const st=stations.get(r.stationId),stop=stops.find(s=>s.id===r.stopId),node=nodes.get(r.nodeId),source=evidence.sources.find(s=>s.id===r.sourceId);
  if(!st||hash(st)!==r.stationSha256||stop?.stationId!==st.id||stop.osmNodeId!==r.nodeId||hash(node)!==r.nodeSha256||node.tags.name!==r.officialName||node.tags.railway!=='stop')throw Error('STALE_TRAIN_STATION_IDENTITY');
  if(source?.sha256!==r.workbookSha256||sha(evidence.workbook)!==r.workbookSha256||sha(evidence.researchBytes)!==r.researchSha256)throw Error('STALE_TRAIN_STATION_SOURCE');
  const trains=JSON.parse(evidence.researchBytes).trains.filter(t=>r.tripIds.includes(t.id));
  if(trains.length!==r.tripIds.length||trains.length!==2||trains.some(t=>t.sourceId!==r.sourceId||t.calls.filter(c=>c.stationName===r.officialName).length!==1))throw Error('UNPROVEN_TRAIN_STATION_NAME');
  st.names={...st.names,ko:r.officialName};
 }
}
module.exports={supplementSourceTrack,applyTrainStationNames};
