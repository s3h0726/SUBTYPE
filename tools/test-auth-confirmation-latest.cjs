#!/usr/bin/env node
'use strict';
/* Prevent signup and recovery emails from pointing to obsolete releases or previews. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const auth=read('js/auth.js'),bundle=read('js/app.bundle.js'),html=read('index.html');
const production='https://s3h0726.github.io/SUBTYPE/';
assert(auth.includes("const SUBTYPE_AUTH_REDIRECT_URL='"+production+"';"));
assert(bundle.includes("const SUBTYPE_AUTH_REDIRECT_URL='"+production+"';"));
for(const file of [auth,bundle]){
 assert(file.includes("authRedirectEndpoint('/auth/v1/signup')"),'Signup must explicitly use stable site URL');
 assert(file.includes("authRedirectEndpoint('/auth/v1/recover')"),'Recovery must use same stable URL');
 assert(!file.includes('location.origin+location.pathname'),'Preview/old-page redirect must not survive');
 assert(file.includes("searchParams.delete('auth_latest')"),'Auth cache-bust should be removed from address bar');
}
const source=auth.replace(/^import[^\n]+\n/,'').replace(/^export function initAuth/m,'function initAuth');
class FakeFormData{
 constructor(target){this.fields=target.fields}
 get(key){return this.fields[key]??null}
}
const sandbox={URL,URLSearchParams,FormData:FakeFormData,setTimeout,clearTimeout,console,
 toast:()=>{}};
vm.createContext(sandbox);
vm.runInContext(source+'\nglobalThis.AuthClientForTest=AuthClient;',sandbox,{filename:'js/auth.js'});
async function send(mode){
 const called=[];
 const client={mode,configured:true,clearError(){},setMode(){},showError(error){throw error},
  api:async(path,options)=>{called.push({path,options});return {}}};
 const button={disabled:false},target={fields:{email:'test@example.com',password:'strongpass',
  passwordConfirm:'strongpass',nickname:'테스트'},querySelector:()=>button};
 await sandbox.AuthClientForTest.prototype.submit.call(client,{preventDefault(){},target});
 assert.equal(button.disabled,false,'Submit button remains disabled');
 assert.equal(called.length,1);
 return called[0];
}
function checkHashReload(input,expectedReload){
 const matches=html.match(/<script>\s*\/\/ Supabase returns tokens[\s\S]*?<\/script>/);
 assert(matches,'Missing early auth-only cache-bust script');
 const code=matches[0].replace(/^<script>/,'').replace(/<\/script>$/,'');
 const replaced=[],location={href:input,hash:new URL(input).hash,replace:url=>replaced.push(url)};
 vm.runInNewContext(code,{location,URL,URLSearchParams,Date});
 assert.equal(replaced.length,expectedReload?1:0,'Unexpected auth cache navigation');
 if(expectedReload){
  const before=new URL(input),after=new URL(replaced[0]);
  assert.equal(after.origin,before.origin);
  assert.equal(after.pathname,before.pathname);
  assert.equal(after.hash,before.hash,'Auth access and refresh tokens must stay in URL fragment');
  assert(after.searchParams.has('auth_latest'),'Latest HTML query missing');
  assert(!after.search.includes('access_token'),'Access token must not leak into HTTP query');
 }
}
(async()=>{
 const signup=await send('signup'),recover=await send('recover');
 const expected='?redirect_to='+encodeURIComponent(production);
 assert.equal(signup.path,'/auth/v1/signup'+expected,'Signup email redirect');
 assert.equal(recover.path,'/auth/v1/recover'+expected,'Reset email redirect');
 assert.equal(signup.options.method,'POST');
 assert.equal(recover.options.method,'POST');
 assert(!signup.path.includes('localhost'));
 assert(html.includes('./js/app.bundle.js?v='),'App bundle must remain cache-versioned');
 checkHashReload(production+'#access_token=sample&refresh_token=sample2&type=signup',true);
 checkHashReload(production+'?auth_latest=123#access_token=sample&refresh_token=sample2&type=recovery',false);
 checkHashReload(production+'#home',false);
 console.log('PASS latest production signup/recovery redirects; one-time fresh auth landing; tokens remain private in fragment');
})().catch(error=>{console.error(error);process.exitCode=1});
