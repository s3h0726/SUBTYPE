import{isKoreanResearch,assertKoreanResearchRoute,koreanResearchChoices,resolveKoreanResearchChoice}from'./korean-research-resolver.js';
import{koreanRouteBlockReason}from'./korean-access-policy.js';
const KR_APP_TRANSFER_PAIRS=[{"region":"capital","name":"시청","routeIds":["kr-metro-1-main","kr-metro-1-section-2","kr-metro-2"],"source":"https://ms.smc.seoul.kr/attach/record/SEOUL/appendix/a11/A0066691.pdf?time=20260525101106"},{"region":"busan","name":"서면","routeIds":["kr-regional-busan-1","kr-regional-busan-2"],"source":"https://work.humetro.busan.kr/homepage/history/page/subLocation.do?menu_no=1002020202"},{"region":"daegu","name":"반월당","routeIds":["kr-regional-daegu-7","kr-regional-daegu-8"],"source":"https://daegu.grandculture.net/daegu/junggu/toc/GC40000506"}];
import{$,$$,escapeHtml,formatTime,normalize,toast,koreanStationDisplayName,koreanRouteDisplayText}from'./utils.js';
import{loadTransportData,normalizeLine,hydrateRailLine}from'./data-loader.js';
import{koreanVerifiedChoices,resolveKoreanVerifiedChoice}from'./korean-service-resolver.js';
import{storage}from'./storage.js';
import{Game}from'./game.js';
import{FreeDrive,drawNetworkCanvas}from'./free-drive.js';
import{RouteEditor}from'./route-editor.js';
import{renderStats}from'./statistics.js';
import{lineBadgeMarkup}from'./line-badge.js';
import{operatorLogoMarkup}from'./asset-renderer.js';
import{initAuth}from'./auth.js';
import{railDataRepository}from'./rail-data-repository.js';
import{FEATURE_FLAGS,canonicalRouteId,isCountryEnabled,isRouteVisible}from'./feature-flags.js';
import{buildThroughServiceRoute,koreanFamilyServiceChoices,resolveKoreanFamilyService,resolveServiceJourney,resolveServiceSelection,serviceJourneysForRoute,servicePatternsForRoute,trainTypeFor}from'./service-route-resolver.js';
import{nexOperatingChoices,resolveNexOperatingChoice}from'./nex-route-resolver.js';
import{buildFamousLimitedExpressRoutes,famousLimitedExpressSourceIds,famousLimitedExpressChoices,resolveFamousLimitedExpressChoice}from'./famous-limited-express.js';

