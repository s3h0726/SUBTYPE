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
let syncing=null,renderGeneration=0,activeLine=null;
const currentLine=()=>activeLine;
const lineMatches=run=>Boolean(activeLine)&&String(run.route_id)===activeLine.id&&(!activeLine.countryId||run.country_id===activeLine.countryId);
function openRoute(route){
 if(!route?.id)return false;
 activeLine={id:String(route.id),countryId:route.countryId==='kr'?'kr':route.countryId==='jp'?'jp':null,name:String(route.line?.ko||route.line?.ja||route.name||route.id),operator:String(route.operator?.ko||route.operator?.en||'')};
 ++renderGeneration;
 const service=byId('ranking-service'),scope=byId('ranking-scope');if(service)service.replaceChildren(new Option('모든 운행계통',''));if(scope)scope.value='global';
 const title=byId('ranking-line-name'),operator=byId('ranking-line-operator');if(title)title.textContent=activeLine.name;if(operator)operator.textContent=activeLine.operator;
 globalThis.TRTNavigation?.showScreen?.('ranking');
 void render();return true;
}
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
 if(!activeLine)throw Error('먼저 플레이할 노선을 선택하세요.');
 q.set('route_id','eq.'+activeLine.id);
 if(activeLine.countryId)q.set('country_id','eq.'+activeLine.countryId);
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
 if(!list.length)return '<p class="ranking-empty">이 노선에는 아직 등록된 기록이 없습니다. 직접 완주해 첫 기록을 등록해 보세요.</p>';
 const groups=new Map();
 for(const run of sorted(list).slice(0,100)){
   const key=String(run.service_key||'legacy');
   if(!groups.has(key))groups.set(key,{name:String(run.service_name||'기존 기록 · 계통 미분류'),runs:[]});
   groups.get(key).runs.push(run);
 }
 return '<div class="ranking-service-list">'+[...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(group=>
   '<section class="ranking-service-group"><h3>'+escapeText(group.name)+'</h3><p class="ranking-group-count">'+group.runs.length+'명·건의 기록 · 타수순</p>'+
   '<div class="ranking-scroll"><table class="ranking-table"><thead><tr><th>순위</th><th>플레이어</th><th>타수</th><th>정확도</th><th>완주 시간</th></tr></thead><tbody>'+
   group.runs.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeText(global?(r.nickname||'철도러'):(getAuth()?.profile?.nickname||'나'))}</td><td><strong>${Math.round(Number(r.cpm)||0)}</strong></td><td>${Number(r.accuracy||0).toFixed(1)}%</td><td>${(Number(r.elapsed_ms||0)/1000).toFixed(2)}초</td></tr>`).join('')+
   '</tbody></table></div></section>').join('')+'</div>';
}
async function populateServices(){
 const select=byId('ranking-service');if(!select)return;
 if(!activeLine){select.replaceChildren(new Option('먼저 노선을 선택하세요',''));return;}
 const route=activeLine.id,country=activeLine.countryId,previous=select.value;
 const rows=read().filter(lineMatches);
 if(configured()&&byId('ranking-scope')?.value==='global'){
   try{
     const query=new URLSearchParams({select:'service_key,service_name,route_id,country_id',limit:'1000'});
     query.set('route_id','eq.'+route);
     if(country)query.set('country_id','eq.'+country);
     const key=config().anonKey||config().publishableKey,token=await getAuth()?.accessToken().catch(()=>null);
     const response=await fetch(String(config().url).replace(/\/$/,'')+'/rest/v1/ranking_best?'+query,{headers:{apikey:key,...(token?{Authorization:'Bearer '+token}:{})}});
     if(response.ok)rows.push(...await response.json());
   }catch(error){console.warn('Service filter:',error.message)}
 }
 if(activeLine?.id!==route)return;
 const choices=new Map();for(const row of rows)if(row.service_key&&!choices.has(row.service_key))choices.set(row.service_key,row.service_name||'계통 미분류');
 select.replaceChildren(new Option('모든 운행계통',''));
 for(const [key,name] of [...choices].sort((a,b)=>a[1].localeCompare(b[1],'ko')))select.add(new Option(name,key));
 select.value=choices.has(previous)?previous:'';
}
async function render(){
 const board=byId('ranking-board'),status=byId('ranking-status');if(!board||!status)return;
 const request=++renderGeneration;
 const title=byId('ranking-line-name'),operator=byId('ranking-line-operator');
 if(title)title.textContent=activeLine?.name||'노선을 선택하세요';
 if(operator)operator.textContent=activeLine?.operator||'';
 if(!activeLine){board.textContent='';status.textContent='PLAY에서 노선을 선택하고 「이 노선 랭킹」을 눌러 주세요.';return;}
 await populateServices();
 if(request!==renderGeneration)return;
 const scope=byId('ranking-scope')?.value||'global',service=String(byId('ranking-service')?.value||'').trim();
 const accountLabel=byId('ranking-account-label');
 if(accountLabel)accountLabel.textContent=authenticated()?'로그인된 계정':'게스트 · 이 브라우저에서만 저장';
 if(scope==='personal'){
   const list=read().filter(r=>lineMatches(r)&&(!service||(r.service_key||'legacy')===service));
   board.innerHTML=table(list);
   status.textContent=authenticated()?`이 노선의 내 기록 ${list.length}건 · 서버 반영: ${list.filter(r=>r.synced).length}건`:'게스트 기록은 이 브라우저에만 보관됩니다.';
   return;
 }
 if(!configured()){board.textContent='';status.textContent='Supabase 연결 및 SQL 설정 후 이 노선의 전체 랭킹을 볼 수 있습니다.';return;}
 status.textContent='이 노선의 전체 랭킹을 불러오는 중…';board.textContent='';
 try{
   const rows=await globalRows();if(request!==renderGeneration)return;
   board.innerHTML=table(rows.filter(lineMatches),true);
   status.textContent='이 노선만 표시 · 운행계통별 최고 기록 · 타수순 (서버 플레이 검증 전)';
 }catch(error){if(request!==renderGeneration)return;status.textContent=error.message;board.textContent=''}
}
document.addEventListener('trt:journey-finished',event=>{
 const result=event.detail;if(!valid(result))return;
 const current=read();current.unshift(entry(result));save(current);
 if(authenticated())void syncPending();
 if(document.body.dataset.currentScreen==='ranking')void render();
});
document.addEventListener('trt:auth-changed',()=>{void syncPending();if(document.body.dataset.currentScreen==='ranking')void render()});
document.addEventListener('change',event=>{if(['ranking-scope','ranking-service'].includes(event.target?.id))void render()});
document.addEventListener('click',event=>{if(event.target.closest('[data-ranking-refresh]'))void render()});
window.TRTLeaderboard={render,openRoute,currentLine,uploadPending:syncPending,history:read,validate:valid};
})();
