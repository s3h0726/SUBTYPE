#!/usr/bin/env node
const args=Object.fromEntries(process.argv.slice(2).flatMap((value,index,list)=>value.startsWith('--')?[[value.slice(2),list[index+1]]]:[]));
const masterId=String(args.master||'');
if(!masterId)throw new Error('Missing --master');
const userAgent='SUBTYPE-geometry-audit/1.0 (build-time; contact via project repository)';
const decode=value=>String(value||'').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const attrs=value=>{const result={};for(const match of value.matchAll(/([:\w-]+)="([^"]*)"/g))result[match[1]]=decode(match[2]);return result};
const parseRelations=xml=>[...xml.matchAll(/<relation\b([^>]*)>([\s\S]*?)<\/relation>/g)].map(match=>{const data=attrs(match[1]),body=match[2],tags=Object.fromEntries([...body.matchAll(/<tag\b([^>]*)\/>/g)].map(item=>{const tag=attrs(item[1]);return[tag.k,tag.v]}));return{id:data.id,tags,members:[...body.matchAll(/<member\b([^>]*)\/>/g)].map(item=>attrs(item[1]))}});
async function fetchXml(url){const response=await fetch(url,{headers:{'User-Agent':userAgent}});if(!response.ok)throw new Error(`OSM HTTP ${response.status}: ${url}`);return response.text()}
async function main(){
  const masterXml=await fetchXml(`https://api.openstreetmap.org/api/0.6/relation/${masterId}`),master=parseRelations(masterXml)[0];
  if(!master)throw new Error(`Master ${masterId} not found`);
  const childIds=master.members.filter(member=>member.type==='relation').map(member=>member.ref),children=[];
  for(let index=0;index<childIds.length;index+=50){const ids=childIds.slice(index,index+50);children.push(...parseRelations(await fetchXml(`https://api.openstreetmap.org/api/0.6/relations?relations=${ids.join(',')}`)))}
  const output=children.map(relation=>({id:relation.id,from:relation.tags.from||'',to:relation.tags.to||'',name:relation.tags['name:ko']||relation.tags.name||'',route:relation.tags.route||'',service:relation.tags.service||'',stops:relation.members.filter(member=>member.type==='node'&&member.role?.startsWith('stop')).length})).filter(item=>item.route);
  console.log(JSON.stringify({masterId,masterName:master.tags['name:ko']||master.tags.name||'',childCount:childIds.length,routes:output},null,2));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1});
