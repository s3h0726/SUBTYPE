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
  ['TPE','tw',{zh:'機場第二航廈',latitude:25.076,longitude:121.232}],
  ['PUS','kr',{ko:'공항',latitude:35.173,longitude:128.948}],
  ['FUK','jp',{ja:'福岡空港',latitude:33.598,longitude:130.449}],
  ['CTS','jp',{ja:'新千歳空港',latitude:42.787,longitude:141.68}],
  ['LHR','uk',{en:'Heathrow Terminal 5',latitude:51.4723,longitude:-0.4877}],
  ['LCY','uk',{en:'London City Airport',latitude:51.504,longitude:0.049}],
  ['CDG','fr',{en:'Aéroport Charles de Gaulle 2 TGV',latitude:49.004,longitude:2.571}],
  ['ORY','fr',{en:'Aéroport d’Orly',latitude:48.729,longitude:2.362}],
  ['BKK','th',{en:'Suvarnabhumi',latitude:13.698,longitude:100.751}],
  ['MFM','mo',{ko:'공항',latitude:22.151,longitude:113.591}]
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

test('multi-terminal airports expose explicit independent station targets',()=>{
  const cases=[
    ['ICN','t1','인천공항1터미널','t2','인천공항2터미널','kr'],
    ['NRT','t1','成田空港','t23','空港第2ビル','jp'],
    ['TPE','t1','機場第一航廈','t2','機場第二航廈','tw'],
    ['LHR','t23','Heathrow Terminals 2 & 3','t5','Heathrow Terminal 5','uk'],
    ['CDG','cdg1','Aéroport Charles de Gaulle 1','cdg2','Aéroport Charles de Gaulle 2 TGV','fr']
  ];
  for(const [code,first,firstName,second,secondName,countryId] of cases){
    const airport=airports.byCode.get(code);
    const route={countryId,mode:'rail',stations:[{en:firstName},{en:secondName}]};
    assert.equal(airports.findStation(route,airport,first),0,code+' first station');
    assert.equal(airports.findStation(route,airport,second),1,code+' second station');
    assert.equal(airports.matchesPortal(route.stations[0],route,airport,second),false,code+' no cross-terminal match');
    assert.equal(airports.candidate(route,airport,second),true);
  }
  assert.equal(airports.byCode.get('NRT').portals.some(p=>p.id==='t3'),false,'Narita T3 has no independent rail station');
  assert.equal(airports.airports.length,22);
  assert.equal(airports.airports.reduce((sum,a)=>sum+a.portals.length,0),31);
});
test('a station at a different airport, a bus or a distant alias cannot be a terminal portal',()=>{
  const hnd=airports.byCode.get('HND'), lhr=airports.byCode.get('LHR');
  assert.equal(airports.findStation({countryId:'jp',stations:[{ja:'羽田空港第3ターミナル',lat:35.55,lon:139.77}]},hnd,'t1'),-1);
  assert.equal(airports.matchesPortal({en:'Heathrow Terminal 5',lat:52,lon:0},{countryId:'uk'},lhr,'t5'),false);
  assert.equal(airports.candidate({countryId:'uk',mode:'bus',stations:[{en:'Heathrow Terminal 5'}]},lhr,'t5'),false);
  assert.equal(airports.matchesStation({ko:'공항',lat:35.173,lon:128.948},{countryId:'mo'},airports.byCode.get('MFM')),false);
});
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
  assert.match(app,/async function flyFreeDriveToAirport\(airport,portalId\)/);
  assert.match(bundle,/async function flyFreeDriveToAirport\(airport,portalId\)/);
  assert.match(app,/TRTAirportSystem\?\.configure\(\{flyTo:flyFreeDriveToAirport\}\)/);
  assert.match(app,/TRTAirportSystem\?\.update\(state\)/);
  assert(html.indexOf('js/airport-free-drive.js')>=0);
  assert(html.indexOf('js/airport-free-drive.js')<html.indexOf('js/app.bundle.js'));
  assert(html.includes('css/airport-free-drive.css'));
  assert.match(app,/controller\.findStation\(live,airport,portalId\)/);
  assert.match(bundle,/controller\.findStation\(live,airport,portalId\)/);
});
