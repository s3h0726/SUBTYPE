'use strict';
// Read-only railway timetable audit. Operates on existing official-source research
// and published Korea rail card index; NEVER modifies buses or invents tracks.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {load,validate}=require('./lib/kr-network');
const {verifyBinding}=require('./verify-kr-timetable-bindings.js');
const ROOT=path.resolve(__dirname,'..'),BASE=path.join(ROOT,'data/kr/v2');
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
const docs=path.join(ROOT,'docs/timetable-audit');
const esc=x=>'"'+String(x??'').replaceAll('"','""')+'"';
function csv(file,rows) {
 assert(rows.length>0,file+' empty');
 const cols=Object.keys(rows[0]);
 fs.writeFileSync(path.join(docs,file),[cols.join(','),...rows.map(row=>cols.map(k=>esc(row[k])).join(','))].join('\n')+'\n','utf8');
}
const MODES=['subway','light_rail','rail','monorail','high_speed_rail','commuter_rail','airport_rail'];
function main(){
 const official=read('data/kr/source/timetables/official-updates-20261112.json');
 const index=read('data/kr/generated/index.json');
 const policy=read('data/kr/publication-policy.json');
 const compile=read('reports/kr-rebuild/catalog-validation.json');
 const railway=index.routes.filter(r=>MODES.includes(r.mode));
 assert.equal(railway.length,55,'Korean public rail card population changed');
 assert.equal(new Set(railway.map(r=>r.id)).size,55,'Duplicate rail IDs');
 assert.equal(index.routes.length,policy.publicRouteCount);
 assert.equal(index.routes.length,compile.publicRoutes);
 assert(railway.every(r=>!r.id.startsWith('kr-bus-')));
 assert.equal(compile.rejected.length,0,'Previously compiled canonical routes have rejections');
 for(const mode of MODES)
  assert.equal(railway.filter(r=>r.mode===mode).length,compile.byMode[mode]||0,mode+': original mode count differs');

 const routeRows=railway.map(r=>{
  const mode=r.mode;
  let sourceUrl='',validFrom='',status='SOURCE_REVIEW_REQUIRED',finding='';
  if(mode==='high_speed_rail'){
   const source=official.latestKorail.find(s=>s.category==='high_speed_rail');
   sourceUrl=source.url;validFrom=source.validFrom;
   status='NEW_2026_11_KTX_SOURCE_FOUND_COMPARISON_PENDING';
   finding='2026-11-01 revised KTX schedule newer than old 2026-05-15 reference; does not certify specific train';
  } else if(mode==='rail'){
   const source=official.latestKorail.find(s=>s.category==='rail');
   sourceUrl=source.url;validFrom=source.validFrom;
   status='NEW_2026_11_CONVENTIONAL_SOURCE_CANDIDATE';
   finding='2026-11-01 conventional schedule; operator/train type must be verified before matching';
  } else if(mode==='commuter_rail'){
   sourceUrl=official.korailBoard;status='OPERATOR_BOARD_LINKED';
   finding='Use current weekday/holiday source by line; not all canonical routes proved Korail-operated';
  } else if(mode==='airport_rail'){
   sourceUrl=official.arexUrl;status='TWO_AREX_PARTIAL_OPERATOR_SHORT_TURNS_EXIST';
   finding='Two operator-backed short turns exist, but full train clocks/days not verified';
  } else if(mode==='subway'){
   sourceUrl=official.seoulMetro.url;validFrom=official.seoulMetro.validFrom;
   status='SEOULMETRO_SOURCE_RESEARCH_NOT_PUBLISHED_ROUTE_MATCH';
   finding='Separate v2 official bindings must be matched to this exact canonical card by operator and stop identity';
  }
  return {country:'KR',route_id:r.id,operator:r.operator?.ko||r.operatorId||'',
   line_name:r.line?.ko||r.line?.en||r.id,mode,category:r.normalizedCategory||r.category||'',
   published_directions:r.serviceCount||0,source_status:status,
   official_source_url:sourceUrl,source_valid_from:validFrom,
   published_card_fully_timetable_verified:'NO',outstanding_evidence:finding};
 });
 const data=load(BASE);
 const {maps,errors}=validate(data,{base:BASE});
 assert.deepEqual(errors,[],'SeoulMetro research dataset schema invalid');
 const bindings=read('data/kr/v2/timetable-service-bindings.json');
 const trips=read('data/kr/v2/seoulmetro-trip-candidates.json');
 const verification=bindings.map(b=>verifyBinding(b,maps,trips));
 assert.equal(verification.length,65,'Official v2 pattern count changed');
 const byLine={},v2Rows=[];
 let sourceTrains=0;
 for(const v of verification){
  assert.equal(v.sourceId,official.seoulMetro.id);
  assert.deepEqual(v.groups.map(g=>g.calendarLabel),['DAY','SAT','END']);
  const calls=v.groups.reduce((n,g)=>n+g.trainCount,0);
  assert(v.groups.every(g=>g.trains.every(t=>t.calls.length===v.calls.length)),
   'Incomplete official timetable calls in '+v.serviceId);
  assert(v.verificationScope.includes('not track/platform'),'Timetable scope not independent of game release');
  byLine[v.officialLineCode]??={patterns:0,trains:0};
  byLine[v.officialLineCode].patterns++;
  byLine[v.officialLineCode].trains+=calls;
  sourceTrains+=calls;
  v2Rows.push({country:'KR',official_line:v.officialLineCode,
   v2_service_id:v.serviceId,origin:v.origin,destination:v.destination,
   official_direction:v.officialDirectionId,express:v.express,stop_calls:v.calls.length,
   trains_weekday:v.groups[0].trainCount,trains_saturday:v.groups[1].trainCount,
   trains_holiday:v.groups[2].trainCount,verified_source_trains:calls,
   source_id:v.sourceId,source_valid_from:official.seoulMetro.validFrom,
   verification_scope:'V2_OFFICIAL_TIMETABLE_ONLY_NOT_CANONICAL_RELEASE'});
 }
 assert.equal(sourceTrains,3308,'Official v2 train count changed');
 assert.deepEqual(Object.fromEntries(Object.entries(byLine).map(([k,v])=>[k,v.patterns])),
  {'1':42,'2':4,'4':16,'5':1,'8':2},'Line counts changed');
 const arex=read('data/kr/canonical/arex-short-turns.json');
 assert.equal(arex.patterns.length,2);
 csv('KR_RAIL_55_TIMETABLE_SCOPE.csv',routeRows);
 csv('KR_SEOULMETRO_65_OFFICIAL_SOURCE_BINDINGS.csv',v2Rows);
 const byMode=Object.fromEntries(MODES.map(m=>[m,railway.filter(r=>r.mode===m).length]));
 const md=[
 '# 대한민국 철도 시간표 감사 — 2026-11-12','',
 '## 범위','',
 'main에서 공개한 대한민국 철도 카드는 55개다. 한국 버스 8,220개 이상과 한강버스는 시각표 대조 범위에서 제외했으며 어떠한 데이터를 변경하지 않았다.',
 '철도 카드 55개는 출처/기존 자료/신규 자료의 적용 시기를 분류했다. 공표된 55개 노선의 모든 편성, 전 운행일, 임시 편성까지 전부 비교한 노선 수는 0개다.',
 '',
 '| 게임 분류 | 카드 수 |','|---|---:|',
 ...MODES.map(m=>'| '+m+' | '+byMode[m]+' |'),
 '| 전체 | 55 |','',
 '## 서울교통공사 공식 시간표와 별도 연구 레이어 대조','',
 '원본은 서울교통공사 2026-09-01 공식 열차운행 시각표다: '+official.seoulMetro.url,
 '저장된 원본 열차 행/역 코드/순서/시각, 평일·토요일·휴일 구분을 기존 연구용 네트워크에 다시 대조했다.',
 '**공식 대조를 통과한 별도 연구 계통 65개, 열차 레코드 3,308개**는 1·2·4·5·8호선에 분포한다. 승강장, OSM 선로 방향, 휴일 예외, 공개 게임 전환 심사는 별개다.',
 '',
 '| 공식 호선 | 연구 계통 | 원본 열차 |','|---|---:|---:|',
 ...Object.entries(byLine).sort((a,b)=>Number(a[0])-Number(b[0])).map(([k,v])=>'| '+k+'호선 | '+v.patterns+' | '+v.trains+' |'),
 '| 합계 | 65 | 3,308 |','',
 '## KORAIL 최신 자료 갱신 필요','',
 '- KTX: 2026-11-01 최신 공식 엑셀 '+official.latestKorail[0].url,
 '- 일반열차: 2026-11-01 최신 공식 엑셀 '+official.latestKorail[1].url,
 '- 공식 시간표 게시판: '+official.korailBoard,
 '- 저장소 기존 KTX 2026-05-15 / 일반열차 2026-09-01 시각표는 위 두 신규 버전으로 재검증해야 한다. 출처 식별을 검증 통과로 계산하지 않는다.',
 '- 수도권·광역전철은 평일과 휴일을 각각 적용해야 하며 2026-09-01 이후 임시 운휴·편성 변경도 별도 점검 대상이다.',
 '- 공항철도: 서울역→검암과 인천공항2터미널→디지털미디어시티의 공식 정차 안내 기반 부분 계통 2개가 기존 게임에 추가돼 있다. 전체 열차 시각표 대조는 아직 아니다.',
 '',
 '## 검증 결론 및 증거 파일','',
 '- 공개 55개 철도 카드: 공식 시각표 전체 검증 0개. 철도 카드별 출처 후보와 문제 목록을 기록했다.',
 '- 연구용 서울교통공사 65개 계통: 시간표 출처와 역명·정차 순서·시각·DAY/SAT/END 그룹 검사 성공. 공개 게임과 계통 동일성을 입증한 것은 아니다.',
 '- 자료: KR_RAIL_55_TIMETABLE_SCOPE.csv, KR_SEOULMETRO_65_OFFICIAL_SOURCE_BINDINGS.csv.',
 '- 재현: node --test tools/test-kr-timetable-bindings.cjs, node tools/audit-kr-rail-timetable-20261112.cjs.',
 '',
 '실제 공개 노선의 완전 시각표 검증 여부와 독립 연구 검증 결과를 혼동하지 않는다.'
 ].join('\n')+'\n';
 fs.writeFileSync(path.join(docs,'KR_RAIL_TIMETABLE_AUDIT_20261112.md'),md,'utf8');
 const summary={publishedRailCards:railway.length,publishedDirections:routeRows.reduce((n,r)=>n+r.published_directions,0),
  publishedFullTimetableVerified:0,officialResearchPatterns:verification.length,
  officialResearchTrainRecords:sourceTrains,previousArexShortTurns:arex.patterns.length,byMode,byLine};
 console.log(JSON.stringify(summary,null,2));
 return summary;
}
module.exports={main};
if(require.main===module)main();
