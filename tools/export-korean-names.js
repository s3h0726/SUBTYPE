#!/usr/bin/env node
// Read-only Korean name inventory: original operator/line workspaces and generated station data.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const walk=(d,name)=>fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name),name):e.name===name?[path.join(d,e.name)]:[]):[];
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const toRel=p=>path.relative(root,p).replaceAll(path.sep,'/');
const csv=(rows)=>'\uFEFF'+rows.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const output=path.join(root,'reports/korean-names');fs.mkdirSync(output,{recursive:true});
const editsFile=path.join(root,'data/editor-overrides.json');
const edits=fs.existsSync(editsFile)?load(editsFile):{};
const vm=require('node:vm');
const disneySource=fs.readFileSync(path.join(root,'js/disney-resort-line-data.js'),'utf8');
const disneyContext={};vm.runInNewContext(disneySource,disneyContext,{filename:'disney-resort-line-data.js'});
const disney=disneyContext.TRT_DISNEY_RESORT_ROUTE;
if(!disney?.id||disney.id!=='jp-disney-resort-line'||!Array.isArray(disney.stations)||disney.stations.length!==5)throw Error('Disney Resort Line source incomplete');
const nameOverrides=load(path.join(root,'data/japan-route-station-names.json')).routes||{};
const sourcedStation=(lineId,s)=>{
 const proof=nameOverrides[lineId]?.[s.id];
 if(proof?.namuwikiVerified===true&&proof.ja===s.ja&&proof.ko===s.ko)
   return {status:'나무위키 확인(노선별)',source:'namuwiki-manual',url:proof.namuwikiUrl||''};
 const source=s.koSource||s.nameKoSource||'';
 return {status:s.koVerified===true?'확인':'검토 필요',source,url:s.koSourceUrl||''};
};
const effectiveOperator=id=>edits.operators?.[id]||opMap.get(id)?.names?.ko||'';
const effectiveLine=(id,meta)=>edits.lines?.[id]?.ko||meta.names?.ko||'';
const effectiveColor=(id,meta)=>edits.lines?.[id]?.color||meta.color||'';
const effectiveStation=(lineId,station)=>edits.stations?.[lineId]?.[station.id]||edits.stations?.[lineId]?.[station.ja]||station.ko||'';
const operators=walk(path.join(root,'data/operators'),'operator.json').map(file=>({file,meta:load(file)}));
const lines=walk(path.join(root,'data/lines'),'line.json').map(file=>({file,meta:load(file)}))
  .filter(x=>x.meta.legacy?.retiredDuplicate!==true && x.meta.visibility!=='hidden' && x.meta.id!=='line-30005' && x.meta.id!=='line-11103');
// The Disney route and operator are authored in the runtime source rather than
// canonical workspaces. Export the actual four-stop loop plus the return stop.
if(!lines.some(x=>x.meta.id===disney.id)){
 lines.push({file:'js/disney-resort-line-data.js',meta:{
  id:disney.id,operatorId:disney.operatorId,names:{...disney.line},
  color:disney.lineColor,visibility:'public'
 }});
}
if(!operators.some(x=>x.meta.id===disney.operatorId)){
 operators.push({file:'js/disney-resort-line-data.js',meta:{
  id:disney.operatorId,names:{...disney.operator}
 }});
}
// The public Mikawa and Hakodate Main Line cards have been split at actual
// operational section boundaries (Chiryu / Sapporo). Keep original physical
// route definitions for historic records but exclude obsolete unified cards.
const publishedSectionFiles=['meitetsu-mikawa-yama.json','meitetsu-mikawa-umi.json',
  'hakodate-west.json','hakodate-east.json'];
