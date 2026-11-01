#!/usr/bin/env node
'use strict';
// Read-only source collection. An exact Japanese-name cell and a station
// article link must agree; neither transliteration nor fuzzy matching is used.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {discoverLineFolders,read,loadStations}=require('./lib/line-workspaces');
const root=path.resolve(__dirname,'..'),out=path.join(root,'data/source-audit/japan-name-evidence-20261101.json');
const {chromium}=require(process.env.SUBTYPE_PLAYWRIGHT||'playwright');
const master=loadStations().map,scoped=read(path.join(root,'data/japan-route-station-names.json')).routes;
const prior=fs.existsSync(out)?read(out):{schemaVersion:1,date:'2026-11-01',policy:'Exact Japanese identity in station-table cell plus Korean station-article link. Korean-only evidence does not verify English, reading, code or coordinates.',pages:[]};
prior.pages=prior.pages.filter(p=>p.parserVersion===2);
const done=new Set(prior.pages.map(p=>p.lineId));
const save=()=>fs.writeFileSync(out,JSON.stringify(prior,null,2)+'\n');
const jobs=discoverLineFolders().map(folder=>({folder,line:read(path.join(folder,'line.json'))})).filter(x=>!done.has(x.line.id));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 let cursor=0;
 async function worker(){
  const page=await browser.newPage();await page.route('**/*',r=>r.abort());
  while(cursor<jobs.length){
   const {folder,line}=jobs[cursor++];
   const rels=read(path.join(folder,'stations.json'));
   const names=rels.map(r=>({id:r.stationId,ja:scoped[line.id]?.[r.stationId]?.ja||master.get(r.stationId)?.names?.ja}));
   const source=line.sources?.koreanName||{};
   let title=source.wikiTitle||line.namuwikiSourceLineName||'';
   if(!title&&/\/w\//.test(source.url||'')){try{title=decodeURIComponent(source.url.split('/w/')[1].split(/[?#]/)[0])}catch{}}
   if(!title)title=line.names.ko.replace(/\s*[（(][^）)]*[~〜～–-][^）)]*[）)]\s*$/,'');
   const url='https://namu.wiki/w/'+encodeURIComponent(title);
   const result={parserVersion:2,lineId:line.id,operatorId:line.operatorId,requestedUrl:url,retrievedAt:new Date().toISOString(),matches:[]};
   try{
    const response=await fetch(url,{signal:AbortSignal.timeout(18000)}),html=await response.text();
    result.httpStatus=response.status;result.url=response.url;result.sha256=crypto.createHash('sha256').update(html).digest('hex');
    await page.setContent(html,{waitUntil:'domcontentloaded',timeout:12000});
    const parsed=await page.evaluate(names=>{
     const norm=s=>s.replace(/\s/g,'');
     const rows=[...document.querySelectorAll('tr')];
     const matches=[];
     for(const st of names){
      const found=[];
      for(const row of rows){
       // Ignore enclosing layout tables: a station table row has direct cells.
       const cells=[...row.children].filter(c=>/^(TD|TH)$/.test(c.tagName));
       const exact=cells.filter(c=>{
        if(c.querySelector('table'))return false;
        const copy=c.cloneNode(true);
        copy.querySelectorAll('rt,rp,sup').forEach(n=>n.remove());
        copy.querySelectorAll('a').forEach(n=>{if(/[가-힣]/.test(n.textContent))n.remove()});
        const japanese=norm(copy.textContent).replace(/^[（(]|[）)]$/g,'');
        return japanese===norm(st.ja)||norm(c.textContent)===norm(st.ja);
       });
       if(!exact.length)continue;
       for(const cell of exact){
        // Some tables separate Korean and Japanese columns. Prefer same-cell links.
        let links=[...cell.querySelectorAll('a[href]')];
        if(!links.length)links=cells.filter(c=>!c.querySelector('table')).flatMap(c=>[...c.querySelectorAll('a[href]')]);
        const stationLinks=links.map(a=>({ko:a.textContent.trim().replace(/역$/,''),href:a.getAttribute('href')})).filter(a=>{
         try{return /^\/w\//.test(a.href)&&/역(?:\(|$|\/)/.test(decodeURIComponent(a.href.slice(3)).split('#')[0])&&/[가-힣]/.test(a.ko)&&!/[\u3040-\u30ff\u3400-\u9fff]/.test(a.ko)&&a.ko.length<45}catch{return false}
        });
        const unique=[...new Map(stationLinks.map(a=>[a.ko,a])).values()];
        if(unique.length===1)found.push({...unique[0],cellJapanese:st.ja});
       }
      }
      const unique=[...new Map(found.map(a=>[a.ko,a])).values()];
      if(unique.length===1)matches.push({stationId:st.id,ja:st.ja,...unique[0]});
     }
     return{title:document.title,matches};
    },names);
    result.title=parsed.title;
    result.matches=response.ok&&/나무위키/.test(parsed.title)?parsed.matches:[];
    result.status=result.matches.length?'MATCHED':'NO_EXACT_MATCH';
   }catch(e){result.status='ACCESS_FAILED';result.error=e.message}
   prior.pages.push(result);save();
   if(prior.pages.length%25===0)console.log(JSON.stringify({pages:prior.pages.length,total:done.size+jobs.length,matches:prior.pages.reduce((n,p)=>n+p.matches.length,0)}));
  }
  await page.close();
 }
 try{await Promise.all([worker(),worker(),worker()])}finally{await browser.close();save()}
 console.log(JSON.stringify({pages:prior.pages.length,matches:prior.pages.reduce((n,p)=>n+p.matches.length,0),statuses:prior.pages.reduce((a,p)=>(a[p.status]=(a[p.status]||0)+1,a),{})}));
})().catch(e=>{console.error(e);process.exitCode=1});
