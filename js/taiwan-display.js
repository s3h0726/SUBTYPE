// Taiwan display fields are independent of legacy ja/kana typing slots.
const twEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let twDisplayLines=new Map(),twDisplayPatterns=new Map(),twDisplayStations=new Map(),twDisplayLoading=null;
export function getTaiwanDisplayNames(entity={}){
 const e=entity||{},n={...(e.names||{}),...(e.displayNames||{})};
 const first=(...values)=>String(values.find(value=>typeof value==='string'&&value.trim())||'');
 return{ko:first(e.ko,e.nameKo,n.ko),zh:first(e.zh,e.nameZh,n.zh),en:first(e.en,e.nameEn,n.en,e.romaji)};
}
export function taiwanNameText(entity,{english=false}={}){const n=getTaiwanDisplayNames(entity);return[n.ko,n.zh,english?n.en:''].filter(Boolean).join(' / ')}
export function taiwanNameMarkup(entity,{english=false}={}){
 const n=getTaiwanDisplayNames(entity);return'<span class="tw-name"><span class="tw-ko" lang="ko">'+twEscape(n.ko)+'</span>'+(n.zh?'<span class="tw-zh" lang="zh-Hant">'+twEscape(n.zh)+'</span>':'')+(english&&n.en?'<span class="tw-en" lang="en">'+twEscape(n.en)+'</span>':'')+'</span>';
}
export function taiwanDirectionNames(choice){const a=getTaiwanDisplayNames(choice.originNames),b=getTaiwanDisplayNames(choice.destinationNames);return{ko:a.ko+' → '+b.ko,zh:a.zh&&b.zh?a.zh+' → '+b.zh:'',en:a.en&&b.en?a.en+' → '+b.en:''}}
export function registerTaiwanDisplay(lines,patterns){twDisplayLines=new Map(lines.map(r=>[r.id,r]));twDisplayPatterns=new Map(patterns.map(p=>[p.id,p]));twDisplayStations=new Map(lines.flatMap(r=>r.stations.map(s=>[s.id,s])))}
export function taiwanDisplayReady(){return twDisplayLines.size>0}
export async function ensureTaiwanDisplay(){if(twDisplayLines.size)return true;if(!twDisplayLoading)twDisplayLoading=fetch(new URL('data/tw/generated/network.json?v=tw-multilingual-20261101',document.baseURI)).then(r=>{if(!r.ok)throw Error('Taiwan display catalog '+r.status);return r.json()}).then(d=>{registerTaiwanDisplay(d.lines,d.patterns);return true}).finally(()=>{twDisplayLoading=null});return twDisplayLoading}
export function taiwanRecordDisplay(record={}){
 const id=record.route_id||record.routeId||record.id,route=record.route||twDisplayLines.get(id);
 if(route?.countryId!=='tw'&&!String(id||'').startsWith('tw-'))return null;
 const key=record.service_key||'',serviceId=record.serviceJourneyId||record.servicePatternId||key.match(/(?:journey|pattern|service):([^|]+)/)?.[1],spec=twDisplayPatterns.get(serviceId);
 const origin=route?.stations?.find(s=>s.id===record.originStationId)||twDisplayStations.get(spec?.origin?.id||record.originStationId)||spec?.origin,destination=route?.stations?.find(s=>s.id===record.destinationStationId)||twDisplayStations.get(spec?.destination?.id||record.destinationStationId)||spec?.destination;
 return{route,line:route?.line||{ko:record.route_name||record.name||''},operator:route?.operator,service:spec?{...spec.displayNames,ko:spec.nameKo}:null,origin,destination};
}
export function taiwanRecordMarkup(record,{service=false}={}){const d=taiwanRecordDisplay(record);if(!d)return'';return taiwanNameMarkup(service&&d.service?d.service:d.line)+(d.origin&&d.destination?taiwanNameMarkup(taiwanDirectionNames({originNames:d.origin,destinationNames:d.destination})):'' )}
export function taiwanRecordText(record){const d=taiwanRecordDisplay(record);return d?[taiwanNameText(d.service||d.line),d.origin&&d.destination?taiwanNameText(taiwanDirectionNames({originNames:d.origin,destinationNames:d.destination})):null].filter(Boolean).join(' · '):''}
export function renderTaiwanGameDisplay(game){
 if(game.route?.countryId!=='tw')return;
 const route=game.route,station=game.freeDriveMode?(game.freeDriveTarget?.station||game.freeDriveState?.station||game.currentStation()):game.targetStation(),first=game.freeDriveMode?game.freeDriveState?.station:game.sequence?.[0],last=game.freeDriveMode?(game.freeDriveTarget?.station||station):game.sequence?.at(-1),n=getTaiwanDisplayNames(station);
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||''},markup=(id,entity)=>{const el=document.getElementById(id);if(el)el.innerHTML=taiwanNameMarkup(entity,{english:true})};
 const memory=game.options?.inputMode==='memory';
 set('prompt-main',n.zh||n.en||(memory?'번체중문 역명 미등록':n.ko));set('prompt-ko',memory?'정답 비공개':n.ko);document.getElementById('prompt-ko')?.classList.toggle('memory-hidden',memory);
 set('prompt-kana','');set('prompt-sub',game.options?.difficulty==='hard'?'한국어 역 이름을 입력하세요':n.en);
 const currentIndex=game.freeDriveMode?game.index:game.sequence?.indexOf(station),previous=game.freeDriveMode?game.sequence?.[game.index-1]:game.boarding?null:game.currentStation(),next=game.sequence?.[(currentIndex??0)+1];
 for(const [prefix,s]of[['previous',previous],['next',next]]){const v=getTaiwanDisplayNames(s);set(prefix+'-station-name',v.ko|| (prefix==='previous'?'출발지':'종착지'));set(prefix+'-station-romaji',[v.zh,v.en].filter(Boolean).join(' · '));}
 markup('game-line-name',route.line);markup('game-operator',route.operator);
 set('service-origin-ko',getTaiwanDisplayNames(first).ko);set('service-origin-ja',getTaiwanDisplayNames(first).zh);set('service-destination-ko',getTaiwanDisplayNames(last).ko);set('service-destination-ja',getTaiwanDisplayNames(last).zh);
 const service=game.freeDriveMode?{ko:'자유주행',zh:'自由駕駛',en:'Free Drive'}:game.service;markup('game-service-name',service);markup('station-service-footer',service);markup('service-route-summary',route.line);markup('service-direction-summary',taiwanDirectionNames({originNames:first,destinationNames:last}));
 markup('station-line-label',route.line);
}
export function renderTaiwanSetupHeader(route){
 if(route?.countryId!=='tw')return;const root=document.getElementById('setup-route');if(!root)return;
 root.querySelector('h3').innerHTML=taiwanNameMarkup(route.line,{english:true});root.querySelector('p').innerHTML=taiwanNameMarkup(route.operator,{english:true});
}
globalThis.TRTTaiwanDisplay={names:getTaiwanDisplayNames,text:taiwanNameText,markup:taiwanNameMarkup,record:taiwanRecordDisplay,recordMarkup:taiwanRecordMarkup,recordText:taiwanRecordText,ensure:ensureTaiwanDisplay};
