#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {loadStations,writeAtomic}=require('./lib/line-workspaces');

const stationData=loadStations().map;
const byJa=new Map;
for(const st of stationData.values()){
  const ja=st.names?.ja;
  if(ja&&!byJa.has(ja))byJa.set(ja,st);
}
const stationIdByJa=name=>{
  const st=byJa.get(name);
  if(!st)throw new Error('station not found: '+name);
  return st.id;
};
const ensureDir=p=>fs.mkdirSync(p,{recursive:true});
const noCode={type:'none',url:'',verified:false,confidence:null,status:'NO_OFFICIAL_CODE'};
const rel=(id,order,code=null)=>({stationId:id,order,stationCode:code,hasOfficialStationCode:!!code,stationCodeSource:code?{type:'official',url:'',verified:true,confidence:'HIGH',status:'VERIFIED'}:noCode});
const emptyGeometry=rels=>Object.fromEntries(rels.slice(0,-1).map((r,i)=>{const n=rels[i+1];return [r.stationId+'::'+n.stationId,{fromStationId:r.stationId,toStationId:n.stationId,geometry:[],source:'pending-OSM-recovery',verified:false}]}));
const lineBase=(id,operatorId,category,names,color,stationSignTemplate,sourcesOfficial)=>({
  schemaVersion:1,id,legacyId:id,operatorId,category,names,code:'',color,
  symbol:{asset:null,officialSymbolExists:false,source:'',verified:false},
  loop:false,stationSignTemplate,services:[],throughServiceIds:[],
  sources:{official:sourcesOfficial,korean:'',geometry:'OpenStreetMap recovery pending'},
  legacy:{origin:'current-2026-addition',coverage:'official-current-route',dataKind:'physicalRoute'}
});
const operator=(id,names,template,official)=>({
  id,legacyIds:[],names,stationSignTemplate:template,
  sources:{official},logo:{asset:null,source:'',verified:false}
});
function writeLine(folder,line,rels,geometry=emptyGeometry(rels)){
  ensureDir(folder);
  writeAtomic(path.join(folder,'line.json'),line);
  writeAtomic(path.join(folder,'stations.json'),rels);
  writeAtomic(path.join(folder,'geometry.json'),geometry);
  writeAtomic(path.join(folder,'README.md'),{note:'Generated from official current route information, 2026-10-07.'});
}
function writeOperator(folder,data){
  ensureDir(folder);writeAtomic(path.join(folder,'operator.json'),data);
}

// New canonical stations introduced after the legacy nationwide snapshot.
const additionsPath=path.join(root,'data','shared-stations','stations-current-2026.json');
const additions=[
  {id:'station-current-shikibu',names:{ja:'しきぶ',kana:'しきぶ',ko:'시키부',en:'Shikibu'},aliases:{ko:[]},coordinates:{lat:35.8978,lng:136.1498},prefectureCode:18,sources:{name:'Hapi-Line Fukui official 2026',coordinate:'MapFan vicinity / manual review'},koSource:'manual-current-addition',koVerified:false,koConfidence:'MEDIUM',koReviewStatus:'REVIEW_REQUIRED'},
  {id:'station-kitakyu-m06',names:{ja:'箕面萱野',kana:'みのおかやの',ko:'미노오카야노',en:'Minoh-kayano'},aliases:{ko:[]},coordinates:{lat:34.83239,lng:135.48902},prefectureCode:27,sources:{name:'Kita-Osaka Kyuko official',coordinate:'OpenStreetMap/Map reference'},koSource:'manual-current-addition',koVerified:false,koConfidence:'MEDIUM',koReviewStatus:'REVIEW_REQUIRED'},
  {id:'station-kitakyu-m07',names:{ja:'箕面船場阪大前',kana:'みのおせんばはんだいまえ',ko:'미노오센바한다이마에',en:'Minoh-semba handai-mae'},aliases:{ko:[]},coordinates:{lat:34.8217014,lng:135.4902853},prefectureCode:27,sources:{name:'Kita-Osaka Kyuko official',coordinate:'MapFan'},koSource:'manual-current-addition',koVerified:false,koConfidence:'MEDIUM',koReviewStatus:'REVIEW_REQUIRED'},
  {id:'station-kitakyu-m08',names:{ja:'千里中央',kana:'せんりちゅうおう',ko:'센리츄오',en:'Senri-chuo'},aliases:{ko:['센리추오']},coordinates:{lat:34.8099221,lng:135.494981},prefectureCode:27,sources:{name:'Kita-Osaka Kyuko official',coordinate:'MapFan'},koSource:'manual-current-addition',koVerified:false,koConfidence:'MEDIUM',koReviewStatus:'REVIEW_REQUIRED'},
  {id:'station-kitakyu-m09',names:{ja:'桃山台',kana:'ももやまだい',ko:'모모야마다이',en:'Momoyamadai'},aliases:{ko:[]},coordinates:{lat:34.7931501,lng:135.4973009},prefectureCode:27,sources:{name:'Kita-Osaka Kyuko official',coordinate:'MapFan'},koSource:'manual-current-addition',koVerified:false,koConfidence:'MEDIUM',koReviewStatus:'REVIEW_REQUIRED'},
  {id:'station-kitakyu-m10',names:{ja:'緑地公園',kana:'りょくちこうえん',ko:'료쿠치코엔',en:'Ryokuchi-koen'},aliases:{ko:['료쿠치공원']},coordinates:{lat:34.7753171,lng:135.4953487},prefectureCode:27,sources:{name:'Kita-Osaka Kyuko official',coordinate:'MapFan'},koSource:'manual-current-addition',koVerified:false,koConfidence:'MEDIUM',koReviewStatus:'REVIEW_REQUIRED'},
  {id:'station-kitakyu-m11',names:{ja:'江坂',kana:'えさか',ko:'에사카',en:'Esaka'},aliases:{ko:[]},coordinates:{lat:34.758555,lng:135.4970761},prefectureCode:27,sources:{name:'Kita-Osaka Kyuko official',coordinate:'MapFan'},koSource:'manual-current-addition',koVerified:false,koConfidence:'MEDIUM',koReviewStatus:'REVIEW_REQUIRED'}
];
writeAtomic(additionsPath,additions);

