// 태국은 한국어 입력과 태국어 원문을 독립 필드로 유지한다.
export const THAILAND_CATEGORIES=[['all','전체'],['rail','국철'],['commuter_rail','광역철도'],['subway','도시철도'],['monorail','모노레일'],['airport_rail','공항철도'],['automated-guideway','기타 여객철도'],['custom','커스텀']];
const thEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function thLocalNames(){try{return JSON.parse(localStorage.getItem('subtype-thai-names-v1')||'{}')}catch{return{}}}
export function thailandNames(entity={},kind='stations'){
 const n=entity.canonicalThaiNames||entity.names||entity,edits=thLocalNames(),id=entity.station_id||entity.stationMasterId||entity.id,edit=edits[kind]?.[id];
 return{ko:(typeof edit==='string'?edit:edit?.ko)||n.ko||entity.ko||entity.nameKo||'',th:n.th||entity.th||entity.nameTh||'',en:n.en||entity.en||entity.nameEn||entity.romaji||''};
}
export function thailandNameText(entity,kind='stations'){const n=thailandNames(entity,kind);return[n.ko,n.th,n.en].filter(Boolean).join(' / ')}
export function thailandNameMarkup(entity,kind='stations'){const n=thailandNames(entity,kind);return'<span class="th-name"><span lang="ko">'+thEscape(n.ko)+'</span>'+(n.th?'<small lang="th">'+thEscape(n.th)+'</small>':'')+(n.en?'<small lang="en">'+thEscape(n.en)+'</small>':'')+'</span>'}
export function thailandPresentation(route){
 if(route?.countryId!=='th')return route;
 const assign=(entity,kind,id)=>{entity.canonicalThaiNames??={ko:entity.ko||entity.names?.ko||'',th:entity.th||entity.names?.th||'',en:entity.en||entity.names?.en||''};const n=thailandNames({...entity,id:id||entity.id},kind);Object.assign(entity,n,{ja:n.ko,kana:n.ko,romaji:n.en,names:{...entity.names,...n,ja:n.ko}});return entity};
 assign(route.operator,'operators',route.operatorId);assign(route.line,'lines',route.id);
 for(const s of route.stations||[])assign(s,'stations');
 for(const p of route.patterns||[]){p.canonicalThaiNames??={ko:p.nameKo,th:p.nameTh,en:p.nameEn};const n=thailandNames({...p,ko:p.nameKo,th:p.nameTh,en:p.nameEn},'services');p.nameKo=n.ko;for(const s of p.stations||[])assign(s,'stations');p.service={...p.service,nameKo:n.ko,nameJa:n.ko,nameTh:n.th,nameEn:n.en};}
 return route;
}
export async function decodeThailandPayload(payload){
 if(payload?.encoding!=='subtype-thailand-gzip-v1'||payload.countryId!=='th')throw Error('태국 압축 노선 형식 오류');
 const bytes=Uint8Array.from(atob(payload.data),c=>c.charCodeAt(0)),stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),plain=await new Response(stream).arrayBuffer();
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',plain)),n=>n.toString(16).padStart(2,'0')).join('');if(sha!==payload.sha256)throw Error('태국 노선 무결성 검증 실패');
 const data=JSON.parse(new TextDecoder().decode(plain));if(data.route?.countryId!=='th'||data.route.id!==payload.routeId)throw Error('태국 노선 식별자 불일치');return data;
}
export function thailandOperatingChoices(route){
 if(route?.operationalStatus!=='OPERATIONAL'||!route.playable||!route.geometryReady)return[];
 thailandPresentation(route);
 return(route.patterns||[]).map(p=>({kind:'thailand',id:p.id,patternId:p.id,journeyId:p.id,legacyServiceId:p.id,originId:p.stations[0].id,destinationId:p.stations.at(-1).id,originNames:p.stations[0],destinationNames:p.stations.at(-1),patternName:{ko:p.nameKo,th:p.nameTh,en:p.nameEn},direction:p.direction,trainType:null,trainNumbers:p.trainNumbers,thailandFamily:p.nameKo+(p.branch?':branch':''),sourceDate:p.evidence?.fullStopsSourceDate}));
}
export function resolveThailandChoice(choice,owner){
 thailandPresentation(owner);const p=owner.patterns?.find(p=>p.id===choice.id);
 if(!p||owner.operationalStatus!=='OPERATIONAL'||!owner.playable||!owner.geometryReady||p.geometry?.length<2)throw Error('검증된 태국 운행계통이 없습니다.');
 const stations=p.stations.map(s=>({...s})),service={...p.service,stops:[...p.service.stops]},route=thailandPresentation({...owner,patterns:[],geometry:p.geometry,stations,services:[service],selectedServiceId:p.id,physicalLineId:owner.id,loop:false,serviceJourney:{id:p.id},directedSegments:[]});
 return{route,service,direction:'forward',pattern:{id:p.id,names:{ko:p.nameKo,th:p.nameTh,en:p.nameEn}},trainType:null,journey:{id:p.id,directionId:p.direction,originStationId:stations[0].id,destinationStationId:stations.at(-1).id},destinationStationId:stations.at(-1).id,trainTypeContexts:[]};
}
export function renderThailandGameDisplay(game){
 if(game.route?.countryId!=='th')return;
 thailandPresentation(game.route);for(const s of game.sequence||[])Object.assign(s,thailandNames(s));
 const target=game.targetStation(),n=thailandNames(target),set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text||''};
 set('prompt-main',game.options.inputMode==='memory'?n.th:n.ko);set('prompt-ko',game.options.inputMode==='memory'?'정답 비공개':n.th);set('prompt-kana','');set('prompt-sub',n.en);set('game-line-name',game.route.line.ko);set('game-operator',game.route.operator.ko);
 const first=game.freeDriveMode?game.currentStation():game.sequence?.[0],edge=game.freeDriveSelectedEdge||game.freeDriveTarget,last=game.freeDriveMode&&edge?.route?edge.direction<0?edge.route.stations[0]:edge.route.stations.at(-1):game.sequence?.at(-1);for(const[prefix,s]of[['service-origin',first],['service-destination',last]]){const v=thailandNames(s);set(prefix+'-ko',v.ko);set(prefix+'-ja',v.th)}
 const serviceNames=thailandNames({...game.service,id:game.service.id,ko:game.service.nameKo},'services');game.service.nameKo=serviceNames.ko;game.service.nameJa=serviceNames.ko;set('game-service-name',serviceNames.ko);set('station-service-footer',serviceNames.ko);
 const label=document.getElementById('station-line-label');if(label){const b=label.querySelector(':scope > b'),small=label.querySelector(':scope > small');if(b)b.textContent=game.route.line.ko;if(small){small.textContent=game.route.line.th;small.lang='th'}}
}
