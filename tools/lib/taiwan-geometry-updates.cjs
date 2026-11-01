'use strict';
const fs=require('fs');
function updateGeometry(line){if(line.id!=='縱貫線南段')return;
 const d=JSON.parse(fs.readFileSync('data/tw/source/completion/tainan-osm.json')),ids=[1570453085,1102288952,1102288954],shape=[];
 for(const id of ids){const w=d.elements.find(e=>e.type==='way'&&e.id===id);if(w?.tags.railway!=='rail'||w.tags.tunnel!=='yes')throw Error('타이난 지하 선형 원본 미확인');const p=w.geometry.map(p=>[p.lat,p.lon]).reverse();if(shape.length){if(JSON.stringify(shape.at(-1))!==JSON.stringify(p[0]))throw Error('타이난 지하 선형 단절');p.shift()}shape.push(...p)}
 const distance=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*102),near=p=>line.shape.map((q,i)=>({i,d:distance(p,q)})).sort((a,b)=>a.d-b.d)[0],a=near(shape[0]),b=near(shape.at(-1));if(a.i>=b.i||a.d>.01||b.d>.01)throw Error('타이난 신구 선형 경계 미확인');
 line.shape=[...line.shape.slice(0,a.i),...shape,...line.shape.slice(b.i+1)];
 const station=line.stations.find(s=>['臺南','台南'].includes(s.name)),original=d.elements.find(e=>e.type==='node'&&e.tags.name==='臺南');if(!station||!original)throw Error('타이난 지하역 위치 미확인');station.lat=original.lat;station.lon=original.lon;
 line.geometryUpdate={validFrom:'2026-10-17',checkedDate:'2026-11-01',osmWayIds:ids,source:'https://www.rb.gov.tw/zh-TW/main/main_188/news/main_347/20261005_082504/',sourceSnapshot:'data/tw/source/completion/tainan-osm.json',boundaryErrorMeters:[a.d*1000,b.d*1000],noteKo:'타이난 지하화 1단계 실제 터널 선형. 린썬·난타이난 미개통역 제외.'};
 return line.geometryUpdate;
}
module.exports={updateGeometry};
