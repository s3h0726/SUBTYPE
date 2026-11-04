'use strict';
// 최신 전국 원본은 기존 검증 스냅샷과 분리하고 다운로드 바이트·날짜·해시를 보존한다.
const fs=require('node:fs'),{Readable}=require('node:stream'),{pipeline}=require('node:stream/promises'),crypto=require('node:crypto');
(async()=>{const dir='.cache/kr-rail';fs.mkdirSync(dir,{recursive:true});const url='https://download.geofabrik.de/asia/south-korea-latest.osm.pbf',response=await fetch(url,{signal:AbortSignal.timeout(240000)});if(!response.ok)throw Error('전국 선로 원본 HTTP '+response.status);
 const file=dir+'/south-korea-20261104.osm.pbf';await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(file));const digest=crypto.createHash('sha256');for await(const part of fs.createReadStream(file))digest.update(part);
 const result={url,file,retrievedAt:new Date().toISOString(),lastModified:response.headers.get('last-modified'),bytes:fs.statSync(file).size,sha256:digest.digest('hex'),license:'ODbL-1.0',attribution:'© OpenStreetMap contributors'};fs.writeFileSync('data/kr/canonical/national-source/rail-osm-current-download.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1});
