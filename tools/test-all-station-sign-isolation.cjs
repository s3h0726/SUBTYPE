#!/usr/bin/env node
'use strict';
// A shared station ID links transfers; it must never rewrite a route's
// displayed name or the Hangul answer typed by the player.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const code=read('js/rail-data-repository.js');
const bundle=read('js/app.bundle.js');
const clean=value=>String(value??'').normalize('NFC').trim();
const load=async()=> (await import('data:text/javascript;base64,'+
  Buffer.from(code).toString('base64'))).railDataRepository;
const station=(id,ja,ko,latitude=35,extra={})=>({
  id,stationMasterId:id,ja,ko,kana:ja,romaji:ja,
  latitude,longitude:139,geometryIndex:0,...extra
});
const route=(countryId,id,stationList)=>({
  countryId,id,operatorId:'operator-'+countryId,
  operator:{ja:'事業者',ko:'운영사',en:'Operator'},
  line:{ja:id,ko:id,en:id},
  stations:stationList,services:[{id:'local',stops:stationList.map(s=>s.id)}],
  geometryReady:true,playable:true
});
test('published bundle contains the same universal station-sign isolation',()=>{
  assert.ok(bundle.includes('Every route has its own station-sign and typing labels.'));
  assert.ok(!bundle.includes("if(route.countryId==='jp'||station.routeSpecificStationName===true)"));
  assert.ok(!code.includes("if(route.countryId==='jp'||station.routeSpecificStationName===true)"));
});
for(const countryId of ['jp','kr','uk','fr','hk','mo','tw','th']){
  test(countryId+': every station keeps its own route-specific sign and typed answer',async()=>{
    const repo=await load();
    const master={id:'shared-stop',names:{ja:'共通駅',ko:'공통역',en:'Shared',kana:'きょうつう'}};
    const first=route(countryId,'first-'+countryId,[
      station('shared-stop','原名','원래역',35),
      station('next-a','次','다음',35.01)
    ]);
    const second=route(countryId,'second-'+countryId,[
      station('shared-stop','別名','별도역',35.002,{romaji:'Alternate',kana:'べつめい'}),
      station('next-b','終点','종점',35.02)
    ]);
    // The second sign is intentionally NOT marked routeSpecificStationName.
    // Before the fix, non-Japanese countries used the first/master label.
    repo.configure({stations:[master],lines:[first,second]});
    for(const [source,name,ko] of [[first,'原名','원래역'],[second,'別名','별도역']]){
      const actual=repo.resolveRoute(source);
      assert.equal(actual.stations[0].ja,name);
      assert.equal(actual.stations[0].ko,ko);
      assert.equal(actual.stations[0].id,'shared-stop');
      assert.equal(actual.stations[0].stationMasterId,'shared-stop');
      assert.equal(actual.services[0].stops[0],'shared-stop');
      assert.equal(actual.stations[0].latitude,source.stations[0].latitude);
    }
    const rendered=repo.resolveRoute(second).stations[0];
    assert.equal(rendered.romaji,'Alternate');
    assert.equal(rendered.kana,'べつめい');
    assert.equal(repo.getStation('shared-stop').names.ja,'共通駅');
    // Line load order must not make the rendered sign vary.
    repo.configure({stations:[master],lines:[second,first]});
    assert.equal(repo.resolveRoute(first).stations[0].ko,'원래역');
    assert.equal(repo.resolveRoute(second).stations[0].ko,'별도역');
  });
}
test('missing per-route labels fall back to master but no master overwrites explicit labels',async()=>{
  const repo=await load();
  const master={id:'hub',names:{ja:'代表駅',kana:'だいひょう',ko:'대표역',en:'Hub'}};
  const line=route('jp','fallback',[station('hub','', '',35,{
    kana:'',romaji:'',names:{ja:'',ko:''}
  }),station('other','他','다른',35.01)]);
  const unknown=route('kr','missing-translation',[station('hub','Local','MISSING_KOREAN_NAME',35),station('y','Y','와이',35.01)]);
  repo.configure({stations:[master],lines:[line,unknown]});
  const restored=repo.resolveRoute(line).stations[0];
  assert.equal(restored.ja,'代表駅');
  assert.equal(restored.ko,'대표역');
  assert.equal(restored.kana,'だいひょう');
  assert.equal(restored.romaji,'Hub');
  assert.equal(repo.resolveRoute(unknown).stations[0].ja,'Local');
  assert.equal(repo.resolveRoute(unknown).stations[0].ko,'대표역');
});
test('nested names and edited station labels override shared master names',async()=>{
  const repo=await load();
  const master={id:'hub',names:{ja:'Master',ko:'마스터',en:'Master'}};
  const line=route('hk','edited',[
    station('hub','','',35,{names:{ja:'車站',ko:'편집한 이름',en:'Station'},routeSpecificStationName:true}),
    station('z','Z','제트',35.01)
  ]);
  repo.configure({stations:[master],lines:[line]});
  const result=repo.resolveRoute(line).stations[0];
  assert.equal(result.ja,'車站');
  assert.equal(result.ko,'편집한 이름');
  assert.equal(result.romaji,'Station');
  assert.equal(repo.getStation('hub').names.ko,'마스터');
});
test('every Japanese canonical route stop retains its original station signs',async()=>{
  const repo=await load();
  const directory=path.join(root,'data/jp-canonical');
  const chunks=fs.readdirSync(directory).filter(name=>/^chunk-\d+\.json$/.test(name)).sort();
  assert.ok(chunks.length>=8,'canonical Japanese railway chunks are missing');
  const routes=chunks.flatMap(name=>JSON.parse(fs.readFileSync(path.join(directory,name),'utf8')).routes)
    .filter(route=>Array.isArray(route.stations)&&route.stations.length);
  assert.ok(routes.length>=590,'Japanese route inventory unexpectedly reduced');
  const normalized=routes.map(r=>({...r,countryId:r.countryId||'jp'}));
  repo.configure({lines:normalized});
  let checked=0,shared=new Map;
  for(const raw of normalized){
    const resolved=repo.resolveRoute(raw);
    assert.equal(resolved.stations.length,raw.stations.length,raw.id+' must keep every visit');
    for(let i=0;i<raw.stations.length;i++){
      const expected=raw.stations[i],actual=resolved.stations[i];
      assert.equal(actual.id,expected.id,raw.id+' must not change station IDs');
      for(const [field,nested] of [['ja','ja'],['kana','kana'],['ko','ko'],['romaji','en']]){
        const original=clean(expected[field]||expected.names?.[nested]);
        if(original&&original!=='MISSING_KOREAN_NAME')
          assert.equal(actual[field],original,raw.id+'/'+expected.id+' changed '+field);
      }
      if(actual.id&&actual.ko){
        if(!shared.has(actual.id))shared.set(actual.id,new Set);
        shared.get(actual.id).add(actual.ja+'|'+actual.ko);
      }
      checked++;
    }
  }
  assert.ok(checked>=9000,'too few Japanese station occurrences validated');
  const variants=[...shared.values()].filter(names=>names.size>1).length;
  console.log(JSON.stringify({routes:routes.length,stationOccurrences:checked,
    sharedIDsWithDistinctLineNames:variants}));
});
