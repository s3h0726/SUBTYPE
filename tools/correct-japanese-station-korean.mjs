#!/usr/bin/env node
// Conservative corrections to Korean station names; never infer a Namuwiki title verification.
import fs from 'node:fs';import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),folder=path.join(root,'data/shared-stations'),changed=[],review=[];
const files=fs.readdirSync(folder).filter(f=>/^stations-\d+\.json$/.test(f)).sort();
const add=(station,file,before,after,rule)=>{
 station.names.ko=after;
 station.aliases??={};station.aliases.ko=[...new Set([...(station.aliases.ko||[]),before])];
 station.koVerified=false;station.koReviewStatus='REVIEW_REQUIRED';
 station.koSource='orthographic-rule-based-correction';
 station.koSourceMethod='ja-script-and-regional-qualified';
 station.koSearchReference='site:namu.wiki "'+station.names.ja+'역"';
 changed.push({id:station.id,ja:station.names.ja,before,after,rule,file:'data/shared-stations/'+file});
};
for(const file of files){
 const full=path.join(folder,file),stations=JSON.parse(fs.readFileSync(full,'utf8'));let modified=false;
 for(const s of stations){
  const ja=String(s.names?.ja||''),ko=String(s.names?.ko||'');
  let next=ko;const rules=[];
  // Keisei's Japanese name is 京成: write 케이세이 consistently.
  if(ja.includes('京成')&&next.includes('게이세이')){next=next.replaceAll('게이세이','케이세이');rules.push('京成: 케이세이')}
  // Initial consonants are per-title decisions. Preserve ド→도 in 東武/富山,
  // rather than applying an indiscriminate ㄷ→ㅌ conversion.
  // 温泉 is onsen; never apply to unrelated names lacking those characters.
  if(ja.includes('温泉')&&next.includes('온선')){next=next.replaceAll('온선','온센');rules.push('温泉: 온센')}
  // 東上 is Tōjō: fix line-associated station strings only.
  if(ja.includes('東上')&&/도조|도죠/.test(next)){next=next.replaceAll('도조','토죠').replaceAll('도죠','토죠');rules.push('東上: 토죠')}
  // 小倉 has two distinct readings: only Kokura in Kitakyushu/Fukuoka region.
  const lat=Number(s.coordinates?.lat),lon=Number(s.coordinates?.lng);
  if(ja.includes('小倉')&&next.includes('오구라')&&lat>=33.3&&lat<=34.3&&lon>=129.5&&lon<=131.2){next=next.replaceAll('오구라','고쿠라');rules.push('北九州 小倉: 고쿠라')}
  if(next!==ko){add(s,file,ko,next,rules.join('; '));modified=true}
  else if((/게이세이|도죠|온선|오구라/.test(ko))){review.push({id:s.id,ja,ko,lat,lon,note:'Unqualified or possibly different Japanese reading; check Namuwiki title'})}
 }
 if(modified)fs.writeFileSync(full,JSON.stringify(stations,null,2)+'\n');
}
const dir=path.join(root,'data/source-audit');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'STATION_KOREAN_CORRECTIONS_2026-10-11.json'),JSON.stringify({basis:'Conservative Japanese script/region corrections; not independently Namuwiki-title verified',changes:changed,needsNamuwikiTitleReview:review},null,2)+'\n');
console.log(JSON.stringify({processedShards:files.length,corrected:changed.length,needsTitleReview:review.length,samples:changed.slice(0,12)}));
