'use strict';
const crypto=require('node:crypto');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const bytesHash=v=>crypto.createHash('sha256').update(v).digest('hex');
function officialHumetroStations(html){
 const block=html.split('<div class="line-1">')[1]?.split('<!-- 2호선 -->')[0];
 if(!block)throw Error('MISSING_OFFICIAL_LINE_SECTION');
 const rows=[...block.matchAll(/one_point\('(\d+)', '1', '[^']*', event[^\n]*?<span class="sta-title">([^<]+)/g)].map(m=>({code:m[1],name:m[2].trim()}));
 if(rows.length!==40||new Set(rows.map(r=>r.code)).size!==40)throw Error('OFFICIAL_STATION_COUNT_DRIFT');
 return rows;
}
function bindSourceStops(relation,nodes,config,officialBytes){
 if(digest(relation)!==config.relationHash||bytesHash(officialBytes)!==config.officialSha256)throw Error('STALE_STOP_BINDING_SOURCE');
 const official=officialHumetroStations(officialBytes.toString('utf8'));
 const members=relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role));
 if(relation.tags.operator!=='부산교통공사')throw Error('OPERATOR_IDENTITY_MISMATCH');
 if(members.length!==official.length)throw Error('INCOMPLETE_OFFICIAL_STOP_ORDER');
 const bindings=new Map(config.bindings.map(b=>[b.originalNodeId,b]));
 const result=members.map((member,i)=>{
  const binding=bindings.get(member.ref),original=nodes.get(member.ref),bound=nodes.get(binding?.boundNodeId||member.ref),expected=official[i];
  const alias=config.nameBindings?.find(a=>a.nodeId===member.ref&&a.sourceName===original?.tags.name&&a.officialName===expected.name&&a.nodeHash===digest(original));
  if(!original||!bound||!/^\d+$/.test(original.tags.ref||'')||String(Number(original.tags.ref))!==expected.code||String(Number(bound.tags.ref))!==expected.code||(!alias&&(original.tags.name!==expected.name||bound.tags.name!==expected.name)))throw Error('STATION_IDENTITY_OR_ORDER_MISMATCH:'+member.ref);
  if(binding&&(original.tags.operator!=='부산교통공사'||bound.tags.operator!==original.tags.operator))throw Error('STOP_OPERATOR_MISMATCH');
  if(binding&&(bound.tags.public_transport!=='stop_position'||bound.tags.railway!=='stop'||digest(original)!==binding.originalNodeHash||digest(bound)!==binding.boundNodeHash))throw Error('STOP_POSITION_EVIDENCE_MISMATCH');
  return {...member,ref:bound.id};
 });
 if(bindings.size!==config.bindings.length||config.bindings.some(b=>!members.some(m=>m.ref===b.originalNodeId)))throw Error('UNUSED_OR_DUPLICATE_STOP_BINDING');
 return result;
}
module.exports={bindSourceStops,officialHumetroStations,digest};
