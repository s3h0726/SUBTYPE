#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {writeAtomic}=require('./lib/line-workspaces');

const sourceFolder=path.join(root,'data','lines','kobekosokutetsudo','kobekosokutozaisen');
const targetFolder=path.join(root,'data','lines','hanshindentetsu','hanshinkobekosokusen');
fs.mkdirSync(targetFolder,{recursive:true});

const sourceStations=JSON.parse(fs.readFileSync(path.join(sourceFolder,'stations.json'),'utf8')).slice(0,7);
const codes=['HS33','HS34','HS35','HS36','HS37','HS38','HS39'];
const stations=sourceStations.map((row,index)=>({
  ...row,
  order:index+1,
  stationCode:codes[index],
  hasOfficialStationCode:true,
  stationCodeSource:{
    type:'official-hanshin-numbering',
    url:'https://www.hanshin.co.jp/station/',
    verified:true,
    confidence:'HIGH',
    status:'VERIFIED'
  }
}));

const sourceGeometry=JSON.parse(fs.readFileSync(path.join(sourceFolder,'geometry.json'),'utf8'));
const geometry={};
for(let i=0;i<stations.length-1;i++){
  const key=stations[i].stationId+'::'+stations[i+1].stationId;
  const reverse=stations[i+1].stationId+'::'+stations[i].stationId;
  if(sourceGeometry[key]?.geometry?.length>=2){
    geometry[key]={...sourceGeometry[key],source:(sourceGeometry[key].source||'shared')+' [Hanshin Kobe Kosoku reuse]',verified:sourceGeometry[key].verified!==false};
  }else if(sourceGeometry[reverse]?.geometry?.length>=2){
    geometry[key]={
      ...sourceGeometry[reverse],
      fromStationId:stations[i].stationId,
      toStationId:stations[i+1].stationId,
      geometry:sourceGeometry[reverse].geometry.slice().reverse(),
      source:(sourceGeometry[reverse].source||'shared')+' [Hanshin Kobe Kosoku reversed reuse]',
      verified:sourceGeometry[reverse].verified!==false
    };
  }else{
    geometry[key]={
      fromStationId:stations[i].stationId,
      toStationId:stations[i+1].stationId,
      geometry:[],
      source:'shared Kobe Kosoku geometry pending/fallback',
      verified:false
    };
  }
}

const line={
  schemaVersion:1,
  id:'line-hanshin-kobe-kosoku',
  legacyId:'line-hanshin-kobe-kosoku',
  operatorId:'hanshindentetsu',
  category:'private',
  names:{
    ja:'神戸高速線',
    kana:'こうべこうそくせん',
    ko:'고베 고속선',
    en:'Kobe Kosoku Line'
  },
  code:'HS',
  color:'#009944',
  symbol:{
    asset:null,
    officialSymbolExists:false,
    source:'',
    verified:false
  },
  loop:false,
  stationSignTemplate:'hanshindentetsu',
  services:[],
  throughServiceIds:[],
  routeInfo:{
    operationalSection:'元町～西代',
    operatorRole:'Hanshin second-class railway operation',
    physicalInfrastructureLineId:'line-99630'
  },
  sources:{
    official:'https://www.hanshin.co.jp/station/',
    korean:'https://www.hanshin.co.jp/global/korea/pdf/map.pdf',
    geometry:'reused from Kobe Kosoku Tozai physical line / MLIT-N02 where available'
  },
  legacy:{
    origin:'current-2026-addition',
    coverage:'Hanshin-operational-section',
    dataKind:'operationalLine'
  }
};

writeAtomic(path.join(targetFolder,'line.json'),line);
writeAtomic(path.join(targetFolder,'stations.json'),stations);
writeAtomic(path.join(targetFolder,'geometry.json'),geometry);
fs.writeFileSync(path.join(targetFolder,'README.md'),
  '# Hanshin Kobe Kosoku Line\n\nHanshin operational section from Motomachi to Nishidai. Physical infrastructure overlaps the existing Kobe Kosoku Tozai line dataset.\n'
);
console.log(JSON.stringify({added:line.id,stations:stations.length,codes},null,2));
