#!/usr/bin/env node
// Changes-only import: preserve every line not explicitly listed in CSV.
import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),filename=path.join(root,'data/edited/lines-changes-only.csv');
const raw=fs.readFileSync(filename,'utf8').replace(/^\uFEFF/,'');
const rows=raw.trim().split(/\r?\n/).slice(1);
function parse(s){return [...s.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(x=>x[1].replaceAll('""','"'))}
const seen=new Set,operatorNames=new Map;let touched=0,modified=0,skipped=0;
for(const line of rows){
 const [oid,on,id,ko,ja,en,rawColor,original]=parse(line);
 if(!id||!original||seen.has(id))throw Error('Duplicate or incomplete line '+id);
 seen.add(id);
 const target=id==='line-99329'?'data/lines/keisei/keiseimatsudosen/line.json':original;
 if(!/^data\/lines\/[a-z0-9-]+\/[a-z0-9-]+\/line\.json$/.test(target))throw Error('Invalid path '+target);
 const full=path.join(root,target);if(!fs.existsSync(full))throw Error('Missing source '+target);
 const doc=JSON.parse(fs.readFileSync(full,'utf8'));if(doc.id!==id)throw Error('ID mismatch '+id);
 const previous=JSON.stringify(doc);
 doc.names={...doc.names,...(ko?{ko}:{}),...(ja&&id!=='line-99329'?{ja}:{}),...(en&&id!=='line-99329'?{en}:{})};
 if(id==='line-99329')doc.operatorId='keisei';
 const color=rawColor.trim();if(color&&!/^#[0-9a-fA-F]{6}$/.test(color))throw Error('Invalid color '+id+': '+color);
 if(color)doc.color=color;
 if(previous!==JSON.stringify(doc)){fs.writeFileSync(full,JSON.stringify(doc,null,2)+'\n');modified++}else skipped++;
 if(oid!=='shinkeiseidentetsu')operatorNames.set(oid,on);
 touched++;
}
for(const [oid,ko] of operatorNames){const file=path.join(root,'data/operators',oid,'operator.json');if(!fs.existsSync(file))throw Error('Missing operator '+oid);const op=JSON.parse(fs.readFileSync(file,'utf8'));if(op.names?.ko!==ko){op.names={...op.names,ko};fs.writeFileSync(file,JSON.stringify(op,null,2)+'\n')}}
console.log(JSON.stringify({rows:rows.length,processed:touched,modified,unchanged:skipped,operatorNames:operatorNames.size}));
