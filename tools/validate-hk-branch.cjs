const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'reports/hong-kong');fs.mkdirSync(dir,{recursive:true});
const commands=[
 ['--check','js/app.bundle.js'],
 ['--test','tools/test-hk-network.cjs','tools/test-kr-network.cjs','tools/test-kr-osm-order.cjs','tools/test-kr-topology-corrections.cjs','tools/test-kric-calls.cjs','tools/test-kr-timetable-bindings.cjs','tools/test-track-motion.cjs','tools/test-free-drive-transfers.cjs','tools/test-kr-service-reconstruction.cjs','tools/test-kr-station-names.cjs','tools/test-kr-access-policy.cjs','tools/test-kr-stop-bindings.cjs'],
 ['tools/test-typing-model.js'],['tools/test-ime-controller.js'],['tools/validate-data.js'],['tools/validate-service-patterns.js'],['tools/test-service-route-resolver.js'],['tools/audit-ui-quality.js'],['tools/validate-korea-data.js'],['tools/test-single-source.js']
];
const results=[];let log='Hong Kong branch validation — '+new Date().toISOString()+'\n';
for(const args of commands){
 const protectedAudit=path.join(root,'data/nationwide/UI_AUDIT.json'),originalAudit=args[0]==='tools/audit-ui-quality.js'?fs.readFileSync(protectedAudit):null;
 let result;try{result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});if(originalAudit)fs.copyFileSync(protectedAudit,path.join(dir,'legacy-ui-audit.json'))}finally{if(originalAudit)fs.writeFileSync(protectedAudit,originalAudit)}
 const status=result.status===0?'PASS':'FAIL';results.push({command:'node '+args.join(' '),status,exitCode:result.status,signal:result.signal});log+='\n$ node '+args.join(' ')+'\n'+result.stdout+result.stderr+'\nEXIT_CODE '+result.status+'\n';console.log(status,args.join(' '));fs.writeFileSync(path.join(dir,'validation.txt'),log);fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(results,null,2)+'\n')
}
process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
