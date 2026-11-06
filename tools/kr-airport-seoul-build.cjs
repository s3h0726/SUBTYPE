'use strict';
// 같은 공식 정류장 ID로 공항 좌표를 정합하고 원본 도로의 정차 순서를 복구한다.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),Module=require('node:module');
const dir='data/kr/canonical',read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const inventory=read('provincial-gbis-inventory.json').routes.filter(r=>['51','52','53'].includes(String(r.routeTp))),coordinates=new Map;
for(const r of inventory){const file='provincial-gbis-source/'+r.routeId+'-detail.json.gz',data=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,file)))).result.gg;
 for(const direction of ['up','down'])for(const s of data?.[direction]?.list||[])if(/^161/.test(s.stationId)&&!coordinates.has(s.stationId))coordinates.set(s.stationId,{sourceStopId:s.stationId,name:s.stationNm,latitude:Math.atan(Math.sinh(+s.lat/6378137))*180/Math.PI,longitude:+s.lon/6378137*180/Math.PI,sourceFile:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex')});}
fs.writeFileSync(path.join(dir,'airport-stop-coordinate-reconciliation.json'),JSON.stringify({checkedAt:'2026-11-05',method:'이름·거리 추정 없이 같은 공식 정류장 ID의 GBIS 좌표를 사용. TOPIS 원래 좌표도 보존.',stops:[...coordinates.values()]},null,2)+'\n');
const filename=path.join(__dirname,'kr-bus-recover-topis.cjs');let source=fs.readFileSync(filename,'utf8');
function replace(a,b){if(!source.includes(a))throw Error('서울 공항버스 생성기 계약 변경: '+a);source=source.replace(a,b)}
replace("const published=new Set(read('bus-topis-batch.json').routes.map(r=>r.id));", "const own=fs.existsSync(path.join(dir,'airport-seoul-batch.json'))?new Set(read('airport-seoul-batch.json').routes.map(r=>r.id)):new Set;const published=new Set(JSON.parse(fs.readFileSync(path.join(dir,'../generated/index.json'))).routes.filter(r=>!own.has(r.id)).map(r=>r.id));const coordinateRows=new Map(read('airport-stop-coordinate-reconciliation.json').stops.map(s=>[s.sourceStopId,s]));");
replace("r.regionId==='seoul'&&!published.has(r.id)","r.regionId==='seoul'&&r.operatorNamesKo?.some(o=>/리무진|도심공항/.test(o))&&!published.has(r.id)");
replace("fresh:file===fresh,sha256:","file:path.relative(root,file).replaceAll('\\\\','/'),fresh:file===fresh,sha256:");
replace("stopSource.rows.slice().sort((a,b)=>a.stationOrd-b.stationOrd)","stopSource.rows.slice().sort((a,b)=>a.stationOrd-b.stationOrd).map(s=>coordinateRows.has(String(s.stnId))?{...s,originalCoordinates:[Number(s.posY),Number(s.posX)],posY:coordinateRows.get(String(s.stnId)).latitude,posX:coordinateRows.get(String(s.stnId)).longitude,coordinateEvidence:coordinateRows.get(String(s.stnId))}:s)");
replace('bindStopsToShape(shape,stops)',"bindStopsToShape(shape,stops,{maximumInitialDistanceKm:Infinity,maximumLegDistanceKm:Infinity})");
replace('sourceName:s.stnName,latitude:', 'sourceName:s.stnName,...(s.coordinateEvidence?{originalCoordinates:s.originalCoordinates,coordinateEvidence:s.coordinateEvidence}:{}),latitude:');
replace("line:{ko:'서울 '+ko(candidate.routeNumber)+'번'}", "line:{ko:'서울 공항버스 '+candidate.routeNumber.toUpperCase()+'번'}");
replace('routeNumber:ko(candidate.routeNumber)', 'routeNumber:candidate.routeNumber.toUpperCase(),originalRouteNumber:candidate.routeNumber.toUpperCase(),airportServiceKind:\'airport_limousine\'');
replace("geometryEvidence:{kind:'collinear-source-edge-stop-projection',", "geometryEvidence:{kind:'collinear-source-edge-stop-projection',geometrySourceFile:source.file,stopsSourceFile:stopSource.file,skippedNonBoardingSequence:true,");
replace("sourceRefs:[...candidate.sourceRefs,", "sourceRefs:[...candidate.sourceRefs,{url:'https://www.airport.kr/ap_ko/976/subview.do',sourceDate:'2026-11-05',license:'인천국제공항공사 공개 노선 사실 정보; 제공기관 이용조건'},{url:'https://www.gbis.go.kr/service/busInfo/airpGimpoBus.action?cmd=airpGimpo',sourceDate:'2026-11-05',license:'경기도 공개 노선 사실 정보; 제공기관 이용조건'},");
for(const suffix of ['batch','queue','report'])replace("write('bus-recovered-"+suffix+".json'", "write('airport-seoul-"+suffix+".json'");
const child=new Module(filename,module);child.filename=filename;child.paths=module.paths;child._compile(source,filename);
