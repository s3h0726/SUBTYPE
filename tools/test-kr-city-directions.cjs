'use strict';
// 실제 대전 원본의 한 방향을 손상시켜 반대 방향 보존과 실패 사유 기록을 검증한다.
const fs=require('node:fs'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const build=require('./lib/kr-other-city-patterns.cjs'),base='data/kr/canonical/';
const rows=JSON.parse(fs.readFileSync(base+'daejeon-source/inventory.json','utf8').replace(/^\uFEFF/,''));
const operators=JSON.parse(fs.readFileSync(base+'daejeon-operators.json'));
const read=(id,kind)=>JSON.parse(zlib.gunzipSync(fs.readFileSync(base+'daejeon-source/'+id+'-'+kind+'.json.gz')));
const meta=rows.find(m=>String(m.routeCd)==='30300153');assert(meta,'기존 양방향 검증 노선');
const original=build({city:'daejeon',id:String(meta.routeCd),meta,read,operators});assert.equal(original.patterns.length,2);
for(const blocked of ['up','down']){
 const result=build({city:'daejeon',id:String(meta.routeCd),meta,operators,read:(id,kind)=>kind===blocked+'-shape'?{list:[[[127,36],[127.001,36]],[[128,37],[128.001,37]]]}:read(id,kind)});
 assert.equal(result.patterns.length,1);assert.deepEqual(result.patterns,original.patterns.filter(p=>p.directionId!==blocked));
 assert.deepEqual(result.failedDirections,[{id:String(meta.routeCd),direction:blocked,status:'GEOMETRY_UNRESOLVED',reason:'공식 도로 구간 사이 25미터 초과 단절'}]);
 assert(!result.sourceKinds.includes(blocked+'-shape'),'실패한 방향을 공개 선형 근거로 사용하지 않는다');
}
console.log('대전 양방향 독립 검사 2건 통과: 검증 방향 보존, 단절 방향 차단, 원인 기록');
