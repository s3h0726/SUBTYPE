import{KR_BLOCKED_SOURCE_RELATIONS}from'./korean-access-data.js';
const blockedRelations=new Map(KR_BLOCKED_SOURCE_RELATIONS.map(r=>[r.relationId,r]));
const blockedLines=new Map(KR_BLOCKED_SOURCE_RELATIONS.flatMap(r=>(r.lineIds||[]).map(id=>[id,r])));
export function koreanRouteBlockReason(route){
 if(typeof route==='string')route={id:route};
 const visited=new Set();
 const inspect=value=>{
  if(!value||typeof value!=='object'||visited.has(value))return null;visited.add(value);
  if(value.access?.passengerCandidate===false)return value.access.reason||'RESTRICTED_SOURCE';
  const line=blockedLines.get(value.id)||blockedLines.get(value.passengerLineId);if(line)return line.reason;
  const ids=[value.sourceRelationId,value.osmRelationId,value.source?.osmRelationId];
  for(const key of ['id','routeId','lineId','sourceRouteId','sourceLineId']){const match=String(value[key]||'').match(/^kr-osm-(?:service|line)-(\d+)$/);if(match)ids.push(match[1]);const line=blockedLines.get(value[key]);if(line)return line.reason}
  for(const ref of value.sourceRefs||[])if(ref.kind==='relation')ids.push(ref.id);
  for(const id of ids){const r=blockedRelations.get(String(id));if(r)return r.reason}
  for(const child of [...(value.segments||[]),...(value.directedSegments||[]),...(value.parts||[])]){const reason=inspect(child)||inspect(child.route)||inspect(child.source);if(reason)return reason}
  const nested=inspect(value.route)||inspect(value.source);if(nested)return nested;
  return null;
 };
 return inspect(route);
}
