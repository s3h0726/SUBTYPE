#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const productionRoots=['index.html','data-health.html','css','js','data','assets','custom-routes'];
const railway=/[🚆🚉🚄🚅🚇🚈🚊🚝🚞🚋🚂🚃🚎]/gu;
const transport=/[🚍🚌🚐🚑🚒🚓🚔🚕🚖🚗🚘🚙🛻🚚🚛🚜🏎🏍🛵🦽🦼🛺🚲🛴🛹🛼🚏🛣🛤🛞🚨🚥🚦🛑🚧⚓🛟⛵🛶🚤🛳⛴🛥🚢✈🛩🛫🛬🪂💺🚁🚟🚠🚡🛰🚀🛸]/gu;
const extensions=new Set(['.html','.css','.js','.json','.svg']);
const files=[];
function walk(target){const stat=fs.statSync(target);if(stat.isDirectory()){for(const entry of fs.readdirSync(target))walk(path.join(target,entry));return}if(extensions.has(path.extname(target)))files.push(target)}
for(const item of productionRoots){const target=path.join(root,item);if(fs.existsSync(target))walk(target)}
const matches=[];
for(const file of files){const value=fs.readFileSync(file,'utf8');for(const regex of [railway,transport]){regex.lastIndex=0;for(const match of value.matchAll(regex)){const line=value.slice(0,match.index).split(/\r?\n/).length,context=value.slice(Math.max(0,match.index-180),match.index+180);matches.push({file:path.relative(root,file).replaceAll('\\','/'),line,emoji:match[0],context})}}}
const unique=[...new Map(matches.map(item=>[`${item.file}:${item.line}:${item.emoji}`,item])).values()];
const category=pattern=>unique.filter(item=>pattern.test(`${item.file} ${item.context}`)).length;
const counts={productionUi:unique.length,lineSymbol:category(/line.?symbol|line.?badge|노선.?심볼/i),operatorLogo:category(/operator.?logo|운영사.?로고/i),trainMarker:category(/trainIcon|osm-train|train.?marker|열차.?marker/i),stationIcon:category(/stationIcon|station.?marker|station.?icon|역.?아이콘/i),buttonIcon:category(/<button|button.?icon|버튼.?아이콘/i)};
for(const item of unique)delete item.context;
const report={generated:new Date().toISOString(),status:unique.length?'FAIL':'PASS',counts,matches:unique};
fs.writeFileSync(path.join(root,'data','nationwide','RAILWAY_EMOJI_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
console.log(`RAILWAY EMOJI IN PRODUCTION UI      ${counts.productionUi}`);
console.log(`EMOJI USED AS LINE SYMBOL           ${counts.lineSymbol}`);
console.log(`EMOJI USED AS OPERATOR LOGO         ${counts.operatorLogo}`);
console.log(`EMOJI USED AS TRAIN MARKER          ${counts.trainMarker}`);
console.log(`EMOJI USED AS STATION ICON          ${counts.stationIcon}`);
console.log(`EMOJI USED AS BUTTON ICON           ${counts.buttonIcon}`);
if(unique.length){console.error(JSON.stringify(unique,null,2));process.exitCode=1}
