export const $=(s,p=document)=>p.querySelector(s);
export const $$=(s,p=document)=>[...p.querySelectorAll(s)];
// Presentation only: retain canonical names and evidence unchanged.
// Strip railway line labels from KR station display/typing only. Preserve canonical station data.
export const koreanStationDisplayName=(value,countryId,route=null)=>{
 const raw=String(value??'');if(countryId!=='kr')return raw;
const KR_STATION_LINE_QUALIFIER="(?:(?:(?:수도권\\s*(?:전철\\s*)?|인천\\s*)?\\d{1,2}호선)|(?:[가-힣A-Za-z0-9·-]+(?:선|철도))|GTX(?:-[A-Z])?|KTX|도시철도|지하철|기차역|신분당|서해)";
const KR_STATION_PREFIX=new RegExp('^'+KR_STATION_LINE_QUALIFIER+'\\s+(?=\\S)','u');
const KR_STATION_SUFFIX=new RegExp('\\s+'+KR_STATION_LINE_QUALIFIER+'$','u');
const KR_STATION_PAREN=new RegExp('\\s*\\(\\s*'+KR_STATION_LINE_QUALIFIER+'(?:\\s*\\/\\s*'+KR_STATION_LINE_QUALIFIER+')*\\s*\\)$','u');

 let name=raw.normalize('NFC').trim(),before;
 do{before=name;name=name.replace(KR_STATION_PAREN,'').replace(KR_STATION_SUFFIX,'').replace(KR_STATION_PREFIX,'').replace(/\s+\d+\s*번\s*출구$/u,'').trim()}while(name&&before!==name);
 const mode=route?.mode||route?.kind||route?.category;
 if(name==='서울역'&&(!mode||['subway','metro','commuter_rail','light_rail','airport_rail','custom'].includes(mode)))return name;
 return name.endsWith('역')?name.slice(0,-1):name;
};
export function koreanRouteDisplayText(value,route){const raw=String(value??'');if(route?.countryId!=='kr')return raw;const text=raw.normalize('NFC'),names=[...new Set([...(route.stations||[]).map(s=>s.ko),route.researchEvidence?.origin,route.researchEvidence?.destination].filter(n=>n?.endsWith('역')))].sort((a,b)=>b.length-a.length);let result='';for(let i=0;i<text.length;){const name=names.find(n=>text.startsWith(n,i)&&!/[가-힣A-Za-z0-9]/.test((text[i-1]||'')+(text[i+n.length]||'')));if(name){result+=koreanStationDisplayName(name,'kr',route);i+=name.length}else result+=text[i++]}return result}

export const normalize=(v='')=>String(v).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
export const uid=(prefix='id')=>`${prefix}-${globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`}`;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const escapeHtml=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export const formatTime=ms=>{ms=Math.max(0,Number(ms)||0);const m=Math.floor(ms/60000),s=Math.floor(ms%60000/1000),cs=Math.floor(ms%1000/10);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`};
export function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)}
export const debounce=(fn,wait=120)=>{let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),wait)}};
