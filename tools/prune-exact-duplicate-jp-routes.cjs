#!/usr/bin/env node
'use strict';
// Remove verified exact-duplicate Japan physical routes from browser workspace and
// regenerate lazy chunks/catalog. Existing canonical tracks and journeys survive.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
const ids=JSON.parse(read('data/japan-duplicate-route-aliases.json')).aliases;
const expected=Object.entries(ids);
assert.equal(expected.length,3,'Only the three verified exact duplicates are authorized');
const prefix='window.TRT_EMBEDDED_LINE_WORKSPACES=';
const raw=read('js/line-workspace-data.js'),pos=raw.indexOf(prefix);
if(pos<0)throw Error('No canonical browser workspace');
const ws=JSON.parse(raw.slice(pos+prefix.length).trim().replace(/;\s*$/,''));
const jpIndex=read('js/japan-lite-index.js');
const indexPrefix='window.TRT_JAPAN_LITE_INDEX=';
const lite=JSON.parse(jpIndex.slice(jpIndex.indexOf(indexPrefix)+indexPrefix.length).trim().replace(/;\s*$/,''));
const norm=route=>(route.stations||[]).map(s=>String(s.ja||s.names?.ja||'').normalize('NFKC')).join('::');
const keep=ws.routes;
let removed=0;
for(const [duplicate,canonical] of expected){
 const old=keep.find(r=>r.id===duplicate),good=keep.find(r=>r.id===canonical);
 if(!good)throw Error('Canonical route missing: '+canonical);
 const source=old||lite.routes.find(r=>r.id===duplicate);
 if(!source)continue; // Already removed from catalog, but old files may remain.
 if(old){
  if(old.operatorId!==good.operatorId||!norm(old)||norm(old)!==norm(good))
   throw Error('Duplicate is not an exact station-order match: '+duplicate);
  if((old.services||[]).length||(old.throughServiceIds||[]).length)
   throw Error('Cannot retire route containing unique train services: '+duplicate);
  removed++;
 }
}
const before=ws.routes.length;
ws.routes=ws.routes.filter(r=>!ids[r.id]);
assert.equal(before-ws.routes.length,removed,'Wrong workspace removal count');
for(const [duplicate,canonical] of expected)assert(ws.routes.some(r=>r.id===canonical));
if(removed)write('js/line-workspace-data.js',raw.slice(0,pos+prefix.length)+JSON.stringify(ws)+';\n');
// This generator also updates the canonical transfer-neighbor index.
cp.execFileSync(process.execPath,[path.join(root,'tools/build-japan-lazy-catalog.cjs')],{cwd:root,stdio:'inherit'});
const next=read('js/japan-lite-index.js');
const newIndex=JSON.parse(next.slice(next.indexOf(indexPrefix)+indexPrefix.length).trim().replace(/;\s*$/,''));
for(const id of Object.keys(ids))assert(!newIndex.routes.some(r=>r.id===id),'Duplicate published: '+id);
for(const id of Object.values(ids))assert(newIndex.routes.some(r=>r.id===id),'Canonical lost: '+id);
const valid=new Set(newIndex.routes.map(r=>r.id));assert.equal(valid.size,newIndex.routes.length);
assert(newIndex.routes.length>=590&&newIndex.routes.length<=610,'Unexpected loss of routes');
for(const route of newIndex.routes)if(route.lazySource&&!route.lazySource.includes('/generated/routes/')){
 const file=route.lazySource.replace(/^\.\//,'').split('?')[0];
 assert(fs.existsSync(path.join(root,file)),'Missing lazy route source '+file);
}
const scraps=['hachikosen-hachioji-komagawa-2','jobansen-totte-iwaki-2','jobansen-ueno-totte-2'];
for(const folder of scraps){
 const p=path.join(root,'data/lines/jr-east',folder);
 if(!fs.existsSync(p))continue;
 const entries=fs.readdirSync(p);
 if(entries.includes('line.json'))throw Error('Cannot remove active line folder '+folder);
 if(entries.some(x=>!['README.md','stations.json','geometry.json'].includes(x)))throw Error('Unknown file in '+folder);
 fs.rmSync(p,{recursive:true,force:true});
}
let html=read('index.html');
for(const file of ['japan-lite-index.js','app.bundle.js']){
 const hash=crypto.createHash('sha256').update(read('js/'+file)).digest('hex').slice(0,12);
 const expression=new RegExp('(\\./js/'+file.replace(/\./g,'\\.')+')(?:\\?v=[^"]*)?','g');
 html=html.replace(expression,(_,p)=>p+'?v='+hash);
}
write('index.html',html);
console.log('DEDUPLICATED '+JSON.stringify({before,after:ws.routes.length,removedFromWorkspace:removed,publicRoutes:newIndex.routes.length,aliases:Object.keys(ids).length}));
