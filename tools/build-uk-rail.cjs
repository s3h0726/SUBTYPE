#!/usr/bin/env node
'use strict';
// Offline, reproducible import. No schematic/straight-line geometry fallback.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const {UKTrackGraph}=require('./lib/uk-track-graph.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/uk');
const read=p=>{let f=path.join(dir,p);if(!fs.existsSync(f))f+='.gz';let b=fs.readFileSync(f);if(f.endsWith('.gz'))b=zlib.gunzipSync(b);return JSON.parse(b.toString().replace(/^\uFEFF/,''))};
const write=(p,data)=>{const f=path.join(dir,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(data)+'\n')};
const distance=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos((a[0]+b[0])*Math.PI/360));
const strip=s=>s.replace(/ (Underground|Rail|DLR) Station$| Tram Stop$/,'');
const names=Object.fromEntries(fs.readFileSync(path.join(dir,'station-names-ko.txt'),'utf8').split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>s.split('=')));
const lineKo={bakerloo:'베이컬루선',central:'센트럴선',circle:'서클선',district:'디스트릭트선','hammersmith-city':'해머스미스 앤드 시티선',jubilee:'주빌리선',metropolitan:'메트로폴리탄선',northern:'노던선',piccadilly:'피카딜리선',victoria:'빅토리아선','waterloo-city':'워털루 앤드 시티선',elizabeth:'엘리자베스선',liberty:'리버티선',lioness:'라이어니스선',mildmay:'마일드메이선',suffragette:'서프러제트선',weaver:'위버선',windrush:'윈드러시선',dlr:'도클랜즈 경전철',tram:'런던 트램'};
const color={bakerloo:'#B36305',central:'#E32017',circle:'#FFD300',district:'#00782A','hammersmith-city':'#F3A9BB',jubilee:'#A0A5A9',metropolitan:'#9B0056',northern:'#222222',piccadilly:'#003688',victoria:'#0098D4','waterloo-city':'#95CDBA',elizabeth:'#6950A1',liberty:'#61686B',lioness:'#FAA61A',mildmay:'#006FBB',suffragette:'#18A95D',weaver:'#9B0058',windrush:'#EF7B10',dlr:'#00A4A7',tram:'#84B817'};
const groups={tube:['uk-london-underground','런던 지하철','London Underground','subway'],overground:['uk-first-rail-london','퍼스트 레일 런던','First Rail London','commuter_rail'],'elizabeth-line':['uk-gts-rail-operations','GTS 레일 오퍼레이션스','GTS Rail Operations','commuter_rail'],dlr:['uk-keolisamey-docklands','케올리스아메이 도클랜즈','KeolisAmey Docklands','light_rail'],tram:['uk-tram-operations','트램 오퍼레이션스','Tram Operations Limited','tram']};
const tfl=read('source/tfl/lines.json'),catalog=new Map(),stationRegistry=new Map(),trackAnchors=read('source/station-track-anchors.json');
for(const line of tfl){const data=read('source/tfl/'+line.id+'.json'),g=groups[line.modeName];
 const stations=new Map((data.stations||[]).map(s=>[s.id,s]));
 for(const seq of data.stopPointSequences||[])for(const s of seq.stopPoint||[])if(!stations.has(s.id))stations.set(s.id,s);
 for(const s of stations.values())if(trackAnchors[s.id])s.osmAnchorNodeIds=trackAnchors[s.id].osmNodeIds;
 catalog.set(line.id,{line,data,stations,g,patterns:[],graph:new UKTrackGraph});
 for(const s of stations.values()){const en=strip(s.name),ko=names[en];if(!ko)throw Error('Missing Korean dictionary entry: '+en);
  const key='uk-'+s.id;if(!stationRegistry.has(key))stationRegistry.set(key,{id:key,stationMasterId:key,physicalStationId:'uk-'+(s.topMostParentId||s.parentId||s.id),countryId:'uk',ja:en,en,romaji:en,ko,kana:'',latitude:s.lat,longitude:s.lon,koVerified:false,koSource:'SUBTYPE editorial Korean dictionary (reviewable)',koSourceUrl:'data/uk/station-names-ko.txt',sourceId:s.id});
 }
}
const baseline=read('source/released-baseline-20261108.json.gz');
const segmentStore={...baseline.geometry.segments},rejected=[],sourceFiles=[],seen=new Set();
for(const route of baseline.routes){const c=catalog.get(route.id.replace(/^uk-/,''));if(!c)continue;for(const p of route.patterns){c.patterns.push(p);seen.add(c.line.id+':'+p.stationIds.join(','))}}
const norm=s=>String(s||'').toLowerCase().replace(/ platform \d+$/,'').replace(/&amp;/g,'and').replace(/&/g,'and').replace(/station|underground|airport|terminal|london| ell\b|\([^)]*\)|[^a-z0-9]/g,'');
const {assemble,assembleTrack}=require('./lib/uk-osm.cjs');

