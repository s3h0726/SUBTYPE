'use strict';
// 보관 OSM의 노드 연결만 사용한다. 시간표와 공개·운행 상태는 수정하지 않는다.
const fs=require('node:fs'),path=require('node:path');
const {orientOrderedWays}=require('./lib/kr-osm-order');
const {orientMemberChain}=require('./lib/kr-member-chain');
const {applyTopologyCorrection,relationHash}=require('./lib/kr-topology-corrections');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2');
const read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8'));
const ways=new Map(read('source/osm-ways').map(w=>[w.id,w]));
const facilities=new Map(read('source/osm-62-20261017/osm-ways').map(w=>[w.id,w]));
const relations=read('source/osm-relations'),corrections=read('topology-corrections');
const services=read('services'),stops=new Map(read('stops').map(s=>[s.osmNodeId,s]));
const known=new Set(corrections.map(c=>c.relationId)),added=[],review=[];
const rail=w=>w?.tags?.railway==='rail'&&w.tags.bridge==='yes'&&!['yard','spur','siding'].includes(w.tags.service);
for(const relation of relations){
 if(known.has(relation.id)||relation.tags.type!=='route'||!['train','subway','light_rail','monorail','tram'].includes(relation.tags.route))continue;
 const members=relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role));
 const stopMembers=relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role)),ids=stopMembers.map(m=>m.ref);
 if(ids.length<2)continue;
 const before=orientOrderedWays(members,ways,ids);if(before.status==='UNIQUE_SOURCE_ORDER')continue;
 const config={relationId:relation.id,relationSha256:relationHash(relation),reviewedOn:'2026-11-18',sourceUrl:'https://www.openstreetmap.org/relation/'+relation.id,scope:'원본 노드·회원 순서·교량 시설 오참조 보정. 운행·시간표 검증 및 공개 승인과 분리.'};
 const missing=members.map((m,i)=>({m,i})).filter(({m})=>!ways.has(m.ref));
 if(missing.length===1){
  const {m,i}=missing[0],facility=facilities.get(m.ref);
  if(!facility||facility.tags?.man_made!=='bridge'||facility.tags.railway||facility.nodeIds[0]!==facility.nodeIds.at(-1))continue;
  // 외곽선 안의 실제 교량 선로를 검사하고 유일한 완전 연결만 채택한다.
  const ys=facility.coordinates.map(p=>p[0]),xs=facility.coordinates.map(p=>p[1]);
  const eligible=[...ways.values()].filter(w=>rail(w)&&!members.some(m=>m.ref===w.id)&&w.coordinates.every(p=>p&&p[0]>=Math.min(...ys)-1e-7&&p[0]<=Math.max(...ys)+1e-7&&p[1]>=Math.min(...xs)-1e-7&&p[1]<=Math.max(...xs)+1e-7));
  const candidates=[];
  for(const a of eligible)for(const list of [[a],...eligible.filter(b=>b.id!==a.id).map(b=>[a,b])]){
   const candidate={...config,reason:'NON_RAIL_BRIDGE_MEMBER',replacedMember:{memberIndex:i,wayId:m.ref,sourceVersion:facility.version,sourceRole:m.role,facilitySha256:relationHash(facility)},replacementWays:list.map(w=>({wayId:w.id,sourceVersion:w.version,sha256:relationHash(w)}))};
   try{applyTopologyCorrection(relation,ways,candidate,facilities);candidates.push(candidate)}catch{}
  }
  if(candidates.length!==1){review.push({relationId:relation.id,reason:'교량 대체 선로의 유일성 미확보',candidates:candidates.length});continue;}
  Object.assign(config,candidates[0]);
 }else if(!missing.length){
  const loose=orientOrderedWays(members.map(m=>({...m,role:''})),ways,ids);
  if(loose.status==='UNIQUE_SOURCE_ORDER'){
   config.reason='CONFLICTING_MEMBER_ROLES';
   config.roles=members.flatMap((m,i)=>{const role=loose.parts[i].reverse?'backward':'forward';return m.role&&role!==m.role?[{memberIndex:i,wayId:m.ref,sourceVersion:ways.get(m.ref).version,sourceRole:m.role,role}]:[]});
  }else{
   const chain=orientMemberChain(members,ways,ids);if(chain.status!=='UNIQUE_SOURCE_ORDER')continue;
   config.reason='MISORDERED_MEMBERS';
   config.orderedMembers=chain.memberOrder.map((idx,i)=>({sourceIndex:idx,wayId:members[idx].ref,sourceVersion:ways.get(members[idx].ref).version,sourceRole:members[idx].role,role:chain.members[i].role}));
  }
 }else continue;
 try{
  const result=applyTopologyCorrection(relation,ways,config,facilities),oriented=orientOrderedWays(result.members,ways,ids);
  if(oriented.status!=='UNIQUE_SOURCE_ORDER')throw Error('원본 정차 노드 순서 미입증');
  const service=services.find(s=>s.id==='kr-osm-service-'+relation.id);if(!service)throw Error('기존 가져오기 서비스 없음');
  const calls=stopMembers.map((m,i)=>{const stop=stops.get(m.ref);if(!stop)throw Error('원본 정차지 없음');return{stopId:stop.id,geometryIndex:oriented.stopIndices[i],boarding:m.role!=='stop_exit_only',alighting:m.role!=='stop_entry_only'}});
  const paths=oriented.parts.map(p=>({geometryId:'kr-geometry-'+p.wayId,reverse:p.reverse}));
  const failures=new Set(['MISSING_MEMBER_WAY','DISCONNECTED_MEMBERS','STOP_NOT_ON_ORDERED_TRACK','DISCONNECTED_ORDERED_WAYS','ORDERED_STOPS_NOT_ON_TRACK']);
  const preserved={status:service.status,access:service.access,playable:service.playable};
  if(process.argv.includes('--write'))Object.assign(service,{paths,stops:calls,topologyCorrection:result.evidence,issues:service.issues.filter(i=>!failures.has(i.code))});
  corrections.push(config);added.push({relationId:relation.id,nameKo:relation.tags['name:ko']||relation.tags.name,reason:config.reason,before:before.status,after:oriented.status,ways:paths.length,stops:calls.length,preserved,config});
 }catch(error){review.push({relationId:relation.id,reason:String(error.message)})}
}
const report={checkedOn:'2026-11-18',scope:'보관된 OSM 스냅샷의 가져오기 보정. OSM 본서버 편집 및 시간표 확인 없음.',sourceSnapshot:read('source/osm-manifest').snapshotTimestamp,scannedRelations:relations.length,addedCorrections:added.length,added,review};
fs.mkdirSync(path.join(root,'reports/kr-rebuild'),{recursive:true});
const reportPath=process.argv.find(a=>a.startsWith('--report='))?.slice(9)||'reports/kr-rebuild/20261118-osm-topology-repair.json';
fs.writeFileSync(path.resolve(root,reportPath),JSON.stringify(report,null,2)+'\n');
if(process.argv.includes('--write')){fs.writeFileSync(path.join(base,'topology-corrections.json'),JSON.stringify(corrections,null,2)+'\n');fs.writeFileSync(path.join(base,'services.json'),JSON.stringify(services,null,2)+'\n');}
console.log(JSON.stringify({scannedRelations:relations.length,addedCorrections:added.length,relations:added.map(x=>({id:x.relationId,name:x.nameKo,reason:x.reason})),review:review.length,write:process.argv.includes('--write')},null,2));
