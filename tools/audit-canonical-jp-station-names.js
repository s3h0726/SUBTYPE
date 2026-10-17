#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const preferred=JSON.parse(fs.readFileSync(path.join(root,'data/japan-name-exceptions.json'),'utf8')).stations;
const dir=path.join(root,'data/shared-stations');
let count=0,changed=0;
for(const entry of fs.readdirSync(dir)){
 if(!/^stations-[0-9]+\.json$/.test(entry))continue;
 const file=path.join(dir,entry),rows=JSON.parse(fs.readFileSync(file,'utf8'));let dirty=false;
 for(const row of rows){
  const standard=preferred[row.names?.ja]?.ko;
  if(!standard)continue;count++;
  if(row.names.ko===standard)continue;
  row.names.ko=standard;row.koVerified=false;row.koReviewStatus='REVIEW_REQUIRED';dirty=true;changed++;
 }
 if(dirty)fs.writeFileSync(file,JSON.stringify(rows,null,2)+'\n');
}
console.log(JSON.stringify({checked:count,corrected:changed}));