for(const file of fs.readdirSync(path.join(dir,'source/osm')).sort()){
 const data=read('source/osm/'+file),id=Number(file.replace(/\.json(?:\.gz)?$/,'')),r=data.elements.find(e=>e.type==='relation'&&e.id===id);
 if(!r||r.tags?.type!=='route'||!['subway','train','light_rail','tram'].includes(r.tags.route))continue;
 const tag=r.tags,reference=String(tag.ref||'').toLowerCase();
 let lineId=[...catalog.keys()].find(key=>reference===key||reference===key.replace('-city',' & city'));
 if(!lineId){const title=(tag.name||'').toLowerCase();lineId=[...catalog.keys()].find(key=>title.startsWith(key+' line')||title.startsWith(key+' '));}
 if(!lineId&&tag.route==='light_rail'&&/DLR|Docklands/i.test(tag.name+' '+tag.network))lineId='dlr';
 if(!lineId&&tag.route==='tram'&&/^(London Trams|Tramlink|Croydon Tramlink)$/i.test(tag.network||''))lineId='tram';
 if(!lineId){rejected.push({relationId:id,reason:'unmapped-line',name:tag.name});continue;}
 try{
  const c=catalog.get(lineId),track=assembleTrack(r,data.elements);c.graph.add(track.refs,track.geometry,id);
  const {geometry,stops,refs}=assemble(r,data.elements);
  const identity=(s,n)=>{const a=norm(strip(s.name)),b=norm(n);return b&&a===b};
  const official=(c.data.orderedLineRoutes||[]).filter(p=>p.serviceType==='Regular').map(p=>({p,stations:p.naptanIds.map(s=>c.stations.get(s))})).filter(p=>p.stations.every(Boolean));
  // Official TfL calls are authoritative. Some OSM relations omit a stop member
  // even though the actual track passes its station; project ALL official calls
  // onto the continuous source track instead of silently omitting that station.
  const possible=official.filter(p=>identity(p.stations[0],stops[0].tags?.name)&&identity(p.stations.at(-1),stops.at(-1).tags?.name));
  // Dynamic programming handles repeated stations on Circle and tram loops.
  // Greedy nearest-point matching could jump to the second Edgware Road visit.
  for(const p of possible){let previous=new Float64Array(geometry.length);const parents=[];
   for(let i=0;i<p.stations.length;i++){const s=p.stations[i],current=new Float64Array(geometry.length).fill(Infinity),parent=new Int32Array(geometry.length).fill(-1);let best=Infinity,bestIndex=-1;
    for(let j=0;j<geometry.length;j++){if(j&&previous[j-1]<best){best=previous[j-1];bestIndex=j-1}const d=distance([s.lat,s.lon],geometry[j]);if(d<=0.65&&(i===0||best<Infinity)){current[j]=(i===0?0:best)+d*d;parent[j]=bestIndex}}
    parents.push(parent);previous=current;
   }
   let end=-1;for(let j=0;j<previous.length;j++)if(Number.isFinite(previous[j])&&(end<0||previous[j]<previous[end]))end=j;
   p.aligned=[];if(end>=0)for(let i=p.stations.length-1;i>=0;i--){p.aligned[i]=end;end=parents[i][end]}
   p.offsets=p.aligned.length===p.stations.length?p.stations.map((s,i)=>distance([s.lat,s.lon],geometry[p.aligned[i]])):[Infinity];
  }
  const match=possible.filter(p=>p.offsets.every(d=>d<=0.65)).sort((a,b)=>a.offsets.reduce((s,n)=>s+n,0)-b.offsets.reduce((s,n)=>s+n,0))[0];
  if(!match)throw Error('no-exact-current-TfL-stopping-sequence:'+stops.length);
  // Geographic order must agree with station identities too. Same-platform
  // aliases are allowed, but names never create an edge or repair a gap.
  const aligned=match.aligned;
  const stationIds=match.stations.map(s=>'uk-'+s.id),dedupe=lineId+':'+stationIds.join(',');
  if(seen.has(dedupe))continue;
  const segmentIds=[];
  for(let i=0;i<aligned.length-1;i++){
   const points=geometry.slice(aligned[i],aligned[i+1]+1),nodeIds=refs.slice(aligned[i],aligned[i+1]+1);
   if(points.length<2)throw Error('empty-segment');
   if(points.some((p,j)=>j&&distance(p,points[j-1])>5))throw Error('implausible-track-edge');
   const sid='osm-'+crypto.createHash('sha256').update(nodeIds.join(',')).digest('hex').slice(0,20);
   const pair=stationIds[i]+'::'+stationIds[i+1];
   if(!segmentStore[sid])segmentStore[sid]={geometry:points,stationPairs:[],sourceRelationId:id,nodeIds};
   if(!segmentStore[sid].stationPairs.includes(pair))segmentStore[sid].stationPairs.push(pair);segmentIds.push(sid);
  }
  const origin=stationRegistry.get(stationIds[0]),destination=stationRegistry.get(stationIds.at(-1)),patternId='uk-osm-'+id;
  seen.add(dedupe);
  c.patterns.push({id:patternId,stationIds,segmentIds,sourceRelationId:id,nameKo:origin.ko+' → '+destination.ko,nameEn:origin.en+' → '+destination.en,direction:match.p.direction||'forward',sourceName:tag.name,validation:{officialSequence:true,stationIdentity:true,trackContinuity:true,maxStationOffsetKm:Math.max(...match.offsets)}});
  sourceFiles.push({path:'data/uk/source/osm/'+file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'source/osm',file))).digest('hex'),relationId:id,version:r.version,timestamp:r.timestamp});
 }catch(error){rejected.push({lineId,relationId:id,name:tag.name,reason:error.message,details:error.details})}
}
// Complete additional CURRENT TfL patterns from the shared, directed OSM track
// graph. Every edge is an original pair of OSM nodes; no connector is invented.
const unresolvedOfficialPatterns=[];
for(const[lineId,c]of catalog)for(const official of c.data.orderedLineRoutes||[]){
 if(official.serviceType!=='Regular'||official.naptanIds.length<2)continue;
 const stationIds=official.naptanIds.map(id=>'uk-'+id),key=lineId+':'+stationIds.join(',');if(seen.has(key))continue;
 try{
  const stations=official.naptanIds.map(id=>c.stations.get(id));if(stations.some(s=>!s))throw Error('missing-official-station');
  const parts=c.graph.resolve(stations),segmentIds=[];
  for(let i=0;i<parts.length;i++){const part=parts[i],sid='osm-'+crypto.createHash('sha256').update(part.refs.join(',')).digest('hex').slice(0,20),pair=stationIds[i]+'::'+stationIds[i+1];
   segmentStore[sid]??={geometry:part.geometry,stationPairs:[],sourceRelationId:part.relationIds[0],sourceRelationIds:part.relationIds,nodeIds:part.refs};if(!segmentStore[sid].stationPairs.includes(pair))segmentStore[sid].stationPairs.push(pair);segmentIds.push(sid);
  }
  const sourceRelationIds=[...new Set(parts.flatMap(p=>p.relationIds))],origin=stationRegistry.get(stationIds[0]),destination=stationRegistry.get(stationIds.at(-1)),patternId='uk-tfl-'+lineId+'-'+crypto.createHash('sha256').update(stationIds.join(',')).digest('hex').slice(0,12);
  c.patterns.push({id:patternId,stationIds,segmentIds,sourceRelationId:sourceRelationIds[0],sourceRelationIds,nameKo:origin.ko+' → '+destination.ko,nameEn:origin.en+' → '+destination.en,direction:'forward',sourceName:official.name,validation:{officialSequence:true,stationIdentity:true,trackContinuity:true,directedOSMGraph:true,maxStationOffsetKm:Math.max(...stations.map((s,i)=>distance([s.lat,s.lon],i<parts.length?parts[i].geometry[0]:parts.at(-1).geometry.at(-1))))}});
  seen.add(key);
 }catch(error){unresolvedOfficialPatterns.push({lineId,name:official.name,stationIds,reason:error.message,details:error.details})}
}
const routes=[],operators=new Map();
for(const [lineId,c]of catalog){if(!c.patterns.length)continue;const [operatorId,ko,en,category]=c.g,operator={ja:en,ko,en},routeId='uk-'+lineId;
 for(const p of c.patterns){const sequence=[p.stationIds.join(','),p.stationIds.slice().reverse().join(',')].sort()[0];p.familyId='uk-pattern-'+crypto.createHash('sha256').update(sequence).digest('hex').slice(0,16);const ends=[stationRegistry.get(p.stationIds[0]).ko,stationRegistry.get(p.stationIds.at(-1)).ko].sort();p.familyNameKo=ends.join(' ↔ ');const others=c.patterns.filter(q=>q.familyId!==p.familyId&&[q.stationIds[0],q.stationIds.at(-1)].sort().join(',')===[p.stationIds[0],p.stationIds.at(-1)].sort().join(','));const via=p.stationIds.find(id=>!others.every(q=>q.stationIds.includes(id)));if(others.length&&via)p.familyNameKo+=' · '+stationRegistry.get(via).ko+' 경유';}
 operators.set(operatorId,{id:operatorId,names:operator});
 const used=[...new Set(c.patterns.flatMap(p=>p.stationIds))],stations=used.map(id=>stationRegistry.get(id));
 const route={schemaVersion:1,id:routeId,countryId:'uk',mode:category==='tram'?'tram':'rail',category,operatorId,operator,line:{ja:c.line.name,ko:lineKo[lineId],en:c.line.name},lineColor:color[lineId],physicalLineId:routeId,stationCatalog:stations,stations,patterns:c.patterns,playable:true,geometryReady:true,geometryStatus:'verified-osm-track',geometrySource:{type:'openstreetmap',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',officialUrl:'https://api.tfl.gov.uk/Line/'+lineId+'/Route/Sequence/all'},services:c.patterns.map(p=>({id:p.id,nameKo:p.nameKo,nameJa:p.nameEn,nameEn:p.nameEn,stops:p.stationIds})),serviceCount:c.patterns.length};
 write('generated/routes/'+routeId+'.json',route);
 routes.push({...route,stations:undefined,stationCatalog:undefined,patterns:undefined,services:undefined,lazy:true,lazySource:'data/uk/generated/routes/'+routeId+'.json',stationCount:stations.length,stationSequence:stations.map(s=>s.id),searchStations:stations.flatMap(s=>[s.ko,s.en])});
}
const used=new Set(routes.flatMap(r=>r.stationSequence)),playableSegments=new Set([...catalog.values()].flatMap(c=>c.patterns.flatMap(p=>p.segmentIds)));
write('generated/geometry.json',{schemaVersion:1,license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',segments:Object.fromEntries(Object.entries(segmentStore).filter(([id])=>playableSegments.has(id)))});
sourceFiles.length=0;
for(const id of new Set([...catalog.values()].flatMap(c=>c.patterns.flatMap(p=>p.sourceRelationIds||[p.sourceRelationId])))){const file='source/osm/'+id+'.json.gz',d=read(file),r=d.elements.find(e=>e.type==='relation'&&e.id===id);sourceFiles.push({path:'data/uk/'+file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex'),relationId:id,version:r.version,timestamp:r.timestamp})}
write('generated/index.json',{schemaVersion:1,sourceManifest:'data/uk/source/manifest.json',country:{id:'uk',names:{ko:'영국',en:'United Kingdom'}},operators:[...operators.values()],routes,sourceNotice:'정차 순서·좌표: Powered by TfL Open Data. 선로: © OpenStreetMap contributors (ODbL 1.0). 한국어: SUBTYPE 편집 역명.',sources:sourceFiles});
const report={operators:operators.size,lines:routes.length,servicePatterns:[...catalog.values()].reduce((n,c)=>n+new Set(c.patterns.map(p=>[p.stationIds.join(','),p.stationIds.slice().reverse().join(',')].sort()[0])).size,0),playableDirections:routes.reduce((n,r)=>n+r.serviceCount,0),uniqueStations:used.size,koreanNamedStations:[...used].filter(id=>stationRegistry.get(id).ko).length,sharedSegments:playableSegments.size,linesDetail:routes.map(r=>({id:r.id,name:r.line.en,stationCount:r.stationCount,directions:r.serviceCount})),rejected,unresolvedOfficialPatterns,missingLines:tfl.filter(l=>!routes.some(r=>r.id==='uk-'+l.id)).map(l=>l.id)};
write('generated/validation.json',report);console.log(JSON.stringify(report,null,2));
module.exports={assemble,distance};
