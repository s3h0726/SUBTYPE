// Scope shared static navigation copy to the active country's language.
// Restore the original text on country changes, preserving the Japanese/HK UI.
const koreanMenuOriginals=new Map();
const koreanMenuLabels={'YOUR RAILWAY · CUSTOM SERVICE':'나만의 노선 만들기','LOCAL SAVE':'기기 저장','FREE DRIVE':'자유주행','EDIT':'편집','＋ CREATE NEW ROUTE':'＋ 새 노선 만들기','일본어·로마자만 보고 입력':'정답을 기억해서 입력','열차의 계통과 행선지를 고른 후 출발하세요.':'운행계통과 행선지를 고른 후 출발하세요.','ROUTE COMPLETE':'운행 완료','DISTANCE · 운행 거리':'운행 거리','TIME':'시간','ACCURACY':'정확도','TYPING':'타수','ERRORS':'오타','MAX COMBO':'최대 콤보','WPM':'분당 단어 수','NEW RECORD!':'최고 기록!','RETRY · 다시 플레이':'다시 플레이','CHANGE LINE · 다른 노선':'다른 노선','HOME · 메인 메뉴':'메인 메뉴','RAIL SERVICE / DEPARTURE':'운행계통 · 출발','SELECT SERVICE':'운행계통 선택','GAME MODE · 입력 방식':'게임 모드 · 입력 방식','암기 일본어·로마자만 보고 입력':'암기 · 정답을 기억해서 입력','일본어와 한국어 역명을 함께 보고, 표시된 한국어 역명을 입력합니다.':'표시된 한국어 정차지 이름을 정확히 입력합니다.','어떤 열차를 운행할까요?':'어떤 운행계통을 선택할까요?','PLAY':'플레이','CUSTOM':'커스텀','RECORDS':'운행 기록','SETTINGS':'설정','CUSTOM ROUTE':'커스텀 노선','01 / DEPARTURE MENU':'01 / 출발 메뉴',"TODAY’S ROUTE":'오늘의 노선',"TODAY\'S ROUTE":'오늘의 노선','PHYSICAL LINE · ROUTE · SERVICE':'노선 · 경로 · 운행계통','← HOME':'← 홈','SELECTED LINE':'선택한 노선','LINE LIST':'노선 목록','DATA & CREDITS':'자료 출처','＋ YOUR RAILWAY · CUSTOM SERVICE':'나만의 노선 만들기','BUILD YOUR LINE':'나만의 노선 만들기','CREATE ROUTE':'노선 만들기','UP TO 300':'최대 300개 정차지','UP TO 300 LOCAL SAVE':'최대 300개 정차지 · 기기 저장','FREE DRIVE · 自由走行':'자유주행','NEXT TRACK / TRANSFER':'다음 구간 · 환승','AUTO · 자동 이동':'자동 이동','SPACE · 확인 후 이동':'스페이스 · 확인 후 이동','NEXT · 다음 역으로 출발':'다음 정차지로 출발','OPENSTREETMAP · READY':'지도 준비 완료'};
export function applyKoreanMenuCopy(country){
 for(const [node,original]of koreanMenuOriginals){if(node.isConnected)node.textContent=original;else koreanMenuOriginals.delete(node)}
 if(country!=='kr')return;
 document.title=document.title.replace('일본 철도 타이핑','대한민국 대중교통 타이핑');
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){if(['SCRIPT','STYLE'].includes(node.parentElement?.tagName))continue;const value=node.textContent.trim(),translated=koreanMenuLabels[value]||(/ STATIONS$/.test(value)?value.replace(' STATIONS','개 정차지'):null);if(translated){if(!koreanMenuOriginals.has(node))koreanMenuOriginals.set(node,node.textContent);node.textContent=node.textContent.replace(value,translated)}}
 document.querySelector('#region-tabs')?.setAttribute('aria-label','지역');
 document.querySelector('#operator-filters')?.setAttribute('aria-label','운영사 필터');
 document.querySelector('#route-search')?.setAttribute('placeholder','노선 번호·이름·정차지 검색');
}
