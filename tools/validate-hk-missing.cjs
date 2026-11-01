const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const dir='reports/hong-kong/missing-20261102';fs.mkdirSync(dir,{recursive:true});
const protectedBase=process.env.HK_PROTECTED_BASE_REF||'7edf6b43';
const files=['data/hk/master/network.json','data/hk/generated/index.json','js/hong-kong-index-data.js','js/app.bundle.js','index.html',...fs.readdirSync('data/hk/generated/routes').map(f=>'data/hk/generated/routes/'+f)];
const hash=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),before=hash(),commands=[];
function run(name,args){const r=cp.spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:16e6}),output=(r.stdout||'')+(r.stderr||'');fs.writeFileSync(dir+'/'+name+'.txt',output);commands.push({name,args,exitCode:r.status});console.log(name,r.status);}
run('build-hk',['tools/build-hk-data.cjs']);run('build-app',['tools/build-app-bundle.js']);
const after=hash(),rebuildChanged=files.filter(f=>before[f]!==after[f]);
run('contracts',['--test','tools/test-hk-missing.cjs','tools/test-hk-completion.cjs','tools/test-hk-phase6.cjs','tools/test-track-motion.cjs','tools/test-free-drive-transfers.cjs']);
run('selector',['tools/test-hk-route-selector.cjs']);run('syntax',['--check','js/app.bundle.js']);
run('typing',['tools/test-typing-model.js']);run('ime-fixture',['tools/test-ime-controller.js']);
run('japan-nex',['tools/test-nex-game-routes.cjs']);run('korea-current',['tools/test-kr-canonical.cjs']);
const protectedFiles=cp.execFileSync('git',['diff','--name-only',protectedBase,'--','data/kr','data/generated','data/tw','data/jp','data/japan','js/auth.js','js/storage.js','js/leaderboard.js','supabase'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const report={checkedAt:new Date().toISOString(),baseline:'7edf6b43',protectedBase,status:commands.every(c=>c.exitCode===0)&&!rebuildChanged.length&&!protectedFiles.length?'PASS':'FAIL',commands,rebuildChanged,protectedFiles,baselineDirections:103,addedDirections:2,playableDirections:105,engineJourneys:210,notTested:['Mobile390x844 layout in this change','Windows native IME','Physical mobile keyboard','Live Supabase account','Comparable AUTO performance benchmark'],performanceClaim:'No performance improvement claimed; historical AUTO failure retained.'};
fs.writeFileSync(dir+'/validation.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(dir+'/generated-hashes.json',JSON.stringify(after,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
