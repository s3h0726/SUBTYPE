'use strict';
const {distance,coordinate}=require('./kr-canonical.cjs');
function projection(point,a,b){
 const cos=Math.cos(point[0]*Math.PI/180),x=(b[1]-a[1])*cos,y=b[0]-a[0],px=(point[1]-a[1])*cos,py=point[0]-a[0];
 const t=Math.max(0,Math.min(1,(px*x+py*y)/(x*x+y*y||1)));
 const projected=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];
 return{t,point:projected,offset:distance(point,projected)};
}
// Insert only collinear points on an identified source edge. Original bends,
// junctions and one-way source ordering are retained exactly; never route stops.
function bindStopsToShape(shape,stops){
 if(shape.length<2||stops.length<2||shape.some(p=>!coordinate(p)))throw Error('SOURCE_GEOMETRY_INVALID');
 const cumulative=[0];for(let i=1;i<shape.length;i++){const step=distance(shape[i-1],shape[i]);if(step>2)throw Error('SOURCE_GEOMETRY_GAP');cumulative.push(cumulative.at(-1)+step)}
 let previous=[];
 for(let i=0;i<stops.length;i++){
  const stop=stops[i],point=[Number(stop.posY),Number(stop.posX)];if(!coordinate(point))throw Error('STOP_COORDINATES_INVALID:'+i);
  const candidates=[];
  for(let edge=0;edge<shape.length-1;edge++){
   const a=shape[edge],b=shape[edge+1];
   if(point[0]<Math.min(a[0],b[0])-.0015||point[0]>Math.max(a[0],b[0])+.0015||point[1]<Math.min(a[1],b[1])-.002||point[1]>Math.max(a[1],b[1])+.002)continue;
   const p=projection(point,a,b);if(p.offset>.15)continue;
   const position=edge+p.t,along=cumulative[edge]+p.t*(cumulative[edge+1]-cumulative[edge]);
   if(candidates.some(c=>Math.abs(c.position-position)<1e-8))continue;
   const candidate={...p,edge,position,along,score:Infinity,parent:null};
   if(i===0){if(along>1.5)continue;candidate.score=p.offset*p.offset*40+along*.001}
   else{
    const expected=Math.max(.05,Number(stop.guganLen||0)/1000),maximum=Math.max(2,expected*1.8+.5);
    for(const before of previous){const delta=along-before.along;if(position<=before.position+1e-8||delta>maximum)continue;
     const score=before.score+p.offset*p.offset*40+Math.pow((delta-expected)/Math.max(.2,expected),2)*.01;
     if(score<candidate.score){candidate.score=score;candidate.parent=before}
    }
   }
   if(Number.isFinite(candidate.score))candidates.push(candidate);
  }
  if(!candidates.length)throw Error('NO_ORDERED_ROAD_BINDING:'+String(stop.stationOrd||i+1));
  previous=candidates;
 }
 let current=previous.reduce((a,b)=>a.score<b.score?a:b),bindings=[];while(current){bindings.push(current);current=current.parent}bindings.reverse();
 const inserts=new Map;for(let i=0;i<bindings.length;i++){const b=bindings[i];if(!inserts.has(b.edge))inserts.set(b.edge,[]);inserts.get(b.edge).push({binding:b,stopIndex:i})}
 const geometry=[],indexes=[],sourcePositions=[];
 const append=(p,pos)=>{if(geometry.length&&JSON.stringify(geometry.at(-1))===JSON.stringify(p))return geometry.length-1;geometry.push(p);sourcePositions.push(pos);return geometry.length-1};
 for(let edge=0;edge<shape.length-1;edge++){
  append(shape[edge],edge);
  for(const item of (inserts.get(edge)||[]).sort((a,b)=>a.binding.t-b.binding.t))indexes[item.stopIndex]=append(item.binding.point,item.binding.position);
 }
 append(shape.at(-1),shape.length-1);
 if(indexes.some((index,i)=>i&&index<=indexes[i-1]))throw Error('COINCIDENT_STOP_VISITS');
 return{geometry,indexes,sourcePositions,bindings:bindings.map(({parent,score,...b})=>b),maximumOffsetKm:Math.max(...bindings.map(b=>b.offset))};
}
module.exports={projection,bindStopsToShape};
