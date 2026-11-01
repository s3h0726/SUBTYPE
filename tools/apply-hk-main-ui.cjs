const fs=require('node:fs'),file='js/app.js';let s=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
if(s.includes("function refreshCountryCopy(){if(countryId==='hk')")){s=s.replace("$('#route-grid [data-hk-line-family],#route-grid [data-hk-tram-family]').length","document.querySelectorAll('#route-grid [data-hk-line-family],#route-grid [data-hk-tram-family]').length");fs.writeFileSync(file,s);process.exit(0)}
function edit(from,to){if(!s.includes(from))throw Error('Main UI changed; inspect before integrating '+from.slice(0,60));s=s.replace(from,()=>to)}
edit('function refreshCountryCopy(){const korea=',`function refreshCountryCopy(){if(countryId==='hk'){const play=document.querySelector('.launch-menu [data-nav="rail-map"] small'),footer=document.querySelector('.home-footer span:nth-child(2)'),custom=document.querySelector('[data-feature-index="2"] h2');if(play)play.textContent='홍콩 철도에서 노선 선택';if(footer)footer.textContent='홍콩 철도 타이핑';if(custom)custom.textContent='나만의 노선';return}const korea=`);
edit('visible=allVisible.slice(0,routeRenderLimit)','visible=countryId===\'hk\'?allVisible:allVisible.slice(0,routeRenderLimit)');
edit("'KOREA TRANSIT NETWORK':'JAPAN RAIL NETWORK'","'KOREA TRANSIT NETWORK':countryId==='hk'?'HONG KONG RAIL NETWORK':'JAPAN RAIL NETWORK'");
edit("'대한민국':'일본 전국'} 랜덤 노선","'대한민국':countryId==='hk'?'홍콩':'일본 전국'} 랜덤 노선");
edit("'<p class=\"muted\">검색 결과가 없습니다.</p>'))}","'<p class=\"muted\">검색 결과가 없습니다.</p>'));if(countryId==='hk')$('#route-count').textContent=`${filtered.length}개 운행방향 · ${$$('#route-grid [data-hk-line-family],#route-grid [data-hk-tram-family]').length}개 노선 카드`}");
edit("}else{\n  const countChips=","}else if(countryId==='hk'){summary.textContent=`홍콩 철도 · ${builtin.length}개 플레이 가능 방향 · 고속철도 제외 · 실제 선형 검증`;\n}else{\n  const countChips=");
fs.writeFileSync(file,s);
