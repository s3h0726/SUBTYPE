'use strict';
// 공식 공개 화면과 자료를 제한된 병렬 요청으로 수집한다. 오류도 출처 목록에 남긴다.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../data/kr/canonical/national-source');fs.mkdirSync(dir,{recursive:true});
const args=process.argv.slice(2),jobs=[];for(let i=0;i<args.length;i+=2)jobs.push({name:args[i],url:args[i+1]});
let cursor=0;const results=[];
(async()=>{await Promise.all(Array.from({length:4},async()=>{while(cursor<jobs.length){const job=jobs[cursor++];let result;for(let n=0;n<2;n++){try{const response=await fetch(job.url,{signal:AbortSignal.timeout(15000)}),bytes=Buffer.from(await response.arrayBuffer());if(!response.ok)throw Error('HTTP '+response.status);fs.writeFileSync(path.join(dir,job.name),bytes);result={...job,status:response.status,bytes:bytes.length,retrievedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(bytes).digest('hex')};break;}catch(e){result={...job,error:e.message,retrievedAt:new Date().toISOString()};}}results.push(result);console.log(JSON.stringify(result));}}));fs.writeFileSync(path.join(dir,'공식수집-'+Date.now()+'.json'),JSON.stringify(results,null,2)+'\n');})();
