'use strict';
// 공식 완전 정차열을 전국 원본 본선 그래프에 결합한다. 이름이나 거리로 선로를 이어 붙이지 않는다.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'kr-rail-expansion.cjs');let source=fs.readFileSync(filename,'utf8');
function replace(old,next){if(!source.includes(old))throw Error('전국 철도 생성기 계약 변경: '+old);source=source.replace(old,next)}
// 투영 후보 선분을 공간 색인으로 좁히고 전국 공통 그래프를 한 번만 구성한다.
replace('function graphFor(services,names){','let nationalGraph;function graphFor(services,names){if(nationalGraph)return nationalGraph;');
replace(' const bindings=new Map,unbound=[];',` const grid=new Map,cell=.01;for(const edge of edges){for(let y=Math.floor(Math.min(edge.from[0],edge.to[0])/cell);y<=Math.floor(Math.max(edge.from[0],edge.to[0])/cell);y++)for(let x=Math.floor(Math.min(edge.from[1],edge.to[1])/cell);x<=Math.floor(Math.max(edge.from[1],edge.to[1])/cell);x++){const key=y+':'+x;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(edge)}}
 const nearEdges=point=>{const found=new Set;const y=Math.floor(point[0]/cell),x=Math.floor(point[1]/cell);for(let a=y-1;a<=y+1;a++)for(let b=x-1;b<=x+1;b++)for(const edge of grid.get(a+':'+b)||[])found.add(edge);return found};
 const bindings=new Map,unbound=[];`);
replace('else for(const edge of edges)','else for(const edge of nearEdges(point))');
replace('const kept=options.slice(0,12);','const kept=options;');
replace('return{coords,adjacency,edgeProof,bindings,unbound,selected,sparseSourceEdges,cache:new Map};','return nationalGraph={coords,adjacency,edgeProof,bindings,unbound,selected,sparseSourceEdges,cache:new Map};');
replace('function shortest(graph,start,end){','function shortest(graph,start,end,limit=Infinity){');
replace("const key=start+'|'+end;","const key=start+'|'+end+'|'+limit;");
replace('if(cost!==dist.get(node))continue;if(node===end)break;','if(cost!==dist.get(node))continue;if(cost>limit)break;if(node===end)break;');
replace('if(dist.has(end)){','if(dist.has(end)&&dist.get(end)<=limit){');
replace('shortest(graph,prev.nodeId,binding.nodeId)','shortest(graph,prev.nodeId,binding.nodeId,Math.max(15,distance([prev.node.lat,prev.node.lon],[binding.node.lat,binding.node.lon])*3))');
replace("for(const s of services)for(const p of s.paths||[]){const w=ways.get(p.geometryId.replace('kr-geometry-',''));if(w&&!selected.has(w.id)&&['rail','subway','light_rail','monorail','narrow_gauge'].includes(w.tags?.railway)&&!['yard','spur'].includes(w.tags?.service))selected.set(w.id,w)}", "const passengerWays=new Set(data.services.filter(s=>s.status!=='excluded'&&s.access?.passengerCandidate!==false).flatMap(s=>(s.paths||[]).map(p=>p.geometryId.replace('kr-geometry-',''))));for(const w of ways.values()){if(['rail','subway','light_rail','monorail','narrow_gauge'].includes(w.tags?.railway)&&!['yard','spur'].includes(w.tags?.service)&&(w.tags?.service!=='siding'||passengerWays.has(w.id))&&!['industrial','military','test'].includes(w.tags?.usage)&&w.tags?.disused!=='yes'&&w.tags?.access!=='no'&&w.coordinates.every(Boolean))selected.set(w.id,w)}");
replace("const existing=[...read(out,'rail-batch').routes,...read(out,'rail-highspeed-batch').routes];", "const existing=require('./lib/kr-canonical.cjs').assembleCanonicalRoutes(['rail-batch','rail-highspeed-batch','rail-expansion-batch','rail-network-recovery-batch','rail-name-recovery-batch'].map(n=>({name:n,...read(out,n)}))).routes;const queuedTripIds=new Set([...read(out,'rail-name-recovery-queue').candidates.flatMap(q=>q.tripIds),...official.trips.map(t=>t.id)]);");
replace('const queue=[],routes=[],usedWays=new Map,groupReports=[],currentEvidence=[];',`for(const [kind,sheet,id,label] of [
 ['conventional','호남선','honam-conventional','호남선 일반열차'],['conventional','전라선','jeolla-conventional','전라선 일반열차'],['conventional','장항선','janghang-conventional','장항선 일반열차'],['conventional','중앙선','jungang-conventional','중앙선 일반열차'],['conventional','충북선','chungbuk-conventional','충북선 일반열차'],['conventional','목포보성선','mokpo-boseong-conventional','경전선 목포·보성 일반열차'],['conventional','동해선','donghae-conventional','동해선 일반열차'],['conventional','대구선','daegu-conventional','대구선 일반열차'],['conventional','서해선','seohae-conventional','서해선 일반열차'],
 ['highspeed','경전선','gyeongjeon-highspeed','고속철도 경전선'],['highspeed','동해선(서울~포항)','pohang-highspeed','고속철도 포항 계통'],['highspeed','중앙선','jungang-highspeed','중앙선 고속열차'],['highspeed','동해선(부전-강릉)','donghae-highspeed','동해선 고속열차'],['highspeed','중부내륙선','jungbunaeryuk-highspeed','중부내륙선 고속열차']
 ])groups.push({id,label,mode:kind==='highspeed'?'high_speed_rail':'rail',region:'전국',services:[],trips:official.trips.filter(t=>t.sheet===sheet&&t.sourceId==='korail-'+kind+'-20261101'),sourceUrl:official.sources.find(s=>s.id==='korail-'+kind+'-20261101').url});
 const queue=[],routes=[],usedWays=new Map,groupReports=[],currentEvidence=[];`);
