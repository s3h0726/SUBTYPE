'use strict';
// Offline, additive build. Source snapshots and curated names are the inputs.
const fs=require('fs'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..');process.chdir(root);
const read=n=>JSON.parse(fs.readFileSync('data/tw/source/'+n+'.json','utf8'));
const write=(p,d)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(d)+'\n')};
const norm=s=>String(s).replaceAll('臺','台').replace(/站$/,'').replace(/\s*[(（].*?[)）]/g,'').replace(/\s/g,'');
const nameKey=s=>String(s).replaceAll('臺','台').replace(/站$/,'').replace(/\s/g,'');
const names=new Map(fs.readFileSync('data/tw/korean-names.txt','utf8').split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>{const [zh,ko]=s.split('=');return[nameKey(zh),ko]}));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
const km=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos((a[0]+b[0])*Math.PI/360));
const operators=[
 ['trtc','타이베이 지하철','臺北捷運','Taipei Metro','https://www.metro.taipei/'],
 ['thsr','타이완 고속철도','台灣高鐵','Taiwan High Speed Rail','https://www.thsrc.com.tw/'],
 ['ntmc','신베이 지하철','新北捷運','New Taipei Metro','https://www.ntmetro.com.tw/'],
 ['tymc','타오위안 지하철','桃園捷運','Taoyuan Metro','https://www.tymetro.com.tw/'],
 ['tmrt','타이중 지하철','臺中捷運','Taichung Metro','https://www.tmrt.com.tw/'],
 ['krtc','가오슝 지하철','高雄捷運','Kaohsiung Rapid Transit','https://www.krtc.com.tw/'],
 ['tra','타이완 철도','國營臺灣鐵路股份有限公司','Taiwan Railway Corporation','https://www.railway.gov.tw/'],
 ['afr','아리산 삼림철도','阿里山林業鐵路','Alishan Forest Railway','https://afrch.forest.gov.tw/']
].map(([key,ko,zh,en,url])=>({id:'tw-'+key,names:{ko,zh,ja:zh,en},url}));
const definitions={
 BR:['wenhu','원후선','Wenhu Line','subway'],R:['tamsui-xinyi','단수이신이선','Tamsui-Xinyi Line','subway'],R_XBT:['xinbeitou','신베이터우 지선','Xinbeitou Branch','subway'],G:['songshan-xindian','쑹산신뎬선','Songshan-Xindian Line','subway'],G_XBT:['xiaobitan','샤오비탄 지선','Xiaobitan Branch','subway'],O_XINZHUANG:['zhonghe-xinlu','중허신루선','Zhonghe-Xinlu Line','subway'],O_LUZHOU:['zhonghe-luzhou-track','중허신루선 루저우 분기','Zhonghe-Xinlu Luzhou Track','subway','internal'],BL:['bannan','반난선','Bannan Line','subway'],Y:['circular','신베이 순환선','Circular Line','subway'],A:['airport','타오위안 공항철도','Airport MRT','airport_rail'],TG:['green','타이중 녹선','Taichung Green Line','subway'],KR:['red','가오슝 홍선','Kaohsiung Red Line','subway'],KO:['orange','가오슝 귤선','Kaohsiung Orange Line','subway'],C:['circular-light-rail','가오슝 순환경전철','Kaohsiung Circular Light Rail','light_rail'],K:['ankeng','안컹 경전철','Ankeng Light Rail','light_rail'],V:['danhai','단하이 경전철','Danhai Light Rail','light_rail'],VB:['danhai-blue-track','단하이 란하이 분기','Danhai Blue Branch Track','light_rail','internal'],LB:['sanying','싼잉선','Sanying Line','subway'],THSR:['high-speed','타이완 고속철도','Taiwan High Speed Rail','shinkansen'],
 '縱貫線北段':['western-north','종관선 북부','Western Trunk North','rail'],'山線':['mountain','타이중선 산선','Taichung Mountain Line','rail'],'海線':['coast','해안선','Coast Line','rail'],'縱貫線南段':['western-south','종관선 남부','Western Trunk South','rail'],'屏東線':['pingtung','핑둥선','Pingtung Line','rail'],'南迴線':['south-link','남회선','South-Link Line','rail'],'臺東線':['taitung','타이둥선','Taitung Line','rail'],'北迴線':['north-link','북회선','North-Link Line','rail'],'宜蘭線':['yilan','이란선','Yilan Line','rail'],SU_AO:['suao','쑤아오 지선','Suao Branch','rail'],NEIWAN:['neiwan','네이완선','Neiwan Line','rail'],LIUJIA:['liujia','류자선','Liujia Line','rail'],PINGXI:['pingxi','핑시선','Pingxi Line','rail'],SHENAO:['shenao','선아오선','Shenao Line','rail'],JIJI:['jiji','지지선','Jiji Line','rail'],SHALUN:['shalun','사룬선','Shalun Line','rail'],chengzhui:['chengzhui','청쭈이선','Chengzhui Line','rail'],AFR_MAIN:['main','아리산 본선','Alishan Main Line','heritage'],AFR_ZHUSHAN:['zhushan','주산선','Zhushan Line','heritage'],AFR_SHENMU:['shenmu','선무선','Shenmu Line','heritage'],AFR_ZHAOPING:['zhaoping','자오핑선','Zhaoping Line','heritage']
};
const officialSources={trtc:'https://web.metro.taipei/pages2026/WebRouteMap',ntmc:'https://www.ntmetro.com.tw/',tymc:'https://www.tymetro.com.tw/tymetro-new/tw/_pages/travel-guide/road.php',tmrt:'https://www.tmrt.com.tw/route/route-map',krtc:'https://www.krtc.com.tw/Guide/guide_map',thsr:'https://en.thsrc.com.tw/ArticleContent/a3b630bb-1066-4352-a1ef-58c7b4e8ef7c',tra:'https://www.railway.gov.tw/tra-tip-web/tip',afr:'https://afrts.forest.gov.tw/TI01.aspx'};
const sources=['trtc','thsr_track','ntdlrt','ntalrt','sanying','tymc','tmrt','krtc','tra','afr'];
const lines=[],issues=[];
const branding=JSON.parse(fs.readFileSync('data/tw/branding.json','utf8'));
const osmMetadata=read('osm-stations').elements.filter(s=>s.type==='node'&&s.tags?.['name:en']);
function englishMetadata(s){const candidates=osmMetadata.filter(n=>[n.tags.name,n.tags['name:zh'],n.tags['name:zh-Hant']].some(name=>name&&norm(name)===norm(s.name))).map(n=>({n,d:km([n.lat,n.lon],[s.lat,s.lon])})).filter(x=>x.d<.8).sort((a,b)=>a.d-b.d);return candidates[0]?.n||null}
const traCodes=new Map(read('tra_station_of_line').lines.flatMap(l=>l.stations).map(s=>[norm(s.name),s.id]));traCodes.set(norm('平鎮'),'1105');
const codes=read('trtc_codes');
function stationCode(file,l,s,i){
 if(file==='trtc'){if(l.id==='R_XBT')return i?'R22A':'R22';if(l.id==='G_XBT')return i?'G03A':'G03';return Object.entries(codes).find(([code,v])=>norm(v.name)===norm(s.name)&&code.startsWith(l.id==='Y'?'Y':l.id[0]==='O'?'O':l.id))?.[0]||''}
 if(file==='sanying')return'LB'+String(i+1).padStart(2,'0');
 if(file==='ntalrt')return'K'+String(i+1).padStart(2,'0');
 if(file==='ntdlrt')return l.id==='VB'&&i>8?'V'+String(37-i):'V'+String(i+1).padStart(2,'0');
 if(file==='tymc')return i<13?'A'+(i+1):i===13?'A14a':'A'+(i+1);
 if(file==='tmrt')return['103a','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119'][i];
 if(file==='krtc'){if(l.id==='C')return i<20?'C'+(i+1):i===20?'C21A':'C'+i;if(l.id==='KO')return['O1','O2','O4','O5','O6','O7','O8','O9','O10','O11','O12','O13','O14','OT1'][i];return['R3','R4','R4A','R5','R6','R7','R8','R9','R10','R11','R12','R13','R14','R15','R16','R17','R18','R19','R20','R21','R22','R22A','R23','R24','RK1'][i]}
 if(file==='tra')return traCodes.get(norm(s.name))||'';
 return'';
}
function align(shape,stops,useChainage=false){
 const cumulative=[0];for(let i=1;i<shape.length;i++)cumulative.push(cumulative.at(-1)+km(shape[i-1],shape[i]));
 let previous=-1;const aligned=[];
 for(const s of stops){let best=null;for(let i=0;i<shape.length-1;i++){
   if(cumulative[i+1]<previous+.00001)continue;
   // Source chainage disambiguates spiral turns and switchbacks.
   if(useChainage&&Number.isFinite(s.d)&&Math.abs(cumulative[i]-s.d)>1.5&&Math.abs(cumulative[i+1]-s.d)>1.5)continue;
   const a=shape[i],b=shape[i+1],scale=Math.cos(s.lat*Math.PI/180),dx=(b[1]-a[1])*scale,dy=b[0]-a[0];
   const t=Math.max(0,Math.min(1,(((s.lon-a[1])*scale)*dx+(s.lat-a[0])*dy)/(dx*dx+dy*dy||1)));
   const p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],d=cumulative[i]+(cumulative[i+1]-cumulative[i])*t,error=km(p,[s.lat,s.lon]);
   if(d<=previous+.00001)continue;if(!best||error<best.error)best={i,t,p,d,error};
 }if(!best||best.error>.4)throw Error(s.name+': station alignment '+best?.error);aligned.push(best);previous=best.d}
 const geometry=[],indices=[];for(let k=0;k<aligned.length;k++){
   const a=aligned[k];if(k){const p=aligned[k-1];for(let j=p.i+1;j<=a.i;j++)geometry.push(shape[j]);}
   if(geometry.length&&km(geometry.at(-1),a.p)<1e-8)indices.push(geometry.length-1);else{indices.push(geometry.length);geometry.push(a.p)}
 }
 return{geometry,indices,maxErrorKm:Math.max(...aligned.map(a=>a.error)),sourceChainage:aligned.map(a=>a.d),closing:[aligned.at(-1).p,...shape.slice(aligned.at(-1).i+1),...shape.slice(0,aligned[0].i+1),aligned[0].p]};
}
for(const file of sources){const data=read(file);for(const raw of data.lines){
 if(!definitions[raw.id]||raw.stations.length<2)continue;
 const l=structuredClone(raw);const geometryUpdate=require('./lib/taiwan-geometry-updates.cjs').updateGeometry(l);if(geometryUpdate)write('data/tw/generated/geometry-updates.json',[geometryUpdate]);let op=file==='thsr_track'?'thsr':['ntdlrt','ntalrt','sanying'].includes(file)||l.id==='Y'?'ntmc':file;
 // Su'ao is a physical branch; the Yilan trunk ends at Su'aoxin.
 const todo=l.id==='宜蘭線'?[{...l,id:'SU_AO',name:'蘇澳支線',stations:l.stations.slice(0,2)},{...l,stations:l.stations.slice(1)}]:[l];
 for(const part of todo){const [slug,ko,en,category,visibility]=definitions[part.id],id='tw-'+op+'-'+slug,operator=operators.find(o=>o.id==='tw-'+op);try{
 const stations=part.stations.filter(s=>!['枋野','新馬','第一分道','第二分道'].includes(s.name));const a=align(part.shape,stations,file==='afr');
 const record={id,line_id:id,operator_id:operator.id,countryId:'tw',operatorId:operator.id,operator:operator.names,line:{ko,zh:part.name,ja:part.name,en},code:part.id,lineColor:part.color,category,mode:category==='shinkansen'?'high_speed_rail':category==='heritage'?'rail':category,visibility:visibility||'public',status:'IMPLEMENTED_UNVERIFIED',operationalStatus:'open',playable:true,geometryReady:true,geometryStatus:'ready',geometry:a.geometry,sourceKey:file+':'+part.id,geometrySource:{type:file==='tra'?'OSM/TDX':'TDX/OSM',license:'ODbL-1.0 / Taiwan Open Government Data License 1.0',attribution:'© OpenStreetMap contributors; Taiwan MOTC TDX; '+operator.names.en,sourceFile:'data/tw/source/'+file+'.json',sourceNotes:data.source_notes,officialUrl:officialSources[op],validation:'source-snapshot-and-topology; no live E2E certification'},alignmentMaxErrorKm:a.maxErrorKm,services:[],taiwanServices:[],stations:stations.map((s,i)=>{
 const ko=names.get(nameKey(s.name));if(!ko||!/[가-힣]/.test(ko)||/[\p{Script=Han}]/u.test(ko))throw Error('untranslated '+s.name);
 const code=stationCode(file,part,s,part.stations.indexOf(s));const station_id=id+'-'+(code||hash(norm(s.name))),english=englishMetadata(s),officialEnglish={'鹿麻產':'Lumachan','屏遮那':'Pingzhena'},en=officialEnglish[s.name]||english?.tags['name:en']||null;
 return{station_id,id:station_id,line_id:id,operator_id:operator.id,ko,zh:s.name,ja:s.name,en,names:{ko,zh:s.name,en},englishSource:english?'https://www.openstreetmap.org/node/'+english.id:null,officialCode:code,stationCode:code,stationCodeSource:code?'operator/TDX':'not-published',koSource:'data/tw/korean-names.txt',koVerified:false,latitude:s.lat,longitude:s.lon,geometryIndex:a.indices[i],sourceChainageKm:a.sourceChainage[i],operationalStatus:'open',routeSpecificStationName:true,transfers:[],networkKey:op+':'+norm(s.name)};
 })};if(part.id==='C'){if(km(part.shape[0],part.shape.at(-1))>.001)throw Error('source loop is not closed');record.loop=true;record.loopClosingGeometry=a.closing;}lines.push(record)
 }catch(e){issues.push({id,nameKo:ko,status:'INCOMPLETE',reason:e.message,source:file})}}
}}
const bySource=new Map(lines.map(l=>[l.sourceKey,l])),byId=new Map(lines.map(l=>[l.id,l]));
// Explicitly join only matching railway boundaries. No interpolated connectors.
function joinPaths(parts){const geometry=[],stations=[],segments=[];for(const {line,a=0,b=line.stations.length-1} of parts){
 const reverse=b<a,ss=line.stations.slice(Math.min(a,b),Math.max(a,b)+1);if(reverse)ss.reverse();
 for(let i=0;i<ss.length;i++){
  const s=ss[i];if(i===0&&stations.length){if(stations.at(-1).networkKey!==s.networkKey)throw Error('nonmatching junction');continue}
  if(i){const prev=ss[i-1],ga=prev.geometryIndex,gb=s.geometryIndex;let points=line.geometry.slice(Math.min(ga,gb),Math.max(ga,gb)+1);if(gb<ga)points.reverse();
   if(geometry.length){const gap=km(geometry.at(-1),points[0]);if(gap>.15)throw Error('junction gap '+gap.toFixed(3));points[0]=geometry.at(-1);points.shift()}else geometry.push(points.shift());
   geometry.push(...points);segments.push(line.id);
  }
  stations.push({...s,geometryIndex:Math.max(0,geometry.length-1)});
 }
}return{geometry,stations,physicalLineIds:[...new Set(segments)]}}
const patternMap=new Map();
function addPattern(owner,nameKo,parts,calls=null,extra={}){try{
 const route=joinPaths(parts),ids=calls?route.stations.filter(s=>calls.includes(s.networkKey)).map(s=>s.id):route.stations.map(s=>s.id);
 if(ids.length<(extra.loop?1:2))throw Error('fewer than 2 calls');
 const signature=nameKo+'|'+route.stations.map(s=>s.networkKey).join('>')+'|'+ids.join('>'),id='tw-service-'+hash(signature);
 if(patternMap.has(id)){const old=patternMap.get(id);if(extra.trainNumber&&!old.trainNumbers.includes(extra.trainNumber))old.trainNumbers.push(extra.trainNumber);if(!owner.taiwanServices.includes(id))owner.taiwanServices.push(id);return}
 const spec={id,nameKo,nameZh:extra.nameZh||null,parts:parts.map(p=>({lineId:p.line.id,a:p.a??0,b:p.b??p.line.stations.length-1})),calls:ids,origin:route.stations.find(s=>s.id===ids[0]),destination:route.stations.find(s=>s.id===ids.at(-1)),trainNumbers:extra.trainNumber?[extra.trainNumber]:[],evidence:extra.evidence||officialSources[owner.operatorId.slice(3)],status:'IMPLEMENTED_UNVERIFIED',direction:extra.direction||'forward',...extra};
 delete spec.trainNumber;patternMap.set(id,spec);owner.taiwanServices.push(id);
 }catch(e){issues.push({id:owner.id,status:'INCOMPLETE',reason:nameKo+': '+e.message})}}
