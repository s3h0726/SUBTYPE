import{hongKongRouteBlockReason,hongKongTransferAllowed}from'./hong-kong-policy.js';
const KR_CONFIRMED_TRANSFERS=[{"region":"capital","name":"시청","routeIds":["kr-metro-1-main","kr-metro-1-section-2","kr-metro-2"],"source":"https://ms.smc.seoul.kr/attach/record/SEOUL/appendix/a11/A0066691.pdf?time=20260525101106"},{"region":"busan","name":"서면","routeIds":["kr-regional-busan-1","kr-regional-busan-2"],"source":"https://work.humetro.busan.kr/homepage/history/page/subLocation.do?menu_no=1002020202"},{"region":"daegu","name":"반월당","routeIds":["kr-regional-daegu-7","kr-regional-daegu-8"],"source":"https://daegu.grandculture.net/daegu/junggu/toc/GC40000506"}];
// recommit-trigger: free-drive-move-fix-20261007
import{koreanRouteBlockReason}from'./korean-access-policy.js';
import{$,escapeHtml,normalize,koreanStationDisplayName,koreanRouteDisplayText}from'./utils.js';

const finite=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n));
const coords=s=>finite(s?.latitude)&&finite(s?.longitude)?[Number(s.latitude),Number(s.longitude)]:null;
// JR Keiyo Line Maihama ⇄ Resort Gateway is an officially signposted
// walking transfer despite the stations having different Japanese names.
// Preserve each railway's independent coordinates via coordsByRoute.
// Officially designated transfers may use distinct station names/IDs.
// Names are never rewritten to form a transfer: only the free-drive graph key
// is shared. Geography is an additional safeguard, not transfer evidence.
const JP_NAMED_TRANSFER_GROUPS=[
  {
    "id": "akasaka-nagatacho",
    "names": [
      "赤坂見附",
      "永田町"
    ],
    "center": [
      35.6778,
      139.7389
    ],
    "radiusKm": 0.72,
    "source": "https://www.tokyometro.jp/station/akasaka-mitsuke/index.html",
    "region": "kanto"
  },
  {
    "id": "kokkai-tameike",
    "names": [
      "国会議事堂前",
      "溜池山王"
    ],
    "center": [
      35.674,
      139.743
    ],
    "radiusKm": 0.72,
    "source": "https://www.tokyometro.jp/station/kokkai-gijidomae/index.html",
    "region": "kanto"
  },
  {
    "id": "awajicho-ogawamachi",
    "names": [
      "淡路町",
      "新御茶ノ水",
      "小川町"
    ],
    "center": [
      35.696,
      139.7664
    ],
    "radiusKm": 0.65,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html",
    "region": "kanto"
  },
  {
    "id": "hibiya-yurakucho",
    "names": [
      "日比谷",
      "有楽町"
    ],
    "center": [
      35.6756,
      139.7613
    ],
    "radiusKm": 0.72,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html",
    "region": "kanto"
  },
  {
    "id": "ueno-okachimachi",
    "names": [
      "上野広小路",
      "仲御徒町",
      "上野御徒町"
    ],
    "center": [
      35.7075,
      139.7743
    ],
    "radiusKm": 0.55,
    "source": "https://www.tokyometro.jp/station/ueno-hirokoji/index.html",
    "region": "kanto"
  },
  {
    "id": "ningyocho-suitengumae",
    "names": [
      "人形町",
      "水天宮前"
    ],
    "center": [
      35.6842,
      139.784
    ],
    "radiusKm": 0.55,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html",
    "region": "kanto"
  },
  {
    "id": "tsukiji-shintomicho",
    "names": [
      "築地",
      "新富町"
    ],
    "center": [
      35.6693,
      139.7737
    ],
    "radiusKm": 0.55,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html",
    "region": "kanto"
  },
  {
    "id": "toranomon-hills",
    "names": [
      "虎ノ門",
      "虎ノ門ヒルズ"
    ],
    "center": [
      35.6691,
      139.7489
    ],
    "radiusKm": 0.55,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html",
    "region": "kanto"
  },
  {
    "id": "ginza-itchome",
    "names": [
      "銀座",
      "銀座一丁目"
    ],
    "center": [
      35.673,
      139.765
    ],
    "radiusKm": 0.75,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html",
    "region": "kanto"
  },
  {
    "id": "korakuen-kasuga",
    "names": [
      "後楽園",
      "春日"
    ],
    "center": [
      35.7085,
      139.752
    ],
    "radiusKm": 0.62,
    "source": "https://www.tokyometro.jp/station/line_marunouchi/index.html",
    "region": "kanto"
  },
  {
    "id": "akihabara-iwamotocho",
    "names": [
      "秋葉原",
      "岩本町"
    ],
    "center": [
      35.697,
      139.774
    ],
    "radiusKm": 0.7,
    "source": "https://www.tokyometro.jp/support/guide/operation/pdf/information_20250401.pdf",
    "region": "kanto"
  },
  {
    "id": "shinjuku-shinsen",
    "names": [
      "新宿",
      "新線新宿"
    ],
    "center": [
      35.6898,
      139.701
    ],
    "radiusKm": 0.75,
    "source": "https://www.tokyometro.jp/support/guide/operation/pdf/information_20250401.pdf",
    "region": "kanto"
  },
  {
    "id": "ueno-keisei-ueno",
    "names": [
      "上野",
      "京成上野"
    ],
    "center": [
      35.7116,
      139.7742
    ],
    "radiusKm": 0.5,
    "source": "https://www.tokyometro.jp/station/line_ginza/index.html",
    "region": "kanto"
  },
  {
    "id": "osaka-umeda",
    "names": [
      "大阪",
      "梅田",
      "東梅田",
      "西梅田",
      "大阪梅田"
    ],
    "center": [
      34.7021,
      135.4976
    ],
    "radiusKm": 0.9,
    "source": "https://subway.osakametro.co.jp/station_guide/index.php",
    "region": "kansai"
  },
  {
    "id": "osaka-namba",
    "names": [
      "なんば",
      "大阪難波",
      "難波",
      "JR難波"
    ],
    "center": [
      34.6659,
      135.4998
    ],
    "radiusKm": 0.85,
    "source": "https://subway.osakametro.co.jp/station_guide/M/m20/",
    "region": "kansai"
  },
  {
    "id": "sapporo-jr-subway",
    "region": "hokkaido",
    "names": [
      "札幌",
      "さっぽろ"
    ],
    "center": [
      43.0672,
      141.3523
    ],
    "radiusKm": 0.6,
    "source": "https://www.city.sapporo.jp/st/passageway.html"
  },
  {
    "id": "sapporo-odori-tram",
    "region": "hokkaido",
    "names": [
      "大通",
      "西４丁目"
    ],
    "center": [
      43.0594,
      141.3525
    ],
    "radiusKm": 0.45,
    "source": "https://www.city.sapporo.jp/st/josyaken/ryokin/ryoukin.html"
  },
  {
    "id": "sendai-subway-jr",
    "region": "tohoku",
    "names": [
      "仙台",
      "あおば通"
    ],
    "center": [
      38.2603,
      140.881
    ],
    "radiusKm": 0.6,
    "disabledNamedJoin": true,
    "source": "https://www.city.sendai.jp/kokyo/kurashi/machi/kotsu/annai/noritsugi.html"
  },
  {
    "id": "nagoya-jr-meitetsu-kintetsu",
    "region": "chubu",
    "names": [
      "名古屋",
      "名鉄名古屋",
      "近鉄名古屋"
    ],
    "center": [
      35.1698,
      136.8837
    ],
    "radiusKm": 0.65,
    "source": "https://www.kintetsu.co.jp/foreign/english/about/station/yard/nagoya.html"
  },
  {
    "id": "toyama-jr-dentetsu",
    "region": "chubu",
    "names": [
      "富山",
      "電鉄富山",
      "富山駅"
    ],
    "center": [
      36.7007,
      137.214
    ],
    "radiusKm": 0.65,
    "source": "https://www.chitetsu.co.jp/?page_id=18873"
  },
  {
    "id": "kyoto-shijo-karasuma",
    "region": "kansai",
    "names": [
      "四条",
      "烏丸"
    ],
    "center": [
      35.003,
      135.75965
    ],
    "radiusKm": 0.45,
    "source": "https://www.hankyu.co.jp/en/station/transit/kyoto.html"
  },
  {
    "id": "osaka-minamikata",
    "region": "kansai",
    "names": [
      "南方",
      "西中島南方"
    ],
    "center": [
      34.7265,
      135.4991
    ],
    "radiusKm": 0.42,
    "source": "https://www.hankyu.co.jp/en/station/transit/index.html"
  },
  {
    "id": "kobe-sannomiya",
    "region": "kansai",
    "names": [
      "三ノ宮",
      "三宮",
      "神戸三宮",
      "三宮・花時計前"
    ],
    "center": [
      34.693,
      135.194
    ],
    "radiusKm": 0.65,
    "source": "https://www.hankyu.co.jp/en/station/transit/kobe.html"
  },
  {
    "id": "hiroshima-jr-tram",
    "region": "chugoku",
    "names": [
      "広島",
      "広島駅"
    ],
    "center": [
      34.3967,
      132.475
    ],
    "radiusKm": 0.5,
    "source": "https://www.hiroden.co.jp/train/route-guide/stop-guide/m01.html"
  },
  {
    "id": "takamatsu-jr-kotoden",
    "region": "shikoku",
    "names": [
      "高松",
      "高松築港"
    ],
    "center": [
      34.351,
      134.0478
    ],
    "radiusKm": 0.55,
    "source": "https://www.kotoden.co.jp/publichtm/bus/rosen/aeon/index.html"
  },
  {
    "id": "fukuoka-tenjin-walk",
    "region": "kyushu",
    "names": [
      "天神",
      "天神南",
      "西鉄福岡（天神）"
    ],
    "center": [
      33.5898,
      130.4001
    ],
    "radiusKm": 0.7,
    "kind": "walking",
    "fareIntegrated": false,
    "source": "https://subway.city.fukuoka.lg.jp/utility/qa.php"
  },
  {
    "id": "kumamoto-jr-city-tram",
    "region": "kyushu",
    "names": [
      "熊本",
      "熊本駅前"
    ],
    "center": [
      32.7906,
      130.6908
    ],
    "radiusKm": 0.45,
    "source": "https://www.kumamotodentetsu.co.jp/train/station/01.html"
  },
  {
    "id": "kamikumamoto-jr-tram",
    "region": "kyushu",
    "names": [
      "上熊本",
      "上熊本駅前"
    ],
    "center": [
      32.818,
      130.6994
    ],
    "radiusKm": 0.42,
    "source": "https://www.kumamotodentetsu.co.jp/train/station/01.html"
  },
  {
    "id": "nagasaki-jr-tram",
    "region": "kyushu",
    "names": [
      "長崎",
      "長崎駅前"
    ],
    "center": [
      32.7524,
      129.8718
    ],
    "radiusKm": 0.46,
    "source": "https://www.naga-den.com/"
  },
  {
    "id": "kanazawa-hokutetsu",
    "region": "chubu",
    "names": [
      "金沢",
      "北鉄金沢"
    ],
    "center": [
      36.57845,
      136.64885
    ],
    "radiusKm": 0.5,
    "source": "https://www.hokutetsu.co.jp/railway/asanogawasen"
  },
  {
    "id": "hakodate-jr-tram",
    "region": "hokkaido",
    "names": [
      "函館",
      "函館駅前"
    ],
    "center": [
      41.7732,
      140.7273
    ],
    "radiusKm": 0.48,
    "source": "https://www.city.hakodate.hokkaido.jp/docs/2014012100939/"
  },
  {
    "id": "okayama-jr-tram",
    "region": "chugoku",
    "names": [
      "岡山",
      "岡山駅前"
    ],
    "center": [
      34.6655,
      133.9187
    ],
    "radiusKm": 0.38,
    "source": "https://okayama-kido.co.jp/tram/tram-status-info/post-2575/"
  },
  {
    "id": "himeji-jr-sanyo",
    "region": "kansai",
    "names": [
      "姫路",
      "山陽姫路"
    ],
    "center": [
      34.8279,
      134.6888
    ],
    "radiusKm": 0.52,
    "source": "https://www.sanyo-railway.co.jp/railway/station/himeji.html"
  }
];
export function japaneseNamedTransferNamesForRoute(route){
  if(route?.countryId!=='jp')return [];
  const all=new Set;
  for(const group of JP_NAMED_TRANSFER_GROUPS){
    if(!(route.stations||[]).some(stop=>{
      const point=coords(stop);
      return group.names.includes(stop.ja)&&point&&jpTransferDistanceKm(point,group.center)<=group.radiusKm;
    }))continue;
    for(const name of group.names)all.add(name);
  }
  return [...all];
}
const jpTransferDistanceKm=(a,b)=>Math.hypot((a[0]-b[0])*111.195,
  (a[1]-b[1])*111.195*Math.cos(b[0]*Math.PI/180));
