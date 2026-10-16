'use strict';
// KRIC mixes one-call-per-row tables with parallel indexed lists in a cell.
// Codes are source keys (including descending/alphanumeric station codes),
// never a request to sort rows or infer a travel direction.
function indexed(value){
 if(value==null||value==='')return null;
 if(typeof value!=='string')throw Error('NON_TEXT_INDEXED_CELL');
 const items=value.split(/[+/]/).map(s=>s.trim()),entries=[];
 // The airport workbook also uses code+time+code+time instead of code-time.
 if(items.length%2===0&&items.every((s,i)=>i%2?/^(?:\d{1,2}:\d{2}(?::\d{2})?|\s*:)$/.test(s):/^[A-Za-z]*\d+$/.test(s))){
  for(let i=0;i<items.length;i+=2)entries.push([items[i],items[i+1]]);
 }else for(const item of items){const m=/^([A-Za-z]*\d+)-(.*)$/.exec(item);if(!m)throw Error('UNPARSED_INDEXED_CELL');entries.push([m[1],m[2].trim()])}
 if(new Set(entries.map(e=>e[0])).size!==entries.length)throw Error('DUPLICATE_SOURCE_SEQUENCE');
 return entries;
}
function timeValues(value,stationCodes){
 const entries=indexed(value);if(!entries)return new Map();
 if(entries.some(([id,time])=>!stationCodes.has(id)||!(/^(?:\d{1,2}:\d{2}(?::\d{2})?|\s*:)$/.test(time))))throw Error('INVALID_PACKED_TIME');
 const result=new Map();
 for(const [id,time] of entries){
  if(time.replace(/\s/g,'')===':'){result.set(id,{value:null,raw:time});continue}
  const [hour,minute,second='0']=time.split(':').map(Number);
  if(hour>47||minute>59||second>59)throw Error('INVALID_PACKED_TIME');
  // Keep the literal source representation, including 00:00 placeholders.
  result.set(id,{value:time});
 }
 return result;
}
function decodeKricTrip(trip){
 const calls=[],issues=[],unparsedRows=[];let packedRows=0;
 for(const row of trip.calls){
  if(!/^[A-Za-z]*\d+-/.test(row.operationalStationName||'')){calls.push({...row});continue}
  packedRows++;
  try{
   const stations=indexed(row.operationalStationName),codes=new Set(stations.map(s=>s[0]));
   if(stations.some(([,name])=>!name))throw Error('EMPTY_PACKED_STATION');
   const arrival=timeValues(row.arrival,codes),departure=timeValues(row.departure,codes);
   for(const [code,name] of stations){
    const a=arrival.get(code),d=departure.get(code);
    calls.push({operationalStationName:name,arrival:a?.value??null,departure:d?.value??null,sourceRow:row.sourceRow,sourceSequence:code,dataReferenceDate:row.dataReferenceDate,...(a?.raw||d?.raw?{sourceTimeMarkers:{arrival:a?.raw??null,departure:d?.raw??null}}:{})});
   }
  }catch(e){issues.push(e.message);unparsedRows.push(row.sourceRow)}
 }
 return {...trip,calls,packedRows,decodeIssues:[...new Set(issues)],unparsedRows,reviewRequired:[...new Set([...(trip.reviewRequired||[]),...(issues.length?['UNPARSED_PACKED_CALLS']:[])])]};
}
module.exports={indexed,decodeKricTrip};
