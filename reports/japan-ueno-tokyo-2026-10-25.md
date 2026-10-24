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
