'use strict';
// 원본 정차지 이름으로 공항 연결을 색인한다. 일반 시내버스를 리무진으로 바꾸지 않는다.
const AIRPORTS=[['incheon','인천국제공항',/인천(?:국제)?공항/],['gimpo','김포국제공항',/김포(?:국제)?공항/],['gimhae','김해국제공항',/김해(?:국제)?공항/],['jeju','제주국제공항',/제주(?:국제)?공항/],['daegu','대구국제공항',/대구(?:국제)?공항/],['cheongju','청주국제공항',/청주(?:국제)?공항/],['gwangju','광주공항',/광주공항/],['muan','무안국제공항',/무안(?:국제)?공항/],['yangyang','양양국제공항',/양양(?:국제)?공항/],['ulsan','울산공항',/울산공항/],['pohang','포항경주공항',/포항(?:경주)?공항/],['yeosu','여수공항',/여수공항/],['sacheon','사천공항',/사천공항/],['gunsan','군산공항',/군산공항/],['wonju','원주공항',/원주공항/]];
function airportFields(route){if(!['bus','express_bus','village_bus','brt'].includes(route.mode))return{};
 const names=(route.verifiedJourneys||[]).flatMap(j=>(j.stations||[]).map(s=>s.sourceName||s.ko)),airports=AIRPORTS.filter(([,name,re])=>names.some(n=>re.test(n)));
 // 공항의 실제 청사 정류장은 지역 약칭으로만 기록되는 경우가 있어 좌표도 함께 대조한다.
 if(!airports.some(a=>a[0]==='gimhae')&&(route.verifiedJourneys||[]).some(j=>j.stations.some(s=>/공항|국내선|국제선/.test(s.sourceName||s.ko)&&s.latitude>35.16&&s.latitude<35.19&&s.longitude>128.93&&s.longitude<128.96)))airports.push(AIRPORTS.find(a=>a[0]==='gimhae'));
 // 광주공항역 출구 정류장은 청사 직행과 구분되는 공항 연계로만 색인한다.
 if(route.regionId==='gwangju'&&!airports.some(a=>a[0]==='gwangju')&&(route.verifiedJourneys||[]).some(j=>j.stations.some(s=>/^공항역(?:[0-9]+번)?출구/.test(s.sourceName||s.ko)&&s.latitude>35.140&&s.latitude<35.148&&s.longitude>126.806&&s.longitude<126.817)))airports.push(AIRPORTS.find(a=>a[0]==='gwangju'));
 if(!airports.length)return{};
 const dedicated=/공항버스|리무진/.test(route.categoryKo||route.regionalCategory||'')||!!route.airportServiceKind;
 return{airportIds:airports.map(a=>a[0]),airportNamesKo:airports.map(a=>a[1]),airportServiceKind:route.airportServiceKind||(dedicated?'airport_bus':'airport_connection'),airportEvidence:'방향별 원본 정차지의 공항명·김해 청사 좌표·광주공항역 출구 좌표 대조. 공항역 연계는 청사 직행과 구분'};}
module.exports={AIRPORTS,airportFields};