replace('for(const group of groups){',"for(const group of groups){group.trips=group.trips.filter(t=>queuedTripIds.has(t.id));if(!group.target&&existing.some(r=>r.id==='kr-rail-expansion-'+group.id))group.target='kr-rail-expansion-'+group.id;");
replace('const names=[...new Set([...patterns.values()].flatMap(p=>p.names))],graph=graphFor(group.services,names);','const names=[...new Set([...patterns.values()].flatMap(p=>p.names))],graph=graphFor(group.services,[...new Set(groups.flatMap(g=>g.trips.filter(t=>queuedTripIds.has(t.id)).flatMap(t=>t.calls.map(c=>display(c.ko)))))]);');
replace("id:'kr-rail-expansion-'+group.id","id:'kr-rail-national-'+group.id");
replace("'kr-expansion-pattern-'+hash","'kr-national-pattern-'+hash");
replace("'rail-expansion-'+name+'.json'","'rail-national-recovery-'+name+'.json'");
replace('const k=keyName(name);',"const k=keyName(name);const full=String(name).replace(/[^\\p{L}\\p{N}]/gu,'');if(full!==k){if(!named.has(full))named.set(full,[]);named.get(full).push(n)}");
replace('공식 완전 열차열·출발과 종착·전 정차순서를 원본 후보 선로 그래프와 대조. 다른 물리적 위치를 이름만으로 연결하지 않음.','공식 완전 열차열을 전국 원본 본선과 대조. 선로의 동일 원본 노드와 원본 선분 투영만 허용하며 이름·거리 기반 가상 접속은 금지.');
source=source.replaceAll("checkedAt:'2026-11-01'","checkedAt:'2026-11-04'");
// 최신 원본의 추가 복구 가능성만 조사한다. 기존 공개 자료와 생성 파일은 덮어쓰지 않는다.
if(process.argv.includes('--current-preview')){
 replace("read(path.join(base,'source'),'osm-ways')","read(path.join(root,'.cache/kr-rail/current'),'osm-ways')");
 replace("read(path.join(base,'source'),'osm-nodes')","read(path.join(root,'.cache/kr-rail/current'),'osm-nodes')");
 replace("'rail-name-recovery-batch'].map", "'rail-name-recovery-batch','rail-national-recovery-batch','rail-urban-national-batch'].map");
 replace("path.join(out,'rail-national-recovery-'+name+'.json')", "path.join(root,'.cache/kr-rail','current-preview-'+name+'.json')");
}
const child=new Module(filename,module);child.filename=filename;child.paths=module.paths;child._compile(source,filename);
