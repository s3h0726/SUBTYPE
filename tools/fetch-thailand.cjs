'use strict';
// 공개 원자료를 변경 감지 가능한 스냅샷으로 저장한다. 인증 장벽은 우회하지 않는다.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/th/source');
fs.mkdirSync(dir,{recursive:true});
const manifestFile=path.join(dir,'manifest.json'),manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile)):{};
async function download(file,url){
 if(fs.existsSync(path.join(dir,file))&&!process.argv.includes('--refresh')&&manifest[file]?.url===url)return true;
 try{const response=await fetch(url,{signal:AbortSignal.timeout(45000),headers:{'User-Agent':'SUBTYPE Thailand railway import; source attribution retained'}});if(!response.ok)throw Error('HTTP '+response.status);const bytes=Buffer.from(await response.arrayBuffer()),sha256=crypto.createHash('sha256').update(bytes).digest('hex');fs.writeFileSync(path.join(dir,file),bytes);manifest[file]={url,sha256,retrievedAt:new Date().toISOString(),bytes:bytes.length};console.log('수집 완료: '+file)}catch(error){manifest[file]={url,error:error.message};console.warn('수집 보류: '+file+' '+error.message)}
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 return !manifest[file].error;
}
(async()=>{
 await download('srt-index.json','https://transit.longdo.com/api/srt/index.json');
 const srt=JSON.parse(fs.readFileSync(path.join(dir,'srt-index.json')));
 for(const file of ['stations','segments','trains'])await download(file+'.json',`https://transit.longdo.com/api/srt/${srt.build}/${file}.json`);
 await download('tiles-catalog.json','https://ms.longdo.com/3dtiles/catalog.json');
 const tiles=JSON.parse(fs.readFileSync(path.join(dir,'tiles-catalog.json'))),bkk=tiles.datasets.find(d=>d.id==='rail.bangkok-trains');
 await download('bangkok-lines.json','https://ms.longdo.com/3dtiles/'+bkk.lines);
 await download('timetable_data.js','https://ttsview.railway.co.th/timetable_modern/timetable_data.js?v=2026.01.22');
 for(let line=1;line<=6;line++)for(let trip=1;trip<=2;trip++)for(const ln of ['th','en'])await download(`srt-${line}-${trip}-${ln}.html`,`https://ttsview.railway.co.th/SRT_Schedule2022.php?ln=${ln}&line=${line}&trip=${trip}`);
 await download('current-network.json','https://rotfai.live/api/network');
 if(await download('current-live.json','https://rotfai.live/api/live')){
  const live=JSON.parse(fs.readFileSync(path.join(dir,'current-live.json'),'utf8'));
  for(const t of live.trains.filter(t=>!t.freight&&t.cat==='passenger')){const file='current-train-'+t.no+'.json',url='https://rotfai.live/api/train/'+t.id;if(fs.existsSync(path.join(dir,file))&&manifest[file]?.url===url&&!process.argv.includes('--refresh'))continue;await new Promise(r=>setTimeout(r,3000));if(!await download(file,url)){console.warn('공급자 오류 이후 추가 열차 요청을 중단합니다.');break}}
 }
})();
