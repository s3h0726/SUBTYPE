#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const distance=(a,b)=>{const rad=x=>x*Math.PI/180,x=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lon-a.lon)/2)**2;return 12742000*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))};
function matchStations(reference,stations){
 const names=new Map();for(const s of stations){const name=s.names?.ko;if(!names.has(name))names.set(name,[]);names.get(name).push(s)}
 const matches=reference.map(row=>{
  const point=row.coordinates,valid=p=>p&&typeof p.lat==='number'&&typeof p.lon==='number'&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=32&&p.lat<=40&&p.lon>=123&&p.lon<=133;
  const candidates=(names.get(row.names?.ko)||[]).filter(s=>valid(point)&&valid(s.coordinates)).map(s=>({stationId:s.id,distanceMeters:Math.round(distance(point,s.coordinates))})).filter(s=>s.distanceMeters<=500).sort((a,b)=>a.distanceMeters-b.distanceMeters);
  return {referenceId:row.id,officialLineCode:row.officialLineCode,number:row.number,source:row.source,candidates,status:'candidate',reviewRequired:!valid(point)?'INVALID_OFFICIAL_COORDINATE':candidates.length===1?'PLATFORM_OPERATOR_AND_CURRENT_STATUS':candidates.length?'AMBIGUOUS_PHYSICAL_STATION':'NO_EXACT_NAME_AND_POSITION_MATCH'};
 });
 return {status:'INCOMPLETE',approved:0,counts:{referenceRows:reference.length,uniqueCandidateRows:matches.filter(m=>m.candidates.length===1).length,ambiguousRows:matches.filter(m=>m.candidates.length>1).length,unmatchedRows:matches.filter(m=>!m.candidates.length).length},matches};
}
if(require.main===module){const base=path.resolve(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8')),result=matchStations(read('official-station-reference'),read('stations'));fs.writeFileSync(path.join(base,'official-station-matches.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.counts,null,2))}
module.exports={matchStations};