function assignJapanNamedTransfers(routes){
  const present=(routes||[]).filter(route=>route.countryId==='jp');
  for(const route of present)for(const stop of route.stations||[])delete stop.jpNamedTransferKey;
  for(const spec of JP_NAMED_TRANSFER_GROUPS){
    // Some interchanges (JR Sendai ↔ Aoba-dori) also contain successive
    // stations on the same railway: never merge those into one game stop.
    if(spec.disabledNamedJoin)continue;
    const accepted=[];
    for(const route of present)for(const stop of route.stations||[]){
      const point=coords(stop);
      if(spec.names.includes(stop.ja)&&point&&jpTransferDistanceKm(point,spec.center)<=spec.radiusKm)
        accepted.push({route,stop});
    }
    // A genuine transfer must connect different route IDs and names.
    if(new Set(accepted.map(x=>x.route.id)).size<2||
       new Set(accepted.map(x=>x.stop.ja)).size<2)continue;
    // Duplicate master IDs can occur at different physical stops on one
    // service. Exclude that *route* from this group, not the entire interchange.
    const byRoute=new Map;
    for(const item of accepted)byRoute.set(item.route.id,(byRoute.get(item.route.id)||0)+1);
    const unambiguous=accepted.filter(item=>byRoute.get(item.route.id)===1);
    if(new Set(unambiguous.map(x=>x.route.id)).size<2||
       new Set(unambiguous.map(x=>x.stop.ja)).size<2)continue;
    for(const {stop} of unambiguous)stop.jpNamedTransferKey='jp-named-transfer:'+spec.id;
  }
}

