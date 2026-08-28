#!/usr/bin/env node
const path=require('path'),{loadAll,validateWorkspace,lineRoot}=require('./lib/line-workspaces');
const query=String(process.argv.slice(2).filter(value=>value!=='--').join(' ')||'').toLowerCase();
if(!query){console.error('Usage: npm run validate:line -- <line-id | operator/line | line-name>');process.exit(1)}
const data=loadAll(),workspace=data.workspaces.find(item=>[item.line.id,item.line.legacyId,path.relative(lineRoot,item.folder),item.line.names?.ja,item.line.names?.ko,item.line.names?.en].some(value=>String(value||'').toLowerCase().includes(query)));
if(!workspace){console.error(`Line workspace not found: ${query}`);process.exit(1)}
const report=validateWorkspace(workspace);
console.log(`\n${workspace.line.names?.ko||workspace.line.names?.ja||workspace.line.id}\n\nStations              ${report.stations}\nSegments              ${report.segments}\n\nForward route         ${report.forward}\nReverse route         ${report.reverse}\nMissing station       ${report.missingStation}\nSkipped station       ${report.skippedStation}\nMissing geometry      ${report.missingGeometry}\nEndpoint mismatch     ${report.endpointMismatch}\n\nFolder: ${report.folder}\n`);
if(!report.pass){console.error(report.errors.join('\n'));process.exitCode=1}
