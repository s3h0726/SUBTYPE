import{$,$$,toast}from'./utils.js';
const SESSION_KEY='trt:supabase.session.v1';
const SUPABASE_AUTH_TIMEOUT=18000;
const safeText=value=>String(value??'').trim();
const authError=error=>{const message=safeText(error?.message||error);
  if(/invalid login credentials/i.test(message))return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if(/email not confirmed/i.test(message))return '이메일 인증을 완료한 뒤 로그인하세요.';
  if(/already registered|already exists/i.test(message))return '이미 가입된 이메일입니다.';
  if(/rate limit|too many requests/i.test(message))return '요청이 많습니다. 잠시 후 다시 시도하세요.';
  return message||'계정 요청을 처리하지 못했습니다.';
};
class AuthClient{
  constructor(storage){
    this.storage=storage;this.config=globalThis.TRT_SUPABASE_CONFIG||{};
    this.session=this.readSession();this.profile=null;this.mode='login';this.refreshPending=null;this.restorePending=null;
    storage.setAccount(this.session?.user?.id);
    this.bind();this.setMode('login');this.render();
  }
  get configured(){
    const c=this.config;return /^https:\/\/[\w.-]+\.supabase\.co\/?$/i.test(c.url||'')
      &&String(c.anonKey||c.publishableKey||'').length>20;
  }
  get base(){return String(this.config.url||'').replace(/\/$/,'')}
  get key(){return this.config.anonKey||this.config.publishableKey||''}
  get userId(){return this.session?.user?.id||null}
  readSession(){try{const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');return s?.access_token&&s?.refresh_token&&s?.user?.id?s:null}catch{return null}}
  headers(token){return{'Content-Type':'application/json',apikey:this.key,...(token?{Authorization:'Bearer '+token}:{})}}
  async api(path,{method='GET',body,token,prefer}={}){
    if(!this.configured)throw Error('Supabase 프로젝트 URL과 공개 키가 설정되지 않았습니다.');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),SUPABASE_AUTH_TIMEOUT);
    try{
      const res=await fetch(this.base+path,{method,headers:{...this.headers(token),...(prefer?{Prefer:prefer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});
      const raw=await res.text(),data=raw?(()=>{try{return JSON.parse(raw)}catch{return{message:raw.slice(0,200)}}})():null;
      if(!res.ok){const err=new Error(data?.error_description||data?.msg||data?.message||data?.error||('HTTP '+res.status));err.status=res.status;throw err}
      return data;
    }catch(error){if(error.name==='AbortError')throw Error('서버 응답 시간이 초과되었습니다.');throw error}
    finally{clearTimeout(timeout)}
  }
  saveSession(data){
    const next=data?.access_token&&data?.refresh_token&&data?.user?.id?{
      access_token:data.access_token,refresh_token:data.refresh_token,user:data.user,
      expires_at:Number(data.expires_at)||Math.floor(Date.now()/1000)+(Number(data.expires_in)||3600)
    }:null;
    const previous=this.userId;
    this.session=next;this.storage.setAccount(next?.user?.id);
    if(previous!==this.userId)this.profile=null;
    try{next?localStorage.setItem(SESSION_KEY,JSON.stringify(next)):localStorage.removeItem(SESSION_KEY)}catch{}
    this.render();
    document.dispatchEvent(new CustomEvent('trt:auth-changed',{detail:{userId:this.userId}}));
  }
  async accessToken(){
    if(!this.session?.refresh_token)return null;
    if((Number(this.session.expires_at)||0)>Math.floor(Date.now()/1000)+60)return this.session.access_token;
    if(!this.refreshPending)this.refreshPending=this.api('/auth/v1/token?grant_type=refresh_token',{
      method:'POST',body:{refresh_token:this.session.refresh_token}
    }).then(data=>{this.saveSession(data);return data.access_token}).catch(error=>{
      if(error.status===400||error.status===401)this.saveSession(null);
      throw error;
    }).finally(()=>{this.refreshPending=null});
    return this.refreshPending;
  }
  async privateApi(path,options={}){const token=await this.accessToken();if(!token)throw Error('로그인이 필요합니다.');return this.api(path,{...options,token})}
  async initialize(){
    this.consumeRedirect();
    if(this.session?.refresh_token){
      try{await this.accessToken();await this.restoreCloud()}
      catch(error){console.warn('Supabase session restoration:',error.message)}
    }
  }
  consumeRedirect(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,'')),access=hash.get('access_token'),refresh=hash.get('refresh_token');
    if(!access||!refresh)return;
    const userPart=access.split('.')[1];let user=null;
    try{const json=atob(userPart.replace(/-/g,'+').replace(/_/g,'/'));const claims=JSON.parse(json);if(claims.sub)user={id:claims.sub,email:claims.email||'',user_metadata:{}}}catch{}
    if(!user)return;
    this.saveSession({access_token:access,refresh_token:refresh,user,expires_in:Number(hash.get('expires_in'))||3600});
    const type=hash.get('type');history.replaceState(history.state,'',location.pathname+location.search+'#home');
    if(type==='recovery'){this.open('reset');toast('새 비밀번호를 설정하세요.')}
    else{toast('이메일 인증이 완료되었습니다.');void this.restoreCloud()}
  }
  bind(){
    document.addEventListener('click',event=>{
      const open=event.target.closest('[data-auth-open]');if(open)this.open(this.userId?'account':'login');
      const mode=event.target.closest('[data-auth-mode]');if(mode)this.setMode(mode.dataset.authMode);
      if(event.target.closest('[data-auth-close]'))this.close();
      if(event.target.closest('[data-auth-logout]'))void this.logout();
      if(event.target.closest('[data-auth-import]'))void this.importGuest();
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#auth-dialog')?.hidden)this.close()});
    $('#auth-dialog')?.addEventListener('click',event=>{if(event.target.id==='auth-dialog')this.close()});
    $('#auth-form')?.addEventListener('submit',event=>{void this.submit(event)});
    $('#auth-profile-form')?.addEventListener('submit',event=>{void this.saveNickname(event)});
  }
  open(mode='login'){
    const dialog=$('#auth-dialog');if(!dialog)return;
    dialog.hidden=false;this.setMode(mode);this.renderConfigStatus();
    (mode==='account'?$('#auth-nickname-edit'):$('#auth-email'))?.focus();
  }
  close(){const dialog=$('#auth-dialog');if(dialog)dialog.hidden=true;this.clearError()}
  setMode(mode){
    this.mode=['login','signup','recover','reset','account'].includes(mode)?mode:'login';
    const form=$('#auth-form');if(!form)return;
    const loggedIn=this.mode==='account',recover=this.mode==='recover',reset=this.mode==='reset',signup=this.mode==='signup';
    form.hidden=loggedIn;const profileForm=$('#auth-profile-form');if(profileForm)profileForm.hidden=!loggedIn;
    $$('[data-auth-mode]',form).forEach(button=>{
      const active=button.dataset.authMode===this.mode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))
    });
    $$('[data-signup-field]',form).forEach(field=>{field.hidden=!(signup||reset);const input=field.querySelector('input');if(input)input.required=signup||reset});
    const email=form.elements.email,password=form.elements.password;
    email.closest('label').hidden=reset;email.required=!reset;
    password.closest('label').hidden=recover;password.required=!recover;
    password.autocomplete=signup||reset?'new-password':'current-password';
    if(reset)password.minLength=8;
    else password.minLength=6;
    form.querySelector('.auth-tabs').hidden=recover||reset;
    const back=$('#auth-back');if(back)back.hidden=!recover&&!reset;
    const help=$('#auth-forgot');if(help)help.hidden=this.mode!=='login';
    const nick=form.elements.nickname?.closest('label');if(nick)nick.hidden=!signup;
    form.querySelector('[type="submit"]').textContent=signup?'회원가입':recover?'재설정 이메일 보내기':reset?'새 비밀번호 저장':'로그인';
    this.clearError();
  }
  clearError(){const el=$('#auth-error');if(el){el.hidden=true;el.textContent=''}}
  showError(message){const el=$('#auth-error');if(el){el.textContent=authError(message);el.hidden=false}toast(authError(message))}
  renderConfigStatus(){
    const status=$('#auth-config-status'),submit=$('#auth-form')?.querySelector('[type="submit"]');
    if(status)status.textContent=this.configured?'Supabase 계정 연결 가능 · 비밀번호는 Supabase Auth로 전송됩니다.':'아직 Supabase 프로젝트가 연결되지 않았습니다. 게스트 플레이는 계속 가능합니다.';
    if(submit)submit.disabled=!this.configured;
  }
  async submit(event){
    event.preventDefault();this.clearError();
    if(!this.configured)return this.showError('Supabase 공개 설정이 필요합니다.');
    const form=new FormData(event.target),email=safeText(form.get('email')).toLowerCase(),
      password=String(form.get('password')||''),confirmation=String(form.get('passwordConfirm')||''),
      nickname=safeText(form.get('nickname')).slice(0,24)||'철도러',button=event.target.querySelector('[type="submit"]');
    if((this.mode==='signup'||this.mode==='reset')&&password!==confirmation)return this.showError('비밀번호 확인이 일치하지 않습니다.');
    button.disabled=true;
    try{
      if(this.mode==='recover'){
        await this.api('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+location.pathname),{method:'POST',body:{email}});
        toast('가입된 이메일이라면 재설정 메일이 발송됩니다.');this.setMode('login');return
      }
      if(this.mode==='reset'){
        await this.privateApi('/auth/v1/user',{method:'PUT',body:{password}});
        toast('비밀번호가 변경되었습니다.');this.close();return
      }
      const signup=this.mode==='signup',data=await this.api(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{
        method:'POST',body:signup?{email,password,data:{nickname}}:{email,password}
      });
      if(!data?.access_token){toast('가입 확인 이메일을 보냈습니다. 메일을 인증한 뒤 로그인하세요.');this.setMode('login');return}
      this.saveSession(data);this.close();toast(signup?'회원가입 완료':'로그인 완료');
      await this.ensurePublicProfile(nickname);await this.restoreCloud();
    }catch(error){this.showError(error)}finally{button.disabled=!this.configured}
  }
  async ensurePublicProfile(initialNickname){
    if(!this.userId)return;
    const nickname=safeText(initialNickname||this.session.user?.user_metadata?.nickname||this.session.user?.email?.split('@')[0]||'철도러').slice(0,24);
    try{
      const current=await this.privateApi('/rest/v1/player_public_profiles?user_id=eq.'+encodeURIComponent(this.userId)+'&select=user_id,nickname');
      if(current?.[0]){this.profile=current[0];this.render();return}
      await this.privateApi('/rest/v1/player_public_profiles?on_conflict=user_id',{method:'POST',prefer:'resolution=merge-duplicates,return=representation',body:{user_id:this.userId,nickname}});
      this.profile={user_id:this.userId,nickname};this.render();
    }catch(error){console.warn('Public profile unavailable:',error.message)}
  }
  async restoreCloud(){
    if(!this.userId)return;
    if(this.restorePending)return this.restorePending;
    const user=this.userId;
    this.restorePending=(async()=>{
      await this.ensurePublicProfile();
      const rows=await this.privateApi('/rest/v1/player_profiles?user_id=eq.'+encodeURIComponent(user)+'&select=records,custom_routes');
      if(this.userId!==user)return;
      if(rows?.[0])this.storage.applyCloudSnapshot(rows[0]);
      await this.syncState();
      document.dispatchEvent(new CustomEvent('trt:cloud-restored'));
    })().catch(error=>{console.warn('Profile restore failed:',error.message);toast('클라우드 기록 동기화에 실패했습니다. 로컬 기록은 유지됩니다.')}).finally(()=>{this.restorePending=null});
    return this.restorePending;
  }
  async syncState(){
    if(!this.userId)return;
    const snapshot=this.storage.cloudSnapshot();
    try{
      await this.privateApi('/rest/v1/player_profiles?on_conflict=user_id',{method:'POST',
        prefer:'resolution=merge-duplicates',body:{user_id:this.userId,...snapshot,updated_at:new Date().toISOString()}});
    }catch(error){console.warn('Cloud save failed:',error.message)}
  }
  async importGuest(){
    if(!this.userId)return this.open('login');
    if(!confirm('이 브라우저의 게스트 기록과 커스텀 노선을 현재 계정에 가져올까요?'))return;
    try{this.storage.importGuestRecords();await this.syncState();toast('게스트 기록을 계정으로 가져왔습니다.');document.dispatchEvent(new CustomEvent('trt:cloud-restored'))}
    catch(error){this.showError(error)}
  }
  async saveNickname(event){
    event.preventDefault();if(!this.userId)return;
    const input=$('#auth-nickname-edit'),nickname=safeText(input?.value).slice(0,24);
    if(nickname.length<2)return this.showError('닉네임은 두 글자 이상 입력하세요.');
    try{
      await this.privateApi('/rest/v1/player_public_profiles?on_conflict=user_id',{method:'POST',
        prefer:'resolution=merge-duplicates',body:{user_id:this.userId,nickname}});
      this.profile={user_id:this.userId,nickname};this.render();toast('닉네임을 변경했습니다.');
      document.dispatchEvent(new CustomEvent('trt:auth-changed',{detail:{userId:this.userId}}));
    }catch(error){this.showError(error)}
  }
  async logout(){
    const token=this.session?.access_token;
    try{if(token&&this.configured)await this.api('/auth/v1/logout',{method:'POST',token})}catch(error){console.warn('Logout request:',error.message)}
    this.saveSession(null);this.close();toast('로그아웃했습니다. 게스트 기록으로 전환됩니다.');
    document.dispatchEvent(new CustomEvent('trt:cloud-restored'));
  }
  render(){
    const user=this.session?.user,nickname=this.profile?.nickname||user?.user_metadata?.nickname||user?.email?.split('@')[0]||'게스트';
    $$('[data-auth-state]').forEach(node=>{
      node.replaceChildren();
      const button=document.createElement('button');button.type='button';button.dataset.authOpen='';
      button.className='auth-state-button';button.textContent=user?'● '+nickname+' · 내 계정':'로그인 · 회원가입';
      node.append(button);
    });
    const profile=$('#auth-nickname-edit');if(profile&&document.activeElement!==profile)profile.value=nickname;
    const accountLabel=$('#auth-account-email');if(accountLabel)accountLabel.textContent=user?.email||'';
    this.renderConfigStatus();
  }
}
export function initAuth(storage){
  const client=new AuthClient(storage);globalThis.TRTAuth=client;void client.initialize();return client;
}