// Hapi-Line Fukui, current 2026 route including Shikibu.
writeOperator(path.join(root,'data','operators','hapi-line-fukui'),operator('hapi-line-fukui',{ja:'ハピラインふくい',ko:'하피라인 후쿠이',en:'Hapi-Line Fukui'},'operator-private','https://hapi-line.co.jp/'));
const hapiNames=['敦賀','南今庄','今庄','湯尾','南条','王子保','しきぶ','武生','鯖江','北鯖江','大土呂','越前花堂','福井','森田','春江','丸岡','芦原温泉','細呂木','牛ノ谷','大聖寺'];
const hapiRels=hapiNames.map((name,i)=>rel(name==='しきぶ'?'station-current-shikibu':stationIdByJa(name),i+1));
writeLine(path.join(root,'data','lines','hapi-line-fukui','hapi-line-fukui'),lineBase('line-hapi-fukui','hapi-line-fukui','third-sector',{ja:'ハピラインふくい線',kana:'はぴらいんふくいせん',ko:'하피라인 후쿠이선',en:'Hapi-Line Fukui Line'},'#7B4199','operator-private','https://hapi-line.co.jp/'),hapiRels);

// Expand IR Ishikawa to the full current Daishoji-Kurikara route.
const irNames=['大聖寺','加賀温泉','動橋','粟津','小松','明峰','能美根上','小舞子','美川','加賀笠間','西松任','松任','野々市','西金沢','金沢','東金沢','森本','津幡','倶利伽羅'];
const irRels=irNames.map((name,i)=>rel(stationIdByJa(name),i+1));
const irFolder=path.join(root,'data','lines','irishikawatetsudo','irishikawatetsudosen');
writeAtomic(path.join(irFolder,'stations.json'),irRels);
const irLine=JSON.parse(fs.readFileSync(path.join(irFolder,'line.json'),'utf8'));
irLine.sources.official='https://www.ishikawa-railway.jp/station/';
irLine.names.ko='IR 이시카와 철도선';
writeAtomic(path.join(irFolder,'line.json'),irLine);
writeAtomic(path.join(irFolder,'geometry.json'),emptyGeometry(irRels));

// Kita-Osaka Kyuko Namboku Line, including the 2024 extension.
writeOperator(path.join(root,'data','operators','kita-osaka-kyuko'),operator('kita-osaka-kyuko',{ja:'北大阪急行電鉄',ko:'북오사카 급행전철',en:'Kita-Osaka Kyuko Railway'},'operator-private','https://www.kita-kyu.co.jp/'));
const kitakyu=[
 ['station-kitakyu-m06','M06'],['station-kitakyu-m07','M07'],['station-kitakyu-m08','M08'],
 ['station-kitakyu-m09','M09'],['station-kitakyu-m10','M10'],['station-kitakyu-m11','M11']
].map(([id,code],i)=>rel(id,i+1,code));
writeLine(path.join(root,'data','lines','kita-osaka-kyuko','namboku-line'),lineBase('line-kitakyu-namboku','kita-osaka-kyuko','private',{ja:'南北線',kana:'なんぼくせん',ko:'남북선',en:'Namboku Line'},'#E60012','operator-private','https://www.kita-kyu.co.jp/'),kitakyu);

console.log(JSON.stringify({added:['line-hapi-fukui','line-kitakyu-namboku'],updated:['line-99426'],stationsAdded:additions.length},null,2));
