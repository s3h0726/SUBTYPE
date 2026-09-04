#!/usr/bin/env node
const fs=require('fs'),os=require('os'),path=require('path'),vm=require('vm');
const {discoverAsset}=require('./build-korea-data');
const root=path.resolve(__dirname,'..'),errors=[];
const fail=message=>errors.push(message),read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

const index=JSON.parse(read('data/kr/generated/index.json'));
const representative=index.routes.find(route=>route.id==='kr-seoul-line-2');
if(!representative)fail('Korean representative route is missing from the lazy index');

const source=`${read('js/rail-data-repository.js').replace(/\bexport\s+/g,'')}\nglobalThis.__coreTest={railDataRepository,resolveProjectAsset};`;
const context={URL,document:{baseURI:'https://example.test/SUBTYPE/'}};
vm.createContext(context);vm.runInContext(source,context,{filename:'rail-data-repository.js'});
const repository=context.__coreTest.railDataRepository;
repository.configure({operators:index.operators,lines:index.routes,stations:[],assets:index.assets});
if(!repository.getOperator('kr-seoul-metro'))fail('Operator lookup failed');
if(repository.getLine('kr-seoul-line-2')?.names?.ko!=='서울 지하철 2호선')fail('Line lookup failed');
if(repository.getRoute('kr-seoul-line-2')?.id!=='kr-seoul-line-2')fail('Route lookup failed');

if(representative){
  const payload=JSON.parse(read(representative.lazySource)).route,resolved=repository.resolveRoute(payload),stationId=resolved.stations[0]?.id;
  if(!stationId||repository.getStation(stationId)?.names?.ko!==resolved.stations[0].ko)fail('Canonical station lookup after lazy hydration failed');
  if(repository.getLineStations(resolved.id).length!==resolved.stations.length)fail('Line-station lookup after lazy hydration failed');
}

const resolved=context.__coreTest.resolveProjectAsset('data/kr/operators/example/logo.svg?v=abc');
if(resolved!=='https://example.test/SUBTYPE/data/kr/operators/example/logo.svg?v=abc')fail(`GitHub Pages base-path asset resolution failed: ${resolved}`);

const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'subtype-core-assets-'));
try{
  fs.writeFileSync(path.join(fixture,'logo.webp'),'webp');
  fs.writeFileSync(path.join(fixture,'logo.png'),'png');
  let found=discoverAsset(fixture,'logo',fixture);
  if(found?.file!=='logo.png'||!/^logo\.png\?v=[0-9a-f]{12}$/.test(found?.asset||''))fail('PNG/WebP asset discovery priority or cache version failed');
  fs.writeFileSync(path.join(fixture,'logo.svg'),'<svg/>');
  found=discoverAsset(fixture,'logo',fixture);
  if(found?.file!=='logo.svg')fail('SVG-first asset discovery failed');
  fs.writeFileSync(path.join(fixture,'symbol.svg'),'<svg id="symbol"/>');
  found=discoverAsset(fixture,'symbol',fixture);
  if(found?.file!=='symbol.svg')fail('Line symbol auto-discovery failed');
}finally{fs.rmSync(fixture,{recursive:true,force:true})}

const result={status:errors.length?'FAIL':'PASS',operatorLookup:!errors.some(error=>error.includes('Operator lookup')),lineLookup:!errors.some(error=>error.includes('Line lookup')),stationLookup:!errors.some(error=>error.includes('station lookup')),routeLookup:!errors.some(error=>error.includes('Route lookup')),assetAutoDiscovery:!errors.some(error=>error.includes('asset discovery')||error.includes('symbol auto-discovery')),projectBasePath:!errors.some(error=>error.includes('base-path')),jpCounts:JSON.parse(read('data/generated/build-baseline.json')),krCounts:index.counts,errors};
console.log(JSON.stringify(result,null,2));process.exitCode=errors.length?1:0;
