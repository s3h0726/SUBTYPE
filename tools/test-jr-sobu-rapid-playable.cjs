#!/usr/bin/env node
'use strict';
// Verify the released Sobu Rapid Line is playable in both directions, has
// physically surveyed rather than straight-line track, and preserves the
// Sobu Main and Chuo–Sobu local source lines without aliasing their roles.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const unpack=(p,mark)=>JSON.parse(read(p).split(mark)[1].trim().replace(/;\s*$/,''));
const id='line-jr-east-sobu-rapid';
const dir='data/lines/jr-east/sobu-rapid/';
const src='data/lines/jr-east/sobuhonsen/';
const original=json(src+'line.json'),originalRelations=json(src+'stations.json'),originalGeometry=json(src+'geometry.json');
const line=json(dir+'line.json'),relations=json(dir+'stations.json'),geometry=json(dir+'geometry.json');
const override=json('data/japan-route-station-names.json').routes?.[id];
const built=json('data/generated/routes/'+id+'.json').route;
const builtin=json('data/generated/routes/line-11314.json').route;
const local=json('data/generated/routes/line-11313.json').route;
const meta=unpack('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=');
const ws=unpack('js/line-workspace-data.js','window.TRT_EMBEDDED_LINE_WORKSPACES=');
const stations=['東京','新日本橋','馬喰町','錦糸町','新小岩','市川','船橋','津田沼','稲毛','千葉'];
assert.equal(line.id,id);
assert.equal(line.operatorId,'jr-east');
assert.equal(line.category,'jr');
assert.equal(line.code,'JO');
assert.equal(line.names.ja,'総武快速線');
assert.equal(line.names.ko,'소부 쾌속선');
assert.deepEqual(relations.map(x=>x.stationId),originalRelations.slice(0,10).map(x=>x.stationId));
assert.deepEqual(relations.map(x=>x.stationCode),Array.from({length:10},(_,i)=>'JO'+(19+i)));
assert.equal(relations.length,10);
assert.equal(Object.keys(geometry).length,9);
assert.equal(line.services.length,1);
assert.deepEqual(line.services[0].stopPattern,relations.map(x=>x.stationId));
assert.equal(fs.readFileSync(path.join(root,dir+'symbol.svg'),'utf8'),
 fs.readFileSync(path.join(root,src+'symbol.svg'),'utf8'),'Official original JO symbol must be preserved');
for(let i=0;i<9;i++){
 const edge=relations[i].stationId+'::'+relations[i+1].stationId;
 assert.deepEqual(geometry[edge],originalGeometry[edge],'Geometry not directly copied from surveyed MLIT source '+edge);
 assert(geometry[edge].geometry.length>=5);
}
assert.deepEqual(built.stations.map(s=>s.ja),stations);
assert.equal(built.line.ko,'소부 쾌속선');
assert.equal(built.geometryReady,true);
assert.equal(built.missingSegments.length,0);
assert.equal(built.directedSegments.length,9);
assert(built.geometry.length>=230,'Polyline was reduced to station-to-station chords');
assert.equal(built.stations[0].stationCode,'JO19');
assert.equal(built.stations.at(-1).stationCode,'JO28');
for(const [ja,ko,kana] of [['馬喰町','바쿠로초','ばくろちょう'],['錦糸町','킨시초','きんしちょう']]){
 const s=built.stations.find(st=>st.ja===ja);
 assert(s,'Missing '+ja);
 assert.equal(s.ko,ko);assert.equal(s.kana,kana);
 assert.equal(s.routeSpecificStationName,true);
 assert(override[s.id],'Missing line-scoped signage for '+ja);
}
const index=meta.routes.filter(r=>r.id===id);
assert.equal(index.length,1,'Sobu Rapid must have exactly one selectable card');
assert.equal(index[0].category,'jr');
assert.equal(index[0].operatorId,'jr-east');
assert.equal(index[0].stationCount,10);
assert.equal(index[0].playable,true);
assert(index[0].lazySource,'No lazy route hydration source');
assert.equal(ws.routes.filter(r=>r.id===id).length,1);
assert(meta.transferNeighbors?.[id]?.includes('line-11313'),
 'Sobu Rapid must connect with local Chuo–Sobu interchange at Kinshicho etc.');
assert(meta.transferNeighbors?.[id]?.includes('line-11308'),
 'Sobu Rapid must connect with Yokosuka at Tokyo');
assert.equal(original.id,'line-11314');
assert.equal(builtin.stations.length,31,'Sobu Main Line must not be truncated');
assert.equal(local.stations.length,39,'Chuo–Sobu Local must not be truncated');
const integrity=read('js/route-integrity.js').replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+/g,'');
const sandbox={console};vm.createContext(sandbox);
vm.runInContext(integrity+';globalThis.play=resolvePlayableRoute;globalThis.audit=auditRouteIntegrity;',sandbox);
const verdict=sandbox.audit(built);assert.equal(verdict.pass,true,verdict.errors?.join('; '));
for(const direction of ['forward','reverse']){
 const play=sandbox.play(built,{direction,service:built.services[0]});
 assert.equal(play.stations.length,10,'Incorrect rapid stop count '+direction);
 assert.equal(play.segments.length,9,'Missing rapid track segments '+direction);
 assert(play.geometry.length>=230,'Game route lost actual track '+direction);
 assert.notEqual(play.fallbackGeometry,true,'Game used synthetic track '+direction);
 assert.equal(play.stations[0].ja,direction==='forward'?'東京':'千葉');
 assert.equal(play.stations.at(-1).ja,direction==='forward'?'千葉':'東京');
}
const csv=read('reports/korean-names/lines.csv'),stopsCsv=read('reports/korean-names/stations-by-line.csv');
assert(csv.includes('"'+id+'"')&&csv.includes('"소부 쾌속선"'),
 'Korean name editor missing Sobu Rapid card');
assert(stopsCsv.includes('"'+id+'"')&&stopsCsv.includes('"바쿠로초"')&&stopsCsv.includes('"킨시초"'),
 'Korean name editor lost Sobu Rapid route-specific station Korean names');
console.log(JSON.stringify({status:'PASS',lineId:id,stops:10,segments:9,vertices:built.geometry.length,
 directions:['Tokyo–Chiba','Chiba–Tokyo'],localRouteKept:local.id,
 originalMainLineKept:builtin.id,transfers:meta.transferNeighbors[id].length,csvIntegrated:true}));
