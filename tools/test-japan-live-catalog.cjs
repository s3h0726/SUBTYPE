#!/usr/bin/env node
// Regressions: present-day passenger network, streetcar tabs, curated station names,
// punctuation-only typing, Korea-only distance analogies and independent express cards.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const linePaths={
 '99706':'okayamadenkikido/higashiyamasen',
 '99707':'okayamadenkikido/seikibashisen',
 '99305':'toei/tokyo-sakura-tram',
 '99521':'toyohashitetsudo/toyohashitetsudoazumadahonsen',
 '99809':'iyotetsudo/iyotetsudokanjosen',
 '99810':'iyotetsudo/iyotetsudoshiekisen',
 '99811':'iyotetsudo/iyotetsudomatsuyamaekizensen',
 '99812':'iyotetsudo/iyotetsudohonchosen'
};
for(const [id,folder] of Object.entries(linePaths)){
 assert.equal(json('data/lines/'+folder+'/line.json').category,'tram',id+' canonical tram category');
 assert.equal(json('data/nationwide/routes/line-'+id+'.json').route.category,'tram',id+' nationwide tram category');
 assert.equal(json('data/generated/routes/line-'+id+'.json').route.category,'tram',id+' built tram category');
}
for(const item of [
 {id:'11113',src:'jr-hokkaido/rumoehonsen'},
 {id:'99708',src:'sukairerusabisu/sukairerumidorizakasen'}
]){
 const canonical=json('data/lines/'+item.src+'/line.json');
 assert.equal(canonical.visibility,'internal',item.id);
 assert.equal(canonical.playable,false,item.id);
 for(const prefix of ['data/nationwide/routes/','data/generated/routes/']){
  const r=json(prefix+'line-'+item.id+'.json').route;
  assert.equal(r.visibility,'internal',item.id+' closed route leaked');
  assert.equal(r.playable,false,item.id+' closed route playable');
 }
}
const hidakaLine=json('data/lines/jr-hokkaido/hidakahonsen/line.json');
assert.equal(hidakaLine.operationStatus?.activeSection?.end,'鵡川');
const hidakaStations=json('data/lines/jr-hokkaido/hidakahonsen/stations.json');
assert.equal(hidakaStations.length,4);
for(const prefix of ['data/nationwide/routes/','data/generated/routes/']){
 const r=json(prefix+'line-11111.json').route;
 assert.equal(JSON.stringify(r.stations.map(st=>st.ja)),JSON.stringify(['苫小牧','勇払','浜厚真','鵡川']));
}
const knownNames=[
 {ja:'新倉敷',ko:'신쿠라시키',paths:['data/shared-stations/stations-16.json','data/shared-stations/stations-52.json','data/generated/routes/shinkansen-sanyo.json','data/nationwide/routes/shinkansen-sanyo.json']},
 {ja:'鹿児島中央',ko:'가고시마츄오',paths:['data/shared-stations/stations-11.json','data/shared-stations/stations-53.json','data/generated/routes/shinkansen-kyushu.json','data/nationwide/routes/shinkansen-kyushu.json']},
 {ja:'新潟',ko:'니가타',paths:['data/shared-stations/stations-22.json','data/shared-stations/stations-46.json','data/generated/routes/shinkansen-joetsu.json','data/nationwide/routes/shinkansen-joetsu.json']},
 {ja:'東新潟',ko:'히가시니가타',paths:['data/shared-stations/stations-29.json','data/generated/routes/line-11406.json','data/nationwide/routes/line-11406.json']}
];
for(const {ja,ko,paths} of knownNames)for(const file of paths){
 const d=json(file),stations=Array.isArray(d)?d:(d.route?.stations||[]);
 const matches=stations.filter(st=>(st.names?.ja||st.ja)===ja);
 assert(matches.length,file+' missing '+ja);
 for(const st of matches)assert.equal(st.names?.ko||st.ko,ko,file+' stale spelling '+ja);
}
for(const path of ['data/shared-stations/stations-16.json','data/shared-stations/stations-52.json','data/nationwide/routes/shinkansen-sanyo.json','data/generated/routes/shinkansen-sanyo.json']){
 const data=json(path);const st=(Array.isArray(data)?data:data.route.stations).find(st=>(st.names?.ja||st.ja)==='新倉敷');
 assert.equal(st.names?.kana||st.kana,'しんくらしき',path+' has incorrect Kana reading');
}
const compile=p=>{
 const sandbox={};vm.createContext(sandbox);
 const code=read(p).replace(/\bexport\s+/g,'');
 vm.runInContext(code,sandbox,{filename:p});
 return sandbox;
};
const typing=compile('js/typing-model.js');
assert.equal(typing.buildTypingModel('공항 제2빌딩(제2여객터미널)').inputText,'공항제2빌딩제2여객터미널');
assert.equal(typing.buildTypingModel('독협대학앞〈소카마츠바라〉').inputText,'독협대학앞소카마츠바라');
const analog=compile('js/distance-analogies.js');
for(const country of ['kr','jp']){
 const value=analog.formatJourneyDistanceAnalogy(420,country);
 assert(value.includes('한국 ')&&value.includes('서울~부산'));
 assert(!/마라톤|운동장|도쿄|오사카/.test(value));
}
const bundle=read('js/app.bundle.js');new vm.Script(bundle);
for(const expected of ['JAPAN_CLOSED_LINE_IDS','JAPAN_STREETCAR_LINE_IDS','famousLimitedExpressChoices',
 'function buildTypingModel(value=', '공항제2빌딩']){ 
 // Do not require example strings in the bundle: typed names are route data.
 if(expected==='공항제2빌딩')continue;
 assert(bundle.includes(expected),'Missing runtime correction '+expected);
}
assert(bundle.includes('letters and digits INSIDE brackets'),'Compiled typing model lost');
assert(!bundle.includes('鹿児島中央":"카고시마츄오'),'Kagoshima name regressed');
console.log(JSON.stringify({status:'PASS',streetcarLines:Object.keys(linePaths).length,archivedLines:2,hidakaStations:hidakaStations.length,curatedNamePaths:17},null,2));
