// Add display metadata only. Never change the service signature, calls or IDs.
function serviceDisplay(spec,lines,afrTrainNames=[]){
 const first=lines.find(l=>l.id===spec.parts[0]?.lineId),lineName=first?.line?.zh||'',operator=first?.operatorId;
 let zh=spec.nameZh||'',kind='source-train-type',source=spec.evidence;
 if(!zh&&operator==='tw-tymc'){
  zh=spec.nameKo.includes('급행')?'直達車':'普通車';kind='official-train-class';source='https://www.tymetro.com.tw/tymetro-new/tw/_pages/travel-guide/introduce.html';
 }
 if(!zh&&operator==='tw-afr'&&spec.nameKo==='아리산호')zh=afrTrainNames.find(n=>n==='阿里山號')||'';
 if(!zh){zh=lineName+(spec.loop?'':' · 停靠'+spec.calls.length+'站');kind='source-line-description';source=first?.geometrySource?.sourceFile;}
 if(spec.roundTrip){zh+=' · 1公里往返';kind='source-line-and-round-trip';}
 if(spec.loop&&!spec.roundTrip){zh+=' · '+(spec.direction==='reverse'?'逆時針':'順時針');kind='source-line-and-geographic-direction';}
 return{displayNames:{ko:spec.nameKo,zh,en:(first?.line?.en||'')+' · '+spec.calls.length+' stops'},displayNameKind:kind,displayNameSource:source,missingChinese:!zh};
}
module.exports={serviceDisplay};
