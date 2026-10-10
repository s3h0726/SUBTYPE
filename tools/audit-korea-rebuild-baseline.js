#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const index=read('data/kr/generated/index.json');
const rows=[];

for(const meta of index.routes||[]){
  const route=read(meta.lazySource).route;
  const primary=route.directions?.[0]?.stops||route.stations||[];
  const directions=route.directions||[];
  const segments=directions.flatMap(direction=>direction.directedSegments||[]);
  rows.push({
    routeId:meta.id,
    passengerLineId:meta.passengerLineId||'',
    passengerLineName:meta.passengerLineName||meta.names?.ko||'',
    artifactName:meta.names?.ko||'',
    mode:meta.mode||'',
    operatorId:meta.operatorId||'',
    stationEntries:primary.length,
    missingCoordinates:primary.filter(stop=>stop.latitude==null||stop.longitude==null).length,
    geometryStatus:meta.geometryStatus||'missing',
    geometryReady:meta.geometryReady===true,
    candidateSegments:segments.length,
    twoPointSegments:segments.filter(segment=>(segment.geometry||[]).length===2).length,
    sourceStatus:meta.sourceStatus||'',
    sourceLicenseStatus:meta.sourceLicenseStatus||'unverified',
    serviceValidationStatus:meta.serviceValidationStatus||'unverified',
    gameValidationStatus:meta.gameValidationStatus||'not-run',
    releaseStatus:meta.releaseStatus||'unknown',
    visible:meta.playable!==false&&meta.visibility!=='internal'
  });
}

const groups=new Map;
for(const row of rows){if(!groups.has(row.passengerLineId))groups.set(row.passengerLineId,[]);groups.get(row.passengerLineId).push(row.routeId)}
const summary={
  status:'INCOMPLETE',
  baselineCommit:'29cfff8',
  auditedAt:'2026-10-10',
  routeArtifacts:rows.length,
  passengerLineCards:groups.size,
  visibleArtifacts:rows.filter(row=>row.visible).length,
  geometryReady:rows.filter(row=>row.geometryReady).length,
  quarantinedGeometry:rows.filter(row=>row.geometryStatus==='quarantined').map(row=>row.routeId),
  missingCoordinates:rows.reduce((sum,row)=>sum+row.missingCoordinates,0),
  unverifiedSourceLicenses:rows.filter(row=>row.sourceLicenseStatus!=='verified').length,
  servicePatternsVerified:rows.filter(row=>row.serviceValidationStatus==='verified').length,
  gameValidated:rows.filter(row=>row.gameValidationStatus==='passed').length,
  blockers:[
    'No Korean route has passed the strict real-geometry gate.',
    'The imported metropolitan source has no published reusable data license.',
    'Existing route fragments are not yet verified operating patterns.',
    'PC/mobile browser driving validation has not run for any Korean route.'
  ]
};
const outputDir=path.join(root,'data/kr/audit');
fs.mkdirSync(outputDir,{recursive:true});
fs.writeFileSync(path.join(outputDir,'REBUILD_BASELINE.json'),JSON.stringify({summary,passengerLineFamilies:Object.fromEntries(groups),routes:rows},null,2)+'\n');
const escape=value=>{const text=String(value??'');return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text};
const columns=Object.keys(rows[0]);
fs.writeFileSync(path.join(outputDir,'REBUILD_ROUTE_STATUS.csv'),[columns.join(','),...rows.map(row=>columns.map(column=>escape(row[column])).join(','))].join('\n')+'\n');
const markdown=`# 대한민국 철도망 재구축 기준 감사\n\n- 판정: **미완료**\n- 기준 커밋: \`${summary.baselineCommit}\`\n- 기존 경로 아티팩트: ${summary.routeArtifacts}개\n- 통합 노선 카드 후보: ${summary.passengerLineCards}개\n- 실제 선형 검증 완료: ${summary.geometryReady}개\n- 격리한 선형 후보: ${summary.quarantinedGeometry.join(', ')}\n- 좌표 누락 역 항목: ${summary.missingCoordinates}개\n- 출처 라이선스 미검증: ${summary.unverifiedSourceLicenses}개 경로\n- 운행계통 검증 완료: ${summary.servicePatternsVerified}개\n- 게임 검증 완료: ${summary.gameValidated}개\n\n## 즉시 차단한 오류\n\n- 브라우저에서 역을 가까운 OSM 선로에 자동 스냅하고 완료 처리하던 서울 2호선 코드\n- 검증 상태와 무관하게 전역 선로 묶음을 임의 결합하던 지도 폴백\n- 상세 JSON과 인덱스의 운영기관 불일치를 브라우저 패치로 숨기던 코드\n- 선형 상태가 \`ready\`가 아닌데도 \`geometryReady\`였던 4개 경로\n\n## 다음 단계\n\n각 통합 노선 카드에 법적 노선, 여객 노선, 운행계통을 분리하고 공식 역 순서를 확정한 뒤, OSM relation/way 원본과 구간별 위상을 검증한다. 모든 검증을 통과하기 전에는 \`geometryReady\`와 게임 완료 상태를 활성화하지 않는다.\n`;
fs.writeFileSync(path.join(outputDir,'REBUILD_BASELINE.md'),markdown);
console.log(JSON.stringify(summary,null,2));
