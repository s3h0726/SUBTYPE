#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const plain=s=>s.replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
(async()=>{
 const pages=[],facts=[];
 async function get(url){const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(response.status+':'+url);const html=await response.text();pages.push({url,retrievedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(html).digest('hex')});return html}
 const kyushuUrl='https://www.jrkyushu.co.jp/railway/station/';
 const kyushu=await get(kyushuUrl);
 for(const m of kyushu.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>\s*<em>([^<]+)<\/em>\s*<span>([^<]+)<\/span>\s*<\/a>/g))facts.push({operatorId:'jr-kyushu',ja:m[2],kana:m[3],source:new URL(m[1],kyushuUrl).href,listSource:kyushuUrl});
 const eastUrl='https://www.jreast.co.jp/en/multi/stations/',east=await get(eastUrl);
 for(const m of east.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>\s*<!--wovn-src:([^>]+)-->([\s\S]*?)<\/a>/g)){
  const en=plain(m[3].replace(/<span\b[^>]*class="screen-reader-text"[^>]*>[\s\S]*?<\/span>/g,''));
  if(!/\/stations\//.test(m[1])||!/[\u3040-\u30ff\u3400-\u9fff]/.test(m[2])||!en||/[\u3040-\u30ff\u3400-\u9fff]/.test(en))continue;
  facts.push({operatorId:'jr-east',ja:m[2],en,source:new URL(m[1],eastUrl).href,listSource:eastUrl});
 }
 const eastLinks=new Map;
 for(const m of east.matchAll(/<a\b[^>]*href="([^"<>]*\/stations\/e(\d+)\.html)"[^>]*>([\s\S]*?)<\/a>/g)){
  const en=plain(m[3].replace(/<span\b[^>]*class="screen-reader-text"[^>]*>[\s\S]*?<\/span>/g,''));
  if(/^[A-Za-z][A-Za-z0-9 &'’().-]+$/.test(en))eastLinks.set(m[2],{href:m[1],en});
 }
 for(const [id,entry] of eastLinks){
  const jaSource='https://www.jreast.co.jp/estation/stations/'+id+'.html';
  try{const html=await get(jaSource),title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'',ja=title.match(/情報（(.+?)駅）/)?.[1];if(ja)facts.push({operatorId:'jr-east',ja,en:entry.en,source:new URL(entry.href,eastUrl).href,listSource:eastUrl,japaneseSource:jaSource})}catch(e){pages.push({url:jaSource,error:e.message})}
 }
 const aikanUrl='https://www.aikanrailway.co.jp/station/index.html',aikan=await get(aikanUrl);
 const links=[];
 for(const m of aikan.matchAll(/<a\b[^>]*href="(\.\/[^"/]+\.html)"[^>]*>[\s\S]*?<span class="notranslate">([^<(]+)\s*\(([^)]+)\)<\/span>\s*<\/a>/g)){
  const fact={operatorId:'aichikanjotetsudo',ja:m[2].trim(),en:m[3].trim(),source:new URL(m[1],aikanUrl).href,listSource:aikanUrl};facts.push(fact);links.push(fact);
 }
 for(const fact of links){const html=await get(fact.source),match=html.match(/([ぁ-ゖァ-ヺー]+)\s*\/\s*([A-Za-z][A-Za-z\s-]+)/);if(match)fact.kana=match[1]}
 const unique=[...new Map(facts.map(f=>[[f.operatorId,f.ja,f.kana||'',f.en||''].join('::'),f])).values()];
 fs.writeFileSync(path.join(root,'data/source-audit/japan-official-names-20261101.json'),JSON.stringify({schemaVersion:1,date:'2026-11-01',pages,facts:unique},null,2)+'\n');
 console.log(JSON.stringify({pages:pages.length,facts:unique.length,byOperator:unique.reduce((a,f)=>(a[f.operatorId]=(a[f.operatorId]||0)+1,a),{})}));
})().catch(e=>{console.error(e);process.exitCode=1});