function both(owner,name,parts,extra={}){addPattern(owner,name,parts,null,extra);addPattern(owner,name,parts.slice().reverse().map(p=>({...p,a:p.b??p.line.stations.length-1,b:p.a??0})),null,{...extra,direction:'reverse'})}
for(const l of lines.filter(l=>!['tw-tra','tw-afr','tw-thsr','tw-tymc'].includes(l.operatorId))){if(l.visibility==='internal')continue;
 if(l.id==='tw-krtc-circular-light-rail'){both(l,'순환 운행',[{line:l}],{loop:true});continue}
 both(l,'보통',[{line:l}]);
 if(l.id==='tw-trtc-zhonghe-xinlu'){const branch=bySource.get('trtc:O_LUZHOU');if(branch)both(l,'루저우 분기 보통',[{line:branch}])}
 if(l.id==='tw-ntmc-danhai'){const branch=bySource.get('ntdlrt:VB');if(branch)both(l,'어인부두 방면 보통',[{line:branch}])}
}
for(const [id,origin,destination]of[['tw-trtc-tamsui-xinyi','大安','北投'],['tw-trtc-songshan-xindian','台電大樓','松山'],['tw-trtc-bannan','亞東醫院','南港展覽館']]){
 const line=byId.get(id);if(line){const a=line.stations.findIndex(s=>norm(s.zh)===norm(origin)),b=line.stations.findIndex(s=>norm(s.zh)===norm(destination));if(a>=0&&b>=0)both(line,'구간 보통',[{line,a,b}],{evidence:'https://m.metro.taipei/jp/service.asp; https://www.metro.taipei/cp.aspx?n=EAD981369A065968&s=0F3F913C344BA050'})}
}
const airport=bySource.get('tymc:A');if(airport){both(airport,'보통',[{line:airport}]);const stations=airport.stations;
 for(const [name,indexes] of [['공항 급행',[0,2,7,11,12]],['환베이 급행',[0,2,7,11,12,17,20]]]){
  const calls=indexes.map(i=>stations[i].networkKey),end=indexes.at(-1);addPattern(airport,name,[{line:airport,a:0,b:end}],calls);addPattern(airport,name,[{line:airport,a:end,b:0}],calls,{direction:'reverse'})}
 addPattern(airport,'공항행 보통',[{line:airport,a:0,b:12}]);addPattern(airport,'공항행 보통',[{line:airport,a:21,b:11}],null,{direction:'reverse'});
 // Taoyuan Metro's weekday 07:00 northbound skip-stop commuter starts at A21.
 // Its omitted stops remain in the physical path for animation and Free Drive.
 const peakCodes=['A21','A18','A13','A12','A9','A8','A7','A6','A5','A4','A3','A2','A1'];
 const peakIndices=peakCodes.map(code=>stations.findIndex(station=>station.officialCode===code));
 if(peakIndices.some((index,i)=>index<0||(i>0&&index>=peakIndices[i-1])))throw Error('Taoyuan peak commuter station order changed');
 addPattern(airport,'평일 아침 통과 보통',[{line:airport,a:peakIndices[0],b:peakIndices.at(-1)}],
  peakIndices.map(index=>stations[index].networkKey),{
   direction:'reverse',
   nameZh:'平日上午跳站普通車',
   evidence:'https://www.tymetro.com.tw/tymetro-new/en/_pages/travel-guide/timetable-A13',
   validWhen:{days:'weekdays',departureLocalTime:'07:00',effectiveDate:'2025-10-16',accessedDate:'2026-11-11',
    sourceUrl:'https://www.tymetro.com.tw/tymetro-new/tw/_pages/travel-guide/departure.php?station=A18'}
  });
}
// THSR calls are timetable calls only: pass points have stop:false.
const hsr=bySource.get('thsr_track:THSR');if(hsr){for(const t of JSON.parse(fs.readFileSync('data/tw/source/completion/thsr-official.json')).trains){const calls=t.stops.filter(s=>s.stop!==false).map(s=>'thsr:'+norm(s.name));const idx=calls.map(n=>hsr.stations.findIndex(s=>s.networkKey===n));if(idx.some(i=>i<0)||idx.length<2)continue;const ascending=idx.at(-1)>idx[0];if(idx.some((v,i)=>i&&(ascending?v<=idx[i-1]:v>=idx[i-1])))continue;addPattern(hsr,calls.length===12?'각역정차':calls.length<=6?'직통형 급행':'준급행',[{line:hsr,a:idx[0],b:idx.at(-1)}],calls,{trainNumber:t.train,direction:ascending?'forward':'reverse',evidence:'data/tw/source/completion/thsr-official.json; '+officialSources.thsr})}}
// Build a topology from the physical lines. Actual TRA timetable calls choose
// a contiguous physical chain. Reject gaps, reversals and ambiguous long jumps.
const tra=lines.filter(l=>l.operatorId==='tw-tra'),graph=new Map();
for(const l of tra)for(let i=0;i<l.stations.length-1;i++){const a=l.stations[i],b=l.stations[i+1],length=l.geometry.slice(a.geometryIndex,b.geometryIndex+1).reduce((v,p,j,all)=>v+(j?km(all[j-1],p):0),0);for(const [from,to,x,y]of[[a,b,i,i+1],[b,a,i+1,i]]){if(!graph.has(from.networkKey))graph.set(from.networkKey,[]);graph.get(from.networkKey).push({to:to.networkKey,line:l,a:x,b:y,length})}}
function shortest(start,end,blocked=null,forbidden=new Set()){const dist=new Map([[start,0]]),previous=new Map(),queue=new Set([start]);while(queue.size){let n=[...queue].sort((a,b)=>dist.get(a)-dist.get(b))[0];queue.delete(n);if(n===end)break;for(const edge of graph.get(n)||[]){if(forbidden.has(edge.to)&&edge.to!==end)continue;if(blocked&&((n===blocked.from&&edge.to===blocked.to)||(n===blocked.to&&edge.to===blocked.from)))continue;const d=dist.get(n)+edge.length;if(d<(dist.get(edge.to)??Infinity)){dist.set(edge.to,d);previous.set(edge.to,{from:n,edge});queue.add(edge.to)}}}if(!previous.has(end))throw Error('disconnected '+start+' → '+end);const result=[];for(let n=end;n!==start;){const p=previous.get(n);result.unshift(p.edge);n=p.from}return result}
const schedule=read('tra_schedule'),validTrains=new Set(schedule.dates['2026-10-29']||[]),traRejected={},heldServices=[];
const {plausiblePath}=require('./lib/taiwan-path-evidence.cjs');
const routeHints=JSON.parse(fs.readFileSync('data/tw/source/completion/tra-route-hints.json'));
const cycleJunctions=new Set(['tra:竹南','tra:彰化','tra:成功','tra:追分']);
for(const [index,t]of schedule.trains.entries()){
 if(!validTrains.has(index)||!['區間車','區間快','自強','莒光/復興'].includes(t.typeName))continue;
 const callKeys=t.stops.filter(s=>s.stop!==false).map(s=>'tra:'+norm(s.name));if(callKeys.length<2)continue;
 try{const edges=[];for(let i=1;i<callKeys.length;i++){
   const forbidden=new Set(callKeys.filter((_,j)=>j!==i-1&&j!==i));
   if(routeHints[t.train]?.via==='mountain')for(const l of tra.filter(l=>['tw-tra-coast','tw-tra-chengzhui'].includes(l.id)))for(const station of l.stations)if(!['tra:竹南','tra:彰化','tra:成功'].includes(station.networkKey))forbidden.add(station.networkKey);
   const part=shortest(callKeys[i-1],callKeys[i],null,forbidden);
   const length=part.reduce((n,e)=>n+e.length,0);
   for(const edge of part){const from=edge.line.stations[edge.a].networkKey;if(!cycleJunctions.has(from))continue;let alternate=null;try{alternate=shortest(callKeys[i-1],callKeys[i],{from,to:edge.to},forbidden)}catch{}
    if(alternate&&plausiblePath(alternate,new Set(callKeys))&&alternate.reduce((n,e)=>n+e.length,0)<=length*1.35+2)throw Error('ambiguous mountain/coast/Chengzhui path between timetable calls');
   }
   // A non-stop jump across the mountain/coast divergence cannot establish
   // which route a train used. Keep it out instead of assuming a route.
   const branchNames=new Set(part.map(p=>p.line.id));if(part.length>8&&(branchNames.has('tw-tra-mountain')||branchNames.has('tw-tra-coast'))&&['tra:竹南','tra:彰化'].includes(callKeys[i-1])&&['tra:竹南','tra:彰化'].includes(callKeys[i]))throw Error('ambiguous mountain/coast express');
   edges.push(...part)
 }const parts=[];for(const edge of edges){const last=parts.at(-1);if(last&&last.line===edge.line&&last.b===edge.a&&Math.sign(last.b-last.a)===Math.sign(edge.b-edge.a))last.b=edge.b;else parts.push({line:edge.line,a:edge.a,b:edge.b})}
 const route=joinPaths(parts);if(new Set(route.stations.map(s=>s.networkKey)).size!==route.stations.length)throw Error('repeated station path');
 const name={'區間車':'구간차','區間快':'구간쾌속','自強':'쯔창호','莒光/復興':'주광·푸싱호'}[t.typeName];
 for(const owner of [...new Set(parts.map(p=>p.line))])addPattern(owner,name,parts,callKeys,{nameZh:t.typeName,trainNumber:t.train,evidence:'TRA ODS 2026-10-29; data/tw/source/tra_schedule.json',direction:parts[0].a<parts[0].b?'forward':'reverse',pathValidation:'timetable calls + physical network; inferred between calls'})
 }catch(e){traRejected[e.message]=(traRejected[e.message]||0)+1;heldServices.push({trainNumber:t.train,typeZh:t.typeName,callKeys,status:'INCOMPLETE',reason:e.message})}
}
// Alishan main-line trains continue on the Shenmu physical line to Alishan.
const main=bySource.get('afr:AFR_MAIN'),shenmu=bySource.get('afr:AFR_SHENMU'),afrLines=lines.filter(l=>l.operatorId==='tw-afr');
if(main&&shenmu){for(const t of read('afr_schedule_dense').trains){const calls=t.stops.filter(s=>s.stop!==false).map(s=>'afr:'+norm(s.name));if(calls.length<2)continue;let candidates=[];for(const l of afrLines)candidates.push([{line:l}]);candidates.push([{line:main},{line:shenmu}]);for(let parts of candidates){for(const reverse of [false,true]){if(reverse)parts=parts.slice().reverse().map(p=>({line:p.line,a:p.b??p.line.stations.length-1,b:p.a??0}));try{const r=joinPaths(parts),indices=calls.map(c=>r.stations.findIndex(s=>s.networkKey===c));if(indices.some(i=>i<0)||indices.some((v,i)=>i&&v<=indices[i-1]))continue;
 const a=indices[0],b=indices.at(-1),clipped=[];let offset=0;for(const p of parts){const start=p.a??0,end=p.b??p.line.stations.length-1,count=Math.abs(end-start)+1,from=Math.max(0,a-offset),to=Math.min(count-1,b-offset);if(to>from)clipped.push({line:p.line,a:start+Math.sign(end-start)*from,b:start+Math.sign(end-start)*to});offset+=count-1}
 const owner=parts[0].line.id===shenmu.id&&parts.length>1?main:parts[0].line;addPattern(owner,t.typeName==='阿里山號'?'아리산호':owner.line.ko,clipped,calls,{trainNumber:t.train,direction:reverse?'reverse':'forward',evidence:'data/tw/source/afr_schedule_dense.json; '+officialSources.afr});
 }catch{}}
 }}
 const zhushan=bySource.get('afr:AFR_ZHUSHAN');if(zhushan)both(zhushan,'일출 열차',[{line:zhushan}],{evidence:'https://afrch.forest.gov.tw/0000300',note:'출발 시각은 전날 공지되며 고정 시각을 생성하지 않음'})}
