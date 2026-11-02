'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../data/kr/canonical/national-source');fs.mkdirSync(dir,{recursive:true});
const pairs=process.argv.slice(2);const records=[];
(async()=>{for(let i=0;i<pairs.length;i+=2){const [name,url]=pairs.slice(i,i+2);try{const r=await fetch(url,{signal:AbortSignal.timeout(25000)});const b=Buffer.from(await r.arrayBuffer());fs.writeFileSync(path.join(dir,name),b);const text=b.toString('utf8');records.push({name,url,status:r.status,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex'),retrievedAt:new Date().toISOString()});console.log(name,r.status,b.length,[...text.matchAll(/src=["']([^"']+\.js[^"']*)/g)].map(m=>m[1]).slice(-20));}catch(e){records.push({name,url,error:e.message,cause:e.cause?.message});console.log(name,e.message,e.cause?.message)}}fs.writeFileSync(path.join(dir,'fetch-'+Date.now()+'.json'),JSON.stringify(records,null,2));})();
