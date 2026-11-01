# 피크트램 2/2 방향

가든 로드(99801) → 케네디 로드(99802) → 맥도널 로드(99803) → 메이 로드(99804) → 바커 로드(99805) → 피크(99806), 하행은 반대 순서다. 정부 정차 목록의 여섯 identity를 그대로 사용한다. 998xx는 정부 식별자이며 공개 역 코드로 표시하지 않는다.

원본: [정부 정차 자료](https://static.data.gov.hk/td/routes-and-fares/RSTOP_PTRAM.mdb), 보존 추출 `data/hk/sources/phase6/peak-stops-extracted.json`, OSM relation 3264047. 선형과 교행 구간은 이전 원본과 좌표까지 동일하다. 직선 보간·가상 고도·경사·3D는 만들지 않았다. 원본 relation 감사 실패 기록도 삭제하지 않았다.

한국어는 사용자 후보와 [발행된 한국어 사용례](https://www.tickadoo.com/ko/hong-kong/peak-tram-sky-terrace-madame-tussauds-combo-tickets)를 공식 중문·영문 identity에 대조했다. 운영사 공식 한국어 지정명이라고 주장하지 않는다. 근거는 peak-tram-review.json과 해시 고정 원본에 보존했다.

현재 운영사 FAQ 접근 제한으로 중간역 요청 버튼·정차 보장 규칙을 확정하지 못했다. **중간 네 역을 모두 요청한 학습 모의운행**으로 명시해 여섯 정차를 타이핑한다. 실시간 실제 정차 안내나 선택형 요청 버튼 재현이 아니다.

상·하행 실제 엔진 AUTO/SPACE 완주, 브라우저 양방향·상행 AUTO·하행 SPACE·모바일 순차 입력을 확인했다. 고도 및 실제 OS IME는 NOT_TESTED다.