// Across Japan, the same Japanese station name may have independent master
// IDs for each operator. Connect only nearby platforms (<=250 m) and never
// combine different stations of the same line. Keep every route coordinate.
function assignJapanNearbySameNameTransfers(routes){
  const names=new Map;
  for(const route of routes||[])if(route.countryId==='jp')for(const stop of route.stations||[]){
    delete stop.jpNearbySameNameKey;
    const point=coords(stop),name=String(stop.ja||'');
    if(!point||!name)continue;
    if(!names.has(name))names.set(name,[]);
    names.get(name).push({routeId:route.id,stop,point});
  }
  for(const [name,stops] of names){
    if(stops.length<2||stops.length>100)continue;
    // A complete-linkage cluster prevents a chain of close but separate
    // nearby stations from accidentally becoming a single interchange.
    for(const seed of stops){
      if(seed.stop.jpNearbySameNameKey)continue;
      const cluster=[seed];
      for(const item of stops){
        if(item===seed||item.stop.jpNearbySameNameKey||
          cluster.some(member=>member.routeId===item.routeId))continue;
        if(cluster.every(member=>jpTransferDistanceKm(member.point,item.point)<=0.25))
          cluster.push(item);
      }
      if(new Set(cluster.map(item=>item.routeId)).size<2)continue;
      const anchor=cluster[0].point;
      const key='jp-near-name:'+name+':'+anchor.map(n=>n.toFixed(4)).join(':');
      for(const item of cluster)item.stop.jpNearbySameNameKey=key;
    }
  }
}

