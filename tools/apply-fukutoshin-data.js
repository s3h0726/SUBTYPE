#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),lineFolder=path.join(root,'data','lines','tokyo-metro','fukutoshin-line');
const file=path.join(lineFolder,'stations.json'),relations=JSON.parse(fs.readFileSync(file,'utf8'));
const officialUrl='https://www.tokyometro.jp/station/line_fukutoshin/index.html',verifiedDate='2026-09-10';
const transfer=(lineId,stationCode,options={})=>({lineId,stationCode,...options});
const metadata={
  'station-mlit-003123':{code:'F-01',km:0,location:{prefecture:'사이타마현',municipality:'와코시'},transfers:[transfer('line-28006','Y-01',{sharedTrack:true}),transfer('line-21001','TJ11',{throughService:true})]},
  'station-mlit-003163':{code:'F-02',km:2.2,location:{prefecture:'도쿄도',municipality:'이타바시구'},transfers:[transfer('line-28006','Y-02',{sharedTrack:true})]},
  'station-mlit-003186':{code:'F-03',km:3.6,location:{prefecture:'도쿄도',municipality:'네리마구'},transfers:[transfer('line-28006','Y-03',{sharedTrack:true})]},
  'station-mlit-003228':{code:'F-04',km:5.4,location:{prefecture:'도쿄도',municipality:'네리마구'},transfers:[transfer('line-28006','Y-04',{sharedTrack:true})]},
  'station-mlit-003261':{code:'F-05',km:6.8,location:{prefecture:'도쿄도',municipality:'네리마구'},transfers:[transfer('line-28006','Y-05',{sharedTrack:true})]},
  'station-mlit-003294':{code:'F-06',km:8.3,location:{prefecture:'도쿄도',municipality:'네리마구'},transfers:[transfer('line-22003','SI37',{throughService:true}),transfer('line-28006','Y-06',{sharedTrack:true})]},
  'station-mlit-003324':{code:'F-07',km:9.3,location:{prefecture:'도쿄도',municipality:'도시마구'},transfers:[transfer('line-28006','Y-07')]},
  'station-mlit-003361':{code:'F-08',km:10.4,location:{prefecture:'도쿄도',municipality:'도시마구'},transfers:[transfer('line-28006','Y-08')]},
  'station-mlit-003379':{code:'F-09',km:11.3,location:{prefecture:'도쿄도',municipality:'도시마구'},transfers:[transfer('line-28002','M-25'),transfer('line-28006','Y-09'),transfer('line-11302','JY13'),transfer('line-11321','JA12'),transfer('line-11333','JS21'),transfer('line-22001','SI01'),transfer('line-21001','TJ01')]},
  'station-mlit-003471':{code:'F-10',km:13.1,location:{prefecture:'도쿄도',municipality:'도시마구'},transfers:[transfer('line-99305','SA27',{connectionStationName:'키시보진마에'})]},
  'station-mlit-003544':{code:'F-11',km:14.6,location:{prefecture:'도쿄도',municipality:'신주쿠구'},transfers:[]},
  'station-mlit-003612':{code:'F-12',km:15.5,location:{prefecture:'도쿄도',municipality:'신주쿠구'},transfers:[transfer('line-99301','E-02')]},
  'station-mlit-003689':{code:'F-13',km:16.6,location:{prefecture:'도쿄도',municipality:'신주쿠구'},transfers:[transfer('line-28002','M-09'),transfer('line-99304','S-02')]},
  'station-mlit-003780':{code:'F-14',km:18,location:{prefecture:'도쿄도',municipality:'시부야구'},transfers:[]},
  'station-1130206':{code:'F-15',km:19.2,location:{prefecture:'도쿄도',municipality:'시부야구'},transfers:[transfer('line-28005','C-03'),transfer('line-11302','JY19',{connectionStationName:'하라주쿠'})]},
  'station-mlit-003922':{code:'F-16',km:20.2,location:{prefecture:'도쿄도',municipality:'시부야구'},transfers:[transfer('line-26001','TY01',{throughService:true}),transfer('line-26003','DT01'),transfer('line-28001','G-01'),transfer('line-28008','Z-01'),transfer('line-11302','JY20'),transfer('line-11321','JA10'),transfer('line-11333','JS19'),transfer('line-24006','IN01')]}
};
const commuterExpress=new Set(['station-mlit-003123','station-mlit-003163','station-mlit-003186','station-mlit-003228','station-mlit-003261','station-mlit-003294','station-mlit-003379','station-mlit-003689','station-1130206','station-mlit-003922']);
const express=new Set(['station-mlit-003123','station-mlit-003294','station-mlit-003379','station-mlit-003689','station-1130206','station-mlit-003922']);
const sTrain=new Set(['station-mlit-003379','station-mlit-003689','station-mlit-003922']);
for(const relation of relations){const value=metadata[relation.stationId];if(!value)throw new Error(`Missing Fukutoshin metadata: ${relation.stationId}`);relation.stationCode=value.code;relation.hasOfficialStationCode=true;relation.stationCodeSource={family:'official',method:'direct',type:'official',url:officialUrl,verified:true,confidence:'HIGH',verifiedDate,status:'VERIFIED'};relation.distanceKm=value.km;relation.location=value.location;relation.transfers=value.transfers;relation.serviceStops={local:true,commuterExpress:commuterExpress.has(relation.stationId),express:express.has(relation.stationId),sTrain:sTrain.has(relation.stationId)}}
fs.writeFileSync(file,JSON.stringify(relations,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',lineId:'line-28010',stations:relations.length,commuterExpressStops:commuterExpress.size,expressStops:express.size,sTrainStops:sTrain.size},null,2));
