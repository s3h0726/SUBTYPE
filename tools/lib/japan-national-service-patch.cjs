'use strict';
function applyJapanNationalServiceReviews(catalog,review){
 if(catalog?.schemaVersion!==2||review?.countryId!=='jp'||!catalog.lines)throw Error('INVALID_JAPANESE_REVIEW_INPUT');
 const clone=JSON.parse(JSON.stringify(catalog)),lines=clone.lines,reviewed=new Set;
 const byId=new Map(review.reviewedChanges.filter(x=>x.kind==='replace').map(x=>[x.patternId,x]));
 const suspended=new Map(review.reviewedChanges.filter(x=>x.kind==='discontinue').flatMap(x=>x.patternIds.map(id=>[id,x])));
 const names=new Map(review.koreanNameFixes.map(x=>[x.ja,x]));
 const add=(code,pattern)=>{
  const line=lines[code];if(!line)throw Error('UNKNOWN_CATALOG_LINE:'+code);
  const prior=line.patterns.find(p=>p.id===pattern.id);
  if(prior){if(JSON.stringify(prior)!==JSON.stringify(pattern))throw Error('CONFLICTING_REVIEWED_SERVICE:'+code+':'+pattern.id);return}
  line.patterns.push(JSON.parse(JSON.stringify(pattern)));
 };
 for(const [code,line] of Object.entries(lines))for(const p of line.patterns||[]){
  const invalid=byId.get(p.id);
  if(invalid){p.status='superseded';p.statusReason=invalid.reason;p.statusSource=review.sources[invalid.sourceKey];reviewed.add(code+':'+p.id)}
  const ended=suspended.get(p.id);
  if(ended&&(!ended.onlyWhenTypeJa||p.type?.ja===ended.onlyWhenTypeJa)){p.status='discontinued';p.endedAt=ended.endedAt;p.statusSource=review.sources[ended.sourceKey];reviewed.add(code+':'+p.id)}
  const fix=names.get(p.type?.ja);
  if(fix){
   if(p.type.ko!==fix.from&&p.type.ko!==fix.to)throw Error('UNEXPECTED_TRANSLATION:'+code+':'+p.id);
   p.type.ko=fix.to;reviewed.add(code+':'+p.id);
  }
 }
 if(!lines[review.shinkansen.catalogCode]||lines[review.shinkansen.catalogCode].ja!=='西九州新幹線')throw Error('WEST_KYUSHU_IDENTITY_MISMATCH');
 const sh=review.shinkansen;
 for(const v of sh.variants){
  if(v.stopNames[0]!==sh.origin||v.stopNames.at(-1)!==sh.destination||!v.stopNames.every(x=>sh.stations.includes(x)))throw Error('INVALID_KAMOME_STOP_SEQUENCE:'+v.id);
  const allowed=new Set(v.stopNames);
  const pattern={id:v.id,type:{ja:v.labelJa,ko:v.labelKo,en:v.labelEn,operatingNameJa:'かもめ',kind:4,priority:0,direction:0},segments:[{lineCode:sh.catalogCode,stations:sh.stations.map(name=>[name,allowed.has(name)?0:1])}],officialSource:review.sources[sh.sourceKey],reviewedAt:review.reviewedAt,serviceKind:'nishi-kyushu-shinkansen'};
  add(sh.catalogCode,pattern);reviewed.add(sh.catalogCode+':'+pattern.id);
 }
 const relay=review.relay;
 if(relay.segments.length!==3)throw Error('INVALID_RELAY_SEGMENT_COUNT');
 const relayPattern={id:relay.patternId,type:{ja:relay.japanese,ko:relay.korean,en:relay.english,kind:4,priority:0,direction:0},segments:relay.segments.map(s=>{
   if(!relay.lineCodes.includes(s.lineCode)||(!s.calls.includes(s.from)&&s.from!=='肥前山口')||(!s.calls.includes(s.to)&&s.to!=='肥前山口'))throw Error('INVALID_RELAY_SEGMENT:'+s.lineCode);
   const stops=[s.from,...s.calls.filter(x=>x!==s.from&&x!==s.to),s.to];
   return{lineCode:s.lineCode,stations:[...new Set(stops)].map(name=>[name,s.calls.includes(name)?0:1])};
 }),officialSource:review.sources[relay.sourceKey],reviewedAt:review.reviewedAt,serviceKind:'conventional-limited-express',sourceStationNameNote:relay.note};
 for(const code of relay.lineCodes){add(code,relayPattern);reviewed.add(code+':'+relay.patternId)}
 clone.japanServiceReview={reviewedAt:review.reviewedAt,sourceFile:'data/japan-national-service-reviews.json',modifiedEntries:reviewed.size};
 return clone;
}

module.exports={applyJapanNationalServiceReviews};
