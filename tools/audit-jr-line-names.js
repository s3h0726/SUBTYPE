#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const operators=new Set(['jr-east','jr-west','jr-central','jr-hokkaido','jr-kyushu','jr-shikoku']);
const out=[];
for(const op of operators){
  const base=path.join(root,'data','lines',op);
  if(!fs.existsSync(base))continue;
  for(const ent of fs.readdirSync(base,{withFileTypes:true})){
    if(!ent.isDirectory())continue;
    const file=path.join(base,ent.name,'line.json');
    if(!fs.existsSync(file))continue;
    const line=JSON.parse(fs.readFileSync(file,'utf8'));
    out.push({
      operatorId:op,
      id:line.id,
      ja:line.names?.ja||'',
      kana:line.names?.kana||'',
      ko:line.names?.ko||'',
      en:line.names?.en||'',
      file:path.relative(root,file).replaceAll('\\','/')
    });
  }
}
out.sort((a,b)=>a.operatorId.localeCompare(b.operatorId)||a.ja.localeCompare(b.ja,'ja'));
const report={generated:new Date().toISOString(),count:out.length,records:out};
fs.mkdirSync(path.join(root,'data','source-audit'),{recursive:true});
fs.writeFileSync(path.join(root,'data','source-audit','JR_LINE_NAME_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({count:out.length,output:'data/source-audit/JR_LINE_NAME_AUDIT.json'},null,2));
