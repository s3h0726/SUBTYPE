#!/usr/bin/env node
// Produce review candidates; no unverified global ㄱ→ㅋ / ㄷ→ㅌ rewriting.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),src=path.join(root,'data/shared-stations');
const records=[],guarded=[];
const rules=[
 {key:'京成-keisei',ja:/京成/,ko:/게이세이/,suggest:s=>s.replaceAll('게이세이','케이세이')},
 {key:'温泉-onsen',ja:/温泉/,ko:/온선/,suggest:s=>s.replaceAll('온선','온센')},
 {key:'東上-tojo',ja:/東上/,ko:/도조|도죠/,suggest:s=>s.replaceAll('도조','토죠').replaceAll('도죠','토죠')},
 {key:'小倉-region',ja:/小倉/,ko:/오구라|고쿠라/,suggest:(s,x)=>{let c=x.coordinates||{};return (+c.lat>=33.3&&+c.lat<=34.3&&+c.lng>=129.5&&+c.lng<=131.2)?s.replaceAll('오구라','고쿠라'):s}}
];
for(const name of fs.readdirSync(src).filter(n=>/^stations-\d+\.json$/.test(n))){
 const stations=JSON.parse(fs.readFileSync(path.join(src,name),'utf8'));
 for(const st of stations){
  const ko=st.names?.ko||'',ja=st.names?.ja||'';
  for(const rule of rules)if(rule.ja.test(ja)&&rule.ko.test(ko)){
   const proposed=rule.suggest(ko,st);
   const entry={id:st.id,ja,ko,proposed,rule:rule.key,kana:st.names?.kana||'',coordinates:st.coordinates,namuwikiSearch:'https://namu.wiki/Search?q='+encodeURIComponent(ja+' 역'),status:proposed===ko?'PRESERVE_VARIANT_OR_REVIEW':'REVIEW_NOT_AUTOMATIC'};
   (proposed===ko?guarded:records).push(entry);
  }
  // More expansive screening is restricted to potentially ambiguous long sound/name transcription;
  // retain real Japanese-script evidence for human per-title verification.
  if(/게이|도죠|토조|온선|오구라|고쿠라/.test(ko)&&!rules.some(r=>r.ja.test(ja)&&r.ko.test(ko)))guarded.push({id:st.id,ja,ko,kana:st.names?.kana||'',status:'JAPANESE_TITLE_REQUIRED'});
 }
}
const output={policy:'Never blanket-convert Korean voiced/unvoiced initials; check exact Japanese spelling and individual Namuwiki article.',generated:new Date().toISOString(),summary:{correctableCandidates:records.length,ambiguousOrPreserved:guarded.length},reviewCandidates:records,preservedAndReview:guarded};
const dest=path.join(root,'data/source-audit/STATION_INITIAL_CONSONANT_NAMUWIKI_REVIEW.json');fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output.summary));
