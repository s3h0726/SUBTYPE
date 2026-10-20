#!/usr/bin/env node
// Regression checks for Japan's actual services and independent transfer-platform positions.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const strip=source=>source.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const normalizer={console,crypto:{randomUUID:()=>'test'}};vm.createContext(normalizer);
vm.runInContext(strip(read('js/data-loader.js'))+';globalThis.testNormalizeLine=normalizeLine',normalizer);
const stations=[
  {id:'t1',ja:'東京',ko:'도쿄',latitude:35.70,longitude:139.70},
  {id:'t2',ja:'品川',ko:'시나가와',latitude:35.71,longitude:139.71}
];
const jp={id:'line-runtime-test',countryId:'jp',category:'jr',stations,line:{ja:'試験'},geometryReady:true};
const japanese=normalizer.testNormalizeLine(jp);
assert.equal(japanese.services.length,0,'Do not invent a Japanese local timetable');
assert.equal(normalizer.testNormalizeLine({...jp,services:[{id:'documented',stops:['t1','t2']}]}).services[0].id,'documented','Keep supplied actual services');
assert.equal(normalizer.testNormalizeLine({...jp,countryId:'kr'}).services[0].id,'local','Keep legacy Korean fallback');
assert.equal(normalizer.testNormalizeLine({...jp,countryId:'kr',schemaVersion:2}).services.length,0,'No fallback for Korea v2');
const elements=new Map,$=selector=>{
  if(!elements.has(selector))elements.set(selector,{addEventListener(){},innerHTML:'',textContent:'',value:'0',hidden:false,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}}});
  return elements.get(selector);
};
const context={console,$,normalize:String,escapeHtml:String,koreanRouteBlockReason:()=>false,addEventListener(){},window:{devicePixelRatio:1}};
vm.createContext(context);
vm.runInContext(strip(read('js/free-drive.js'))+';globalThis.TestFreeDrive=FreeDrive',context);
const drive=new context.TestFreeDrive;
drive.renderMap=()=>{};
const a={id:'jp-a',countryId:'jp',line:{ja:'A'},stations:[
  {id:'a1',ja:'東京',ko:'도쿄',latitude:35.7009,longitude:139.7009},
  {id:'a2',ja:'神田',ko:'칸다',latitude:35.704,longitude:139.704}
]};
const b={id:'jp-b',countryId:'jp',line:{ja:'B'},stations:[
  {id:'b1',ja:'東京',ko:'도쿄',latitude:35.7011,longitude:139.7011},
  {id:'b2',ja:'大手町',ko:'오테마치',latitude:35.705,longitude:139.697}
]};
const distant={id:'jp-c',countryId:'jp',line:{ja:'C'},stations:[
  {id:'c1',ja:'東京',ko:'도쿄',latitude:35.79,longitude:139.79},
  {id:'c2',ja:'竹橋',ko:'다케바시',latitude:35.792,longitude:139.792}
]};
drive.setNetwork([a,b,distant]);
assert.equal(drive.start(a,0),true);
let state=drive.snapshot();
assert.equal(state.node.routeIds.size,2,'Grid boundary cannot split a real interchange');
assert.equal(drive.selectRoute('jp-b'),true,'Line-specific transfer must work');
state=drive.snapshot();
assert.equal(state.station.id,'b1','Use selected line station identity');
assert.notEqual(drive.coordsForRoute(state.node.key,'jp-a')[0],drive.coordsForRoute(state.node.key,'jp-b')[0],'Use each platform coordinate');
assert(state.edges.some(edge=>edge.routeId==='jp-b'&&edge.station?.id==='b2'),'Next target follows selected line');
assert.notEqual(drive.stationKey(a.stations[0]),drive.stationKey(distant.stations[0]),'Distant namesakes stay disconnected');
const bundle=read('js/app.bundle.js');
for(const marker of ['function nexOperatingChoices(','function buildFamousLimitedExpressRoutes(','function selectedServiceEvidence(','this.jpStationClusters=new Map','recordSortKey=\'plays\'','if(route?.countryId===\'jp\')return[];']){
  assert(bundle.includes(marker),'Live bundle lost Japanese service/transfer functionality: '+marker);
}
new vm.Script(bundle,{filename:'js/app.bundle.js'});
console.log(JSON.stringify({status:'PASS',serviceNormalization:true,documentedServicePreserved:true,interchangeMatchesPhysicalPlatforms:true,distantNamesakeSeparate:true,bundleIntegrity:true}));
