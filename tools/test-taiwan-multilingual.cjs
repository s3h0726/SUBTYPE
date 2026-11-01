const cp=require('node:child_process');
const env={...process.env,TW_MULTILINGUAL:'1'};delete env.TW_SCENARIO;
const run=cp.spawnSync(process.execPath,[require('node:path').join(__dirname,'test-taiwan-browser.cjs')],{env,stdio:'inherit'});
if(run.error)console.error(run.error.message);process.exitCode=run.status??1;
