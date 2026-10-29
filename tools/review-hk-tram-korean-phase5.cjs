// Record the manual review of collected published Korean station documents.
// No transliteration/translation algorithm supplies a label.
const fs=require('node:fs'),crypto=require('node:crypto'),{norm}=require('./lib/hk-geometry.cjs');
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const identities=read('data/hk/master/tram-stop-review.json').identities,rows=read('output/hk/phase5/tram-pages/candidates.json').rows;
const page=title=>{const r=rows.find(r=>r.title===title);if(!r?.rawSha256)throw Error('Missing reviewed document '+title);const file='output/hk/phase5/tram-pages/'+crypto.createHash('sha256').update(r.url).digest('hex').slice(0,16)+'.html';const html=fs.readFileSync(file,'utf8');if(crypto.createHash('sha256').update(html).digest('hex')!==r.rawSha256)throw Error('Changed candidate page');const text=html.replace(/<[^>]*>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\[ruby\(([^,]+),[^\]]+\)\]/g,'$1').replace(/\s+/g,' ');return{...r,text}};
// Explicitly reviewed discrepancies in secondary-source Chinese/English. The
// operator bilingual name/code remains authoritative; only Korean usage is taken.
const exceptions={
 "Queen's Road West":{title:'퀸즈대로 서단 정류장',note:'Community皇後 vs operator皇后; exact English and05E/96W agree.'},
 'Cotton Tree Drive':{title:'코튼트리로 정류장',note:'Community紅棉路 vs operator紅棉道; exact English and66W agree.'},
 'Admiralty MTR Station':{title:'애드미럴티역 정류장',ko:'애드미럴티',note:'Community金鐘站 vs operator金鐘港鐵站;35E/64W and English agree. Display removes descriptive 역 and matches existing reviewed MTR Korean name.'},
 'Hoi Foo Street':{title:'호이푸가 정류장',note:'Community English accidentally repeats Street. Official海富街 and06W/95E identify the stop, Korean heading unchanged.'},
 'Sun Sing Street':{title:'산싱가 정류장',note:'Community新城街 vs operator新成街. Exact English and04W agree; retain operatorChinese.'},
 'Pottinger Street':{title:'포틴저가 정류장',note:'Community砵典乍 vs operator砵甸乍. Exact English and72W agree; retain operatorChinese.'},
 'Queen Street':{title:'퀸가 정류장',note:'Community皇後 vs operator皇后. Exact English and17E agree.'}
};
const neighbors={
 'Man Wa Lane':{title:'길만가 정류장',ko:'만와리',anchor:'74W',note:'Individual Man Wa pages404. Published Gilman74W westbound table explicitly labels next stop 만와리; official sequence74W→76W→WMT independently identifies Man Wa Lane.'},
 'Fenwick Street':{title:'루아드로 정류장',ko:'펜윅가',anchor:'41E',note:'Individual page404. Published Luard41E eastbound table labels previous stop 펜윅가; official37E→39E→41E identifies Fenwick.'},
 'Fleming Road':{title:'토노치로 정류장',ko:'플레밍로',anchor:'47E',note:'Individual page404. Published Tonnochy47E eastbound table labels previous 플레밍로; official43E→45E→47E identifies Fleming.'},
 'Swatow Street':{title:'그레슨가 정류장',ko:'스와토가',anchor:'60W',note:'Individual page404. Published Gresson60W westbound table labels next 스와토가; official56W→58W→60W identifies Swatow.'}
};
const terminals={SKT:'샤우케이완',WMT:'웨스턴마켓',HVT_B:'해피밸리',HVT_K:'해피밸리',NPT:'노스포인트',WST:'섹통추이',CBT:'코즈웨이베이',KTT:'케네디타운'};
const overviewFile='data/hk/sources/phase4/tram-korean.html',overview=fs.readFileSync(overviewFile,'utf8'),facts=[],reviews=[];
for(const s of identities){let source,ko,note,excerpt,hash;
 if(terminals[s.code]){ko=terminals[s.code];if(!overview.includes(ko))throw Error('Absent published terminal label');source={url:'https://www.namu.moe/w/'+encodeURIComponent('홍콩 트램')};hash=crypto.createHash('sha256').update(overview).digest('hex');note='Published Korean overview lists this actual terminus with Chinese/English identity. Remove descriptive 종점 only; preserve proper place name.';excerpt=ko+' / '+s.nameEn+' / '+s.nameZhHant;}
 else{const exception=exceptions[s.nameEn],neighbor=neighbors[s.nameEn];let r=exception?page(exception.title):neighbor?page(neighbor.title):rows.filter(r=>r.matches?.some(x=>x.id===s.id)).map(r=>page(r.title))[0];if(!r)throw Error('Unreviewed Korean stop '+s.code+' '+s.nameEn);
  ko=exception?.ko||neighbor?.ko||r.title.replace(/ 정류장$/,'');source=r;hash=r.rawSha256;
  if(neighbor){if(!r.text.includes(ko)||!r.text.includes(neighbor.anchor))throw Error('Changed neighbor evidence');note=neighbor.note;const at=r.text.indexOf(ko);excerpt=r.text.slice(Math.max(0,at-35),at+ko.length+45)}
  else{if(!r.text.includes(s.code))throw Error('Missing official code in reviewed document '+s.code);if(!exception&&norm(r.headerEnglish)!==norm(s.nameEn))throw Error('English heading mismatch');note=exception?.note||'Exact English heading, official directional stop code, Chinese identity and published Korean document heading manually cross-checked.';excerpt=r.text.slice(r.text.indexOf(r.title,r.title.length)+r.title.length,Math.min(r.text.indexOf(r.title,r.title.length)+r.title.length+160,r.text.length)).split('#!if')[0]}
 }
 facts.push({id:s.id,officialCode:s.code,officialEnglish:s.nameEn,officialChinese:s.nameZhHant,publishedKoreanLabel:ko,sourceUrl:source.url,rawSha256:hash,excerpt,note});
 reviews.push({id:s.id,nameKo:ko,status:'verified',sourceUrl:source.url,sourceType:'reviewed-korean-community-usage',checkedAt:'2026-10-24',confidence:'medium',officialKoreanDesignation:false,sourceIsMachineTranslationOnly:false,sourceEnglishName:s.nameEn,sourceChineseName:s.nameZhHant,evidenceFile:'data/hk/sources/phase5/tram-korean-facts.json',officialIdentitySource:'https://www.hktramways.com/js/nextTramData.js',note});
}
write('data/hk/sources/phase5/tram-korean-facts.json',{checkedAt:'2026-10-24',method:'Manually reviewed published Korean station headings and explicit neighboring-station tables against official bilingual codes; no machine translation used. Chinese errors in community documents never overwrite official names.',facts});
const p='data/hk/master/surface-name-review.json',review=read(p);review.stations=review.stations.filter(s=>!s.id.startsWith('hk-tram-stop-')).concat(reviews);write(p,review);
const m='data/hk/sources/manifest.json',manifest=read(m),file='data/hk/sources/phase5/tram-korean-facts.json';manifest['phase5/tram-korean-facts.json']={sourceUrl:'https://www.namu.moe/xref/'+encodeURIComponent('홍콩'),sourceType:'reviewed-published-korean-facts',checkedAt:'2026-10-24',status:'retrieved',license:'Factual station-name extracts with attribution; source article text/artwork not redistributed.',sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};write(m,manifest);
console.log({reviewedTramRecords:reviews.length,physicalLabels:new Set(reviews.map(r=>r.nameKo)).size,priorLightRailReviews:review.stations.filter(s=>s.id.startsWith('hk-lr-')).length});
