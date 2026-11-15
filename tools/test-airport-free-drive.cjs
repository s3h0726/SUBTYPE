'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const airports=require('../js/airport-free-drive.js');
const fixtures=[
  ['ICN','kr',{ko:'인천공항1터미널',latitude:37.447,longitude:126.452}],
  ['GMP','kr',{ko:'김포공항',latitude:37.562,longitude:126.801}],
  ['NRT','jp',{ja:'成田空港',latitude:35.765,longitude:140.39}],
  ['HND','jp',{ja:'羽田空港第3ターミナル',latitude:35.55,longitude:139.766}],
  ['KIX','jp',{ja:'関西空港',latitude:34.436,longitude:135.244}],
  ['HKG','hk',{ja:'機場',latitude:22.315,longitude:113.935}],
  ['TPE','tw',{zh:'機場第二航廈',latitude:25.076,longitude:121.232}]
];
for(const [code,countryId,station] of fixtures){
  test(code+' terminal recognized as a free-drive airport',()=>{
    const route={id:'test-'+code,countryId,line:{ko:'공항철도',en:'Airport Express'},stations:[station]};
    assert.equal(airports.matchesStation(station,route,airports.byCode.get(code)),true);
    assert.equal(airports.detect({station,route})?.code,code);
    assert.equal(airports.findStation(route,airports.byCode.get(code)),0);
    assert.equal(airports.candidate(route,airports.byCode.get(code)),true);
  });
}
test('other-country and geographically distant stations never become airport portals',()=>{
  const nrt=airports.byCode.get('NRT'),gmp=airports.byCode.get('GMP');
  assert.equal(airports.matchesStation({ja:'成田空港',latitude:34,longitude:136},{countryId:'jp'},nrt),false);
  assert.equal(airports.matchesStation({ko:'김포공항',latitude:37.562,longitude:126.801},{countryId:'jp'},gmp),false);
  assert.equal(airports.matchesStation({ko:'나리타공항',latitude:37.562,longitude:126.801},{countryId:'jp'},nrt),false);
});
test('generic Hong Kong airport naming needs verified airport-line context when coordinates missing',()=>{
  const hkg=airports.byCode.get('HKG');
  assert.equal(airports.matchesStation({ja:'機場'},{countryId:'hk',line:{ko:'도시철도'}},hkg),false);
  assert.equal(airports.matchesStation({ja:'機場'},{countryId:'hk',line:{en:'Airport Express'}},hkg),true);
});
test('destination filtering excludes roads, ferries and unpublished services',()=>{
  const airport=airports.byCode.get('ICN'),station={ko:'인천공항1터미널'};
  for(const mode of ['bus','village_bus','brt','river_bus','ferry']){
    assert.equal(airports.candidate({countryId:'kr',mode,stations:[station]},airport),false);
  }
  assert.equal(airports.candidate({countryId:'kr',visibility:'internal',stations:[station]},airport),false);
});
test('published app retains airport initialization and handles flight as a separate action',()=>{
  const app=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
  const bundle=fs.readFileSync(path.join(__dirname,'../js/app.bundle.js'),'utf8');
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(app,/async function flyFreeDriveToAirport\(airport\)/);
  assert.match(bundle,/async function flyFreeDriveToAirport\(airport\)/);
  assert.match(app,/TRTAirportSystem\?\.configure\(\{flyTo:flyFreeDriveToAirport\}\)/);
  assert.match(app,/TRTAirportSystem\?\.update\(state\)/);
  assert(html.indexOf('js/airport-free-drive.js')>=0);
  assert(html.indexOf('js/airport-free-drive.js')<html.indexOf('js/app.bundle.js'));
  assert(html.includes('css/airport-free-drive.css'));
});
