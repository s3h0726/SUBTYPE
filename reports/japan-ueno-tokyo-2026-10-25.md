# 우에노도쿄라인(上野東京ライン) 구현 검증 기록

`line-11343`은 우에노–도쿄 2개 역의 실제 연결선으로 유지한다.
2026 JR 동일본 시각표에 확인된 4개 출발·종착 조합 7개 방향을 등록했다. 일반열차가 아닌 히타치·토키와·나리타 익스프레스는 절대 섞지 않는다.

## 활성 운행계통
- 우츠노미야 ↔ 오다와라 보통: https://timetables.jreast.co.jp/2611/train/100/100371.html ; https://timetables.jreast.co.jp/2611/train/070/070401.html
- 코가네이 ↔ 아타미 보통: https://timetables.jreast.co.jp/2610/train/035/039791.html ; https://timetables.jreast.co.jp/2610/train/040/040481.html
- 타카사키 → 아타미 보통: https://timetables.jreast.co.jp/2610/train/110/113131.html (역방향은 시간표 미확인)
- 카고하라 ↔ 오다와라 보통: https://timetables.jreast.co.jp/2610/train/040/040291.html ; https://timetables.jreast.co.jp/2611/train/060/064661.html

## 실제 선형과 차단된 구간
- 우츠노미야선·타카사키선의 우에노역 좌표와 우에노도쿄라인 북단 좌표 일치
- 도카이도선 도쿄역 좌표와 우에노도쿄라인 남단 좌표 일치
- 조반선은 데이터상 우에노역의 선로 좌표가 닛포리 부근에 있어 접속 거리 약 1.7km. 확실한 실선 선형 확인 전에는 서비스 패턴을 공개하지 않음
- 3개 물리 노선 폴리라인을 선택 시 조립하며 신규 직선 경로를 만들지 않음

## 확인 명령
`node tools/test-ueno-tokyo-line.cjs`

기타 계통과 특급 열차, 무검증 전국 카탈로그의 자동 병합을 허용하지 않는다.

## 조반선 직통 5개 방향 추가 (2026-10-25)
JR 동일본 2026년 11월 시간표 기준으로 다음 5개 패턴을 등록했다.
- 쓰치우라→시나가와 보통 1188M: https://timetables.jreast.co.jp/2611/train/075/077951.html
- 시나가와→쓰치우라 보통 1155M: https://timetables.jreast.co.jp/2611/train/075/077331.html
- 도리데→시나가와 쾌속 656H: https://timetables.jreast.co.jp/2611/train/085/086801.html
- 시나가와→도리데 쾌속 2187H: https://timetables.jreast.co.jp/2611/train/105/106641.html
- 시나가와→쓰치우라 특별쾌속 3189M: https://timetables.jreast.co.jp/2611/train/075/077491.html

보통·쾌속·특별쾌속의 정차역은 실제 시간표대로 분리한다. 조반선 완행역과 통과역은 타이핑 정차역에서 제외한다.

주의: 기존 조반선 line-11320 우에노↔닛포리 첫 선형은 우에노 좌표가 닛포리 근처로 잘못되어 약 1.7km의 접속 단절이 있다.
원본 데이터는 훼손하지 않고 우에노↔닛포리 구간만 MLIT N02-2025 기반 게이힌토호쿠선(line-11332) 실제 철도 곡선 좌표를 병행선로 지리 참조로 사용했다.
선형 연결점은 0m로 일치하나, 조반선 열차가 실제로 타는 정확한 궤도와 일치하는지는 미검증이다.
OSM 개별 레일 way 또는 공식 선로 GIS를 통한 정밀 대체가 후속 작업이며, 이 임시 선형을 정확한 조반선 선로라고 주장해서는 안 된다.

회귀 검사: node tools/test-ueno-tokyo-line.cjs && node tools/test-ueno-tokyo-joban.cjs

역명 표기: 土浦는 '츠치우라'로 통일(나무위키 표제어 및 기존 역 데이터 기준).

## 조반선 중거리 직통 확대 — 미토·카츠타·타카하기 (2026-10-25)

2026년 11월 JR 동일본 공식 열차별 시간표에서 아래 6개 운행 방향을 확인하고 기존 우에노도쿄라인 카탈로그에 추가했다.
- 미토→시나가와 보통 1242M (평일): https://timetables.jreast.co.jp/2611/train/075/078251.html
- 시나가와→미토 보통 1179M (평일): https://timetables.jreast.co.jp/2611/train/075/077441.html
- 카츠타→시나가와 보통 1236M (토·휴일): https://timetables.jreast.co.jp/2611/train/075/078201.html
- 시나가와→카츠타 보통 1235M (평일): https://timetables.jreast.co.jp/2611/train/075/077661.html
- 타카하기→시나가와 보통 1148M (토·휴일): https://timetables.jreast.co.jp/2611/train/075/077811.html
- 시나가와→타카하기 보통 1187M (운행일은 공식 시간표 캘린더 참조): https://timetables.jreast.co.jp/2611/train/130/132401.html

정차역: 도리데 이북(타카하기·카츠타·미토~도리데)의 실제 철도 순서상 각역 및 도리데 이남의 공식 조반선 쾌속 정차역을 사용한다.
기존 단거리 조반선 5개 방향과 우츠노미야/다카사키 계통 7개 방향은 변경하지 않았다. 우에노도쿄라인 합계 18개 방향·10개 그룹이다.

닛포리~우에노에 사용된 병행 JR 노선 선형은 여전히 잠정 선형이다. 실제 조반선 전용 궤도 정밀 좌표의 공식/OSM way 식별은 미완료이다.
플레이 선택 요약에 '닛포리~우에노 잠정 선형'이라고 고지하고, 기하 데이터 출처 provenance에 정확한 선로 검증 미완료 표시를 유지한다.
