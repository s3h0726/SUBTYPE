// Collect existing published Korean labels. Candidates require manual review;
// neither this crawler nor a translation engine can approve a release.
const fs=require('node:fs'),crypto=require('node:crypto');
const directory='output/hk/phase5/korean-research';fs.mkdirSync(directory,{recursive:true});
const official=JSON.parse(fs.readFileSync('data/hk/master/tram-stop-review.json')).identities;
const slug=s=>s.toLowerCase().replace(/'/g,'-').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const initial='https://www.yeogi.com/accommodation/hk/city-hong-kong-island/sutherland-street-tram-stop',links=new Map,visited=new Set,sources=[];
links.set(initial,{url:initial,label:'',lng:114.145});
(async()=>{for(let round=0;round<12;round++){
 let next=round===0?links.get(initial):[...links.values()].filter(x=>!visited.has(x.url)).sort((a,b)=>b.lng-a.lng)[0];if(!next)break;visited.add(next.url);
 const file=directory+'/'+next.url.split('/').at(-1)+'.html';let html;
 try{if(fs.existsSync(file))html=fs.readFileSync(file,'utf8');else if(round===0&&fs.existsSync('output/hk/phase5-yeogi.html'))html=fs.readFileSync('output/hk/phase5-yeogi.html','utf8');else{const r=await fetch(next.url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);html=await r.text();await new Promise(r=>setTimeout(r,750))}fs.writeFileSync(file,html)}catch(e){console.log('INCOMPLETE',next.url,e.message);continue}
 const sha256=crypto.createHash('sha256').update(html).digest('hex');sources.push({url:next.url,rawSha256:sha256});
 for(const m of html.matchAll(/<a\b[^>]*href="(\/accommodation\/hk\/city-hong-kong-island\/[^"<]+-tram-stop)"[^>]*>([\s\S]*?)<\/a>/g)){
 const url='https://www.yeogi.com'+m[1],label=m[2].replace(/<[^>]*>/g,'').trim();if(!/[가-힣]/.test(label)||label.length>90)continue;
 const key=m[1].split('/').at(-1).replace(/-tram-stop$/,''),match=official.filter(p=>slug(p.nameEn)===key);
 if(!links.has(url))links.set(url,{url,label,lng:Math.max(0,...match.map(p=>p.originalCoordinates.lng)),officialIds:match.map(p=>p.id),officialEnglish:match[0]?.nameEn||null,sourceUrl:next.url,sourceHash:sha256,status:'REVIEW_REQUIRED'});
 }
 const matched=[...links.values()].filter(x=>x.officialIds?.length);console.log(round,next.url.split('/').at(-1),matched.length,'published labels');
 fs.writeFileSync(directory+'/candidates.json',JSON.stringify({checkedAt:'2026-10-24',sourceType:'published-korean-tourism-localization',translationMethodDisclosed:false,taskUsesMachineTranslation:false,sources,candidates:[...links.values()].filter(x=>x.officialIds?.length)},null,2)+'\n');
 if(new Set(matched.flatMap(x=>x.officialIds)).size===official.length)break;
}})();
