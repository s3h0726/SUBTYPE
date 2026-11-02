#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),site='https://s3h0726.github.io/SUBTYPE/';
(async()=>{
 const checks=[];
 async function get(p){const r=await fetch(new URL(p,site),{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(30000)});assert(r.ok,p+': HTTP '+r.status);checks.push({path:p,httpStatus:r.status});return r.text()}
 const html=await get('index.html'),bundlePath=html.match(/\.\/js\/app\.bundle\.js\?v=([^"']+)/)?.[0];assert(bundlePath,'Published app cache version missing');
 const expected=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'js/app.bundle.js'))).digest('hex').slice(0,12);assert(bundlePath.endsWith(expected),'Published application bundle differs from tested source');
 const bundle=await get(bundlePath),policy=bundle.match(/function stationKoreanNameFromPolicy\(station\)\{[\s\S]*?\n\}/)?.[0];assert(policy&&!policy.includes('cleanJapaneseKoreanName')&&!policy.includes('NAMUWIKI_STATION_FIXES'),'Old station transliteration override still deployed');
 const aikan=JSON.parse(await get('data/generated/routes/line-99511.json')).route;
 assert.equal(aikan.stations.find(s=>s.ja==='六名')?.ko,'무츠나');assert.equal(aikan.stations.find(s=>s.ja==='六名')?.kana,'むつな');
 const rapid=JSON.parse(await get('data/generated/routes/line-jr-east-sobu-rapid.json')).route;
 assert.equal(rapid.stations.find(s=>s.ja==='錦糸町')?.romaji,'Kinshichō');assert.equal(rapid.stations.find(s=>s.ja==='馬喰町')?.romaji,'Bakurochō');
 const editor=await get('reports/korean-names/editor.html');assert(editor.includes('20261102-nationwide-revalidated'),'Old name-editor draft version deployed');
 const table=await get('reports/korean-names/stations-by-line.csv');assert(table.includes('"station-9951102"')&&table.includes('"무츠나"'),'Editor data is stale');
 const lite=await get('js/japan-lite-index.js'),index=JSON.parse(lite.split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\s*$/,''));
 const meta=index.routes.find(r=>r.id==='line-99511'),chunk=JSON.parse(await get(meta.lazySource));assert((chunk.routes||[chunk.route]).find(r=>r.id===meta.id).stations.some(s=>s.ja==='六名'&&s.ko==='무츠나'),'Selected lazy game payload is stale');
 const report={status:'PASS',verifiedAt:new Date().toISOString(),site,expectedCommit:process.argv[2]||null,bundleHash:expected,checks,scope:'배포 HTML·앱 번들·실제 선택용 지연 데이터·교정 역명·편집표 대조. 전 역 개별 브라우저 검사와 구분.'};
 if(process.argv[3])fs.writeFileSync(path.resolve(process.argv[3]),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
