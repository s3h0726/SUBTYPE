#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/names/nationwide-20261101/tests');fs.mkdirSync(out,{recursive:true});
const suites=[
 ['registry',['tools/test-japan-station-registry.cjs']],['editor-runtime',['tools/test-editor-station-runtime.cjs']],['editor-table',['tools/test-korean-name-editor-namuwiki.cjs']],['trilingual-published',['tools/test-japan-trilingual-published.cjs']],['namuwiki-published',['tools/test-japan-namuwiki-published.cjs']],
 ['current-policy',['tools/test-japan-namuwiki-policy.cjs']],
 ['service-patterns',['tools/validate-service-patterns.js']],['service-resolver',['tools/test-service-route-resolver.js']],['shinkansen',['tools/test-japan-shinkansen-services.cjs']],['shonan',['tools/test-shonan-shinjuku-service-journeys.cjs']],['ueno-tokyo',['tools/test-ueno-tokyo-line.cjs']],['joban',['tools/test-ueno-tokyo-joban.cjs']],
 ['free-drive-motion',['--test','tools/test-free-drive-transfers.cjs','tools/test-track-motion.cjs']],['typing',['tools/test-typing-model.js']],['ime',['tools/test-ime-controller.js']],['coordinates',['tools/test-jp-route-station-coordinates.cjs']],
 ['free-drive-flow',['--test','tools/test-free-drive-target-selection.cjs','tools/test-free-drive-step-flow.cjs']],
 ['taiwan',['--test','tools/test-taiwan.cjs']],['hong-kong-selector',['tools/test-hk-route-selector.cjs']],['korea',['tools/test-kr-canonical.cjs']],['legacy-data-validator',['tools/validate-data.js']]
];
const results=[];
for(const [name,args] of suites){const r=cp.spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:20000000});fs.writeFileSync(path.join(out,name+'.log'),(r.stdout||'')+(r.stderr||''));results.push({name,exitCode:r.status,status:r.status===0?'PASS':'FAIL',log:'tests/'+name+'.log'});console.log(name+': '+results.at(-1).status)}
const baseline='a99da94bddb853adb7a3fc15195535202cd8a778',legacyInputs=['data/stations/tokyo-stations.json',...['jr','subway','private','other','shinkansen'].map(c=>'data/lines/'+c+'.json')];
const legacyInputsUnchanged=legacyInputs.every(p=>cp.execFileSync('git',['show',baseline+':'+p],{cwd:root,maxBuffer:64000000}).toString().replace(/\r\n/g,'\n')===fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n'));
const missingPath='data/generated/routes/line-11229--jobansen-totte-iwaki.json',missingAtBaseline=cp.spawnSync('git',['cat-file','-e',baseline+':'+missingPath],{cwd:root}).status!==0;
const report={baseline,scope:'자동 검사 명령 단위 집계. 각 명령의 내부 fixture 수와 브라우저 실행 수는 별도 보고.',passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,results,baselineEvidence:{legacyValidatorInputsUnchanged:legacyInputsUnchanged,uenoFixtureMissingAtBaseline:missingAtBaseline},knownFailures:results.filter(r=>r.status==='FAIL').map(r=>({...r,classification:r.name==='legacy-data-validator'&&legacyInputsUnchanged?'기존 curated 역 원본 중복 ID':r.name==='ueno-tokyo'&&missingAtBaseline?'기존 검사에서 참조하는 과거 경로 파일 누락':'추가 검토 필요'}))};
fs.writeFileSync(path.join(out,'../tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,knownFailures:report.knownFailures.map(r=>({name:r.name,reason:r.classification}))}));
if(report.knownFailures.some(r=>r.classification==='추가 검토 필요'))process.exitCode=1;
