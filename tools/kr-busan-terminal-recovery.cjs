'use strict';
// 같은 공식 종점의 연속된 두 승강장을 방향별로 구분한다. 좌표나 선형을 합치지 않는다.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'kr-regional-busan-build.cjs');let source=fs.readFileSync(filename,'utf8');
function replace(before,after){if(!source.includes(before))throw Error('부산 생성기 계약 변경: '+before);source=source.replace(before,after)}
replace("const village=process.argv.includes('--village'),stem=village?'regional-busan-village':'regional-busan';","const village=process.argv.includes('--village'),originalStem=village?'regional-busan-village':'regional-busan',stem=originalStem+'-terminal-recovery';const pending=new Set(JSON.parse(fs.readFileSync(path.join(out,originalStem+'-queue.json'))).candidates.map(c=>c.routeKey));const ownFile=path.join(out,stem+'-batch.json'),ownIds=new Set(fs.existsSync(ownFile)?JSON.parse(fs.readFileSync(ownFile)).routes.map(r=>r.id):[]);const publishedIds=new Set(JSON.parse(fs.readFileSync(path.join(out,'../generated/index.json'))).routes.map(r=>r.id).filter(id=>!ownIds.has(id)));");
replace('stats.inventory++;const key=row.val1;','const key=row.val1;if(!pending.has(key))continue;stats.inventory++;');
replace("const geometry=coords.slice(1)","if(publishedIds.has('kr-bus-busan-'+rid))continue;const geometry=coords.slice(1)");
replace("if(turns.length!==1)throw Error", "if(turns.length!==1&&!(turns.length===2&&turns[1].i===turns[0].i+1&&turns[0].s.sourceStopId!==turns[1].s.sourceStopId))throw Error");
replace('const turn=turns[0].i;','const turn=turns[0].i,returnStart=turns.at(-1).i;');
replace('stops.slice(turn),bindings.slice(turn)','stops.slice(returnStart),bindings.slice(returnStart)');
replace('turnSequence:turn+1','turnSequence:turn+1,returnSequence:returnStart+1,returnStopId:stops[returnStart].id');
replace("kind:'official-ordered-roundtrip-and-exact-destination-stop'","kind:'official-ordered-roundtrip-and-separate-terminal-platforms'");
source=source.replaceAll("checkedAt:'2026-11-01'","checkedAt:'2026-11-03'");
const child=new Module(filename,module);child.filename=filename;child.paths=module.paths;child._compile(source,filename);
