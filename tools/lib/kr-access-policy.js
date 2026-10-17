'use strict';
const fs=require('node:fs'),path=require('node:path');
const modes=new Set(['rail','subway','light_rail','tram','monorail','funicular','narrow_gauge']);
function railwayWayRejection(tags={}){
 if(tags.highway)return tags.railway?'AMBIGUOUS_RAIL_ROAD_WAY':'ROAD_WAY';
 if(!modes.has(tags.railway))return 'NON_OPERATING_RAILWAY_WAY';
 return null;
}
function validateAccessPolicy(policy,services){
 if(!policy)return;
 if(policy.relations.length!==62||new Set(policy.relations.map(r=>r.number)).size!==62||new Set(policy.relations.map(r=>r.osmRelationId)).size!==62)throw Error('INVALID_62_RELATION_POLICY');
 const ids=new Set(services.map(s=>s.id));
 for(const r of policy.relations)if(!ids.has('kr-osm-service-'+r.osmRelationId)||!r.classification||typeof r.passengerCandidate!=='boolean')throw Error('INVALID_RELATION_ACCESS:'+r.osmRelationId);
}
function applyAccessPolicy(services,policy){
 validateAccessPolicy(policy,services);const byId=new Map(policy.relations.map(r=>['kr-osm-service-'+r.osmRelationId,r]));
 for(const s of services){const r=byId.get(s.id);if(!r)continue;s.access={number:r.number,classification:r.classification,passengerCandidate:r.passengerCandidate,reason:r.reason};if(!r.passengerCandidate){s.status='excluded';s.playable=false}}
}
function writeBrowserAccessPolicy(base,policy){
 const rows=policy.relations.filter(r=>!r.passengerCandidate).map(r=>({relationId:String(r.osmRelationId),lineIds:r.lineIds,reason:r.reason,classification:r.classification}));
 fs.writeFileSync(path.resolve(base,'../../../js/korean-access-data.js'),'/* Generated from data/kr/v2/relation-access-policy.json. */\nexport const KR_BLOCKED_SOURCE_RELATIONS='+JSON.stringify(rows)+';\n');
}
module.exports={railwayWayRejection,validateAccessPolicy,applyAccessPolicy,writeBrowserAccessPolicy};
