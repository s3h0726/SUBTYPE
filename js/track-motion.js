// Sample retained source polyline edges by travelled distance. Smoothing a
// marker's latitude/longitude instead would cut across bends and switches.
export function pointAtTrackDistance(path,distance){
 const {segment,lengths,total}=path;if(!segment?.length)return null;
 if(segment.length===1||total<=0)return segment[0].slice();
 const d=Math.max(0,Math.min(total,distance));let low=1,high=lengths.length-1;
 while(low<high){const middle=(low+high)>>1;if(lengths[middle]<d)low=middle+1;else high=middle}
 const i=low,a=segment[i-1],b=segment[i],span=lengths[i]-lengths[i-1],t=span>0?(d-lengths[i-1])/span:0;
 return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
}
export function advanceTrackDistance(current,target,dt){return Math.max(current,Math.min(target,current+(target-current)*(1-Math.exp(-Math.min(40,Math.max(1,dt))/75))))}
