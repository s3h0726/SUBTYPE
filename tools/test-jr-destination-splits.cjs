#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('js/nationwide-service-catalog.js').split('window.TRT_NATIONWIDE_SERVICE_CATALOG=')[1].trim().replace(/;\s*$/,''));
const testSource=source=>{
 const start=source.indexOf('function resolvedJrCatalogSegments('),end=source.indexOf('function catalogPatternChoice(',start);
 assert(start>=0&&end>start,'JR destination splitter missing');
 const ctx={};vm.createContext(ctx);
 vm.runInContext(source.slice(start,end)+';globalThis.split=resolvedJrCatalogSegments;',ctx);
 return ctx.split;
};
const source=read('js/app.js'),bundle=read('js/app.bundle.js');
for(const [name,split] of [['source',testSource(source)],['published bundle',testSource(bundle)]]){
 const before=catalog.lines['11502'].patterns.find(p=>p.id==='150');
 assert(before,'train 150 missing');
 const after=split(before);
 const oldStops=before.segments.flatMap((s,i)=>s.stations.map(x=>x[0]).slice(i?1:0));
 const newStops=after.flatMap((s,i)=>s.stations.map(x=>x[0]).slice(i?1:0));
 assert.equal(JSON.stringify(oldStops),JSON.stringify(newStops),name+': station identities must be preserved');
 assert(after.some(s=>s.lineCode==='11501'&&s.stations[0][0]==='浜松'&&s.stations.at(-1)[0]==='豊橋'),'Hamamatsu–Toyohashi on 11501');
 assert(after.some(s=>s.lineCode==='11502'&&s.stations[0][0]==='豊橋'&&s.stations.at(-1)[0]==='岐阜'),'Toyohashi–Gifu on 11502');
 const spur=catalog.lines['11503'].patterns.find(p=>p.id==='151');
 assert(spur,'Mino-Akasaka local missing');
 assert(split(spur).some(s=>s.stations[0][0]==='大垣'&&s.stations.at(-1)[0]==='美濃赤坂'));
 assert(source.includes('routeForCatalogLine(segment.lineCode,segment.stations)')&&bundle.includes('routeForCatalogLine(segment.lineCode,segment.stations)'),'single segment must choose real branch by station coverage');
 assert(source.includes('resolvedJrCatalogSegments(pattern).map(part=>String(part.lineCode||')),'preload changed routes before selecting destinations');
}
const jrEast=JSON.parse(read('data/generated/routes/line-11226.json')).route;
assert.equal(jrEast.stations[0].ja,'会津若松');
assert.equal(jrEast.stations.at(-1).ja,'新津');
assert.equal(jrEast.line.ko,'반에쓰사이선(아이즈와카마쓰~니쓰)');
console.log('PASS: JR Tokaido legacy 11502 split, Mino-Akasaka branch route, runtime preload and Aizuwakamatsu–Niitsu boundary');
