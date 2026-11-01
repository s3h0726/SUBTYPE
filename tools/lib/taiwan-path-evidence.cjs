'use strict';
// 무정차 분기점에서 방향을 꺾어 되돌아가는 우회로는 대체 여객 경로가 아니다.
function points(edge){const l=edge.line,a=l.stations[edge.a].geometryIndex,b=l.stations[edge.b].geometryIndex,p=l.geometry.slice(Math.min(a,b),Math.max(a,b)+1);return b<a?p.reverse():p}
function tangent(edge,atEnd){let p=points(edge);if(atEnd)p=p.slice().reverse();const a=p[0];let b=p[1];for(const v of p.slice(1)){b=v;if(Math.hypot((v[0]-a[0])*111,(v[1]-a[1])*101)>.08)break}return[(b[1]-a[1])*Math.cos(a[0]*Math.PI/180),b[0]-a[0]]}
function plausiblePath(edges,callSet){for(let i=1;i<edges.length;i++){const a=edges[i-1],b=edges[i],junction=b.line.stations[b.a].networkKey;if(callSet.has(junction))continue;const u=tangent(a,true),v=tangent(b,false),dot=(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v));if(dot>.5)return false}return true}
module.exports={plausiblePath};
