'use strict';
// Runs against the real Game, FreeDrive and Leaflet objects in the local QA
// server. Does not grant approval to the candidate route used for motion QA.
module.exports=async function interactive(page){
 const motion=await page.evaluate(async()=>{
  const q=globalThis.__KR_BROWSER_QA__,g=q.game,route=(await(await fetch('/__qa-candidates.json')).json())[0];
  q.go('game');if(!g.start(route,{motion:true,sound:false}))throw Error('MOTION_START');
  const settle=()=>q.renderGameMap(g.mapRoute,g.index,g.mapOptions());await settle();
  const type=()=>{const input=document.querySelector('#typing-input');input.value=q.buildTypingModel(g.targetStation().ko).inputText;input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText'}))};
  type();await Promise.resolve();await settle();
  if(g.boarding)throw Error('BOARDING_NOT_FINISHED');
  const rail=q.mapState(),path=rail.points.slice(rail.stationOffsets[0],rail.stationOffsets[1]+1),frames=[];
  const original=rail.train.setLatLng;rail.train.setLatLng=function(p){frames.push([p[0]??p.lat,p[1]??p.lng]);return original.call(this,p)};
  type();if(g.index!==0||g.phase!=='ARRIVING')throw Error('ADVANCED_BEFORE_ARRIVAL');
  const deadline=performance.now()+6000;while(g.index===0&&performance.now()<deadline)await new Promise(r=>setTimeout(r,16));
  rail.train.setLatLng=original;if(g.index!==1)throw Error('ARRIVAL_TIMEOUT');
  const onTrack=p=>path.some((b,i)=>{if(!i)return false;const a=path[i-1],x=b[0]-a[0],y=b[1]-a[1],den=x*x+y*y,t=den?((p[0]-a[0])*x+(p[1]-a[1])*y)/den:0;return t>=-1e-6&&t<=1+1e-6&&Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y)<1e-8});
  if(frames.length<2||frames.some(p=>!onTrack(p)))throw Error('MARKER_LEFT_RETAINED_POLYLINE');
  // Restart during a partial animation: an old completion must not advance the
  // next session, and the map must contain one train on its new route only.
  const input=document.querySelector('#typing-input');input.value=q.buildTypingModel(g.targetStation().ko).inputText.slice(0,1);input.dispatchEvent(new InputEvent('input',{bubbles:true}));
  g.start(route,{motion:true,sound:false});await settle();await new Promise(r=>setTimeout(r,150));
  if(!g.boarding||g.index!==0||q.mapState().trainLayer.getLayers().length!==1)throw Error('STALE_ANIMATION_AFTER_RESTART');
  g.stop(false);return{serviceId:route.id,frames:frames.length,retainedVertices:path.length,status:'PASS'};
 });
 if(process.env.KR_BROWSER_SCREENSHOTS)await page.waitForFunction(()=>!document.querySelector('#toast')?.classList.contains('show'));
 if(process.env.KR_BROWSER_SCREENSHOTS)await page.screenshot({path:require('node:path').join(process.env.KR_BROWSER_SCREENSHOTS,(page.viewportSize().width<600?'mobile':'desktop')+'-curved-game.png'),fullPage:true});
 const transfer=await page.evaluate(async()=>{
  const q=globalThis.__KR_BROWSER_QA__,f=q.freeDrive;
  // The app already loads the actual Japanese network here. Select a genuine
  // multi-line transfer node; synthetic transfer fixtures are unit-tested.
  const node=[...f.graph.values()].find(n=>n.routeIds.size>=3),ids=node&&[...node.routeIds];
  if(!node)throw Error('NO_REAL_THREE_LINE_TRANSFER');
  const route=f.routes.find(r=>r.id===ids[0]),index=route.stations.findIndex(s=>s.id===node.station.id||s.ko===node.station.ko);
  if(index<0)throw Error('TRANSFER_STATION_NOT_FOUND');
  f.start(route,index);q.game.startFreeDrive(f.snapshot());q.renderGameFreeDriveOptions(f.snapshot());q.go('game');
  return{station:node.station.ko,ids,key:f.currentKey,history:f.history.length};
 });
 for(let i=1;i<=transfer.ids.length;i++){
  await page.keyboard.press('Tab');
  await page.waitForFunction(()=>{const q=globalThis.__KR_BROWSER_QA__;return q.mapState()?.routeId===q.freeDrive.currentRouteId});
  const state=await page.evaluate(()=>{const q=globalThis.__KR_BROWSER_QA__,s=q.freeDrive.snapshot();return{id:s.routeId,key:q.freeDrive.currentKey,history:q.freeDrive.history.length,gameRoute:q.game.route.id,mapRoute:q.mapState().routeId,trains:q.mapState().trainLayer.getLayers().length,origin:document.querySelector('#service-origin-ko').textContent}});
  if(state.id!==transfer.ids[i%transfer.ids.length]||state.key!==transfer.key||state.history!==transfer.history||state.id!==state.gameRoute||state.id!==state.mapRoute||state.trains!==1||state.origin!==transfer.station)throw Error('TAB_TRANSFER_STATE:'+JSON.stringify(state));
 }
 // At a non-transfer station TAB is a no-op.
 const noTransfer=await page.evaluate(()=>{const q=globalThis.__KR_BROWSER_QA__,f=q.freeDrive,n=[...f.graph.values()].find(n=>n.routeIds.size===1&&n.edges.length);const r=f.routes.find(r=>r.id===[...n.routeIds][0]);f.start(r,r.stations.findIndex(s=>s.id===n.station.id));q.game.startFreeDrive(f.snapshot());q.renderGameFreeDriveOptions(f.snapshot());return{id:f.currentRouteId,key:f.currentKey}});
 await page.keyboard.press('Tab');
 const unchanged=await page.evaluate(()=>{const f=globalThis.__KR_BROWSER_QA__.freeDrive;return{id:f.currentRouteId,key:f.currentKey}});
 if(JSON.stringify(unchanged)!==JSON.stringify(noTransfer))throw Error('TAB_WITHOUT_TRANSFER_MOVED');
 return{motion,transfer:{station:transfer.station,routeIds:transfer.ids,status:'PASS'},nonTransfer:'PASS',scope:'Candidate true-curve motion and actual Japanese multi-line TAB UI; Korean transfer metadata still requires individual review'};
};
