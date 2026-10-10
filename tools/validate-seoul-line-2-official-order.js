const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const write=(relative,value)=>fs.writeFileSync(path.join(root,relative),JSON.stringify(value,null,2)+'\n');
const sourcePath='data/kr/source/seoul-open-data/line-2-interstation-2024-03-25.json';
const geometryPath='data/kr/rebuild/geometry/kr-seoul-line-2.candidate.json';
const linePath='data/kr/rebuild/passenger-lines/kr-seoul-line-2.json';
const reportPath='data/kr/audit/SEOUL_LINE_2_OFFICIAL_ORDER.json';
const source=read(sourcePath),geometry=read(geometryPath),line=read(linePath);
const rows=source.rows.slice().sort((a,b)=>Number(a.ACML_DIST)-Number(b.ACML_DIST));
const names=(artifact,direction)=>read(`data/kr/generated/routes/${artifact}.json`).route.directions.find(item=>item.id===direction).stops.map(stop=>stop.ko);
const reverse=items=>items.slice().reverse();
const equal=(a,b)=>a.length===b.length&&a.every((value,index)=>value===b[index]);

const official={
  main:rows.filter(row=>Number(row.ACML_DIST)<=48.8).map(row=>row.SBWY_STNS_NM),
  seongsu:['성수',...rows.filter(row=>Number(row.ACML_DIST)>48.8&&Number(row.ACML_DIST)<=54.2).map(row=>row.SBWY_STNS_NM)],
  sinjeong:['신도림',...rows.filter(row=>Number(row.ACML_DIST)>54.2).map(row=>row.SBWY_STNS_NM)]
};
const expected=new Map([
  ['kr-metro-2:reverse',official.main],['kr-metro-2:forward',reverse(official.main)],
  ['kr-metro-2-section-2:forward',official.seongsu],['kr-metro-2-section-2:reverse',reverse(official.seongsu)],
  ['kr-metro-2-section-3:forward',official.sinjeong],['kr-metro-2-section-3:reverse',reverse(official.sinjeong)]
]);
const checks=[],errors=[];
for(const [key,order] of expected){
  const [artifact,direction]=key.split(':'),artifactStops=names(artifact,direction),candidate=geometry.directions.find(item=>item.artifact===artifact&&item.direction===direction);
  const artifactExact=equal(artifactStops,order),candidateExact=equal(candidate?.stopNames||[],order);
  const segments=candidate?.directedSegments;
  const segmentsExact=Array.isArray(segments)&&segments.length===order.length-1&&segments.every((segment,index)=>segment.from===order[index]&&segment.to===order[index+1]&&Array.isArray(segment.geometry)&&segment.geometry.length>=2);
  checks.push({artifact,direction,stationCount:order.length,artifactExact,candidateExact,segmentsExact});
  if(!artifactExact||!candidateExact||!segmentsExact)errors.push(`${key}: official order or segment boundary mismatch`)
}
const report={schemaVersion:1,validatedAt:new Date().toISOString(),passengerLineId:'kr-seoul-line-2',source:{file:sourcePath,datasetName:source.datasetName,datasetAsOf:source.datasetAsOf,provider:source.provider,license:source.license,sha256:source.sha256},checks,result:errors.length?'FAIL':'PASS',geometryReady:false,remainingGate:'runtime integration, train movement, station-sign, desktop/mobile, and Japan regression validation',errors};
write(reportPath,report);
if(!errors.length&&process.argv.includes('--apply')){
  geometry.geometryStatus='topology-and-official-order-validated-runtime-pending';
  geometry.geometryReady=false;
  geometry.officialOrderValidation={status:'passed',report:reportPath,source:sourcePath,datasetAsOf:source.datasetAsOf};
  write(geometryPath,geometry);
  line.stationOrderValidationStatus='official-api-validated';
  line.sourceRefs=line.sourceRefs.map(ref=>ref.kind==='official-station-order-and-distance'?{...ref,verificationStatus:'api-snapshot-validated',snapshot:sourcePath}:ref.kind==='osm-route-master'?{...ref,verificationStatus:'topology-and-official-order-validated-runtime-pending'}:ref);
  line.operatingPatterns=line.operatingPatterns.map(pattern=>({...pattern,geometryValidationStatus:'topology-and-official-order-validated-runtime-pending'}));
  write(linePath,line)
}
console.log(JSON.stringify({status:report.result,checks:checks.length,officialStations:rows.length,geometryReady:false,errors},null,2));
if(errors.length)process.exit(1)
