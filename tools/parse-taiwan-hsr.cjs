'use strict';
const fs=require('fs');const pages=JSON.parse(fs.readFileSync('data/tw/source/completion/thsr-cells.json'));
const north=['左營','台南','嘉義','雲林','彰化','台中','苗栗','新竹','桃園','板橋','台北','南港'],trains=[];
for(let p=0;p<2;p++)for(const block of [0,1]){const trainX=(p===0?314.5:31.5)+block*(p===0?566.1:566.45),first=(p===0?393.6479:109.9094)+block*(p===0?565.7978:566.4448),names=p===0?north:north.slice().reverse();
 for(const t of pages[p].filter(t=>/^\d{3,4}$/.test(t.s)&&Math.abs(t.x-trainX)<4)){
  const cells=pages[p].filter(v=>/^\d{2}:\d{2}$/.test(v.s)&&Math.abs(v.y-t.y)<.8&&v.x>first-2&&v.x<first+37.2672*11+3),stops=cells.map(v=>({name:names[Math.round((v.x-first)/37.2672)],time:v.s,stop:true})).filter(v=>v.name);
  if(stops.length<2)throw Error('고속철도 셀 해석 실패: '+t.s);if(new Set(stops.map(s=>s.name)).size!==stops.length)throw Error('고속철도 셀 중복');stops.sort((a,b)=>names.indexOf(a.name)-names.indexOf(b.name));trains.push({train:t.s,typeName:'高鐵',stops});
 }
}
if(trains.length<200||trains.length>260)throw Error('고속철도 원본 행 수 확인 필요: '+trains.length);
fs.writeFileSync('data/tw/source/completion/thsr-official.json',JSON.stringify({effectiveDate:'2026-02-02',checkedDate:'2026-11-01',source:'https://www.thsrc.com.tw/Attachment/Download?id=b5e78f70-fa6d-4f75-8f31-a13387d7ea88&pageID=a3b630bb-1066-4352-a1ef-58c7b4e8ef7c',noteKo:'공식 홈페이지가 제공하는 현행 정기 시각표. 지정 요일 운행 포함, 매일 운행을 의미하지 않음.',trains})+'\n');console.log('공식 고속철도 시각표 '+trains.length+'행');