const touristResults=require('./lib/taiwan-tourist.cjs').importTourists({operators,lines,branding,addPattern,issues,hash});
write('data/tw/generated/tourist-status.json',touristResults);for(const line of lines)byId.set(line.id,line);
// Internal branch track choices belong to their single passenger-facing card.
for(const l of lines){l.taiwanServices=[...new Set(l.taiwanServices)];if(l.visibility!=='internal'&&!l.taiwanServices.length){l.playable=false;l.status='INCOMPLETE';issues.push({id:l.id,status:'INCOMPLETE',reason:'No supported actual passenger pattern'})}}
// Transfers are evidence-based, explicit groups. Names never merge coordinates.
const transferGroups=[];
function transfer(group){const members=group.flatMap(([id,name])=>{const l=byId.get(id);const s=l?.stations.find(s=>norm(s.zh)===norm(name));return s?[{line:l,station:s}]:[]});if(members.length!==group.length)return;const id='tw-transfer-'+hash(group.map(p=>p.join(':')).sort().join('|'));for(const {line,station} of members){station.twTransferKey=id;station.transfers=members.filter(m=>m.line!==line).map(m=>({line_id:m.line.id,station_id:m.station.id,source:officialSources[line.operatorId.slice(3)]}))}transferGroups.push({id,stations:members.map(m=>m.station.id),source:'operator route maps'})}
const metro=lines.filter(l=>l.operatorId==='tw-trtc');for(const name of new Set(metro.flatMap(l=>l.stations.map(s=>s.zh)))){const members=metro.filter(l=>l.stations.some(s=>s.zh===name));if(members.length>1)transfer(members.map(l=>[l.id,name]))}
for(const group of [
 [['tw-sugar-suantou-hsr','蒜頭'],['tw-sugar-suantou-palace','蒜頭']],
 [['tw-krtc-red','橋頭糖廠'],['tw-sugar-kaohsiung','捷運橋頭糖廠站']],
 [['tw-trtc-songshan-xindian','大坪林'],['tw-ntmc-circular','大坪林']],
 [['tw-trtc-zhonghe-xinlu','景安'],['tw-ntmc-circular','景安']],
 [['tw-trtc-zhonghe-xinlu','頭前庄'],['tw-ntmc-circular','頭前庄']],
 [['tw-trtc-tamsui-xinyi','紅樹林'],['tw-ntmc-danhai','紅樹林']],
 [['tw-ntmc-ankeng','十四張'],['tw-ntmc-circular','十四張']],
 [['tw-ntmc-sanying','頂埔'],['tw-trtc-bannan','頂埔']],
 [['tw-tymc-airport','新北產業園區站'],['tw-ntmc-circular','新北產業園區']],
 [['tw-krtc-red','美麗島'],['tw-krtc-orange','美麗島']],
 [['tw-krtc-orange','哈瑪星'],['tw-krtc-circular-light-rail','哈瑪星']]
])transfer(group);
const stationGroups=new Map();for(const l of tra)for(const s of l.stations){if(!stationGroups.has(s.networkKey))stationGroups.set(s.networkKey,[]);stationGroups.get(s.networkKey).push([l.id,s.zh])}for(const group of stationGroups.values())if(group.length>1)transfer(group);
// Resolve transitive interchange memberships without changing platform positions.
const stationLookup=new Map(lines.flatMap(l=>l.stations.map(s=>[s.id,s]))),parents=new Map();
const find=id=>{if(!parents.has(id))parents.set(id,id);const p=parents.get(id);if(p!==id)parents.set(id,find(p));return parents.get(id)};
for(const group of transferGroups)for(const id of group.stations)parents.set(find(id),find(group.stations[0]));
const components=new Map();for(const id of parents.keys()){const key=find(id);if(!components.has(key))components.set(key,[]);components.get(key).push(id)}
transferGroups.length=0;for(const members of components.values()){const key='tw-transfer-'+hash(members.slice().sort().join('|'));for(const id of members){const s=stationLookup.get(id);s.twTransferKey=key;s.transfers=members.filter(other=>other!==id).map(other=>({station_id:other,line_id:stationLookup.get(other).line_id,source:'operator route maps'}))}transferGroups.push({id:key,stations:members,source:'operator route maps'})}
for(const [ownerId,branchId]of[['tw-trtc-zhonghe-xinlu','tw-trtc-zhonghe-luzhou-track'],['tw-ntmc-danhai','tw-ntmc-danhai-blue-track']]){const owner=byId.get(ownerId),branch=byId.get(branchId);if(owner&&branch){owner.branchLineIds=[branchId];owner.stationCount=new Set([...owner.stations,...branch.stations].map(s=>s.networkKey)).size;owner.searchStations=[...new Set([...owner.stations,...branch.stations].map(s=>s.ko))]}}
for(const l of lines){l.sourceCode=l.sourceCode||l.code;l.code=l.operatorId==='tw-tra'?'TRA':l.operatorId==='tw-afr'?'AFR':({R_XBT:'R22A',G_XBT:'G03A',O_XINZHUANG:'O',O_LUZHOU:'O',VB:'V',TG:'G',KR:'R',KO:'O',THSR:'HSR'})[l.code]||l.code;l.operatorAsset=branding[l.operatorId];l.stationCount=l.stationCount||l.stations.length;l.description=l.description||(l.category==='shinkansen'?'난강에서 쭤잉까지 달리는 타이완 고속철도입니다.':l.line.ko+'의 실제 선로와 여객 운행 정차역을 따라갑니다.');}
const publicLines=lines.filter(l=>l.visibility!=='internal');const patterns=[...patternMap.values()];
const {serviceDisplay}=require('./lib/taiwan-service-display.cjs');const afrTrainNames=read('afr_schedule_dense').trains.map(t=>t.typeName);for(const p of patterns)Object.assign(p,serviceDisplay(p,lines,afrTrainNames));
const report={referenceDate:'2026-10-29',checkedDate:'2026-11-01',touristRailways:touristResults,geometryUpdatedSections:1,thsrTimetableSource:'data/tw/source/completion/thsr-official.json',operators:operators.map(o=>{const ls=publicLines.filter(l=>l.operatorId===o.id),ps=new Set(ls.flatMap(l=>l.taiwanServices));return{operatorId:o.id,operatorKo:o.names.ko,physicalLines:ls.length,stationRecords:ls.reduce((n,l)=>n+l.stations.length,0),servicePatterns:ps.size,directions:ps.size,realGeometryLines:ls.filter(l=>l.geometryReady).length,playableValidated:0,implementedUnverified:ls.filter(l=>l.status==='IMPLEMENTED_UNVERIFIED').length,incomplete:ls.filter(l=>l.status==='INCOMPLETE').length}}),totalPhysicalLines:publicLines.length,totalStationRecords:publicLines.reduce((n,l)=>n+l.stations.length,0),uniqueOperatorStations:new Set(publicLines.flatMap(l=>l.stations.map(s=>s.networkKey))).size,servicePatterns:patterns.length,directions:patterns.length,geometrySourceTraced:publicLines.length,geometryIndependentlyVerified:0,implementedUnverified:publicLines.filter(l=>l.status==='IMPLEMENTED_UNVERIFIED').length,playableValidated:0,issues,traRejected,limitations:['Geometry is traced to upstream TDX/OSM snapshots; not independently certified against live GIS.','TRA paths between timetable calls are inferred from the physical network.','English station names not present in snapshots remain null; no fabricated romanization.','Taiwan is implemented-unverified until representative browser playthroughs pass.']};
const familyKey=p=>{const forward=JSON.stringify(p.parts),reverse=JSON.stringify(p.parts.slice().reverse().map(part=>({lineId:part.lineId,a:part.b,b:part.a}))),calls=p.calls.map(id=>stationLookup.get(id)?.networkKey||id),a=calls.join('>'),b=calls.slice().reverse().join('>');return(p.nameZh||p.nameKo)+'|'+[forward,reverse].sort()[0]+'|'+[a,b].sort()[0]};
report.directionalServiceIds=patterns.length;report.servicePatterns=new Set(patterns.map(familyKey)).size;
report.heldTimetableRows=heldServices.length;report.incompleteServiceVariants=new Set(heldServices.map(s=>s.typeZh+'|'+s.callKeys.join('>'))).size;
report.totalStationRecords=publicLines.reduce((n,l)=>n+l.stationCount,0);
report.uniqueOperatorStations=new Set(lines.flatMap(l=>l.stations.map(s=>s.networkKey))).size;
report.stationRecordsIncludingInternalTracks=lines.reduce((n,l)=>n+l.stations.length,0);
for(const op of report.operators){const ls=publicLines.filter(l=>l.operatorId===op.operatorId),ids=new Set(ls.flatMap(l=>l.taiwanServices)),ps=patterns.filter(p=>ids.has(p.id));op.stationRecords=ls.reduce((n,l)=>n+l.stationCount,0);op.uniqueStations=new Set(lines.filter(l=>l.operatorId===op.operatorId).flatMap(l=>l.stations.map(s=>s.networkKey))).size;op.servicePatterns=new Set(ps.map(familyKey)).size;}
report.researchRoutes=JSON.parse(fs.readFileSync('data/tw/research.json','utf8')).routes.filter(r=>r.status==='RESEARCH').length;
report.excludedEntries=JSON.parse(fs.readFileSync('data/tw/research.json','utf8')).routes.filter(r=>r.status==='EXCLUDED').length;
report.limitations=report.limitations.filter(s=>!s.startsWith('English station'));
write('data/tw/generated/network.json',{schemaVersion:1,country:{id:'tw',nameKo:'대만'},operators,lines,patterns,transferGroups,assets:{operators:branding,lines:{}}});write('data/tw/generated/report.json',report);
write('data/tw/generated/held-services.json',heldServices);
const rows=['line_id,station_id,original_zh,korean_display,english,official_code,status',...publicLines.flatMap(l=>l.stations.map(s=>[l.id,s.id,s.zh,s.ko,s.en||'',s.officialCode,'CURATED_UNVERIFIED'].map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')))];fs.mkdirSync('reports/korean-names',{recursive:true});fs.writeFileSync('reports/korean-names/taiwan-stations.csv','\uFEFF'+rows.join('\n')+'\n');
console.log(JSON.stringify({...report,issues:issues.slice(0,10),traRejected},null,2));
