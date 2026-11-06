'use strict';
// 같은 열차 식별자 아래에 여러 정차열이 있는 원본도 행 위치와 전체 정차열로 구분한다.
const fs=require('node:fs'),crypto=require('node:crypto');
function attach(file){const official=JSON.parse(fs.readFileSync('data/kr/canonical/rail-expansion-official-patterns.json')).trips,batch=JSON.parse(fs.readFileSync(file));
 const aliases=Function('return '+fs.readFileSync('tools/kr-rail-expansion.cjs','utf8').match(/const aliases=(\{[^\n]+\});/)[1])(),clean=n=>String(n||'').normalize('NFC').replace(/\([^)]*\)/g,'').replace(/^(?:[1-9]호선|경춘선|교외선|경의중앙선|서해선|기차역)\s*/,'').replace(/기차역/g,'').replace(/역$/,'').replace(/\s+/g,''),key=n=>clean(aliases[clean(n)]||n),seq=c=>JSON.stringify(c.map(key));
 for(const r of batch.routes)for(const j of r.verifiedJourneys){const names=j.stations.map(s=>s.ko),pattern=seq(names);j.officialPatternReferences=[];for(const id of j.tripIds){const matches=official.map((t,i)=>({t,i})).filter(({t})=>t.id===id&&seq(t.calls.map(c=>c.ko))===pattern);if(!matches.length)throw Error('공식 정차열 원본 대응 없음: '+id);for(const {t,i}of matches)j.officialPatternReferences.push({tripId:id,sourceId:t.sourceId,sheet:t.sheet,sourceRecordIndex:i,normalizedCallsSha256:crypto.createHash('sha256').update(pattern).digest('hex')});}}
 fs.writeFileSync(file,JSON.stringify(batch)+'\n');}
module.exports={attach};if(require.main===module)attach(process.argv[2]);
