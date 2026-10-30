#!/usr/bin/env node
'use strict';
// Inventory ALL six JR passenger companies, their playable route-card
// endpoints, every destination in the national service catalog, and
// source-backed Namuwiki references. No invented track/timetable validation.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const unpack=(p,mark)=>JSON.parse(read(p).split(mark)[1].trim().replace(/;\s*$/,''));
const jrOperators=['jr-east','jr-central','jr-west','jr-hokkaido','jr-shikoku','jr-kyushu'];
const index=unpack('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=');
const catalog=unpack('js/nationwide-service-catalog.js','window.TRT_NATIONWIDE_SERVICE_CATALOG=');
const overrides=json('data/editor-overrides.json');
const base='data/generated/routes/';
const allCards=index.routes.filter(r=>jrOperators.includes(r.operatorId)),cards=[];
const faults=[],patterns=[],byCompany={};
const cite=(title)=>'https://namu.moe/w/'+encodeURIComponent(title);
const exactSources={
 'line-11501':{title:'도카이도 본선/JR 도카이',section:'시즈오카 지구',start:'熱海',end:'豊橋'},
 'line-11502':{title:'도카이도 본선/JR 도카이',section:'나고야 지구',start:'豊橋',end:'米原'},
 'line-11319':{title:'우츠노미야선',section:'전 구간',start:'東京',end:'黒磯'},
 'line-11609':{title:'산요 본선',section:'JR 서일본 히메지~오카야마',start:'姫路',end:'岡山'},
 'line-11610':{title:'산요 본선',section:'JR 서일본 오카야마~후쿠야마',start:'岡山',end:'福山'},
 'line-11611':{title:'산요 본선',section:'JR 서일본 후쿠야마~히로시마',start:'福山',end:'広島'},
 'line-11612':{title:'산요 본선',section:'JR 서일본 히로시마~시모노세키',start:'広島',end:'下関'},
 'line-11226':{title:'반에쓰사이선',section:'아이즈와카마쓰~니쓰',start:'会津若松',end:'新津'}
};
const rangeParse=s=>{
 const m=String(s||'').match(/[（(]([^）)]+)[）)]/);
 if(!m||!/[～〜~–—-]/.test(m[1]))return null;
 const bits=m[1].split(/[～〜~–—-]/).map(s=>s.trim());
 if(bits.length!==2)return null;
 return bits;
};
const cleaned=s=>String(s||'').trim().replace(/^\s*JR\s*/i,'').replace(/[\s（（）()]/g,'');
for(const company of jrOperators)byCompany[company]={totalCards:0,titleRangeChecked:0,titleRangeMismatch:0,sourceBacked:0,sourceMismatch:0,catalogPatterns:0,uniqueDestinations:0,routeBlocked:0};
for(const card of allCards){
 const file=base+card.id+'.json';
 let rt;
 try{rt=json(file).route}catch(e){faults.push({kind:'MISSING_GAME_ROUTE',operatorId:card.operatorId,id:card.id,file,error:e.message});continue;}
 const stops=rt.stations||[],start=stops[0],end=stops.at(-1);
 if(!start||!end){faults.push({kind:'EMPTY_STATIONS',operatorId:card.operatorId,id:card.id});continue;}
 const jaR=rangeParse(rt.line?.ja),koR=rangeParse(rt.line?.ko);
 const jaMatch=jaR?jaR[0].split('・').some(x=>cleaned(x)===cleaned(start.ja))&&jaR[1].split('・').some(x=>cleaned(x)===cleaned(end.ja)):null;
 const koMatch=koR?koR[0].split('·').some(x=>cleaned(x)===cleaned(start.ko))&&koR[1].split('·').some(x=>cleaned(x)===cleaned(end.ko)):null;
 const expected=exactSources[card.id]||null;
 const sourceMatch=expected?start.ja===expected.start&&end.ja===expected.end:null;
 const issues=[];
 if(jaMatch===false)issues.push('JAPANESE_TITLE_ENDPOINT_MISMATCH');
 if(koMatch===false)issues.push('KOREAN_TITLE_ENDPOINT_MISMATCH');
 if(expected&&!sourceMatch)issues.push('NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH');
 if(rt.playable===false||rt.geometryReady===false)issues.push('ROUTE_BLOCKED');
 if(start.ja===end.ja&&!rt.loop)issues.push('SAME_ENDPOINT_NON_LOOP');
 const company=byCompany[card.operatorId];company.totalCards++;
 if(jaMatch!==null||koMatch!==null)company.titleRangeChecked++;
 if(jaMatch===false||koMatch===false)company.titleRangeMismatch++;
 if(expected){company.sourceBacked++;if(!sourceMatch)company.sourceMismatch++;}
 if(rt.playable===false||rt.geometryReady===false)company.routeBlocked++;
 const out={id:card.id,operatorId:card.operatorId,ja:rt.line?.ja,ko:rt.line?.ko,
  first:{id:start.id,ja:start.ja,ko:start.ko},last:{id:end.id,ja:end.ja,ko:end.ko},
  stationCount:stops.length,geometryReady:rt.geometryReady,playable:rt.playable!==false,
  titleJaEndpoints:jaR,titleKoEndpoints:koR,titleJaMatchesStops:jaMatch,titleKoMatchesStops:koMatch,
  wiki:expected?{url:cite(expected.title),title:expected.title,section:expected.section,expected:{start:expected.start,end:expected.end},matches:sourceMatch}:null,
  editorTitleOverride:overrides.lines?.[card.id]?.ko||null,issues};
 cards.push(out);
 for(const issue of issues)faults.push({kind:issue,id:card.id,operatorId:card.operatorId,title:out.ko,start:start.ja,end:end.ja,expected:expected&&[expected.start,expected.end]});
 const code=card.id.match(/^line-(\d+)$/)?.[1];
 const cat=code?catalog.lines?.[code]:null,opts=cat?.patterns||[],names=new Set();
 const stationNames=new Set(stops.map(s=>s.ja));
 for(const opt of opts){
  const parts=opt.segments||[];
  const first=parts[0]?.stations?.[0]?.[0],last=parts.at(-1)?.stations?.at(-1)?.[0];
  if(!first||!last)continue;
  names.add(first);names.add(last);company.catalogPatterns++;
  const bad=parts.map(p=>({lineCode:p.lineCode,start:p.stations?.[0]?.[0],end:p.stations?.at(-1)?.[0]}))
    .filter(p=>p.lineCode===code&&!stationNames.has(p.start)&&!stationNames.has(p.end));
  if(bad.length)patterns.push({cardId:card.id,operatorId:card.operatorId,patternId:opt.id,origin:first,destination:last,issues:['SEGMENT_TERMINALS_OUTSIDE_CARD'],bad});
 }
 company.uniqueDestinations+=names.size;
}
const counts={cards:cards.length,sourceBacked:cards.filter(c=>c.wiki).length,
 sourceMismatch:cards.filter(c=>c.wiki?.matches===false).length,
 titleRangeMismatch:cards.filter(c=>c.issues.some(i=>i.endsWith('TITLE_ENDPOINT_MISMATCH'))).length,
 cardsNeedingReview:cards.filter(c=>c.issues.length).length,
 catalogPatternEndpointIssues:patterns.length};
