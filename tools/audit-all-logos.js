#!/usr/bin/env node
// Inventory only canonical source files, never generated bundles.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const walk=(folder,predicate,out=[])=>{if(!fs.existsSync(folder))return out;for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,entry.name);if(entry.isDirectory())walk(p,predicate,out);else if(predicate(p))out.push(p)}return out};
const toRel=p=>path.relative(root,p).split(path.sep).join('/');
const assetFor=(folder,stem)=>['svg','png','webp'].map(ext=>path.join(folder,stem+'.'+ext)).find(p=>fs.existsSync(p));
const collect=(source,filename,stem)=>walk(path.join(root,source),p=>path.basename(p)===filename).sort().map(p=>{const data=JSON.parse(fs.readFileSync(p,'utf8'));const asset=assetFor(path.dirname(p),stem);const meta=data[stem==='logo'?'logo':'symbol']||{};return{id:data.id,operatorId:data.operatorId||data.id,name:data.names?.ko||data.names?.ja||'',sourceFile:toRel(p),localAsset:asset?toRel(asset):null,externalSource:meta.assetSourceUrl||meta.source||'',assetDeclared:meta.asset||null,originalExists:meta.officialSymbolExists??null,verified:meta.verified===true,status:asset?'LOCAL':meta.assetSourceUrl||meta.source?'EXTERNAL_METADATA_ONLY':'NO_LOCAL_ASSET'}});
const operators=collect('data/operators','operator.json','logo');
const lines=collect('data/lines','line.json','symbol');
const summary={operators:operators.length,lines:lines.length,localOperatorLogos:operators.filter(x=>x.localAsset).length,localLineSymbols:lines.filter(x=>x.localAsset).length,missingLocalOperatorLogos:operators.filter(x=>!x.localAsset).length,missingLocalLineSymbols:lines.filter(x=>!x.localAsset).length};
const result={generatedAt:new Date().toISOString(),scope:'canonical file inventory; does not count dynamic external mappings',summary,operators,lines};
const output=process.argv.includes('--write')?path.join(root,'data','LOGO_COVERAGE_AUDIT.json'):null;
if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({summary,output:output?toRel(output):null}));
