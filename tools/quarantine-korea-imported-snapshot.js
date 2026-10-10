#!/usr/bin/env node
'use strict';

// One-time safety migration for the provisional Korean snapshot. It preserves
// candidate geometry in Git, but prevents runtime promotion until every
// station-to-station segment has explicit source and topology verification.
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const indexPath=path.join(root,'data/kr/generated/index.json');
const index=JSON.parse(fs.readFileSync(indexPath,'utf8'));
const quarantined=[];
let stationEntries=0;
const passengerIdentity=meta=>{
  if(/^kr-hangang-(west|east)$/.test(meta.id))return{id:'kr-passenger-hangang-bus',name:'한강버스'};
  if(meta.id==='kr-gtx-a-north'||meta.id==='kr-metro-24')return{id:'kr-passenger-gtx-a',name:'수도권 광역급행철도 A노선'};
  const metro=/^kr-metro-(\d+)(?:-section-\d+)?$/.exec(meta.id);
  if(metro)return{id:`kr-passenger-metro-${metro[1]}`,name:String(meta.names?.ko||meta.id).replace(/\s*\([^)]*[~～][^)]*\)\s*$/,'').trim()};
  return{id:`kr-passenger-${meta.id.replace(/^kr-/,'')}`,name:String(meta.names?.ko||meta.id).replace(/\s*\([^)]*[~～][^)]*\)\s*$/,'').trim()};
};

for(const meta of index.routes||[]){
  const detailPath=path.join(root,meta.lazySource);
  const payload=JSON.parse(fs.readFileSync(detailPath,'utf8'));
  const route=payload.route;
  const primary=route.directions?.[0]?.stops||route.stations||[];
  stationEntries+=primary.length;

  // Runtime metadata must be identical to the persisted detail payload. The
  // old browser-only operator bridge is not a valid source of record.
  for(const key of ['operatorId','operator','operators','operatorIds']){
    if(meta[key]!==undefined)route[key]=meta[key];
  }

  const directions=route.directions||[];
  const ready=directions.length>0&&directions.every(direction=>
    direction.geometryStatus==='ready'&&
    Array.isArray(direction.directedSegments)&&
    direction.directedSegments.length===Math.max(0,(direction.stops||[]).length-1)&&
    direction.directedSegments.every(segment=>segment.geometryStatus==='ready')
  );
  const hasCandidateGeometry=directions.some(direction=>(direction.geometry||[]).length||(direction.directedSegments||[]).length);

  if(!ready){
    meta.geometryReady=false;
    route.geometryReady=false;
    meta.geometryStatus=hasCandidateGeometry?'quarantined':'missing';
    route.geometryStatus=meta.geometryStatus;
    if(hasCandidateGeometry){
      quarantined.push(meta.id);
      for(const direction of directions){
        if((direction.geometry||[]).length||(direction.directedSegments||[]).length){
          direction.geometryStatus='quarantined';
          direction.geometryValidation={status:'pending-manual-topology-review'};
        }
      }
    }
  }

  const releaseStatus=ready?'geometry-verified-game-pending':hasCandidateGeometry?'quarantined-geometry':'data-review';
  const passenger=passengerIdentity(meta);
  const operatingPatternId=meta.id;
  Object.assign(meta,{passengerLineId:passenger.id,passengerLineName:passenger.name,operatingPatternId,serviceValidationStatus:'unverified',releaseStatus,gameValidationStatus:'not-run',sourceLicenseStatus:meta.sourceLicenseStatus||'unverified'});
  Object.assign(route,{passengerLineId:passenger.id,passengerLineName:passenger.name,operatingPatternId,serviceValidationStatus:'unverified',releaseStatus,gameValidationStatus:'not-run',sourceLicenseStatus:route.sourceLicenseStatus||meta.sourceLicenseStatus});
  if(meta.dataKind==='trainService'||route.dataKind==='trainService'){
    meta.playable=false;
    meta.visibility='internal';
    route.playable=false;
    route.visibility='internal';
  }
  fs.writeFileSync(detailPath,JSON.stringify(payload)+'\n');
}

index.counts.stops=stationEntries;
index.rebuildStatus='in-progress';
index.gameValidationStatus='not-run';
index.quarantinedGeometryRoutes=quarantined;
fs.writeFileSync(indexPath,JSON.stringify(index)+'\n');
console.log(JSON.stringify({status:'PASS',routes:index.routes.length,stationEntries,quarantinedGeometryRoutes:quarantined},null,2));
