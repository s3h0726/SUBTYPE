export const $=(s,p=document)=>p.querySelector(s);
export const $$=(s,p=document)=>[...p.querySelectorAll(s)];
export const normalize=(v='')=>String(v).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
export const uid=(prefix='id')=>`${prefix}-${globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`}`;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const escapeHtml=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export const formatTime=ms=>{ms=Math.max(0,Number(ms)||0);const m=Math.floor(ms/60000),s=Math.floor(ms%60000/1000),cs=Math.floor(ms%1000/10);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`};
export function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)}
export const debounce=(fn,wait=120)=>{let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),wait)}};
