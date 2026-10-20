'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {load,validate,assemble}=require('./lib/kr-network');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
function verifyDistance(data,reference,readBytes){
 const pins={'source/distance/korail-operating-distances-20240901.xlsx':'5514e0eefde06d44171c34c69553328b7d93db1cd5611d8dacf79888e12e4697','source/distance/portal-15137040-20261020.html':'2136b82027a35b2e517d5b286fed2042b9c0499746cd7bccbc1db093a3f20df6'};
 for(const [file,hash] of Object.entries(pins))if(reference.sourceFiles[file]!==hash||digest(readBytes(file))!==hash)throw Error('DISTANCE_SOURCE_DRIFT');
 if(reference.referenceDate!=='2024-09-01'||reference.sheet!=='1-경부KTX운행거리'||reference.total.cell!=='AC5'||reference.total.km!==417.4||reference.releaseApproved!==false)throw Error('DISTANCE_REFERENCE_DRIFT');
 const expected=[['서울','대전','R5',159.8],['대전','동대구','W22',126.9],['동대구','부산','AC27',130.7]];
 if(JSON.stringify(reference.legs.map(r=>[r.from,r.to,r.cell,r.km]))!==JSON.stringify(expected))throw Error('DISTANCE_LEG_DRIFT');
 const {maps,errors}=validate(data);if(errors.length)throw Error(JSON.stringify(errors));
 const service=maps.services.get('kr-osm-service-11214334');
 if(digest(JSON.stringify(service.paths))!=='4a0c3e517bceda809454ab267b1cfbc388693ae5868e4e71ad6d5a6028fee628')throw Error('DISTANCE_PATH_DRIFT');
 const journey=assemble(service,maps);
 if(JSON.stringify(journey.stations.map(s=>s.ko))!==JSON.stringify(['서울','대전','동대구','부산']))throw Error('DISTANCE_STATION_DRIFT');
 function km(a,b){const rad=x=>x*Math.PI/180,dlat=rad(b[0]-a[0]),dlon=rad(b[1]-a[1]);return 6371*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dlon/2)**2))}
 const legs=journey.directedSegments.map((s,i)=>{const geometryKm=s.geometry.slice(1).reduce((n,p,j)=>n+km(s.geometry[j],p),0),publishedKm=reference.legs[i].km,relativeDifference=Math.abs(geometryKm-publishedKm)/publishedKm;if(relativeDifference>0.01)throw Error('DISTANCE_VARIANT_MISMATCH');return {...reference.legs[i],geometryKm,relativeDifference}});
 return {serviceId:service.id,referenceId:reference.id,status:'HISTORICAL_CORRIDOR_DISTANCE_MATCH',referenceDate:reference.referenceDate,reviewedOn:reference.reviewedOn,officialKm:reference.total.km,geometryKm:journey.lengthKm,legs,sourceUrl:reference.sourceUrl,currentApplicabilityVerified:false,releaseApproved:false,scope:'Historical distance agreement only; does not modify service approval, timetable, trips or release reviews'};
}
if(require.main===module){const base=path.resolve(__dirname,'../data/kr/v2'),data=load(base),reference=JSON.parse(fs.readFileSync(path.join(base,'official-distance-reference.json'))),result=verifyDistance(data,reference,f=>fs.readFileSync(path.join(base,f)));fs.writeFileSync(path.join(base,'distance-verifications.json'),JSON.stringify([result],null,2)+'\n');console.log(JSON.stringify(result));}
module.exports={verifyDistance};
