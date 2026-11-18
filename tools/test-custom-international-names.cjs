'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=file=>fs.readFileSync(path.join(__dirname,'..','js',file),'utf8')
  .replace(/\bimport(?=\s|\{)[^;]+;/g,'').replace(/\bexport\s+/g,'');
const context=vm.createContext({});
vm.runInContext(source('utils.js')+';globalThis.customNames=customStationNames;globalThis.displayKorean=koreanStationDisplayName;',context);
const names=context.customNames;
test('custom stations keep their own country when itinerary starts elsewhere',()=>{
 const cases=[
  [{countryId:'kr',ko:'인천공항1터미널',ja:'인천공항1터미널'},'인천공항1터미널'],
  [{countryId:'jp',ko:'나리타공항',ja:'成田空港'},'成田空港'],
  [{countryId:'uk',ko:'히스로 터미널 5',en:'Heathrow Terminal 5',ja:'히스로'},'Heathrow Terminal 5'],
  [{countryId:'fr',ko:'샤를드골 공항',fr:'Aéroport Charles-de-Gaulle',ja:''},'Aéroport Charles-de-Gaulle'],
  [{countryId:'tw',ko:'타오위안 공항',zh:'桃園機場'},'桃園機場'],
  [{countryId:'hk',ko:'홍콩국제공항',zh:'機場'},'機場'],
  [{countryId:'mo',ko:'타이파',zh:'氹仔'},'氹仔'],
  [{countryId:'th',ko:'수완나품 공항',th:'สุวรรณภูมิ'},'สุวรรณภูมิ']
 ];
 for(const [station,local] of cases){
  assert.equal(names(station,'kr').local,local);
  assert.equal(names(station,'kr').hasKorean,true);
 }
});
test('nested names display without a ja key and do not invent Korean names',()=>{
 const uk=names({countryId:'uk',names:{en:'Paddington',ko:'패딩턴'}},'jp');
 assert.equal(uk.local,'Paddington');assert.equal(uk.korean,'패딩턴');
 const missing=names({countryId:'fr',fr:'Châtelet'},'kr');
 assert.equal(missing.local,'Châtelet');assert.equal(missing.hasKorean,false);
});
test('game targets and prompts use the destination country for CUSTOM stations',()=>{
 vm.runInContext(source('game.js')+';globalThis.GameForTest=Game;',context);
 const game=Object.create(context.GameForTest.prototype);
 game.route={category:'custom',countryId:'kr',mode:'rail'};
 const japan={countryId:'jp',ko:'나리타공항',ja:'成田空港'};
 const uk={countryId:'uk',ko:'런던 히스로',en:'London Heathrow',ja:''};
 assert.equal(game.stationNativeName(japan),'成田空港');
 assert.equal(game.stationKoreanName(japan),'나리타공항');
 assert.equal(game.stationNativeName(uk),'London Heathrow');
 assert.equal(game.stationKoreanName(uk),'런던 히스로');
 assert(game.answerValues(uk).length>0);
});
test('schematic displays local and Korean station names across country changes',()=>{
 vm.runInContext(source('route-renderer.js')+';globalThis.drawSchematic=renderSvg;',context);
 const el={innerHTML:''};
 const route={countryId:'kr',category:'custom',line:{ko:'국제 공항 경유'},lineColor:'#e84747',loop:false,
  stations:[{id:'CT01',countryId:'kr',ja:'인천공항1터미널',ko:'인천공항1터미널'},
   {id:'CT02',countryId:'jp',ja:'成田空港',ko:'나리타공항',airportIncomingTransfer:{kind:'virtual-flight',fromCode:'ICN',toCode:'NRT'}}]};
 context.drawSchematic(el,route,{editable:false});
 assert.match(el.innerHTML,/成田空港/);
 assert.match(el.innerHTML,/나리타공항/);
 assert.match(el.innerHTML,/인천공항1터미널/);
 assert.match(el.innerHTML,/✈/);
});
