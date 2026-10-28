import{isCountryEnabled}from'./feature-flags.js';
const PREFIX='trt:';
const CUSTOM_ROUTES_KEY='tokyoRailTyping.customRoutes.v1';
const memoryStore=new Map();
let activeAccountId=null;
const ACCOUNT_SCOPES=new Set(['records','research-records','recent','research-recent','favorites']);
const scopedKey=key=>activeAccountId&&ACCOUNT_SCOPES.has(key)?`account:${activeAccountId}:${key}`:key;
const customRoutesKey=()=>activeAccountId?`${PREFIX}account:${activeAccountId}:custom-routes`:CUSTOM_ROUTES_KEY;
const DEFAULT_SETTINGS={display:'ja',input:'ko',sound:false,reducedMotion:false,theme:'dark',stationAdvance:'auto',mapMode:'geographic',stationLabel:'ja',mapLabels:'normal',motion:true};
function storageAvailable(){try{const k='__trt_test__';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch{return false}}
const hasLocalStorage=storageAvailable();
function rawGet(key){try{return hasLocalStorage?localStorage.getItem(key):(memoryStore.has(key)?memoryStore.get(key):null)}catch{return memoryStore.has(key)?memoryStore.get(key):null}}
function rawSet(key,value){try{if(hasLocalStorage)localStorage.setItem(key,value);else memoryStore.set(key,value);return true}catch{try{memoryStore.set(key,value);return true}catch{return false}}}
function read(key,fallback){try{const value=rawGet(PREFIX+scopedKey(key));return value===null?fallback:JSON.parse(value)}catch{return fallback}}
function write(key,value){try{return rawSet(PREFIX+scopedKey(key),JSON.stringify(value))}catch{return false}}
function loadCustomRoutes(){try{const raw=rawGet(customRoutesKey());if(raw!==null){const value=JSON.parse(raw);return Array.isArray(value)?value:[]}const legacy=read('customRoutes',[]);if(legacy.length&&!activeAccountId)rawSet(CUSTOM_ROUTES_KEY,JSON.stringify(legacy));return activeAccountId?[]:legacy}catch(error){console.warn('Custom routes could not be loaded:',error);return[]}}
function saveCustomRoutes(routes){try{return rawSet(customRoutesKey(),JSON.stringify(routes))}catch(error){console.warn('Custom routes could not be saved:',error);return false}}
const mergeRecords=(local={},cloud={})=>{
  const result={...local};
  for(const [id,remote] of Object.entries(cloud&&typeof cloud==='object'&&!Array.isArray(cloud)?cloud:{})){
    const old=result[id];
    if(!old){result[id]=remote;continue}
    result[id]={...old,...remote,plays:Math.max(Number(old.plays)||0,Number(remote.plays)||0),
      totalStations:Math.max(Number(old.totalStations)||0,Number(remote.totalStations)||0),
      bestCpm:Math.max(Number(old.bestCpm)||0,Number(remote.bestCpm)||0),
      bestAccuracy:Math.max(Number(old.bestAccuracy)||0,Number(remote.bestAccuracy)||0),
      maxCombo:Math.max(Number(old.maxCombo)||0,Number(remote.maxCombo)||0),
      bestTime:old.bestTime&&remote.bestTime?Math.min(old.bestTime,remote.bestTime):old.bestTime||remote.bestTime||null};
  }
  return result;
};
const mergeRoutes=(local=[],cloud=[])=>[...new Map([...(Array.isArray(cloud)?cloud:[]),...(Array.isArray(local)?local:[])].filter(x=>x&&x.id).map(x=>[x.id,x])).values()];
export const storage={
  persistent:hasLocalStorage,
  activeUser:()=>activeAccountId,
  setAccount(id){activeAccountId=/^[0-9a-f-]{36}$/i.test(String(id||''))?String(id):null},
  cloudSnapshot(){return{records:read('records',{}),custom_routes:loadCustomRoutes()}},
  applyCloudSnapshot(snapshot={}){
    write('records',mergeRecords(read('records',{}),snapshot.records));
    saveCustomRoutes(mergeRoutes(loadCustomRoutes(),snapshot.custom_routes));
  },
  importGuestRecords(){
    if(!activeAccountId)return false;
    const guestRecords=JSON.parse(rawGet(PREFIX+'records')||'{}');
    const guestRoutes=JSON.parse(rawGet(CUSTOM_ROUTES_KEY)||'[]');
    this.applyCloudSnapshot({records:guestRecords,custom_routes:guestRoutes});
    return true;
  },
  settings:()=>({...DEFAULT_SETTINGS,...read('settings',{})}),
  saveSettings:value=>write('settings',value),
  favorites:()=>read('favorites',[]),
  toggleFavorite(id){const set=new Set(this.favorites());set.has(id)?set.delete(id):set.add(id);write('favorites',[...set]);return set.has(id)},
  routes:()=>loadCustomRoutes().filter(route=>isCountryEnabled(route.countryId||'jp')),
  saveRoute(route){const list=loadCustomRoutes();const i=list.findIndex(r=>r.id===route.id);i<0?list.push(route):list.splice(i,1,route);return saveCustomRoutes(list)},
  deleteRoute(id){return saveCustomRoutes(loadCustomRoutes().filter(r=>r.id!==id))},
  records:()=>Object.fromEntries(Object.entries(read('records',{})).filter(([,record])=>isCountryEnabled(record.countryId||'jp'))),
  researchRecords:()=>read('research-records',{}),
  saveResult(result){const research=result.route?.playStatus==='RESEARCH_PLAYABLE'||result.options?.researchPreview===true,recordScope=research?'research-records':'records',recentScope=research?'research-recent':'recent';const records=read(recordScope,{}),journeyId=result.serviceJourneyId||result.options?.serviceJourneyId||null,baseLineId=result.options?.serviceJourney?.baseRouteId||result.route?.serviceJourney?.baseRouteId||result.route?.id||result.routeId,recordKey=journeyId||result.routeId,prior=records[recordKey]||{plays:0,bestTime:null,bestAccuracy:0,bestCpm:0,maxCombo:0,totalStations:0},{name:discardedName,...old}=prior,isRecord=!old.bestTime||result.elapsed<old.bestTime,countryId=result.route?.countryId||old.countryId||'jp',directionId=result.directionId||result.route?.selectedDirectionId||result.options?.directionId||result.options?.direction||old.directionId||'forward',serviceContext={serviceJourneyId:journeyId,servicePatternId:result.servicePatternId||old.servicePatternId||null,trainTypeId:result.trainTypeId||old.trainTypeId||null,originStationId:result.originStationId||result.options?.serviceJourney?.originStationId||old.originStationId||null,destinationStationId:result.destinationStationId||old.destinationStationId||null,...(countryId==='kr'&&journeyId?{originName:result.options?.serviceJourney?.originNames?.ko||result.route?.stations?.[0]?.ko||old.originName||'',destinationName:result.options?.serviceJourney?.destinationNames?.ko||result.route?.stations?.at(-1)?.ko||old.destinationName||''}:{}),throughServiceId:result.throughServiceId||old.throughServiceId||null};records[recordKey]={...old,...serviceContext,lineId:baseLineId,operatorId:result.route?.operatorId||old.operatorId||'',countryId,directionId,color:result.color,plays:old.plays+1,bestTime:isRecord?result.elapsed:old.bestTime,bestAccuracy:Math.max(old.bestAccuracy,result.accuracy),bestCpm:Math.max(old.bestCpm,result.cpm),maxCombo:Math.max(old.maxCombo,result.maxCombo),totalStations:old.totalStations+result.completed};write(recordScope,records);const recent=read(recentScope,[]).filter(x=>(x.serviceJourneyId||x.routeId)!==recordKey);recent.unshift({routeId:baseLineId,lineId:baseLineId,operatorId:result.route?.operatorId||'',countryId,directionId,...serviceContext,color:result.color,elapsed:result.elapsed,accuracy:result.accuracy,date:Date.now()});write(recentScope,recent.slice(0,5));return isRecord},
  recent:()=>read('recent',[]).filter(record=>isCountryEnabled(record.countryId||'jp'))
};
