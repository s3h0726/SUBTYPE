'use strict';
// 공개 OSM 선형의 인접 꼭짓점만 연결한다. API가 준 직선 대체 선형은 허용하지 않는다.
const {km,align}=require('./thailand-geometry.cjs');
const key=p=>p.map(n=>Number(n).toFixed(5)).join(',');
class CurrentRailGraph{
 constructor(network){this.network=network;this.points=new Map();this.adj=new Map();this.stationKeys=new Map();this.cache=new Map();
  for(const line of network.lines)for(let i=0;i<line.length;i++){const p=line[i],id=key(p);this.points.set(id,p);if(!this.adj.has(id))this.adj.set(id,new Map());if(i){const previous=key(line[i-1]),weight=km(line[i-1],p);this.adj.get(previous).set(id,weight);this.adj.get(id).set(previous,weight)}}
  for(const [id,p]of Object.entries(network.nodes)){const k=this.pointKey(p);if(k)this.stationKeys.set(id,k)}
 }
 pointKey(p){const exact=key(p);if(this.points.has(exact))return exact;let best=null,d=.003;for(const[id,point]of this.points){const value=km(p,point);if(value<d){best=id;d=value}}return best;}
 path(a,b){if(a===b)return[this.points.get(a)];const signature=a+'>'+b;if(this.cache.has(signature))return this.cache.get(signature);if(this.adj.get(a)?.has(b))return[this.points.get(a),this.points.get(b)];
  const distance=new Map([[a,0]]),previous=new Map(),queue=[[0,a]];
  const push=item=>{queue.push(item);let i=queue.length-1;while(i){const p=(i-1)>>1;if(queue[p][0]<=item[0])break;queue[i]=queue[p];i=p}queue[i]=item};
  const pop=()=>{const first=queue[0],last=queue.pop();if(queue.length){let i=0;while(i*2+1<queue.length){let child=i*2+1;if(child+1<queue.length&&queue[child+1][0]<queue[child][0])child++;if(queue[child][0]>=last[0])break;queue[i]=queue[child];i=child}queue[i]=last}return first};
  while(queue.length){const[d,id]=pop();if(d!==distance.get(id))continue;if(id===b)break;for(const[next,weight]of this.adj.get(id)||[])if(d+weight<(distance.get(next)??Infinity)){distance.set(next,d+weight);previous.set(next,id);push([d+weight,next])}}
  if(!distance.has(b))throw Error('현행 OSM 선로 단절');const ids=[b];let id=b;while(id!==a){id=previous.get(id);if(!id)throw Error('현행 선로 경로 누락');ids.unshift(id)}const points=ids.map(id=>this.points.get(id));this.cache.set(signature,points);return points;
 }
 joinCodes(ids){const keys=ids.map(id=>this.stationKeys.get(String(id))).filter((id,i,a)=>id&&id!==a[i-1]);if(keys.length<2)throw Error('현행 선로의 역 기준점 부족');return this.joinKeys(keys);}
 joinKeys(keys){const points=[];for(let i=1;i<keys.length;i++){const p=this.path(keys[i-1],keys[i]);points.push(...(points.length?p.slice(1):p))}if(points.length<2)throw Error('현행 선로 좌표 부족');return points;}
 verifyRoute(points){const keys=points.map(p=>this.pointKey(p));if(keys.some(k=>!k))throw Error('현행 운행 경로에 OSM 원본이 없는 꼭짓점이 있습니다.');return this.joinKeys(keys.filter((k,i)=>i===0||k!==keys[i-1]));}
}
function currentPattern(data,meta,rail,names,stationFn){
 if(meta.freight||meta.cat!=='passenger'||meta.cancel||meta.state==='cancelled')throw Error('운영 중인 여객 열차 아님');
 const calls=data.stops?.filter(s=>s.stopHere===true);if(!calls?.length||!calls[0].first||!calls.at(-1).last)throw Error('현행 전체 시·종착 정차 원본 부족');
 const clean=s=>String(s||'').replace(/กรุงเทพ\s*\(หัวลำโพง\)|กรุงเทพ/g,'กรุงเทพ').replace(/\s|\([^)]*\)/g,'');
 if(clean(meta.from)!==clean(calls[0].n)||clean(meta.to)!==clean(calls.at(-1).n))throw Error('현행 실제 종착역이 선로·정차 원본과 다릅니다: '+meta.from+' → '+meta.to);
 if(!data.route?.length)throw Error('현행 실제 선로 경로 없음');const geometry=rail.verifyRoute(data.route),records=calls.map(s=>({id:s.c,th:s.n,en:s.e,lat:s.p?.[0],lon:s.p?.[1]}));if(records.some(s=>!s.id||!Number.isFinite(s.lat)||!Number.isFinite(s.lon)))throw Error('현행 역 식별자·좌표 없음');
 const aligned=align(geometry,records),stations=records.map((s,i)=>({...stationFn(s,names.get(s.id)),latitude:aligned.geometry[aligned.indices[i]][0],longitude:aligned.geometry[aligned.indices[i]][1],geometryIndex:aligned.indices[i],coordinateSource:'https://rotfai.live/api/network'}));
 return{stations,geometry:aligned.geometry,calls,passedStationIds:(data.stops||[]).filter(s=>s.stopHere===false).map(s=>s.c),alignmentMaxErrorKm:aligned.maxErrorKm};
}
module.exports={CurrentRailGraph,currentPattern};
