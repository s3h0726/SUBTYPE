/* SUBTYPE route/service blurbs. Presentation only; do not alter journey topology. */
const ROUTE_KINDS={
  jr:'JR 일반철도',shinkansen:'신칸센',subway:'지하철',metro:'도시철도',
  private:'사철', 'third-sector':'제3섹터 철도',tram:'노면전차',
  monorail:'모노레일', 'light_rail':'경전철',commuter_rail:'광역철도',
  airport_rail:'공항철도',high_speed_rail:'고속철도',rail:'일반철도',
  'limited-express':'특급열차',bus:'버스',ferry:'여객선',river_bus:'수상교통',
  other_rail:'철도',custom:'사용자 제작'
};
const cleanDescription=value=>typeof value==='string'?value.trim().slice(0,110):'';
const readableStation=value=>{
  const raw=typeof value==='string'?value:value?.ko||value?.names?.ko||value?.ja||value?.names?.ja||'';
  const name=String(raw).trim();
  return name&&name.length<=35&&!/^station-|^undefined$/.test(name)?name:'';
};
function routeEndpoints(route){
  const stations=route?.stations;
  if(Array.isArray(stations)&&stations.length>0)return[readableStation(stations[0]),readableStation(stations.at(-1))];
  // Lightweight Japanese catalog stores alternating Japanese and Korean station names.
  const terms=route?.searchStations;
  if(Array.isArray(terms)&&terms.length>=4)return[readableStation(terms[1]),readableStation(terms.at(-1))];
  const origin=route?.researchEvidence?.origin,destination=route?.researchEvidence?.destination;
  return[readableStation(origin),readableStation(destination)];
}
export function describeRoute(route){
  if(!route)return'노선 정보를 불러오는 중입니다.';
  const written=cleanDescription(route.description||route.line?.description||route.shortDescription);
  if(written)return written;
  if(route.category==='custom')return'직접 구성한 역 순서와 운행 구간을 따라 달리는 사용자 노선입니다.';
  const kind=ROUTE_KINDS[route.category]||ROUTE_KINDS[route.normalizedCategory]||ROUTE_KINDS[route.mode]||'철도';
  const [a,b]=routeEndpoints(route);
  if(route.loop)return a?`${a}에서 출발해 다시 돌아오는 ${kind} 순환 노선입니다.`:`시작역으로 돌아오는 ${kind} 순환 노선입니다.`;
  if(a&&b&&a!==b)return`${a}부터 ${b}까지 이어지는 ${kind} 노선입니다.`;
  if(a)return`${a} 방면을 따라 운행하는 ${kind} 노선입니다.`;
  return`${kind}의 정차역을 실제 노선 순서대로 체험합니다.`;
}
const choiceName=value=>typeof value==='string'?value:value?.ko||value?.nameKo||value?.names?.ko||value?.ja||value?.names?.ja||'';
function serviceMode(choice){
  const label=[choiceName(choice?.trainType),choiceName(choice?.patternName),choice?.nameKo||'',choice?.kind==='fallback'?'각역정차':''].join(' ');
  if(/특급|limited.express/i.test(label))return'특급';
  if(/특별쾌속|special.rapid/i.test(label))return'특별쾌속';
  if(/쾌속|rapid/i.test(label))return'쾌속';
  if(/급행|express/i.test(label))return'급행';
  if(/완행|보통|일반|각역정차|local/i.test(label))return'보통';
  return'';
}
export function describeOperatingPattern(choice,route){
  const written=cleanDescription(choice?.description||choice?.patternDescription||choice?.trainType?.description);
  if(written)return written;
  const a=readableStation(choice?.originNames),b=readableStation(choice?.destinationNames);
  const link=a&&b&&a!==b?`${a}–${b} 구간`:'등록된 운행 구간';
  const mode=serviceMode(choice);
  const direct=choice?.throughServiceId||choice?.kind==='through';
  const subject=mode?`${mode}열차`:'열차';
  const extra=direct?' · 다른 노선과 직통 연결':'';
  if(route?.loop&&a===b)return`순환 구간을 달리는 ${subject} 운행${extra}.`;
  return`${link}을 운행하는 ${subject} 계통${extra}.`;
}
export function describeOperatingJourney(choice,route){
  const written=cleanDescription(choice?.journeyDescription||choice?.description);
  if(written)return written;
  if(choice?.kind==='fallback')return route?.loop?'시작역까지 한 바퀴 도는 기본 운행입니다.':'등록된 역 순서대로 달리는 기본 운행입니다.';
  const mode=serviceMode(choice);
  const direct=Boolean(choice?.throughServiceId||choice?.kind==='through');
  const stops=Array.isArray(choice?.branchStops)?choice.branchStops.length:0;
  const note=stops>=2?`${stops}개 정차역`:mode?`${mode} 운행`:'선택한 구간 운행';
  return`${note}${direct?' · 다른 노선과 직통':''} · 출발역부터 행선지까지 진행합니다.`;
}
