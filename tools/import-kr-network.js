#!/usr/bin/env node
'use strict';
// OSM supplies track topology and research candidates, NOT operating authority.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {orientOrderedWays}=require('./lib/kr-osm-order');
const {applyTopologyCorrection}=require('./lib/kr-topology-corrections');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2');
const read=n=>JSON.parse(fs.readFileSync(path.join(base,'source',n+'.json'),'utf8'));
const overrideFile=path.join(base,'official-overrides.json');
const overrides=fs.existsSync(overrideFile)?JSON.parse(fs.readFileSync(overrideFile,'utf8')):{};
const editable=new Set(['names','status','verification','operatorIds','regionId','color','number','platformCode','numberingNotApplicable','patternId','patternNames','transferStationIds','nameHistory']);
const write=(n,v)=>{if(Array.isArray(v)&&Array.isArray(overrides[n])){const map=new Map(v.map(r=>[r.id,r]));for(const patch of overrides[n]){const row=map.get(patch.id);if(!row)throw Error('Official override refers to a missing source ID: '+patch.id);for(const [key,value] of Object.entries(patch))if(key!=='id'){if(!editable.has(key))throw Error('Non-editable source field '+key);row[key]=value}}}fs.writeFileSync(path.join(base,n+'.json'),JSON.stringify(v,null,2)+'\n')};
const rawNodes=read('osm-nodes'),rawWays=read('osm-ways'),relations=read('osm-relations'),manifest=read('osm-manifest');
const names=t=>({ko:t['name:ko']||t.name||'',en:t['name:en']||''});
const sourceId=manifest.id,ref=(kind,id)=>({sourceId,kind,id:String(id)});
const ways=new Map(rawWays.map(w=>[w.id,w]));
const corrections=JSON.parse(fs.readFileSync(path.join(base,'topology-corrections.json'),'utf8'));
for(const c of corrections)if(!relations.some(r=>r.id===c.relationId))throw Error('MISSING_CORRECTED_RELATION:'+c.relationId);
if(new Set(corrections.map(c=>c.relationId)).size!==corrections.length)throw Error('DUPLICATE_TOPOLOGY_CORRECTION');
const railRoutes=relations.filter(r=>r.tags.type==='route'&&['train','subway','light_rail','tram','monorail','funicular'].includes(r.tags.route));
const railMembers=new Set(railRoutes.flatMap(r=>r.members.filter(m=>m.type==='n').map(m=>m.ref)));
const nodes=new Map(rawNodes.filter(n=>['station','halt','tram_stop'].includes(n.tags.railway)||railMembers.has(n.id)).map(n=>[n.id,n]));
const areas=relations.filter(r=>r.tags.public_transport==='stop_area'&&r.members.some(m=>m.type==='n'&&nodes.has(m.ref)));
const areaByNode=new Map();
for(const area of areas)for(const member of area.members.filter(m=>m.type==='n')){
 const ids=areaByNode.get(member.ref)||[];ids.push(area.id);areaByNode.set(member.ref,ids);
}
const stations=new Map(),stops=[],operators=new Map();
const opId=name=>{if(!name)return null;const id='kr-op-'+crypto.createHash('sha256').update(name.normalize('NFC').trim()).digest('hex').slice(0,12);if(!operators.has(id))operators.set(id,{id,names:{ko:name,en:''},verification:'candidate',sourceRefs:[ref('operator-tag',name)]});return id};
for(const node of nodes.values()){
 const memberships=areaByNode.get(node.id)||[],area=memberships.length===1?areas.find(a=>a.id===memberships[0]):null;
 const id=area?'kr-osm-area-'+area.id:'kr-osm-station-'+node.id;
 const tags=area?{...node.tags,...area.tags}:node.tags;
 if(!stations.has(id))stations.set(id,{id,names:names(tags),coordinates:{lat:node.lat,lon:node.lon},operatorIds:[],status:'candidate',nameHistory:[],transferStationIds:[],sourceRefs:[ref(area?'relation':'node',area?.id||node.id)]});
 const station=stations.get(id),operatorId=opId(tags.operator);
 if(operatorId&&!station.operatorIds.includes(operatorId))station.operatorIds.push(operatorId);
 stops.push({id:'kr-osm-stop-'+node.id,stationId:id,osmNodeId:node.id,coordinates:{lat:node.lat,lon:node.lon},number:node.tags.ref||null,platformCode:node.tags.local_ref||null,sourceRefs:[ref('node',node.id)],verification:'candidate'});
}
const stopByNode=new Map(stops.map(s=>[s.osmNodeId,s]));
const infrastructure=rawWays.map(w=>({id:'kr-track-'+w.id,geometryId:'kr-geometry-'+w.id,mode:w.tags.railway,operatorId:opId(w.tags.operator),service:w.tags.service||null,tunnel:w.tags.tunnel||null,bridge:w.tags.bridge||null,layer:w.tags.layer||null,oneway:w.tags.oneway||null,usage:w.tags.usage||null,sourceRefs:[ref('way',w.id)],verification:'source-extracted'}));
const geometry=rawWays.map(w=>({id:'kr-geometry-'+w.id,nodeIds:w.nodeIds,coordinates:w.coordinates,sourceRef:ref('way',w.id),sourceVersion:w.version}));
const masterByRoute=new Map();
for(const r of relations.filter(r=>r.tags.type==='route_master'))for(const m of r.members.filter(m=>m.type==='r')){const list=masterByRoute.get(m.ref)||[];list.push(r);masterByRoute.set(m.ref,list)}
const lines=new Map(),services=[];
for(const r of railRoutes){
 const masters=masterByRoute.get(r.id)||[],master=masters.length===1?masters[0]:r;
 const lineId='kr-osm-line-'+master.id,operatorId=opId(master.tags.operator||r.tags.operator);
 if(!lines.has(lineId))lines.set(lineId,{id:lineId,names:names(master.tags),operatorIds:operatorId?[operatorId]:[],color:master.tags.colour||r.tags.colour||null,regionId:null,mode:r.tags.route,status:'candidate',sourceRefs:[ref('relation',master.id)]});
 const {members:orderedWays,evidence:topologyCorrection}=applyTopologyCorrection(r,ways,corrections.find(c=>c.relationId===r.id));
 const sourceStopMembers=r.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role));
 const orientation=orientOrderedWays(orderedWays,ways,sourceStopMembers.map(m=>m.ref));
 const issues=[],paths=[],nodeIds=[];
 for(let i=0;i<orderedWays.length;i++){
  const member=orderedWays[i],way=ways.get(member.ref);
  if(!way){issues.push({code:'MISSING_MEMBER_WAY',wayId:member.ref});continue}
  if(['yard','siding','spur'].includes(way.tags.service))issues.push({code:'NON_PUBLIC_TRACK_REVIEW',wayId:way.id});
  let reverse=member.role==='backward';
  if(!member.role&&nodeIds.length)reverse=way.nodeIds.at(-1)===nodeIds.at(-1);
  if(!member.role&&!nodeIds.length&&orderedWays[i+1]){
   const next=ways.get(orderedWays[i+1].ref);
   if(next){const endpoints=[next.nodeIds[0],next.nodeIds.at(-1)];if(!endpoints.includes(way.nodeIds.at(-1))&&endpoints.includes(way.nodeIds[0]))reverse=true}
  }
  if(orientation.status==='UNIQUE_SOURCE_ORDER')reverse=orientation.parts[i].reverse;
  const refs=reverse?way.nodeIds.slice().reverse():way.nodeIds;
  if(nodeIds.length&&nodeIds.at(-1)!==refs[0])issues.push({code:'DISCONNECTED_MEMBERS',wayId:way.id,from:nodeIds.at(-1),to:refs[0]});
  paths.push({geometryId:'kr-geometry-'+way.id,reverse});
  nodeIds.push(...(nodeIds.length&&nodeIds.at(-1)===refs[0]?refs.slice(1):refs));
 }
 if(orientation.status!=='UNIQUE_SOURCE_ORDER')issues.push({code:orientation.status,wayId:orientation.wayId});
 const members=r.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role));
 const serviceStops=[];let previous=-1;
 for(const m of members){const stop=stopByNode.get(m.ref),index=nodeIds.indexOf(m.ref,previous+1);
  if(!stop){issues.push({code:'UNKNOWN_STOP',nodeId:m.ref});continue}
  if(index<0){issues.push({code:'STOP_NOT_ON_ORDERED_TRACK',nodeId:m.ref});continue}
  serviceStops.push({stopId:stop.id,geometryIndex:index,boarding:m.role!=='stop_exit_only',alighting:m.role!=='stop_entry_only'});previous=index;
 }
 if(members.length<2)issues.push({code:'MISSING_ORDERED_STOPS'});
 if(!paths.length)issues.push({code:'MISSING_TRACK'});
 issues.push({code:'OFFICIAL_TIMETABLE_REQUIRED'});
 services.push({id:'kr-osm-service-'+r.id,passengerLineId:lineId,names:names(r.tags),operatorIds:operatorId?[operatorId]:[],kind:r.tags.service||r.tags.route,directionId:'osm-relation-'+r.id,paths,stops:serviceStops,osmFrom:r.tags.from||null,osmTo:r.tags.to||null,status:'candidate',sourceRefs:[ref('relation',r.id)],...(topologyCorrection?{topologyCorrection}:{}),issues});
}
// Stop-area groups are transfer relationships, never automatic physical merges.
for(const group of relations.filter(r=>r.tags.public_transport==='stop_area_group')){
 const ids=group.members.filter(m=>m.type==='r').map(m=>'kr-osm-area-'+m.ref).filter(id=>stations.has(id));
 for(const id of ids)stations.get(id).transferStationIds.push(...ids.filter(other=>other!==id));
}
write('operators',[...operators.values()]);write('infrastructure',infrastructure);write('stations',[...stations.values()]);write('stops',stops);write('passenger-lines',[...lines.values()]);write('services',services);write('geometry',geometry);
// Human-reviewed official evidence and trips must survive repeat OSM imports.
for(const [name,value] of Object.entries({trips:[],reviews:[],assets:[], 'station-signs':[{id:'kr-temporary-jr',style:'jr-east',official:false}],coverage:{status:'INCOMPLETE',asOf:'2026-10-15',officialPassengerLineIds:null,officialStationCount:null,sourceIds:[]}}))if(!fs.existsSync(path.join(base,name+'.json')))write(name,value);
const sourceFiles=['osm-nodes','osm-ways','osm-relations','osm-manifest'].map(n=>({path:'source/'+n+'.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(base,'source',n+'.json'))).digest('hex')}));
const priorSources=fs.existsSync(path.join(base,'sources.json'))?JSON.parse(fs.readFileSync(path.join(base,'sources.json'),'utf8')):[];
write('sources',[{...manifest,files:sourceFiles},...priorSources.filter(s=>s.kind!=='osm')]);
if(!fs.existsSync(overrideFile))fs.writeFileSync(overrideFile,'{}\n');
const issues=services.flatMap(s=>s.issues).reduce((a,x)=>(a[x.code]=(a[x.code]||0)+1,a),{});
write('import-report',{status:'INCOMPLETE',sourceId,counts:{operators:operators.size,infrastructure:infrastructure.length,stations:stations.size,stops:stops.length,passengerLines:lines.size,serviceCandidates:services.length,verifiedServices:0},issues});
console.log(JSON.stringify({stations:stations.size,tracks:infrastructure.length,passengerLineCandidates:lines.size,serviceCandidates:services.length,issues},null,2));
