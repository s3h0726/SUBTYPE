#!/usr/bin/env node
// Run: node tools/apply-lines-edited-csv.mjs
// Apply user CSV to canonical line workspace files. Existing station/track geometry stays untouched.
import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();const file=path.join(root,'data/edited/lines-edited.csv');
const rows=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1);
function parse(s){return [...s.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(x=>x[1].replaceAll('""','"'))}
let changed=0,absent=[];const operators=new Map;
for(const row of rows){const [opId,opKo,id,ko,ja,en,rawColor,original]=parse(row);if(!id||!original)throw Error('Missing ID or path');let target=id==='line-99329'?'data/lines/keisei/keiseimatsudosen/line.json':original;
if(!/^data\/lines\/[\w-]+\/[\w-]+\/line\.json$/.test(target))throw Error('Unsafe path '+target);const full=path.join(root,target);if(!fs.existsSync(full)){absent.push(id);continue}const line=JSON.parse(fs.readFileSync(full,'utf8'));if(line.id!==id)throw Error('ID mismatch '+id);
line.names={...line.names,...(ko?{ko}:{}),...(ja&&id!=='line-99329'?{ja}:{}),...(en&&id!=='line-99329'?{en}:{})};if(id==='line-99329')line.operatorId='keisei';
const color=rawColor.trim();if(/^#[0-9A-Fa-f]{6}$/.test(color))line.color=color;
fs.writeFileSync(full,JSON.stringify(line,null,2)+'\n');operators.set(opId,opKo);changed++;
}
for(const [id,ko] of operators){if(id==='shinkeiseidentetsu')continue;const p=path.join(root,'data/operators',id,'operator.json');if(!fs.existsSync(p))continue;const op=JSON.parse(fs.readFileSync(p,'utf8'));op.names={...op.names,ko};fs.writeFileSync(p,JSON.stringify(op,null,2)+'\n');}
console.log(JSON.stringify({csvRows:rows.length,updated:changed,missing:absent},null,2));if(absent.length)process.exitCode=1;