const report={schemaVersion:1,generatedAt:new Date().toISOString(),scope:'all six JR passenger companies',
 sourcePolicy:'Namu wiki pages verified only where explicitly linked. Other cards are validated against physical station IDs and catalog; no invented verification.',
 caveats:'Route section != train service destination. Actual departure terminus may differ from section boundary; not all TrainLCD patterns are current. No fabricated tracks, no unlocking broken services.',
 counts,byCompany,cards,faults,patterns};
fs.mkdirSync(path.join(root,'reports/jr'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/jr/namuwiki-destination-inventory.json'),JSON.stringify(report,null,2)+'\n');
const flagged=cards.filter(c=>c.issues.length);
fs.writeFileSync(path.join(root,'reports/jr/namuwiki-destination-review.md'),
 '# JR 전 노선 행선지·구간명 검증\n\n출처 확정: 나무위키 개별 문서에서 실제 노선 구간을 교차 확인한 것만. 나머지는 내부 물리 선로·역순서 기반 감사이며 나무위키 직접 검증을 주장하지 않습니다.\n\n'
 +'| 항목 | 결과 |\n|---|---:|\n'
 +Object.entries(counts).map(([k,v])=>'| '+k+' | '+v+' |').join('\n')+'\n\n'
 +'| 회사 | 카드 | 구간명 검증 | 불일치 | 나무위키 대조 | 출처 불일치 | 운행계통 패턴 | 목적지 개수 |\n|---|---:|---:|---:|---:|---:|---:|---:|\n'
 +Object.entries(byCompany).map(([k,v])=>'| '+[k,v.totalCards,v.titleRangeChecked,v.titleRangeMismatch,v.sourceBacked,v.sourceMismatch,v.catalogPatterns,v.uniqueDestinations].join(' | ')+' |').join('\n')
 +'\n\n## 이름과 실제 경계가 다른 카드\n\n'
 +(flagged.length?flagged.map(c=>'- '+c.id+' '+c.ko+' / '+c.first.ja+' → '+c.last.ja+' / '+c.issues.join(', ')).join('\n'):'없음')
 +'\n\n각 카드의 상세 결과 및 원본출처: [namuwiki-destination-inventory.json](./namuwiki-destination-inventory.json)\n');
console.log(JSON.stringify({status:'REVIEW_REQUIRED',counts,byCompany,flagged:flagged.slice(0,20).map(c=>({id:c.id,ja:c.ja,start:c.first.ja,end:c.last.ja,issues:c.issues}))},null,2));
if(cards.length<220||counts.sourceBacked<4)throw Error('JR inventory insufficient '+cards.length+'/'+counts.sourceBacked);
