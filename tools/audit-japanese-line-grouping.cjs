#!/usr/bin/env node
// Japanese line separation inventory: physical lines vs operating service vs JR sections.
// Audits ALL canonical workspace lines without modifying rails, stations or route visibility.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/lines'),items=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else if(ent.name==='line.json'){const x=JSON.parse(fs.readFileSync(full,'utf8'));items.push({id:x.id,operatorId:x.operatorId,ja:x.names?.ja,ko:x.names?.ko,path:path.relative(root,full).replaceAll(path.sep,'/'),category:x.category,legacy:x.legacy||{},stationsPath:path.join(path.dirname(full),'stations.json')})}}}
walk(base);
const groups=new Map;for(const x of items){const key=x.operatorId+'::'+x.ja;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)}
const duplicateNames=[...groups.values()].filter(g=>g.length>1).map(g=>({operatorId:g[0].operatorId,ja:g[0].ja,ko:g[0].ko,ids:g.map(x=>x.id),files:g.map(x=>x.path),reason:'Identical Japanese line title appears as multiple canonical cards; review for physical sections or duplicates'}));
const services=items.filter(x=>/\d+[号고]?(?:線|계통)|[１２３４５６７８９]号線|\d+系統|[１２３４５６７８９]系統|[ABＡＢ]系統|循環(?:線|系統)/.test((x.ja||'')+' '+(x.ko||''))).map(x=>({id:x.id,operatorId:x.operatorId,ja:x.ja,ko:x.ko,reason:'May denote a numbered operating service rather than a unique physical track'}));
const trunkOverlap=[];
const byOperator=new Map;for(const x of items){if(!byOperator.has(x.operatorId))byOperator.set(x.operatorId,[]);byOperator.get(x.operatorId).push(x)}
for(const [op,list] of byOperator)if(list.length>1&&list.length<=20){
 const ids=new Map;
 for(const x of list){if(!fs.existsSync(x.stationsPath))continue;const seq=JSON.parse(fs.readFileSync(x.stationsPath,'utf8')).map(y=>y.stationId);for(let i=0;i<seq.length-1;i++){const pair=[seq[i],seq[i+1]].sort().join('::');if(!ids.has(pair))ids.set(pair,new Set);ids.get(pair).add(x.id)}}
 let common=0,examples=[];for(const [pair,routes] of ids)if(routes.size>1){common++;if(examples.length<6)examples.push({pair,routes:[...routes]})}
 if(common)trunkOverlap.push({operatorId:op,routeCount:list.length,sharedStationPairs:common,examples,review:'Overlapping rail segment; determine if services share a trunk or route duplicates exist'});
}
const output={schemaVersion:1,scope:'ALL canonical Japanese route workspaces',count:items.length,policy:'No automatic deletion or merging of rail tracks; requires operator-published route/operation distinctions.',duplicateNames,serviceStyleCards:services,operatorsWithSharedTrackPairs:trunkOverlap};
const dest=path.join(root,'data/source-audit/JAPANESE_LINE_GROUPING_AUDIT.json');fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({lines:items.length,duplicateJapaneseTitles:duplicateNames.length,serviceStyleCards:services.length,operatorsWithSharedTrack:trunkOverlap.length},null,2));
