'use strict';
// 위경도 순서를 [위도, 경도]로 통일한다. 없는 선로를 직선으로 보충하지 않는다.
const km=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos((a[0]+b[0])*Math.PI/360));
const length=points=>points.slice(1).reduce((d,p,i)=>d+km(points[i],p),0);
function nearest(points,target,minimum=0){let best=null,d=0;for(let i=0;i<points.length-1;i++){
 const a=points[i],b=points[i+1],n=km(a,b),scale=Math.cos(target[0]*Math.PI/180),dx=(b[1]-a[1])*scale,dy=b[0]-a[0],t=Math.max(0,Math.min(1,((target[1]-a[1])*scale*dx+(target[0]-a[0])*dy)/(dx*dx+dy*dy||1))),p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],at=d+n*t,error=km(p,target);
 if(at>=minimum&&(!best||error<best.error))best={index:i,t,point:p,distance:at,error};d+=n;
 }return best;}
function align(points,stations,tolerance=.4){
 const anchors=[];let previous=-1e-6;for(const s of stations){const a=nearest(points,[s.lat,s.lon],previous+1e-6);if(!a||a.error>tolerance)throw Error('역·선로 불일치: '+s.id+' '+s.th+' '+(a?.error??Infinity).toFixed(3)+'km');anchors.push(a);previous=a.distance;}
 const geometry=[],indices=[];for(let i=0;i<anchors.length;i++){const a=anchors[i];if(i)for(let j=anchors[i-1].index+1;j<=a.index;j++)if(!geometry.length||km(geometry.at(-1),points[j])>1e-8)geometry.push(points[j]);if(!geometry.length||km(geometry.at(-1),a.point)>1e-8)geometry.push(a.point);indices.push(geometry.length-1);}
 if(indices.some((n,i)=>i&&n<=indices[i-1]))throw Error('중복·역행 역 좌표');
 return{geometry,indices,maxErrorKm:Math.max(...anchors.map(a=>a.error))};
}
class TrackGraph{
 constructor(segments){this.edges=new Map();this.adj=new Map();this.cache=new Map();for(const[key,source]of Object.entries(segments)){const[a,b]=key.split('|'),points=source.map(p=>[p[1],p[0]]);this.edges.set(key,{a,b,points,length:length(points)});for(const [from,to,reverse]of[[a,b,false],[b,a,true]]){if(!this.adj.has(from))this.adj.set(from,[]);this.adj.get(from).push({to,key,reverse,weight:length(points)})}}}
 path(a,b){if(a===b)return[];const key=a+'>'+b;if(this.cache.has(key))return this.cache.get(key);const distances=new Map([[a,0]]),prev=new Map(),done=new Set();while(true){let current=null,best=Infinity;for(const[id,d]of distances)if(!done.has(id)&&d<best){current=id;best=d}if(current===null)throw Error('선로 단절: '+a+' → '+b);if(current===b)break;done.add(current);for(const edge of this.adj.get(current)||[])if(best+edge.weight<(distances.get(edge.to)??Infinity)){distances.set(edge.to,best+edge.weight);prev.set(edge.to,{from:current,...edge})}}const result=[];let v=b;while(v!==a){const e=prev.get(v);result.unshift(e);v=e.from}this.cache.set(key,result);return result;}
 join(ids){const edges=ids.slice(1).flatMap((to,i)=>this.path(ids[i],to)),points=[];for(const e of edges){let p=this.edges.get(e.key).points.map(p=>[...p]);if(e.reverse)p.reverse();if(points.length){let gap=km(points.at(-1),p[0]);
  // 서로 겹치는 원본 선로의 시작 위치만 잘라낸다. 누락 구간을 직선으로 만들지 않는다.
  if(gap>.015){const forward=nearest(p,points.at(-1)),back=nearest(points,p[0]);if(forward?.error<.003&&forward.distance<.3){p=[points.at(-1),...p.slice(forward.index+1)];gap=0}else if(back?.error<.003&&length(points)-back.distance<.3){points.splice(back.index+1);points.push(p[0]);gap=0}}
  if(gap>.015)throw Error('선로 접속 틈: '+e.key+' '+gap.toFixed(3)+'km');p=p.slice(1)}for(const point of p)if(!points.length||km(points.at(-1),point)>1e-8)points.push(point)}if(points.length<2)throw Error('선로 좌표 부족');return{points,edges:edges.map(e=>({key:e.key,reverse:e.reverse}))};}
}
module.exports={km,length,nearest,align,TrackGraph};
