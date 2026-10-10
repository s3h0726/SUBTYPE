#!/usr/bin/env node
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';
import{koreanFamilyServiceChoices,resolveKoreanFamilyService}from'../js/service-route-resolver.js';
import{resolvePlayableRoute}from'../js/route-integrity.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=id=>JSON.parse(fs.readFileSync(path.join(root,'data','kr','generated','routes',`${id}.json`),'utf8')).route;
const routes=new Map(['kr-metro-5','kr-metro-5-section-2','kr-metro-5-section-3'].map(id=>[id,read(id)])),choices=koreanFamilyServiceChoices('kr-passenger-metro-5'),checks=[],errors=[];
for(const choice of choices)try{
  const resolved=resolveKoreanFamilyService(choice,id=>routes.get(id)),playable=resolvePlayableRoute(resolved.route,{direction:resolved.direction,service:resolved.service}),names=playable.stations.map(station=>station.ko),expected=choice.direction==='forward'?[choice.originNames.ko,choice.destinationNames.ko]:[choice.originNames.ko,choice.destinationNames.ko],hasFallback=playable.segments.some(segment=>segment.fallbackGeometry||segment.geometryStatus!=='ready');
  const pass=names[0]===expected[0]&&names.at(-1)===expected[1]&&playable.segments.length===names.length-1&&!hasFallback&&playable.geometry.length>names.length;
  checks.push({patternId:choice.patternId,direction:choice.direction,stations:names.length,segments:playable.segments.length,points:playable.geometry.length,origin:names[0],destination:names.at(-1),fallbackGeometry:hasFallback,pass});if(!pass)errors.push(`${choice.patternId}/${choice.direction}: runtime route failed`);
}catch(error){errors.push(`${choice.patternId}/${choice.direction}: ${error.message}`)}
if(choices.length!==4)errors.push(`expected 4 choices, received ${choices.length}`);
const result={status:errors.length?'FAIL':'PASS',choices:choices.length,checks,errors};console.log(JSON.stringify(result,null,2));if(errors.length)process.exitCode=1;
