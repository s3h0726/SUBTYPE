// European railway runtime: data is published only after station, service and track evidence passes review.
export const EUROPE_COUNTRIES=Object.freeze([{"id":"gb","flag":"🇬🇧","names":{"ko":"영국","en":"United Kingdom","native":"English"}},{"id":"fr","flag":"🇫🇷","names":{"ko":"프랑스","en":"France","native":"Français"}},{"id":"de","flag":"🇩🇪","names":{"ko":"독일","en":"Germany","native":"Deutsch"}},{"id":"es","flag":"🇪🇸","names":{"ko":"스페인","en":"Spain","native":"Español"}},{"id":"it","flag":"🇮🇹","names":{"ko":"이탈리아","en":"Italy","native":"Italiano"}},{"id":"ch","flag":"🇨🇭","names":{"ko":"스위스","en":"Switzerland","native":"Deutsch / Français / Italiano / Rumantsch"}},{"id":"nl","flag":"🇳🇱","names":{"ko":"네덜란드","en":"Netherlands","native":"Nederlands"}},{"id":"at","flag":"🇦🇹","names":{"ko":"오스트리아","en":"Austria","native":"Deutsch"}},{"id":"be","flag":"🇧🇪","names":{"ko":"벨기에","en":"Belgium","native":"Nederlands / Français / Deutsch"}},{"id":"pt","flag":"🇵🇹","names":{"ko":"포르투갈","en":"Portugal","native":"Português"}},{"id":"cz","flag":"🇨🇿","names":{"ko":"체코","en":"Czech Republic","native":"Čeština"}},{"id":"pl","flag":"🇵🇱","names":{"ko":"폴란드","en":"Poland","native":"Polski"}}]);
export const EUROPE_COUNTRY_IDS=new Set(EUROPE_COUNTRIES.map(country=>country.id));
export const isEuropeCountry=id=>EUROPE_COUNTRY_IDS.has(id);
export const EUROPE_CATEGORIES=[['all','전체'],['rail','일반철도'],['commuter_rail','광역철도'],['subway','도시철도'],['light_rail','경전철'],['tram','노면전차'],['high_speed_rail','고속철도'],['airport_rail','공항철도'],['monorail','모노레일'],['other_rail','기타 철도'],['custom','커스텀']];
const europeKm=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos(b[0]*Math.PI/180));
const europePoint=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180;
export function europeRouteValidation(route){
 const problems=[];
 if(!isEuropeCountry(route?.countryId))problems.push('unknown-country');
 if(!route?.id?.startsWith('eu-'+route?.countryId+'-'))problems.push('unscoped-route-id');
 if(!route?.sourceEvidence?.sourceUrl||!route?.sourceEvidence?.license||!route?.sourceEvidence?.snapshotDate)problems.push('missing-provenance');
 if(route?.operationalStatus!=='OPERATIONAL'||route?.playable!==true||route?.geometryReady!==true)problems.push('not-released');
 if(!/^[가-힣]/u.test(route?.line?.ko||'')||!/^[가-힣]/u.test(route?.operator?.ko||''))problems.push('unreviewed-line-or-operator-name');
 if(!Array.isArray(route?.patterns)||!route.patterns.length)problems.push('no-service-patterns');
 for(const pattern of route?.patterns||[]){
  const stations=pattern.stations||[],geometry=pattern.geometry||[];
  if(stations.length<2||geometry.length<3||geometry.some(p=>!europePoint(p)))problems.push(pattern.id+':invalid-shape');
  if(!pattern?.sourceTripId||!pattern?.sourceShapeId||!pattern?.serviceDate)problems.push(pattern.id+':missing-service-evidence');
  let last=-1;
  for(const station of stations){
   if(!String(station.id||'').startsWith('eu-'+route.countryId+'-stop-')||!/[가-힣]/u.test(station.ko||'')||station.nameReviewStatus!=='verified'||!station.koSource)problems.push(pattern.id+':unverified-name:'+station.id);
   if(!Number.isInteger(station.geometryIndex)||station.geometryIndex<=last||station.geometryIndex>=geometry.length||!europePoint(geometry[station.geometryIndex]))problems.push(pattern.id+':invalid-geometry-index:'+station.id);
   else if(Number.isFinite(station.latitude)&&Number.isFinite(station.longitude)&&europeKm([station.latitude,station.longitude],geometry[station.geometryIndex])>0.5)problems.push(pattern.id+':track-too-far:'+station.id);
   last=station.geometryIndex;
  }
 }
 return[...new Set(problems)];
}
export function europeOperatingChoices(route){
 if(!route||!isEuropeCountry(route.countryId)||route.playable!==true||route.geometryReady!==true)return[];
 return(route.patterns||[]).filter(p=>(p.stations||[]).length>=2&&(p.geometry||[]).length>=3).map(p=>{
  const a=p.stations[0],b=p.stations.at(-1);
  return{kind:'europe',id:p.id,patternId:p.id,journeyId:p.id,legacyServiceId:p.id,originId:a.id,destinationId:b.id,originNames:a,destinationNames:b,patternName:{ko:p.nameKo||route.line.ko,en:p.nameEn||route.line.en},direction:p.direction||'forward',trainType:null,sourceTripId:p.sourceTripId};
 });
}
export function resolveEuropeChoice(choice,owner){
 if(choice?.kind!=='europe'||!isEuropeCountry(owner?.countryId))throw Error('유럽 운행계통 선택 오류');
 const p=owner.patterns?.find(item=>item.id===choice.id);
 if(!p||owner.playable!==true||owner.geometryReady!==true)throw Error('검증된 운행계통이 없습니다.');
 const service={id:p.id,nameKo:p.nameKo||owner.line.ko,nameJa:p.nameNative||owner.line.ja,nameEn:p.nameEn||owner.line.en,stops:p.stations.map(s=>s.id)};
 const route={...owner,stations:p.stations.map(s=>({...s})),geometry:p.geometry.map(coord=>[...coord]),patterns:[],services:[service],selectedServiceId:p.id,renderKey:owner.id+':'+p.id,loop:false};
 return{route,service,direction:'forward',pattern:{id:p.id,names:{ko:service.nameKo,en:service.nameEn}},journey:{id:p.id,directionId:p.direction||'forward',originStationId:route.stations[0].id,destinationStationId:route.stations.at(-1).id},journeyId:p.id,destinationStationId:route.stations.at(-1).id,trainType:null,trainTypeContexts:[]};
}
export function applyEuropeNameEdits(route,edits={}){
 if(!isEuropeCountry(route?.countryId))return route;
 const override=(kind,id,value)=>{const input=edits[kind]?.[id];const ko=typeof input==='string'?input:input?.ko;return(typeof ko==='string'&&/[가-힣]/u.test(ko))?ko:value};
 const stations=stops=>stops.map(s=>({...s,ko:override('stations',s.id,s.ko),names:{...(s.names||{}),ko:override('stations',s.id,s.ko)}}));
 return{...route,operator:{...route.operator,ko:override('operators',route.operatorId,route.operator?.ko)},line:{...route.line,ko:override('lines',route.id,route.line?.ko)},stations:stations(route.stations||[]),patterns:(route.patterns||[]).map(p=>({...p,nameKo:override('services',p.id,p.nameKo),stations:stations(p.stations||[])}))};
}
