// Weighted station-to-station railway routing for the CUSTOM studio.
// Only registered adjacent stops are connected; no proximity or straight-line shortcuts.
const customRad = value => value * Math.PI / 180;
export function customRailDistance(a,b){
  const lat1=Number(Array.isArray(a)?a[0]:a?.latitude),lon1=Number(Array.isArray(a)?a[1]:a?.longitude);
  const lat2=Number(Array.isArray(b)?b[0]:b?.latitude),lon2=Number(Array.isArray(b)?b[1]:b?.longitude);
  if(![lat1,lon1,lat2,lon2].every(Number.isFinite)||Math.abs(lat1)>90||Math.abs(lat2)>90)return null;
  const dLat=customRad(lat2-lat1),dLon=customRad(lon2-lon1),h=Math.sin(dLat/2)**2+Math.cos(customRad(lat1))*Math.cos(customRad(lat2))*Math.sin(dLon/2)**2;
  return 12742000*Math.asin(Math.min(1,Math.sqrt(h)));
}
const customPolylineLength=points=>{
  if(!Array.isArray(points)||points.length<2)return null;
  let length=0;
  for(let i=1;i<points.length;i++){
    const metres=customRailDistance(points[i-1],points[i]);
    if(metres===null)return null;
    length+=metres;
  }
  return length>0?length:null;
};
export function customTrackLength(route,fromIndex,toIndex){
  const stops=route.stations||[],a=stops[fromIndex],b=stops[toIndex];
  if(!a||!b)return null;
  const directed=route.directedSegments?.[Math.min(fromIndex,toIndex)];
  if(Array.isArray(directed?.geometry)&&directed.geometry.length>1){
    const length=customPolylineLength(directed.geometry);
    if(length!==null)return{metres:length,approximate:false};
  }
  const from=a.geometryIndex,to=b.geometryIndex,geo=route.geometry;
  if(Number.isInteger(from)&&Number.isInteger(to)&&from!==to&&Array.isArray(geo)){
    const lo=Math.min(from,to),hi=Math.max(from,to);
    if(lo>=0&&hi<geo.length){
      const length=customPolylineLength(geo.slice(lo,hi+1));
      if(length!==null)return{metres:length,approximate:false};
    }
  }
  const fallback=customRailDistance(a,b);
  return fallback===null?null:{metres:fallback,approximate:true};
}
const customCandidateBetter=(a,b)=>!b||a.cost<b.cost-0.001||(Math.abs(a.cost-b.cost)<=0.001&&(a.transfers<b.transfers||a.transfers===b.transfers&&a.hops<b.hops));
class CustomRouteMinHeap{
  constructor(){this.items=[]}
  push(value){const a=this.items;let i=a.length;a.push(value);while(i){const p=(i-1)>>1;if(!customCandidateBetter(value,a[p]))break;a[i]=a[p];i=p}a[i]=value}
  pop(){const a=this.items,top=a[0],last=a.pop();if(a.length){let i=0;while(2*i+1<a.length){let k=2*i+1;if(k+1<a.length&&customCandidateBetter(a[k+1],a[k]))k++;if(!customCandidateBetter(a[k],last))break;a[i]=a[k];i=k}a[i]=last}return top}
  get length(){return this.items.length}
}
export class CustomShortestPath{
  static stationKey(station){return String(station?.twTransferKey||station?.stationMasterId||station?.sourceStationId||station?.id||'')}
  constructor(routes=[]){this.setRoutes(routes)}
  setRoutes(routes){
    this.graph=new Map();
    for(const route of routes||[]){
      if(route?.category==='custom'||!Array.isArray(route?.stations)||route.stations.length<2)continue;
      for(let i=0;i<route.stations.length-1;i++){
        const from=route.stations[i],to=route.stations[i+1],a=CustomShortestPath.stationKey(from),b=CustomShortestPath.stationKey(to);
        if(!a||!b||a===b)continue;
        if(to.airportIncomingTransfer||route.airportTransfers?.some(transfer=>transfer.toIndex===i+1))continue;
        const length=customTrackLength(route,i,i+1);
        if(!length)continue;
        const add=(src,dst,fromIndex,toIndex)=>{
          if(!this.graph.has(src))this.graph.set(src,[]);
          this.graph.get(src).push({to:dst,route,fromIndex,toIndex,metres:Math.max(1,length.metres),approximate:length.approximate});
        };
        add(a,b,i,i+1);
        if(route.countryId!=='hk'&&(route.countryId!=='kr'||route.schemaVersion!==2))add(b,a,i+1,i);
      }
    }
    return this;
  }
  find(from,to,{maxEdges=299}={}){
    const origin=String(from||''),target=String(to||'');
    if(!origin||!target||origin===target||!this.graph.has(origin))return null;
    const key=(station,route)=>station+'\u0000'+route;
    const first={station:origin,routeId:'',cost:0,transfers:0,hops:0,approximate:0,previous:null,edge:null};
    const heap=new CustomRouteMinHeap(),best=new Map([[key(origin,''),first]]);heap.push(first);
    while(heap.length){
      const state=heap.pop();
      if(best.get(key(state.station,state.routeId))!==state)continue;
      if(state.station===target){
        const edges=[];
        let node=state;
        while(node.edge){edges.push(node.edge);node=node.previous}
        edges.reverse();
        return{edges,distanceMeters:state.cost,transferCount:state.transfers,approximateEdges:state.approximate};
      }
      if(state.hops>=maxEdges)continue;
      for(const edge of this.graph.get(state.station)||[]){
        const next={station:edge.to,routeId:edge.route.id,cost:state.cost+edge.metres,
          transfers:state.transfers+(state.routeId&&state.routeId!==edge.route.id?1:0),
          hops:state.hops+1,approximate:state.approximate+(edge.approximate?1:0),
          previous:state,edge};
        const nextKey=key(next.station,next.routeId);
        if(customCandidateBetter(next,best.get(nextKey))){best.set(nextKey,next);heap.push(next)}
      }
    }
    return null;
  }
}
