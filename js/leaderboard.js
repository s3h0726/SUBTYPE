/* SUBTYPE leaderboard: local history works offline; shared rankings require Supabase. */
(()=>{
'use strict';
const byId=id=>document.getElementById(id);
const escapeText=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const config=()=>globalThis.TRT_SUPABASE_CONFIG||{};
const configured=()=>/^https:\/\/[\w.-]+\.supabase\.co\/?$/i.test(config().url||'')&&String(config().anonKey||config().publishableKey||'').length>20;
const getAuth=()=>globalThis.TRTAuth;
const owner=()=>getAuth()?.userId||'guest';
const historyKey=()=>`trt:ranking-runs:v2:${owner()}`;
const read=()=>{try{const result=JSON.parse(localStorage.getItem(historyKey())||'[]');return Array.isArray(result)?result:[]}catch{return []}};
const save=runs=>{try{localStorage.setItem(historyKey(),JSON.stringify(runs.slice(0,300)))}catch{}};
const sorted=list=>[...list].sort((a,b)=>Number(b.cpm)-Number(a.cpm)||Number(b.accuracy)-Number(a.accuracy)||Number(a.elapsed_ms)-Number(b.elapsed_ms));
const valid=result=>{
 if(!result||result.options?.mode==='free-drive'||result.options?.researchPreview||result.route?.playStatus==='RESEARCH_PLAYABLE')return false;
 if(result.routeIntegrity!==true||Number(result.completed)<2)return false;
 if(result.route?.isCustom||String(result.routeId||'').startsWith('custom')||result.route?.countryId==='custom')return false;
 const cpm=Number(result.cpm),accuracy=Number(result.accuracy),elapsed=Number(result.elapsed);
 return Number.isFinite(cpm)&&cpm>0&&cpm<=1200&&Number.isFinite(accuracy)&&accuracy>=50&&accuracy<=100&&Number.isFinite(elapsed)&&elapsed>=3000&&elapsed<=7200000;
};
const serviceInfo=result=>{
 const o=result.options||{},stations=result.route?.stations||[];
 const origin=String(result.originStationId||o.serviceJourney?.originStationId||result.typedStationIds?.[0]||'');
 const destination=String(result.destinationStationId||o.destinationStationId||result.typedStationIds?.at(-1)||'');
 const direction=String(result.directionId||o.direction||'forward');
 const journey=String(result.serviceJourneyId||o.serviceJourneyId||'');
 const pattern=String(result.servicePatternId||o.servicePattern?.id||'');
 const trainType=String(result.trainTypeId||o.trainType?.id||'');
 const service=String(result.serviceId||o.service?.id||'local');
 const key=[journey?'journey:'+journey:pattern?'pattern:'+pattern:'service:'+service,'type:'+trainType,'origin:'+origin,'dest:'+destination,'direction:'+direction].join('|').slice(0,480);
 const name=String(result.serviceName||o.service?.nameKo||o.service?.nameJa||'각역정차');
 const first=stations.find(x=>String(x.id)===origin),last=stations.find(x=>String(x.id)===destination);
 return {service_key:key,service_name:(name+' · '+(first?.ko||first?.ja||origin)+' → '+(last?.ko||last?.ja||destination)).slice(0,250)};
};
const entry=result=>({
 ...serviceInfo(result),
 run_uid:crypto.randomUUID(),route_id:String(result.route?.id||result.routeId||'').slice(0,140),
 route_name:String(result.route?.line?.ko||result.route?.line?.ja||result.routeName||'').slice(0,150),
 country_id:result.route?.countryId==='kr'?'kr':'jp',
 cpm:Math.round(Number(result.cpm)),accuracy:Math.round(Number(result.accuracy)*100)/100,
 elapsed_ms:Math.round(Number(result.elapsed)),completed:Math.floor(Number(result.completed)),
 route_integrity:true,synced:false,created_at:new Date().toISOString()
});
const authenticated=()=>Boolean(getAuth()?.userId);
let syncing=null,renderGeneration=0;
async function syncPending(){
 if(syncing)return syncing;
 const auth=getAuth(),id=auth?.userId;
 if(!configured()||!id)return;
 syncing=(async()=>{
   const current=read(),pending=current.filter(x=>!x.synced).slice(0,50);
   for(const run of pending){
     if(getAuth()?.userId!==id)break;
     const {run_uid,route_id,route_name,country_id,cpm,accuracy,elapsed_ms,completed,route_integrity,service_key,service_name}=run;
     try{
       await auth.privateApi('/rest/v1/ranking_runs?on_conflict=run_uid',{method:'POST',prefer:'resolution=ignore-duplicates',
         body:{run_uid,route_id,route_name,country_id,cpm,accuracy,elapsed_ms,completed,route_integrity,service_key:service_key||'legacy',service_name:service_name||'기존 기록 · 계통 미분류',user_id:id}});
       const state=read(),found=state.find(r=>r.run_uid===run_uid);
       if(found){found.synced=true;save(state)}
     }catch(error){console.warn('Ranking sync:',error.message);break}
   }
 })().finally(()=>{syncing=null});
 return syncing;
}
async function globalRows(){
 const q=new URLSearchParams({select:'nickname,route_id,route_name,country_id,service_key,service_name,cpm,accuracy,elapsed_ms,completed,created_at',
   order:'cpm.desc,accuracy.desc,elapsed_ms.asc',limit:'100'});
 const country=byId('ranking-country')?.value||'all',route=String(byId('ranking-route')?.value||'').trim();
 if(country==='jp'||country==='kr')q.set('country_id','eq.'+country);
 if(route)q.set('route_id','eq.'+route);
 const service=byId('ranking-service')?.value||'';if(service)q.set('service_key','eq.'+service);
 const auth=getAuth(),key=config().anonKey||config().publishableKey,token=await auth?.accessToken().catch(()=>null);
 const response=await fetch(String(config().url).replace(/\/$/,'')+'/rest/v1/ranking_best?'+q,{
   headers:{apikey:key,...(token?{Authorization:'Bearer '+token}:{})}
 });
 const body=await response.json().catch(()=>null);
 if(!response.ok)throw Error(body?.message||body?.error||('랭킹 불러오기 실패: '+response.status));
 return Array.isArray(body)?body:[];
}
function table(list,global=false){
 if(!list.length)return '<p class="ranking-empty">해당 조건의 기록이 없습니다.</p>';
 return '<div class="ranking-scroll"><table class="ranking-table"><thead><tr><th>순위</th><th>플레이어</th><th>노선 · 운행계통</th><th>타수</th><th>정확도</th><th>완주 시간</th></tr></thead><tbody>'+
 sorted(list).slice(0,100).map((r,i)=>`<tr><td>${i+1}</td><td>${escapeText(global?(r.nickname||'철도러'):(getAuth()?.profile?.nickname||'나'))}</td><td>${escapeText(r.route_name||r.route_id)}<small style="display:block;color:var(--muted)">${escapeText(r.service_name||'기존 기록 · 계통 미분류')}</small></td><td><strong>${Math.round(Number(r.cpm)||0)}</strong></td><td>${Number(r.accuracy||0).toFixed(1)}%</td><td>${(Number(r.elapsed_ms||0)/1000).toFixed(2)}초</td></tr>`).join('')+'</tbody></table></div>';
}
function populateRoutes(){
 const select=byId('ranking-route');if(!select||select.dataset.populated==='true')return;
 const routes=globalThis.TRT_JAPAN_LITE_INDEX?.routes||globalThis.TRT_EMBEDDED_LINE_WORKSPACES?.index?.routes||[];
 if(!routes.length)return;
 const current=select.value,seen=new Set();
 for(const route of routes){
   if(!route?.id||seen.has(route.id))continue;seen.add(route.id);
   const option=document.createElement('option');option.value=route.id;
   option.textContent=String(route.line?.ko||route.names?.ko||route.line?.ja||route.id)+' ('+route.id+')';
   select.append(option);
 }
 select.value=current;select.dataset.populated='true';
}
async function populateServices(){
 const select=byId('ranking-service');if(!select)return;
 const route=byId('ranking-route')?.value||'',country=byId('ranking-country')?.value||'all',previous=select.value;
 const rows=read().filter(r=>(!route||r.route_id===route)&&(country==='all'||r.country_id===country));
 if(configured()&&byId('ranking-scope')?.value==='global'){
   try{
     const query=new URLSearchParams({select:'service_key,service_name,route_id,country_id',limit:'1000'});
     if(route)query.set('route_id','eq.'+route);
     if(country!=='all')query.set('country_id','eq.'+country);
     const key=config().anonKey||config().publishableKey,token=await getAuth()?.accessToken().catch(()=>null);
     const response=await fetch(String(config().url).replace(/\/$/,'')+'/rest/v1/ranking_best?'+query,{headers:{apikey:key,...(token?{Authorization:'Bearer '+token}:{})}});
     if(response.ok)rows.push(...await response.json());
   }catch(error){console.warn('Service filter:',error.message)}
 }
 const choices=new Map();for(const row of rows)if(row.service_key&&!choices.has(row.service_key))choices.set(row.service_key,row.service_name||'계통 미분류');
 select.replaceChildren(new Option('모든 운행계통',''));
 for(const [key,name] of [...choices].sort((a,b)=>a[1].localeCompare(b[1],'ko')))select.add(new Option(name,key));
 select.value=choices.has(previous)?previous:'';
}
async function render(){
 populateRoutes();
 await populateServices();
 const board=byId('ranking-board'),status=byId('ranking-status');if(!board||!status)return;
 const request=++renderGeneration,scope=byId('ranking-scope')?.value||'personal',country=byId('ranking-country')?.value||'all',
 route=String(byId('ranking-route')?.value||'').trim(),service=String(byId('ranking-service')?.value||'').trim();
 const accountLabel=byId('ranking-account-label');
 if(accountLabel)accountLabel.textContent=authenticated()?'로그인된 계정의 기록':'게스트 · 이 브라우저에서만 저장';
 if(scope==='personal'){
   const list=read().filter(r=>(country==='all'||r.country_id===country)&&(!route||r.route_id===route)&&(!service||(r.service_key||'legacy')===service));
   board.innerHTML=table(list);
   status.textContent=authenticated()?`내 기록 ${list.length}건 · 서버 반영: ${list.filter(r=>r.synced).length}건`:'게스트 기록은 이 브라우저에서만 보관됩니다.';
   return;
 }
 if(!configured()){
   board.innerHTML='';status.textContent='Supabase 공개 설정 및 SQL 적용 후 전체 랭킹이 활성화됩니다.';return;
 }
 status.textContent='전체 랭킹을 불러오는 중…';board.textContent='';
 try{
   const rows=await globalRows();if(request!==renderGeneration)return;
   board.innerHTML=table(rows,true);
   status.textContent='전체 사용자 · 운행계통별 개인 최고 기록 · 타수순 상위 100명 (클라이언트 제출 기록, 서버 검증 전)';
 }catch(error){if(request!==renderGeneration)return;status.textContent=error.message;board.textContent=''}
}
document.addEventListener('trt:journey-finished',event=>{
 const result=event.detail;if(!valid(result))return;
 const current=read();current.unshift(entry(result));save(current);
 if(authenticated())void syncPending();
 if(document.body.dataset.currentScreen==='ranking')void render();
});
document.addEventListener('trt:auth-changed',()=>{void syncPending();if(document.body.dataset.currentScreen==='ranking')void render()});
document.addEventListener('change',event=>{if(['ranking-scope','ranking-country','ranking-route','ranking-service'].includes(event.target?.id))void render()});
document.addEventListener('input',event=>{if(event.target?.id==='ranking-route')void render()});
document.addEventListener('click',event=>{if(event.target.closest('[data-nav="ranking"]'))setTimeout(()=>{void render()},0);
 if(event.target.closest('[data-ranking-refresh]'))void render()});
window.TRTLeaderboard={render,uploadPending:syncPending,history:read,validate:valid};
})();
