# SUBTYPE 홍콩 철도 Phase 5

기준일2026-10-24(KST), 전체 상태 **INCOMPLETE**. **PLAYABLE42→54방향(+트램12)**. 기존42개는 모두 Phase5 브라우저에서 출발부터 종착까지 재완주했고, 신규 트램6개 구간 쌍의12방향도 실제 정답 입력·전체 중간 정류장·종착 결과100%를 확인했다. 후보61개 ID는 모두 보존했다. **AUTO 성능 목표는 FAIL**이며751P·피크트램·고속철도는 미승인이다.

## 변경 전후

| 지표 | Phase4 | Phase5 |
|---|---|---|
| 서비스 패턴 | 61 | 61 |
| PLAYABLE 방향 | 42 | 54 |
| 한국어 검수 레코드 | 165 | 283 |
| 한국어 미검수 | 118 | 0 |
| 정차 순서 검증 | 44 | 56 |
| geometry 검증 | 59 | 59 |
| Track segment | 520 | 520 |
| 요구사항 PASS | 74 | 85 |
| INCOMPLETE | 105 | 93 |
| 요구사항 FAIL | 0 | 1 |
| OUT_OF_SCOPE | 1 | 1 |
| 통합 Node PASS | 109 | 117 |
| AUTO 목표 FAIL | 1 | 1 |

[전체61서비스](SERVICES.md), [방향별JSON](services.json), [54개 최신 실제 완주](browser-runs.json), [재실행 포함 전체 이력](browser-history.json). 54는 완료한 방향 수이며 신규 실제 서비스 패턴 생성 수가 아니다. source→generator→bundle 경로로 생성했고 validation-preview는 남기지 않았다.

## 트램12방향

카드는 **Hong Kong Tramways 하나**이며 운행 구간→실제 방향→출발 정류장·공식 행선지를 선택한다. 중간 승차는 원래 검증된 서비스의 suffix이며 반대 방향은 별도 OSM 실제 선형을 쓴다. 다른 방향을 좌표 역순으로 발명하지 않는다. 방향명이 중간 승차 정류장으로 바뀌던 선택창 오류와 중간 승차를 골라도 전체 기점으로 시작하던 오류를 실제 QA에서 발견해 고쳤다. 원본 전체서비스 검증은 유지하고 별도 boardingStationId로 승인된 트램의 연속 suffix만 선택한다. [실제3정차](browser-mid-boarding.json)와12방향 resolver검사, 원래42방향의 Phase4 resolver결과와 완전동일 검사(역·선형·segment)를 추가했다.

| 방향 | 정차 | 실제 완주 |
|---|---|---|
| Shau Kei Wan Terminus → Western Market Terminus / 4088321 | 40 | PASS |
| Western Market Terminus → Shau Kei Wan Terminus / 4088368 | 41 | PASS |
| Happy Valley Terminus → Shau Kei Wan Terminus / 4088517 | 31 | PASS |
| Shau Kei Wan Terminus → Happy Valley Terminus / 4088518 | 30 | PASS |
| North Point Terminus → Shek Tong Tsui Terminus / 4088457 | 33 | PASS |
| Shek Tong Tsui Terminus → North Point Terminus / 4088481 | 32 | PASS |
| Causeway Bay Terminus → Shek Tong Tsui Terminus / 4088086 | 26 | PASS |
| Shek Tong Tsui Terminus → Causeway Bay Terminus / 4088087 | 25 | PASS |
| Kennedy Town Terminus → Happy Valley Terminus / 3263757 | 31 | PASS |
| Happy Valley Terminus → Kennedy Town Terminus / 4088000 | 33 | PASS |
| Kennedy Town Terminus → Shau Kei Wan Terminus / 4088262 | 51 | PASS |
| Shau Kei Wan Terminus → Kennedy Town Terminus / 4088263 | 54 | PASS |

