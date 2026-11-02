'use strict';
// 운영사 자체 노선표에 명시된 배정만 사용한다. 지역만으로 업체를 추정하지 않는다.
const fs=require('node:fs'),path=require('node:path'),base=path.resolve(__dirname,'../data/kr/canonical'),dir=path.join(base,'national-source');
const save=(city,map,url,file)=>{const source={url,retrievedAt:new Date(fs.statSync(path.join(dir,file)).mtimeMs).toISOString(),license:'공식 운영사 공개 노선 배정 사실정보',attribution:'공식 버스 운영기관'};fs.writeFileSync(path.join(base,city+'-operators.json'),JSON.stringify({source,routes:Object.fromEntries([...map].map(([k,v])=>[k,[...v].sort()]))},null,2)+'\n');console.log(city,map.size)};
const append=(map,n,c)=>{if(!map.has(n))map.set(n,new Set);map.get(n).add(c)};
let h=fs.readFileSync(path.join(dir,'ulsan-union-companies.html'),'utf8'),map=new Map;
for(const m of h.matchAll(/<strong>(.*?)<\/strong>[\s\S]*?<th>운행노선<\/th>\s*<td>([\s\S]*?)<\/td>/g)){
 const company=m[1].replace(/\s*\((?:시내버스|지선버스|마을버스|지선,마을버스|지선,마을|마실버스)\)/g,'').trim();
 for(const n of m[2].replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').matchAll(/(?:남구|북구|동구|중구|울주|순환)?[0-9]+/g))append(map,n[0],company);
}save('ulsan',map,'http://www.ulsanbus.or.kr/theme/daontheme_business02/html/business/01.php','ulsan-union-companies.html');
h=fs.readFileSync(path.join(dir,'sejong-sctc.html'),'utf8');map=new Map;
for(const m of h.matchAll(/title="((?:B[0-9]+|[0-9·-]+번)) 이동"/g))for(const n of m[1].replace(/번$/,'').split('·'))append(map,n,'세종도시교통공사');
save('sejong',map,'https://www.sctc.kr/','sejong-sctc.html');
