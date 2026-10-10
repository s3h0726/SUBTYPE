#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..'),read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const official=read('data/kr/source/seoul-open-data/line-6-interstation-2024-03-25.json'),candidate=read('data/kr/rebuild/geometry/kr-seoul-line-6.candidate.json'),graph=read('data/kr/rebuild/topology/kr-seoul-line-6.graph.json'),line=read('data/kr/rebuild/passenger-lines/kr-seoul-line-6.json'),errors=[],checks=[];
const officialNames=official.rows.map(row=>row.SBWY_STNS_NM),expectedOfficial=['응암','역촌','불광','독바위','연신내','구산','응암','새절','증산','디지털미디어시티','월드컵경기장','마포구청','망원','합정','상수','광흥창','대흥','공덕','효창공원앞','삼각지','녹사평','이태원','한강진','버티고개','약수','청구','신당','동묘앞','창신','보문','안암','고려대','월곡','상월곡','돌곶이','석계','태릉입구','화랑대','봉화산'];
const check=(id,pass,detail)=>{checks.push({id,status:pass?'pass':'fail',detail});if(!pass)errors.push(`${id}: ${detail}`)};
check('official-order',JSON.stringify(officialNames)===JSON.stringify(expectedOfficial),`${officialNames.length} official rows`);
check('official-license',official.license?.id==='KOGL-Type-1','서울 열린데이터광장 공공누리 제1유형');
check('sinnae-explicit-coverage',official.coverage?.missingStations?.length===1&&official.coverage.missingStations[0]==='신내'&&line.sourceRefs.some(ref=>ref.kind==='official-extension-opening'),'공식 역간거리 누락과 서울시 개통 근거를 분리 기록');
check('osm-provenance',candidate.source?.osmRouteMasterRelationId===7919154&&candidate.source?.license==='ODbL-1.0','OSM route master 7919154 / ODbL');
check('directions',candidate.directions?.length===3&&candidate.directions.every(item=>item.directedSegments.length===item.stopNames.length-1&&item.validation?.nearestTrackMatchingUsed===false),'main two directions plus one-way Eungam loop');
check('one-way-loop',candidate.directions.filter(item=>item.artifact==='kr-metro-6-section-2').length===1&&candidate.unverifiedDirections?.some(item=>item.artifact==='kr-metro-6-section-2'&&item.direction==='reverse'),'reverse loop geometry is intentionally prohibited');
check('graph',graph.nodes?.length===538&&graph.tracks?.length===538&&graph.junctionNodeIds?.length===1,'538 nodes / 538 tracks / one loop junction');
check('release-gate',candidate.geometryReady===false&&line.geometryReady===false&&line.gameValidationStatus==='not-run','candidate remains blocked from runtime');
const result={schemaVersion:1,validatedAt:new Date().toISOString(),passengerLineId:line.id,result:errors.length?'FAIL':'PASS',checks,stationCount:39,directionCount:3,segmentCount:candidate.directions.reduce((sum,item)=>sum+item.directedSegments.length,0),geometrySource:'OpenStreetMap route master 7919154',geometryStatus:candidate.geometryStatus,validatedSegmentCount:errors.length?0:72,failedSegmentCount:errors.length?72:0,browserTestStatus:'not-run',geometryReady:false,errors};
fs.writeFileSync(path.join(root,'data/kr/audit/SEOUL_LINE_6_OFFICIAL_ORDER.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.result,checks:checks.length,stations:39,segments:result.segmentCount,geometryReady:false,errors},null,2));if(errors.length)process.exitCode=1;
