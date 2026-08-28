#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const confirmed={
 '取手':{kana:'とりで',romaji:'Toride',ko:'도리데'},
 '西取手':{kana:'にしとりで',romaji:'Nishi-toride',ko:'니시토리데'},
 '六本木':{kana:'ろっぽんぎ',romaji:'Roppongi',ko:'롯폰기'},
 '六本木一丁目':{kana:'ろっぽんぎいっちょうめ',romaji:'Roppongi-itchome',ko:'롯폰기잇초메'},
 '人吉温泉':{kana:'ひとよしおんせん',romaji:'Hitoyoshi-onsen',ko:'히토요시온센'},
 'お台場海浜公園':{kana:'おだいばかいひんこうえん',romaji:'Odaiba-kaihinkoen',ko:'오다이바카이힌코엔'}
};
const replaceString=value=>value.replace(/톴테/g,'도리데').replace(/조우반센/g,'조반선').replace(/센(?=[(（～〜]|$)/g,'선');
function visit(value){
 if(Array.isArray(value)){for(let index=0;index<value.length;index++){if(typeof value[index]==='string')value[index]=replaceString(value[index]);else visit(value[index])}return}
 if(!value||typeof value!=='object')return;
 for(const [key,item]of Object.entries(value)){if(typeof item==='string')value[key]=replaceString(item);else visit(item)}
 if(typeof value.ja==='string'&&confirmed[value.ja])Object.assign(value,confirmed[value.ja],{nameSource:'manual-reading-correction',koVerified:true});
}
const jsonFiles=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?jsonFiles(path.join(directory,entry.name)):entry.name.endsWith('.json')?[path.join(directory,entry.name)]:[]);
const files=jsonFiles(path.join(root,'data'));
for(const file of files){let data=JSON.parse(fs.readFileSync(file,'utf8'));if(/REVIEW_REQUIRED\.json$/i.test(file)&&Array.isArray(data))data=data.filter(item=>!confirmed[item.ja]);visit(data);fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n')}
console.log(JSON.stringify({files:files.length,confirmed:Object.keys(confirmed)},null,2));
