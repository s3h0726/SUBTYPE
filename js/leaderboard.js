/* Ranking board: personal results always available; global entries require authenticated Supabase. */
const localKey='trt:ranking-runs:v1';
const byId=id=>document.getElementById(id);
const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
const config=()=>window.TRT_SUPABASE_CONFIG||{};
function configured(){const c=config();return /^https:\/\/.+\.supabase\.co$/.test(c.url||'')&&String(c.anonKey||'').length>20}
function session(){try{return JSON.parse(localStorage.getItem('trt:supabase.session.v1')||'null')}catch{return null}}
function runs(){try{return JSON.parse(localStorage.getItem(localKey)||'[]')}catch{return []}}
function sorted(list){return [...list].sort((a,b)=>b.cpm-a.cpm||b.accuracy-a.accuracy||a.elapsed_ms-b.elapsed_ms)}
function entry(result){return{route_id:String(result.route?.id||result.routeId||''),route_name:String(result.route?.line?.ko||result.route?.line?.ja||''),country_id:result.route?.countryId||'jp',cpm:Math.max(0,Number(result.cpm)||0),accuracy:Math.max(0,Math.min(100,Number(result.accuracy)||0)),elapsed_ms:Math.max(1,Math.round(Number(result.elapsed)||1)),created_at:new Date().toISOString()}}
async function upload(run){
 const s=session(),c=config();if(!configured()||!s?.access_token||!s?.user?.id)return;
 const response=await fetch(c.url+'/rest/v1/ranking_runs',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.anonKey,Authorization:'Bearer '+s.access_token},body:JSON.stringify({...run,user_id:s.user.id})});
 if(!response.ok)throw Error('랭킹 서버 저장 실패: '+response.status);
}
async function readGlobal(){
 const c=config();if(!configured())return null;
 const res=await fetch(c.url+'/rest/v1/ranking_runs?select=route_id,route_name,country_id,cpm,accuracy,elapsed_ms,created_at,user_id&order=cpm.desc&limit=100',{headers:{apikey:c.anonKey,Authorization:'Bearer '+(session()?.access_token||c.anonKey)}});
 if(!res.ok)throw Error('전체 랭킹 조회 실패: '+res.status);return res.json()
}
function table(list,global=false){
 if(!list.length)return '<p>아직 등록된 기록이 없습니다.</p>';
 return '<div style="overflow:auto"><table style="width:100%;min-width:460px;text-align:left;border-collapse:collapse"><thead><tr><th>순위</th><th>노선</th><th>타수</th><th>정확도</th><th>시간</th></tr></thead><tbody>'+sorted(list).slice(0,100).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+escapeText(r.route_name)+'</td><td>'+Math.round(r.cpm)+'</td><td>'+Number(r.accuracy).toFixed(1)+'%</td><td>'+(r.elapsed_ms/1000).toFixed(1)+'초</td></tr>').join('')+'</tbody></table></div>';
}
async function render(){
 const mount=byId('ranking-board'),status=byId('ranking-status');if(!mount)return;
 const scope=byId('ranking-scope')?.value||'personal';
 status.textContent=scope==='personal'?'이 브라우저의 운행 기록입니다.':'전체 랭킹 서버를 확인합니다.';
 if(scope==='personal'){mount.innerHTML=table(runs());return}
 if(!configured()){status.textContent='전체 랭킹은 서버 연결 후 활성화됩니다. 현재는 개인 기록만 사용할 수 있습니다.';mount.innerHTML='';return}
 try{const list=await readGlobal();mount.innerHTML=table(list,true);status.textContent='전체 랭킹 · 최고 타수순 (상위 100건)'}catch(error){status.textContent=error.message;mount.innerHTML=''}
}
document.addEventListener('trt:journey-finished',event=>{
 const result=event.detail;if(!result||result.route?.playStatus==='RESEARCH_PLAYABLE'||result.options?.researchPreview===true||result.route?.id?.startsWith('custom'))return;
 const run=entry(result),list=runs();list.unshift(run);
 try{localStorage.setItem(localKey,JSON.stringify(list.slice(0,300)))}catch{}
 upload(run).catch(error=>console.warn(error.message));
 if(byId('ranking-board')?.offsetParent)render();
});
document.addEventListener('change',event=>{if(event.target?.id==='ranking-scope')render()});
document.addEventListener('click',event=>{if(event.target.closest('[data-nav="ranking"]'))setTimeout(render,0)});
window.TRTLeaderboard={render,uploadPending:async()=>{for(const run of runs().slice(0,30))await upload(run)}};
