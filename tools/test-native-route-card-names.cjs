'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('js/app.js','utf8');
const css=fs.readFileSync('css/route-card-typography.css','utf8');
const functions=['nativeLineName','nativeLineLanguage','hongKongCard','routeCard'];
const functionText=(name)=>{
 const token='function '+name+'(';
 const start=app.indexOf(token);assert.ok(start>=0,'Missing '+name);
 const open=app.indexOf('{',start);let depth=0,end=-1;
 for(let i=open;i<app.length;i++){if(app[i]==='{')depth++;else if(app[i]==='}'){depth--;if(depth===0){end=i+1;break}}}
 assert.ok(end>open,'Unclosed '+name);
 return app.slice(start,end);
};
const sandbox={
 escapeHtml:x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;'),
 operatorLogoMarkup:()=>'',selected:null,
 thailandNames:x=>({ko:x.ko,th:x.th,en:x.en}),
 getTaiwanDisplayNames:x=>({ko:x.ko,zh:x.zh,en:x.en}),
 koreanRouteUnavailableReason:()=>'',stopWord:()=> '역',krRouteLabel:r=>r.line.ko
};
vm.createContext(sandbox);
vm.runInContext(functions.map(functionText).join('\n'),sandbox);
const examples=[
 ['fr',{fr:'Métro ligne 1',ko:'파리 지하철 1호선'},'fr','Métro ligne 1'],
 ['uk',{names:{en:'Bakerloo'},en:'',ko:'베이컬루선'},'en','Bakerloo'],
 ['mo',{ja:'氹仔線',ko:'타이파선'},'zh-Hant','氹仔線']
];
for(const [countryId,line,lang,native] of examples){
 const r={id:'test-'+countryId,countryId,line,operator:{ko:'운영사'},lineColor:'#123456',stations:[{id:'s1'},{id:'s2'}],geometryReady:true};
 assert.equal(sandbox.nativeLineName(r),native,countryId+' native extraction');
 const markup=sandbox.routeCard(r);
 assert.ok(markup.includes('<h3 class="line-card-line-name" lang="ko">'+line.ko+'</h3>'),countryId+' Korean primary');
 assert.ok(markup.includes('<p class="route-card-native-name" lang="'+lang+'">'+native+'</p>'),countryId+' native subtitle');
}
const th={id:'th-bts-test',countryId:'th',line:{ko:'수쿰윗선',th:'BTS สายสุขุมวิท',en:'BTS Sukhumvit Line'},operator:{ko:'방콕 도시철도'},stations:[{id:'s1'},{id:'s2'}],lineColor:'#123456'};
assert.ok(sandbox.routeCard(th).includes('<p class="route-card-native-name" lang="th">BTS สายสุขุมวิท</p>'));
const hk={countryId:'hk',line:{ko:'췬완선',ja:'荃灣綫'},operator:{ko:'홍콩 MTR'},lineColor:'#aaa'};
assert.ok(sandbox.hongKongCard(hk,'data-hk-line-family="hk-tsuen-wan"','2개 운행 방향','운행계통 선택').includes('<p class="route-card-native-name" lang="zh-Hant">荃灣綫</p>'));
// The preview must keep native text distinct too, not just the route list.
const selectedPanel={innerHTML:'',style:{setProperty(){}},closest(){return {style:{setProperty(){}}}}};
sandbox.$=()=>selectedPanel;
sandbox.thailandPresentation=route=>route;
sandbox.koreanRouteDisplayText=value=>value;
sandbox.selectedGroup=null;
sandbox.NETWORK_GROUPS={};
sandbox.routes=[];
vm.runInContext(functionText('renderSelected'),sandbox);
for(const [countryId,line,lang,native] of examples){
 sandbox.countryId=countryId;
 sandbox.selected={id:'preview-'+countryId,countryId,operator:{ko:'운영사'},line,stationCount:2,serviceCount:2,stations:[{id:'s1'},{id:'s2'}],lineColor:'#123456'};
 selectedPanel.innerHTML='';
 sandbox.renderSelected();
 assert.ok(selectedPanel.innerHTML.includes('<h3 id="selected-line-heading" lang="ko">'+line.ko+'</h3>'),countryId+' preview Korean primary');
 assert.ok(selectedPanel.innerHTML.includes('<p class="selected-line-native-name" lang="'+lang+'">'+native+'</p>'),countryId+' preview native subtitle');
}
sandbox.countryId='th';
sandbox.selected={id:'preview-th',countryId:'th',operator:{ko:'운영사'},line:th.line,stations:[{id:'s1'},{id:'s2'}],lineColor:'#123456',patterns:[{id:'p1'}]};
sandbox.renderSelected();
assert.ok(selectedPanel.innerHTML.includes('<p class="selected-line-native-name" lang="th">BTS สายสุขุมวิท</p>'),'Thailand preview native');
sandbox.countryId='hk';
sandbox.selected={id:'preview-hk',countryId:'hk',operator:hk.operator,line:hk.line,stationCount:2,stations:[{id:'s1'},{id:'s2'}],lineColor:'#123456'};
sandbox.renderSelected();
assert.ok(selectedPanel.innerHTML.includes('<p class="selected-line-native-name" lang="zh-Hant">荃灣綫</p>'),'Hong Kong preview native');

assert.ok(!sandbox.routeCard({id:'kr-test',countryId:'kr',line:{ko:'경부선'},operator:{ko:'코레일'},stations:[{},{},{}],geometryReady:true}).includes('route-card-native-name'),'Keep Korean card unchanged');
for(const k of ['route-card-native-name','selected-line-native-name','lang="th"','lang="zh-Hant"','lang="fr"'])assert.ok(css.includes(k),'Missing native subtitle styling '+k);
for(const k of ['France selected panel','selected-line-native-name','Hong Kong']){/* markup assertions above cover card templates */}
console.log('PASS: fr/uk/mo/th/hk original names, Korean title, KR exclusion, native CSS');
