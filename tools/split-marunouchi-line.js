#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),parentFolder=path.join(root,'data','lines','tokyo-metro','marunouchi-line'),branchFolder=path.join(root,'data','lines','tokyo-metro','marunouchi-honancho-branch');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8')),write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});const temporary=`${file}.tmp-${process.pid}`;fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n');JSON.parse(fs.readFileSync(temporary,'utf8'));fs.renameSync(temporary,file)};
const parentStationsFile=path.join(parentFolder,'stations.json'),parentStations=read(parentStationsFile),junctionId='station-mlit-003643';
const mainTerminalIndex=parentStations.findIndex(item=>item.stationId==='station-mlit-003575');
if(mainTerminalIndex<0)throw new Error('Marunouchi main terminal Ogikubo is missing');
const mainStations=parentStations.slice(0,mainTerminalIndex+1).map((item,index)=>({...item,order:index+1}));
if(!mainStations.some(item=>item.stationId===junctionId))throw new Error('Marunouchi junction Nakano-sakaue is missing');
const branchRelations=[
  {stationId:junctionId,order:1,stationCode:'M06',hasOfficialStationCode:true,stationCodeSource:{type:'official',url:'https://www.tokyometro.jp/station/line_marunouchi/index.html',verified:true,confidence:'HIGH',status:'VERIFIED'}},
  {stationId:'station-2800226',order:2,stationCode:'Mb05',hasOfficialStationCode:true,stationCodeSource:{type:'official',url:'https://www.tokyometro.jp/station/line_marunouchi/index.html',verified:true,confidence:'HIGH',status:'VERIFIED'}},
  {stationId:'station-2800227',order:3,stationCode:'Mb04',hasOfficialStationCode:true,stationCodeSource:{type:'official',url:'https://www.tokyometro.jp/station/line_marunouchi/index.html',verified:true,confidence:'HIGH',status:'VERIFIED'}},
  {stationId:'station-2800228',order:4,stationCode:'Mb03',hasOfficialStationCode:true,stationCodeSource:{type:'official',url:'https://www.tokyometro.jp/station/line_marunouchi/index.html',verified:true,confidence:'HIGH',status:'VERIFIED'}}
];
const imported=read(path.join(root,'data','branches','tokyo-metro-marunouchi-honancho','geometry.json')),geometry={};
for(const segment of imported.directedSegments||[]){
  const from=segment.fromStationId==='2800220'?junctionId:`station-${segment.fromStationId}`,to=segment.toStationId==='2800220'?junctionId:`station-${segment.toStationId}`;
  geometry[`${from}::${to}`]={fromStationId:from,toStationId:to,geometry:segment.geometry,source:`OpenStreetMap relation ${segment.source?.relationId||'8015930'}`,verified:segment.source?.verified===true};
}
if(Object.keys(geometry).length!==3)throw new Error('Expected three verified Honancho geometry segments');
const branchLine={schemaVersion:1,id:'line-28002-honancho-branch',operatorId:'tokyo-metro',category:'subway',parentLineId:'line-28002',branchId:'tokyo-metro-marunouchi-honancho-branch',names:{ja:'丸ノ内線分岐線',kana:'',ko:'마루노치선 호난초 지선',en:'Marunouchi Line Honancho Branch'},code:'Mb',color:'#e60012',symbol:{asset:null,officialSymbolExists:false,source:'',verified:false,assetSource:'none',licenseVerified:false},loop:false,stationSignTemplate:'tokyo-metro',services:[],throughServiceIds:[],sources:{official:'https://www.tokyometro.jp/station/line_marunouchi/index.html',geometry:'OpenStreetMap relation 8015930'},legacy:{origin:'canonical-split',coverage:'complete-branch',dataKind:'branchRoute'}};
const catalogFile=path.join(root,'data','tokyo-service-patterns.json'),catalog=read(catalogFile);
catalog.branches=(catalog.branches||[]).filter(item=>item.id!==branchLine.branchId);
catalog.servicePatterns=(catalog.servicePatterns||[]).filter(item=>item.id!=='marunouchi-honancho-local');
write(parentStationsFile,mainStations);write(path.join(branchFolder,'line.json'),branchLine);write(path.join(branchFolder,'stations.json'),branchRelations);write(path.join(branchFolder,'geometry.json'),geometry);write(catalogFile,catalog);
console.log(JSON.stringify({status:'PASS',main:{id:'line-28002',stations:mainStations.length},branch:{id:branchLine.id,stations:branchRelations.length,segments:Object.keys(geometry).length}},null,2));
