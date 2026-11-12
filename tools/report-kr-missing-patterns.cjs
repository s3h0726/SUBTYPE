'use strict';
/* The 65 official SeoulMetro research bindings are not published game routes.
 * Find exact patterns absent in the published canon, without inventing
 * through services or presuming same operator/physical track. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {readBatches,assembleCanonicalRoutes}=require('./lib/kr-canonical.cjs');
const compiled=assembleCanonicalRoutes(readBatches(root));
if(compiled.rejected.length)throw Error('Canonical rejected data');
const rail=new Set(['rail','subway','commuter_rail','high_speed_rail','light_rail','monorail','airport_rail']);
const routes=compiled.routes.filter(x=>rail.has(x.mode));
if(routes.length!==55)throw Error('Published railway card count changed');
const compiledJourneys=routes.flatMap(route=>route.verifiedJourneys.map(j=>({routeId:route.id,mode:route.mode,operatorId:route.operatorId,journey:j,names:j.stations.map(s=>s.ko)})));
const bindings=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/timetable-service-bindings.json'),'utf8'));
const eq=(a,b)=>a.length===b.length&&a.every((s,i)=>s===b[i]);
const normal=name=>String(name||'').replace(/\s*\([^)]*호선\)\s*$/,'').trim();
const rows=bindings.map(b=>{
 const names=b.calls.map(c=>normal(c.officialStationName));
 const matches=compiledJourneys.filter(x=>eq(x.names,names));
 const candidates=compiledJourneys.filter(x=>x.names[0]===names[0]&&x.names.at(-1)===names.at(-1));
 const possibleParent=compiledJourneys.filter(x=>{
   const start=x.names.indexOf(names[0]),end=x.names.indexOf(names.at(-1));
   return start>=0&&end>start&&names.length<=end-start+1&&eq(x.names.slice(start,end+1),names);
 });
 const status=matches.length?'EXACT_PUBLIC_STOPS_MATCH':possibleParent.length?'EXACT_PUBLIC_PARENT_SLICE':'NOT_PUBLICLY_MAPPED';
 return {line_code:b.officialLineCode,service_id:b.serviceId,origin:b.origin,destination:b.destination,
  official_stop_count:names.length,public_status:status,
  public_exact_routes:matches.map(x=>x.routeId).join(';'),
  public_parent_routes:possibleParent.map(x=>x.routeId).join(';'),
  same_terminals_routes:candidates.map(x=>x.routeId).join(';'),
  operator_track_and_calendar_verified:'NO',
  notes:'Research source is SeoulMetro official file; requires operator identity and real-track direction before independent release'};
});
const cols=Object.keys(rows[0]),esc=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const file=path.join(root,'docs/timetable-audit/KR_MISSING_SEOULMETRO_PATTERN_CANDIDATES.csv');
fs.writeFileSync(file,[cols.join(','),...rows.map(r=>cols.map(k=>esc(r[k])).join(','))].join('\n')+'\n','utf8');
const counts=rows.reduce((m,r)=>(m[r.public_status]=(m[r.public_status]||0)+1,m),{});
const arex=JSON.parse(fs.readFileSync(path.join(root,'data/kr/canonical/arex-short-turns.json'),'utf8'));
const lines=[
 '# 대한민국 철도 시간표 누락 운행계통 추가 — 2026-11-12','',
 '## 공항철도 검암·디지털미디어시티 출발 구간운행 3개 추가','',
 '공항철도 공식 [검암역 운행시각표](https://www.airportrailroad.com/train/normal/info/070)에서 서울역 방면 05:30, 공항2터미널 방면 05:08 출발편을 확인했다. [디지털미디어시티역 공식 시각표](https://www.airportrailroad.com/train/normal/info/040)에서도 서울역 방면 05:30 출발을 확인했다. 인접역 첫 출발 시각과 제3자 시각표의 명시된 기점을 교차 검토했다.',
 '이 구간은 기존 인천공항철도의 같은 방향 OSM 실선로/역 ID/정차역을 slice하여 생성한다. 원본 선형과 기존 운행계통은 불변.',
 '',
 '| 추가한 운행계통 | 평일 공식 출발시각 | 실제 궤도 출처 |',
 '|---|---|---|',
 ...arex.patterns.filter(p=>p.id.startsWith('kr-arex-geomam-')||p.id==='kr-arex-dmc-seoul-local').map(p=>'| '+p.nameKo+' | '+p.observedDeparture+' | 기존 '+p.parentJourneyId+' |'),
 '',
 '## 서울교통공사 65개 연구용 계통과 정식 공개 계통 대조','',
 '연구/v2 2026-09-01 공식 시각표 65개와 정식 공개 철도 55개 카드에 포함된 실제 정차열을 문자 단위로 비교했다. 정확히 일치하거나 정차열이 같은 모체구간만 자동 구분했으며, 그 외는 **후속 선로·운영사 대조 필요**로 표시했다. 65개를 전부 새로 추가했다고 주장하지 않는다.',
 '',
 '| 상태 | 계통 수 |',
 '|---|---:|',
 ...Object.entries(counts).map(([k,v])=>'| '+k+' | '+v+' |'),
 '',
 '- [65개 연구용 시각표와 공개 계통의 대조 결과](KR_MISSING_SEOULMETRO_PATTERN_CANDIDATES.csv)',
 '- [공항철도 4개 공식 계통 근거 데이터](../../data/kr/canonical/arex-short-turns.json)',
 '- [실제 생성 소스](../../tools/lib/kr-arex-timetable.cjs)',
 '',
 '이 자료에서 신규 추가 계통은 **3개**이며, 연구용 65계통 전체를 공개하거나 검증 승격하지 않았다. 대중교통 버스는 검사·수정하지 않았다.'
];
fs.writeFileSync(path.join(root,'docs/timetable-audit/KR_MISSING_RAIL_PATTERNS_20261112.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({railRoutes:routes.length,railDirections:compiledJourneys.length,arexShortTurns:arex.patterns.length,addedArexDirections:3,seoulResearchPatterns:bindings.length,candidateClassifications:counts},null,2));