// Normalize overlapping evidence. A JR station may share a canonical ID
// with one subway but be within 250 m of another line with a different ID.
// A single connected interchange graph avoids splitting those transfers.
function assignJapanInterchangeComponents(routes){
  const records=[];
  for(const route of routes||[])if(route.countryId==='jp')
    for(const stop of route.stations||[]){
      delete stop.jpUnifiedTransferKey;
      records.push({routeId:route.id,stop,point:coords(stop)});
    }
  const parent=records.map((_,i)=>i),members=records.map((_,i)=>[i]);
  const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i};
  const union=(a,b)=>{
    a=root(a);b=root(b);if(a===b)return;
    const ra=new Set(members[a].map(i=>records[i].routeId));
    if(members[b].some(i=>ra.has(records[i].routeId)))return;
    // A transitive union must not smuggle a distant third platform into the
    // interchange. Validate every candidate pair, not only component seeds.
    for(const ai of members[a])for(const bi of members[b]){
      const pointA=records[ai].point,pointB=records[bi].point;
      if(pointA&&pointB&&jpTransferDistanceKm(pointA,pointB)>1.35)return;
    }
    parent[b]=a;members[a].push(...members[b]);members[b]=[];
  };
  const evidence=new Map;
  records.forEach((r,i)=>{
    for(const key of [r.stop.jpNamedTransferKey,r.stop.jpSharedStationKey,
      r.stop.jpNearbySameNameKey,r.stop.jpTransferKey]){
      if(!key)continue;
      if(!evidence.has(key))evidence.set(key,[]);
      evidence.get(key).push(i);
    }
  });
  for(const ids of evidence.values()){
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)
      if(records[ids[i]].routeId!==records[ids[j]].routeId)
        union(ids[i],ids[j]);
  }
  for(let i=0;i<records.length;i++){
    if(parent[i]!==i||members[i].length<2)continue;
    const keys=members[i].flatMap(j=>[records[j].stop.jpNamedTransferKey,
      records[j].stop.jpSharedStationKey,records[j].stop.jpNearbySameNameKey])
      .filter(Boolean);
    const chosen=keys.filter(k=>k.startsWith('jp-named-transfer:')).sort()[0]
      ||keys.filter(k=>k.startsWith('jp-station:')).sort()[0]
      ||keys.sort()[0];
    if(!chosen)continue;
    for(const j of members[i])records[j].stop.jpUnifiedTransferKey=chosen;
  }
}

