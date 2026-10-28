/* SUBTYPE private run history. Public rankings are handled separately by leaderboard.js.
 * Never stores a service_role key. Each authenticated run is uploaded with its JWT
 * and protected by player_runs RLS. Offline uploads remain queued under the user ID. */
(()=>{
'use strict';
const byId=id=>document.getElementById(id);
const auth=()=>globalThis.TRTAuth;
const userId=()=>auth()?.userId||null;
const config=()=>globalThis.TRT_SUPABASE_CONFIG||{};
const configured=()=>/^https:\/\/[\w.-]+\.supabase\.co\/?$/i.test(String(config().url||''))
  &&String(config().anonKey||config().publishableKey||'').length>20;
const key=id=>'trt:player-runs:v1:'+(id||'guest');
const read=(id=userId())=>{
  try{const rows=JSON.parse(localStorage.getItem(key(id))||'[]');return Array.isArray(rows)?rows:[]}
  catch{return []}
};
const write=(id,runs)=>{
  // Keep every unacknowledged run; prune only old entries already persisted remotely.
  const pending=runs.filter(r=>!r.synced),saved=runs.filter(r=>r.synced).slice(0,500);
  try{localStorage.setItem(key(id),JSON.stringify([...pending,...saved]));return true}
  catch(error){console.warn('Private run history storage:',error.message);return false}
};
const safeNumber=(value,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(value))?Number(value):0));
const stationName=(route,id)=>{
  const station=(route?.stations||[]).find(item=>String(item.id)===String(id));
  return String(station?.ko||station?.ja||id||'');
};
const createEntry=result=>{
  const route=result?.route||{},opts=result?.options||{},routeId=String(route.id||result?.routeId||'').slice(0,140);
  if(!routeId)return null;
  const from=String(result.originStationId||opts.serviceJourney?.originStationId||result.typedStationIds?.[0]||'');
  const to=String(result.destinationStationId||opts.destinationStationId||result.typedStationIds?.at(-1)||'');
  const direction=String(result.directionId||opts.direction||'forward');
  const journey=String(result.serviceJourneyId||opts.serviceJourneyId||'');
  const pattern=String(result.servicePatternId||opts.servicePattern?.id||'');
  const service=String(result.serviceId||opts.service?.id||'local');
  const type=String(result.trainTypeId||opts.trainType?.id||'');
  const serviceKey=[journey?'journey:'+journey:pattern?'pattern:'+pattern:'service:'+service,'type:'+type,'origin:'+from,'dest:'+to,'direction:'+direction].join('|').slice(0,480);
  const serviceName=(String(result.serviceName||opts.service?.nameKo||opts.service?.nameJa||'일반 운행')+
    ' · '+stationName(route,from)+' → '+stationName(route,to)).slice(0,250);
  return {
    run_uid:crypto.randomUUID(),route_id:routeId,
    route_name:String(route.line?.ko||route.line?.ja||result.routeName||routeId).slice(0,150),
    country_id:String(route.countryId||'jp').slice(0,32),
    service_key:serviceKey||'legacy',service_name:serviceName||'운행계통 미분류',
    game_mode:String(opts.mode||'complete').slice(0,48),
    cpm:Math.round(safeNumber(result.cpm,9999)),
    accuracy:Math.round(safeNumber(result.accuracy,100)*100)/100,
    elapsed_ms:Math.round(safeNumber(result.elapsed,72000000)),
    completed:Math.round(safeNumber(result.completed,100000)),
    created_at:new Date().toISOString(),synced:false
  };
};
let currentUid=null,currentOwner=null,working=null,workingUser=null,restoring=null,restoringUser=null,lastError=null;
function status(message,retry=false){
 const label=byId('result-cloud-status'),button=byId('result-cloud-retry');
 if(label)label.textContent=message;
 if(button)button.hidden=!retry;
}
function refreshResult(){
 if(currentOwner!==userId()){status(userId()?'현재 계정의 운행 기록만 서버에 저장됩니다.':'로그인하면 이후 운행 기록이 서버에 저장됩니다.');return}
 if(!currentUid)return;
 const run=read(currentOwner).find(r=>r.run_uid===currentUid);
 if(run?.synced)status('✓ Supabase 서버에 운행 기록 저장 완료');
 else if(!currentOwner)status('게스트 기록은 이 브라우저에 저장됩니다. 서버 저장은 로그인 후 가능합니다.');
 else if(!configured())status('Supabase 연결 설정이 없어 서버 업로드를 대기 중입니다.',true);
 else if(lastError)status('서버 저장 실패 · 로컬에 보관됨 · '+lastError,true);
 else status('Supabase 서버에 운행 기록 저장 중…',true);
}
async function syncPending(){
 const id=userId();if(!id||!configured()){refreshResult();return false}
 if(working){
   if(workingUser===id)return working;
   await working;
   if(userId()!==id)return false;
   return syncPending();
 }
 workingUser=id;
 const job=(async()=>{
   const pending=read(id).filter(r=>!r.synced);
   if(!pending.length){refreshResult();return true}
   lastError=null;refreshResult();
   for(const record of pending){
     if(userId()!==id)return false;
     const {synced,...run}=record;
     try{
       await auth().privateApi('/rest/v1/player_runs?on_conflict=run_uid',{
         method:'POST',prefer:'resolution=ignore-duplicates,return=minimal',body:{...run,user_id:id}
       });
       if(userId()!==id)return false;
       const rows=read(id),found=rows.find(r=>r.run_uid===record.run_uid);
       if(found){found.synced=true;write(id,rows)}
       refreshResult();
     }catch(error){
       console.warn('Supabase player_runs upload:',error.message);
       lastError=/player_runs|404|schema cache|not found|42P01/i.test(String(error.message))?
         'Supabase SQL Editor에서 최신 ranking.sql을 다시 실행해 주세요.':
         String(error.message||'네트워크 연결을 확인하세요.').slice(0,135);
       refreshResult();return false;
     }
   }
   refreshResult();return true;
 })().finally(()=>{if(working===job){working=null;workingUser=null}});
 working=job;return job;
}
async function restoreRemote(){
 const id=userId();if(!id||!configured())return false;
 if(restoring){
   if(restoringUser===id)return restoring;
   await restoring;
   if(userId()!==id)return false;
   return restoreRemote();
 }
 restoringUser=id;
 const job=(async()=>{
   try{
     const rows=await auth().privateApi('/rest/v1/player_runs?'+new URLSearchParams({
       select:'run_uid,route_id,route_name,country_id,service_key,service_name,game_mode,cpm,accuracy,elapsed_ms,completed,created_at',
       order:'created_at.desc',limit:'500'
     }));
     if(userId()!==id||!Array.isArray(rows))return false;
     const byUid=new Map(read(id).filter(r=>r?.run_uid).map(r=>[r.run_uid,r]));
     for(const row of rows){
       if(!row?.run_uid)continue;
       byUid.set(row.run_uid,{...byUid.get(row.run_uid),...row,synced:true});
     }
     write(id,[...byUid.values()].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))));
     refreshResult();return true;
   }catch(error){
     console.warn('Supabase player_runs restore:',error.message);
     return false;
   }
 })().finally(()=>{if(restoring===job){restoring=null;restoringUser=null}});
 restoring=job;return job;
}
function capture(result){
 const run=createEntry(result);
 if(!run)return;
 const id=userId();
 currentOwner=id;currentUid=run.run_uid;lastError=null;
 const rows=read(id);rows.unshift(run);
 if(!write(id,rows)){status('브라우저 저장 공간이 부족합니다. 기록을 안전하게 저장하지 못했습니다.',true);return}
 refreshResult();
 if(id)void syncPending();
}
function retry(){
 if(userId()&&configured()){
   void (async()=>{
     await restoreRemote();await syncPending();
     await auth()?.syncState?.();
     await globalThis.TRTLeaderboard?.uploadPending?.();
   })();
 }
}
document.addEventListener('trt:journey-finished',event=>capture(event.detail));
document.addEventListener('trt:auth-changed',()=>{refreshResult();void (async()=>{await restoreRemote();await syncPending()})()});
document.addEventListener('trt:cloud-restored',()=>{refreshResult();void syncPending()});
document.addEventListener('click',event=>{if(event.target?.closest?.('#result-cloud-retry'))retry()});
globalThis.addEventListener?.('online',retry);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')retry()});
globalThis.TRTCloudRuns={history:read,syncPending,restoreRemote,createEntry,retry};
})();