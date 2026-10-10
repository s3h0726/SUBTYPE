#!/usr/bin/env node
'use strict';
/* Construct station-to-station geometry only from existing OSM physical ways.
   This is a data QA tool, not proof of operational topology or browser validation. */
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const lines={1:'line_1',2:'line_2',3:'line_3',4:'line_4',5:'line_5',6:'line_6',7:'line_7',8:'line_8',9:'line_9',10:'incheon_line_1',11:'incheon_line_2',12:'gyeonggang_line',13:'gyeongui_jungang_line',14:'gyeongchun_line',15:'airport_line',16:'seohae_line',17:'suin_bundang_line',18:'shinbundang_line',19:'sillim_line',20:'ui_sinseol_light_rail_line',21:'gimpo_line',22:'everline',23:'uijeongbu_light_rail_line'};
const tracks={};
for(let n=1;n<=3;n++){const input=fs.readFileSync(path.join(root,'js/kr-tracks-'+n+'.js'),'utf8'),match=input.match(/Object\.assign\(window\.TRT_KOREA_TRACK_GEOMETRY\|\|\{\}, (\{[\s\S]*\})\);/);if(!match)throw Error('Could not parse OSM track asset '+n);Object.assign(tracks,JSON.parse(match[1]))}
const indexFile=path.join(root,'data/kr/generated/index.json'),index=JSON.parse(fs.readFileSync(indexFile,'utf8'));
const distance=(a,b)=>{const lat=(a[0]+b[0])/2*Math.PI/180;return Math.hypot((a[0]-b[0])*111195,(a[1]-b[1])*111195*Math.cos(lat))};
const report=[];
for(const meta of index.routes.filter(x=>/^kr-metro-\d+(?:-section-\d+)?$/.test(x.id))){
 const number=Number(meta.id.match(/^kr-metro-(\d+)/)[1]),key=lines[number],file=path.join(root,'data/kr/generated/routes',meta.id+'.json');
 const row={id:meta.id,track:key||null,status:'unverified',segments:0,reason:''};report.push(row);
 if(!key||!fs.existsSync(file)||!Array.isArray(tracks[key])){row.reason='no_matching_osm_asset';continue}
 const doc=JSON.parse(fs.readFileSync(file,'utf8')),route=doc.route,st=route.stations||[];
 if(st.length<2||st.some(s=>!Number.isFinite(s.latitude)||!Number.isFinite(s.longitude))){row.reason='missing_station_coordinates';continue}
 const candidates=[];
 for(const raw of tracks[key]){
   if(raw.length<st.length||raw.length<3)continue;
   for(const reverse of [false,true]){
     const coords=(reverse?[...raw].reverse():raw).map(p=>[p[1],p[0]]);
     const snaps=st.map(s=>{let best={index:-1,distance:Infinity};coords.forEach((p,i)=>{let d=distance(p,[s.latitude,s.longitude]);if(d<best.distance)best={index:i,distance:d}});return best});
     const maxOffset=Math.max(...snaps.map(x=>x.distance));
     if(maxOffset>120||snaps.some((s,i)=>i&&s.index<=snaps[i-1].index))continue;
     const segs=[];let bad=false;
     for(let i=0;i<snaps.length-1;i++){
       const curve=coords.slice(snaps[i].index,snaps[i+1].index+1);
       const gap=Math.max(...curve.slice(1).map((p,k)=>distance(p,curve[k])));
       const length=curve.slice(1).reduce((v,p,k)=>v+distance(p,curve[k]),0);
       const direct=distance([st[i].latitude,st[i].longitude],[st[i+1].latitude,st[i+1].longitude]);
       if(curve.length<2||gap>900||length>Math.max(2000,2.5*direct)){bad=true;break}
       segs.push({fromStationId:st[i].id,toStationId:st[i+1].id,geometry:curve,geometryStatus:'osm-candidate'});
     }
     if(!bad)candidates.push({segs,mean:snaps.reduce((v,x)=>v+x.distance,0)/snaps.length,max:maxOffset});
   }
 }
 candidates.sort((a,b)=>a.mean-b.mean);
 if(!candidates.length){row.reason='no_contiguous_monotonic_osm_way_within_120m';continue}
 const picked=candidates[0];row.status='candidate_needs_topology_review';row.segments=picked.segs.length;row.maxStationOffsetMeters=Math.round(picked.max);
 if(process.argv.includes('--write-candidates')){
   route.osmCandidateSegments=picked.segs;
   route.osmCandidateSource={license:'ODbL',attribution:'© OpenStreetMap contributors',via:'jebowe3/seoul_transportation',asset:key};
   // Deliberately DO NOT change geometryReady/status; human topology and browser QA are required.
   fs.writeFileSync(file,JSON.stringify(doc));
 }
}
const output=path.join(root,'data/kr/metro-osm-coverage-report.json');if(process.argv.includes('--write-candidates'))fs.writeFileSync(output,JSON.stringify({method:'same continuous OSM way, monotonic stop order, maximum 120m offset, no straight-line insertion',routes:report},null,2)+'\n');
console.log(JSON.stringify({total:report.length,candidates:report.filter(x=>x.segments).length,report},null,2));