const JP_MAIHAMA_RESORT_TRANSFER='jp-transfer:maihama-resort-gateway';
const jpDisneyTransferKey=(station,route)=>{
  const allowed=route?.id==='line-11326'&&station?.ja==='舞浜'||
                route?.id==='jp-disney-resort-line'&&station?.ja==='リゾートゲートウェイ・ステーション';
  if(!allowed)return null;
  const lat=Number(station.latitude),lon=Number(station.longitude);
  return Number.isFinite(lat)&&Number.isFinite(lon)&&
    Math.abs(lat-35.63524)<0.006&&Math.abs(lon-139.88510)<0.006?
    JP_MAIHAMA_RESORT_TRANSFER:null;
};
const freeDriveStationKey=s=>{
  if(s?.jpUnifiedTransferKey)return s.jpUnifiedTransferKey;
  if(s?.jpTransferKey)return s.jpTransferKey;
  if(s?.jpNamedTransferKey)return s.jpNamedTransferKey;
  if(s?.jpSharedStationKey)return s.jpSharedStationKey;
  if(s?.jpNearbySameNameKey)return s.jpNearbySameNameKey;
  // An unverified stop is unique to its route. Never merge different
  // operators just because their Japanese names share a 200 m grid cell.
  if(s?.jpIsolatedStopKey)return s.jpIsolatedStopKey;
  if(s?.krTransferKey)return s.krTransferKey;
  if(s?.krNoAutoTransfer)return String(s.id);
  const c=coords(s),ja=normalize(s?.ja||s?.names?.ja||s?.ko||'');
  // Transfer stations are often represented by different operator-specific IDs.
  // Prefer a name + ~200m coordinate cell so the same physical station merges across companies.
  if(c&&ja){
    const lat=Math.round(c[0]*500)/500,lon=Math.round(c[1]*500)/500;
    return `place:${ja}:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  }
  return String(s?.stationMasterId||s?.sourceStationId||s?.id||ja);
};
const routeName=r=>koreanRouteDisplayText(r?.line?.ko||r?.line?.ja||r?.line?.en||r?.id||'노선',r);
const stationName=(s,r)=>koreanStationDisplayName(s?.ko||s?.ja||s?.romaji||s?.id||'역',r?.countryId,r);
const routeColor=r=>r?.lineColor||r?.color||'#73837b';
const routeSegments=route=>{
  if(route?.countryId==='kr'||route?.countryId==='hk'){
    if(route.geometryReady!==true)return[];
    return(route.directedSegments||[]).filter(segment=>segment.geometryStatus==='ready').map(segment=>segment.geometry)
  }
  // A line's surveyed polyline belongs to that line, not to a single merged interchange point.
  if(route?.geometryReady===true&&Array.isArray(route.geometry)&&route.geometry.length>1)return[route.geometry];
  return[(route.stations||[]).map(coords).filter(Boolean)]
};

function boundsOfRoutes(routes){
  let minLat=90,maxLat=-90,minLon=180,maxLon=-180,count=0;
  for(const route of routes||[])for(const station of route.stations||[]){
    const c=coords(station);if(!c)continue;
    minLat=Math.min(minLat,c[0]);maxLat=Math.max(maxLat,c[0]);minLon=Math.min(minLon,c[1]);maxLon=Math.max(maxLon,c[1]);count++;
  }
  return count?{minLat,maxLat,minLon,maxLon}:null;
}
function project(c,b,w,h,pad=24){
  const lonSpan=Math.max(.01,b.maxLon-b.minLon),latSpan=Math.max(.01,b.maxLat-b.minLat);
  const scale=Math.min((w-pad*2)/lonSpan,(h-pad*2)/latSpan);
  const usedW=lonSpan*scale,usedH=latSpan*scale;
  return[(w-usedW)/2+(c[1]-b.minLon)*scale,(h-usedH)/2+(b.maxLat-c[0])*scale];
}
export function drawNetworkCanvas(canvas,routes,{bounds=null,alpha=.28,transferNodes=null,currentKey=null,currentRouteId=null}={}){
  if(!canvas)return;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const b=bounds||boundsOfRoutes(routes);if(!b)return;
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const route of routes||[]){
    const segments=routeSegments(route);if(!segments.some(pts=>pts.length>=2))continue;
    ctx.beginPath();
    for(const pts of segments){if(pts.length<2)continue;pts.forEach((c,i)=>{const p=project(c,b,w,h,20);i?ctx.lineTo(...p):ctx.moveTo(...p)})}
    ctx.strokeStyle=routeColor(route);
    ctx.globalAlpha=route.id===currentRouteId?Math.min(1,alpha*3.3):alpha;
    ctx.lineWidth=route.id===currentRouteId?3.5:1.15;
    ctx.stroke();
  }
  if(transferNodes){
    for(const node of transferNodes.values()){
      if((node.routeIds?.size||0)<2)continue;
      // Interchanges group navigation only; plot each line's own station coordinate.
      for(const c of node.coordsByRoute?.values()||[]){
        if(!c)continue;
        const p=project(c,b,w,h,20);
        ctx.globalAlpha=.72;ctx.fillStyle='#f7fbf8';ctx.beginPath();ctx.arc(p[0],p[1],3.2,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#17342b';ctx.lineWidth=1.2;ctx.stroke();
      }
    }
  }
  if(currentKey&&transferNodes?.has(currentKey)){
    const node=transferNodes.get(currentKey),c=node.coordsByRoute?.get(currentRouteId),p=c&&project(c,b,w,h,20);
    if(p){ctx.globalAlpha=1;ctx.fillStyle='#69efb7';ctx.beginPath();ctx.arc(p[0],p[1],7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#07120e';ctx.lineWidth=3;ctx.stroke()}
  }
  ctx.globalAlpha=1;
}

export class FreeDrive{
  constructor({onExit,onChange}={}){this.routes=[];this.graph=new Map;this.currentKey=null;this.currentRouteId=null;this.history=[];this.startRoute=null;this.onExit=onExit;this.onChange=onChange;this.canvas=$('#free-drive-canvas');this.viewMode='local';this.bind()}
  bind(){
    const handleEdge=e=>{const b=e.target.closest('[data-free-edge]');if(b)this.move(decodeURIComponent(b.dataset.freeEdge))};$('#free-drive-options')?.addEventListener('click',handleEdge);
    $('#free-drive-start-station')?.addEventListener('change',e=>this.restartAt(+e.target.value));
    $('#free-drive-reset')?.addEventListener('click',()=>this.restartAt(+($('#free-drive-start-station')?.value||0)));$('#free-drive-map-toggle')?.addEventListener('click',()=>{this.viewMode=this.viewMode==='local'?'all':'local';this.renderMap();this.updateMapToggle()});
    $('#free-drive-exit')?.addEventListener('click',()=>this.onExit?.());
    addEventListener('resize',()=>this.renderMap());
  }
  setNetwork(routes){
    const hkPairs=new Map;
    for(const pair of globalThis.TRT_HONG_KONG_INDEX?.transfers||[]){
      if(pair.status!=='verified'||pair.enabled!==true||!pair.from||!pair.to)continue;
      for(const id of [pair.from,pair.to]){
        if(hkPairs.has(id))throw new Error('Conflicting Hong Kong interchange '+id);
        hkPairs.set(id,pair);
      }
    }
    for(const route of routes||[])if(route.countryId==='hk')for(const stop of route.stations||[]){
      if(stop.countryId&&stop.countryId!=='hk')throw new Error('Cross-country stop in '+route.id);
      stop.countryId='hk';delete stop.hkTransferKey;delete stop.hkTransferRequiresExit;
      const pair=hkPairs.get(String(stop.stationMasterId||stop.sourceStationId||stop.id));
      if(pair){stop.hkTransferKey='hk-transfer:'+pair.id;stop.hkTransferRequiresExit=pair.requiresExit===true;}
    }

    for(const route of routes||[])if(route.countryId==='jp'){
      const stops=route.stations||[],first=stops[0],last=stops.at(-1);
      const sharedEnd=route.loop&&stops.length>2&&first&&last
        &&String(first.stationMasterId||first.id)===String(last.stationMasterId||last.id)
        &&first.ja===last.ja&&coords(first)&&coords(last)
        &&jpTransferDistanceKm(coords(first),coords(last))<=0.15;
      stops.forEach((stop,index)=>{
        stop.jpIsolatedStopKey='jp-route-stop:'+route.id+':'+
          (sharedEnd&&index===stops.length-1?0:index);
      });
    }
    assignJapanNamedTransfers(routes);
    assignJapanNearbySameNameTransfers(routes);
    // Coordinates are route-specific, but the canonical station identity
    // still joins platforms into a transfer. Do not bucket the same master
    // station into different nodes when its line platforms are >200 m apart.
    const masterRoutes=new Map;
    for(const route of routes||[])if(route.countryId==='jp')for(const stop of route.stations||[]){
      const id=String(stop.transferStationId||stop.stationMasterId||stop.sourceStationId||'');
      if(!id)continue;
      if(!masterRoutes.has(id))masterRoutes.set(id,new Set);
      masterRoutes.get(id).add(route.id);
    }
    const sharedMasterIds=new Set([...masterRoutes].filter(([,lines])=>lines.size>1).map(([id])=>id));
    // A reused ID within one route is not proof that its two geographical
    // stops are the same platform. Never coalesce consecutive distinct stops.
    const ambiguousByRoute=new Set;
    for(const route of routes||[])if(route.countryId==='jp'){
      const counts=new Map;
      for(const stop of route.stations||[]){
        const id=String(stop.transferStationId||stop.stationMasterId||stop.sourceStationId||'');
        if(id)counts.set(id,(counts.get(id)||0)+1);
      }
      for(const [id,count] of counts)if(count>1)ambiguousByRoute.add(route.id+'|'+id);
    }
    for(const route of routes||[])for(const stop of route.stations||[]){
      if(route.countryId==='jp'){
        const key=jpDisneyTransferKey(stop,route);
        if(key)stop.jpTransferKey=key;
        const masterId=String(stop.transferStationId||stop.stationMasterId||stop.sourceStationId||'');
        if(masterId&&sharedMasterIds.has(masterId)&&!ambiguousByRoute.has(route.id+'|'+masterId))stop.jpSharedStationKey='jp-station:'+masterId;
        else delete stop.jpSharedStationKey;
        continue;
      }
      if(route.countryId!=='kr')continue;
      delete stop.krTransferKey;
      stop.krNoAutoTransfer=true;
      const region=route.regionId||'capital';
      const transfer=KR_CONFIRMED_TRANSFERS.find(t=>t.region===region&&t.name===stop.ko&&t.routeIds.includes(route.id));
      if(transfer)stop.krTransferKey='kr-transfer:'+region+':'+transfer.name;
    }
    assignJapanInterchangeComponents(routes);
    this.routes=(routes||[]).filter(r=>!koreanRouteBlockReason(r)&&!hongKongRouteBlockReason(r)).filter(r=>Array.isArray(r.stations)&&r.stations.length>=2&&(r.countryId!=='kr'||r.geometryReady===true));
    this.graph=new Map;
    const ensure=(station,route,index)=>{
      const key=freeDriveStationKey(station);if(!key)return null;let node=this.graph.get(key);
      if(!node){node={key,station,coord:coords(station),edges:[],routeIds:new Set,stationsByRoute:new Map,coordsByRoute:new Map};this.graph.set(key,node)}
      node.routeIds.add(route.id);if(station.hkTransferKey)node.transferRequiresExit=station.hkTransferRequiresExit===true;
      if(!node.stationsByRoute.has(route.id)){
        node.stationsByRoute.set(route.id,{station,index});
        node.coordsByRoute.set(route.id,coords(station));
      }
      node.routeNames=node.routeNames||new Map;node.routeNames.set(route.id,routeName(route));return node;
    };
    for(const route of this.routes){
      route.stations.forEach((s,i)=>ensure(s,route,i));
      for(let i=0;i<route.stations.length-1;i++){
        const a=route.stations[i],b=route.stations[i+1],ak=freeDriveStationKey(a),bk=freeDriveStationKey(b),an=ensure(a,route,i),bn=ensure(b,route,i+1);
        if(!an||!bn||!ak||!bk||ak===bk)continue;
        an.edges.push({to:bk,routeId:route.id,route,index:i+1,direction:1,station:b});
        if(!route.oneWay&&!(route.countryId==='kr'&&route.schemaVersion===2))bn.edges.push({to:ak,routeId:route.id,route,index:i,direction:-1,station:a});
      }
      if(route.countryId!=='hk'&&route.loop&&route.stations.length>2){
        const a=route.stations.at(-1),b=route.stations[0],ak=freeDriveStationKey(a),bk=freeDriveStationKey(b),an=ensure(a,route,route.stations.length-1),bn=ensure(b,route,0);
        if(an&&bn&&ak!==bk){an.edges.push({to:bk,routeId:route.id,route,index:0,direction:1,station:b});if(!route.oneWay&&!(route.countryId==='kr'&&route.schemaVersion===2))bn.edges.push({to:ak,routeId:route.id,route,index:route.stations.length-1,direction:-1,station:a})}
      }
    }
    this.renderMap();
  }
  start(route,index=0){
    if(!route?.stations?.length)return false;
    this.startRoute=route;this.currentRouteId=route.id;this.history=[];this.populateStartStations(route);
    this.restartAt(Math.max(0,Math.min(index,route.stations.length-1)));return true;
  }
  populateStartStations(route){
    const select=$('#free-drive-start-station');if(!select)return;
    select.innerHTML=route.stations.map((s,i)=>`<option value="${i}">${escapeHtml(stationName(s,route))} · ${escapeHtml(route.countryId==='kr'?stationName(s,route):s.ja||'')}</option>`).join('');
  }
  updateMapToggle(){const b=$('#free-drive-map-toggle');if(b)b.textContent=this.viewMode==='local'?'전국망 보기':'현재역 주변 보기'}
  restartAt(index=0){
    if(!this.startRoute)return;
    const station=this.startRoute.stations[index]||this.startRoute.stations[0];this.currentKey=freeDriveStationKey(station);this.currentRouteId=this.startRoute.id;this.history=[this.currentKey];
    const select=$('#free-drive-start-station');if(select)select.value=String(Math.max(0,index));this.viewMode='local';this.updateMapToggle();this.render();this.emit();
  }
  move(encoded){
    let token;try{token=JSON.parse(encoded)}catch{return false}
    return this.moveTo(token?.[0],token?.[1])
  }
  stationForRoute(key,routeId){return this.graph.get(key)?.stationsByRoute?.get(routeId)?.station||null}
  coordsForRoute(key,routeId){return this.graph.get(key)?.coordsByRoute?.get(routeId)||null}
  selectRoute(routeId){
    const node=this.current();
    if(!node?.stationsByRoute?.has(routeId)||!this.availableRouteIds().includes(routeId))return false;
    if(this.currentRouteId===routeId)return true;
    this.currentRouteId=routeId;
    this.render();this.emit();
    return true
  }
  moveTo(to,routeId){
    if(!to||!routeId)return false;
    const node=this.graph.get(this.currentKey),edge=node?.edges?.find(e=>e.to===to&&e.routeId===routeId);
    if(!edge||!this.availableRouteIds().includes(routeId))return false;
    this.currentKey=edge.to;this.currentRouteId=edge.routeId;this.history.push(edge.to);
    this.render();this.emit();return true
  }
  switchRouteAtCurrentStation(routeId){
    const node=this.current(),route=this.routes.find(r=>r.id===routeId);
    if(!node||!route||routeId===this.currentRouteId||!this.availableRouteIds().includes(routeId)||!route.stations.some(s=>freeDriveStationKey(s)===this.currentKey))return false;
    this.currentRouteId=routeId;this.render();this.emit();return true;
  }
  current(){return this.graph.get(this.currentKey)||null}
  availableRouteIds(){const node=this.current(),from=this.routes.find(r=>r.id===this.currentRouteId);return[...(node?.routeIds||[])].filter(id=>(from?.countryId!=='hk'||id===this.currentRouteId||node.edges.some(e=>e.routeId===id))&&hongKongTransferAllowed(from,this.routes.find(r=>r.id===id),this.currentKey))}
  snapshot(){
    const node=this.current(),route=this.routes.find(r=>r.id===this.currentRouteId)||this.startRoute;
    if(!node||!route)return null;
    const indexedStop=node.stationsByRoute?.get(this.currentRouteId);
    const stationIndex=indexedStop?.index??Math.max(0,route.stations.findIndex(station=>freeDriveStationKey(station)===this.currentKey));
    const availableRouteIds=this.availableRouteIds(),transferCount=route.countryId==='hk'?new Set(availableRouteIds.map(id=>this.routes.find(r=>r.id===id)?.canonicalLineId).filter(id=>id&&id!==route.canonicalLineId)).size:Math.max(0,availableRouteIds.length-1);return{node,availableRouteIds,station:route.stations[stationIndex]||indexedStop?.station||node.station,route,routeId:this.currentRouteId,stationIndex,edges:this.edges(),historyLength:this.history.length,transferCount}
  }
  emit(){const state=this.snapshot();if(state)this.onChange?.(state);return state}
  edges(){
    const node=this.current();if(!node)return[];
    const seen=new Set;
    const available=this.availableRouteIds();return node.edges.filter(e=>{if(!available.includes(e.routeId))return false;const k=`${e.to}|${e.routeId}`;if(seen.has(k))return false;seen.add(k);return true})
      .sort((a,b)=>(a.routeId===this.currentRouteId?-1:0)-(b.routeId===this.currentRouteId?-1:0)||routeName(a.route).localeCompare(routeName(b.route),'ko'));
  }
  render(){
    const node=this.current();if(!node)return;
    const route=this.routes.find(r=>r.id===this.currentRouteId);
    const actual=this.stationForRoute(this.currentKey,this.currentRouteId)||node.station;
    $('#free-drive-station-ko').textContent=stationName(actual,route);
    $('#free-drive-station-ja').textContent=route?.countryId==='kr'?stationName(actual,route):actual.ja||'';
    $('#free-drive-current-line').textContent=routeName(route);
    $('#free-drive-transfer-count').textContent=String(Math.max(0,(node.routeIds?.size||1)-1));
    $('#free-drive-visited-count').textContent=String(this.history.length);
    const edges=this.edges(),target=$('#free-drive-options');
    const groups=new Map;for(const edge of edges){if(!groups.has(edge.routeId))groups.set(edge.routeId,[]);groups.get(edge.routeId).push(edge)}
    target.innerHTML=[...groups.entries()].map(([routeId,list])=>{
      const r=list[0].route,transfer=routeId!==this.currentRouteId;
      return `<section class="free-drive-line ${transfer?'transfer':''}" style="--route-color:${routeColor(r)}"><header><span>${transfer?'TRANSFER · 환승':'CURRENT LINE'}</span><b>${escapeHtml(routeName(r))}</b><small>${escapeHtml(r.operator?.ko||r.operator?.ja||'')}</small></header><div>${list.map(edge=>{const dest=edge.station||this.stationForRoute(edge.to,edge.routeId);return `<button type="button" data-free-edge="${encodeURIComponent(JSON.stringify([edge.to,edge.routeId]))}"><b>${escapeHtml(stationName(dest,r))}</b><span>${escapeHtml(r.countryId==='kr'?stationName(dest,r):dest?.ja||'')}</span><i>→</i></button>`}).join('')}</div></section>`
    }).join('')||'<p class="muted">이 역에서 이어지는 선로를 찾지 못했습니다.</p>';
    this.renderMap();
  }
  renderMap(){
    if(!this.canvas||!this.routes.length)return;
    let bounds=boundsOfRoutes(this.routes);
    if(this.viewMode==='local'){
      const c=this.coordsForRoute(this.currentKey,this.currentRouteId);
      if(c)bounds={minLat:c[0]-.18,maxLat:c[0]+.18,minLon:c[1]-.24,maxLon:c[1]+.24};
    }
    drawNetworkCanvas(this.canvas,this.routes,{bounds,alpha:this.viewMode==='local'?.18:.10,transferNodes:this.graph,currentKey:this.currentKey,currentRouteId:this.currentRouteId});
  }
}
