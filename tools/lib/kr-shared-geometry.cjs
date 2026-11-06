'use strict';
// 메모리에서만 동일 좌표 배열을 공유한다. 직렬화 값과 잘못된 원본은 변경하지 않는다.
function samePoints(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((p,i)=>Array.isArray(p)&&Array.isArray(b[i])&&p.length===b[i].length&&p.every((n,k)=>n===b[i][k]));}
function shareGeometry(batch){for(const route of batch.routes||[]){for(const journey of route.verifiedJourneys||[]){const geometry=journey.geometry,stations=journey.stations;if(!Array.isArray(geometry)||!Array.isArray(stations))continue;for(let i=0;i<(journey.directedSegments||[]).length;i++){const segment=journey.directedSegments[i],from=stations[i]?.geometryIndex,to=stations[i+1]?.geometryIndex;if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<from||to>=geometry.length)continue;const points=geometry.slice(from,to+1);if(samePoints(segment.geometry,points))segment.geometry=points;}}
 const first=route.verifiedJourneys?.[0];if(first&&samePoints(route.geometry,first.geometry))route.geometry=first.geometry;
 if(first&&JSON.stringify(route.directedSegments)===JSON.stringify(first.directedSegments))route.directedSegments=first.directedSegments;
 }return batch;}
module.exports={shareGeometry};