const publishedSectionRoutes=new Map();
for(const name of publishedSectionFiles){
 const file=path.join(root,'data/route-overrides',name);
 const route=load(file).route;
 if(!route||!(['line-30005-yama','line-30005-umi','line-11103-otaru-sapporo','line-11103-sapporo-asahikawa'].includes(route.id))
   ||route.stations?.length!==(route.id.startsWith('line-30005-')?12:route.id==='line-11103-otaru-sapporo'?15:27))
   throw new Error('Invalid published section: '+name);
 if(publishedSectionRoutes.has(route.id))throw new Error('Duplicate Meitetsu section: '+route.id);
 publishedSectionRoutes.set(route.id,{route,file});
 lines.push({file,meta:{
   id:route.id,operatorId:route.operatorId,
   names:{ja:route.line.ja,ko:route.line.ko,en:route.line.en},
   color:route.lineColor,visibility:'public'
 }});
}
if(publishedSectionRoutes.size!==4)throw new Error('Missing published split sections (Meitetsu/Hakodate)');
// Retired or duplicate identifiers are folded into active operators.
const canonicalId=id=>({'san-yodenkitetsudo':'sanyodenkitetsudo','osakafutoshikaihatsu':'nankaidentetsu'}[id]||id);
const opMap=new Map(operators.map(x=>[x.meta.id,x.meta]));
for(const x of lines){
 const oldId=x.meta.operatorId;
 x.meta.operatorId=canonicalId(oldId);
 if(x.meta.id==='line-99616')x.meta.names={...x.meta.names,ja:'泉北線',ko:'센보쿠선',en:'Semboku Line'};
}
for(let i=operators.length-1;i>=0;i--)if(canonicalId(operators[i].meta.id)!==operators[i].meta.id)operators.splice(i,1);
operators.sort((a,b)=>(a.meta.names?.ko||'').localeCompare(b.meta.names?.ko||'','ko'));
lines.sort((a,b)=>(a.meta.operatorId||'').localeCompare(b.meta.operatorId||'')||(a.meta.names?.ko||'').localeCompare(b.meta.names?.ko||'','ko'));
if(process.argv.includes('--lines-only')) {
 fs.writeFileSync(path.join(output,'lines.csv'),csv([['운영사ID','운영사 한글명','노선ID','노선 한글명','노선 일본어명','노선 영어명','RGB 색상','원본경로'],...lines.map(x=>[x.meta.operatorId,effectiveOperator(x.meta.operatorId),x.meta.id,effectiveLine(x.meta.id,x.meta),x.meta.names?.ja,x.meta.names?.en,effectiveColor(x.meta.id,x.meta),toRel(x.file)])]));
 console.log(JSON.stringify({lines:lines.length,output:'reports/korean-names/lines.csv'}));
 process.exit(0);
}
fs.writeFileSync(path.join(output,'operators.csv'),csv([['운영사ID','한국어명','일본어명','영어명','데이터경로'],...operators.map(x=>[x.meta.id,effectiveOperator(x.meta.id),x.meta.names?.ja,x.meta.names?.en,toRel(x.file)])]));
fs.writeFileSync(path.join(output,'lines.csv'),csv([['운영사ID','운영사 한글명','노선ID','노선 한글명','노선 일본어명','노선 영어명','RGB 색상','원본경로'],...lines.map(x=>[x.meta.operatorId,effectiveOperator(x.meta.operatorId),x.meta.id,effectiveLine(x.meta.id,x.meta),x.meta.names?.ja,x.meta.names?.en,effectiveColor(x.meta.id,x.meta),toRel(x.file)])]));
const generatedDir=path.join(root,'data/generated/routes');
const byId=new Map();
if(fs.existsSync(generatedDir))for(const name of fs.readdirSync(generatedDir).filter(n=>n.endsWith('.json'))){try{const route=load(path.join(generatedDir,name)).route; if(route?.id)byId.set(route.id,route)}catch(e){console.warn('skipped',name,e.message)}}
for(const [id,{route}] of publishedSectionRoutes)byId.set(id,route);
byId.set(disney.id,disney);
const stationRows=[];const missing=[];
for(const x of lines){
 const route=byId.get(x.meta.id);
 if(!route){missing.push(x.meta.id);continue}
 for(const s of route.stations||[]){
  const proof=sourcedStation(x.meta.id,s);
  const routeFile=publishedSectionRoutes.has(x.meta.id)?toRel(publishedSectionRoutes.get(x.meta.id).file):
    x.meta.id===disney.id?'js/disney-resort-line-data.js':'data/generated/routes/'+x.meta.id+'.json';
  stationRows.push([
   x.meta.operatorId,effectiveOperator(x.meta.operatorId),x.meta.id,effectiveLine(x.meta.id,x.meta),
   s.id,s.stationMasterId||'',effectiveStation(x.meta.id,s),
   s.ja,s.kana||'',s.romaji||s.en||'',proof.source,routeFile,
   proof.status,proof.url
  ]);
 }
}
stationRows.sort((a,b)=>String(a[2]).localeCompare(String(b[2]))||String(a[4]).localeCompare(String(b[4])));
fs.writeFileSync(path.join(output,'stations-by-line.csv'),csv([['운영사ID','운영사 한글명','노선ID','노선 한글명','역ID','공통역ID','역 한글명','역 일본어명','가나','로마자','한글명 출처','데이터경로','출처 검증','근거 URL'],...stationRows]));
// Keep physically shared station identities separate when an operator uses a
// distinct Japanese name. This is essential for 湘南江の島 vs 江ノ島.
const unique=new Map();for(const r of stationRows){
 const k=(r[5]||r[4])+'::'+r[7];
 if(!unique.has(k)||r[12]==='나무위키 확인(노선별)')unique.set(k,r);
}
fs.writeFileSync(path.join(output,'stations-unique.csv'),csv([['공통역ID','역 한글명','역 일본어명','가나','로마자','한글명 출처','예시 노선ID','출처 검증','근거 URL'],...Array.from(unique.values(),r=>[r[5],r[6],r[7],r[8],r[9],r[10],r[2],r[12],r[13]])]));
fs.writeFileSync(path.join(output,'README.md'),'# 메트로타이핑 한글명 현황\n\n현재 저장소 원본 및 생성 데이터에서 추출한 자료입니다. 게임 코드와 운영 데이터는 수정하지 않습니다.\n\n- 운영사: '+operators.length+'개\n- 노선: '+lines.length+'개\n- 역-노선 표기: '+stationRows.length+'건\n- 고유 역 표기: '+unique.size+'건\n- 생성 노선 상세정보 누락: '+missing.length+'개 ('+missing.slice(0,20).join(', ')+')\n\n일본 철도 한글명은 나무위키 개별 문서/노선표 확인을 우선하며, 확인되지 않은 표기는 '검토 필요'로 유지합니다. 편집표의 출처 검증·근거 URL 열은 원본 및 노선별 증거에서 추출합니다.\n\nCSV는 UTF-8 BOM으로 저장되어 Excel에서 바로 열 수 있습니다. 동일 역의 한글명이 노선마다 다를 수 있어 stations-by-line.csv와 stations-unique.csv를 모두 제공합니다.\n');
console.log(JSON.stringify({operators:operators.length,lines:lines.length,stationRecords:stationRows.length,uniqueStations:unique.size,missingGeneratedRoutes:missing.length}));