let famousExpressLoadPromise=null,famousExpressLoading=false;
let koreaPlayMode='released';
let routeSelectionRevision=0;
const savedCountryId=localStorage.getItem('trt-country')||'jp';
let builtin=[],routes=[],stations=[],selected=null,selectedGroup=null,lastOptions=null,lastRunRoute=null,freeDrive=null,freeDriveTabIndex=0,transportGroup='all',category='all',regionFilter='all',operatorFilter='all',featureIndex=0,featureTimer=null,dataLoading=true,pendingRouteId=null,routeRenderLimit=96,countryId=isCountryEnabled(savedCountryId)?savedCountryId:'jp';
const KR_REGIONS=[['all','전국'],['seoul','서울'],['busan','부산'],['daegu','대구'],['incheon','인천'],['gwangju','광주'],['daejeon','대전'],['ulsan','울산'],['sejong','세종'],['gyeonggi','경기'],['gangwon','강원'],['chungbuk','충북'],['chungnam','충남'],['jeonbuk','전북'],['jeonnam','전남'],['gyeongbuk','경북'],['gyeongnam','경남'],['jeju','제주']];
const KR_GROUPS=[['all','전체'],['rail','철도'],['bus','버스'],['water','수상교통'],['other','기타 교통'],['custom','커스텀']];
const KR_CATEGORIES={rail:[['all','전체 철도'],['subway','지하철·도시철도'],['commuter_rail','광역철도'],['rail','일반철도'],['high_speed_rail','고속철도'],['light_rail','경전철'],['monorail','모노레일'],['tram','노면전차'],['airport_rail','공항철도'],['other_rail','기타 철도']],water:[['all','전체 수상교통'],['river_bus','한강버스'],['ferry','여객선']],other:[['all','전체 기타 교통']]};
const JP_CATEGORIES=[['all','전체'],['jr','JR'],['subway','지하철'],['private','사철'],['third-sector','제3섹터'],['monorail','모노레일'],['tram','노면전차'],['other','기타'],['shinkansen','신칸센'],['limited-express','특급'],['custom','커스텀']];
const COUNTRY_UI={jp:{mark:'JAPAN RAIL',status:'日本全国 · ALL JAPAN',subtitle:'일본 전국 철도 타이핑',title:'일본 철도를<br><span>타이핑하다.</span>',intro:'일본 전국의 실제 역 순서와 선형을 따라 달리는 철도 타이핑 게임.<br>현재역에서 다음역으로, 한국어 역명을 정확히 입력하세요.',network:'JAPAN RAILWAY NETWORK / 日本全国'},kr:{mark:'KOREA TRANSIT',status:'대한민국 · KOREA',subtitle:'대한민국 대중교통 타이핑',title:'대한민국 교통을<br><span>타이핑하다.</span>',intro:'철도·지하철·버스·수상교통의 실제 정차 순서를 따라가는 타이핑 게임.<br>한국어 역·정류장·선착장 이름을 정확히 입력하세요.',network:'KOREA PUBLIC TRANSPORT / 대한민국'}};
const renderTabs=(target,items,dataKey,current)=>{target.innerHTML=items.map(([id,label])=>`<button class="${id===current?'active':''}" data-${dataKey}="${id}">${label}</button>`).join('')};
function busCategories(){const scoped=routes.filter(route=>routeTransportGroup(route)==='bus'&&(regionFilter==='all'||route.regionId===regionFilter)),values=new Map([['all','전체']]);for(const route of scoped)values.set(route.normalizedCategory||route.routeType||route.category,route.regionalCategory||route.routeType||route.category);return[...values]}
function renderTransportFilters(){const modes=$('#korea-play-modes');if(modes){modes.hidden=countryId!=='kr';modes.querySelectorAll('[data-korea-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.koreaMode===koreaPlayMode);b.setAttribute('aria-pressed',String(b.dataset.koreaMode===koreaPlayMode))})}const groupTabs=$('#transport-mode-tabs'),regionTabs=$('#region-tabs'),categoryTabs=$('#category-tabs');if(countryId==='jp'){groupTabs.hidden=true;regionTabs.hidden=true;categoryTabs.hidden=false;renderTabs(categoryTabs,JP_CATEGORIES.filter(([id])=>id==='all'||id==='custom'||id==='limited-express'||routes.some(route=>routeGroup(route)===id)),'category',category);return}groupTabs.hidden=false;renderTabs(groupTabs,KR_GROUPS,'transport-group',transportGroup);regionTabs.hidden=transportGroup!=='bus';if(transportGroup==='bus')renderTabs(regionTabs,KR_REGIONS,'region',regionFilter);const items=transportGroup==='bus'?busCategories():KR_CATEGORIES[transportGroup]||[];categoryTabs.hidden=!items.length;if(items.length)renderTabs(categoryTabs,items,'category',category)}
function applyCountryUi(){const ui=COUNTRY_UI[countryId];document.documentElement.dataset.country=countryId;document.documentElement.dataset.featureKorea=String(FEATURE_FLAGS.korea);$('#brand-subtitle').textContent=ui.subtitle;$('#home-country-mark').textContent=ui.mark;$('#home-country-subtitle').textContent=ui.subtitle;$('#home-country-status').textContent=ui.status;$('#hero-title').innerHTML=ui.title;$('#home-intro').innerHTML=ui.intro;document.querySelector('.line-select-heading p').textContent=ui.network;renderTransportFilters();$$('[data-country]').forEach(button=>{const enabled=isCountryEnabled(button.dataset.country);button.hidden=!enabled;button.disabled=!enabled;button.setAttribute('aria-hidden',String(!enabled));button.classList.toggle('active',enabled&&button.dataset.country===countryId)})}
function refreshCountryCopy(){const korea=countryId==='kr',play=document.querySelector('.launch-menu [data-nav="rail-map"] small'),footer=document.querySelector('.home-footer span:nth-child(2)'),featureButtons=$$('#feature-viewport [data-feature-route]');if(play)play.textContent=korea?'대한민국 교통에서 노선 선택':'일본 전국 철도에서 노선 선택';if(footer)footer.textContent=korea?'대한민국 대중교통 타이핑':'일본 전국 철도 타이핑';if(!korea){if(featureButtons[0])featureButtons[0].dataset.featureRoute='line-11302';if(featureButtons[1])featureButtons[1].dataset.featureRoute='line-28001'}const custom=document.querySelector('[data-feature-index="2"] h2');if(custom)custom.textContent=korea?'나만의 노선':'新路線';document.querySelectorAll('#feature-viewport .feature-meta span:nth-child(2)').forEach(span=>{span.hidden=korea})}
function syncHomeFeatured(){
 const seen=new Set(),available=routes.filter(route=>{if(route.countryId!=='kr'||route.geometryReady!==true||route.playable===false)return false;const id=route.passengerLineId||route.id;if(seen.has(id))return false;seen.add(id);return true});
 document.querySelectorAll('#feature-viewport [data-feature-route]').forEach((button,index)=>{
  if(countryId==='kr')button.dataset.featureRoute=available[index]?.id||'';
  const route=routes.find(r=>r.id===button.dataset.featureRoute),card=button.closest('article');button.disabled=!route;
  button.innerHTML=route?'바로 플레이 <span>↗</span>':'노선 준비 중';
  if(!route&&card){card.querySelector('[data-feature-line-ko]').textContent='노선 준비 중';for(const selector of ['.feature-number','[data-feature-operator]','[data-feature-line-secondary]','[data-feature-stations]']){const node=card.querySelector(selector);if(node)node.textContent=''}}
  if(route&&card)card.style.setProperty('--card-line',route.lineColor);
 });
}
function configureExplicitDirections(){if(!selected?.directions?.length)return;const select=$('#service-direction'),name=stop=>stop?.ko||stop?.names?.ko||'';select.innerHTML=selected.directions.map(direction=>`<option value="${escapeHtml(direction.id)}">${escapeHtml(direction.names?.ko||direction.id)} · ${escapeHtml(name(direction.stops?.[0]))} → ${escapeHtml(name(direction.stops?.at(-1)))}</option>`).join('')}
function applyExplicitDirection(){const select=$('#service-direction'),direction=selected?.directions?.find(item=>item.id===select.value);if(!direction)return;selected=railDataRepository.resolveRoute(normalizeLine({...selected,lazy:false,selectedDirectionId:direction.id,selectedDirectionName:direction.names?.ko||direction.id,stations:direction.stops,directions:selected.directions,geometry:direction.geometry||[],directedSegments:direction.directedSegments||[],geometryReady:direction.geometryStatus==='ready',services:[]},{category:selected.category}));select.innerHTML=`<option value="forward">${escapeHtml(direction.names?.ko||direction.id)}</option>`}
function go(name){const result=window.TRTNavigation?.showScreen(name);requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));return result}
function applyTheme(theme){const resolved=theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;document.documentElement.dataset.theme=resolved;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',resolved==='dark'?'#07110e':'#f5f4ef')}
const JAPANESE_KOREAN_EXACT_FIXES={"智頭急行":"치즈 급행","富士急行":"후지 급행","福岡市交通局":"후쿠오카시 교통국","福島交通":"후쿠시마 교통","函館市交通局":"하코다테시 교통국","東葉高速鉄道":"도요 고속철도","広島高速交通":"히로시마 고속교통","北条鉄道":"호조 철도","北越急行":"호쿠에쓰 급행","伊豆急行":"이즈 급행","鹿児島市交通局":"가고시마시 교통국","関東鉄道":"간토 철도","北九州高速鉄道":"기타큐슈 고속철도","北大阪急行電鉄":"기타오사카 급행전철","神戸電鉄":"고베 전철","神戸高速鉄道":"고베 고속철도","神戸市交通局":"고베시 교통국","神戸新交通":"고베 신교통","熊本市交通局":"구마모토시 교통국","黒部峡谷鉄道":"구로베 협곡철도","京都市交通局":"교토시 교통국","京都丹後鉄道":"교토 단고 철도","名古屋臨海高速鉄道":"나고야 임해고속철도","名古屋市交通局":"나고야시 교통국","大井川鐵道":"오이가와 철도","大阪府都市開発":"오사카부 도시개발","大阪モノレール株式会社":"오사카 모노레일","嵯峨野観光鉄道":"사가노 관광철도","埼玉新都市交通":"사이타마 신도시교통","札幌市交通局":"삿포로시 교통국","仙台空港鉄道":"센다이 공항철도","仙台市交通局":"센다이시 교통국","湘南モノレール":"쇼난 모노레일","東海交通事業":"도카이 교통사업","上田交通":"우에다 교통","由利高原鉄道":"유리 고원철도","東海道新幹線":"도카이도 신칸센","山陽新幹線":"산요 신칸센","東北新幹線":"도호쿠 신칸센","北海道新幹線":"홋카이도 신칸센","上越新幹線":"조에쓰 신칸센","北陸新幹線":"호쿠리쿠 신칸센","九州新幹線":"큐슈 신칸센","西九州新幹線":"니시큐슈 신칸센","山形新幹線":"야마가타 신칸센","秋田新幹線":"아키타 신칸센","函館市電２系統":"하코다테시덴 2계통","函館市電５系統":"하코다테시덴 5계통","鹿児島市電１系統":"가고시마시덴 1계통","鹿児島市電２系統":"가고시마시덴 2계통","熊本市電Ａ系統":"구마모토시덴 A계통","熊本市電Ｂ系統":"구마모토시덴 B계통","長崎電軌１系統":"나가사키 전기궤도 1호계통","長崎電軌３系統":"나가사키 전기궤도 3호계통","長崎電軌４系統":"나가사키 전기궤도 4호계통","長崎電軌５系統":"나가사키 전기궤도 5호계통","富山地鉄市内線【１・２系統】":"도야마 지방철도 시내선 1·2계통","富山地鉄富山都心線【３系統(環状線)】":"도야마 지방철도 도야마 도심선 3계통(순환선)","大阪難波":"오사카난바","三河安城":"미카와안조","新大阪":"신오사카","大船":"오후나","大井町":"오이마치","大原":"오하라","京都":"교토"};
const JAPANESE_KOREAN_ID_FIXES={"tokyo-metro":"도쿄 메트로","yurikamome":"유리카모메","line-28001":"긴자선","line-28002":"마루노우치선","line-28003":"히비야선","line-28004":"도자이선","line-28005":"치요다선","line-28006":"유라쿠초선","line-28008":"한조몬선","line-28009":"난보쿠선","line-28010":"후쿠토신선","line-99618":"미도스지선","line-99311":"유리카모메","station-mlit-003872":"신바시","station-mlit-003887":"시오도메","station-mlit-003958":"다케시바","station-mlit-003979":"히노데","station-mlit-004030":"시바우라 후토","station-mlit-004091":"오다이바 카이힌코엔","station-mlit-004112":"다이바","station-mlit-004128":"도쿄 국제 크루즈 터미널","station-mlit-004144":"텔레콤센터","station-mlit-004119":"아오미","station-mlit-004087":"도쿄빅사이트","station-mlit-004064":"아리아케","station-mlit-004037":"아리아케 테니스노모리","station-mlit-004001":"시조마에","station-mlit-003981":"신토요스","station-mlit-003951":"토요스","station-mlit-003729":"한조몬","station-mlit-003782":"나가타쵸","station-mlit-003839":"토요쵸","station-mlit-003542":"코라쿠엔","station-mlit-003962":"시바코엔","station-mlit-003654":"료고쿠","station-mlit-003646":"료고쿠","station-mlit-003604":"오쿠보","station-mlit-003954":"아카바네바시","station-mlit-003639":"킨시쵸","station-mlit-003900":"카미야쵸","station-mlit-003753":"스이텐구마에","station-mlit-004108":"도쿄 텔레포트","station-mlit-003545":"우에노히로코지","station-mlit-004036":"세이죠가쿠엔마에","station-mlit-004331":"케이큐카마타","station-mlit-004264":"오모리"};
const NAMUWIKI_STATION_FIXES_BY_ID={"station-mlit-003872":"신바시","station-mlit-003887":"시오도메","station-mlit-003958":"다케시바","station-mlit-003979":"히노데","station-mlit-004030":"시바우라 후토","station-mlit-004091":"오다이바 카이힌코엔","station-mlit-004112":"다이바","station-mlit-004128":"도쿄 국제 크루즈 터미널","station-mlit-004144":"텔레콤센터","station-mlit-004119":"아오미","station-mlit-004087":"도쿄빅사이트","station-mlit-004064":"아리아케","station-mlit-004037":"아리아케 테니스노모리","station-mlit-004001":"시조마에","station-mlit-003981":"신토요스","station-mlit-003951":"토요스","station-mlit-003729":"한조몬","station-mlit-003782":"나가타쵸","station-mlit-003839":"토요쵸","station-mlit-003542":"코라쿠엔","station-mlit-003962":"시바코엔","station-mlit-003654":"료고쿠","station-mlit-003646":"료고쿠","station-mlit-003604":"오쿠보","station-mlit-003954":"아카바네바시","station-mlit-003639":"킨시쵸","station-mlit-003900":"카미야쵸","station-mlit-003753":"스이텐구마에","station-mlit-004108":"도쿄 텔레포트","station-mlit-003545":"우에노히로코지","station-mlit-004036":"세이죠가쿠엔마에","station-mlit-004331":"케이큐카마타","station-mlit-004264":"오모리","station-mlit-003785":"도쿄","station-mlit-003766":"도쿄","station-mlit-003884":"롯폰기잇초메","station-mlit-003892":"롯폰기","station-1130101":"도쿄","station-1111102":"유후츠","station-1120311":"오미나토","station-1150518":"오오카","station-9964809":"고베 공항","station-1141608":"미노오타","station-1161408":"호즈쿄","station-1192902":"휴가쇼나이","station-9932008":"가마쿠라코코마에","station-mlit-004361":"하네다 공항 제2터미널","station-3100533":"무로구치오노","station-9931303":"코엔","station-9960115":"교세라마에","station-mlit-004189":"나루토","station-3001807":"코마키구치","station-mlit-004614":"사가미오츠카","station-9931412":"다이유잔"};
const NAMUWIKI_STATION_FIXES_BY_JA={"大阪難波":"오사카난바","三河安城":"미카와안조","新大阪":"신오사카","大船":"오후나","大井町":"오이마치","大原":"오하라","新倉敷":"신쿠라시키","鹿児島":"가고시마","鹿児島中央":"가고시마추오","南鹿児島":"미나미가고시마","鹿児島駅前":"가고시마에키마에","南鹿児島駅前":"미나미가고시마에키마에","鹿児島中央駅前":"가고시마추오에키마에"};
function stationKoreanNameFromPolicy(station){
  const ja=station?.ja||station?.names?.ja||'',id=station?.id||'';
  const verified=NAMUWIKI_STATION_FIXES_BY_ID[id]||NAMUWIKI_STATION_FIXES_BY_JA[ja];
  if(verified)return{name:verified,source:'namuwiki',status:'VERIFIED'};
  const fallback=cleanJapaneseKoreanName(station?.ko||station?.names?.ko||'',ja);
  return{name:fallback,source:'fallback-transliteration',status:'REVIEW_REQUIRED'}
}
function cleanJapaneseKoreanName(value,ja=''){
  const exact=JAPANESE_KOREAN_EXACT_FIXES[ja];if(exact)return exact;
  let text=String(value||'');
  const phrases=[['토우쿄우','도쿄'],['쿄우토','교토'],['코우베','고베'],['오오사카','오사카'],['토우호쿠','도호쿠'],['토우카이도우','도카이도'],['조우에츠','조에쓰'],['큐우슈우','큐슈'],['키타큐우슈우','기타큐슈'],['료우모우','료모'],['조우반','조반']];
  for(const[from,to]of phrases)text=text.replaceAll(from,to);
  const rules=[['오오','오'],['큐우','큐'],['쿄우','쿄'],['료우','료'],['쇼우','쇼'],['쵸우','쵸'],['토우','토'],['코우','코'],['조우','조'],['유우','유'],['우우','우'],['도우','도'],['닜','닛'],['샀','삿']];
  for(const[from,to]of rules)text=text.replaceAll(from,to);
  if(ja.includes('空港'))text=text.replaceAll('쿠우코우','공항').replaceAll('쿠코','공항');
  if(ja.includes('ターミナル'))text=text.replaceAll('타미나루','터미널');
  if(ja.includes('センター'))text=text.replaceAll('센타','센터');
  if(ja.includes('モノレール'))text=text.replaceAll('모노레루','모노레일');
  const terms=[['테츠도우',' 철도'],['덴테츠',' 전철'],['코츠쿄쿠',' 교통국'],['코우츠쿄쿠',' 교통국'],['코츠우쿄쿠',' 교통국'],['코우츠우쿄쿠',' 교통국'],['코소쿠',' 고속'],['큐코',' 급행'],['치카테츠',' 지하철'],['시에이',' 시영'],['혼선',' 본선'],['칸조선',' 순환선']];
  for(const[from,to]of terms)text=text.replaceAll(from,to);
  const phraseFixes=[['한큐고베','한큐 고베'],['한큐교토','한큐 교토'],['한큐다카라즈카','한큐 다카라즈카'],['게이오','케이오'],['키타오사카','기타오사카'],['후쿠오카시 교통국','후쿠오카시 교통국'],['고베시 교통국','고베시 교통국'],['가고시마시 교통국','가고시마시 교통국'],['구마모토시 교통국','구마모토시 교통국']];
  for(const[from,to]of phraseFixes)text=text.replaceAll(from,to);
  text=text.replace(/\s+/g,' ').replace(/\s+(선|본선|지선|전철|철도|급행|교통국|지하철|순환선)$/,' $1').trim();
  return text
}
const YURIKAMOME_LOOP_SEGMENT=[[35.64249,139.75786],[35.64169,139.75788],[35.63918,139.75793],[35.63856,139.7579],[35.63833,139.75787],[35.63795,139.75786],[35.637362,139.757861],[35.637151,139.757839],[35.636947,139.757771],[35.636755,139.757661],[35.636582,139.757512],[35.636433,139.757328],[35.636311,139.757115],[35.636222,139.75688],[35.636167,139.756628],[35.636149,139.756369],[35.636167,139.75611],[35.636222,139.755859],[35.636311,139.755623],[35.636433,139.75541],[35.636582,139.755226],[35.636755,139.755077],[35.636947,139.754967],[35.637151,139.7549],[35.637362,139.754877],[35.637572,139.7549],[35.637777,139.754967],[35.637968,139.755077],[35.638141,139.755226],[35.638291,139.75541],[35.638412,139.755623],[35.638501,139.755859],[35.638556,139.75611],[35.638574,139.756369],[35.638556,139.756628],[35.638501,139.75688],[35.638412,139.757115],[35.638291,139.757328],[35.638141,139.757512],[35.637968,139.757661],[35.637777,139.757771],[35.637572,139.757839],[35.637362,139.757861],[35.63755,139.75815],[35.63794,139.75922],[35.63676,139.76275],[35.63588,139.76551],[35.63522,139.76757],[35.63493,139.76861],[35.63486,139.76913],[35.63491,139.77006],[35.6352,139.77124],[35.63561,139.77237],[35.63594,139.77334],[35.63628,139.77481],[35.63617,139.77562],[35.63601,139.77613],[35.63581,139.77661],[35.63554,139.77698],[35.6353,139.77721],[35.63187,139.77994],[35.63104,139.78003],[35.63079,139.77989],[35.63023,139.7793],[35.63,139.77888]];
function applyYurikamomeLoopGeometry(route){
  if(route?.id!=='line-99311'||!Array.isArray(route.directedSegments)||!route.directedSegments.length)return route;
  const target='station-mlit-004030::station-mlit-004091';
  const directedSegments=route.directedSegments.map(segment=>segment.fromStationId+'::'+segment.toStationId===target?{...segment,geometry:YURIKAMOME_LOOP_SEGMENT,source:'Yurikamome official Shibaura loop refinement',verified:true}:segment);
  const geometry=[],stationGeometryIndex=new Map;
  for(const segment of directedSegments){let points=(segment.geometry||[]).map(point=>[Number(point[0]),Number(point[1])]);if(!points.length)continue;stationGeometryIndex.set(segment.fromStationId,Math.max(0,geometry.length-1));if(geometry.length&&geometry.at(-1)[0]===points[0][0]&&geometry.at(-1)[1]===points[0][1])points=points.slice(1);geometry.push(...points);stationGeometryIndex.set(segment.toStationId,Math.max(0,geometry.length-1))}
  const stations=(route.stations||[]).map(station=>({...station,geometryIndex:stationGeometryIndex.get(station.id)??station.geometryIndex}));
  return{...route,directedSegments,geometry,stations}
}
function fixRouteKoreanNames(route){
  if(!route)return route;
  // Korean station labels are canonical Hangul, not Japanese transliteration targets.
  if(route.countryId==='kr')return route;
  // Canonical operator identities. Preserve route IDs and station ordering.
  const canonicalOperatorId={'san-yodenkitetsudo':'sanyodenkitetsudo','osakafutoshikaihatsu':'nankaidentetsu'}[route.operatorId]||route.operatorId;
  if(canonicalOperatorId!==route.operatorId)route={...route,operatorId:canonicalOperatorId};
  if(route.id==='line-99616')route={...route,operator:{...(route.operator||{}),ja:'南海電鉄',ko:'난카이 전기철도',en:'Nankai Electric Railway'},line:{...(route.line||{}),ja:'泉北線',ko:'센보쿠선',en:'Semboku Line'}};
    if(route.operatorId==='sanyodenkitetsudo')route={...route,operator:{...(route.operator||{}),ja:'山陽電気鉄道',ko:'산요 전기철도',en:'Sanyo Electric Railway'}};
if(route.operatorId==='uekedenkitetsudo')route={...route,operator:{...(route.operator||{}),ko:'조모 전기철도',ja:'上毛電気鉄道'}};

  const operatorJa=route.operator?.ja||route.operator?.names?.ja||'',lineJa=route.line?.ja||route.line?.names?.ja||'';
  const operatorKo=JAPANESE_KOREAN_ID_FIXES[route.operatorId]||cleanJapaneseKoreanName(route.operator?.ko||route.operator?.names?.ko||'',operatorJa),lineKo=JAPANESE_KOREAN_ID_FIXES[route.id]||cleanJapaneseKoreanName(route.line?.ko||route.line?.names?.ko||'',lineJa);
  const operator={...(route.operator||{}),ko:operatorKo,names:{...(route.operator?.names||{}),ko:operatorKo}};
  const line={...(route.line||{}),ko:lineKo,names:{...(route.line?.names||{}),ko:lineKo}};
  const stations=(route.stations||[]).map(station=>{const resolved=stationKoreanNameFromPolicy(station),ko=resolved.name;return{...station,ko,names:{...(station?.names||{}),ko},koNameSource:resolved.source,koNameStatus:resolved.status}});
  const directions=(route.directions||[]).map(direction=>({...direction,stops:(direction.stops||[]).map(station=>{const resolved=stationKoreanNameFromPolicy(station),ko=resolved.name;return{...station,ko,names:{...(station?.names||{}),ko},koNameSource:resolved.source,koNameStatus:resolved.status}})}));
  const override=globalThis.TRT_EDITOR_OVERRIDES||{},lineEdit=override.lines?.[route.id]||{},operatorEdit=override.operators?.[route.operatorId];
  const fixStation=st=>{const value=override.stations?.[route.id]?.[st.id]||override.stations?.[route.id]?.[st.stationMasterId];return value?{...st,ko:value,names:{...(st.names||{}),ko:value}}:st};
  const finalOperator=operatorEdit?{...operator,ko:operatorEdit,names:{...operator.names,ko:operatorEdit}}:operator;
  const finalLine=lineEdit.ko?{...line,ko:lineEdit.ko,names:{...line.names,ko:lineEdit.ko}}:line;
  const finalColor=/^#[0-9a-f]{6}$/i.test(lineEdit.color||'')?lineEdit.color:route.lineColor;
  return applyYurikamomeLoopGeometry({...route,operator:finalOperator,line:finalLine,lineColor:finalColor,stations:stations.map(fixStation),directions:directions.map(dir=>({...dir,stops:(dir.stops||[]).map(fixStation)}))})
}
const JAPAN_STREETCAR_LINE_IDS=new Set(['line-99706','line-99707','line-99305','line-99521','line-99809','line-99810','line-99811','line-99812','line-99628','line-99629']);
const JAPAN_CLOSED_LINE_IDS=new Set(['line-11113','line-99708']);
function currentJapanServiceRoute(route){
 if(!route||route.countryId==='kr')return route;
 if(JAPAN_CLOSED_LINE_IDS.has(route.id))return{...route,visibility:'internal',playable:false,historical:true};
 if(JAPAN_STREETCAR_LINE_IDS.has(route.id))return{...route,category:'tram'};
 if(route.id==='line-11111'){
   const current=(route.stations||[]).filter(station=>['苫小牧','勇払','浜厚真','鵡川'].includes(station.ja));
   if(current.length===4)return{...route,stations:current,stationCount:4,
     stationSequence:current.map(station=>station.id),coverage:'operational-Tomakomai-to-Mukawa-only',
     ...(route.stations.length!==4?{geometry:[],geometryReady:false,directedSegments:[],missingSegments:[]}: {})};
 }
 return route;
}
function allRoutes(){return[...builtin,...(countryId==='kr'&&koreaPlayMode==='research'?[]:storage.routes()).filter(route=>(route.countryId||'jp')===countryId).map(r=>railDataRepository.resolveRoute(normalizeLine(r,{category:'custom'})))].map(fixRouteKoreanNames).map(currentJapanServiceRoute).filter(isRouteVisible).filter(r=>r.lazy||(Array.isArray(r.stations)&&r.stations.length>=2))}
const operatorLogo=operatorLogoMarkup;
// Company marks belong on every route card, including Tokyo Metro.
const lineSurfaceOperatorLogo=(route,className)=>operatorLogoMarkup(route,className);
function operatorKey(route){return route?.operatorId||route?.operator?.en}
function operatorScopeRoutes(){return routes.filter(route=>(countryId==='jp'||transportGroup==='all'||routeTransportGroup(route)===transportGroup)&&(countryId!=='kr'||transportGroup!=='bus'||regionFilter==='all'||route.regionId===regionFilter)&&routeCategoryMatches(route))}
function renderOperatorFilters(){const context=operatorScopeRoutes(),unique=[...new Map(context.map(route=>[operatorKey(route),route])).values()].sort((a,b)=>(a.operator.ko||'').localeCompare(b.operator.ko||'','ko')),target=$('#operator-filters');if(operatorFilter!=='all'&&!unique.some(route=>operatorKey(route)===operatorFilter))operatorFilter='all';target.innerHTML=unique.length?`<button class="${operatorFilter==='all'?'active':''}" data-operator="all">전체 운영사</button>`+unique.map(route=>`<button class="${operatorFilter===operatorKey(route)?'active':''}" data-operator="${escapeHtml(operatorKey(route))}">${operatorLogo(route,'filter-logo')}<span>${escapeHtml(route.operator.ko||'MISSING_KOREAN_NAME')}</span></button>`).join(''):'<p class="operator-filter-empty" role="status">해당 카테고리의 운영사가 없습니다.</p>'}
function freeDriveNetworkRoutes(){
  return routes.filter(route=>!route.famousExpress&&!koreanRouteUnavailableReason(route)).map(route=>{
    if(!route?.lazy)return route;
    const key=String(route.lazySource||'').replace(/^\.\//,''),embedded=globalThis.TRT_EMBEDDED_NATIONWIDE?.routes?.[key];
    if(!embedded)return route;
    try{return railDataRepository.resolveRoute(normalizeLine(embedded.route||embedded,{category:route.category}))}catch{return route}
  }).filter(route=>Array.isArray(route.stations)&&route.stations.length>=2)
}
// The Japanese catalog is lazy-loaded; the named express trains need seven
// verified physical-line chunks before they can be composed into playable routes.
function ensureFamousExpressRoutes(){
  if(countryId!=='jp'||dataLoading)return Promise.resolve();
  if(famousExpressLoadPromise)return famousExpressLoadPromise;
  const catalog=builtin;
  const sourceIds=famousLimitedExpressSourceIds();
  const pending=sourceIds.map(id=>catalog.find(route=>route.id===id)).filter(route=>route?.lazy);
  if(!pending.length&&catalog.some(route=>route.famousExpress))return Promise.resolve();
  famousExpressLoading=true;
  renderRoutes();
  famousExpressLoadPromise=(async()=>{
    const results=await Promise.allSettled(pending.map(route=>hydrateRailLine(route)));
    if(countryId!=='jp'||builtin!==catalog)return;
    results.forEach((result,index)=>{
      const original=pending[index],at=catalog.findIndex(route=>route.id===original.id);
      if(result.status==='fulfilled'&&at>=0){
        catalog[at]=railDataRepository.resolveRoute(result.value);
      }else if(result.status==='rejected'){
        console.warn('Limited express source line unavailable:',original.id,result.reason);
      }
    });
    const generated=buildFamousLimitedExpressRoutes(catalog);
    for(const route of generated){
      if(!catalog.some(existing=>existing.id===route.id))catalog.push(railDataRepository.resolveRoute(route));
    }
    if(!generated.length)toast('특급열차 선로 데이터를 불러오지 못했습니다. 다시 시도해 주세요.');
    refreshRoutes();
  })().catch(error=>{console.error('Limited express catalog load failed:',error);toast('특급열차 목록을 불러오지 못했습니다.');})
    .finally(()=>{
      famousExpressLoading=false;
      famousExpressLoadPromise=null;
      if(countryId==='jp'&&builtin===catalog){renderOperatorFilters();renderRoutes();}
    });
  return famousExpressLoadPromise;
}
function refreshRoutes(){
  routes=allRoutes();
  const network=freeDriveNetworkRoutes();
  try{editor?.setRailNetwork?.(network)}catch(error){console.error('Custom route network initialization failed:',error)}
  try{freeDrive?.setNetwork?.(network)}catch(error){console.error('Free drive network initialization failed:',error)}
  renderTransportFilters();renderOperatorFilters();renderRoutes();refreshFeatureCounts();
  try{renderHomeNetwork()}catch(error){console.error('Home network rendering failed:',error)}
}
function refreshFeatureCounts(){document.querySelectorAll('#feature-viewport [data-feature-route]').forEach(button=>{const route=routes.find(item=>item.id===button.dataset.featureRoute),target=button.closest('article')?.querySelector('[data-feature-stations]');if(route&&target)target.textContent=`${route.stationCount||route.stations.length}개 ${stopWord(route)}`})}
function searchable(r){return normalize([r.operator.ja,r.operator.en,r.operator.ko,r.line.ja,r.line.en,r.line.ko,...(r.line.aliases||[]),...(r.searchStations||[]),...(r.stations||[]).flatMap(s=>[s.ja,s.kana,s.romaji,s.ko,...(s.koAliases||[])])].join(' '))}
function searchVariants(value){const base=normalize(value),variants=new Set([base]);for(const [from,to]of [['구마가와','쿠마가와'],['쿠마가와 철도','쿠마가와테츠도우']])if(base.includes(from))variants.add(base.replaceAll(from,to));return[...variants]}
function routeGroup(route){if(route.category==='custom')return'custom';if(countryId==='jp'&&(route.id==='line-11328'||route.dataKind==='trainService'||route.famousExpress))return'limited-express';if(route.category==='shinkansen')return'shinkansen';if(countryId==='jp'&&(route.mode==='monorail'||/モノレール/.test(route.line?.ja||'')))return'monorail';return route.category}
function routeTransportGroup(route){if(route.category==='custom')return'custom';if(['bus','village_bus','express_bus','brt'].includes(route.mode))return'bus';if(['river_bus','ferry'].includes(route.mode))return'water';if(['rail','subway','commuter_rail','high_speed_rail','light_rail','monorail','tram','airport_rail'].includes(route.mode))return'rail';return'other'}
function routeCategoryMatches(route){if(category==='all')return true;if(transportGroup==='bus')return(category===(route.normalizedCategory||route.routeType||route.category));return routeGroup(route)===category||route.mode===category}
const NETWORK_GROUPS={keio:{routeIds:[],label:'케이오 본선 계통',kind:'branches'}};
// Public service-patterns and physical tracks are separate concepts.
// Group city-tram operators only in the selector; preserve every selectable route and its geometry.
const JP_TRAM_NETWORKS={
 okayamadenkikido:{label:'오카야마 전기궤도',kind:'physical',source:'https://okayama-kido.co.jp/tram/route-map/'},
 hiroshimadentetsu:{label:'히로시마 전철',kind:'services',source:'https://www.hiroden.co.jp/train/route-guide/route-all.html'},
 hakodateshikotsukyoku:{label:'하코다테 시영 전차',kind:'services'},
 nagasakidenkikido:{label:'나가사키 전기궤도',kind:'services'},
 kagoshimashikotsukyoku:{label:'가고시마 시영 전차',kind:'services'},
 kumamotoshikotsukyoku:{label:'구마모토 시영 전차',kind:'services'}
};
function refreshTramNetworkGroups(eligible){
 // Group by an actual operator ID, never by a similar-looking Korean display name.
 // Grouping affects only the selector: underlying routes, station order and geometry stay unchanged.
 for(const key of Object.keys(NETWORK_GROUPS))if(key.startsWith('operator-')||key.startsWith('tram-'))delete NETWORK_GROUPS[key];
 for(const [id,info] of Object.entries(JP_TRAM_NETWORKS)){
  const members=eligible.filter(r=>r.operatorId===id);
  if(members.length>1)NETWORK_GROUPS['tram-'+id]={...info,routeIds:members.map(r=>r.id)};
 }
 const byOperator=new Map();
 for(const route of eligible){
  const id=route.operatorId;
  if(!id||JP_TRAM_NETWORKS[id]||/^jr(?:-|$)/i.test(id)||id==='keio'||route.category==='shinkansen'||route.dataKind==='trainService')continue;
  if(!byOperator.has(id))byOperator.set(id,[]);
  byOperator.get(id).push(route);
 }
 for(const [id,members] of byOperator){
  // Large metropolitan networks must retain their distinct line cards.
  // Smaller operators with multiple lines receive a single operator selector.
  if(members.length<2||members.length>12)continue;
  const operator=members[0].operator?.ko||id;
  const modes=new Set(members.map(r=>r.category));
  const kind=modes.size===1&&modes.has('tram')?'physical':'branches';
  NETWORK_GROUPS['operator-'+id]={label:operator,kind,routeIds:members.map(r=>r.id)};
 }
}

function filteredRoutes(){const queries=searchVariants($('#route-search').value);return routes.filter(r=>(countryId==='jp'||transportGroup==='all'||routeTransportGroup(r)===transportGroup)&&(countryId!=='kr'||transportGroup!=='bus'||regionFilter==='all'||r.regionId===regionFilter)&&routeCategoryMatches(r)&&(operatorFilter==='all'||operatorKey(r)===operatorFilter)&&(!queries[0]||queries.some(query=>searchable(r).includes(query))))}
function stopWord(route){return['bus','village_bus','express_bus','brt'].includes(route.mode)?'정류장':['river_bus','ferry'].includes(route.mode)?'선착장':'역'}
function krLineFamily(r){if(isKoreanResearch(r))return r.integratedLine1===true?'kr-passenger-metro-1':r.id;return r.countryId==='kr'?(r.passengerLineId||r.id):null}
function krRouteLabel(r){return r?.integratedLine1===true?'수도권 전철 1호선':koreanRouteDisplayText(String(r.passengerLineName||r.line?.ko||r.id).trim(),r)}
// Unreleased research and structurally incomplete Korean routes are not playable.
function koreanRouteUnavailableReason(route){
  if(route?.countryId!=='kr')return '';
  const blocked=koreanRouteBlockReason(route);
  if(blocked)return blocked;
  if(isKoreanResearch(route)){if(koreaPlayMode!=='research'&&!(koreaPlayMode==='released'&&route.integratedLine1===true))return '연구용 미리보기에서만 실행할 수 있습니다.';if(!route.lazy){try{assertKoreanResearchRoute(route)}catch(e){return e.message}}}
  if(route.playable===false||route.visibility==='internal')return '공개 운행 검증 대기';
  if(route.geometryReady!==true||route.geometryStatus==='missing')return '실제 선로 선형 검증 대기';
  if(!route.lazy){
    if(!Array.isArray(route.stations)||route.stations.length<2)return '정차역 데이터 부족';
    if(!Array.isArray(route.geometry)||route.geometry.length<2)return '실제 선로 좌표 부족';
    if((route.missingSegments||[]).length)return '연결되지 않은 선로 구간 존재';
    if((route.directedSegments||[]).some(part=>!Array.isArray(part.geometry)||part.geometry.length<2))return '역간 실제 선로 좌표 부족';
  }
  return '';
}
function krRouteCards(filtered){const groups=new Map();for(const r of filtered){const key=krLineFamily(r)||r.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)}return [...groups.values()].map(members=>{const r=members[0];if(members.length<2||members.every(m=>koreanRouteUnavailableReason(m)))return routeCard(r);const integrated=r.integratedLine1===true&&isKoreanResearch(r),services=integrated?[]:koreanFamilyServiceChoices(krLineFamily(r)),count=services.length?services.length/2:members.length,label=integrated?'방향별 운행계통':services.length?'운행계통':'운행구간';return '<button type="button" class="line-card" style="--route-color:'+escapeHtml(r.lineColor||'#888')+'" data-kr-family="'+escapeHtml(krLineFamily(r))+'"><div class="line-card-identity"><span class="operator">'+escapeHtml(r.operator?.ko||'')+'</span><h3 class="line-card-line-name">'+escapeHtml(krRouteLabel(r))+'</h3></div><p>'+(integrated?'경인선 급행·일반 선택 · 코레일 확인 2방향 · 나머지 시간표 검증 중':'노선을 선택한 뒤 플레이 버튼에서 행선지를 설정하세요')+'</p><footer><span>'+count+'개 '+label+'</span><span>노선 선택 →</span></footer></button>'}).join('')}
function routeCard(r){const reason=koreanRouteUnavailableReason(r),ready=r.geometryReady===true,word=stopWord(r),action=reason?'검증 대기':r.lazy?'상세 불러오기':ready?'선택':'순서 플레이';return`<button ${reason?'disabled aria-disabled="true" title="'+escapeHtml(reason)+'"':''} class="line-card ${reason?'unplayable':''} ${selected?.id===r.id?'selected':''} ${r.category==='shinkansen'?'shinkansen-card':''}" style="--route-color:${r.lineColor}" data-route="${r.id}"><div class="line-card-identity"><span class="operator">${escapeHtml(r.operator.ko)}</span><h3 class="line-card-line-name">${escapeHtml(r.countryId==='kr'?krRouteLabel(r):r.line.ko)}</h3></div><p>${escapeHtml(reason||(r.countryId==='kr'?krRouteLabel(r):r.line.ja||r.line.en))}</p>${isKoreanResearch(r)?`<p class="research-card-status">${escapeHtml(koreanStationDisplayName(r.researchEvidence.origin,r.countryId,r))} → ${escapeHtml(koreanStationDisplayName(r.researchEvidence.destination,r.countryId,r))}<br>실제 선로 연결 확인 · 공식 운행 미승인 · 연구용 플레이 가능</p>`:''}<footer><span>${r.stationCount||r.stations.length}개 ${word}</span><span>${action} ${reason?'':'→'}</span></footer></button>`}
function renderRoutes(){const filtered=filteredRoutes(),query=$('#route-search').value;const allVisible=filtered,visible=allVisible.slice(0,routeRenderLimit);$('#route-count').textContent=`${filtered.length}개 노선 · ${visible.length}개 표시`;const random=category==='all'&&transportGroup==='all'&&operatorFilter==='all'&&!query&&(countryId!=='kr'||filtered.some(r=>!koreanRouteUnavailableReason(r)))?`<button class="line-card random" style="--route-color:#45c985" data-random-route><span class="operator">${countryId==='kr'?'KOREA TRANSIT NETWORK':'JAPAN RAIL NETWORK'}</span><h3>RANDOM</h3><p>${countryId==='kr'?'대한민국':'일본 전국'} 랜덤 노선</p><footer><span>PLAYABLE ROUTES</span><span>SELECT →</span></footer></button>`:'';const more=allVisible.length>visible.length?`<button class="line-card route-more" data-route-more><span class="operator">WINDOWED GRID</span><h3>＋ ${Math.min(96,allVisible.length-visible.length)}개 더 보기</h3><p>${allVisible.length-visible.length}개 노선 남음</p></button>`:'';$('#route-grid').innerHTML=random+(visible.length?(countryId==='kr'?krRouteCards(visible):visible.map(routeCard).join(''))+more:(countryId==='jp'&&category==='limited-express'&&famousExpressLoading?'<p class="muted" role="status">특급열차의 실제 선로와 정차역을 불러오는 중...</p>':'<p class="muted">검색 결과가 없습니다.</p>'))}
function renderSelected(){const panel=$('#selected-line-preview');if(selectedGroup){const spec=NETWORK_GROUPS[selectedGroup],members=spec.routeIds.map(id=>routes.find(route=>route.id===id)).filter(Boolean),main=members[0];panel.innerHTML=`<div class="selected-line-card network-detail"><p class="eyebrow">${spec.kind==='services'?'운행계통':spec.kind==='physical'?'실제 노선':'분기·계통'} 선택</p><h3 id="selected-line-heading">${escapeHtml(spec.label||main?.operator.ko||'노선 그룹')}<span>${spec.kind==='services'?'운행하는 계통을 선택하세요':'노선을 선택하세요'}</span></h3><div class="network-branches">${members.map(route=>`<button data-route="${route.id}"><span><b>${escapeHtml(route.line.ja)}</b><small>${escapeHtml(route.line.ko)} · ${route.stations.length} STATIONS</small></span></button>`).join('')}</div></div>`;return}if(!selected){panel.innerHTML='<div class="selected-line-empty"><h3 id="selected-line-heading">노선을 선택하세요.</h3><p>오른쪽 목록에서 플레이할 노선을 선택합니다.</p></div>';return}panel.closest('.selected-line-panel').style.setProperty('--route-color',selected.lineColor);panel.innerHTML=`<div class="selected-line-card" style="--route-color:${selected.lineColor}"><div class="selected-line-operator"><span>${escapeHtml(selected.operator.ko)}</span></div><h3 id="selected-line-heading">${escapeHtml(koreanRouteDisplayText(selected.line.ja,selected))}<span>${escapeHtml(koreanRouteDisplayText(selected.line.ko,selected))} · ${escapeHtml(selected.line.en)}</span></h3>${selected.section?`<p class="selected-section">${escapeHtml(koreanRouteDisplayText(selected.section.ja,selected))} · ${escapeHtml(koreanRouteDisplayText(selected.section.ko,selected))}</p>`:''}<div class="selected-line-meta"><span>${selected.stations.length} STATIONS</span><span>${selected.dataKind==='trainService'?'LIMITED EXPRESS':selected.loop?'LOOP LINE':'FULL ROUTE'}</span></div><div class="selected-line-actions"><button class="selected-play" type="button" data-selected-play="${selected.id}">PLAY THIS LINE <span>→</span></button><button class="selected-free-drive" type="button" data-selected-free-drive>FREE DRIVE <span>↗</span></button></div></div>`}
function throughRouteIds(spec){return spec.routeSegments?.map(segment=>segment.routeId)||spec.routeIds||[]}
function throughSpec(route){return(globalThis.TRT_RAIL_SYSTEM?.throughServices||[]).find(item=>throughRouteIds(item).includes(route.id))}
function buildThroughRoute(spec,directionId='forward'){
  try{return buildThroughServiceRoute(spec,id=>builtin.find(route=>route.id===id),directionId)}catch(error){console.error(error);return null}
}
const hasHangul=value=>/[가-힣]/.test(String(value||''));
function stationKoreanByJapaneseName(ja){
  if(!ja)return'';
  for(const route of builtin||[])for(const station of route?.stations||[]){
    const stationJa=station?.ja||station?.names?.ja||'',stationKo=station?.ko||station?.names?.ko||'';
    if(stationJa===ja&&hasHangul(stationKo))return stationKo
  }
  return''
}
const journeyLabel=value=>{
  if(typeof value==='string')return value;
  const ko=value?.ko||value?.names?.ko||'',ja=value?.ja||value?.names?.ja||'',en=value?.en||value?.names?.en||'';
  if(hasHangul(ko))return ko;
  const recovered=stationKoreanByJapaneseName(ja||ko);if(recovered)return recovered;
  return ko||ja||en||''
};
const journeyStationDisplayName=value=>koreanStationDisplayName(journeyLabel(value),selected?.countryId,selected);
const journeyStationKey=(names,id='')=>normalize(names?.ja||names?.names?.ja||journeyLabel(names)||id);
function nationwideCatalogLine(route){
  const catalog=globalThis.TRT_NATIONWIDE_SERVICE_CATALOG?.lines||{},ids=[route?.id,route?.legacyId].filter(Boolean);
  for(const id of ids){const match=String(id).match(/^line-(\d+)$/);if(match&&catalog[match[1]])return{code:match[1],data:catalog[match[1]]}}
  const ja=route?.line?.ja||route?.line?.names?.ja||'';for(const [code,data] of Object.entries(catalog))if(data.ja===ja)return{code,data};
  return null
}
function routeForCatalogLine(code){
  const catalog=globalThis.TRT_NATIONWIDE_SERVICE_CATALOG?.lines||{},meta=catalog[String(code)],direct=builtin.find(route=>route.id===`line-${code}`||route.legacyId===`line-${code}`);
  if(direct)return direct;return builtin.find(route=>(route.line?.ja||route.line?.names?.ja||'')===meta?.ja)||null
}
function catalogPatternChoice(route,pattern,reverse=false){
  // Listing a documented service must not depend on its railway geometry being
  // loaded or playable. Keep incomplete catalog patterns visible for diagnosis.
  const allSegments=pattern.segments||[],base=allSegments.filter(segment=>segment.stations?.length>=2);
  const segments=reverse?base.slice().reverse().map(segment=>({...segment,stations:segment.stations.slice().reverse()})):base;
  const first=segments[0]?.stations?.[0]?.[0]||route.stations?.[0]?.ja||'',last=segments.at(-1)?.stations?.at(-1)?.[0]||route.stations?.at(-1)?.ja||'';
  const firstRoute=routeForCatalogLine(segments[0]?.lineCode),lastRoute=routeForCatalogLine(segments.at(-1)?.lineCode),origin=firstRoute?.stations?.find(station=>station.ja===first)||{ja:first,ko:first},destination=lastRoute?.stations?.find(station=>station.ja===last)||{ja:last,ko:last};
  const type={id:`catalog-type-${pattern.id}`,names:{ja:pattern.type?.ja||'',ko:pattern.type?.ko||'',en:pattern.type?.en||''},priority:Number(pattern.type?.priority||0),kind:Number(pattern.type?.kind||0)};
  return{kind:'catalog',id:`catalog:${pattern.id}:${reverse?'reverse':'forward'}`,originId:`catalog:${pattern.id}:${reverse?'reverse':'forward'}:origin`,destinationId:`catalog:${pattern.id}:${reverse?'reverse':'forward'}:destination`,originNames:origin,destinationNames:destination,trainType:type,patternName:type.names,throughServiceId:segments.length>1?`catalog-${pattern.id}`:null,direction:reverse?'reverse':'forward',catalogPattern:pattern,catalogReverse:reverse,catalogUnavailableReason:!base.length?'원본 정차 구간 데이터가 없습니다.':base.length!==allSegments.length?'일부 구간의 정차역 자료가 누락되었습니다.':base.some(segment=>!routeForCatalogLine(segment.lineCode))?'일부 연결 노선이 등록되어 있지 않습니다.':null}
}
// A limited express may skip the interchange at which the underlying rail
// infrastructure changes (e.g. Hayabusa skips Shin-Aomori in one catalog
// segment). Keep the skipped stop out of the service's stops, but extend the
// physical segment to the shared junction before assembling the track.
function catalogConnectedSegments(segments){
  const parts=segments.map(segment=>{
    const route=routeForCatalogLine(segment.lineCode);
    if(!route?.stations?.length)throw new Error('연결 노선 데이터를 불러오지 못했습니다: '+segment.lineCode);
    const first=segment.stations[0][0],last=segment.stations.at(-1)[0];
    const a=route.stations.findIndex(st=>st.ja===first);
    const b=route.stations.findIndex(st=>st.ja===last);
    if(a<0||b<0)throw new Error((route.line?.ja||segment.lineCode)+': '+first+' → '+last+' 구간 매칭 실패');
    return{route,a,b,step:b>=a?1:-1};
  });
  for(let i=1;i<parts.length;i++){
    const previous=parts[i-1],next=parts[i];
    if(previous.route.stations[previous.b]?.ja===next.route.stations[next.a]?.ja)continue;
    let best=null;
    for(let p=0;p<=3;p++)for(let q=0;q<=3;q++){
      const pIdx=previous.b+p*previous.step,nIdx=next.a-q*next.step;
      const pStation=previous.route.stations[pIdx],nStation=next.route.stations[nIdx];
      if(!pStation||!nStation||pStation.ja!==nStation.ja)continue;
      if(!best||p+q<best.score)best={pIdx,nIdx,score:p+q};
    }
    if(best){previous.b=best.pIdx;next.a=best.nIdx;}
  }
  return parts.map(({route,a,b})=>({
    routeId:route.id,direction:b>=a?'forward':'reverse',
    startStationJa:route.stations[a].ja,endStationJa:route.stations[b].ja
  }));
}
function buildCatalogResolved(choice){
  const pattern=choice?.catalogPattern,base=(pattern?.segments||[]).filter(segment=>segment.stations?.length>=2),segments=choice?.catalogReverse?base.slice().reverse().map(segment=>({...segment,stations:segment.stations.slice().reverse()})):base;if(!segments.length)throw new Error('전국 운행계통 데이터가 비어 있습니다.');
  const stopNames=[];for(const segment of segments)for(const [name,pass] of segment.stations)if(Number(pass)!==1&&!stopNames.includes(name))stopNames.push(name);
  if(segments.length===1){
    const segment=segments[0],route=routeForCatalogLine(segment.lineCode);if(!route)throw new Error(`노선 데이터를 찾지 못했습니다: ${segment.lineCode}`);
    const first=segment.stations[0][0],last=segment.stations.at(-1)[0],a=route.stations.findIndex(station=>station.ja===first),b=route.stations.findIndex(station=>station.ja===last);if(a<0||b<0)throw new Error(`${first} → ${last} 구간을 현재 노선 데이터와 연결하지 못했습니다.`);
    const direction=b>=a?'forward':'reverse',allowed=new Set(stopNames),stops=route.stations.filter(station=>allowed.has(station.ja)).map(station=>station.id);
    const service={id:`catalog-${pattern.id}`,nameJa:pattern.type?.ja||'運行系統',nameKo:pattern.type?.ko||'운행계통',nameEn:pattern.type?.en||'Service',stops};
    return{route:{...route,services:[service]},service,direction,pattern:null,trainType:choice.trainType,destinationStationId:route.stations[b]?.id||null,trainTypeContexts:[]}
  }
  const routeSegments=catalogConnectedSegments(segments);
  const spec={id:`catalog-${pattern.id}`,nameJa:pattern.type?.ja||'直通',nameKo:pattern.type?.ko||'직통',nameEn:pattern.type?.en||'Through Service',routeSegments,boundarySnapToleranceKm:1.2},through=buildThroughServiceRoute(spec,id=>builtin.find(route=>route.id===id));
  const allowed=new Set(stopNames),stops=through.stations.filter(station=>allowed.has(station.ja)).map(station=>station.id),service={id:`catalog-${pattern.id}`,nameJa:pattern.type?.ja||'直通',nameKo:pattern.type?.ko||'직통',nameEn:pattern.type?.en||'Through Service',stops};
  return{route:{...through,services:[service]},service,direction:'forward',pattern:null,trainType:choice.trainType,destinationStationId:through.stations.at(-1)?.id||null,trainTypeContexts:[]}
}
function resolveOperatingChoice(choice,route,{preview=false}={}){
  if(!choice||!route)throw new Error('운행계통 선택 정보가 없습니다.');
  if(choice.kind==='nex')return resolveNexOperatingChoice(route,choice);
  if(choice.kind==='famousExpress')return resolveFamousLimitedExpressChoice(route,choice);
  if(isKoreanResearch(route))return resolveKoreanResearchChoice(choice,route);
  if(route.countryId==='kr'&&route.schemaVersion===2)return resolveKoreanVerifiedChoice(choice,route);
  if(choice.kind==='koreanFamilyService')return resolveKoreanFamilyService(choice,id=>builtin.find(item=>item.id===id));
  if(choice.kind==='catalog')return buildCatalogResolved(choice);
  if(choice.kind==='trainService'){
    const stopNames=new Set((choice.branchStops||[]).map(String));
    const branchStations=(route.stations||[]).filter(station=>stopNames.has(String(station.ja))||stopNames.has(String(station.ko)));
    const stops=branchStations.length>=2?branchStations.map(station=>station.id):(route.stations||[]).map(station=>station.id);
    if(stops.length<2)throw new Error('운행 가능한 정차역이 부족합니다.');
    const service={id:choice.trainServiceBranchId||choice.trainServiceId||'train-service',nameJa:choice.patternName?.ja||'',nameKo:choice.patternName?.ko||'열차 서비스',nameEn:choice.patternName?.en||'',stops};
    const resolvedRoute={...route,services:[service]};
    return{route:resolvedRoute,service,direction:'forward',pattern:null,trainType:null,destinationStationId:choice.destinationId,trainTypeContexts:[]};
  }
  if(choice.kind==='through'){
    const spec=(globalThis.TRT_RAIL_SYSTEM?.throughServices||[]).find(item=>item.id===choice.throughSpecId);
    if(!spec)throw new Error('직통운행 정의를 찾을 수 없습니다.');
    const throughRoute=buildThroughRoute(spec,choice.direction);
    if(!throughRoute||!Array.isArray(throughRoute.stations)||throughRoute.stations.length<2)throw new Error('직통운행 경로를 만들 수 없습니다.');
    const service={id:'local',nameJa:spec?.nameJa||'直通',nameKo:spec?.nameKo||'직통',nameEn:spec?.nameEn||'Through',stops:throughRoute.stations.map(station=>station.id)};
    return{route:{...throughRoute,services:[service]},service,direction:'forward',pattern:null,trainType:choice.trainType,destinationStationId:choice.destinationId,trainTypeContexts:[]};
  }
  if(choice.journeyId)return resolveServiceJourney({baseRoute:route,journeyId:choice.journeyId,getRoute:id=>builtin.find(item=>item.id===id)});
  if(choice.patternId)return resolveServiceSelection({baseRoute:route,servicePatternId:choice.patternId,directionId:choice.direction||'forward',getRoute:id=>builtin.find(item=>item.id===id)});
  return resolveServiceSelection({baseRoute:route,legacyServiceId:choice.legacyServiceId||'local',directionId:choice.direction||'forward',getRoute:id=>builtin.find(item=>item.id===id)});
}
function operatingChoiceStatus(choice,route){
  // Display and availability are independent. Never silently remove a listed
  // Japanese operating pattern merely because assembling its tracks failed.
  if(choice.catalogUnavailableReason)return{playable:false,reason:choice.catalogUnavailableReason};
  try{
    const resolved=resolveOperatingChoice(choice,route,{preview:true}),resolvedRoute=resolved?.route;
    if(!resolvedRoute||!Array.isArray(resolvedRoute.stations)||resolvedRoute.stations.length<2)
      return{playable:false,reason:'운행 경로의 역 정보가 부족합니다.'};
    const service=resolved?.service;
    if(service?.stops?.length){
      const ids=new Set(resolvedRoute.stations.map(station=>String(station.id)));
      if(service.stops.some(id=>!ids.has(String(id))))
        return{playable:false,reason:'정차역과 실제 선로의 연결이 일치하지 않습니다.'};
    }
    return{playable:true,reason:''};
  }catch(error){
    return{playable:false,reason:String(error?.message||'노선 선형 검증 실패')};
  }
}
function operatingChoicePlayable(choice,route){return operatingChoiceStatus(choice,route).playable}
function actualOperatingChoices(route){
  // N'EX requires separate Ofuna/Shinjuku paths: never offer legacy chained local/fallback choices.
  if(route?.id==='line-11328')return nexOperatingChoices(route);
  if(route?.famousExpress)return famousLimitedExpressChoices(route);
  if(route?.countryId==='kr'&&isKoreanResearch(route))return koreanResearchChoices(route);
  if(route?.countryId==='kr'&&route.schemaVersion===2)return koreanVerifiedChoices(route);
  const journeys=serviceJourneysForRoute(route?.id),patterns=servicePatternsForRoute(route?.id),stationMap=new Map((route?.stations||[]).map(station=>[String(station.id),station])),choices=[],seen=new Set;
  const add=choice=>{const key=[choice.kind==='catalog'?choice.id:(choice.kind||''),choice.patternId||'',choice.journeyId||'',choice.throughSpecId||'',choice.legacyServiceId||'',choice.originId,choice.destinationId,choice.trainType?.id||'',choice.direction||''].join('::');if(!seen.has(key)){seen.add(key);choices.push(choice)}};
  for(const item of journeys)add({kind:'journey',id:`journey:${item.id}`,originId:String(item.originStationId),destinationId:String(item.destinationStationId),originNames:item.originNames,destinationNames:item.destinationNames,trainType:trainTypeFor(item.trainTypeId),journeyId:item.id,patternId:item.servicePatternId||null,patternName:item.names||null,throughServiceId:item.throughServiceId||null,direction:item.directionId||'forward'});
  for(const item of patterns){
    if(!item.originStationId||!item.destinationStationId)continue;
    const duplicate=choices.some(choice=>choice.patternId===item.id&&choice.originId===String(item.originStationId)&&choice.destinationId===String(item.destinationStationId)&&choice.trainType?.id===item.trainTypeId);
    if(duplicate)continue;
    const type=trainTypeFor(item.trainTypeId),origin=stationMap.get(String(item.originStationId))||{ko:item.originStationId},destination=stationMap.get(String(item.destinationStationId))||{ko:(item.names?.ko||'').match(/([^\s]+)행$/)?.[1]||item.destinationStationId};
    add({kind:'pattern',id:`pattern:${item.id}`,originId:String(item.originStationId),destinationId:String(item.destinationStationId),originNames:origin,destinationNames:destination,trainType:type,journeyId:null,patternId:item.id,patternName:item.names||null,throughServiceId:item.throughServiceId||null,direction:item.directionId||'forward'})
  }
  for(const service of route?.services||[]){
    // Famous trains have dedicated cards: do not duplicate Skyliner inside the ordinary airport line.
    if(route?.id==='line-23006'&&service?.id==='skyliner')continue;
    if(!service?.id)continue;
    const stopIds=(service.stops||service.stopStationIds||[]).map(String),serviceStations=stopIds.map(id=>stationMap.get(id)).filter(Boolean);
    const first=serviceStations[0]||route.stations?.[0],last=serviceStations.at(-1)||route.stations?.at(-1);if(!first||!last||String(first.id)===String(last.id))continue;
    const serviceName={ko:service.nameKo||service.names?.ko||'각역정차',ja:service.nameJa||service.names?.ja||'',en:service.nameEn||service.names?.en||''};
    add({kind:'legacy',id:`service:${service.id}:forward`,originId:String(first.id),destinationId:String(last.id),originNames:first,destinationNames:last,trainType:null,journeyId:null,patternId:null,patternName:serviceName,throughServiceId:service.throughServiceId||null,legacyServiceId:service.id,direction:'forward'});
    if(route.countryId!=='kr'||route.directions?.some(d=>d.id==='reverse'))if(!route.oneWay)add({kind:'legacy',id:`service:${service.id}:reverse`,originId:String(last.id),destinationId:String(first.id),originNames:last,destinationNames:first,trainType:null,journeyId:null,patternId:null,patternName:serviceName,throughServiceId:service.throughServiceId||null,legacyServiceId:service.id,direction:'reverse'})
  }
  const throughSpecs=(globalThis.TRT_RAIL_SYSTEM?.throughServices||[]).filter(spec=>(spec.participatingLineIds||throughRouteIds(spec)).includes(route?.id));
  for(const spec of throughSpecs)for(const direction of ['forward','reverse']){
    const configs=spec.directionVariants?.[direction];if(!configs?.length)continue;
    const first=configs[0],last=configs.at(-1),originName=first.startStationJa||first.startStationId||'',destinationName=last.endStationJa||last.endStationId||'';
    add({kind:'through',id:`through:${spec.id}:${direction}`,originId:`through:${spec.id}:${direction}:origin`,destinationId:`through:${spec.id}:${direction}:destination`,originNames:{ja:originName,ko:originName},destinationNames:{ja:destinationName,ko:destinationName},trainType:trainTypeFor('through-regular'),journeyId:null,patternId:null,patternName:{ja:spec.nameJa,ko:spec.nameKo,en:spec.nameEn},throughServiceId:spec.id,throughSpecId:spec.id,direction})
  }
  for(const service of globalThis.TRT_RAIL_SYSTEM?.trainServices||[]){
    if(service.routeId!==route?.id)continue;
    for(const branch of service.branches||[]){
      const firstName=branch.stops?.[0]||route.stations?.[0]?.ja||'',lastName=branch.destinationJa||branch.stops?.at(-1)||route.stations?.at(-1)?.ja||'';
      add({kind:'trainService',id:`train-service:${service.id}:${branch.id}`,originId:`train-service:${service.id}:${branch.id}:origin`,destinationId:`train-service:${service.id}:${branch.id}:destination`,originNames:{ja:firstName,ko:firstName},destinationNames:{ja:lastName,ko:branch.destinationKo||lastName},trainType:null,journeyId:null,patternId:null,patternName:{ja:service.nameJa,ko:service.nameKo,en:service.nameEn},throughServiceId:null,trainServiceId:service.id,trainServiceBranchId:branch.id,branchStops:branch.stops||[],direction:'forward'})
    }
  }
  const catalogLine=nationwideCatalogLine(route);if(catalogLine)for(const pattern of catalogLine.data.patterns||[]){const variants=Number(pattern.type?.direction||0)===0?[false,true]:[false];for(const reverse of variants){const choice=catalogPatternChoice(route,pattern,reverse);if(!choice)continue;add(choice)}}
  if(route.countryId==='kr')choices.splice(0,choices.length,...choices.filter(choice=>(route.category==='custom'||route.directions?.some(d=>d.id===choice.direction))&&operatingChoicePlayable(choice,route)));
  if(choices.length)return choices.sort((a,b)=>(b.trainType?.priority||0)-(a.trainType?.priority||0)||journeyLabel(a.destinationNames).localeCompare(journeyLabel(b.destinationNames),'ko'));
  const stations=route?.stations||[];if(stations.length<2)return[];
  const first=stations[0],last=stations.at(-1);
  return[
    {kind:'fallback',id:'fallback:forward',originId:String(first.id),destinationId:String(last.id),originNames:first,destinationNames:last,trainType:null,journeyId:null,patternId:null,patternName:{ko:'각역정차'},throughServiceId:null,direction:'forward'},
    {kind:'fallback',id:'fallback:reverse',originId:String(last.id),destinationId:String(first.id),originNames:last,destinationNames:first,trainType:null,journeyId:null,patternId:null,patternName:{ko:'각역정차'},throughServiceId:null,direction:'reverse'}
  ].filter(choice=>route.countryId!=='kr'||route.category==='custom'||route.directions?.some(d=>d.id===choice.direction))
}
function operatingPatternKey(choice){return String(choice.line1PatternKey||choice.sourceRouteId||choice.patternId||choice.legacyServiceId||journeyLabel(choice.patternName)||'default')}
function operatingPatternLabel(choice){
  if(choice.kind==='koreanFamilyService')return koreanRouteDisplayText(journeyLabel(choice.patternName),selected);
  const route=choice.sourceRouteId?(builtin.find(item=>item.id===choice.sourceRouteId)||routes.find(item=>item.id===choice.sourceRouteId)):selected;
  const seoulLine2={"kr-metro-2":'본선 순환',"kr-metro-2-section-2":'성수지선',"kr-metro-2-section-3":'신정지선'};
  if(route?.passengerLineId==='kr-passenger-metro-2'&&seoulLine2[route.id])return seoulLine2[route.id];
  if(route?.integratedLine1===true)return route.line1Service?.group||'1호선 일반';
  if(route?.operatingPatternName)return koreanRouteDisplayText(journeyLabel(route.operatingPatternName),route);
  const section=String(route?.line?.ko||'').match(/\(([^)]+)\)/)?.[1];
  return koreanRouteDisplayText(section?`${section.replace('~',' ↔ ')} 운행`:journeyLabel(choice.patternName)||journeyLabel(choice.trainType)||'기본 운행계통',route)
}
function operatingDirectionLabel(choice){
  if(choice.sourceRouteId==='kr-metro-2')return choice.direction==='reverse'?'내선순환':'외선순환';
  const origin=journeyStationDisplayName(choice.originNames),destination=journeyStationDisplayName(choice.destinationNames);
  if(choice.line1PatternKey&&origin&&destination&&origin!==destination){const source=choice.sourceRouteId?(builtin.find(r=>r.id===choice.sourceRouteId)||routes.find(r=>r.id===choice.sourceRouteId)):selected;return `${origin} → ${destination}${source?.line1Service?.evidenceStatus==='operator-service-confirmed'?' · 운행 확인':' · 시간표 확인 필요'}`}
  if(origin&&destination&&origin!==destination)return`${origin} → ${destination}`;
  return choice.direction==='reverse'?'역방향':'정방향'
}
function configureJourneyPicker(){
  // Keep this browser picker self-contained for isolated JP operating-choice tests.
  const journeyStationDisplayName=value=>{const name=journeyLabel(value);return typeof koreanStationDisplayName==='function'&&typeof selected!=='undefined'&&selected?.countryId==='kr'?koreanStationDisplayName(name,'kr',selected):name};
  const picker=$('#journey-picker'),pattern=$('#journey-pattern'),directionPicker=$('#journey-direction'),origin=$('#journey-origin'),destination=$('#journey-destination'),summary=$('#journey-summary'),direction=$('#service-direction'),submit=$('#setup-form button[type="submit"]'),choices=koreaFamilyChoices||actualOperatingChoices(selected);
  if(!picker||!pattern||!directionPicker||!origin||!destination)return;
  const japan=selected?.countryId==='jp';
  const statusById=new Map(japan?choices.map(choice=>[choice.id,operatingChoiceStatus(choice,selected)]):[]);
  const statusOf=choice=>statusById.get(choice?.id)||{playable:true,reason:''};
  if(!choices.length){
    picker.hidden=false;summary.textContent='등록된 운행계통이 없습니다. 해당 노선 데이터를 확인해 주세요.';
    destination.replaceChildren();if(submit)submit.disabled=true;return;
  }
  picker.hidden=false;
  const patternGroups=[...new Map(choices.map(choice=>[operatingPatternKey(choice),choice])).entries()];
  pattern.innerHTML=patternGroups.map(([key,choice])=>`<option value="${escapeHtml(key)}">${escapeHtml(operatingPatternLabel(choice))}</option>`).join('');
  const patternChoices=()=>choices.filter(choice=>operatingPatternKey(choice)===pattern.value);
  const directionKey=choice=>String(choice.direction||'forward');
  const preferred=items=>items.find(choice=>statusOf(choice).playable)||items[0];
  const renderOrigins=()=>{
    const available=patternChoices().filter(choice=>directionKey(choice)===directionPicker.value);
    const originGroups=[...new Map(available.map(choice=>[journeyStationKey(choice.originNames,choice.originId),choice])).entries()];
    origin.innerHTML=originGroups.map(([key,choice])=>`<option value="${escapeHtml(key)}">${escapeHtml(journeyStationDisplayName(choice.originNames))}</option>`).join('');
    const suggested=preferred(available);
    origin.value=suggested?journeyStationKey(suggested.originNames,suggested.originId):(originGroups[0]?.[0]||'');
    renderDestinations()
  };
  const renderDirections=()=>{
    const directionGroups=[...new Map(patternChoices().map(choice=>[directionKey(choice),choice])).entries()].sort(([a],[b])=>(a==='forward'?-1:a==='reverse'?1:0)-(b==='forward'?-1:b==='reverse'?1:0));
    directionPicker.innerHTML=directionGroups.map(([key,choice])=>`<option value="${escapeHtml(key)}">${escapeHtml(operatingDirectionLabel(choice))}</option>`).join('');
    directionPicker.value=directionKey(preferred(patternChoices())||directionGroups[0]?.[1]||{});
    renderOrigins()
  };
  const selectChoice=choice=>{
    if(!choice){if(submit)submit.disabled=true;return;}
    destination.value=choice.id;destination.dataset.stationId=choice.destinationId||'';
    direction.value=choice.direction||'forward';
    const state=statusOf(choice),total=choices.length,ready=statusById.size?[...statusById.values()].filter(item=>item.playable).length:total;
    const availability=japan?(state.playable?' · 플레이 가능':` · 실행 불가: ${state.reason||'연결된 선로 검증 필요'}`):'';
    summary.textContent=`${operatingPatternLabel(choice)} · ${operatingDirectionLabel(choice)} · ${journeyStationDisplayName(choice.originNames)} → ${journeyStationDisplayName(choice.destinationNames)}${choice.trainType?` · ${journeyLabel(choice.trainType)}`:''}${choice.throughServiceId?' · 직통운행':''}${availability}${japan?` (등록 ${total}개 / 실행 가능 ${ready}개)`:''}`;
    if(submit){submit.disabled=japan&&!state.playable;submit.textContent=japan&&!state.playable?'선로 미검증 · 실행 불가':'운행 시작 →'}
    const endpoints=$('#setup-route .route-endpoints');
    if(endpoints)endpoints.innerHTML=`<span>${escapeHtml(journeyStationDisplayName(choice.originNames))}<small> 출발</small></span><span>${escapeHtml(journeyStationDisplayName(choice.destinationNames))}<small> 행선지</small></span>`
  };
  function renderDestinations(){
    const available=patternChoices().filter(choice=>directionKey(choice)===directionPicker.value&&journeyStationKey(choice.originNames,choice.originId)===origin.value);
    // Keep different patterns even when they share train type and endpoints.
    // The old Map deduplication hid distinct stopping patterns.
    const labels=available.map(choice=>[journeyStationKey(choice.destinationNames,choice.destinationId),normalize(journeyLabel(choice.trainType)),choice.throughServiceId?'through':''].join('::'));
    const frequencies=new Map(labels.map(label=>[label,labels.filter(value=>value===label).length]));
    destination.innerHTML=available.map((choice,i)=>{
      const typeLabel=journeyLabel(choice.trainType),through=choice.throughServiceId?' · 직통':'';
      const duplicate=frequencies.get(labels[i])>1?` · 계통 ${choice.catalogPattern?.id||choice.patternId||choice.id}`:'';
      const unavailable=japan&&!statusOf(choice).playable?' · 실행 불가':'';
      return`<option value="${escapeHtml(choice.id)}" data-destination-id="${escapeHtml(choice.destinationId||'')}">${escapeHtml(journeyStationDisplayName(choice.destinationNames))}${typeLabel?` · ${escapeHtml(typeLabel)}`:''}${through}${escapeHtml(duplicate)}${unavailable}</option>`
    }).join('');
    selectChoice(preferred(available))
  }
  pattern.onchange=renderDirections;
  directionPicker.onchange=renderOrigins;
  origin.onchange=renderDestinations;
  destination.onchange=()=>selectChoice(choices.find(item=>item.id===destination.value));
  const initial=preferred(choices);
  pattern.value=initial?operatingPatternKey(initial):(patternGroups[0]?.[0]||'');
  renderDirections()
}
function openSetup(route){
  const blocked=koreanRouteUnavailableReason(route);if(blocked){toast('플레이 불가: '+blocked);return}
  selected=route;if(!selected||!Array.isArray(selected.stations)||selected.stations.length<2){toast('플레이 가능한 역이 부족한 노선입니다.');return}
  const settings=storage.settings();$('#game-map-mode').value=settings.mapMode;document.querySelector(`#setup-form [name="stationAdvance"][value="${settings.stationAdvance}"]`).checked=true;
  $('#setup-route').style.setProperty('--ticket-color',selected.lineColor);$('#setup-route').innerHTML=`<h3>${escapeHtml(selected.countryId==='kr'?krRouteLabel(selected):selected.line.ja)}</h3><p>${escapeHtml(selected.operator.en)} · ${escapeHtml(selected.line.en)}<br>${escapeHtml(selected.countryId==='kr'?krRouteLabel(selected):selected.line.ko)} · ${selected.stations.length} STATIONS</p>${selected.section?`<p class="setup-section">${escapeHtml(selected.section.ja)} · ${escapeHtml(selected.section.ko)}</p>`:''}<ol class="setup-stations">${selected.stations.map(station=>`<li><b>${escapeHtml(selected.countryId==='kr'?koreanStationDisplayName(station.ko,'kr',selected):station.ja)}</b><span>${escapeHtml(koreanStationDisplayName(station.romaji,selected.countryId,selected))} · ${escapeHtml(koreanStationDisplayName(station.ko,selected.countryId,selected))}</span></li>`).join('')}</ol><div class="route-endpoints"><span>${escapeHtml(selected.countryId==='kr'?journeyStationDisplayName(selected.stations[0]):selected.stations[0].ja)}<small> 출발</small></span><span>${escapeHtml(selected.countryId==='kr'?journeyStationDisplayName(selected.stations.at(-1)):selected.stations.at(-1).ja)}<small> 도착</small></span></div>`;
  if(isKoreanResearch(selected))$('#setup-route').insertAdjacentHTML('afterbegin',`<div class="research-notice" role="note"><p>${selected.integratedLine1===true?(selected.line1Service?.evidenceStatus==='operator-service-confirmed'?'한국철도공사에서 용산~동인천 경인선 급행의 운행을 확인했습니다. 세부 시간표·일부 정차역은 정식 승인 전 검증이 필요합니다.':'수도권 전철 1호선 운행 유형과 행선지로 명명했습니다. 개별 시간표·정차역의 공식 검증은 남아 있습니다.'):'이 노선은 실제 철도 선형을 기반으로 만든 연구용 경로입니다. 공식 운행계통과 시간표에 대한 최종 검증이 완료되지 않았습니다.'}</p><p><a href="${escapeHtml(selected.researchEvidence.sourceUrl)}" target="_blank" rel="noopener noreferrer">OSM 원본 relation ${escapeHtml(selected.sourceRelationId)}</a> · ${escapeHtml(selected.researchEvidence.attribution)}</p><p>미검증: ${escapeHtml(selected.researchEvidence.unverified.join(' · '))}</p></div>`);
  koreaFamilyChoices=null;
  const family=krLineFamily(route),familyPending=route.countryId==='kr'&&routes.filter(item=>krLineFamily(item)===family).length>1;
  const submit=$('#setup-form button[type="submit"]');
  if(submit){submit.disabled=familyPending;submit.textContent=familyPending?'운행계통 확인 중…':'운행 시작 →'}
  $('#journey-picker').hidden=familyPending;
  $('#journey-summary').textContent=familyPending?'1호선의 실제 운행계통과 분기 선형을 검증하고 있습니다.':'';
  if(!familyPending)configureJourneyPicker();
  if(countryId==='jp'&&routeGroup(route)==='limited-express'&&!actualOperatingChoices(route).length){if(submit){submit.disabled=true;submit.textContent='운행계통을 불러올 수 없음'}}
  go('game-setup');
  if(familyPending)void prepareKoreanFamilyChoices(route);
}
let koreaFamilyChoices=null;
async function prepareKoreanFamilyChoices(route){
 const family=krLineFamily(route);if(!family||route.countryId!=='kr')return;
 const members=routes.filter(r=>krLineFamily(r)===family);
 if(members.length<2)return;
 const prepared=[];
 for(let offset=0;offset<members.length;offset+=5){
   prepared.push(...await Promise.all(members.slice(offset,offset+5).map(async r=>{
   if(!r.lazy)return r;
   try{
     const detail=railDataRepository.resolveRoute(await hydrateRailLine(r)),i=builtin.findIndex(item=>item.id===r.id);
     if(i>=0)builtin[i]=detail;
     return detail;
   }catch(error){console.warn('Korean family section unavailable:',r.id,error);return null}
   })));
   if(selected?.id!==route.id||currentScreen!=='game-setup')return;
 }
 if(selected?.id!==route.id||currentScreen!=='game-setup')return;
 const familyServices=route.integratedLine1===true?[]:koreanFamilyServiceChoices(family),combined=[];
 if(familyServices.length){
   for(const choice of familyServices)if(operatingChoicePlayable(choice,route))combined.push(choice);
 }else for(const member of prepared.filter(Boolean)){
   for(const choice of actualOperatingChoices(member))combined.push({...choice,id:member.id+'::'+choice.id,sourceRouteId:member.id,sourceChoice:choice});
 }
 koreaFamilyChoices=combined;
 const submit=$('#setup-form button[type="submit"]');
 if(submit){submit.disabled=!combined.length;submit.textContent=combined.length?'운행 시작 →':'선택 가능한 운행계통 없음'}
 if(combined.length)configureJourneyPicker();
 else {$('#journey-picker').hidden=false;$('#journey-summary').textContent='현재 검증된 운행계통을 연결할 수 없습니다. 잠시 후 노선을 다시 선택해 주세요.'}

}
// Railway operating patterns can cross physical lines (e.g. Nozomi runs on
// Tokaido and Sanyo Shinkansen). The Japan catalog is lazy-loaded by physical
// line, so all referenced segments must be hydrated BEFORE filtering candidates
// with operatingChoicePlayable. Otherwise correct patterns silently disappear.
async function hydrateJapaneseOperatingConnections(route){
  if(route?.countryId!=='jp')return;
  const catalog=nationwideCatalogLine(route);
  const codes=new Set((catalog?.data?.patterns||[]).flatMap(pattern=>(pattern.segments||[]).map(part=>String(part.lineCode||''))).filter(Boolean));
  const pending=new Map();
  const queue=physical=>{
    if(physical?.lazy&&physical.id!==route.id)pending.set(physical.id,physical);
  };
  for(const code of codes)queue(routeForCatalogLine(code));
  // The curated Tokyo Metro/Toei through-journey catalog is separate from
  // the nationwide TrainLCD catalog. Hydrate its participating lines too.
  const journeySpecs=new Set(servicePatternsForRoute(route.id).map(p=>p.throughServiceId).filter(Boolean));
  for(const spec of globalThis.TRT_RAIL_SYSTEM?.throughServices||[]){
    const ids=spec.participatingLineIds||throughRouteIds(spec);
    if(!journeySpecs.has(spec.id)&&!ids.includes(route.id))continue;
    const pieces=[...(spec.routeSegments||[]),...Object.values(spec.directionVariants||{}).flat()];
    for(const part of pieces){
      const physical=builtin.find(item=>item.id===part.routeId);
      queue(physical);
    }
  }
  if(!pending.size)return;
  const results=await Promise.allSettled([...pending.values()].map(async physical=>{
    const hydrated=railDataRepository.resolveRoute(await hydrateRailLine(physical));
    const index=builtin.findIndex(item=>item.id===physical.id);
    if(index>=0)builtin[index]=hydrated;
    return physical.id;
  }));
  for(let index=0;index<results.length;index++)
    if(results[index].status==='rejected')
      console.warn('Japanese operating-service segment unavailable:',
        [...pending.keys()][index],results[index].reason);
}
async function chooseRoute(id){const revision=++routeSelectionRevision,selectionCountry=countryId,selectionMode=koreaPlayMode,selectionCurrent=()=>revision===routeSelectionRevision&&selectionCountry===countryId&&selectionMode===koreaPlayMode;let route=routes.find(r=>r.id===id);if(route&&koreanRouteUnavailableReason(route)){toast('플레이 불가: '+koreanRouteUnavailableReason(route));return false}if(!route&&dataLoading){pendingRouteId=id;toast('철도 데이터를 불러오는 중입니다. 잠시만 기다려 주세요.');return false}if(!route){console.warn('Line not found:',id);toast('선택한 노선을 찾을 수 없습니다. 데이터를 다시 불러와 주세요.');return false}selected=null;renderSelected();if(route.lazy){toast(`${route.line.ko} 노선 상세 데이터를 불러오는 중입니다.`);try{const payload=await hydrateRailLine(route);if(!selectionCurrent())return false;const hydrated=railDataRepository.resolveRoute(payload),index=builtin.findIndex(item=>item.id===id);if(index>=0)builtin[index]=hydrated;if(countryId==='jp'&&id==='line-11328'){category='limited-express';operatorFilter='all'}refreshRoutes();route=routes.find(item=>item.id===id);if(koreanRouteUnavailableReason(route)){toast('플레이 불가: '+koreanRouteUnavailableReason(route));return false}}catch(error){if(!selectionCurrent())return false;console.error('Nationwide line load failed:',error);toast('이 노선의 상세 데이터를 불러오지 못했습니다.');return false}}if(route?.countryId==='jp'){
  await hydrateJapaneseOperatingConnections(route);
  refreshRoutes();route=routes.find(item=>item.id===id)||route;
}
if(!selectionCurrent())return false;selected=route;if(currentScreen!=='rail-map')go('rail-map');renderSelected();renderRoutes();return true}
function renderHomeNetwork(){const canvas=$('#home-network-canvas'),network=freeDriveNetworkRoutes();if(!canvas||!network.length)return;const tokyoBounds={minLat:35.50,maxLat:35.86,minLon:139.45,maxLon:139.96};drawNetworkCanvas(canvas,network,{bounds:tokyoBounds,alpha:.24,transferNodes:freeDrive?.graph||null})}
function freeDriveRouteTabs(state){
  const linked=[...(state.node?.routeIds||[])].filter(Boolean),ids=[...linked,state.routeId];
  return [...new Set(ids)].map(id=>({id,route:(state.edges||[]).find(edge=>edge.routeId===id)?.route||freeDrive?.routes?.find(route=>route.id===id)||state.route}))
}
function renderGameFreeDriveOptions(state){
  const target=$('#game-free-drive-options'),tabs=$('#game-free-drive-tabs');if(!target||!tabs||!state)return;
  const routeTabs=freeDriveRouteTabs(state);if(!routeTabs.length)return;
  freeDriveTabIndex=Math.max(0,routeTabs.findIndex(item=>item.id===state.routeId));
  const active=routeTabs[freeDriveTabIndex],activeId=active.id;
  tabs.hidden=routeTabs.length<2;tabs.classList.toggle('has-transfer',routeTabs.length>1);
  tabs.innerHTML=routeTabs.map((item,index)=>`<button type="button" class="${index===freeDriveTabIndex?'active':''}" data-free-drive-tab="${escapeHtml(item.id)}" style="--route-color:${item.route?.lineColor||'#777'}"><small>${item.id===state.routeId?'CURRENT':'TRANSFER'}</small><b>${escapeHtml(koreanRouteDisplayText(item.route?.line?.ko||item.route?.line?.ja||item.id,item.route))}</b><span>${escapeHtml(item.route?.line?.ja||'')}</span></button>`).join('');
  const edges=(state.edges||[]).filter(edge=>edge.routeId===activeId);
  const typingEdge=edges.find(edge=>edge.direction>0)||edges.find(edge=>edge.direction<0)||edges[0];
  if(!game?.freeDriveAwaitingStart&&typingEdge){const typingStation=typingEdge.station||freeDrive?.stationForRoute(typingEdge.to,typingEdge.routeId);if(typingStation)game?.setFreeDriveTypingTarget?.(typingEdge,typingStation)}
  target.hidden=false;target.dataset.transferOpen=String(activeId!==state.routeId);
  target.innerHTML=edges.length?`<div class="free-drive-station-buttons" style="--route-color:${active.route?.lineColor||'#777'}">${edges.map(edge=>{const station=edge.station||freeDrive?.stationForRoute(edge.to,edge.routeId);return `<button type="button" data-free-to="${escapeHtml(edge.to)}" data-free-route="${escapeHtml(edge.routeId)}"><b>${escapeHtml(koreanStationDisplayName(station?.ko||station?.ja||'다음 역',active.route?.countryId,active.route))}</b><span>${escapeHtml(active.route?.countryId==='kr'?koreanStationDisplayName(station?.ko,'kr',active.route):station?.ja||'')}</span><i>→</i></button>`}).join('')}</div>`:'<p class="free-drive-empty">이 노선에서 이동 가능한 인접역이 없습니다.</p>';
}
async function startFreeDrive(route){if(isKoreanResearch(route))return toast('연구용 경로는 확인된 정차 순서로만 주행할 수 있습니다.');
  if(!route)return toast('자유주행을 시작할 노선을 선택해 주세요.');
  if(koreanRouteUnavailableReason(route))return toast('자유주행 불가: '+koreanRouteUnavailableReason(route));
  let target=route;
  if(target.lazy){const ok=await chooseRoute(target.id);if(!ok)return;target=selected}
  if(koreanRouteUnavailableReason(target))return toast('자유주행 불가: '+koreanRouteUnavailableReason(target));
  if(!target?.stations?.length)return toast('자유주행에 사용할 역 데이터가 없는 노선입니다.');
  if(target.countryId==='kr'){
    const counterpartIds=KR_APP_TRANSFER_PAIRS.flatMap(t=>t.routeIds.includes(target.id)?t.routeIds:[]).filter(id=>id!==target.id);
    for(const id of new Set(counterpartIds)){
      const other=builtin.find(line=>line.id===id);
      if(!other?.lazy)continue;
      try{const hydrated=railDataRepository.resolveRoute(await hydrateRailLine(other)),pos=builtin.findIndex(line=>line.id===id);if(pos>=0)builtin[pos]=hydrated;}catch(error){console.warn('Korean transfer counterpart unavailable:',id,error)}
    }
    refreshRoutes();
  }
  freeDrive?.setNetwork(freeDriveNetworkRoutes());
  const chosenStart=Number($('#free-drive-start-station')?.value);
  const startIndex=Number.isInteger(chosenStart)&&chosenStart>=0&&chosenStart<target.stations.length?chosenStart:0;
  if(!freeDrive?.start(target,startIndex))return toast('자유주행을 시작하지 못했습니다.');
  const state=freeDrive.snapshot();if(!state||!game.startFreeDrive(state))return toast('자유주행 화면을 준비하지 못했습니다.');
  freeDriveTabIndex=0;renderGameFreeDriveOptions(state);go('game');
}
function renderHome(){syncHomeFeatured();const recordRouteId=record=>canonicalRouteId(record.lineId||record.routeId);const recent=storage.recent().filter(record=>routes.some(route=>route.id===recordRouteId(record)));document.querySelectorAll('#feature-viewport [data-feature-route]').forEach((button,index)=>{const route=routes.find(item=>item.id===button.dataset.featureRoute),card=button.closest('article'),slot=card?.querySelector('.feature-number');if(!route||!card)return;if(slot){slot.innerHTML=lineBadgeMarkup(route);slot.hidden=!slot.innerHTML}const operator=card.querySelector('[data-feature-operator]'),lineKo=card.querySelector('[data-feature-line-ko]'),lineSecondary=card.querySelector('[data-feature-line-secondary]'),stations=card.querySelector('[data-feature-stations]');if(operator)operator.innerHTML=`${lineSurfaceOperatorLogo(route,'feature-operator-logo')}<span>${escapeHtml(route.operator.ko)} · ${route.loop?'순환 운행':'도심 운행'}</span>`;if(lineKo)lineKo.textContent=route.line.ko;if(lineSecondary)lineSecondary.textContent=countryId==='kr'?route.line.en:`${route.line.ja} · ${route.line.en}`;if(stations)stations.textContent=`${route.stationCount||route.stations.length}개 역`;const dot=$$('[data-slide-to]')[index];if(dot)dot.setAttribute('aria-label',route.line.ko)});$('#recent-list').innerHTML=recent.length?recent.slice(0,3).map(record=>{const routeId=recordRouteId(record),route=routes.find(item=>item.id===routeId),name=route?.line.ko||record.routeName||routeId;return`<button class="recent-chip" data-feature-route="${escapeHtml(routeId)}" style="--route-color:${record.color}"><span><b>${escapeHtml(name)}</b><small>${formatTime(record.elapsed)} · ${record.accuracy.toFixed(1)}%</small></span></button>`}).join(''):'<p class="muted">아직 운행 기록이 없습니다.</p>'}
function renderCustomLibrary(){const list=storage.routes().filter(route=>(route.countryId||'jp')===countryId),target=$('#custom-route-library');target.innerHTML=list.length?list.map(r=>`<article class="library-card" style="--route-color:${r.lineColor}" data-library-route="${r.id}"><span class="library-code">${escapeHtml(r.code||'CT')} · ${r.stations.length} STATIONS</span><h3>${escapeHtml(r.line.ko)}</h3><p>${escapeHtml(r.line.ja)} · ${escapeHtml(r.line.en)}</p><footer><button class="btn primary" data-library-play>PLAY</button><button class="btn ghost" data-library-free-drive>FREE DRIVE</button><button class="btn ghost" data-library-edit>EDIT</button><button class="btn text" data-library-delete aria-label="${escapeHtml(r.line.ko)} 삭제">×</button></footer></article>`).join(''):`<div class="library-empty"><b>아직 만든 노선이 없습니다.</b><p>첫 노선을 만들고 원하는 역 순서로 달려보세요.</p><button class="btn primary" data-action="custom-new">＋ CREATE NEW ROUTE</button></div>`}
function showResult(result){
 let isRecord=false;
 try{isRecord=storage.saveResult(result)}catch(error){console.error('Unable to save result',error)}
 // Logo elements were intentionally removed from the result screen.
 // Never require optional decorations for the completion transition.
 const setText=(id,value)=>{const el=$(id);if(el)el.textContent=String(value??'')};
 setText('#result-route',`${isKoreanResearch(result.route)?(result.route?.integratedLine1?'[1호선 · 계통 검증 중] ':'[연구용 기록] '):''}${koreanRouteDisplayText(result.route?.line?.ja,result.route)} · ${koreanRouteDisplayText(result.route?.line?.ko,result.route)} · ${result.route?.operator?.ko||''}`);
 setText('#result-time',formatTime(result.elapsed));
 setText('#result-accuracy',`${(Number(result.accuracy)||0).toFixed(1)}%`);
 setText('#result-cpm',`${result.cpm||0} 타/min`);
 setText('#result-errors',result.errors);
 setText('#result-combo',result.maxCombo);
 setText('#result-wpm',result.wpm);
 const notice=$('#record-notice');if(notice)notice.hidden=!isRecord;
 go('result');
 // The distance listener is independent of the result transition; map loads on button click only.
 try{document.dispatchEvent(new CustomEvent('trt:journey-finished',{detail:result}))}catch(error){console.warn('Journey summary unavailable',error)}
}
const game=new Game({onFinish:showResult,onQuit:()=>go('select'),onFreeDriveMove:(to,routeId)=>freeDrive?.moveTo(to,routeId)});
const editor=new RouteEditor({onRoutesChanged:()=>{refreshRoutes();renderCustomLibrary()},onPlay:openSetup,onSaved:()=>go('custom-list')});
freeDrive=new FreeDrive({onExit:()=>go('rail-map'),onChange:state=>{if(game?.freeDriveMode){freeDriveTabIndex=0;game.renderFreeDriveState(state);renderGameFreeDriveOptions(state)}}});
$('#free-drive-custom')?.addEventListener('click',()=>{const route=editor.route;if(!route?.stations||route.stations.length<2)return toast('자유주행에는 역이 2개 이상 필요합니다.');startFreeDrive(route)});
let currentScreen=document.body.dataset.currentScreen||'home';
let koreaEditorLoading=false;
async function loadKoreanEditorNetwork(){
 if(koreaEditorLoading||koreaPlayMode==='research')return;koreaEditorLoading=true;
 const pending=builtin.filter(r=>r.countryId==='kr'&&r.lazy&&r.playable!==false&&r.visibility!=='internal'&&r.mode!=='river_bus');
 try{
   for(let offset=0;offset<pending.length;offset+=6){
     const batch=pending.slice(offset,offset+6);
     await Promise.all(batch.map(async route=>{
       try{const detail=railDataRepository.resolveRoute(await hydrateRailLine(route));const index=builtin.findIndex(r=>r.id===route.id);if(index>=0)builtin[index]=detail}
       catch(error){console.warn('Korean editor route load failed:',route.id,error)}
     }));
   }
   if(countryId==='kr'){refreshRoutes();const korean=builtin.filter(r=>r.countryId==='kr'&&Array.isArray(r.stations)&&r.stations.length>=2&&r.playable!==false&&r.visibility!=='internal');editor.setRailNetwork(korean);editor.setStationMaster(korean.flatMap(r=>r.stations))}
 }finally{koreaEditorLoading=false}
}
window.addEventListener('trt:screenchange',e=>{const name=e.detail.name;if(currentScreen==='game'&&name!=='game'){game?.stop(false);const controls=$('#game-free-drive-options'),tabs=$('#game-free-drive-tabs');if(controls)controls.hidden=true;if(tabs)tabs.hidden=true}currentScreen=name;if(name==='rail-map')renderRoutes();if(name==='records')renderStats();if(name==='home'){renderHome();renderHomeNetwork()}if(name==='free-drive')freeDrive?.render?.();if(name==='custom-list')renderCustomLibrary();if(name==='custom-editor'){editor.activate();if(countryId==='kr')loadKoreanEditorNetwork()}});
document.querySelector('.country-switch').addEventListener('click',async event=>{const button=event.target.closest('[data-country]');if(!button||!isCountryEnabled(button.dataset.country)||button.dataset.country===countryId)return;countryId=button.dataset.country;localStorage.setItem('trt-country',countryId);$('#route-search').value='';transportGroup='all';category='all';regionFilter='all';operatorFilter='all';routeSelectionRevision++;selected=null;selectedGroup=null;applyCountryUi();refreshCountryCopy();await reloadRailData();renderTransportFilters();renderOperatorFilters();renderRoutes();refreshFeatureCounts();renderSelected();toast(countryId==='kr'?'대한민국 교통 데이터로 전환했습니다.':'일본 철도 데이터로 전환했습니다.')});
$('#transport-mode-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-transport-group]');if(!button)return;transportGroup=button.dataset.transportGroup;category='all';regionFilter='all';operatorFilter='all';routeSelectionRevision++;selected=null;selectedGroup=null;routeRenderLimit=96;renderTransportFilters();renderOperatorFilters();renderRoutes();renderSelected()});
$('#region-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-region]');if(!button)return;regionFilter=button.dataset.region;category='all';operatorFilter='all';routeSelectionRevision++;selected=null;selectedGroup=null;routeRenderLimit=96;renderTransportFilters();renderOperatorFilters();renderRoutes();renderSelected()});
$('#category-tabs').addEventListener('click',e=>{const button=e.target.closest('[data-category]');if(!button)return;category=button.dataset.category;operatorFilter='all';routeSelectionRevision++;selected=null;selectedGroup=null;routeRenderLimit=96;renderTransportFilters();renderOperatorFilters();renderRoutes();renderSelected();if(countryId==='jp'&&category==='limited-express')void ensureFamousExpressRoutes()});
$('#operator-filters').addEventListener('click',e=>{const button=e.target.closest('[data-operator]');if(!button)return;operatorFilter=button.dataset.operator;routeSelectionRevision++;selected=null;selectedGroup=null;routeRenderLimit=96;renderOperatorFilters();renderRoutes();renderSelected()});
$('#route-search').addEventListener('input',()=>{routeRenderLimit=96;renderRoutes()});
$('#route-grid').addEventListener('click',e=>{const krFamily=e.target.closest('[data-kr-family]');if(krFamily){const r=filteredRoutes().find(r=>krLineFamily(r)===krFamily.dataset.krFamily);if(r){selectedGroup=null;void chooseRoute(r.id)}return}if(e.target.closest('[data-route-more]')){routeRenderLimit+=96;renderRoutes();return}const group=e.target.closest('[data-route-group]');if(group){routeSelectionRevision++;selected=null;selectedGroup=group.dataset.routeGroup;renderSelected();renderRoutes();return}const random=e.target.closest('[data-random-route]');if(random){const playable=filteredRoutes().filter(r=>!koreanRouteUnavailableReason(r));if(playable.length)chooseRoute(playable[Math.floor(Math.random()*playable.length)].id);return}const card=e.target.closest('[data-route]');if(card){selectedGroup=null;chooseRoute(card.dataset.route)}});
$('#selected-line-preview').addEventListener('click',e=>{const branch=e.target.closest('[data-route]');if(branch){selectedGroup=null;chooseRoute(branch.dataset.route);return}if(e.target.closest('[data-selected-play]')&&selected){openSetup(selected);return}if(e.target.closest('[data-selected-free-drive]')&&selected){startFreeDrive(selected);return}});
$('#clear-route-selection').addEventListener('click',()=>{routeSelectionRevision++;selected=null;selectedGroup=null;renderSelected();renderRoutes()});
$('#game-free-drive-tabs')?.addEventListener('click',event=>{
  const button=event.target.closest('[data-free-drive-tab]');if(!button||!game?.freeDriveMode)return;
  const state=freeDrive?.snapshot();if(!state)return;
  const tabs=freeDriveRouteTabs(state),index=tabs.findIndex(item=>item.id===button.dataset.freeDriveTab);if(index<0)return;
  if(!freeDrive?.selectRoute(tabs[index].id))toast('환승 노선의 역 좌표를 확인할 수 없습니다.');
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||currentScreen!=='game'||!game?.freeDriveMode)return;
  const state=freeDrive?.snapshot();if(!state)return;
  const tabs=freeDriveRouteTabs(state);if(tabs.length<2)return;
  event.preventDefault();
  const active=tabs[(freeDriveTabIndex+(event.shiftKey?-1:1)+tabs.length)%tabs.length];
  if(freeDrive?.selectRoute(active.id))toast(`TAB · ${active.route?.line?.ko||active.route?.line?.ja||active.id}`);
  else toast('환승 노선의 역 좌표를 확인할 수 없습니다.');
});
document.addEventListener('click',e=>{
  const freeMove=e.target.closest('[data-free-to][data-free-route]');
  if(freeMove&&game?.freeDriveMode){
    e.preventDefault();
    const moved=freeDrive?.moveTo(freeMove.dataset.freeTo,freeMove.dataset.freeRoute);
    if(!moved)toast('다음 역으로 이동하지 못했습니다.');
    return
  }
  const create=e.target.closest('[data-action="custom-new"]');if(create){editor.createNew();go('custom-editor');return}const featured=e.target.closest('[data-feature-route]');if(featured){chooseRoute(featured.dataset.featureRoute);return}const card=e.target.closest('[data-library-route]');if(!card)return;const route=storage.routes().find(r=>r.id===card.dataset.libraryRoute);if(!route)return;if(e.target.closest('[data-library-play]'))openSetup(route);else if(e.target.closest('[data-library-free-drive]'))startFreeDrive(route);else if(e.target.closest('[data-library-edit]')){editor.loadRoute(route);go('custom-editor')}else if(e.target.closest('[data-library-delete]')&&confirm('이 노선을 삭제할까요?')){storage.deleteRoute(route.id);refreshRoutes();renderCustomLibrary();toast('노선을 삭제했습니다.')}});
