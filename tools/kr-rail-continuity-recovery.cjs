'use strict';
// 공개 불가능한 긴 원본 선분을 탐색 전에 제외하여 다른 실제 연결 선로를 찾는다.
// 직선 보간·좌표 접속·역명 기반 선로 접속은 허용하지 않는다.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'kr-rail-national-recovery.cjs');let wrapper=fs.readFileSync(filename,'utf8');
const marker='const child=new Module(filename,module);';
if(!wrapper.includes(marker))throw Error('전국 철도 복구기 계약 변경');
wrapper=wrapper.replace(marker,`
replace("'rail-name-recovery-batch'].map", "'rail-name-recovery-batch','rail-national-recovery-batch','rail-urban-national-batch'].map");
replace("...official.trips.map(t=>t.id)", "...read(out,'rail-national-recovery-queue').candidates.flatMap(q=>q.tripIds)");
replace("const a=w.nodeIds[i-1],b=w.nodeIds[i],from=w.coordinates[i-1],to=w.coordinates[i];coords.set(a,from);", "const a=w.nodeIds[i-1],b=w.nodeIds[i],from=w.coordinates[i-1],to=w.coordinates[i];if(distance(from,to)>5)continue;coords.set(a,from);");
replace("if(!group.target&&existing.some(r=>r.id==='kr-rail-expansion-'+group.id))group.target='kr-rail-expansion-'+group.id;", "if(!group.target){for(const prefix of ['kr-rail-expansion-','kr-rail-national-'])if(existing.some(r=>r.id===prefix+group.id)){group.target=prefix+group.id;break}}");
replace("id:'kr-rail-national-'+group.id", "id:'kr-rail-continuity-'+group.id");
replace("'kr-national-pattern-'+hash", "'kr-continuity-pattern-'+hash");
replace("'rail-national-recovery-'+name+'.json'", "'rail-continuity-recovery-'+name+'.json'");
if(process.argv.includes('--platform-candidates')){
 replace("'rail-urban-national-batch'].map", "'rail-urban-national-batch','rail-continuity-recovery-batch','rail-urban-recovery-batch'].map");
 replace("read(out,'rail-national-recovery-queue')", "read(out,'rail-continuity-recovery-queue')");
 replace("['kr-rail-expansion-','kr-rail-national-']", "['kr-rail-expansion-','kr-rail-national-','kr-rail-continuity-']");
 replace("for(const n of candidates){let best=null;", "for(const n of candidates){let best=null,byWay=new Map;");
 replace("if(!best||rank<best.rank)best={...p,rank,node:n,edge}", "const binding={...p,rank,node:n,edge};if(!byWay.has(edge.wayId)||rank<byWay.get(edge.wayId).rank)byWay.set(edge.wayId,binding);if(!best||rank<best.rank)best=binding");
 replace("if(best)options.push(best);", "if(best){if(best.nodeId)options.push(best);else options.push(...byWay.values())}");
 replace("&&!['yard','spur'].includes(w.tags?.service)&&(w.tags?.service!=='siding'||passengerWays.has(w.id))", "&&(!['yard','spur','siding'].includes(w.tags?.service)||passengerWays.has(w.id))");
 replace("id:'kr-rail-continuity-'+group.id", "id:'kr-rail-platform-'+group.id");
 replace("'kr-continuity-pattern-'+hash", "'kr-platform-pattern-'+hash");
 replace("'rail-continuity-recovery-'+name+'.json'", "'rail-platform-recovery-'+name+'.json'");
}

if(process.argv.includes('--platform-candidates')){
 // 연결 성분이 다른 선로는 즉시 제외하고 같은 출발점 탐색 결과를 여러 승강장 후보가 공유한다.
 replace("for(const binding of options[i]){let best=null;for(const state of states){", "const bestByBinding=new Map;for(const state of states){for(const binding of options[i]){let best=bestByBinding.get(binding)||null;");
 replace("}}if(best)next.push(best)}states=next;", "};if(best)bestByBinding.set(binding,best)}}next.push(...bestByBinding.values());states=next;");
 const a=source.indexOf('function shortest('),b=source.indexOf('const existing=',a);
 if(a<0||b<0)throw Error('선로 탐색기 계약 변경');
 source=source.slice(0,a)+\`function shortest(graph,start,end,limit=Infinity){
  const queryKey=start+'|'+end+'|'+limit;if(graph.cache.has(queryKey))return graph.cache.get(queryKey);
  if(!graph.componentParent){const parent=new Map,find=x=>{if(!parent.has(x))parent.set(x,x);let y=x;while(parent.get(y)!==y)y=parent.get(y);while(parent.get(x)!==x){const next=parent.get(x);parent.set(x,y);x=next}return y};for(const [x,edges] of graph.adjacency){for(const [y]of edges){const a=find(x),b=find(y);if(a!==b)parent.set(a,b)}}graph.componentParent=parent;graph.componentFind=find;graph.shortestTrees=new Map;}
  if(graph.componentFind(start)!==graph.componentFind(end)){graph.cache.set(queryKey,null);return null;}
  const radius=Math.ceil(limit),key=start+'|'+radius;let tree=graph.shortestTrees.get(key);
  if(!tree){const dist=new Map([[start,0]]),prior=new Map,heap=new Heap;heap.push([0,start]);while(heap.length){const [cost,node]=heap.pop();if(cost!==dist.get(node))continue;if(cost>radius)break;for(const [next,km]of graph.adjacency.get(node)||[]){const total=cost+km;if(total<=radius&&total<(dist.get(next)??Infinity)){dist.set(next,total);prior.set(next,node);heap.push([total,next])}}}tree={dist,prior};if(graph.shortestTrees.size>=12)graph.shortestTrees.delete(graph.shortestTrees.keys().next().value);graph.shortestTrees.set(key,tree);}
  const km=tree.dist.get(end);if(km===undefined||km>limit){graph.cache.set(queryKey,null);return null;}const ids=[end];while(ids[0]!==start)ids.unshift(tree.prior.get(ids[0]));const result={ids,lengthKm:km};graph.cache.set(queryKey,result);return result;
 }
 \`+source.slice(b);
}
// 공통 선로 원본은 복제하지 않고 식별자와 고정 해시로 참조한다.
replace("ways:[...usedWays.values()]", "sourceFile:'data/kr/v2/source/osm-ways.json',sourceSha256:hash(fs.readFileSync(path.join(base,'source','osm-ways.json'))),wayIds:[...usedWays.keys()]");
source=source.replaceAll("checkedAt:'2026-11-04'","checkedAt:'2026-11-05'");
`+marker);
const child=new Module(filename,module);child.filename=filename;child.paths=module.paths;child._compile(wrapper,filename);

if(process.argv.includes('--platform-candidates'))require('./lib/kr-official-pattern-references.cjs').attach('data/kr/canonical/rail-platform-recovery-batch.json');
