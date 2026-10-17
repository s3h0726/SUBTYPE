// Approximate South Korean distance landmarks, for scale only.
// These are intentionally rounded comparisons, NOT the actual user's train mileage.
const KOREA=[
 ['서울역~시청',1.5],['광화문~강남',10],['서울~인천',40],['서울~수원',40],
 ['서울~천안',95],['서울~춘천',100],['서울~대전',160],['서울~강릉',220],
 ['서울~대구',290],['서울~광주송정',300],['서울~목포',350],['서울~여수',400],
 ['서울~부산',420],['서울~진주',460],['부산~울산',50],['부산~대구',120],
 ['대전~청주',40],['대전~광주',180],['대구~포항',80],['부산~진주',115]
];
const readable=n=>n>=10?Math.round(n).toLocaleString('ko-KR'):Number(n.toFixed(2)).toLocaleString('ko-KR');
export function formatJourneyDistanceAnalogy(km){
 if(!Number.isFinite(km)||km<=0)return '비교할 거리를 계산할 수 없습니다.';
 const nearest=KOREA.reduce((best,entry)=>Math.abs(Math.log(km/entry[1]))<Math.abs(Math.log(km/best[1]))?entry:best,KOREA[0]);
 return '한국 '+nearest[0]+' 기준 거리의 약 '+readable(km/nearest[1])+'배 (대략적인 거리 비교)';
}
export const distanceAnalogyExampleCounts=Object.freeze({kr:KOREA.length});
