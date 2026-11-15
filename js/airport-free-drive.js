/* SUBTYPE Free Drive — virtual airport transfer layer.
 * Airport names and coordinates identify connected railway stations; these are
 * NOT real airline routes, schedules, fares or verified flight availability.
 */
(function(root){
  'use strict';
  const AIRPORTS=Object.freeze([
    {code:'ICN',countryId:'kr',name:'인천국제공항',city:'인천',lat:37.4602,lon:126.4407,radius:5.5,aliases:['인천공항1터미널','인천공항2터미널','인천국제공항','Incheon International Airport']},
    {code:'GMP',countryId:'kr',name:'김포국제공항',city:'서울',lat:37.5583,lon:126.7906,radius:3,aliases:['김포공항','Gimpo International Airport']},
    {code:'NRT',countryId:'jp',name:'나리타 국제공항',city:'도쿄',lat:35.7720,lon:140.3929,radius:4.5,aliases:['나리타공항','나리타 공항','成田空港','空港第2ビル','공항 제2빌딩','Narita Airport','Airport Terminal 2']},
    {code:'HND',countryId:'jp',name:'하네다 국제공항',city:'도쿄',lat:35.5494,lon:139.7798,radius:4.5,aliases:['하네다공항','羽田空港','Haneda Airport','羽田空港第1','羽田空港第2','羽田空港第3']},
    {code:'KIX',countryId:'jp',name:'간사이 국제공항',city:'오사카',lat:34.4347,lon:135.2440,radius:3.5,aliases:['간사이공항','関西空港','Kansai Airport']},
    {code:'HKG',countryId:'hk',name:'홍콩 국제공항',city:'홍콩',lat:22.3080,lon:113.9185,radius:4,aliases:['홍콩공항','홍콩국제공항','공항','機場','Airport','Hong Kong International Airport']},
    {code:'TPE',countryId:'tw',name:'타오위안 국제공항',city:'타오위안',lat:25.0797,lon:121.2342,radius:4,aliases:['타오위안공항','공항 제1터미널','공항 제2터미널','機場第一航廈','機場第二航廈','Airport Terminal 1','Airport Terminal 2','桃園機場']}
  ]);
  const byCode=new Map(AIRPORTS.map(airport=>[airport.code,airport]));
  const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s·・･()\uFF08\uFF09_\-]/g,'');
  const coord=station=>{
    const lat=Number(station?.latitude??station?.lat??station?.coordinates?.lat);
    const lon=Number(station?.longitude??station?.lon??station?.lng??station?.coordinates?.lng);
    return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)>0&&Math.abs(lon)>0?[lat,lon]:null;
  };
  const kilometers=(a,b)=>{
    const rad=Math.PI/180,p1=a[0]*rad,p2=b[0]*rad,dl=(b[1]-a[1])*rad,dp=(b[0]-a[0])*rad;
    return 6371*2*Math.asin(Math.sqrt(Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2));
  };
  function stationNames(station){
    return [station?.ko,station?.ja,station?.en,station?.romaji,station?.zh,
      station?.nameKo,station?.name,station?.names?.ko,station?.names?.ja,
      station?.names?.en,station?.names?.zh,station?.canonicalStationNames?.ja,
      station?.canonicalStationNames?.ko].filter(Boolean);
  }
  const shortAlias=alias=>['airport','機場','공항'].includes(normalize(alias));
  function matchesStation(station,route,airport){
    if(!station||!route||!airport||route.countryId!==airport.countryId)return false;
    const names=stationNames(station).map(normalize);
    const aliases=airport.aliases.map(normalize);
    const matched=aliases.some(alias=>names.some(name=>name===alias||(!shortAlias(alias)&&name.includes(alias))));
    if(!matched)return false;
    const point=coord(station);
    if(point&&kilometers(point,[airport.lat,airport.lon])>airport.radius)return false;
    // Generic "Airport"/"機場" is only safe with a coordinate or Airport Express line context.
    if(!point&&airport.code==='HKG'&&!/airport|공항|機場/i.test([
      route?.line?.ko,route?.line?.en,route?.line?.ja,route?.nameKo
    ].join(' ')))return false;
    return true;
  }
  function detect(state){
    const station=state?.station,route=state?.route;
    return AIRPORTS.find(airport=>matchesStation(station,route,airport))||null;
  }
  function candidate(route,airport){
    if(!route||route.countryId!==airport.countryId||route.playable===false||route.visibility==='internal')return false;
    if(['bus','village_bus','express_bus','brt','river_bus','ferry'].includes(route.mode))return false;
    if((route.stations||[]).some(station=>matchesStation(station,route,airport)))return true;
    const matches=names=>names.some(name=>airport.aliases.some(alias=>{
      const a=normalize(alias),b=normalize(typeof name==='string'?name:name?.ko||name?.ja||name?.en||'');
      return a&&b&&(a===b||(!shortAlias(a)&&b.includes(a)));
    }));
    if(matches(route.searchStations||[]))return true;
    if(matches(route.stationCatalog||[]))return true;
    const line=[route?.line?.ko,route?.line?.en,route?.line?.ja,route?.nameKo].join(' ');
    const keywords={ICN:/공항철도|airport railroad|incheon airport/i,GMP:/공항철도|airport railroad|airport railway/i,NRT:/成田|나리타|narita/i,HND:/羽田|하네다|haneda/i,KIX:/関西空港|간사이공항|kansai airport/i,HKG:/airport express|機場快|공항철도/i,TPE:/機場捷運|공항철도|airport mrt/i};
    return keywords[airport.code].test(line);
  }
  const findStation=(route,airport)=>(route?.stations||[]).findIndex(station=>matchesStation(station,route,airport));
  const historyKey='subtype-free-drive-airport-legs-v1';
  const readHistory=()=>{try{const v=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(v)?v.slice(-50):[]}catch{return []}};
  let bridge=null,current=null,busy=false,selected=null,dialog=null,trigger=null;
  function initialize(){
    if(dialog||!root.document)return;
    const actions=document.querySelector('#screen-game .game-actions');
    if(!actions)return;
    trigger=document.createElement('button');
    trigger.type='button';trigger.id='airport-transfer-trigger';
    trigger.className='btn ghost airport-transfer-trigger';
    trigger.textContent='✈ 공항 이동';trigger.hidden=true;
    actions.prepend(trigger);
    dialog=document.createElement('div');
    dialog.id='airport-transfer-dialog';dialog.className='airport-transfer-overlay';dialog.hidden=true;
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','자유주행 공항 이동');
    dialog.innerHTML='<section class="airport-transfer-panel"><header><div><small>AIRPORT TRANSFER · FREE DRIVE</small><h2>공항 이동</h2></div><button id="airport-transfer-close" type="button" aria-label="닫기">×</button></header><p id="airport-transfer-origin"></p><div id="airport-transfer-destinations" class="airport-transfer-destinations"></div><form id="airport-transfer-form" hidden><label for="airport-transfer-answer">도착 공항의 이름 또는 IATA 코드를 입력하세요</label><input id="airport-transfer-answer" autocomplete="off" spellcheck="false" placeholder="도착 공항명 / 코드" required><button id="airport-transfer-confirm" class="airport-transfer-confirm" type="submit">✈ 항공 이동 시작</button></form><p id="airport-transfer-status" role="status" aria-live="polite"></p><p class="airport-transfer-disclaimer">항공 이동은 게임 내 가상 연결입니다. 실제 항공편·시간표·요금·운항 여부를 나타내지 않습니다.</p><div id="airport-transfer-journey"></div></section>';
    document.body.append(dialog);
    trigger.addEventListener('click',open);
    dialog.querySelector('#airport-transfer-close').addEventListener('click',()=>{if(!busy)close()});
    dialog.addEventListener('pointerdown',event=>{if(event.target===dialog&&!busy)close()});
    dialog.querySelector('#airport-transfer-destinations').addEventListener('click',event=>{
      const choice=event.target.closest('[data-airport-code]');
      if(!choice||busy)return;
      selected=byCode.get(choice.dataset.airportCode)||null;renderSelection();
    });
    dialog.querySelector('#airport-transfer-form').addEventListener('submit',event=>{event.preventDefault();void depart()});
    document.addEventListener('keydown',event=>{
      if(dialog?.hidden)return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(!busy)close()}
    },true);
  }
  const setStatus=message=>{const node=dialog?.querySelector('#airport-transfer-status');if(node)node.textContent=message};
  function renderSelection(){
    if(!dialog)return;
    dialog.querySelectorAll('[data-airport-code]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.airportCode===selected?.code)));
    const form=dialog.querySelector('#airport-transfer-form');
    form.hidden=!selected;
    form.querySelector('label').textContent=selected?'도착 공항을 입력하세요 · '+selected.name+' ('+selected.code+')':'도착 공항을 선택하세요';
    form.querySelector('input').value='';
    if(selected)form.querySelector('input').focus();
    setStatus(selected?'선택한 공항의 철도역으로 연결합니다.':'');
  }
  function open(){
    if(!bridge||!current||busy)return;
    initialize();if(!dialog)return;
    selected=null;dialog.hidden=false;dialog.querySelector('#airport-transfer-close').textContent='×';
    dialog.querySelector('#airport-transfer-origin').textContent='출발 '+current.name+' ('+current.code+')';
    const target=dialog.querySelector('#airport-transfer-destinations');
    target.innerHTML=AIRPORTS.filter(airport=>airport.code!==current.code).map(airport=>
      '<button type="button" data-airport-code="'+airport.code+'" aria-pressed="false"><strong>'+airport.code+'</strong><span>'+airport.name+'</span><small>'+airport.city+'</small></button>'
    ).join('');
    const previous=readHistory();
    dialog.querySelector('#airport-transfer-journey').textContent=previous.length?'이전 항공 이동 기록 '+previous.length+'회 · 이 브라우저에 저장됨':'첫 항공 이동을 시작해 보세요.';
    renderSelection();
  }
  function close(){if(dialog)dialog.hidden=true;selected=null;if(current)document.querySelector('#typing-input')?.focus()}
  function update(state){
    initialize();
    current=detect(state);
    if(trigger)trigger.hidden=!current||!document.querySelector('#screen-game')?.classList.contains('active');
    if(!current&&!busy)close();
    return current;
  }
  async function depart(){
    if(busy||!current||!selected||!bridge?.flyTo)return;
    const from=current,to=selected;
    const input=dialog.querySelector('#airport-transfer-answer');
    const typed=normalize(input.value);
    if(typed!==normalize(to.name)&&typed!==normalize(to.code)){
      setStatus('도착 공항명 또는 '+to.code+' 코드를 정확히 입력해 주세요.');
      input.focus();return;
    }
    busy=true;input.disabled=true;dialog.querySelector('#airport-transfer-confirm').disabled=true;
    setStatus(from.code+' → '+to.code+' · 목적지 공항역을 확인하는 중...');
    try{
      const arrival=await bridge.flyTo(to);
      const journey=readHistory();
      journey.push({from:from.code,to:to.code,at:new Date().toISOString(),arrivalStation:arrival?.station||'',arrivalRoute:arrival?.route||''});
      localStorage.setItem(historyKey,JSON.stringify(journey.slice(-50)));
      current=to;
      const target=dialog.querySelector('#airport-transfer-destinations');
      target.innerHTML='';
      dialog.querySelector('#airport-transfer-form').hidden=true;
      setStatus('✈ '+to.name+' 도착 · '+(arrival?.station||'공항역')+'에서 자유주행을 계속할 수 있습니다.');
      dialog.querySelector('#airport-transfer-journey').textContent='항공 이동 누적 '+readHistory().length+'회 · 로컬 저장';
      dialog.querySelector('#airport-transfer-close').textContent='계속 →';
      if(trigger)trigger.hidden=false;
    }catch(error){
      setStatus('이동하지 못했습니다: '+(error?.message||'도착 공항역 연결 실패'));
    }finally{
      busy=false;input.disabled=false;dialog.querySelector('#airport-transfer-confirm').disabled=false;
    }
  }
  const api={airports:AIRPORTS,byCode,normalize,coord,kilometers,matchesStation,detect,candidate,findStation,
    configure(callbacks){bridge=callbacks;initialize()},
    update,open,close,readHistory};
  root.TRTAirportSystem=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
