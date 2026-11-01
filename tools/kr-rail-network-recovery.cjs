'use strict';
// Reuse the audited timetable/source-edge compiler. Recovery expands the graph
// to retained passenger-route ways, never to a road router or invented joins.
// Only the original 407 queued stopping patterns are eligible in this pass.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'kr-rail-expansion.cjs');let source=fs.readFileSync(filename,'utf8');
function replace(old,next){if(!source.includes(old))throw Error('Recovery compiler contract changed: '+old);source=source.replace(old,next)}
replace('for(const s of services)for(const p of s.paths||[])','for(const s of data.services)for(const p of s.paths||[])');
replace("const existing=[...read(out,'rail-batch').routes,...read(out,'rail-highspeed-batch').routes];","const existing=require('./lib/kr-canonical.cjs').assembleCanonicalRoutes(['rail-batch','rail-highspeed-batch','rail-expansion-batch'].map(n=>({name:n,...read(out,n)}))).routes;\nconst queuedTripIds=new Set(read(out,'rail-expansion-queue').candidates.flatMap(q=>q.tripIds));");
replace('for(const group of groups){',"for(const group of groups){\ngroup.trips=group.trips.filter(t=>queuedTripIds.has(t.id));if(!group.target&&existing.some(r=>r.id==='kr-rail-expansion-'+group.id))group.target='kr-rail-expansion-'+group.id;");
replace("id:'kr-rail-expansion-'+group.id","id:'kr-rail-network-'+group.id");
replace("'kr-expansion-pattern-'+hash","'kr-network-pattern-'+hash");
replace("'rail-expansion-'+name+'.json'","'rail-network-recovery-'+name+'.json'");
replace('공식 완전 열차열·출발과 종착·전 정차순서를 원본 후보 선로 그래프와 대조. 다른 물리적 위치를 이름만으로 연결하지 않음.','원래 대기 407개 정차 패턴을 공식 열차 전체 정차 순서 및 보관된 여객노선 원본 선로 그래프와 대조. 원본 공통 노드로만 접속하며 역명만으로 다른 장소를 연결하지 않음.');
const child=new Module(filename,module);child.filename=filename;child.paths=module.paths;child._compile(source,filename);
