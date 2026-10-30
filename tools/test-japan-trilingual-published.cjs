#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const extract=(p,key)=>JSON.parse(read(p).split(key)[1].trim().replace(/;\s*$/,''));
const patches=json('data/japan-trilingual-confirmed-corrections.json');
const editor=json('data/editor-overrides.json');
const ws=extract('js/line-workspace-data.js','window.TRT_EMBEDDED_LINE_WORKSPACES=');
const lite=extract('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=');
const generated=json('data/generated/line-index.json');
assert(ws.routes.length>590,'Canonical rail inventory was lost');
assert(lite.routes.length>590,'Lazy catalog rail inventory was lost');
assert.equal(ws.routes.length,lite.routes.length,'Lite route count mismatch');
const routeIds=new Set(ws.routes.map(r=>r.id)), indexIds=new Set(generated.routes.map(r=>r.id));
const issues=[],verified={stations:0,operators:0,lines:0};
const getDeployed=(id)=>{
 const meta=lite.routes.find(r=>r.id===id);
 if(!meta)throw Error('Missing lazy route '+id);
 const source=meta.lazySource.split('?')[0].replace(/^\.\//,'');
 const file=json(source);
 const record=(file.routes||[file.route||file]).find(r=>r.id===id);
 if(!record)throw Error('Missing payload of '+id+' from '+source);
 return {meta,record};
};
for(const line of patches.lines){
 const route=ws.routes.find(r=>r.id===line.id),m=lite.routes.find(r=>r.id===line.id);
 if(!route||!m)throw Error('Missing corrected line from published catalog: '+line.id);
 for(const label of ['ja','en','ko']){
  const expected=label==='ko'?(editor.lines?.[line.id]?.ko||line.ko):line[label];
  if(route.line?.[label]!==expected||m.line?.[label]!==expected)issues.push({id:line.id,type:'line',label,ws:route.line?.[label],lite:m.line?.[label],expected});
 }
 const stored=getDeployed(line.id).record;
 if(stored.line?.en!==line.en)issues.push({id:line.id,type:'chunk-line',expected:line.en,actual:stored.line?.en});
 verified.lines++;
}
for(const op of patches.operators){
 const matches=ws.routes.filter(r=>r.operatorId===op.id),index=lite.routes.filter(r=>r.operatorId===op.id);
 if(!matches.length||!index.length)throw Error('Missing corrected operator '+op.id);
 for(const route of [...matches,...index]){
  if(route.operator?.en!==op.en||route.operator?.ko!==op.ko)issues.push({id:op.id,type:'operator',en:route.operator?.en,ko:route.operator?.ko,expectedEn:op.en,expectedKo:op.ko});
 }
 verified.operators++;
}
for(const stop of patches.stations){
 const matching=ws.routes.flatMap(r=>(r.stations||[]).filter(s=>s.id===stop.id).map(s=>({route:r,stop:s})));
 if(!matching.length)throw Error('Corrected station missing from all playable routes: '+stop.id);
 if(!matching.some(({stop:s})=>s.romaji===stop.en&&s.kana===stop.kana&&s.ko===stop.ko))
   issues.push({id:stop.id,type:'station',expected:[stop.en,stop.kana,stop.ko],actual:matching.map(x=>[x.stop.romaji,x.stop.kana,x.stop.ko]).slice(0,5)});
 const published=getDeployed(matching[0].route.id).record.stations?.find(s=>s.id===stop.id);
 if(!published||published.romaji!==stop.en)issues.push({id:stop.id,type:'chunk-station',expected:stop.en,actual:published?.romaji});
 verified.stations++;
}
for(const id of routeIds)if(!indexIds.has(id))issues.push({id,type:'generated-index-missing'});
assert.equal(issues.length,0,JSON.stringify(issues.slice(0,30),null,2));
assert(read('index.html').includes('js/japan-lite-index.js?v='),'Published HTML index missing cache version');
console.log(JSON.stringify({status:'PASS',catalogRoutes:ws.routes.length,verified,originalAndLazyAndChunkConsistent:true}));
