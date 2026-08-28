#!/usr/bin/env node
const path=require('path'),{loadAll,validateWorkspace,composeRoute,projectRoot,writeAtomic}=require('./lib/line-workspaces');
const query=String(process.argv.slice(2).filter(value=>value!=='--').join(' ')||'').toLowerCase();
if(!query){console.error('Usage: npm run build:line -- <line-id | operator/line | line-name>');process.exit(1)}
const data=loadAll(),workspace=data.workspaces.find(item=>[item.line.id,item.line.legacyId,item.folder,item.line.names?.ja,item.line.names?.ko,item.line.names?.en].some(value=>String(value||'').toLowerCase().includes(query)));
if(!workspace){console.error(`Line workspace not found: ${query}`);process.exit(1)}
const audit=validateWorkspace(workspace);if(!audit.pass)throw new Error(`Line build blocked:\n${audit.errors.join('\n')}`);
const route=composeRoute(workspace),target=path.join(projectRoot,'data','generated','routes',`${route.id.replace(/[^a-zA-Z0-9._-]/g,'-')}.json`);writeAtomic(target,{route});
console.log(JSON.stringify({status:'PASS',lineId:route.id,folder:audit.folder,stations:audit.stations,segments:audit.segments,output:path.relative(projectRoot,target).split(path.sep).join('/'),note:'Run npm run build:data for the production browser bundle.'},null,2));
