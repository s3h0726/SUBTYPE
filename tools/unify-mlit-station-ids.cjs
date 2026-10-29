'use strict';
// Run once, on main, with --write after a full dry run.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),abs=p=>path.join(root,p);
const json=p=>JSON.parse(fs.readFileSync(abs(p),'utf8'));
const oldPattern=/station-mlit-\d{4,}/g,write=process.argv.includes('--write');
if(fs.existsSync(abs('data/station-id-aliases.json')))throw Error('MLIT station migration has already been applied');
const existing=new Map(),masterDir='data/shared-stations';
const shardNames=fs.readdirSync(abs(masterDir)).filter(x=>x.endsWith('.json'));
for(const name of shardNames)for(const st of json(masterDir+'/'+name)){
 if(existing.has(st.id))throw Error('Duplicate master '+st.id);
 existing.set(st.id,st);
}
const candidates=new Map();
const norm=x=>String(x||'').normalize('NFKC').replace(/\s+/g,'');
let matched=0;
for(const cat of ['jr','subway','private','other','shinkansen']){
 const f='data/lines/'+cat+'.json';
 if(!fs.existsSync(abs(f)))continue;
 for(const route of json(f).routes||[]){
  const nationwide='data/nationwide/routes/'+route.id+'.json';
  if(!fs.existsSync(abs(nationwide)))continue;
  const stations=json(nationwide).route?.stations||[];
  const known=new Map(stations.map(s=>[String(s.sourceId||s.id),s]));
  for(const st of route.stations||[]){
   const legacy=st.stationMasterId;
   if(!/^station-mlit-\d+$/.test(legacy||''))continue;
   const canonical=known.get(String(st.sourceId||st.id));
   if(!canonical||norm(canonical.ja)!==norm(st.ja))continue;
   const target=canonical.stationMasterId;
   if(!target||target.startsWith('station-mlit-')||!existing.has(target))continue;
   const old=existing.get(legacy),other=existing.get(target);
   if(old&&norm(old.names?.ja)!==norm(other.names?.ja))continue;
   if(!candidates.has(legacy))candidates.set(legacy,new Set());
   candidates.get(legacy).add(target);matched++;
  }
 }
}
const exts=new Set(['.json','.js','.cjs','.mjs','.html','.csv','.md','.ts','.yml','.yaml']);
const excluded=new Set(['.git','node_modules','coverage','vendor','dist','reports','.github','playwright-report','test-results']);
const files=[];
function discover(dir){
 if(!fs.existsSync(dir))return;
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  if(excluded.has(item.name))continue;
  const f=path.join(dir,item.name);
  if(item.isDirectory())discover(f);
  else if(item.isFile()&&exts.has(path.extname(item.name)))files.push(f);
 }
}
for(const dir of ['data','js','tools','editor'])discover(abs(dir));
const discovered=new Set();
for(const f of files)for(const id of fs.readFileSync(f,'utf8').match(oldPattern)||[])discovered.add(id);
const aliases={},fallbacks=[],matches=[];
const used=new Set(existing.keys());
for(const legacy of [...discovered].sort()){
 const targets=[...(candidates.get(legacy)||[])];
 const stable=targets.length===1;
 let to=stable?targets[0]:'station-'+legacy.slice('station-mlit-'.length);
 if(!stable&&used.has(to))to='station-n02-'+legacy.slice('station-mlit-'.length);
 if(used.has(to)&&!existing.has(to))throw Error('Target conflict '+to);
 if(to===legacy||to.startsWith('station-mlit-'))throw Error('Unsafe target '+to);
 aliases[legacy]=to;used.add(to);
 if(stable)matches.push([legacy,to]);else fallbacks.push([legacy,to,targets.length]);
}
const migrate=s=>s.replace(oldPattern,id=>aliases[id]||id);
const updates=new Map();
for(const file of files){
 const original=fs.readFileSync(file,'utf8');
 if(!original.includes('station-mlit-'))continue;
 const next=migrate(original);
 if(next===original)continue;
 if(path.extname(file)==='.json')JSON.parse(next);
 updates.set(file,next);
}
const stationIds=new Set(),duplicates=new Set();
for(const shard of shardNames){
 const file=abs(masterDir+'/'+shard);
 const original=json(masterDir+'/'+shard),next=[];
 for(const st of original){
  const dest=aliases[st.id]||st.id;
  if(aliases[st.id]&&existing.has(dest)){duplicates.add(st.id);continue;}
  if(stationIds.has(dest))throw Error('Duplicate migrated station master '+dest);
  stationIds.add(dest);
  next.push({...st,id:dest});
 }
 if(next.length!==original.length||original.some(x=>aliases[x.id]))
  updates.set(file,JSON.stringify(next,null,2)+'\n');
}
for(const id of existing.keys())if(!duplicates.has(id)&&!stationIds.has(aliases[id]||id))
 throw Error('Lost master station '+id);
for(const file of files){
 if(path.basename(file)!=='stations.json'||!file.includes('/data/lines/'))continue;
 const relations=JSON.parse(updates.get(file)||fs.readFileSync(file,'utf8'));
 const ids=relations.map(r=>r.stationId);
 const oldIds=JSON.parse(fs.readFileSync(file,'utf8')).map(r=>r.stationId);
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)
  if(ids[i]===ids[j]&&oldIds[i]!==oldIds[j])throw Error('Newly collapsed stops in '+file+' at '+i+'/'+j);
 for(const id of ids)if(!stationIds.has(id))throw Error('Missing station master '+id+' ('+file+')');
 const geo=path.join(path.dirname(file),'geometry.json');
 if(!fs.existsSync(geo))continue;
 const segments=JSON.parse(updates.get(geo)||fs.readFileSync(geo,'utf8'));
 for(const [key,segment] of Object.entries(segments)){
  if(!Array.isArray(segment?.geometry))continue;
  assert.equal(key,segment.fromStationId+'::'+segment.toStationId,'Segment mismatch '+geo);
 }
}
const summary={oldIds:discovered.size,canonicalMerged:matches.length,keptDistinct:fallbacks.length,
 matchedRelations:matched,changedFiles:updates.size,duplicateMastersRemoved:duplicates.size,
 examples:matches.slice(0,10),ambiguousExamples:fallbacks.slice(0,10)};
if(write){
 updates.set(abs('data/station-id-aliases.json'),JSON.stringify({schemaVersion:1,description:'Backward compatibility for legacy MLIT station identifiers.',aliases},null,2)+'\n');
 for(const [file,value] of updates)fs.writeFileSync(file,value);
 console.log('APPLIED '+JSON.stringify(summary));
}else console.log('DRY_RUN '+JSON.stringify(summary));
