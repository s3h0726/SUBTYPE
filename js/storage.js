const PREFIX='trt:';
const CUSTOM_ROUTES_KEY='tokyoRailTyping.customRoutes.v1';
const memoryStore=new Map();
const DEFAULT_SETTINGS={display:'ja',input:'ko',sound:false,reducedMotion:false,theme:'dark',stationAdvance:'auto',mapMode:'geographic',stationLabel:'ja',mapLabels:'normal',motion:true};
function storageAvailable(){try{const k='__trt_test__';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch{return false}}
const hasLocalStorage=storageAvailable();
function rawGet(key){try{return hasLocalStorage?localStorage.getItem(key):(memoryStore.has(key)?memoryStore.get(key):null)}catch{return memoryStore.has(key)?memoryStore.get(key):null}}
function rawSet(key,value){try{if(hasLocalStorage)localStorage.setItem(key,value);else memoryStore.set(key,value);return true}catch{try{memoryStore.set(key,value);return true}catch{return false}}}
function read(key,fallback){try{const value=rawGet(PREFIX+key);return value===null?fallback:JSON.parse(value)}catch{return fallback}}
function write(key,value){try{return rawSet(PREFIX+key,JSON.stringify(value))}catch{return false}}
function loadCustomRoutes(){try{const raw=rawGet(CUSTOM_ROUTES_KEY);if(raw!==null){const value=JSON.parse(raw);return Array.isArray(value)?value:[]}const legacy=read('customRoutes',[]);if(legacy.length)rawSet(CUSTOM_ROUTES_KEY,JSON.stringify(legacy));return legacy}catch(error){console.warn('Custom routes could not be loaded:',error);return[]}}
function saveCustomRoutes(routes){try{return rawSet(CUSTOM_ROUTES_KEY,JSON.stringify(routes))}catch(error){console.warn('Custom routes could not be saved:',error);return false}}
export const storage={
  persistent:hasLocalStorage,
  settings:()=>({...DEFAULT_SETTINGS,...read('settings',{})}),
  saveSettings:value=>write('settings',value),
  favorites:()=>read('favorites',[]),
  toggleFavorite(id){const set=new Set(this.favorites());set.has(id)?set.delete(id):set.add(id);write('favorites',[...set]);return set.has(id)},
  routes:()=>loadCustomRoutes(),
  saveRoute(route){const list=this.routes();const i=list.findIndex(r=>r.id===route.id);i<0?list.push(route):list.splice(i,1,route);return saveCustomRoutes(list)},
  deleteRoute(id){return saveCustomRoutes(this.routes().filter(r=>r.id!==id))},
  records:()=>read('records',{}),
  saveResult(result){const records=this.records(),old=records[result.routeId]||{plays:0,bestTime:null,bestAccuracy:0,bestCpm:0,maxCombo:0,totalStations:0};const isRecord=!old.bestTime||result.elapsed<old.bestTime;records[result.routeId]={...old,name:result.routeName,color:result.color,plays:old.plays+1,bestTime:isRecord?result.elapsed:old.bestTime,bestAccuracy:Math.max(old.bestAccuracy,result.accuracy),bestCpm:Math.max(old.bestCpm,result.cpm),maxCombo:Math.max(old.maxCombo,result.maxCombo),totalStations:old.totalStations+result.completed};write('records',records);const recent=read('recent',[]).filter(x=>x.routeId!==result.routeId);recent.unshift({...result,date:Date.now()});write('recent',recent.slice(0,5));return isRecord},
  recent:()=>read('recent',[])
};
