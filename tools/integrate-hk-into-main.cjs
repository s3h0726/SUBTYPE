#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
function addImport(file,statement){
 const s=read(file);
 if(!s.includes(statement))write(file,statement+'\n'+s);
}
for(const [file,imp] of [
 ['js/app.js',"import{hongKongRouteBlockReason,HONG_KONG_CATEGORIES}from'./hong-kong-policy.js';"],
 ['js/app.js',"import{hongKongTramChoices,resolveHongKongTramChoice,hongKongLineChoices,resolveHongKongLineChoice}from'./hong-kong-tram.js';"],
 ['js/data-loader.js',"import{hongKongRouteBlockReason}from'./hong-kong-policy.js';"],
 ['js/free-drive.js',"import{hongKongRouteBlockReason,hongKongTransferAllowed}from'./hong-kong-policy.js';"],
 ['js/game.js',"import{hongKongRouteBlockReason}from'./hong-kong-policy.js';"],
 ['js/feature-flags.js',"import{hongKongRouteBlockReason}from'./hong-kong-policy.js';"]
])addImport(file,imp);
let feature=read('js/feature-flags.js');
if(!feature.includes('hongKong:true'))feature=feature.replace('  korea:true,','  korea:true,\n  hongKong:true,');
if(!feature.includes('hongKongRouteBlockReason(route)'))feature=feature.replace('if(koreanRouteBlockReason(route))return false;','if(koreanRouteBlockReason(route)||hongKongRouteBlockReason(route))return false;');
write('js/feature-flags.js',feature);
let builder=read('tools/build-app-bundle.js');
for(const moduleName of ['hong-kong-policy.js','hong-kong-tram.js']){
 if(!builder.includes('"'+moduleName+'"'))
  builder=builder.replace('const order=["utils.js",','const order=["utils.js","'+moduleName+'",');
}
write('tools/build-app-bundle.js',builder);
let html=read('index.html');
if(!html.includes('css/hong-kong.css')){
 const match=html.match(/<link rel="stylesheet"[^>]+>/);
 assert(match,'No stylesheet link');
 html=html.replace(match[0],match[0]+'\n  <link rel="stylesheet" href="./css/hong-kong.css">');
}
if(!html.includes('js/hong-kong-index-data.js')){
 const match=html.match(/<script defer src="\.\/js\/japan-lite-index\.js[^"]*"><\/script>/);
 assert(match,'No JP catalog script');
 html=html.replace(match[0],'<script defer src="./js/hong-kong-index-data.js"></script>\n  '+match[0]);
}
if(!html.includes('data-country="hk"'))html=html.replace(/(<div class="country-switch"[^>]*>)/,'$1<button data-country="hk">홍콩 Hong Kong / 香港</button>');
assert(html.includes('data-country="hk"'),'Hong Kong country button missing');
write('index.html',html);
// Restore HK-only gameplay behaviors on top of main's newer game engine.
let game=read('js/game.js');
if(!game.includes('if(hongKongRouteBlockReason(route))'))
 game=game.replace('this.stop(false);if(isKoreanResearch(route))',
 'this.stop(false);if(hongKongRouteBlockReason(route)){toast(hongKongRouteBlockReason(route));return false}if(isKoreanResearch(route))');
game=game.replace('stations:this.resolvedRoute.stations,geometry:this.resolvedRoute.geometry',
 "stations:this.resolvedRoute.stations.map(s=>route.countryId==='hk'&&this.options.inputMode==='memory'?{...s,ko:''}:s),geometry:this.resolvedRoute.geometry");
game=game.replace('!state?.station||koreanRouteBlockReason(state.route)',
 '!state?.station||hongKongRouteBlockReason(state.route)||koreanRouteBlockReason(state.route)');
game=game.replace('||state.edges?.[0]',"||(route.countryId==='hk'?null:state.edges?.[0])");
game=game.replace('||state?.edges?.[0]',"||(this.route?.countryId==='hk'?null:state?.edges?.[0])");
if(!game.includes("if(this.route?.countryId==='hk'){this.renderFreeDriveState(state);return}"))
 game=game.replace("toast('이 역에서 이어지는 다음 역이 없습니다.');return",
 "if(this.route?.countryId==='hk'){this.renderFreeDriveState(state);return}toast('이 역에서 이어지는 다음 역이 없습니다.');return");
if(!game.includes('  hintName(station)'))
 game=game.replace('  showDeparture(){',
 "  hintName(station){return this.route?.countryId==='hk'&&this.options.inputMode==='memory'?(station?.romaji||station?.ja||''):(station?.ko||'')}\n  showDeparture(){");
// Preserve explicit TAB transfer at Hong Kong terminal; never auto-take a different line.
const hkTarget="else if(defaultEdge){const targetStation=defaultEdge.route?.stations?.[defaultEdge.index]||null;if(targetStation)this.setFreeDriveTypingTarget(defaultEdge,targetStation)}";
const hkTerminal="else if(defaultEdge){const targetStation=defaultEdge.route?.stations?.[defaultEdge.index]||null;if(targetStation)this.setFreeDriveTypingTarget(defaultEdge,targetStation)}else if(route.countryId==='hk'){this.freeDriveTarget=null;this.phase='AT_TERMINAL';$('#typing-input').readOnly=true;$('#station-context').textContent='종착역 도착 · 자유주행';$('#input-status').textContent='ARRIVED';}";
if(!game.includes("this.phase='AT_TERMINAL'")){
 if(!game.includes(hkTarget))throw Error('Hong Kong terminal branch anchor missing');
 game=game.replace(hkTarget,hkTerminal);
}
write('js/game.js',game);
// The branch fixture predates main's Korean station display helper. Supply
// its pure presentation dependency rather than weakening the terminal assertion.
const testFile='tools/test-hk-phase6.cjs';
if(fs.existsSync(path.join(root,testFile))){
 let test=read(testFile);
 const oldFixture='c={console,performance,document:';
 if(test.includes(oldFixture))test=test.replace(oldFixture,'c={console,performance,koreanStationDisplayName:v=>String(v||\'\'),document:');
 write(testFile,test);
}
require('./repair-hk-main-compat.cjs');
const markers={
 'js/app.js':['HONG_KONG_CATEGORIES','hongKongRouteCards','prepareHongKongTramChoices',"countryId==='hk'"],
 'js/data-loader.js':['TRT_HONG_KONG_INDEX','hong-kong-lazy-index'],
 'js/free-drive.js':['hongKongTransferAllowed','TRT_HONG_KONG_INDEX'],
 'js/game.js':['hongKongRouteBlockReason',"countryId==='hk'"],
 'js/network-map.js':["countryId==='hk'"],
 'js/hong-kong-index-data.js':['TRT_HONG_KONG_INDEX'],
 'js/hong-kong-tram.js':['resolveHongKongLineChoice','hongKongTramChoices']
};
const missing=[];
for(const [file,terms] of Object.entries(markers))
 for(const term of terms)if(!read(file).includes(term))missing.push(file+': '+term);
if(missing.length)throw Error('HK merge hooks missing:\n'+missing.join('\n'));
const routes=JSON.parse(read('data/hk/generated/index.json')).routes||[];
assert(routes.length>=62,'HK routes lost: '+routes.length);
console.log(JSON.stringify({status:'HK_MERGE_HOOKS_OK',routes:routes.length},null,2));
