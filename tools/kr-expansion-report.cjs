'use strict';
const fs=require('node:fs'),cp=require('node:child_process');
const index=JSON.parse(fs.readFileSync('data/kr/generated/index.json','utf8'));
const read=n=>JSON.parse(fs.readFileSync('data/kr/canonical/'+n+'.json','utf8'));
const gbis=read('provincial-gbis-report'),busan=read('regional-busan-report'),village=read('regional-busan-village-report');
const failures={};
for(const f of gbis.failures){const key=/OTHER_AUTHORITY/.test(f.error)?'타 시도 관할: 중복·별도 출처 확인':/GEOMETRY_GAP/.test(f.error)?'원본 도로 선형 단절':/SHAPE_MISSING/.test(f.error)?'방향별 원본 도로 선형 누락':/STOPS_MISSING/.test(f.error)?'방향별 정류장 누락':/ROAD_BINDING/.test(f.error)?'정류장·도로 순서 결합 실패':'기타';failures[key]=(failures[key]||0)+1;}
const categories={};for(const r of index.routes){const k=r.normalizedCategory||r.category;categories[k]??={routes:0,directions:0};categories[k].routes++;categories[k].directions+=r.serviceCount;}
const preservedPaths=['data/hk','data/tw','data/jp-canonical','data/stations','js/game.js','js/typing.js','js/auth.js'];
const changedProtectedPaths=cp.execFileSync('git',['diff','--name-only','b86eb416','--',...preservedPaths],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const report={checkedAt:new Date().toISOString(),commit:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 baseline:{routes:471,directions:1091,stops:10487},current:{routes:index.routes.length,directions:index.counts.playableDirections,stops:index.counts.uniqueStops},
 added:{routes:index.routes.length-471,directions:index.counts.playableDirections-1091,stops:index.counts.uniqueStops-10487},categories,
 pending:{originalBusInventory:7304,seoul:65,tsbis:7239,additionalGbisRoutes:gbis.summary.failedRoutes,additionalGbisDirections:gbis.summary.failedDirections,busanRegular:busan.queued,busanVillage:village.queued,newOfficialRailPatterns:read('rail-expansion-report').queuedPatterns,note:'후보 출처·부분 실패 방향은 서로 다른 집합이다. 합산 노선 수로 해석하지 않는다.'},gbisFailureRecordsByType:failures,
 changedProtectedPaths,notes:['한국 기본 표기는 한글이며 원문 영문 약호는 발음으로 변환한 경우가 있다. 원문은 출처 스냅샷에 보존한다.','임시 한강버스 종료로 현재 선택 가능한 방향은 등록 방향보다 4개 적다.','전체 데이터 검사는 기존 일본 역 ID 중복으로 실패한다.','브라우저 완주와 전체 데이터 경로 해석 검사는 서로 다른 검증이다.']};
fs.writeFileSync('reports/kr-rebuild/expansion-summary.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