$('#setup-form').addEventListener('submit',e=>{e.preventDefault();if(e.target.querySelector('button[type="submit"]')?.disabled)return;const data=new FormData(e.target),settings=storage.settings(),stationLabel=['ja','ja-romaji'].includes(settings.stationLabel)?settings.stationLabel:'ja',choiceId=String(data.get('journeyDestination')||''),choice=(koreaFamilyChoices||actualOperatingChoices(selected)).find(item=>item.id===choiceId);if(!choice)return toast('실제 운행계통을 선택해 주세요.');if(selected?.countryId==='jp'){const state=operatingChoiceStatus(choice.sourceChoice||choice,choice.sourceRouteId?(builtin.find(r=>r.id===choice.sourceRouteId)||routes.find(r=>r.id===choice.sourceRouteId)):selected);if(!state.playable)return toast('운행 불가: '+state.reason)}let resolved=null,lastService=null;try{resolved=resolveOperatingChoice(choice.sourceChoice||choice,choice.sourceRouteId?(builtin.find(r=>r.id===choice.sourceRouteId)||routes.find(r=>r.id===choice.sourceRouteId)):selected);lastService=resolved.service||null}catch(error){console.error('Service journey resolution failed:',error);return toast(`운행계통 오류: ${error.message}`)}lastRunRoute=resolved.route;if(!lastRunRoute)return toast('운행계통 데이터를 준비하지 못했습니다.');lastOptions={mode:data.get('mode'),inputMode:data.get('inputMode')||'shadowing',difficulty:'normal',researchPreview:resolved.researchPreview===true,service:resolved.service?.id||choice.legacyServiceId||'local',direction:resolved.direction||choice.direction||'forward',display:'ja',input:'ko',stationAdvance:data.get('stationAdvance')||settings.stationAdvance,mapMode:$('#game-map-mode').value,stationLabel,mapLabels:settings.mapLabels,motion:settings.motion,reducedMotion:settings.reducedMotion,sound:settings.sound,serviceJourney:resolved.journey||null,serviceJourneyId:resolved.journeyId||choice.journeyId||null,servicePattern:resolved.pattern||null,trainType:resolved.trainType||choice.trainType||null,destinationStationId:resolved.destinationStationId||choice.destinationId,throughServiceId:choice.throughServiceId||resolved.pattern?.throughServiceId||lastRunRoute.throughService?.id||null,trainTypeContexts:resolved.trainTypeContexts||[]};$('#map-view-toggle').textContent=lastOptions.mapMode==='geographic'?'SCHEMATIC':'GEOGRAPHIC';try{if(lastRunRoute.dataKind==='trainService'&&!(lastRunRoute.geometryReady===true&&Array.isArray(lastRunRoute.geometry)&&lastRunRoute.geometry.length>2))return toast('특급열차 실제 선형이 준비되지 않았습니다.');if(game.start(lastRunRoute,lastOptions)){go('game');game.focusInput()}else toast('특급열차 운행 시작에 실패했습니다. 노선 정보를 다시 확인해 주세요.')}catch(error){console.error('Game launch failed:',error);toast('운행 시작 오류: '+(error?.message||'알 수 없는 오류'))}});
$('#retry-game').addEventListener('click',()=>{if(game.start(lastRunRoute||selected,lastOptions)){go('game');game.focusInput()}});
$('#map-view-toggle').addEventListener('click',()=>game.toggleMapMode());
$('#settings-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),settings={...storage.settings(),theme:f.get('theme'),stationAdvance:f.get('stationAdvance'),display:'ja',input:'ko',mapMode:f.get('mapMode'),stationLabel:f.get('stationLabel'),mapLabels:f.get('mapLabels'),sound:f.get('sound')==='on',motion:f.get('motion')==='on',reducedMotion:f.get('reducedMotion')==='on'};storage.saveSettings(settings);applyTheme(settings.theme);document.body.classList.toggle('reduce-motion',settings.reducedMotion);toast('설정을 저장했습니다.')});
const settings=storage.settings(),sf=$('#settings-form').elements;sf.theme.value=settings.theme;sf.stationAdvance.value=settings.stationAdvance;sf.mapMode.value=settings.mapMode;sf.stationLabel.value=['ja','ja-romaji'].includes(settings.stationLabel)?settings.stationLabel:'ja';sf.mapLabels.value=settings.mapLabels;sf.sound.checked=settings.sound;sf.motion.checked=settings.motion;sf.reducedMotion.checked=settings.reducedMotion;applyTheme(settings.theme);document.body.classList.toggle('reduce-motion',settings.reducedMotion);matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(storage.settings().theme==='system')applyTheme('system')});
$('#game-theme-toggle').addEventListener('click',()=>{const current=document.documentElement.dataset.theme,next=current==='dark'?'light':'dark',updated={...storage.settings(),theme:next};storage.saveSettings(updated);sf.theme.value=next;applyTheme(next);game.refreshMap()});
const updateClock=()=>$('#clock').textContent=new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());updateClock();setInterval(updateClock,1000);
function setFeature(next){featureIndex=(next+3)%3;$$('[data-feature-index]').forEach((card,i)=>card.classList.toggle('active',i===featureIndex));$$('[data-slide-to]').forEach((dot,i)=>dot.classList.toggle('active',i===featureIndex));$('#feature-counter').textContent=`0${featureIndex+1} / 03`}
function restartFeatureTimer(){clearInterval(featureTimer);if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduce-motion'))return;featureTimer=setInterval(()=>setFeature(featureIndex+1),7000)}
document.querySelector('.feature-controls').addEventListener('click',e=>{const direction=e.target.closest('[data-slide]')?.dataset.slide,to=e.target.closest('[data-slide-to]')?.dataset.slideTo;if(direction)setFeature(featureIndex+(direction==='next'?1:-1));if(to!==undefined)setFeature(+to);restartFeatureTimer()});
$('#feature-viewport').addEventListener('mouseenter',()=>clearInterval(featureTimer));$('#feature-viewport').addEventListener('mouseleave',restartFeatureTimer);restartFeatureTimer();
$('#library-import').addEventListener('change',async e=>{await editor.import(e.target.files[0]);e.target.value='';renderCustomLibrary();go('custom-editor')});
initAuth(storage);applyCountryUi();refreshCountryCopy();renderHome();renderCustomLibrary();refreshRoutes();freeDrive?.setNetwork(freeDriveNetworkRoutes());renderHomeNetwork();if(currentScreen==='records')renderStats();if(['game','game-setup','result'].includes(currentScreen)){window.TRTNavigation?.showScreen('rail-map',{history:'replace'});toast('노선을 먼저 선택해 주세요.')}
async function reloadRailData(){const summary=$('#data-summary');dataLoading=true;summary.classList.remove('error','has-count-chips');summary.textContent=`${countryId==='kr'?'대한민국 대중교통':'일본 전국 철도'} 카탈로그를 불러오는 중...`;try{let edits={};try{const response=await fetch('./data/editor-overrides.json?ts='+Date.now(),{cache:'no-store',signal:globalThis.AbortSignal?.timeout?.(4000)});if(response.ok)edits=await response.json()}catch(error){console.warn('Name editor overrides unavailable:',error)}globalThis.TRT_EDITOR_OVERRIDES=edits;
    // Apply editable Korean service names to source catalogs before routes are normalized.
    const serviceNames=edits.services||{},legacy=globalThis.TRT_SERVICE_CATALOG||{},patterns=globalThis.TRT_TOKYO_SERVICE_PATTERNS||{};
    for(const [lineId,items] of Object.entries(legacy))for(const service of items||[]){
      const name=serviceNames['legacy:'+lineId+':'+service.id];if(typeof name==='string'&&name.trim())service.nameKo=name.trim();
    }
    for(const kind of ['trainTypes','servicePatterns','branches'])for(const item of patterns[kind]||[]){
      const name=serviceNames[kind+':'+item.id];if(typeof name==='string'&&name.trim())item.names={...(item.names||{}),ko:name.trim()};
    }
    const loaded=await loadTransportData(countryId,koreaPlayMode);railDataRepository.configure({operators:loaded.operators,lines:loaded.lines,stations:loaded.stations,assets:loaded.assets});builtin=loaded.lines.map(route=>railDataRepository.resolveRoute(route));if(countryId==='jp')builtin.push(...buildFamousLimitedExpressRoutes(builtin));stations=[...railDataRepository.stations.values()].map(station=>({id:station.id,stationMasterId:station.id,sourceStationId:station.id,ja:station.names.ja,kana:station.names.kana,ko:station.names.ko,romaji:station.names.en,latitude:station.coordinates.lat,longitude:station.coordinates.lng}));stations=stations.filter(station=>FEATURE_FLAGS.visibleJapanRegion!=='tokyo-area'||!globalThis.TRT_TOKYO_AREA||countryId==='kr'||globalThis.TRT_TOKYO_AREA.stationIds.includes(station.id));editor.setStationMaster(stations);refreshRoutes();renderHome();if(countryId==='kr'){
  summary.textContent=`${koreaPlayMode==='research'?'연구용 미리보기 · 공식 운행 미승인 · 기록 별도 저장':'기존 운영 노선 및 개별 정식 승인 서비스'} · 대한민국 도시·광역철도 · ${builtin.length}개 노선·구간 · 역 순서 데이터 구축 중 · 상세 데이터는 노선 선택 시 로드 · 검증된 실제 선형 노선만 주행 가능`;
}else{
  const countChips=[['전체',routes.length],['JR',routes.filter(r=>r.category==='jr').length],['지하철',routes.filter(r=>r.category==='subway').length],['사철',routes.filter(r=>r.category==='private').length],['제3섹터',routes.filter(r=>r.category==='third-sector').length],['트램',routes.filter(r=>r.category==='tram').length],['신칸센',routes.filter(r=>r.category==='shinkansen').length]];
  summary.innerHTML=`<span class="data-summary-title">일본 전국 철도</span>${countChips.map(([label,count])=>`<span class="data-summary-chip"><span class="data-summary-chip-label">${label}</span><strong class="data-summary-chip-value">${count}</strong></span>`).join('')}`;
  summary.classList.add('has-count-chips');
}
if(loaded.fallbackUsed){
  const notice=document.createElement('span');notice.className='data-summary-notice';notice.textContent='⚠ 임시 복구 데이터 사용';summary.prepend(notice);
}dataLoading=false;if(countryId==='jp'&&category==='limited-express')void ensureFamousExpressRoutes();if(pendingRouteId){const id=pendingRouteId;pendingRouteId=null;chooseRoute(id)}return loaded}catch(error){console.error('App transport data initialization failed:',error);builtin=[];editor.setStationMaster([]);refreshRoutes();renderHome();dataLoading=false;summary.classList.add('error');summary.textContent='교통 데이터를 불러오지 못했습니다: '+(error?.message||'알 수 없는 오류')+' ';const retryButton=document.createElement('button');retryButton.dataset.retryData='';retryButton.textContent='다시 시도';summary.append(retryButton);return null}}
document.addEventListener('click',e=>{if(e.target.closest('[data-retry-data]'))reloadRailData()});
function runSanityChecks(){console.assert(routes.length>0,'Transport data must contain routes');if(countryId==='jp'){console.assert(routes.some(line=>line.id==='line-11302'),'Yamanote line is required');console.assert(routes.some(line=>line.id==='line-28001'),'Ginza line is required')}else console.assert(routes.length>0,'Korean catalog must contain routes');console.assert(routes.every(line=>line.lazy||(Array.isArray(line.stations)&&line.stations.length>=2)),'Every visible route must be playable or lazy-loadable')}
const modeTabs=document.createElement('div');modeTabs.id='korea-play-modes';modeTabs.className='filter-tabs';modeTabs.setAttribute('role','group');modeTabs.setAttribute('aria-label','한국 플레이 모드');modeTabs.innerHTML='<button type="button" data-korea-mode="released">정식 운행</button><button type="button" data-korea-mode="research">연구용 미리보기</button>';$('#transport-mode-tabs').before(modeTabs);modeTabs.addEventListener('click',async e=>{const b=e.target.closest('[data-korea-mode]');if(!b||dataLoading||b.dataset.koreaMode===koreaPlayMode)return;game.stop(false);koreaPlayMode=b.dataset.koreaMode;routeSelectionRevision++;selected=null;selectedGroup=null;transportGroup='all';category='all';operatorFilter='all';routeRenderLimit=96;$('#route-search').value='';applyCountryUi();await reloadRailData();renderSelected()});
await reloadRailData();refreshFeatureCounts();if(['localhost','127.0.0.1'].includes(location.hostname))runSanityChecks();
