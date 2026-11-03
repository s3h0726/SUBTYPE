'use strict';
// 표의 빈칸·통과 기호를 시각 정보와 분리한다. 원문과 원본 해시는 별도 보존한다.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/th/source');
const clean=s=>String(s).replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
function parse(file){
 const html=fs.readFileSync(path.join(dir,file),'utf8'),tables=[...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map(m=>m[1]);
 const stationTable=tables.find(t=>/\?station=/.test(t)),trainTable=tables.find(t=>/\?trainno=/.test(t));
 if(!stationTable||!trainTable)throw Error('시간표 구조 없음: '+file);
 const stations=[...stationTable.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>{const a=m[1].match(/\?station=([^&"']+)[\s\S]*?<b>([\s\S]*?)<\/b>/);return a?{id:a[1],name:clean(a[2])}:null}).filter(Boolean);
 const numbers=[...trainTable.matchAll(/\?trainno=([^"'&>]+)/g)].map(m=>m[1]);
 const rows=[...trainTable.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].filter(m=>!m[1].includes('?trainno=')).map(m=>[...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>({text:clean(c[1]),pass:/fa-circle|fa-minus|time-pass/.test(c[1]),absent:/fa-long-arrow|fa-arrow-down/.test(c[1])})));
 if(rows.length!==stations.length||rows.some(r=>r.length!==numbers.length))throw Error('시간표 행·열 수 불일치: '+file+' '+rows.length+'/'+stations.length);
 return{stations,trains:numbers.map((no,i)=>({no,entries:stations.map((s,j)=>({...s,...rows[j][i]}))}))};
}
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(dir,'timetable_data.js'),'utf8')+'\nglobalThis.metadata={trainDetails,trainRunningDays,trainTypes};',context);
const groups=[];
for(let line=1;line<=6;line++)for(let trip=1;trip<=2;trip++){
 const th=parse(`srt-${line}-${trip}-th.html`),en=parse(`srt-${line}-${trip}-en.html`),english=new Map(en.stations.map(s=>[s.id,s.name]));
 groups.push({line,trip,stations:th.stations.map(s=>({...s,th:s.name,en:english.get(s.id)})),trains:th.trains.map(t=>({...t,entries:t.entries.map(e=>({...e,th:e.name,en:english.get(e.id)}))}))});
}
fs.mkdirSync(path.join(root,'data/th/normalized'),{recursive:true});
fs.writeFileSync(path.join(root,'data/th/normalized/timetables.json'),JSON.stringify({groups,...context.metadata})+'\n');
console.log('공식 시간표 정규화: '+groups.length+'개 표, '+new Set(groups.flatMap(g=>g.trains.map(t=>t.no))).size+'개 열차');