공식 [운행안내](https://www.hktramways.com/en/schedules-fares/), [대화형지도](https://www.hktramways.com/en/interactive-map/), nextTramData 및 지도JS의 리터럴 사실을 대조했다. 다운로드한JS를 실행하지 않았다.135개 좌표 사실은 정체성 보조 자료이며 train geometry가 아니다.118개 기존 방향별 stop identity를 공식 코드·중문·영문에 연결했다. 이전114개 대조에서 남은76W/31E/105/WMT를 수동 검토했으며 depot97E/94W는 승객 정류장으로 임의 추가하지 않았다. [정규 검수 원본](../../../data/hk/master/tram-stop-review.json).

공식 방향별 지도와6개 구간을 별도 검토한 전체 정차표를 기존 railway=tram chain에 정확히 대조했다. NPT67E종점 spur, WST/CBT회차, Happy Valley105–108진입·109–112출구 및 방향별 합류 정류장을 분리했다. Western Market의 두 원본 정차 노드도 보존했다. 기존520공유 segment를 사용하고 새 선로·좌표·도로 대체·임의직선은0이다. Phase4의3263757/4088518원본 실패와 보정 근거도 삭제하지 않았다.

## 한국어·751P·남은 선형

한국어 검수165→283, 이번 추가118개는 **공식 한국어 지정명이 아닌, 수동 검토한 공개 한국어 통용 표기(medium)**다. 기존97MTR·68LR를 보존했다. [검수 현황](station-name-audit.json), [짧은 사실/출처](../../../data/hk/sources/phase5/tram-korean-facts.json). 중국어 오기·영문중복·개별404 대체 이웃표 근거를 각각 기록했고, 공식 중문·영문은 변경하지 않았다. 기계번역 단독 승인0.283은 역·방향별 정차 레코드이며 홍콩 전체 물리 역 총수는 NOT_VERIFIED다.

751P는 공식 최신CSV에 없고 현재HTML의 아침틴윙→틴수이와이(방학없음), 저녁틴수이와이↔틴얏(방학감편), 평일혼잡시간 조건만 확인했다. 안내를 한국어로 게임에 표시했다. 전체 정차·정확한시간창·현재 변형 대응이 불충분해 **3후보 모두 차단**, 임의 아침 계통 생성0. 공통 특별편 안내 글자색D53359를751P고유색으로 오인하지 않았다. 기존11LR색과10MTR색 유지. 로고 사용승인0/3, 임의생성0.

[OSM 조사](geometry-investigation.json):3264047새요청1회429, Peak공식FAQ403이므로 반복폭주/보안우회 없이 보관 원본의 미해결 정차·way방향충돌을 유지했다. 현재 조건부 중간정차·고도3D는 미검증.6582965/6582966은 역사적 통합 전 relation으로 현재 튄마선에 쓰지 않고 실패원본을 보존했다. 남은 relation **3264047,6582965,6582966**.

고속철도 공식 목적지와 long-haul PDF를 보관했지만 PDF 현행효력은 검증되지 않았다. 서구룡의 목적지 목록을 가짜 직통계통으로 합치지 않았다. 현재 편명별 전체정차·한국어·국경 전후 전체 철도선형이 없어 승인0. [미완료 조사](research-remaining.json).

## AUTO 성능 — 미해결 FAIL

최소150ms와 원본 곡선을 따라가는240ms애니메이션을 유지했다. 중복 boarding map갱신과 자유주행의 동일target재설정·중복map queue를 제거했다. 확인→map대기→animation→barrier→다음입력target/결과 준비를 따로 계측했다.

모든 보존 표본997개: **중앙값263.2ms /95백분위965.4ms /최악1306.7ms**,300ms초과244개. [전체값·PC/모바일·일반/연속별 통계](performance-report.json). Phase4의901.3ms 실패와505재현 실행을 모두 보존한다. 느린 실행을 빠른 재검사로 덮어쓰지 않았다. 초기6방향은 세부 trace누락이 있어 완주 근거로만 쓰고, 없는 timing값을 만들지 않았다.

실제 frame계측에서 예정240ms인데 frames=1/maxFrameGap약860–927ms 사례를 확인했다. map대기는 대체로1ms 이내였고 animation대기가 주 지연이다. 브라우저 표시를 켠 재검사에서도 목표 초과가 남았다. 프레임을 건너뛰거나 timer로 강제 완료해 통과시키지 않았다. 원인은 기록된 프레임제공/메인스레드 지연 범위까지만 확인했으며 실제 기기 전반의 원인을 확정하지 않는다. **138번 FAIL**, UI감사명령 exit1 유지.

## 환승·순환·CUSTOM·UI

[8개 실제TAB환승](browser-transfers.json):애드미럴티2쌍,야우마테이,홍함,틴킹,센트럴↔홍콩,침사추이↔이스트침사추이,카오룽↔오스틴. 각A→B→A→B뒤 새노선의 환승역을 첫 정답으로 입력하고 종착까지 진행했다. 틴킹은390×844에서도 재검사했다. 노선별 정차좌표의 수치 정합성은 자동검사, 실제 지도라벨·노선전환·입력역·이후 이동은 브라우저가 담당했다. 보행통로를 train geometry로 쓰지 않는다. 비환승OceanPark TAB전후 상태불변 PASS.

705/706각16회정차의 마지막 시작역재방문·종료 PASS. 자동검사에서15개 원본segment·실거리·결과재생 방문순서를 유지했다. 자유주행 인접역버튼→다음타이핑 연속 이동 PASS; 검증자가 잘못된 표기를 입력한 오타1건은 [기록](browser-free-drive.json)했고 무오류로 주장하지 않는다.

CUSTOM기존3개 보존, 기존3역여정 저장→실제새로고침→재실행→100%완주 PASS([증거](browser-custom.json)). 모바일390×844 트램 일반/연속·암기SPACE, 라이트/다크 및TAB검사. 가로scrollWidth390, 역명판x12–378/y약522–826. 출발오버레이 또는 이전프레임이 캡처된 초기이미지는 가독성근거에서 제외하고 별도 도구호출 뒤 확인한 [다크](images/mobile-tram-dark.jpg)·[라이트](images/mobile-tram-light.jpg)를 남겼다.

브라우저 자동화의 일부 첫 click이 dispatch되지 않거나 설정에 머문 시도는 [관찰](browser-observations.json)에 분리했다. 화면을 재확인하고 실제 버튼Enter/라디오Space조작으로 진행했으며 실패시도를 성공으로 세지 않았다. [원래 정규식4FAIL과 실제동작검사](legacy-ui-investigation.json)는 별도 보존한다.

## 회귀 및 미실행

통합Node **기존109+신규8=117 PASS/0FAIL/0SKIP**, typing18·IMEcontroller10 fixture별도. 명령은9PASS/1FAIL(AUTO UI감사). [검증JSON](validation.json), [전체출력](validation.txt). 기존 Phase4검사는68LR검수 불변을 scope로 유지하면서 신규118트램을 허용했고, tram의 미검증 가정을 전체정차·명칭·브라우저승인 근거 대조로 강화했다. 테스트삭제·조건완화 없음. 원본manifest SHA 및 정상생성기 byte-stability PASS. [생성물SHA](generated-hashes.json).

한국성수지선5역, 일본니시큐슈신칸센5역·나리타익스프레스6정차 실제100%완주 PASS([기록](browser-regressions.json)). 기존NEX선택창 묶음캡션 및 일부 추정거리 표시는 기존한계로 남겼고 일본데이터를 수정하지 않았다. 한국·일본 전수 실제브라우저검사와 모든 환승 전수는 주장하지 않는다.

**NOT_TESTED**: 실제Windows한국어IME, 실제모바일OS키보드, Supabase로그인/로그아웃/계정별격리/클라우드저장·복원(설정·계정없음). DOM fill/pressSequentially 및 fixture는 실제OS키보드 검사가 아니다.

## 요구사항·Git

[180개ID별 상태·근거·코드·검사·미완료 사유](requirements-audit.json): **PASS85 / INCOMPLETE93 / FAIL1 / OUT_OF_SCOPE1**. Phase4 PASS74유지,22·72–79·127·175의11개 추가. 미달94개는93미완료+AUTO1실패다.90번 범위밖 유지.

- 브랜치: feature/hong-kong-railway
- 시작 및 시작원격: cd9d69fb00f82ad99949c7ca61261580d21cfc21
- 구현 커밋: 6e2a62bfa9f422dbe86c49c9c7cbbfb5dcf52516
- 원격푸시: SUCCESS ([영수증](git-result.json))
- [수정파일](changed-files.txt)
- local main 67f9b780b4f60fd2586d302ddea41a4d94b6baa2 보존. 시작remote main 607a124aeb453a0360a303ef44a941b205c4ff34, 작업중 외부remote main75b92c873d721aebb202c2297f438bab3940d24d관찰, 미통합.
- main수정/병합/리베이스/푸시·강제푸시·새브랜치·Pages배포 **미수행**. 한국·일본원본 및 workflow 변경0.
- 자기SHA는 자기커밋에 넣을 수 없어, 구현커밋의 실제푸시 영수증을 후속보고커밋에 기록하고 최종보고HEAD일치는 최종응답에 제공한다.
