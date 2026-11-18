'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/utils.js'),'utf8');
const start=source.indexOf('export function customStationNames(');
assert(start>=0,'Country-aware naming helper must be present');
const api=vm.runInNewContext(source.slice(start).replace(/\bexport\s+/g,'')+'\ncustomStationNames;');
const stations=[
 [{countryId:'jp',ja:'成田空港',ko:'나리타공항'},'나리타공항','成田空港'],
 [{countryId:'kr',ja:'인천공항1터미널',ko:'인천공항1터미널'},'인천공항1터미널','인천공항1터미널'],
 [{countryId:'tw',zh:'桃園機場第一航廈',ko:'타오위안공항 제1터미널'},'타오위안공항 제1터미널','桃園機場第一航廈'],
 [{countryId:'uk',en:'Heathrow Terminals 2 & 3',ko:'히스로 터미널 2·3'},'히스로 터미널 2·3','Heathrow Terminals 2 & 3'],
 [{countryId:'fr',fr:'Aéroport Charles de Gaulle',ko:'샤를드골공항'},'샤를드골공항','Aéroport Charles de Gaulle'],
 [{countryId:'th',th:'สุวรรณภูมิ',ko:'수완나품'},'수완나품','สุวรรณภูมิ']
];
for(const [station,korean,local] of stations)test('display correct '+station.countryId+' station name',()=>{
 const names=api(station,'kr');
 assert.equal(names.countryId,station.countryId);
 assert.equal(names.korean,korean);
 assert.equal(names.local,local);
 assert.equal(names.hasKorean,true);
});
test('missing Korean translation remains visible but is never silently fabricated',()=>{
 const names=api({countryId:'jp',ja:'成田空港',ko:'MISSING_KOREAN_NAME'},'kr');
 assert.equal(names.local,'成田空港');
 assert.equal(names.korean,'成田空港');
 assert.equal(names.hasKorean,false);
});
