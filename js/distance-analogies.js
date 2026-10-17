// Deliberately rounded intercity railway-scale examples (not a claim of exact fare mileage).
// Keep these illustrative; do not confuse this scale with the measured game route.
const JAPAN=[
  ['도쿄~요코하마',30],['도쿄~치바',40],['도쿄~가마쿠라',55],
  ['도쿄~나리타공항',75],['도쿄~오다와라',85],['도쿄~아타미',105],
  ['도쿄~우쓰노미야',110],['도쿄~시즈오카',180],['도쿄~나고야',365],
  ['도쿄~센다이',350],['도쿄~니가타',330],['도쿄~가나자와',450],
  ['도쿄~오사카',515],['도쿄~하코다테',860],['도쿄~하카타',1100],
  ['오사카~고베',33],['오사카~교토',43],['오사카~간사이공항',50],
  ['오사카~히메지',95],['교토~나라',40],['나고야~교토',145],
  ['오사카~나고야',190],['오사카~하카타',620]
];
const KOREA=[
  ['서울~인천',40],['서울~수원',40],['서울~천안',95],
  ['서울~춘천',100],['서울~대전',160],['서울~강릉',220],
  ['서울~대구',290],['서울~광주송정',300],['서울~목포',350],
  ['서울~여수',400],['서울~부산',420],['서울~진주',460],
  ['부산~울산',50],['부산~대구',120],['대전~청주',40],
  ['대전~광주',180],['대구~포항',80],['부산~진주',115]
];
const neat=value=>value>=10?Math.round(value).toLocaleString('ko-KR'):value.toFixed(1).replace(/\.0$/,'');
export function formatJourneyDistanceAnalogy(km,countryId='jp'){
 if(!Number.isFinite(km)||km<=0)return '비교할 거리를 계산할 수 없습니다.';
 const laps=km/.4,marathons=km/42.195,tenKm=km/10;
 const sport=km<3
   ?'400m 육상 트랙 약 '+neat(laps)+'바퀴'
   :km<20
   ?'10km 달리기 약 '+neat(tenKm)+'회 · 400m 트랙 약 '+neat(laps)+'바퀴'
   :'풀마라톤(42.195km) 약 '+neat(marathons)+'회';
 if(km<15)return sport;
 const comparisons=countryId==='kr'?KOREA:JAPAN;
 // Compare logarithmic ratios rather than absolute differences: a 1000 km trip
 // must not always be assigned the largest short-distance city pair.
 const nearest=comparisons.reduce((best,entry)=>Math.abs(Math.log(km/entry[1]))<Math.abs(Math.log(km/best[1]))?entry:best,comparisons[0]);
 const ratio=km/nearest[1];
 return sport+' · '+nearest[0]+' 기준 거리의 약 '+neat(ratio)+'배 (도시 간 거리는 대략적 비유)';
}
export const distanceAnalogyExampleCounts=Object.freeze({jp:JAPAN.length,kr:KOREA.length});
