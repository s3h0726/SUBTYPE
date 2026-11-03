# 태국 역명 통합 검수 기록 (2026-11-03)

- 대상: `data/th/generated/names.json` 역명 758개. 이는 전수 **데이터 검사**이지 전수 **공식 명칭 검증**이 아닙니다.
- 검토 기준: 태국어 원명 보존, 기존 한국어 통용명 존중, 노선별 동일 역명 일관성, 국립국어원 외래어 표기법.
- 규범 참고: https://korean.go.kr/kornorms/regln/reglnView.do
#
## 기계 검사 결과

- 태국어 동일 원명 중복 그룹: 26
- 동일 태국어 원명에 서로 다른 한글명이 남은 그룹: 0
- 별도 검토 후보(초성 음역 패턴·분기/국경 등): 18

## 아직 개별 원어 대조가 필요한 후보

| ID | 기존 검토 대상 한국어 | 태국어 | 영어 |
|---|---|---|---|
| th-srt-1007 | 방쓰 분기 | ชุมทางบางซื่อ | Bang Sue Junction |
| th-srt-1036 | 반파치 분기 | ชุมทางบ้านภาชี | Ban Phachi Junction |
| th-srt-1137 | 반다라 분기 | ชุมทางบ้านดารา | Ban Dara Junction |
| th-srt-2115 | 타논찌라 분기 | ชุมทางถนนจิระ | Thanon Chira Junction |
| th-srt-2233 | 반쌀랭판 | บ้านแสลงพัน | Ban Salaeng Phan |
| th-srt-2011 | 깽코이 분기 | ชุมทางแก่งคอย | Kaeng Khoi Junction |
| th-srt-2136 | 부아야이 분기 | ชุมทางบัวใหญ่ | Bua Yai Junction |
| th-srt-2024 | 콕쌀룽 | โคกสลุง | Khok Salung |
| th-srt-4347 | 핫야이 분기 | ชุมทางหาดใหญ่ | Hat Yai Junction |
| th-srt-4400 | 따쎄 | ตาเซะ | Tase |
| th-srt-4412 | 반쌀로 부낏여래 | บ้านสะโลว์บูกิ๊ตยือแร | Ban Salo Bukit Yuaerae |
| th-srt-4270 | 퉁송 분기 | ชุมทางทุ่งสง | Thung Song Junction |
| th-srt-4300 | 카오춤텅 분기 | ชุมทางเขาชุมทอง | Khao Chum Thong Junction |
| th-srt-4229 | 반퉁포 분기 | ชุมทางบ้านทุ่งโพธิ์ | Ban Thung Pho Junction |
| th-srt-4020 | 농쁠라둑 분기 | ชุมทางหนองปลาดุก | Nong Pla Duk Junction |
| th-srt-4072 | 사판탐끄라쎄 | สะพานถ้ำกระแซ | Saphan Tam Krasae |
| th-srt-3023 | 차층사오 분기 | ชุมทางฉะเชิงเทรา | Chachoengsao Junction |
| th-srt-3057 | 클롱십까오 분기 | ชุมทางคลองสิบเก้า | Khlong Sip Kao Junction |

## 후속 검증

1. 태국 국철 역별 한국어 표기를 국립국어원 자모 대응표와 현지 역명판, 지도 표기 근거에 따라 개별 확인할 것.
2. `data/th/generated/routes/*.json`는 gzip 페이로드를 포함하므로 소스 수정 후 `node tools/build-thailand.cjs`로 전체 재생성해야 게임 주행 반영을 주장할 수 있음.
3. 검증되지 않은 역명에 `koVerified: true`를 임의로 지정하지 말 것.
4. 노선명/역명 편집표에서 저장한 변경이 `data/th/korean-overrides.json`에 도달하는지 확인할 것.


---

## 후속: 나무위키 노선별 역명 대조 (2026-11-03)

- 대상: 태국 역명 **758건** 중 방콕 철도 10개 노선 문서로 대조 가능한 도시·광역철도 **194건**, 국철 4건을 추가로 개별 대조했다.
- 발견 및 반영: 원래 프로젝트와 표기가 다른 **83건**(도시·광역 79건, SRT 국철 4건). 재검증 가능한 ID, 이전 표기, 한국어 표기, 태국어·영어 원명과 노선 문서 URL은 `data/th/namuwiki-station-names.json`에 있다.
- 실행 경로: `data/th/korean-urban.json`, `data/th/korean-stations.txt` 원본 및 `data/th/generated/names.json`, `data/th/generated/index.json` 수정. `tools/build-thailand.cjs`가 해당 근거표와 사용자 편집 우선순위를 읽도록 변경했다.
- 게임: `js/app.bundle.js`는 태국 데이터를 로딩할 때 83개 근거표를 불러와 기존 압축 노선의 한국어 이름을 보정한다. 파일 누락 시에는 이전 압축 이름으로 안전하게 동작한다.
- 정적 일관성 검사 결과: 83/83 출처 매핑 ID가 원본 데이터, 편집표 및 색인에서 일치함. 실제 브라우저 주행과 Github Pages 배포 성공은 아직 검증하지 않았다.
- 국철 전체에 대해 나무위키에 개별 역 문서가 충분하지 않으므로 남은 564건을 '나무위키 검증 완료'라고 표시하지 않았다.

### 확인한 나무위키 문서
- [수쿰윗선](https://namu.wiki/w/수쿰윗선), [실롬선](https://namu.wiki/w/실롬선), [방콕 도시철도(골드라인)](https://namu.wiki/w/방콕%20도시철도)
- [블루 라인](https://namu.wiki/w/방콕%20MRT%20블루%20라인), [퍼플 라인](https://namu.wiki/w/방콕%20MRT%20퍼플%20라인), [옐로 라인](https://namu.wiki/w/방콕%20MRT%20옐로%20라인), [핑크 라인](https://namu.wiki/w/방콕%20MRT%20핑크%20라인)
- [에어포트 레일 링크](https://namu.wiki/w/에어포트%20레일%20링크), [SRT 다크 레드](https://namu.wiki/w/방콕%20SRT%20다크%20레드%20라인), [SRT 라이트 레드](https://namu.wiki/w/방콕%20SRT%20라이트%20레드%20라인), [마까산역](https://namu.wiki/w/마까산역)

### 무조건 통일하지 않은 이름
- `th-bem-blue-BL21` 펫부리와 `th-srt-4101` 펫차부리는 태국어 원명이 같지만 다른 지역의 물리 역이다. 합치거나 ID를 공유하지 않는다.
- `th-nbm-pink-PK14` 락씨와 `th-srtet-darkred-RN06` 락시는 나무위키의 서로 다른 노선 문서에 표기 차이가 있어 후속 역 문서 확인이 필요하다.
- 태국어 원문과 실제 운행계통은 나무위키 표기와 별도로 공식 SRT/MRT/BTS 데이터를 기준으로 유지한다.
