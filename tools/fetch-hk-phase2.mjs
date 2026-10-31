import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'data/hk/sources/phase2');
fs.mkdirSync(dir,{recursive:true});
const manifestPath=path.join(root,'data/hk/sources/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestPath));
const ids=[2941790,3263757,3264047,4088518,5317704,6485218,6485219,6582965,6582966];
const items=ids.map(id=>[`relation-${id}.json`,`https://api.openstreetmap.org/api/0.6/relation/${id}/full.json`]);
items.push(['mtr-stations.csv','https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv'],['light-rail.html','https://www.mtr.com.hk/en/customer/services/schedule_index.html'],['mtr-system.html','https://www.mtr.com.hk/en/customer/services/system_map.html'],['mtr-copyright.html','https://www.mtr.com.hk/en/customer/main/copyright.html'],['mtr-terms.html','https://www.mtr.com.hk/en/customer/main/terms_of_use.html'],['mtr-map.pdf','https://www.mtr.com.hk/archive/en/services/routemap.pdf'],['tram-home.html','https://www.hktramways.com/'],['tram-logo-release.pdf','https://www.hktramways.com/media/files/press-releases/New%20logo_Press%20Release%20-%20Eng.pdf'],['peak-home.html','https://www.thepeak.com.hk/en']);
for(const [file,url] of items){
 const key='phase2/'+file,target=path.join(dir,file);
 if(fs.existsSync(target)&&!process.argv.includes('--refresh'))continue;
 try{
  const response=await fetch(url,{headers:{'User-Agent':'SUBTYPE-HongKong-Railway/2.0 (+https://github.com/s3h0726/SUBTYPE)'},signal:AbortSignal.timeout(40000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());fs.writeFileSync(target,bytes);
  const softError=/Website Temporarily Not Available|網站服務暫停/.test(bytes.toString('utf8'));
  manifest[key]={sourceUrl:url,sourceType:file.startsWith('relation-')?'osm':'official',checkedAt:'2026-10-20',retrievedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),license:file.startsWith('relation-')?'ODbL-1.0':'REVIEW_REQUIRED',status:softError?'INCOMPLETE':'retrieved',...(softError?{reason:'HTTP 200 soft error: MTR Website Temporarily Not Available'}:{})};
  console.log('retrieved',key,bytes.length);
 }catch(error){manifest[key]={sourceUrl:url,checkedAt:'2026-10-20',status:'INCOMPLETE',reason:error.message};console.log('INCOMPLETE',key,error.message)}
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 if(file.startsWith('relation-'))await new Promise(resolve=>setTimeout(resolve,1500));
}
