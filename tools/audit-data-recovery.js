#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const baseline=read('data/RECOVERY_BASELINE.json'),categories=['jr','subway','private','other','shinkansen'];
function summarize(routes,operators){const stationIds=new Set;let relations=0;for(const route of routes){for(const station of route.stations||[]){relations++;stationIds.add(station.stationMasterId||station.id)}}return{operators,lines:routes.length,stations:stationIds.size,lineStationRelations:relations}}
const curatedRoutes=categories.flatMap(category=>read(`data/lines/${category}.json`).routes||[]);
const curated={...summarize(curatedRoutes,(read('data/operators/operators.json').operators||[]).length),stations:(read('data/stations/tokyo-stations.json').stations||[]).length};
const index=read('data/nationwide/index.json'),nationwideRoutes=[];
for(const meta of index.routes||[]){const file=String(meta.lazySource||'').replace(/^\.\//,'');if(!file||!fs.existsSync(path.join(root,file)))throw new Error(`Missing nationwide route file: ${file||meta.id}`);nationwideRoutes.push(read(file).route)}
const nationwide=summarize(nationwideRoutes,(index.operators||[]).length);
const operatorAssets=Object.keys(read('data/operator-assets.json').operators||{}).length,lineSymbols=Object.keys(read('data/route-symbol-assets.json').assets||{}).length;
const ratio=(now,before)=>before?Math.max(0,(before-now)/before):0,losses=[];
for(const scope of ['curated','nationwide'])for(const key of ['operators','lines','stations','lineStationRelations']){const amount=ratio(eval(scope)[key],baseline[scope][key]);if(amount>baseline.maximumUnapprovedLossRatio)losses.push(`${scope}.${key}: ${(amount*100).toFixed(1)}% loss`)}
if(ratio(operatorAssets,baseline.assets.operatorRegistryEntries)>baseline.maximumUnapprovedLossRatio)losses.push('operator asset registry dropped over 10%');
if(ratio(lineSymbols,baseline.assets.lineSymbolRegistryEntries)>baseline.maximumUnapprovedLossRatio)losses.push('line symbol registry dropped over 10%');
const labels=nationwideRoutes.map(route=>`${route.operator?.ko} ${route.line?.ko} ${route.line?.ja}`);
const representatives={yamanote:/야마노테선/.test(labels.join('\n')),chuoSobu:/츄오·소부선/.test(labels.join('\n')),tokaidoShinkansen:/도카이도 신칸/.test(labels.join('\n')),yurikamome:/유리카모메/.test(labels.join('\n')),tokyoMetro:/도쿄 메트로/.test(labels.join('\n')),midosuji:/미도스지선/.test(labels.join('\n')),localPrivate:nationwideRoutes.some(route=>route.category==='private'&&!/JR|東京|大阪|Tokyo|Osaka/.test(`${route.operator?.ja}${route.operator?.en}`))};
if(Object.values(representatives).some(value=>!value))losses.push('representative line coverage failed');
const report={generated:new Date().toISOString(),lastKnownGoodCommit:baseline.lastKnownGoodCommit,legacy:baseline.nationwide,recovered:nationwide,curated,missingLines:Math.max(0,baseline.nationwide.lines-nationwide.lines),missingRelations:Math.max(0,baseline.nationwide.lineStationRelations-nationwide.lineStationRelations),unexplainedDataLoss:losses,operatorAssets,lineSymbols,representatives,buildSafe:losses.length===0};
fs.writeFileSync(path.join(root,'data','nationwide','DATA_RECOVERY_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(losses.length)process.exitCode=1;
