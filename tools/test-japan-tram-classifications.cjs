#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const lines={
 '99706':'okayamadenkikido/higashiyamasen','99707':'okayamadenkikido/seikibashisen',
 '99305':'toei/tokyo-sakura-tram','99521':'toyohashitetsudo/toyohashitetsudoazumadahonsen',
 '99809':'iyotetsudo/iyotetsudokanjosen','99810':'iyotetsudo/iyotetsudoshiekisen',
 '99811':'iyotetsudo/iyotetsudomatsuyamaekizensen','99812':'iyotetsudo/iyotetsudohonchosen',
 '99628':'bansakaidenkikido/bansakaiden-uemachisen','99629':'bansakaidenkikido/bansakaiden-hankaisen'
};
for(const [id,workspace] of Object.entries(lines)){
 for(const file of ['data/lines/'+workspace+'/line.json','data/nationwide/routes/line-'+id+'.json','data/generated/routes/line-'+id+'.json']){
  const data=read(file),r=data.route||data;
  assert.equal(r.category,'tram','Streetcar put back in private/other category: '+file);
 }
}
for(const file of ['js/app.js','js/app.bundle.js']){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 for(const id of ['line-99628','line-99629','line-99706','line-99707','line-99305'])
  assert(source.includes(id),'Streetcar UI normalization missing '+id+' in '+file);
}
const express=fs.readFileSync(path.join(root,'js/famous-limited-express.js'),'utf8');
for(const id of ['skyliner','rapit','laview','redarrow','romancecar'])
 assert(express.includes('id:\''+id+'\''),'Named limited express missing '+id);
console.log(JSON.stringify({status:'PASS',tramLines:Object.keys(lines).length,namedLimitedExpressBrands:5},null,2));
