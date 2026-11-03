'use strict';
// 전국 배치 컴파일. 충돌·미번역·단절 후보는 보류 보고서에 남긴다.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {km,length,nearest,align,TrackGraph}=require('./lib/thailand-geometry.cjs');
const root=path.resolve(__dirname,'..');process.chdir(root);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>{const body=JSON.stringify(d)+'\n';if(fs.existsSync(p)&&fs.readFileSync(p,'utf8')===body)return;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,body)},hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
const names=new Map(fs.readFileSync('data/th/korean-stations.txt','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>l.split('|'))),urbanNames=read('data/th/korean-urban.json'),official=read('data/th/normalized/timetables.json'),sourceStations=read('data/th/source/stations.json').stations,sourceTrains=read('data/th/source/trains.json').trains,graph=new TrackGraph(read('data/th/source/segments.json').segments);
const {CurrentRailGraph,currentPattern}=require('./lib/thailand-current.cjs'),currentNetwork=read('data/th/source/current-network.json'),currentRail=new CurrentRailGraph(currentNetwork),currentLive=read('data/th/source/current-live.json'),currentMeta=new Map(currentLive.trains.filter(t=>!t.freight&&t.cat==='passenger').map(t=>[t.no,t]));
const stations=new Map(sourceStations.map(s=>[s.id,s])),issues=[],missingNames=new Map(),routes=[],operators=[
 ['srt','태국 국유철도','การรถไฟแห่งประเทศไทย','State Railway of Thailand','https://www.railway.co.th/'],
 ['srtet','태국 국철 전철운영회사','บริษัท รถไฟฟ้า ร.ฟ.ท. จำกัด','S.R.T. Electrified Train Company','https://www.srtet.co.th/'],
 ['bts','방콕 대중교통시스템','บริษัท ระบบขนส่งมวลชนกรุงเทพ จำกัด (มหาชน)','Bangkok Mass Transit System','https://www.bts.co.th/eng/'],
 ['bem','방콕 고속도로·메트로','บริษัท ทางด่วนและรถไฟฟ้ากรุงเทพ จำกัด (มหาชน)','Bangkok Expressway and Metro','https://metro.bemplc.co.th/'],
 ['ebm','이스턴 방콕 모노레일','บริษัท อีสเทิร์น บางกอกโมโนเรล จำกัด','Eastern Bangkok Monorail','https://www.ebm.co.th/'],
 ['nbm','노던 방콕 모노레일','บริษัท นอร์ทเทิร์น บางกอกโมโนเรล จำกัด','Northern Bangkok Monorail','https://www.nbm.co.th/'],
 ['aera1','아시아 에라 원','บริษัท เอเชีย เอรา วัน จำกัด','Asia Era One','https://www.aera1.co.th/']
].map(([id,ko,th,en,url])=>({id:'th-'+id,names:{ko,th,en,ja:ko},countryId:'th',url}));
// 기존 국철 좌표는 돈므앙을 락씨에 놓았다. 현재 역 복합시설 위치를 기준으로
// 국철 자체 선로에 투영하므로 레드라인 승강장 좌표와 강제로 합치지 않는다.
stations.set('1017',{...stations.get('1017'),lat:13.91486,lon:100.597843,coordinateEvidence:'data/th/source/bangkok-lines.json:darkred:Don Muang'});
const officialStationRows=read('data/th/source/mot-stations.json').result.records;
for(const [id,s]of stations){if(s.src!=='interpolated')continue;const row=officialStationRows.find(r=>r['ชื่อสถานีรถไฟ']===s.th),lat=Number(row?.['ค่าพิกัด_Lat']),lon=Number(row?.['ค่าพิกัด_Long']);if(lat>5&&lat<21&&lon>97&&lon<106)stations.set(id,{...s,lat,lon,src:'MOT/SRT datastore',coordinateEvidence:'data/th/source/mot-stations.json:'+row._id});}
for(const s of currentNetwork.stations){if(!s.c||!s.n||!s.p?.every(Number.isFinite))continue;stations.set(s.c,{...stations.get(s.c),id:s.c,th:s.n,en:s.e,lat:s.p[0],lon:s.p[1],src:'SRT TTS / OSM current network',coordinateEvidence:'data/th/source/current-network.json:'+s.c});}
const op=id=>operators.find(o=>o.id==='th-'+id),provenance={type:'OSM',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors · Longdo Transit',url:'https://transit.longdo.com/api/',straightLineFallback:false};
function station(s,ko,id='th-srt-'+s.id){if(!ko){missingNames.set(s.id,s);throw Error('한국어 표기 미검수: '+s.id+' '+s.th)}if(!s.th)throw Error('태국어 원명 누락: '+s.id);if(Number(s.id)>=5000&&Number(s.id)<6000){const master=official.groups.filter(g=>g.line>=5).flatMap(g=>g.stations).find(row=>row.th===s.th);if(master){id='th-srt-'+master.id;ko=names.get(master.id)}else{const current=currentNetwork.stations.find(row=>row.n===s.th);if(!current)throw Error('매끌롱 역 원명 대응 필요: '+s.th);id='th-srt-'+current.c;ko=names.get(current.c)}}return{id,station_id:id,stationMasterId:id,sourceStationId:s.id,countryId:'th',ko,th:s.th,en:s.en||'',names:{ko,th:s.th,en:s.en||'',ja:ko},ja:ko,kana:ko,romaji:s.en||'',latitude:s.lat,longitude:s.lon,koSource:'data/th/korean-stations.txt',koVerified:false,routeSpecificStationName:true,aliases:[s.th,s.en,ko].filter(Boolean),transfers:[]};}
function baseRoute(id,operator,ko,th,en,category,color){return{id,countryId:'th',operatorId:operator.id,operator:{...operator.names},line:{ko,th,en,ja:ko},category,mode:category,lineColor:color,code:id.split('-').at(-1).toUpperCase(),operationalStatus:'OPERATIONAL',playable:true,geometryReady:true,geometryStatus:'ready',geometrySource:provenance,patterns:[],services:[],stations:[],geometry:[]};}
function recordPattern(owner,{id,nameKo,nameTh='',nameEn='',direction,stations:st,geometry,calls,trainNumbers=[],evidence,extra={}}){
 if(st.length<2||geometry.length<2)throw Error('운행 구간 부족');
 const service={id,nameKo,nameJa:nameKo,nameTh,nameEn,stops:calls||st.map(s=>s.id)};
 const pattern={id,nameKo,nameTh,nameEn,direction,trainNumbers,evidence,...extra,stations:st,geometry,service};
 const signature=JSON.stringify({calls:service.stops,geometry:hash(JSON.stringify(geometry)),direction,nameKo});
 const prior=owner.patterns.find(p=>p.signature===signature);if(prior){prior.trainNumbers.push(...trainNumbers);return}
 owner.patterns.push({...pattern,signature});
}
const urban=read('data/th/source/bangkok-lines.json').lines;
const defs={sukhumvit:['bts','수쿰윗선','subway'],silom:['bts','실롬선','subway'],gold:['bts','골드라인','automated-guideway'],blue:['bem','블루라인','subway'],purple:['bem','퍼플라인','subway'],yellow:['ebm','옐로라인','monorail'],pink:['nbm','핑크라인','monorail'],arl:['aera1','공항철도 시티라인','airport_rail'],darkred:['srtet','다크 레드라인','commuter_rail'],lightred:['srtet','라이트 레드라인','commuter_rail']};
function decode(flat){let x=0,y=0;const p=[];for(let i=0;i<flat.length;i+=3){x+=flat[i];y+=flat[i+1];p.push([y/1e6,x/1e6])}return p;}
function urbanBuild(raw,owner=null){
 const def=defs[raw.key]||defs.pink,route=owner||baseRoute('th-'+def[0]+'-'+raw.key,op(def[0]),def[1],raw.name.th,raw.name.en,def[2],raw.color),points=decode(raw.legs.fwd);
 let list=raw.stations.map((s,i)=>({...s,ko:urbanNames[raw.key][i],code:s.code||''}));
 if(raw.key==='sukhumvit'){
  list=list.filter(s=>s.code!=='N6');
  const a=nearest(points,[13.80255,100.55378]);list.push({th:'หมอชิต',en:'Mo Chit',ko:'머칫',code:'N8',d:(a.index+a.t)*raw.step});list.sort((a,b)=>a.d-b.d);
  list.forEach((s,i)=>{s.code=i<18?'N'+(24-i):i<23?'N'+(23-i):i===23?'CEN':'E'+(i-23)});
 }
 if(raw.key==='silom')list[0].code='W1';
 if(raw.key==='gold')list.forEach((s,i)=>s.code='G'+(i+1));
 if(['blue','purple'].includes(raw.key))list.forEach((s,i)=>s.code=(raw.key==='blue'?'BL':'PP')+String(i+1).padStart(2,'0'));
 if(raw.key==='darkred')list.forEach((s,i)=>s.code='RN'+String(i+1).padStart(2,'0'));
 if(raw.key==='lightred')list.forEach((s,i)=>s.code=i===0?'RN01':'RW'+String(i+1).padStart(2,'0'));
 if(raw.key==='blue')list[1].en='Charan 13';
 if(raw.key==='sukhumvit')list.find(s=>s.code==='E7').th='เอกมัย';
 // 타프라의 두 승강장은 하나의 물리 역에 속한다. 두 번째 정차는 별도 방문 식별자다.
 if(raw.key==='blue'){
  const start=list[0],ref=points[Math.round(start.d/raw.step)],location=nearest(points,ref,35);
  if(!location||location.error>.15)throw Error('타프라 재방문 선형 누락');
  list.splice(32,0,{...start,d:(location.index+location.t)*raw.step,visit:2});
 }
 const first=Math.round(list[0].d/raw.step),last=Math.round(list.at(-1).d/raw.step),shape=points.slice(first,last+1),st=list.map(s=>{
  const i=Math.round(s.d/raw.step)-first,p=shape[i];if(!p)throw Error('도시철도 거리 인덱스 오류');
  const shared=raw.key==='pink-impact'&&s.code==='PK10'?'th-nbm-pink-PK10':raw.key==='silom'&&s.code==='CEN'?'th-bts-sukhumvit-CEN':'th-'+def[0]+'-'+(raw.key==='pink-impact'?'pink':raw.key)+'-'+s.code;
  const record=station({...s,id:s.code,lat:p[0],lon:p[1]},s.ko,shared);record.officialCode=s.code;record.stationCode=s.code;record.hasOfficialStationCode=true;record.geometryIndex=i;
  if(s.visit){record.id=shared+'-visit-'+s.visit;record.visitId=record.id;record.physicalStationId=shared;}
  return record;
 });
 const evidence={url:raw.key.startsWith('pink')?'https://www.ebm.co.th/cms-routemap/WareHouse/TimeTable/PinkLine.pdf':raw.key==='blue'||raw.key==='purple'?'https://metro.bemplc.co.th/Fare-Calculation?lang=en':raw.key.includes('red')?'https://www.srtet.co.th/en/station-information':raw.key==='arl'?'https://www.aera1.co.th/':op(def[0]).url,geometryUrl:'https://ms.longdo.com/3dtiles/rail/bangkok-trains/20261101/lines.json',checkedAt:'2026-11-03',scope:'공식 운영 노선·역 목록 대조; 배차 시각 시뮬레이션은 사용하지 않음'};
 for(const reverse of [false,true]){const ss=st.map(s=>({...s})),geometry=shape.map(p=>[...p]);if(reverse){geometry.reverse();ss.reverse();ss.forEach(s=>s.geometryIndex=shape.length-1-s.geometryIndex)}recordPattern(route,{id:route.id+(raw.key==='pink-impact'?'-muang-thong':'')+(reverse?'-reverse':'-forward'),nameKo:raw.key==='pink-impact'?'므앙통타니 지선':'각역정차',nameTh:raw.key==='pink-impact'?'สาขาเมืองทองธานี':'ทุกสถานี',nameEn:raw.key==='pink-impact'?'Muang Thong Thani branch':'All stops',direction:reverse?'reverse':'forward',stations:ss,geometry,evidence,extra:{branch:raw.key==='pink-impact',physicalStationReuse:raw.key==='blue'}})}
 if(!owner){route.stations=st;route.geometry=shape;route.infrastructureOwnerId=raw.key.startsWith('red')?'th-srt':raw.key==='arl'?'th-srt':['blue','purple','yellow','pink'].includes(raw.key)?'th-mrta':'th-bma';route.physicalStationCount=new Set(st.map(s=>s.station_id)).size;routes.push(route)}
 return route;
}
for(const raw of urban.filter(l=>defs[l.key]))try{const route=urbanBuild(raw);if(raw.key==='pink'){const branch=urban.find(l=>l.key==='pink-impact');urbanBuild(branch,route);route.physicalStationCount+=2}}catch(e){issues.push({id:raw.key,reason:e.message,status:'INCOMPLETE'})}
const corridorDefs=[
 ['north','북부선','Northern Line','1','1001','1222','#b52a32'],['sawankhalok','사완칼록 지선','Sawankhalok Branch','1','1137','1143','#b52a32'],
 ['northeast-ubon','동북부선 우본랏차타니 방면','Northeastern Ubon Corridor','2','1036','2290','#b07822'],['northeast-nongkhai','동북부선 농카이 방면','Northeastern Nong Khai Corridor','2','2115','2209','#b07822'],['northeast-buayai','깽코이·부아야이선','Kaeng Khoi–Bua Yai Line','2','2011','2136','#b07822'],
 ['south','남부선','Southern Line','4','4002','4432','#9864a0'],['suphanburi','수판부리 지선','Suphan Buri Branch','4','4020','4042','#9864a0'],['namtok','남똑 지선','Nam Tok Branch','4','4020','4077','#9864a0'],['khirirat','키리랏니콤 지선','Khiri Ratthanikhom Branch','4','4229','4238','#9864a0'],['kantang','뜨랑·깐땅 지선','Kantang Branch','4','4270','4294','#9864a0'],['nakhonsi','나콘시탐마랏 지선','Nakhon Si Thammarat Branch','4','4300','4308','#9864a0'],['padangbesar','빠당브사르 지선','Padang Besar Branch','4','4347','4374','#9864a0'],
 ['east-aranyaprathet','동부선 아란야쁘라텟 방면','Eastern Aranyaprathet Corridor','3','1001','3100','#467cad'],['east-sattahip','동부선 반플루따루앙 방면','Eastern Ban Phlu Ta Luang Corridor','3','3023','3047','#467cad'],
 ['maeklong-east','매끌롱선 웡위안야이·마하차이','Wongwian Yai–Mahachai','5','5001','5018','#378d60'],['maeklong-west','매끌롱선 반램·매끌롱','Ban Laem–Mae Klong','6','5019','5032','#378d60']
];
const corridorThai={north:'ทางรถไฟสายเหนือ',sawankhalok:'ทางแยกสวรรคโลก','northeast-ubon':'ทางรถไฟสายตะวันออกเฉียงเหนือ อุบลราชธานี','northeast-nongkhai':'ทางรถไฟสายตะวันออกเฉียงเหนือ หนองคาย','northeast-buayai':'ทางรถไฟสายแก่งคอย–บัวใหญ่',south:'ทางรถไฟสายใต้',suphanburi:'ทางแยกสุพรรณบุรี',namtok:'ทางแยกน้ำตก',khirirat:'ทางแยกคีรีรัฐนิคม',kantang:'ทางแยกกันตัง',nakhonsi:'ทางแยกนครศรีธรรมราช',padangbesar:'ทางแยกปาดังเบซาร์','east-aranyaprathet':'ทางรถไฟสายตะวันออก อรัญประเทศ','east-sattahip':'ทางรถไฟสายตะวันออก จุกเสม็ด','maeklong-east':'ทางรถไฟสายวงเวียนใหญ่–มหาชัย','maeklong-west':'ทางรถไฟสายบ้านแหลม–แม่กลอง'};
const corridors=new Map(corridorDefs.map(([slug,ko,en,region,a,b,color])=>[slug,{...baseRoute('th-srt-'+slug,op('srt'),ko,corridorThai[slug],en,'rail',color),srtRegion:Number(region),physicalEndpoints:[a,b]}]));
const stationAliases={'1008':'1000',YMRN:'1002',YMRE:'1002',BGS:'4006',PBT:'4373',KYB:'4058',TKB:'4072',NWN:'1023',SKG:'3088',TLK:'3124'};
const canonical=id=>stationAliases[id]||id;
const {loadMaps,pathBetween}=require('./lib/thailand-osm.cjs'),maeklongMap=loadMaps('data/th/source','map-maeklong'),maeklongPaths=new Map();
const nativeKey=s=>String(s||'').replace(/สถานีรถไฟ|ที่หยุดรถไฟ|สถานี|ชุมทาง|\s/g,'');
for(const [line,a,b]of[[5,'13457458692','13458435737'],[6,'1183545603','1085870067']])try{
 const physical=pathBetween(maeklongMap,a,b),list=official.groups.find(g=>g.line===line&&g.trip===1).stations,bindings=new Map();
 for(const s of list){
  let candidates=maeklongMap.stationNodes.filter(n=>nativeKey(n.tags['name:th']||n.tags.name)===nativeKey(s.th)).map(n=>({n,projection:nearest(physical.points,[n.lat,n.lon]),onPath:physical.nodeIds.includes(n.id)})).sort((a,b)=>Number(b.onPath)-Number(a.onPath)||a.projection.error-b.projection.error);
  let candidate=candidates[0],coordinateSource=candidate?'https://www.openstreetmap.org/node/'+candidate.n.id:null;
  if(!candidate&&s.id==='5031'){
   const entity=read('data/th/source/wikidata-Q13015628.json').entities.Q13015628,coordinate=entity.claims.P625[0].mainsnak.datavalue.value;
   candidate={n:{lat:coordinate.latitude,lon:coordinate.longitude},projection:nearest(physical.points,[coordinate.latitude,coordinate.longitude])};coordinateSource='https://www.wikidata.org/wiki/Q13015628';
  }
  if(!candidate||candidate.projection.error>.4)throw Error('매끌롱 역 좌표 대조 실패: '+s.id+' '+s.th);
  bindings.set(s.id,{...s,lat:candidate.n.lat,lon:candidate.n.lon,coordinateSource});
 }
 maeklongPaths.set(line,{...physical,bindings});
}catch(e){issues.push({id:'maeklong-'+line,reason:e.message,status:'INCOMPLETE'})}
function corridorFor(g,t,old){const ids=new Set(old?.stops?.map(s=>s[0])||t.entries.filter(e=>/\d{1,2}:\d{2}/.test(e.text)).map(s=>s.id));if(g.line===5)return'maeklong-east';if(g.line===6)return'maeklong-west';if(g.line===1)return ids.has('1143')?'sawankhalok':'north';if(g.line===2)return ids.has('2290')||[...ids].some(id=>Number(id)>2210&&Number(id)<2291)?'northeast-ubon':ids.has('2033')||ids.has('2032')?'northeast-buayai':'northeast-nongkhai';if(g.line===3)return[...ids].some(id=>Number(id)>=3032&&Number(id)<=3047)?'east-sattahip':'east-aranyaprathet';return ids.has('4042')?'suphanburi':ids.has('4077')?'namtok':ids.has('4238')?'khirirat':ids.has('4294')||ids.has('4289')?'kantang':ids.has('4308')?'nakhonsi':ids.has('4374')||ids.has('PBT')?'padangbesar':'south';}
const sourceManifest=read('data/th/source/manifest.json'),inventory=[],allGroups=[...official.groups];
for(const meta of currentMeta.values())if(!official.groups.some(g=>g.trains.some(t=>t.no===meta.no)))allGroups.push({line:meta.line,trip:Number(meta.no)%2?1:2,stations:[],trains:[{no:meta.no,entries:[]}]});
for(const group of allGroups)for(const current of group.trains){
 const old=sourceTrains.find(t=>t.no===current.no&&!['freight','other'].includes(t.kind)),slug=corridorFor(group,current,old),route=corridors.get(slug),id='th-srt-train-'+current.no;
 if(inventory.some(t=>t.id===id))continue;
 const entry={id,trainNumber:current.no,corridorId:route.id,source:'data/th/source/srt-'+group.line+'-'+group.trip+'-th.html',status:'INCOMPLETE'};inventory.push(entry);
 try{
  const currentFile='data/th/source/current-train-'+current.no+'.json',meta=currentMeta.get(current.no);
  if(meta&&fs.existsSync(currentFile)&&sourceManifest['current-train-'+current.no+'.json']?.url==='https://rotfai.live/api/train/'+meta.id&&!sourceManifest['current-train-'+current.no+'.json']?.error){
   const p=currentPattern(read(currentFile),meta,currentRail,names,station),category={'ด่วนพิเศษ':'특급','ด่วน':'급행','เร็ว':'쾌속','ธรรมดา':'보통','ชานเมือง':'통근열차','ท้องถิ่น':'지역열차','พิเศษชานเมือง':'특별 통근열차'}[meta.type],brand={'อุตราวิถี':'우뜨라위티','อีสานวัตนา':'이싼왓타나','อีสานมรรคา':'이싼막카','ทักษิณารัถย์':'탁씨나랏','ทักษิณ':'탁씬','ระหว่างประเทศ':'국제열차'}[meta.code],label=category+(brand?' · '+brand:'');if(!category)throw Error('현행 공식 열차종별 한국어 검수 필요: '+meta.type);
   recordPattern(route,{id,nameKo:label,nameTh:meta.type,nameEn:meta.typeEn,direction:group.trip===1?'forward':'reverse',stations:p.stations,geometry:p.geometry,trainNumbers:[current.no],evidence:{officialInventoryUrl:'https://ttsview.railway.co.th/timetable_modern.php?ln=en',fullStopsUrl:'https://rotfai.live/api/train/'+meta.id,geometrySource:'data/th/source/current-network.json',snapshotAt:read(currentFile).at,inventoryCheckedAt:'2026-11-03',scope:'공식 TTS 공개 재제공 전체 정차·시종착 원본; OSM 인접 꼭짓점 선로 검증'},extra:{trainCategory:meta.typeEn,originalTrainName:{th:meta.code||'',en:meta.codeEn||''},passedStationIds:p.passedStationIds,alignmentMaxErrorKm:p.alignmentMaxErrorKm,currentFullStops:true}});
   entry.status='SOURCE_SUPPORTED';entry.calls=p.stations.length;entry.sourceDate='2026-11-03';continue;
  }
  if(['133','134','147','148'].includes(current.no))throw Error('현행 비엔티안 캄싸왓 국제 종착역·국경 선로 검증 필요; 국내 종착역으로 축소하지 않음');
  if(['283','284','997','998'].includes(current.no))throw Error('현행 쭉싸멧 연장 종착역·운행 경로 검증 필요');
  if(group.line>=5){
   const physical=maeklongPaths.get(group.line);if(!physical)throw Error('매끌롱 독립 실선로·역 좌표 검증 미완료');
   const calls=current.entries.filter(e=>/\d{1,2}:\d{2}/.test(e.text)).map(e=>physical.bindings.get(e.id));if(calls.some(s=>!s))throw Error('매끌롱 정차역 누락');
   const shape=group.trip===1?physical.points:physical.points.slice().reverse(),a=align(shape,calls),ss=calls.map((s,i)=>({...station(s,names.get(s.id)),latitude:a.geometry[a.indices[i]][0],longitude:a.geometry[a.indices[i]][1],geometryIndex:a.indices[i],coordinateSource:s.coordinateSource}));
   recordPattern(route,{id,nameKo:'정기 여객열차',nameTh:'รถโดยสาร',nameEn:'Scheduled passenger service',direction:group.trip===1?'forward':'reverse',stations:ss,geometry:a.geometry,trainNumbers:[current.no],evidence:{officialUrl:'https://ttsview.railway.co.th/SRT_Schedule2022.php?ln=th&line='+group.line+'&trip='+group.trip,inventoryCheckedAt:'2026-11-03',geometryFiles:maeklongMap.files,osmWayIds:physical.wayIds,scope:'공식 전체 역 표의 실제 정차·통과와 OSM 선로 결합; 열차종별은 원표 미제공'},extra:{trainCategory:null,passedStationIds:current.entries.filter(e=>!/\d{1,2}:\d{2}/.test(e.text)).map(e=>e.id),physicalPath:physical.wayIds.map(id=>'osm-way:'+id),alignmentMaxErrorKm:a.maxErrorKm}});
   entry.status='SOURCE_SUPPORTED';entry.calls=ss.length;entry.sourceDate='2026-11-03';continue;
  }
  if(!old)throw Error(group.line>=5?'매끌롱 실선로·역 좌표 추가 대조 필요':'최신 열차의 전체 소역 정차 원본 필요');
  const days=official.trainRunningDays[current.no];if(/Cancelled|งดเดิน/.test(JSON.stringify(days)))throw Error('공식 운행 중지 표시');
  const currentCalls=current.entries.filter(e=>/\d{1,2}:\d{2}/.test(e.text)).map(e=>canonical(e.id)),scope=new Set(group.stations.map(s=>canonical(s.id))),oldCalls=old.stops.filter(s=>s[3]).map(s=>canonical(s[0]));
  const added=currentCalls.filter(id=>!oldCalls.includes(id)),removed=oldCalls.filter(id=>scope.has(id)&&!currentCalls.includes(id));
  if(added.length||removed.length)throw Error('현행 공식 표와 전체 정차 원본 충돌: 추가 '+added.join(',')+' / 제외 '+removed.join(','));
  const joined={points:currentRail.joinCodes(old.stops.map(s=>canonical(s[0]))),edges:old.stops.map(s=>({currentStationId:canonical(s[0])}))},calls=oldCalls.map(id=>{const raw=stations.get(id);if(!raw)throw Error('역 원자료 없음: '+id);if(raw.src==='interpolated')throw Error('실측 역 좌표 없음: '+id);return raw;});
  const a=align(joined.points,calls),ss=calls.map((s,i)=>({...station(s,names.get(s.id)),latitude:a.geometry[a.indices[i]][0],longitude:a.geometry[a.indices[i]][1],geometryIndex:a.indices[i],coordinateSource:s.coordinateEvidence}));
  const type=official.trainDetails[current.no]?.type||old.kind,label={special:'특급','special-express':'특급',express:'급행',rapid:'쾌속',ordinary:'보통',local:'지역열차',commuter:'통근열차',suburban:'통근열차',tourist:'관광열차',excursion:'관광열차',feeder_dm:'기동차'}[type];if(!label)throw Error('공식 열차종별 대조 필요: '+type);
  recordPattern(route,{id,nameKo:label,nameTh:old.kindTh,nameEn:old.kind,direction:group.trip===1?'forward':'reverse',stations:ss,geometry:a.geometry,trainNumbers:[current.no],evidence:{officialUrl:'https://ttsview.railway.co.th/SRT_Schedule2022.php?ln=th&line='+group.line+'&trip='+group.trip,fullStopsSource:'https://datagov.mot.go.th/dataset/after32',fullStopsSourceDate:'2024-12-18',geometrySource:'data/th/source/current-network.json',inventoryCheckedAt:'2026-11-03',scope:'최신 공개 전체 정차 원본과 현행 주요역 표의 무충돌 대조; 소역의 2026년 개별 재인증은 아님'},extra:{trainCategory:type,days:days||old.days,passedStationIds:old.stops.filter(s=>!s[3]).map(s=>s[0]),physicalPath:joined.edges,alignmentMaxErrorKm:a.maxErrorKm}});
  entry.status='SOURCE_SUPPORTED';entry.calls=ss.length;entry.sourceDate='2024-12-18';
 }catch(e){entry.reason=e.message;issues.push({...entry,reason:e.message})}
}
for(const route of corridors.values()){
 if(route.patterns.length){const longest=route.patterns.reduce((a,b)=>a.stations.length>b.stations.length?a:b);route.stations=longest.stations;route.geometry=longest.geometry;route.physicalStationCount=new Set(route.patterns.flatMap(p=>p.stations.map(s=>s.station_id))).size;routes.push(route)}
}
const candidates=[...corridors.values()].filter(r=>!r.patterns.length).map(r=>({id:r.id,line:r.line,status:'INCOMPLETE',reason:issues.filter(i=>i.corridorId===r.id).map(i=>i.reason).filter((x,i,a)=>a.indexOf(x)===i)}));
for(const [id,ko,status]of[['orange','오렌지라인','UNDER_CONSTRUCTION'],['purple-south','퍼플라인 남부 연장','UNDER_CONSTRUCTION'],['red-extension','레드라인 미개통 연장','UNDER_CONSTRUCTION'],['high-speed','태국 고속철도','UNDER_CONSTRUCTION'],['songkhla','쏭클라 구선','CLOSED'],['laemchabang','램차방 화물 지선','FREIGHT_ONLY'],['klongluk','반클롱륵 국경 운행','INCOMPLETE']])candidates.push({id:'th-candidate-'+id,nameKo:ko,status,reason:'공개 여객 운행계통·실선로 결합 검증 미완료; 플레이 제외'});
require('./lib/thailand-transfers.cjs').applyTransfers(routes);
const overrides=fs.existsSync('data/th/korean-overrides.json')?read('data/th/korean-overrides.json'):{};
const override=(kind,id)=>{const v=overrides[kind]?.[id];return typeof v==='string'?v:v?.ko};
for(const o of operators){const ko=override('operators',o.id);if(ko)Object.assign(o.names,{ko,ja:ko})}
for(const r of routes){r.operator={...operators.find(o=>o.id===r.operatorId).names};const lineKo=override('lines',r.id);if(lineKo)Object.assign(r.line,{ko:lineKo,ja:lineKo});for(const p of r.patterns){const ko=override('services',p.id);if(ko){p.nameKo=ko;p.service.nameKo=ko;p.service.nameJa=ko}for(const s of p.stations){const name=override('stations',s.station_id);if(name){Object.assign(s,{ko:name,ja:name,kana:name});s.names={...s.names,ko:name,ja:name}}}}
}
const index={schemaVersion:1,country:{id:'th',names:{ko:'태국',th:'ประเทศไทย',en:'Thailand'}},operators,routes:[],sourceNotice:'국철: 2026-11-03 TTS 공개 전체 정차 또는 2024-12-18 전체 정차와 공식 주요역 표 대조. 계통별 기준일을 확인하세요. 현행 전국 소역 정차의 완전성은 미확인입니다.',attribution:provenance.attribution+' · SRT TTS 공개자료 / Rotfai Radar'};
const editor={operators,lines:[],stations:[],services:[]};
for(const route of routes){
 route.stationCount=route.physicalStationCount||route.stations.length;route.services=route.patterns.map(p=>p.service);route.thailandServices=route.patterns.map(p=>p.id);
 const payload={route},plain=Buffer.from(JSON.stringify(payload)),data=zlib.gzipSync(plain,{level:9}),lazySource='data/th/generated/routes/'+route.id+'.json';
 write(lazySource,{encoding:'subtype-thailand-gzip-v1',countryId:'th',routeId:route.id,data:data.toString('base64'),sha256:crypto.createHash('sha256').update(plain).digest('hex')});
 const {patterns,services,stations:st,geometry,...meta}=route;
 index.routes.push({...meta,lazy:true,lazySource,stationSequence:[...new Map(patterns.flatMap(p=>p.stations).map(s=>[s.station_id,s])).values()].map(s=>({id:s.id,ko:s.ko,th:s.th,en:s.en})),searchStations:[...new Set(patterns.flatMap(p=>p.stations.flatMap(s=>[s.ko,s.th,s.en])))],serviceCount:patterns.length,geometryPointCount:geometry.length});
 editor.lines.push({id:route.id,...route.line,operatorId:route.operatorId});for(const p of patterns){editor.services.push({id:p.id,lineId:route.id,ko:p.nameKo,th:p.nameTh,en:p.nameEn,trainNumbers:p.trainNumbers});for(const s of p.stations)if(!editor.stations.some(x=>x.id===s.station_id))editor.stations.push({id:s.station_id,ko:s.ko,th:s.th,en:s.en});}
}
// 이전 빌드에서 보류로 바뀐 계통 파일이 배포 폴더에 남지 않도록 정리한다.
const activeFiles=new Set(index.routes.map(r=>path.basename(r.lazySource)));
for(const file of fs.readdirSync('data/th/generated/routes'))if(/^th-[a-z0-9-]+\.json$/.test(file)&&!activeFiles.has(file))fs.unlinkSync(path.join('data/th/generated/routes',file));
write('data/th/generated/index.json',index);write('data/th/generated/names.json',editor);
write('reports/thailand/inventory.json',{sourceTrainInventory:sourceTrains.length,officialTrains:inventory,physicalCorridors:corridorDefs.map(([slug,ko,en,region,a,b])=>({id:'th-srt-'+slug,nameKo:ko,srtRegion:region,origin:a,destination:b})),candidates,limitations:[index.sourceNotice,'추가 도시·관광 철도와 국경 운행에 대한 전국 공식 재고 인증은 미완료입니다.']});
write('reports/thailand/unresolved.json',{issues,candidates,missingNames:[...missingNames.values()]});
const summary={operators:new Set(routes.map(r=>r.operatorId)).size,physicalRouteCards:routes.length,servicePatterns:routes.reduce((n,r)=>n+r.patterns.length,0),selectableDirections:routes.reduce((n,r)=>n+r.patterns.length,0),stations:editor.stations.length,geometryRoutes:routes.length,playableServices:routes.reduce((n,r)=>n+r.patterns.length,0),unresolved:issues.length+candidates.length,categories:routes.reduce((m,r)=>{const x=m[r.category]??={routes:0,patterns:0};x.routes++;x.patterns+=r.patterns.length;return m},{}),sourceCompletenessVerified:false};
write('reports/thailand/summary.json',summary);console.log(JSON.stringify(summary,null,2));
