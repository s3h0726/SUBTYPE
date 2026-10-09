#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8'));
const errors=[],refs=index.routes.filter(r=>r.dataKind==='trainService');
for(const route of refs){
 if(route.playable!==false||route.visibility!=='internal')errors.push(route.id+': nonverified service shown as playable');
 if(!route.serviceNote)errors.push(route.id+': missing limited scope warning');
 if(!route.lazySource||!fs.existsSync(path.join(root,route.lazySource)))errors.push(route.id+': missing detail');
}
const byMode={};for(const r of index.routes)byMode[r.mode]=(byMode[r.mode]||0)+1;
const result={status:errors.length?'FAIL':'PASS',total:index.routes.length,visible:index.routes.filter(x=>x.playable!==false&&x.visibility!=='internal').length,nonplayableTrainCorridors:refs.length,byMode,errors};
console.log(JSON.stringify(result,null,2));if(errors.length)process.exitCode=1;
