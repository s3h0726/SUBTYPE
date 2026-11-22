'use strict';
// Regression tests for historic Japanese TrainLCD services using real tracks.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const parse=(file,id)=>JSON.parse(read(file).split('window.'+id+'=')[1].trim().replace(/;\s*$/,''));
const catalog=parse('js/nationwide-service-catalog.js','TRT_NATIONWIDE_SERVICE_CATALOG');
const lite=parse('js/japan-lite-index.js','TRT_JAPAN_LITE_INDEX');
const app=read('js/app.js'),resolver=read('js/service-route-resolver.js').replace(/\bexport\s+/g,'');
const helper=app.slice(app.indexOf('const jpCatalogNameCache='),app.indexOf('// TrainLCD line IDs'));
const choiceCode=app.slice(app.indexOf('function resolvedJrCatalogSegments('),app.indexOf('// A limited express'));
const routeCode=app.slice(app.indexOf('function catalogConnectedSegments('),app.indexOf('function resolveOperatingChoice('));
for(const section of [helper,choiceCode,routeCode])assert.ok(section.length>500);
const compile=builtin=>new Function('builtin','globalThis',resolver+'\n'+helper+'\n'+choiceCode+'\n'+routeCode+
  '\nreturn {japaneseCatalogStationKey,routeForCatalogLine,catalogRequiredStationNames,catalogRouteHasStations,catalogPatternChoice,buildCatalogResolved};'
)(builtin,{TRT_NATIONWIDE_SERVICE_CATALOG:catalog});
const api=compile(lite.routes);
assert.equal(api.japaneseCatalogStationKey('押上（スカイツリー前）'),
  api.japaneseCatalogStationKey('押上〈スカイツリー前〉'));
for(const [code,stops,routeId] of [
  ['99302',['西馬込','押上（スカイツリー前）'],'line-99302'],
  ['23002',['押上（スカイツリー前）','京成曳舟','京成高砂'],'line-23002'],
  ['11312',['新宿','大久保','東中野','中野'],'line-11313'],
  ['23006',['京成高砂','新柴又','矢切','北国分','秋山','東松戸','松飛台','大町',
    '新鎌ヶ谷','西白井','白井','小室','千葉ニュータウン中央','印西牧の原','印旛日本医大'],'line-99340'],
  ['99630',['神戸三宮','花隈','高速神戸','新開地'],'line-hankyu-kobe-kosoku']
])assert.equal(api.routeForCatalogLine(code,stops)?.id,routeId,code);
assert.equal(api.routeForCatalogLine('1006',['越後湯沢','ガーラ湯沢']),null,
  'unregistered railway must not be invented');
assert.equal(api.catalogRouteHasStations({stations:[{ja:'A'},{ja:'B'},{ja:'C'}]},['A','C','B']),false);

let total=0,matched=0;
for(const line of Object.values(catalog.lines))for(const pattern of line.patterns||[])
  for(const segment of pattern.segments||[]){
    if((segment.stations||[]).length<2)continue;
    total++;
    const stops=api.catalogRequiredStationNames(segment),route=api.routeForCatalogLine(segment.lineCode,stops);
    if(route&&api.catalogRouteHasStations(route,stops))matched++;
  }
assert.ok(total>=8000,'catalog unexpectedly truncated');
assert.ok(matched>=7200,'existing-station route matches regressed: '+matched);

const registered=[
  ...JSON.parse(read('data/jp-canonical/chunk-11.json')).routes,
  ...JSON.parse(read('data/jp-canonical/chunk-15.json')).routes
],live=compile(registered),home=registered.find(x=>x.id==='line-23001');
assert.ok(home?.geometryReady);
let directions=0;
for(const id of ['220','221','227','228','230']){
  const pattern=catalog.lines['23001'].patterns.find(p=>p.id===id);
  assert.ok(pattern,id+' pattern not registered');
  for(const reverse of [false,true]){
    const choice=live.catalogPatternChoice(home,pattern,reverse);
    assert.equal(choice.catalogUnavailableReason,null,id+' incorrectly blocked');
    const result=live.buildCatalogResolved(choice);
    assert.equal(result.route.stations[0].ja,reverse?'成田空港（第１旅客ターミナル）':'西馬込');
    assert.equal(result.route.stations.at(-1).ja,reverse?'西馬込':'成田空港（第１旅客ターミナル）');
    assert.equal(result.direction,'forward','do not reverse assembled route twice');
    assert.ok(result.service.stops.length>=25,'missing real calls');
    assert.ok(result.route.geometry.length>100,'synthetic straight segment');
    assert.ok(result.route.stations.every(s=>Number.isInteger(s.geometryIndex)&&
      s.geometryIndex>=0&&s.geometryIndex<result.route.geometry.length),'invalid geometry index');
    directions++;
  }
}
console.log(JSON.stringify({status:'PASS',catalogSegments:total,existingStationMatches:matched,
  unmatched:total-matched,realThroughDirections:directions},null,2));
