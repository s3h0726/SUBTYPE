import{$,$$,escapeHtml,formatTime,normalize,toast}from'./utils.js';
import{loadTransportData,normalizeLine,hydrateRailLine}from'./data-loader.js';
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
import{buildThroughServiceRoute,resolveServiceJourney,resolveServiceSelection,serviceJourneysForRoute,servicePatternsForRoute,trainTypeFor}from'./service-route-resolver.js';

const savedCountryId=localStorage.getItem('trt-country')||'jp';
let builtin=[],routes=[],stations=[],selected=null,selectedGroup=null,lastOptions=null,lastRunRoute=null,freeDrive=null,freeDriveTabIndex=0,transportGroup='all',category='all',regionFilter='all',operatorFilter='all',featureIndex=0,featureTimer=null,dataLoading=true,pendingRouteId=null,routeRenderLimit=96,countryId=isCountryEnabled(savedCountryId)?savedCountryId:'jp';
const KR_REGIONS=[['all','전국'],['seoul','서울'],['busan','부산'],['daegu','대구'],['incheon','인천'],['gwangju','광주'],['daejeon','대전'],['ulsan','울산'],['sejong','세종'],['gyeonggi','경기'],['gangwon','강원'],['chungbuk','충북'],['chungnam','충남'],['jeonbuk','전북'],['jeonnam','전남'],['gyeongbuk','경북'],['gyeongnam','경남'],['jeju','제주']];
const KR_GROUPS=[['all','전체'],['rail','철도'],['bus','버스'],['water','수상교통'],['other','기타 교통'],['custom','커스텀']];
const KR_CATEGORIES={rail:[['all','전체 철도'],['subway','지하철·도시철도'],['commuter_rail','광역철도'],['rail','일반철도'],['high_speed_rail','고속철도'],['light_rail','경전철'],['monorail','모노레일'],['tram','노면전차'],['airport_rail','공항철도'],['other_rail','기타 철도']],water:[['all','전체 수상교통'],['river_bus','한강버스'],['ferry','여객선']],other:[['all','전체 기타 교통']]};
const JP_CATEGORIES=[['all','전체'],['jr','JR'],['subway','지하철'],['private','사철'],['third-sector','제3섹터'],['tram','노면전차'],['other','기타'],['shinkansen','신칸센'],['limited-express','특급'],['custom','커스텀']];
const COUNTRY_UI={jp:{mark:'JAPAN RAIL',status:'日本全国 · ALL JAPAN',subtitle:'일본 전국 철도 타이핑',title:'일본 철도를<br><span>타이핑하다.</span>',intro:'일본 전국의 실제 역 순서와 선형을 따라 달리는 철도 타이핑 게임.<br>현재역에서 다음역으로, 한국어 역명을 정확히 입력하세요.',network:'JAPAN RAILWAY NETWORK / 日本全国'},kr:{mark:'KOREA TRANSIT',status:'대한민국 · KOREA',subtitle:'대한민국 대중교통 타이핑',title:'대한민국 교통을<br><span>타이핑하다.</span>',intro:'철도·지하철·버스·수상교통의 실제 정차 순서를 따라가는 타이핑 게임.<br>한국어 역·정류장·선착장 이름을 정확히 입력하세요.',network:'KOREA PUBLIC TRANSPORT / 대한민국'}};
const renderTabs=(target,items,dataKey,current)=>{target.innerHTML=items.map(([id,label])=>`<button class="${id===current?'active':''}" data-${dataKey}="${id}">${label}</button>`).join('')};
function busCategories(){const scoped=routes.filter(route=>routeTransportGroup(route)==='bus'&&(regionFilter==='all'||route.regionId===regionFilter)),values=new Map([['all','전체']]);for(const route of scoped)values.set(route.normalizedCategory||route.routeType||route.category,route.regionalCategory||route.routeType||route.category);return[...values]}
function renderTransportFilters(){const groupTabs=$('#transport-mode-tabs'),regionTabs=$('#region-tabs'),categoryTabs=$('#category-tabs');if(countryId==='jp'){groupTabs.hidden=true;regionTabs.hidden=true;categoryTabs.hidden=false;renderTabs(categoryTabs,JP_CATEGORIES.filter(([id])=>id==='all'||id==='custom'||routes.some(route=>routeGroup(route)===id)),'category',category);return}groupTabs.hidden=false;renderTabs(groupTabs,KR_GROUPS,'transport-group',transportGroup);regionTabs.hidden=transportGroup!=='bus';if(transportGroup==='bus')renderTabs(regionTabs,KR_REGIONS,'region',regionFilter);const items=transportGroup==='bus'?busCategories():KR_CATEGORIES[transportGroup]||[];categoryTabs.hidden=!items.length;if(items.length)renderTabs(categoryTabs,items,'category',category)}
function applyCountryUi(){const ui=COUNTRY_UI[countryId];document.documentElement.dataset.country=countryId;document.documentElement.dataset.featureKorea=String(FEATURE_FLAGS.korea);$('#brand-subtitle').textContent=ui.subtitle;$('#home-country-mark').textContent=ui.mark;$('#home-country-subtitle').textContent=ui.subtitle;$('#home-country-status').textContent=ui.status;$('#hero-title').innerHTML=ui.title;$('#home-intro').innerHTML=ui.intro;document.querySelector('.line-select-heading p').textContent=ui.network;renderTransportFilters();$$('[data-country]').forEach(button=>{const enabled=isCountryEnabled(button.dataset.country);button.hidden=!enabled;button.disabled=!enabled;button.setAttribute('aria-hidden',String(!enabled));button.classList.toggle('active',enabled&&button.dataset.country===countryId)})}
function refreshCountryCopy(){const korea=countryId==='kr',play=document.querySelector('.launch-menu [data-nav="rail-map"] small'),footer=document.querySelector('.home-footer span:nth-child(2)'),featureButtons=$$('#feature-viewport [data-feature-route]');if(play)play.textContent=korea?'대한민국 교통에서 노선 선택':'일본 전국 철도에서 노선 선택';if(footer)footer.textContent=korea?'대한민국 대중교통 타이핑':'일본 전국 철도 타이핑';if(featureButtons[0])featureButtons[0].dataset.featureRoute=korea?'kr-seoul-line-2':'line-11302';if(featureButtons[1])featureButtons[1].dataset.featureRoute=korea?'kr-shinbundang':'line-28001'}
function configureExplicitDirections(){if(!selected?.directions?.length)return;const select=$('#service-direction'),name=stop=>stop?.ko||stop?.names?.ko||'';select.innerHTML=selected.directions.map(direction=>`<option value="${escapeHtml(direction.id)}">${escapeHtml(direction.names?.ko||direction.id)} · ${escapeHtml(name(direction.stops?.[0]))} → ${escapeHtml(name(direction.stops?.at(-1)))}</option>`).join('')}
function applyExplicitDirection(){const select=$('#service-direction'),direction=selected?.directions?.find(item=>item.id===select.value);if(!direction)return;selected=railDataRepository.resolveRoute(normalizeLine({...selected,lazy:false,selectedDirectionId:direction.id,selectedDirectionName:direction.names?.ko||direction.id,stations:direction.stops,directions:selected.directions,geometry:direction.geometry||[],directedSegments:direction.directedSegments||[],geometryReady:direction.geometryStatus==='ready',services:[]},{category:selected.category}));select.innerHTML=`<option value="forward">${escapeHtml(direction.names?.ko||direction.id)}</option>`}
function go(name){const result=window.TRTNavigation?.showScreen(name);requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));return result}
function applyTheme(theme){const resolved=theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;document.documentElement.dataset.theme=resolved;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',resolved==='dark'?'#07110e':'#f5f4ef')}
const JAPANESE_KOREAN_EXACT_FIXES={"智頭急行":"치즈 급행","富士急行":"후지 급행","福岡市交通局":"후쿠오카시 교통국","福島交通":"후쿠시마 교통","函館市交通局":"하코다테시 교통국","東葉高速鉄道":"도요 고속철도","広島高速交通":"히로시마 고속교통","北条鉄道":"호조 철도","北越急行":"호쿠에쓰 급행","伊豆急行":"이즈 급행","鹿児島市交通局":"가고시마시 교통국","関東鉄道":"간토 철도","北九州高速鉄道":"기타큐슈 고속철도","北大阪急行電鉄":"기타오사카 급행전철","神戸電鉄":"고베 전철","神戸高速鉄道":"고베 고속철도","神戸市交通局":"고베시 교통국","神戸新交通":"고베 신교통","熊本市交通局":"구마모토시 교통국","黒部峡谷鉄道":"구로베 협곡철도","京都市交通局":"교토시 교통국","京都丹後鉄道":"교토 단고 철도","名古屋臨海高速鉄道":"나고야 임해고속철도","名古屋市交通局":"나고야시 교통국","大井川鐵道":"오이가와 철도","大阪府都市開発":"오사카부 도시개발","大阪モノレール株式会社":"오사카 모노레일","嵯峨野観光鉄道":"사가노 관광철도","埼玉新都市交通":"사이타마 신도시교통","札幌市交通局":"삿포로시 교통국","仙台空港鉄道":"센다이 공항철도","仙台市交通局":"센다이시 교통국","湘南モノレール":"쇼난 모노레일","東海交通事業":"도카이 교통사업","上田交通":"우에다 교통","由利高原鉄道":"유리 고원철도","東海道新幹線":"도카이도 신칸센","山陽新幹線":"산요 신칸센","東北新幹線":"도호쿠 신칸센","北海道新幹線":"홋카이도 신칸센","上越新幹線":"조에쓰 신칸센","北陸新幹線":"호쿠리쿠 신칸센","九州新幹線":"큐슈 신칸센","西九州新幹線":"니시큐슈 신칸센","山形新幹線":"야마가타 신칸센","秋田新幹線":"아키타 신칸센","函館市電２系統":"하코다테시덴 2계통","函館市電５系統":"하코다테시덴 5계통","鹿児島市電１系統":"가고시마시덴 1계통","鹿児島市電２系統":"가고시마시덴 2계통","熊本市電Ａ系統":"구마모토시덴 A계통","熊本市電Ｂ系統":"구마모토시덴 B계통","長崎電軌１系統":"나가사키 전기궤도 1호계통","長崎電軌３系統":"나가사키 전기궤도 3호계통","長崎電軌４系統":"나가사키 전기궤도 4호계통","長崎電軌５系統":"나가사키 전기궤도 5호계통","富山地鉄市内線【１・２系統】":"도야마 지방철도 시내선 1·2계통","富山地鉄富山都心線【３系統(環状線)】":"도야마 지방철도 도야마 도심선 3계통(순환선)","大阪難波":"오사카난바","三河安城":"미카와안조","新大阪":"신오사카","大船":"오후나","大井町":"오이마치","大原":"오하라","京都":"교토"};
const JAPANESE_KOREAN_ID_FIXES={"tokyo-metro":"도쿄 메트로","yurikamome":"유리카모메","line-28001":"긴자선","line-28002":"마루노우치선","line-28003":"히비야선","line-28004":"도자이선","line-28005":"치요다선","line-28006":"유라쿠초선","line-28008":"한조몬선","line-28009":"난보쿠선","line-28010":"후쿠토신선","line-99618":"미도스지선","line-99311":"유리카모메","station-mlit-003872":"신바시","station-mlit-003887":"시오도메","station-mlit-003958":"다케시바","station-mlit-003979":"히노데","station-mlit-004030":"시바우라 후토","station-mlit-004091":"오다이바 카이힌코엔","station-mlit-004112":"다이바","station-mlit-004128":"도쿄 국제 크루즈 터미널","station-mlit-004144":"텔레콤센터","station-mlit-004119":"아오미","station-mlit-004087":"도쿄빅사이트","station-mlit-004064":"아리아케","station-mlit-004037":"아리아케 테니스노모리","station-mlit-004001":"시조마에","station-mlit-003981":"신토요스","station-mlit-003951":"토요스","station-mlit-003729":"한조몬","station-mlit-003782":"나가타쵸","station-mlit-003839":"토요쵸","station-mlit-003542":"코라쿠엔","station-mlit-003962":"시바코엔","station-mlit-003654":"료고쿠","station-mlit-003646":"료고쿠","station-mlit-003604":"오쿠보","station-mlit-003954":"아카바네바시","station-mlit-003639":"킨시쵸","station-mlit-003900":"카미야쵸","station-mlit-003753":"스이텐구마에","station-mlit-004108":"도쿄 텔레포트","station-mlit-003545":"우에노히로코지","station-mlit-004036":"세이죠가쿠엔마에","station-mlit-004331":"케이큐카마타","station-mlit-004264":"오모리"};
const NAMUWIKI_STATION_FIXES_BY_ID={"station-mlit-003872":"신바시","station-mlit-003887":"시오도메","station-mlit-003958":"다케시바","station-mlit-003979":"히노데","station-mlit-004030":"시바우라 후토","station-mlit-004091":"오다이바 카이힌코엔","station-mlit-004112":"다이바","station-mlit-004128":"도쿄 국제 크루즈 터미널","station-mlit-004144":"텔레콤센터","station-mlit-004119":"아오미","station-mlit-004087":"도쿄빅사이트","station-mlit-004064":"아리아케","station-mlit-004037":"아리아케 테니스노모리","station-mlit-004001":"시조마에","station-mlit-003981":"신토요스","station-mlit-003951":"토요스","station-mlit-003729":"한조몬","station-mlit-003782":"나가타쵸","station-mlit-003839":"토요쵸","station-mlit-003542":"코라쿠엔","station-mlit-003962":"시바코엔","station-mlit-003654":"료고쿠","station-mlit-003646":"료고쿠","station-mlit-003604":"오쿠보","station-mlit-003954":"아카바네바시","station-mlit-003639":"킨시쵸","station-mlit-003900":"카미야쵸","station-mlit-003753":"스이텐구마에","station-mlit-004108":"도쿄 텔레포트","station-mlit-003545":"우에노히로코지","station-mlit-004036":"세이죠가쿠엔마에","station-mlit-004331":"케이큐카마타","station-mlit-004264":"오모리","station-mlit-003785":"도쿄","station-mlit-003766":"도쿄","station-mlit-003884":"롯폰기잇초메","station-mlit-003892":"롯폰기","station-1130101":"도쿄","station-1111102":"유후츠","station-1120311":"오미나토","station-1150518":"오오카","station-9964809":"고베 공항","station-1141608":"미노오타","station-1161408":"호즈쿄","station-1192902":"휴가쇼나이","station-9932008":"가마쿠라코코마에","station-mlit-004361":"하네다 공항 제2터미널","station-3100533":"무로구치오노","station-9931303":"코엔","station-9960115":"교세라마에","station-mlit-004189":"나루토","station-3001807":"코마키구치","station-mlit-004614":"사가미오츠카","station-9931412":"다이유잔"};
const NAMUWIKI_STATION_FIXES_BY_JA={"大阪難波":"오사카난바","三河安城":"미카와안조","新大阪":"신오사카","大船":"오후나","大井町":"오이마치","大原":"오하라"};
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
function allRoutes(){return[...builtin,...storage.routes().filter(route=>isCountryEnabled(route.countryId||'jp')).map(r=>railDataRepository.resolveRoute(normalizeLine(r,{category:'custom'})))].map(fixRouteKoreanNames).filter(isRouteVisible).filter(r=>r.lazy||(Array.isArray(r.stations)&&r.stations.length>=2))}
const operatorLogo=operatorLogoMarkup;
// Company marks belong on every route card, including Tokyo Metro.
const lineSurfaceOperatorLogo=(route,className)=>operatorLogoMarkup(route,className);
function operatorKey(route){return route?.operatorId||route?.operator?.en}
function operatorScopeRoutes(){return routes.filter(route=>(countryId==='jp'||transportGroup==='all'||routeTransportGroup(route)===transportGroup)&&(countryId!=='kr'||transportGroup!=='bus'||regionFilter==='all'||route.regionId===regionFilter)&&routeCategoryMatches(route))}
function renderOperatorFilters(){const context=operatorScopeRoutes(),unique=[...new Map(context.map(route=>[operatorKey(route),route])).values()].sort((a,b)=>(a.operator.ko||'').localeCompare(b.operator.ko||'','ko')),target=$('#operator-filters');if(operatorFilter!=='all'&&!unique.some(route=>operatorKey(route)===operatorFilter))operatorFilter='all';target.innerHTML=unique.length?`<button class="${operatorFilter==='all'?'active':''}" data-operator="all">전체 운영사</button>`+unique.map(route=>`<button class="${operatorFilter===operatorKey(route)?'active':''}" data-operator="${escapeHtml(operatorKey(route))}">${operatorLogo(route,'filter-logo')}<span>${escapeHtml(route.operator.ko||'MISSING_KOREAN_NAME')}</span></button>`).join(''):'<p class="operator-filter-empty" role="status">해당 카테고리의 운영사가 없습니다.</p>'}
function freeDriveNetworkRoutes(){
  return routes.map(route=>{
    if(!route?.lazy)return route;
    const key=String(route.lazySource||'').replace(/^\.\//,''),embedded=globalThis.TRT_EMBEDDED_NATIONWIDE?.routes?.[key];
    if(!embedded)return route;
    try{return railDataRepository.resolveRoute(normalizeLine(embedded.route||embedded,{category:route.category}))}catch{return route}
  }).filter(route=>Array.isArray(route.stations)&&route.stations.length>=2)
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
function routeGroup(route){if(route.category==='custom')return'custom';if(countryId==='jp'&&route.dataKind==='trainService')return'limited-express';if(route.category==='shinkansen')return'shinkansen';return route.category}
function routeTransportGroup(route){if(route.category==='custom')return'custom';if(['bus','village_bus','express_bus','brt'].includes(route.mode))return'bus';if(['river_bus','ferry'].includes(route.mode))return'water';if(['rail','subway','commuter_rail','high_speed_rail','light_rail','monorail','tram','airport_rail'].includes(route.mode))return'rail';return'other'}
function routeCategoryMatches(route){if(category==='all')return true;if(transportGroup==='bus')return(category===(route.normalizedCategory||route.routeType||route.category));return routeGroup(route)===category||route.mode===category}
const NETWORK_GROUPS={keio:{routeIds:[]}};
function filteredRoutes(){const queries=searchVariants($('#route-search').value);return routes.filter(r=>(countryId==='jp'||transportGroup==='all'||routeTransportGroup(r)===transportGroup)&&(countryId!=='kr'||transportGroup!=='bus'||regionFilter==='all'||r.regionId===regionFilter)&&routeCategoryMatches(r)&&(operatorFilter==='all'||operatorKey(r)===operatorFilter)&&(!queries[0]||queries.some(query=>searchable(r).includes(query))))}
function stopWord(route){return['bus','village_bus','express_bus','brt'].includes(route.mode)?'정류장':['river_bus','ferry'].includes(route.mode)?'선착장':'역'}
function routeCard(r){const ready=r.geometryReady!==false,word=stopWord(r);return`<button class="line-card ${selected?.id===r.id?'selected':''} ${r.category==='shinkansen'?'shinkansen-card':''}" style="--route-color:${r.lineColor}" data-route="${r.id}"><div class="line-card-identity"><span class="operator">${escapeHtml(r.operator.ko)}</span><h3 class="line-card-line-name">${escapeHtml(r.line.ko)}</h3></div><p>${escapeHtml(r.line.ja||r.line.en)}</p><footer><span>${r.stationCount||r.stations.length}개 ${word}</span><span>${r.lazy?'상세 불러오기':ready?'선택':'순서 플레이'} →</span></footer></button>`}
function renderRoutes(){const filtered=filteredRoutes(),query=$('#route-search').value,keio=countryId==='jp'?filtered.filter(r=>NETWORK_GROUPS.keio.routeIds.includes(r.id)):[],grouped=!query&&keio.length>1,allVisible=grouped?filtered.filter(r=>!NETWORK_GROUPS.keio.routeIds.includes(r.id)):filtered,visible=allVisible.slice(0,routeRenderLimit);$('#route-count').textContent=`${filtered.length}개 노선 · ${Math.min(visible.length,allVisible.length)}개 표시`;const random=category==='all'&&transportGroup==='all'&&operatorFilter==='all'&&!query?`<button class="line-card random" style="--route-color:#45c985" data-random-route><span class="operator">${countryId==='kr'?'KOREA TRANSIT NETWORK':'JAPAN RAIL NETWORK'}</span><h3>RANDOM</h3><p>${countryId==='kr'?'대한민국':'일본 전국'} 랜덤 노선</p><footer><span>PLAYABLE ROUTES</span><span>SELECT →</span></footer></button>`:'';const group=grouped?`<button class="line-card network-group" style="--route-color:#d4146d" data-route-group="keio"><div class="line-card-identity"><span class="operator">${escapeHtml(keio[0].operator.ko)}</span><h3 class="line-card-line-name">${escapeHtml(keio[0].line.ko)} 계통</h3></div><p>${escapeHtml(keio[0].line.ko)} 계통</p><footer><span>${keio.length} LINES</span><span>BRANCHES →</span></footer></button>`:'';const more=allVisible.length>visible.length?`<button class="line-card route-more" data-route-more><span class="operator">WINDOWED GRID</span><h3>＋ ${Math.min(96,allVisible.length-visible.length)}개 더 보기</h3><p>${allVisible.length-visible.length}개 노선 남음</p></button>`:'';$('#route-grid').innerHTML=random+group+(visible.length?visible.map(routeCard).join('')+more:'<p class="muted">검색 결과가 없습니다.</p>')}
function renderSelected(){const panel=$('#selected-line-preview');if(selectedGroup){const spec=NETWORK_GROUPS[selectedGroup],members=spec.routeIds.map(id=>routes.find(route=>route.id===id)).filter(Boolean),main=members[0];panel.innerHTML=`<div class="selected-line-card network-detail"><p class="eyebrow">MAIN / BRANCHES</p><h3 id="selected-line-heading">${escapeHtml(main?.line.ja||'')}系統<span>${escapeHtml(main?.line.ko||'')} 계통</span></h3><div class="network-branches">${members.map(route=>`<button data-route="${route.id}">${lineBadgeMarkup(route)}<span><b>${escapeHtml(route.line.ja)}</b><small>${escapeHtml(route.line.ko)} · ${route.stations.length} STATIONS</small></span></button>`).join('')}</div></div>`;return}if(!selected){panel.innerHTML='<div class="selected-line-empty"><h3 id="selected-line-heading">노선을 선택하세요.</h3><p>오른쪽 목록에서 플레이할 노선을 선택합니다.</p></div>';return}panel.closest('.selected-line-panel').style.setProperty('--route-color',selected.lineColor);panel.innerHTML=`<div class="selected-line-card" style="--route-color:${selected.lineColor}"><div class="selected-line-operator">${lineSurfaceOperatorLogo(selected,'selected-operator-logo')}${lineBadgeMarkup(selected)}<span>${escapeHtml(selected.operator.ko)}</span></div><h3 id="selected-line-heading">${escapeHtml(selected.line.ja)}<span>${escapeHtml(selected.line.ko)} · ${escapeHtml(selected.line.en)}</span></h3>${selected.section?`<p class="selected-section">${escapeHtml(selected.section.ja)} · ${escapeHtml(selected.section.ko)}</p>`:''}<div class="selected-line-meta"><span>${selected.stations.length} STATIONS</span><span>${selected.dataKind==='trainService'?'LIMITED EXPRESS':selected.loop?'LOOP LINE':'FULL ROUTE'}</span></div><div class="selected-line-actions"><button class="selected-play" type="button" data-selected-play>PLAY THIS LINE <span>→</span></button><button class="selected-free-drive" type="button" data-selected-free-drive>FREE DRIVE <span>↗</span></button></div></div>`}
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
  const ko=value?.ko||value?.names?.ko||'',ja=value?.ja||value?.names?.ja||'',en=value?.en||value?.names?.en||'';
  if(hasHangul(ko))return ko;
  const recovered=stationKoreanByJapaneseName(ja||ko);if(recovered)return recovered;
  return ko||ja||en||''
};
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
  const base=(pattern.segments||[]).filter(segment=>segment.stations?.length>=2);if(!base.length||base.some(segment=>!routeForCatalogLine(segment.lineCode)))return null;
  const segments=reverse?base.slice().reverse().map(segment=>({...segment,stations:segment.stations.slice().reverse()})):base;
  const first=segments[0].stations[0]?.[0],last=segments.at(-1).stations.at(-1)?.[0];if(!first||!last||first===last)return null;
  const firstRoute=routeForCatalogLine(segments[0].lineCode),lastRoute=routeForCatalogLine(segments.at(-1).lineCode),origin=firstRoute?.stations?.find(station=>station.ja===first)||{ja:first,ko:first},destination=lastRoute?.stations?.find(station=>station.ja===last)||{ja:last,ko:last};
  const type={id:`catalog-type-${pattern.id}`,names:{ja:pattern.type?.ja||'',ko:pattern.type?.ko||'',en:pattern.type?.en||''},priority:Number(pattern.type?.priority||0),kind:Number(pattern.type?.kind||0)};
  return{kind:'catalog',id:`catalog:${pattern.id}:${reverse?'reverse':'forward'}`,originId:`catalog:${pattern.id}:${reverse?'reverse':'forward'}:origin`,destinationId:`catalog:${pattern.id}:${reverse?'reverse':'forward'}:destination`,originNames:origin,destinationNames:destination,trainType:type,patternName:type.names,throughServiceId:segments.length>1?`catalog-${pattern.id}`:null,direction:reverse?'reverse':'forward',catalogPattern:pattern,catalogReverse:reverse}
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
  const routeSegments=segments.map(segment=>{const route=routeForCatalogLine(segment.lineCode),first=segment.stations[0][0],last=segment.stations.at(-1)[0],a=route.stations.findIndex(station=>station.ja===first),b=route.stations.findIndex(station=>station.ja===last);if(a<0||b<0)throw new Error(`${route.line?.ja||segment.lineCode}: ${first} → ${last} 구간 매칭 실패`);return{routeId:route.id,direction:b>=a?'forward':'reverse',startStationJa:first,endStationJa:last}});
  const spec={id:`catalog-${pattern.id}`,nameJa:pattern.type?.ja||'直通',nameKo:pattern.type?.ko||'직통',nameEn:pattern.type?.en||'Through Service',routeSegments,boundarySnapToleranceKm:1.2},through=buildThroughServiceRoute(spec,id=>builtin.find(route=>route.id===id));
  const allowed=new Set(stopNames),stops=through.stations.filter(station=>allowed.has(station.ja)).map(station=>station.id),service={id:`catalog-${pattern.id}`,nameJa:pattern.type?.ja||'直通',nameKo:pattern.type?.ko||'직통',nameEn:pattern.type?.en||'Through Service',stops};
  return{route:{...through,services:[service]},service,direction:'forward',pattern:null,trainType:choice.trainType,destinationStationId:through.stations.at(-1)?.id||null,trainTypeContexts:[]}
}
function resolveOperatingChoice(choice,route,{preview=false}={}){
  if(!choice||!route)throw new Error('운행계통 선택 정보가 없습니다.');
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
function operatingChoicePlayable(choice,route){
  try{
    const resolved=resolveOperatingChoice(choice,route,{preview:true}),resolvedRoute=resolved?.route;
    if(!resolvedRoute||!Array.isArray(resolvedRoute.stations)||resolvedRoute.stations.length<2)return false;
    const service=resolved?.service;
    if(service?.stops?.length){
      const ids=new Set(resolvedRoute.stations.map(station=>String(station.id)));
      if(service.stops.some(id=>!ids.has(String(id))))return false;
    }
    return true;
  }catch(error){
    console.warn('Skipping unplayable operating choice',route?.id,choice?.id,error?.message||error);
    return false;
  }
}
function actualOperatingChoices(route){
  const journeys=serviceJourneysForRoute(route?.id),patterns=servicePatternsForRoute(route?.id),stationMap=new Map((route?.stations||[]).map(station=>[String(station.id),station])),choices=[],seen=new Set;
  const add=choice=>{const key=[choice.kind||'',choice.patternId||'',choice.journeyId||'',choice.throughSpecId||'',choice.legacyServiceId||'',choice.originId,choice.destinationId,choice.trainType?.id||'',choice.direction||''].join('::');if(!seen.has(key)){seen.add(key);choices.push(choice)}};
  for(const item of journeys)add({kind:'journey',id:`journey:${item.id}`,originId:String(item.originStationId),destinationId:String(item.destinationStationId),originNames:item.originNames,destinationNames:item.destinationNames,trainType:trainTypeFor(item.trainTypeId),journeyId:item.id,patternId:item.servicePatternId||null,patternName:item.names||null,throughServiceId:item.throughServiceId||null,direction:item.directionId||'forward'});
  for(const item of patterns){
    if(!item.originStationId||!item.destinationStationId)continue;
    const duplicate=choices.some(choice=>choice.patternId===item.id&&choice.originId===String(item.originStationId)&&choice.destinationId===String(item.destinationStationId)&&choice.trainType?.id===item.trainTypeId);
    if(duplicate)continue;
    const type=trainTypeFor(item.trainTypeId),origin=stationMap.get(String(item.originStationId))||{ko:item.originStationId},destination=stationMap.get(String(item.destinationStationId))||{ko:(item.names?.ko||'').match(/([^\s]+)행$/)?.[1]||item.destinationStationId};
    add({kind:'pattern',id:`pattern:${item.id}`,originId:String(item.originStationId),destinationId:String(item.destinationStationId),originNames:origin,destinationNames:destination,trainType:type,journeyId:null,patternId:item.id,patternName:item.names||null,throughServiceId:item.throughServiceId||null,direction:item.directionId||'forward'})
  }
  for(const service of route?.services||[]){
    if(!service?.id)continue;
    const stopIds=(service.stops||service.stopStationIds||[]).map(String),serviceStations=stopIds.map(id=>stationMap.get(id)).filter(Boolean);
    const first=serviceStations[0]||route.stations?.[0],last=serviceStations.at(-1)||route.stations?.at(-1);if(!first||!last||String(first.id)===String(last.id))continue;
    const serviceName={ko:service.nameKo||service.names?.ko||'각역정차',ja:service.nameJa||service.names?.ja||'',en:service.nameEn||service.names?.en||''};
    add({kind:'legacy',id:`service:${service.id}:forward`,originId:String(first.id),destinationId:String(last.id),originNames:first,destinationNames:last,trainType:null,journeyId:null,patternId:null,patternName:serviceName,throughServiceId:service.throughServiceId||null,legacyServiceId:service.id,direction:'forward'});
    add({kind:'legacy',id:`service:${service.id}:reverse`,originId:String(last.id),destinationId:String(first.id),originNames:last,destinationNames:first,trainType:null,journeyId:null,patternId:null,patternName:serviceName,throughServiceId:service.throughServiceId||null,legacyServiceId:service.id,direction:'reverse'})
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
  const catalogLine=nationwideCatalogLine(route);if(catalogLine)for(const pattern of catalogLine.data.patterns||[]){const variants=Number(pattern.type?.direction||0)===0?[false,true]:[false];for(const reverse of variants){const choice=catalogPatternChoice(route,pattern,reverse);if(!choice)continue;const typeKo=journeyLabel(choice.trainType),destJa=choice.destinationNames?.ja||'',originJa=choice.originNames?.ja||'',duplicate=choices.some(existing=>(existing.destinationNames?.ja||'')===destJa&&(existing.originNames?.ja||'')===originJa&&journeyLabel(existing.trainType)===typeKo);if(!duplicate)add(choice)}}
  if(choices.length){const playable=choices.filter(choice=>operatingChoicePlayable(choice,route));if(playable.length)return playable.sort((a,b)=>(b.trainType?.priority||0)-(a.trainType?.priority||0)||journeyLabel(a.destinationNames).localeCompare(journeyLabel(b.destinationNames),'ko'));}
  const stations=route?.stations||[];if(stations.length<2)return[];
  const first=stations[0],last=stations.at(-1);
  return[
    {kind:'fallback',id:'fallback:forward',originId:String(first.id),destinationId:String(last.id),originNames:first,destinationNames:last,trainType:null,journeyId:null,patternId:null,patternName:{ko:'각역정차'},throughServiceId:null,direction:'forward'},
    {kind:'fallback',id:'fallback:reverse',originId:String(last.id),destinationId:String(first.id),originNames:last,destinationNames:first,trainType:null,journeyId:null,patternId:null,patternName:{ko:'각역정차'},throughServiceId:null,direction:'reverse'}
  ]
}
function configureJourneyPicker(){
  const picker=$('#journey-picker'),origin=$('#journey-origin'),destination=$('#journey-destination'),summary=$('#journey-summary'),direction=$('#service-direction'),choices=actualOperatingChoices(selected);
  if(!picker||!origin||!destination||!choices.length)return;
  picker.hidden=false;
  const originGroups=[...new Map(choices.map(choice=>[journeyStationKey(choice.originNames,choice.originId),choice])).entries()];
  origin.innerHTML=originGroups.map(([key,choice])=>`<option value="${escapeHtml(key)}">${escapeHtml(journeyLabel(choice.originNames))}</option>`).join('');
  const renderDestinations=()=>{
    const available=choices.filter(choice=>journeyStationKey(choice.originNames,choice.originId)===origin.value);
    const uniqueAvailable=[...new Map(available.map(choice=>{const typeLabel=journeyLabel(choice.trainType),patternLabel=journeyLabel(choice.patternName),through=choice.throughServiceId?'through':'';return[[journeyStationKey(choice.destinationNames,choice.destinationId),normalize(typeLabel||patternLabel),through].join('::'),choice]})).values()];
    destination.innerHTML=uniqueAvailable.map(choice=>{
      const typeLabel=journeyLabel(choice.trainType),patternLabel=journeyLabel(choice.patternName),through=choice.throughServiceId?' · 직통':'';
      return `<option value="${escapeHtml(choice.id)}" data-destination-id="${escapeHtml(choice.destinationId)}">${escapeHtml(journeyLabel(choice.destinationNames))}${typeLabel?` · ${escapeHtml(typeLabel)}`:patternLabel?` · ${escapeHtml(patternLabel)}`:''}${through}</option>`
    }).join('');
    const choice=uniqueAvailable.find(item=>item.id===destination.value)||uniqueAvailable[0];if(!choice)return;
    destination.value=choice.id;destination.dataset.stationId=choice.destinationId;direction.value=choice.direction||'forward';
    summary.textContent=`${journeyLabel(choice.originNames)} → ${journeyLabel(choice.destinationNames)}${choice.trainType?` · ${journeyLabel(choice.trainType)}`:''}${choice.throughServiceId?' · 직통운행':''} · 실제 운행계통`;
    const endpoints=$('#setup-route .route-endpoints');if(endpoints)endpoints.innerHTML=`<span>${escapeHtml(journeyLabel(choice.originNames))}<small> 출발</small></span><span>${escapeHtml(journeyLabel(choice.destinationNames))}<small> 행선지</small></span>`
  };
  origin.onchange=renderDestinations;destination.onchange=()=>{const available=choices.filter(choice=>journeyStationKey(choice.originNames,choice.originId)===origin.value),choice=available.find(item=>item.id===destination.value);if(!choice)return;destination.dataset.stationId=choice.destinationId;direction.value=choice.direction||'forward';summary.textContent=`${journeyLabel(choice.originNames)} → ${journeyLabel(choice.destinationNames)}${choice.trainType?` · ${journeyLabel(choice.trainType)}`:''}${choice.throughServiceId?' · 직통운행':''} · 실제 운행계통`;const endpoints=$('#setup-route .route-endpoints');if(endpoints)endpoints.innerHTML=`<span>${escapeHtml(journeyLabel(choice.originNames))}<small> 출발</small></span><span>${escapeHtml(journeyLabel(choice.destinationNames))}<small> 행선지</small></span>`};
  origin.value=originGroups[0][0];renderDestinations()
}
function openSetup(route){
  selected=route;if(!selected||!Array.isArray(selected.stations)||selected.stations.length<2){toast('플레이 가능한 역이 부족한 노선입니다.');return}
  const settings=storage.settings();$('#game-map-mode').value=settings.mapMode;document.querySelector(`#setup-form [name="stationAdvance"][value="${settings.stationAdvance}"]`).checked=true;
  $('#setup-route').style.setProperty('--ticket-color',selected.lineColor);$('#setup-route').innerHTML=`<div class="setup-route-marks">${lineSurfaceOperatorLogo(selected,'setup-operator-logo')}${lineBadgeMarkup(selected,'setup-line-symbol')}</div><h3>${escapeHtml(selected.line.ja)}</h3><p>${escapeHtml(selected.operator.en)} · ${escapeHtml(selected.line.en)}<br>${escapeHtml(selected.line.ko)} · ${selected.stations.length} STATIONS</p>${selected.section?`<p class="setup-section">${escapeHtml(selected.section.ja)} · ${escapeHtml(selected.section.ko)}</p>`:''}<ol class="setup-stations">${selected.stations.map(station=>`<li><b>${escapeHtml(station.ja)}</b><span>${escapeHtml(station.romaji)} · ${escapeHtml(station.ko)}</span></li>`).join('')}</ol><div class="route-endpoints"><span>${escapeHtml(selected.stations[0].ja)}<small> 출발</small></span><span>${escapeHtml(selected.stations.at(-1).ja)}<small> 도착</small></span></div>`;
  configureJourneyPicker();
  go('game-setup')
}
async function chooseRoute(id){let route=routes.find(r=>r.id===id);if(!route&&dataLoading){pendingRouteId=id;toast('철도 데이터를 불러오는 중입니다. 잠시만 기다려 주세요.');return false}if(!route){console.warn('Line not found:',id);toast('선택한 노선을 찾을 수 없습니다. 데이터를 다시 불러와 주세요.');return false}if(route.lazy){toast(`${route.line.ko} 실제 역·선형을 불러오는 중입니다.`);try{const hydrated=railDataRepository.resolveRoute(await hydrateRailLine(route)),index=builtin.findIndex(item=>item.id===id);if(index>=0)builtin[index]=hydrated;refreshRoutes();route=routes.find(item=>item.id===id)}catch(error){console.error('Nationwide line load failed:',error);toast('이 노선의 상세 데이터를 불러오지 못했습니다.');return false}}selected=route;if(currentScreen!=='rail-map')go('rail-map');renderSelected();renderRoutes();return true}
function renderHomeNetwork(){const canvas=$('#home-network-canvas'),network=freeDriveNetworkRoutes();if(!canvas||!network.length)return;const tokyoBounds={minLat:35.50,maxLat:35.86,minLon:139.45,maxLon:139.96};drawNetworkCanvas(canvas,network,{bounds:tokyoBounds,alpha:.24,transferNodes:freeDrive?.graph||null})}
function freeDriveRouteTabs(state){
  const linked=[...(state.node?.routeIds||[])].filter(Boolean),ids=[state.routeId,...linked.filter(id=>id!==state.routeId)];
  return [...new Set(ids)].map(id=>({id,route:(state.edges||[]).find(edge=>edge.routeId===id)?.route||freeDrive?.routes?.find(route=>route.id===id)||state.route}))
}
function renderGameFreeDriveOptions(state){
  const target=$('#game-free-drive-options'),tabs=$('#game-free-drive-tabs');if(!target||!tabs||!state)return;
  const routeTabs=freeDriveRouteTabs(state);if(!routeTabs.length)return;
  freeDriveTabIndex=Math.max(0,Math.min(freeDriveTabIndex,routeTabs.length-1));
  const active=routeTabs[freeDriveTabIndex],activeId=active.id;
  tabs.hidden=routeTabs.length<2;tabs.classList.toggle('has-transfer',routeTabs.length>1);
  tabs.innerHTML=routeTabs.map((item,index)=>`<button type="button" class="${index===freeDriveTabIndex?'active':''}" data-free-drive-tab="${escapeHtml(item.id)}" style="--route-color:${item.route?.lineColor||'#777'}"><small>${index===0?'CURRENT':'TRANSFER'}</small><b>${escapeHtml(item.route?.line?.ko||item.route?.line?.ja||item.id)}</b><span>${escapeHtml(item.route?.line?.ja||'')}</span></button>`).join('');
  const edges=(state.edges||[]).filter(edge=>edge.routeId===activeId);
  const typingEdge=edges.find(edge=>edge.direction>0)||edges.find(edge=>edge.direction<0)||edges[0];
  if(!game?.freeDriveAwaitingStart&&typingEdge){const typingStation=freeDrive?.graph?.get(typingEdge.to)?.station;if(typingStation)game?.setFreeDriveTypingTarget?.(typingEdge,typingStation)}
  target.hidden=false;target.dataset.transferOpen=String(activeId!==state.routeId);
  target.innerHTML=edges.length?`<div class="free-drive-station-buttons" style="--route-color:${active.route?.lineColor||'#777'}">${edges.map(edge=>{const station=freeDrive?.graph?.get(edge.to)?.station;return `<button type="button" data-free-to="${escapeHtml(edge.to)}" data-free-route="${escapeHtml(edge.routeId)}"><b>${escapeHtml(station?.ko||station?.ja||'다음 역')}</b><span>${escapeHtml(station?.ja||'')}</span><i>→</i></button>`}).join('')}</div>`:'<p class="free-drive-empty">이 노선에서 이동 가능한 인접역이 없습니다.</p>';
}
async function startFreeDrive(route){
  if(!route)return toast('자유주행을 시작할 노선을 선택해 주세요.');
  let target=route;
  if(target.lazy){const ok=await chooseRoute(target.id);if(!ok)return;target=selected}
  if(!target?.stations?.length)return toast('자유주행에 사용할 역 데이터가 없는 노선입니다.');
  freeDrive?.setNetwork(freeDriveNetworkRoutes());
  if(!freeDrive?.start(target))return toast('자유주행을 시작하지 못했습니다.');
  const state=freeDrive.snapshot();if(!state||!game.startFreeDrive(state))return toast('자유주행 화면을 준비하지 못했습니다.');
  freeDriveTabIndex=0;renderGameFreeDriveOptions(state);go('game');
}
function renderHome(){const recordRouteId=record=>canonicalRouteId(record.lineId||record.routeId);const recent=storage.recent().filter(record=>routes.some(route=>route.id===recordRouteId(record)));document.querySelectorAll('#feature-viewport [data-feature-route]').forEach((button,index)=>{const route=routes.find(item=>item.id===button.dataset.featureRoute),card=button.closest('article'),slot=card?.querySelector('.feature-number');if(!route||!card)return;if(slot){slot.innerHTML=lineBadgeMarkup(route);slot.hidden=!slot.innerHTML}const operator=card.querySelector('[data-feature-operator]'),lineKo=card.querySelector('[data-feature-line-ko]'),lineSecondary=card.querySelector('[data-feature-line-secondary]'),stations=card.querySelector('[data-feature-stations]');if(operator)operator.innerHTML=`${lineSurfaceOperatorLogo(route,'feature-operator-logo')}<span>${escapeHtml(route.operator.ko)} · ${route.loop?'순환 운행':'도심 운행'}</span>`;if(lineKo)lineKo.textContent=route.line.ko;if(lineSecondary)lineSecondary.textContent=`${route.line.ja} · ${route.line.en}`;if(stations)stations.textContent=`${route.stations.length}개 역`;const dot=$$('[data-slide-to]')[index];if(dot)dot.setAttribute('aria-label',route.line.ko)});$('#recent-list').innerHTML=recent.length?recent.slice(0,3).map(record=>{const routeId=recordRouteId(record),route=routes.find(item=>item.id===routeId),name=route?.line.ko||record.routeName||routeId;return`<button class="recent-chip" data-feature-route="${escapeHtml(routeId)}" style="--route-color:${record.color}">${route?lineSurfaceOperatorLogo(route,'recent-operator-logo')+lineBadgeMarkup(route):''}<span><b>${escapeHtml(name)}</b><small>${formatTime(record.elapsed)} · ${record.accuracy.toFixed(1)}%</small></span></button>`}).join(''):'<p class="muted">아직 운행 기록이 없습니다.</p>'}
function renderCustomLibrary(){const list=storage.routes(),target=$('#custom-route-library');target.innerHTML=list.length?list.map(r=>`<article class="library-card" style="--route-color:${r.lineColor}" data-library-route="${r.id}"><span class="library-code">${escapeHtml(r.code||'CT')} · ${r.stations.length} STATIONS</span><h3>${escapeHtml(r.line.ko)}</h3><p>${escapeHtml(r.line.ja)} · ${escapeHtml(r.line.en)}</p><footer><button class="btn primary" data-library-play>PLAY</button><button class="btn ghost" data-library-free-drive>FREE DRIVE</button><button class="btn ghost" data-library-edit>EDIT</button><button class="btn text" data-library-delete aria-label="${escapeHtml(r.line.ko)} 삭제">×</button></footer></article>`).join(''):`<div class="library-empty"><b>아직 만든 노선이 없습니다.</b><p>첫 노선을 만들고 원하는 역 순서로 달려보세요.</p><button class="btn primary" data-action="custom-new">＋ CREATE NEW ROUTE</button></div>`}
function showResult(result){const isRecord=storage.saveResult(result);$('#result-operator-logo').innerHTML=operatorLogoMarkup(result.route,'result-operator-logo-asset');$('#result-line-badge').innerHTML=lineBadgeMarkup(result.route);$('#result-route').textContent=`${result.route.line.ja} · ${result.route.line.ko} · ${result.route.operator.ko}`;$('#result-time').textContent=formatTime(result.elapsed);$('#result-accuracy').textContent=`${result.accuracy.toFixed(1)}%`;$('#result-cpm').textContent=`${result.cpm} 타/min`;$('#result-errors').textContent=result.errors;$('#result-combo').textContent=result.maxCombo;$('#result-wpm').textContent=result.wpm;$('#record-notice').hidden=!isRecord;go('result')}
const game=new Game({onFinish:showResult,onQuit:()=>go('select'),onFreeDriveMove:(to,routeId)=>freeDrive?.moveTo(to,routeId)});
const editor=new RouteEditor({onRoutesChanged:()=>{refreshRoutes();renderCustomLibrary()},onPlay:openSetup,onSaved:()=>go('custom-list')});
freeDrive=new FreeDrive({onExit:()=>go('rail-map'),onChange:state=>{if(game?.freeDriveMode){freeDriveTabIndex=0;game.renderFreeDriveState(state);renderGameFreeDriveOptions(state)}}});
$('#free-drive-custom')?.addEventListener('click',()=>{const route=editor.route;if(!route?.stations||route.stations.length<2)return toast('자유주행에는 역이 2개 이상 필요합니다.');startFreeDrive(route)});
let currentScreen=document.body.dataset.currentScreen||'home';
window.addEventListener('trt:screenchange',e=>{const name=e.detail.name;if(currentScreen==='game'&&name!=='game'){game?.stop(false);const controls=$('#game-free-drive-options'),tabs=$('#game-free-drive-tabs');if(controls)controls.hidden=true;if(tabs)tabs.hidden=true}currentScreen=name;if(name==='rail-map')renderRoutes();if(name==='records')renderStats();if(name==='home'){renderHome();renderHomeNetwork()}if(name==='free-drive')freeDrive?.render?.();if(name==='custom-list')renderCustomLibrary();if(name==='custom-editor')editor.activate()});
document.querySelector('.country-switch').addEventListener('click',async event=>{const button=event.target.closest('[data-country]');if(!button||!isCountryEnabled(button.dataset.country)||button.dataset.country===countryId)return;countryId=button.dataset.country;localStorage.setItem('trt-country',countryId);transportGroup='all';category='all';regionFilter='all';operatorFilter='all';selected=null;selectedGroup=null;applyCountryUi();refreshCountryCopy();await reloadRailData();renderTransportFilters();renderOperatorFilters();renderRoutes();refreshFeatureCounts();renderSelected();toast(countryId==='kr'?'대한민국 교통 데이터로 전환했습니다.':'일본 철도 데이터로 전환했습니다.')});
$('#transport-mode-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-transport-group]');if(!button)return;transportGroup=button.dataset.transportGroup;category='all';regionFilter='all';operatorFilter='all';selected=null;selectedGroup=null;routeRenderLimit=96;renderTransportFilters();renderOperatorFilters();renderRoutes();renderSelected()});
$('#region-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-region]');if(!button)return;regionFilter=button.dataset.region;category='all';operatorFilter='all';selected=null;selectedGroup=null;routeRenderLimit=96;renderTransportFilters();renderOperatorFilters();renderRoutes();renderSelected()});
$('#category-tabs').addEventListener('click',e=>{const button=e.target.closest('[data-category]');if(!button)return;category=button.dataset.category;operatorFilter='all';selected=null;selectedGroup=null;routeRenderLimit=96;renderTransportFilters();renderOperatorFilters();renderRoutes();renderSelected()});
$('#operator-filters').addEventListener('click',e=>{const button=e.target.closest('[data-operator]');if(!button)return;operatorFilter=button.dataset.operator;selected=null;selectedGroup=null;routeRenderLimit=96;renderOperatorFilters();renderRoutes();renderSelected()});
$('#route-search').addEventListener('input',()=>{routeRenderLimit=96;renderRoutes()});
$('#route-grid').addEventListener('click',e=>{if(e.target.closest('[data-route-more]')){routeRenderLimit+=96;renderRoutes();return}const group=e.target.closest('[data-route-group]');if(group){selected=null;selectedGroup=group.dataset.routeGroup;renderSelected();renderRoutes();return}const random=e.target.closest('[data-random-route]');if(random){const playable=filteredRoutes();if(playable.length)chooseRoute(playable[Math.floor(Math.random()*playable.length)].id);return}const card=e.target.closest('[data-route]');if(card){selectedGroup=null;chooseRoute(card.dataset.route)}});
$('#selected-line-preview').addEventListener('click',e=>{const branch=e.target.closest('[data-route]');if(branch){selectedGroup=null;chooseRoute(branch.dataset.route);return}if(e.target.closest('[data-selected-play]')&&selected){openSetup(selected);return}if(e.target.closest('[data-selected-free-drive]')&&selected){startFreeDrive(selected);return}});
$('#clear-route-selection').addEventListener('click',()=>{selected=null;selectedGroup=null;renderSelected();renderRoutes()});
$('#game-free-drive-tabs')?.addEventListener('click',event=>{
  const button=event.target.closest('[data-free-drive-tab]');if(!button||!game?.freeDriveMode)return;
  const state=freeDrive?.snapshot();if(!state)return;
  const tabs=freeDriveRouteTabs(state),index=tabs.findIndex(item=>item.id===button.dataset.freeDriveTab);if(index<0)return;
  freeDriveTabIndex=index;renderGameFreeDriveOptions(state);
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||currentScreen!=='game'||!game?.freeDriveMode)return;
  const state=freeDrive?.snapshot();if(!state)return;
  const tabs=freeDriveRouteTabs(state);event.preventDefault();if(tabs.length<2)return;
  freeDriveTabIndex=(freeDriveTabIndex+(event.shiftKey?-1:1)+tabs.length)%tabs.length;renderGameFreeDriveOptions(state);
  const active=tabs[freeDriveTabIndex];toast(`TAB · ${active.route?.line?.ko||active.route?.line?.ja||active.id}`);
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
$('#setup-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.target),settings=storage.settings(),stationLabel=['ja','ja-romaji'].includes(settings.stationLabel)?settings.stationLabel:'ja',choiceId=String(data.get('journeyDestination')||''),choice=actualOperatingChoices(selected).find(item=>item.id===choiceId);if(!choice)return toast('실제 운행계통을 선택해 주세요.');let resolved=null,lastService=null;try{resolved=resolveOperatingChoice(choice,selected);lastService=resolved.service||null}catch(error){console.error('Service journey resolution failed:',error);return toast(`운행계통 오류: ${error.message}`)}lastRunRoute=resolved.route;if(!lastRunRoute)return toast('운행계통 데이터를 준비하지 못했습니다.');lastOptions={mode:data.get('mode'),inputMode:data.get('inputMode')||'shadowing',difficulty:'normal',service:resolved.service?.id||choice.legacyServiceId||'local',direction:resolved.direction||choice.direction||'forward',display:'ja',input:'ko',stationAdvance:data.get('stationAdvance')||settings.stationAdvance,mapMode:$('#game-map-mode').value,stationLabel,mapLabels:settings.mapLabels,motion:settings.motion,reducedMotion:settings.reducedMotion,sound:settings.sound,serviceJourney:resolved.journey||null,serviceJourneyId:resolved.journeyId||choice.journeyId||null,servicePattern:resolved.pattern||null,trainType:resolved.trainType||choice.trainType||null,destinationStationId:resolved.destinationStationId||choice.destinationId,throughServiceId:choice.throughServiceId||resolved.pattern?.throughServiceId||lastRunRoute.throughService?.id||null,trainTypeContexts:resolved.trainTypeContexts||[]};$('#map-view-toggle').textContent=lastOptions.mapMode==='geographic'?'SCHEMATIC':'GEOGRAPHIC';if(game.start(lastRunRoute,lastOptions)){go('game');game.focusInput()}});
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
async function reloadRailData(){const summary=$('#data-summary');dataLoading=true;summary.classList.remove('error');summary.textContent=`${countryId==='kr'?'대한민국 대중교통':'일본 전국 철도'} 카탈로그를 불러오는 중...`;try{let edits={};try{const response=await fetch('./data/editor-overrides.json?ts='+Date.now(),{cache:'no-store'});if(response.ok)edits=await response.json()}catch(error){console.warn('Name editor overrides unavailable:',error)}globalThis.TRT_EDITOR_OVERRIDES=edits;
    const loaded=await loadTransportData(countryId);railDataRepository.configure({operators:loaded.operators,lines:loaded.lines,stations:loaded.stations,assets:loaded.assets});builtin=loaded.lines.map(route=>railDataRepository.resolveRoute(route));stations=[...railDataRepository.stations.values()].map(station=>({id:station.id,stationMasterId:station.id,sourceStationId:station.id,ja:station.names.ja,kana:station.names.kana,ko:station.names.ko,romaji:station.names.en,latitude:station.coordinates.lat,longitude:station.coordinates.lng}));stations=stations.filter(station=>FEATURE_FLAGS.visibleJapanRegion!=='tokyo-area'||!globalThis.TRT_TOKYO_AREA||countryId==='kr'||globalThis.TRT_TOKYO_AREA.stationIds.includes(station.id));editor.setStationMaster(stations);refreshRoutes();renderHome();summary.innerHTML=countryId==='kr'?`대한민국 1차 데이터 · ${builtin.length}개 대표 노선 · 상세 데이터는 노선 선택 시 로드 · 선형 미확보 노선도 정차 순서 타이핑 가능`:`일본 전국 ${routes.length}개 · JR ${routes.filter(r=>r.category==='jr').length} · 지하철 ${routes.filter(r=>r.category==='subway').length} · 사철 ${routes.filter(r=>r.category==='private').length} · 제3섹터 ${routes.filter(r=>r.category==='third-sector').length} · 트램 ${routes.filter(r=>r.category==='tram').length} · 신칸센 ${routes.filter(r=>r.category==='shinkansen').length}`;dataLoading=false;if(pendingRouteId){const id=pendingRouteId;pendingRouteId=null;chooseRoute(id)}return loaded}catch(error){console.error('App transport data initialization failed:',error);builtin=[];editor.setStationMaster([]);refreshRoutes();renderHome();dataLoading=false;summary.classList.add('error');summary.innerHTML='교통 데이터를 불러오지 못했습니다. <button data-retry-data>다시 시도</button>';return null}}
document.addEventListener('click',e=>{if(e.target.closest('[data-retry-data]'))reloadRailData()});
function runSanityChecks(){console.assert(routes.length>0,'Transport data must contain routes');if(countryId==='jp'){console.assert(routes.some(line=>line.id==='line-11302'),'Yamanote line is required');console.assert(routes.some(line=>line.id==='line-28001'),'Ginza line is required')}else console.assert(routes.some(line=>line.id==='kr-seoul-line-2'),'Seoul Line 2 is required');console.assert(routes.every(line=>line.lazy||(Array.isArray(line.stations)&&line.stations.length>=2)),'Every visible route must be playable or lazy-loadable')}
await reloadRailData();refreshFeatureCounts();if(['localhost','127.0.0.1'].includes(location.hostname))runSanityChecks();
