// Source retrieval only; raw official evidence is retained with byte hashes.
const fs=require('node:fs'),crypto=require('node:crypto');
const dir='data/hk/sources/missing-20261102';fs.mkdirSync(dir,{recursive:true});
(async()=>{const manifest=JSON.parse(fs.readFileSync('data/hk/sources/manifest.json','utf8'));
// The 2022 PDF origin currently serves maintenance HTML. Its independently
// reviewed search-index routing excerpt is retained by configure-hk-missing.
for(const [name,url]of [['light-rail.html','https://www.mtr.com.hk/en/customer/services/schedule_index.html']]){
 const response=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error(name+' HTTP '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());if(name.endsWith('.pdf')&&!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))throw Error('Expected original official PDF, got maintenance page');
 if(name==='light-rail.html'&&(!bytes.includes(Buffer.from('507P'))||!bytes.includes(Buffer.from('07:42'))))throw Error('Current 507P timetable changed; manual operation review required');
 fs.writeFileSync(dir+'/'+name,bytes);manifest['missing-20261102/'+name]={sourceUrl:url,sourceType:'official',checkedAt:new Date().toISOString(),status:'retrieved',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),license:'REVIEW_REQUIRED'};console.log(name,bytes.length);
}fs.writeFileSync('data/hk/sources/manifest.json',JSON.stringify(manifest,null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1});
