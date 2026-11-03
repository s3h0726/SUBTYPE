'use strict';
// 생성 색인과 검증 결과를 집계한다. 미확인 범위를 완전하다고 승격하지 않는다.
const fs=require('node:fs'),z=require('node:zlib');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),s=read('reports/thailand/summary.json'),i=read('data/th/generated/index.json'),u=read('reports/thailand/unresolved.json'),inventory=read('reports/thailand/inventory.json'),browser=read('reports/thailand/browser-validation.json');
const routes=i.routes.map(m=>JSON.parse(z.gunzipSync(Buffer.from(read(m.lazySource).data,'base64'))).route),patterns=routes.flatMap(r=>r.patterns),table=rows=>rows.map(row=>'| '+row.join(' | ')+' |').join('\n'),tally=ids=>{const group=routes.filter(r=>ids.includes(r.category));return[group.length,group.reduce((n,r)=>n+r.patterns.length,0)]};
const overview=[['태국 철도 운영사',s.operators],['등록 물리 노선 카드',s.physicalRouteCards],['등록 운행계통',s.servicePatterns],['선택 가능 운행 방향',s.selectableDirections],['등록 역·정차장 식별자',s.stations],['실제 선형 확보 노선',s.geometryRoutes],['실제 플레이 가능 계통',s.playableServices],['미해결 후보',s.unresolved]],categories=[['태국 국철',['rail']],['광역철도',['commuter_rail']],['도시철도',['subway']],['모노레일',['monorail']],['공항철도',['airport_rail']],['기타',['automated-guideway']]].map(([name,ids])=>{const[a,b]=tally(ids);return[name,a,b,b]});
const regional=[['북부',[1]],['동북부',[2]],['남부',[4]],['동부',[3]],['매끌롱',[5,6]]].map(([name,regions])=>{const rs=routes.filter(r=>regions.includes(r.srtRegion));return[name,rs.length,rs.reduce((n,r)=>n+r.patterns.length,0),rs.map(r=>r.line.ko).join(' · ')]});
const text=`# 태국 전국 철도 구현·검증 보고서

검수일: 2026-11-03. 태국을 실제 국가 선택·검색·운행계통·방향·한국어 입력·원명 표시·기록·랭킹·이름 편집 흐름에 연결했다. 전국 완전성은 미확인이다.

## A. 개요

| 항목 | 결과 |
|---|---:|
${table(overview)}

노선 카드는 실제 선로 기반의 운영 노선/국철 권역별 묶음이다. 공유 선로가 있으므로 23개를 서로 중복 없는 토목 구간 수로 해석하지 않는다. 165개는 정차·선형·방향별 선택 패턴이며 동일 패턴의 열차번호는 합친다. 역 수는 노선별 물리 역 식별자 수로, 서로 다른 운영사의 환승 승강장은 별도 식별자를 유지한다.

## B. 분류

| 분류 | 노선 | 운행계통 | 플레이 가능 |
|---|---:|---:|---:|
${table(categories)}

## C. 국철 권역별 범위

| 권역 | 노선 카드 | 계통 | 공개 범위 |
|---|---:|---:|---|
${table(regional)}

북부는 현행 장거리의 롭부리 2 우회선과 구 롭부리 지역열차를 구분한다. 동북부는 우본·농카이·깽코이/부아야이를 분리하며 133/134호는 캄싸왓 실제 국제 종착역까지 연결한다. 남부는 키리랏니콤·깐땅·나콘시탐마랏·빠당브사르·남똑을 포함한다. 매끌롱 동·서 구간 사이에 여객선이나 도로를 철도로 연결하지 않는다. 수판부리·사완칼록·쭉싸멧 방면은 검증 부족으로 보류했다.

## D. 검증과 한계

- 정적 검증: 23개 노선, 165개 패턴, 4,733개 입력 정차 통과. gzip SHA-256, 식별자, 실제 시·종착, 단조 정차 위치, 전체 경로 해석을 검사했다.
- 실제 Chromium 완주: ${browser.runs.length}개 계통 통과. 정차 원문·한국어 정답, 조합 중 이동 방지, 중복 입력 한 번 이동, 실제 지도 도착, 종착 한 번 판정, 운행계통별 기록 저장을 확인했다.
- 브라우저 회귀: 일본·대한민국·홍콩·대만 전환 통과. 데스크톱 어두운 테마·모바일 밝은 테마에서 가로 넘침 없음. 머칫/짜뚜짝 환승 노선 지연 로딩과 승강장 좌표 분리를 추가 검증했다.
- 한글 입력: IME 컨트롤러 10개 픽스처와 입력 모델 18개 사례 통과. 브라우저는 합성 composition/input 이벤트를 사용했다. 운영체제 네이티브 IME 인증은 미실행이다.
- 자유주행 공통 회귀 17개, 원자료/단절/파서/환승 회귀 4개 통과.
- Supabase 연결 코드 모의 서버 검증: 계정 격리·랭킹 자격·정책·인증 리다이렉트·업로드/복원·오프라인 재시도 통과. 실계정으로 로그인한 운영 DB 쓰기는 미실행이다.
- 자료 수집 범위: 공식 공개 표에서 파악한 ${inventory.officialTrains.length}개 열차 후보 중 ${inventory.officialTrains.filter(t=>t.status==='SOURCE_SUPPORTED').length}개가 출처 대조를 통과했다. 현행 공개 전체 정차를 직접 사용한 패턴은 ${patterns.filter(p=>p.currentFullStops).length}개다. 그 밖의 국철은 2024-12-18 전체 정차와 현행 주요역 표를 대조했다. 모든 소역의 2026년 변경을 증명하지 않는다.
- 출처·라이선스·명령어: [자료 설명](../../data/th/README.md), [URL·SHA-256](../../data/th/source/manifest.json).
- 세부 결과: [정적 검증](static-validation.json), [브라우저 완주](browser-validation.json), [환승·모바일](browser-smoke/browser-validation.json), [기록·랭킹](records-validation.json).

## E. GitHub·배포 증거

검증한 배치를 main에 병합하고 Pages 배포 후 운영 색인과 대표 gzip 원본을 다시 확인한다. 배포 커밋 SHA·Actions URL·운영 HTTP 검증 결과는 최종 응답의 배포 검증 파일에 기록한다. 로컬 빌드 성공만으로 배포 성공을 선언하지 않는다.

## F. 보류 후보 전체

미해결 ${s.unresolved}건은 개별 열차 ${u.issues.length}건과 노선/확장 후보 ${u.candidates.length}건의 합이다. 미래·폐선·화물 후보는 플레이 대상에서 제외한다. 같은 원인도 각 후보별로 남긴다.

| 열차/후보 | 소속/상태 | 차단 사유 |
|---|---|---|
${table(u.issues.map(x=>[x.trainNumber||x.id,x.corridorId||x.status,String(x.reason).replace(/\|/g,'/')]))}
${table(u.candidates.map(x=>[x.nameKo||x.line?.ko||x.id,x.status,Array.isArray(x.reason)?x.reason.join('; '):x.reason]))}

[기계 판독 보류 목록](unresolved.json) · [전체 수집 재고](inventory.json)
`;
fs.writeFileSync('reports/thailand/README.md',text);console.log('한국어 보고서 생성: '+s.servicePatterns+'개 계통 · 보류 '+s.unresolved+'건');
