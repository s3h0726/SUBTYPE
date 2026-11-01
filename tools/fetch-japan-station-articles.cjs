#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadStations,read}=require('./lib/line-workspaces');
const root=path.resolve(__dirname,'..'),out=path.join(root,'data/source-audit/japan-station-articles-20261101.json');
const evidence=read(path.join(root,'data/source-audit/japan-name-evidence-20261101.json'));
const stations=loadStations().map,scoped=read(path.join(root,'data/japan-route-station-names.json')).routes;
const state=fs.existsSync(out)?read(out):{schemaVersion:1,date:'2026-11-01',policy:'Article identity must match exact Japanese station header. Namu readings and English are supporting evidence, not operator certification.',articles:[]};
const jobs=new Map;
for(const p of evidence.pages)for(const m of p.matches){const key=m.href+'::'+m.ja;if(!jobs.has(key))jobs.set(key,{key,href:m.href,ja:m.ja,ko:m.ko,stationId:m.stationId,priority:stations.get(m.stationId)?.names.ko!==m.ko?0:1})}
for(const s of stations.values())if(![...jobs.values()].some(j=>j.stationId===s.id)){
 const href='/w/'+encodeURIComponent(s.names.ko+'역'),key=href+'::'+s.names.ja;
 jobs.set(key,{key,href,ja:s.names.ja,ko:s.names.ko,stationId:s.id,priority:2});
}
for(const names of Object.values(scoped))for(const [id,s] of Object.entries(names)){
 const href='/w/'+encodeURIComponent(s.ko+'역'),key=href+'::'+s.ja;
 if(!jobs.has(key))jobs.set(key,{key,href,ja:s.ja,ko:s.ko,stationId:id,priority:2});
}
const done=new Set(state.articles.filter(a=>a.httpStatus!==429&&a.status!=='ACCESS_FAILED').map(a=>a.key));
const queue=[...jobs.values()].filter(j=>!done.has(j.key)).sort((a,b)=>a.priority-b.priority||a.key.localeCompare(b.key));
const save=()=>{fs.writeFileSync(out,JSON.stringify(state,null,2)+'\n')};
function parseArticle(html,ja){
 const decode=s=>s.replace(/&#(x[\da-f]+|\d+);/gi,(_,v)=>String.fromCodePoint(v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v))).replace(/&amp;/g,'&').replace(/&nbsp;/g,' ');
 const text=(s,reading)=>decode((reading?s.replace(/<ruby\b[^>]*>([\s\S]*?)<\/ruby>/gi,(_,body)=>{const rt=[...body.matchAll(/<rt\b[^>]*>([\s\S]*?)<\/rt>/gi)];return rt.length?rt.map(m=>m[1].replace(/<[^>]+>/g,'')).join(''):body}):s).replace(/<(rt|rp|sup)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<br\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,''));
 const title=decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
 const norm=s=>s.replace(/\s/g,'');
 for(const h of html.matchAll(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi)){
  const base=text(h[2],false).split('\n').map(s=>s.trim()),kana=text(h[2],true).split('\n').map(s=>s.trim());
  const idx=base.findIndex(s=>[ja+'駅',ja+'停留場',ja].some(j=>norm(s)===norm(j)));if(idx<0)continue;
  const reading=kana[idx].replace(/(?:駅|停留場)$/,'');
  return{title,identityMatched:true,japanese:ja,reading:/^[ぁ-ゖァ-ヺー・\s]+$/.test(reading)?reading.replace(/\s/g,''):null,english:base.find(s=>/^[A-Za-z][A-Za-z0-9\s.'’():&\-–ōūāēī]+(?:Station|Stop)$/u.test(s))?.replace(/\s+(Station|Stop)$/,'')||null,officialLinks:[...html.matchAll(/href="(https?:[^"<>]+)"/g)].map(m=>decode(m[1])).filter(h=>/jrhokkaido|jreast|jr-central|westjr|jr-shikoku|jrkyushu|tokyometro|kotsu\.metro|keisei|tobu\.co|seibu|odakyu|keio|tokyu|hankyu|hanshin|kintetsu|nankai|meitetsu|subway|railway/.test(h)).slice(0,12)};
 }
 return{title,identityMatched:false};
}
(async()=>{
 let cursor=0,rateLimited=false;
 async function worker(){
  while(cursor<queue.length&&!rateLimited){const job=queue[cursor++],record={...job,url:'https://namu.wiki'+job.href,retrievedAt:new Date().toISOString()};
   try{
    const response=await fetch(record.url,{signal:AbortSignal.timeout(15000)}),html=await response.text();record.httpStatus=response.status;record.sha256=crypto.createHash('sha256').update(html).digest('hex');
    if(response.status===429){rateLimited=true;state.rateLimit={observedAt:new Date().toISOString(),retryAfter:response.headers.get('retry-after'),remaining:queue.length-cursor};}
    if(response.ok)Object.assign(record,parseArticle(html,job.ja));
    record.status=record.identityMatched?'ARTICLE_IDENTITY_MATCHED':response.ok?'IDENTITY_NOT_MATCHED':'ARTICLE_UNAVAILABLE';
   }catch(e){record.status='ACCESS_FAILED';record.error=e.message}
   state.articles.push(record);
   if(state.articles.length%50===0){save();console.log(JSON.stringify({articles:state.articles.length,total:jobs.size,matched:state.articles.filter(a=>a.identityMatched).length}))}
  }
 }
 try{await Promise.all(Array.from({length:6},()=>worker()))}finally{save()}
 console.log(JSON.stringify({articles:state.articles.length,total:jobs.size,matched:state.articles.filter(a=>a.identityMatched).length}));
})().catch(e=>{save();console.error(e);process.exitCode=1});
