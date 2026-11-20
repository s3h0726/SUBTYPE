'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const source=fs.readFileSync(path.join(__dirname,'fetch-thailand-osm.cjs'),'utf8');
function run(mode){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'subtype-osm-'));
 try{
  const tools=path.join(root,'tools');
  fs.mkdirSync(tools);
  fs.writeFileSync(path.join(tools,'fetch-thailand-osm.cjs'),source);
  const preload=path.join(root,'mock-fetch.cjs');
  fs.writeFileSync(preload,`let calls=0;
global.fetch=async()=>{calls++;
 const mode=process.env.MOCK_OSM_MODE;
 if(mode==='failure')throw Error('network unavailable');
 if(mode==='fallback'&&calls%2===1)return {ok:false,status:503};
 if(mode==='empty')return {ok:true,text:async()=>JSON.stringify({elements:[]})};
 return {ok:true,text:async()=>JSON.stringify({elements:[{type:'node',id:calls,lat:13,lon:100}]})};
};`);
  const child=spawnSync(process.execPath,['--require',preload,path.join(tools,'fetch-thailand-osm.cjs'),'--refresh'],{env:{...process.env,MOCK_OSM_MODE:mode},encoding:'utf8',timeout:10000});
  const dir=path.join(root,'data/th/source');
  const files=fs.existsSync(dir)?fs.readdirSync(dir):[];
  return {status:child.status,error:child.error,stdout:child.stdout,stderr:child.stderr,files,dir};
 }finally{fs.rmSync(root,{recursive:true,force:true})}
}
test('normal Overpass response writes all four regions',()=>{
 const r=run('success');assert.equal(r.status,0,r.stderr);assert.equal(r.files.filter(x=>/^osm-.*\.json$/.test(x)).length,4);
});
test('failed first endpoint retries the second endpoint',()=>{
 const r=run('fallback');assert.equal(r.status,0,r.stderr);assert.equal(r.files.filter(x=>/^osm-.*\.json$/.test(x)).length,4);
});
test('all endpoint failures result in a nonzero exit',()=>{
 const r=run('failure');assert.equal(r.status,1);assert.match(r.stderr,/모든 OSM 엔드포인트 실패/);
});
test('empty elements are not accepted as successful collection',()=>{
 const r=run('empty');assert.equal(r.status,1);assert.equal(r.files.filter(x=>/^osm-.*\.json$/.test(x)).length,0);
});
