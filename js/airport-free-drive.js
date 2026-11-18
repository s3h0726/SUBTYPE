/* SUBTYPE Free Drive — virtual airport transfer layer.
 * Airport names and coordinates identify connected railway stations; these are
 * NOT real airline routes, schedules, fares or verified flight availability.
 */
(function(root){
  'use strict';
  // Only rail-linked public airport stations; one physical station can serve multiple terminals.
  const AIRPORTS=Object.freeze([
    {
      "code": "ICN",
      "countryId": "kr",
      "name": "인천국제공항",
      "city": "인천",
      "lat": 37.4602,
      "lon": 126.4407,
      "radius": 6,
      "aliases": [
        "인천국제공항",
        "인천공항"
      ],
      "portals": [
        {
          "id": "t1",
          "label": "제1터미널역",
          "aliases": [
            "인천공항1터미널",
            "인천공항제1터미널",
            "인천공항 제1터미널",
            "인천국제공항제1여객터미널",
            "Incheon Airport Terminal 1",
            "Incheon International Airport Terminal 1"
          ]
        },
        {
          "id": "t2",
          "label": "제2터미널역",
          "aliases": [
            "인천공항2터미널",
            "인천공항제2터미널",
            "인천공항 제2터미널",
            "인천국제공항제2여객터미널",
            "Incheon Airport Terminal 2",
            "Incheon International Airport Terminal 2"
          ]
        }
      ]
    },
    {
      "code": "GMP",
      "countryId": "kr",
      "name": "김포국제공항",
      "city": "서울",
      "lat": 37.5583,
      "lon": 126.7906,
      "radius": 2.5,
      "aliases": [
        "김포공항",
        "김포국제공항",
        "Gimpo Airport",
        "Gimpo International Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "김포공항역",
          "aliases": [
            "김포공항",
            "김포국제공항",
            "Gimpo Airport"
          ]
        }
      ]
    },
    {
      "code": "PUS",
      "countryId": "kr",
      "name": "김해국제공항",
      "city": "부산",
      "lat": 35.1795,
      "lon": 128.9382,
      "radius": 2,
      "aliases": [
        "김해공항",
        "김해국제공항",
        "Gimhae International Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "공항역 (부산김해경전철)",
          "aliases": [
            "공항",
            "공항역",
            "김해공항",
            "Gimhae International Airport",
            "Gimhae Airport"
          ]
        }
      ]
    },
    {
      "code": "NRT",
      "countryId": "jp",
      "name": "나리타 국제공항",
      "city": "도쿄",
      "lat": 35.772,
      "lon": 140.3929,
      "radius": 4.7,
      "aliases": [
        "나리타공항",
        "나리타 국제공항",
        "Narita Airport",
        "Narita International Airport"
      ],
      "portals": [
        {
          "id": "t1",
          "label": "제1터미널역",
          "aliases": [
            "成田空港",
            "成田空港駅",
            "나리타공항",
            "나리타공항역",
            "Narita Airport",
            "Narita Airport Terminal 1",
            "成田空港第1ターミナル"
          ]
        },
        {
          "id": "t23",
          "label": "제2·3터미널 공용역",
          "aliases": [
            "空港第2ビル",
            "空港第2ビル駅",
            "공항 제2빌딩",
            "공항제2빌딩",
            "나리타공항제2터미널",
            "Narita Airport Terminal 2·3",
            "Airport Terminal 2",
            "Narita Airport Terminal 2-3",
            "Narita Airport Terminal 2・3"
          ]
        }
      ]
    },
    {
      "code": "HND",
      "countryId": "jp",
      "name": "하네다 국제공항",
      "city": "도쿄",
      "lat": 35.5494,
      "lon": 139.7798,
      "radius": 4.6,
      "aliases": [
        "하네다공항",
        "하네다 국제공항",
        "Haneda Airport"
      ],
      "portals": [
        {
          "id": "t1",
          "label": "제1터미널역",
          "aliases": [
            "羽田空港第1ターミナル",
            "羽田空港第1ビル",
            "하네다공항제1터미널",
            "Haneda Airport Terminal 1"
          ]
        },
        {
          "id": "t2",
          "label": "제2터미널역",
          "aliases": [
            "羽田空港第2ターミナル",
            "羽田空港第2ビル",
            "하네다공항제2터미널",
            "Haneda Airport Terminal 2"
          ]
        },
        {
          "id": "t12",
          "label": "제1·2터미널 공용역",
          "aliases": [
            "羽田空港第1・第2ターミナル",
            "羽田空港第1第2ターミナル",
            "하네다공항제1·2터미널",
            "Haneda Airport Terminal 1・2",
            "Haneda Airport Terminal 1 & 2"
          ]
        },
        {
          "id": "t3",
          "label": "제3터미널역",
          "aliases": [
            "羽田空港第3ターミナル",
            "羽田空港国際線ターミナル",
            "하네다공항제3터미널",
            "Haneda Airport Terminal 3",
            "Haneda Airport International Terminal"
          ]
        }
      ]
    },
    {
      "code": "KIX",
      "countryId": "jp",
      "name": "간사이 국제공항",
      "city": "오사카",
      "lat": 34.4347,
      "lon": 135.244,
      "radius": 3.5,
      "aliases": [
        "간사이공항",
        "関西空港",
        "Kansai Airport",
        "Kansai International Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "간사이공항역",
          "aliases": [
            "간사이공항",
            "関西空港",
            "Kansai Airport"
          ]
        }
      ]
    },
    {
      "code": "FUK",
      "countryId": "jp",
      "name": "후쿠오카공항",
      "city": "후쿠오카",
      "lat": 33.5859,
      "lon": 130.4507,
      "radius": 2.4,
      "aliases": [
        "후쿠오카공항",
        "福岡空港",
        "Fukuoka Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "후쿠오카공항역",
          "aliases": [
            "후쿠오카공항",
            "福岡空港",
            "Fukuoka Airport"
          ]
        }
      ]
    },
    {
      "code": "CTS",
      "countryId": "jp",
      "name": "신치토세공항",
      "city": "삿포로",
      "lat": 42.7752,
      "lon": 141.6923,
      "radius": 2.8,
      "aliases": [
        "신치토세공항",
        "新千歳空港",
        "New Chitose Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "신치토세공항역",
          "aliases": [
            "신치토세공항",
            "新千歳空港",
            "New Chitose Airport"
          ]
        }
      ]
    },
    {
      "code": "NGO",
      "countryId": "jp",
      "name": "주부국제공항",
      "city": "나고야",
      "lat": 34.8584,
      "lon": 136.8054,
      "radius": 3,
      "aliases": [
        "주부국제공항",
        "중부국제공항",
        "中部国際空港",
        "Central Japan International Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "주부국제공항역",
          "aliases": [
            "주부국제공항",
            "중부국제공항",
            "中部国際空港",
            "Central Japan International Airport"
          ]
        }
      ]
    },
    {
      "code": "OKA",
      "countryId": "jp",
      "name": "나하공항",
      "city": "오키나와",
      "lat": 26.1958,
      "lon": 127.6459,
      "radius": 2.4,
      "aliases": [
        "나하공항",
        "那覇空港",
        "Naha Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "나하공항역",
          "aliases": [
            "나하공항",
            "那覇空港",
            "Naha Airport"
          ]
        }
      ]
    },
    {
      "code": "HKG",
      "countryId": "hk",
      "name": "홍콩 국제공항",
      "city": "홍콩",
      "lat": 22.308,
      "lon": 113.9185,
      "radius": 4,
      "aliases": [
        "홍콩공항",
        "홍콩국제공항",
        "공항",
        "機場",
        "Airport",
        "Hong Kong International Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "공항역 (Airport Express)",
          "aliases": [
            "공항",
            "機場",
            "Airport",
            "홍콩공항",
            "Hong Kong International Airport"
          ]
        }
      ]
    },
    {
      "code": "TPE",
      "countryId": "tw",
      "name": "타오위안 국제공항",
      "city": "타오위안",
      "lat": 25.0797,
      "lon": 121.2342,
      "radius": 4,
      "aliases": [
        "타오위안공항",
        "타오위안국제공항",
        "桃園機場"
      ],
      "portals": [
        {
          "id": "t1",
          "label": "제1터미널역 (A12)",
          "aliases": [
            "공항 제1터미널",
            "공항제1터미널",
            "機場第一航廈",
            "Airport Terminal 1",
            "Airport Terminal 1 Station",
            "A12 Airport Terminal 1"
          ]
        },
        {
          "id": "t2",
          "label": "제2터미널역 (A13)",
          "aliases": [
            "공항 제2터미널",
            "공항제2터미널",
            "機場第二航廈",
            "Airport Terminal 2",
            "Airport Terminal 2 Station",
            "A13 Airport Terminal 2"
          ]
        }
      ]
    },
    {
      "code": "KHH",
      "countryId": "tw",
      "name": "가오슝 국제공항",
      "city": "가오슝",
      "lat": 22.5771,
      "lon": 120.35,
      "radius": 2.7,
      "aliases": [
        "가오슝국제공항",
        "고웅국제공항",
        "高雄國際機場",
        "Kaohsiung International Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "가오슝국제공항역",
          "aliases": [
            "가오슝국제공항",
            "高雄國際機場",
            "Kaohsiung International Airport"
          ]
        }
      ]
    },
    {
      "code": "MFM",
      "countryId": "mo",
      "name": "마카오 국제공항",
      "city": "마카오",
      "lat": 22.1496,
      "lon": 113.5915,
      "radius": 2.8,
      "aliases": [
        "마카오국제공항",
        "마카오공항",
        "澳門機場",
        "Macau International Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "공항역 (마카오 경전철)",
          "aliases": [
            "공항",
            "機場",
            "澳門機場",
            "마카오공항",
            "Airport",
            "Macau Airport"
          ]
        }
      ]
    },
    {
      "code": "LHR",
      "countryId": "uk",
      "name": "히스로공항",
      "city": "런던",
      "lat": 51.47,
      "lon": -0.4543,
      "radius": 5.5,
      "aliases": [
        "히스로공항",
        "Heathrow Airport"
      ],
      "portals": [
        {
          "id": "t23",
          "label": "제2·3터미널역",
          "aliases": [
            "Heathrow Terminals 2 & 3",
            "Heathrow Airport Terminals 2 & 3",
            "Heathrow Airport Terminal 2 & 3",
            "Heathrow Central",
            "히스로공항 제2·3터미널"
          ]
        },
        {
          "id": "t4",
          "label": "제4터미널역",
          "aliases": [
            "Heathrow Terminal 4",
            "Heathrow Airport Terminal 4",
            "히스로공항 제4터미널"
          ]
        },
        {
          "id": "t5",
          "label": "제5터미널역",
          "aliases": [
            "Heathrow Terminal 5",
            "Heathrow Airport Terminal 5",
            "히스로공항 제5터미널"
          ]
        }
      ]
    },
    {
      "code": "LGW",
      "countryId": "uk",
      "name": "개트윅공항",
      "city": "런던",
      "lat": 51.1537,
      "lon": -0.1821,
      "radius": 2.5,
      "aliases": [
        "개트윅공항",
        "Gatwick Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "개트윅공항역 (남터미널)",
          "aliases": [
            "Gatwick Airport",
            "개트윅공항"
          ]
        }
      ]
    },
    {
      "code": "STN",
      "countryId": "uk",
      "name": "스탠스테드공항",
      "city": "런던",
      "lat": 51.886,
      "lon": 0.2389,
      "radius": 2.8,
      "aliases": [
        "스탠스테드공항",
        "Stansted Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "스탠스테드공항역",
          "aliases": [
            "Stansted Airport",
            "스탠스테드공항"
          ]
        }
      ]
    },
    {
      "code": "LCY",
      "countryId": "uk",
      "name": "런던 시티 공항",
      "city": "런던",
      "lat": 51.5053,
      "lon": 0.0553,
      "radius": 2.1,
      "aliases": [
        "런던 시티 공항",
        "London City Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "런던 시티 공항역 (DLR)",
          "aliases": [
            "London City Airport",
            "런던 시티 공항"
          ]
        }
      ]
    },
    {
      "code": "CDG",
      "countryId": "fr",
      "name": "파리 샤를드골공항",
      "city": "파리",
      "lat": 49.0097,
      "lon": 2.5479,
      "radius": 7.2,
      "aliases": [
        "샤를드골공항",
        "파리 샤를드골공항",
        "Aéroport Charles de Gaulle",
        "Paris Charles de Gaulle Airport"
      ],
      "portals": [
        {
          "id": "cdg1",
          "label": "샤를드골공항 1역 (터미널 1·3 연계)",
          "aliases": [
            "Aéroport Charles de Gaulle 1",
            "Aéroport CDG 1",
            "Aéroport CDG 1 (Terminal 3)",
            "샤를드골공항1",
            "샤를드골 공항 1"
          ]
        },
        {
          "id": "cdg2",
          "label": "샤를드골공항 2 TGV역 (터미널 2)",
          "aliases": [
            "Aéroport Charles de Gaulle 2 TGV",
            "Aéroport CDG 2 TGV",
            "샤를드골공항2",
            "샤를드골 공항 2 TGV"
          ]
        }
      ]
    },
    {
      "code": "ORY",
      "countryId": "fr",
      "name": "파리 오를리공항",
      "city": "파리",
      "lat": 48.7262,
      "lon": 2.3652,
      "radius": 4,
      "aliases": [
        "오를리공항",
        "Paris Orly Airport",
        "Aéroport d'Orly",
        "Aéroport d’Orly"
      ],
      "portals": [
        {
          "id": "main",
          "label": "오를리공항역",
          "aliases": [
            "Aéroport d'Orly",
            "Aéroport d’Orly",
            "Aéroport d’Orly (Terminaux 1-2-3)",
            "Orly Airport",
            "오를리공항"
          ]
        }
      ]
    },
    {
      "code": "BKK",
      "countryId": "th",
      "name": "수완나품 국제공항",
      "city": "방콕",
      "lat": 13.69,
      "lon": 100.7501,
      "radius": 2.8,
      "aliases": [
        "수완나품공항",
        "수완나품 국제공항",
        "Suvarnabhumi Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "수완나품공항역 (공항철도)",
          "aliases": [
            "Suvarnabhumi",
            "Suvarnabhumi Airport",
            "수완나품",
            "수완나품공항",
            "สุวรรณภูมิ"
          ]
        }
      ]
    },
    {
      "code": "DMK",
      "countryId": "th",
      "name": "돈므앙 국제공항",
      "city": "방콕",
      "lat": 13.9126,
      "lon": 100.607,
      "radius": 3.5,
      "aliases": [
        "돈므앙공항",
        "돈므앙 국제공항",
        "Don Mueang Airport"
      ],
      "portals": [
        {
          "id": "main",
          "label": "돈므앙역 (공항 연결)",
          "aliases": [
            "Don Mueang",
            "Don Muang",
            "돈므앙",
            "ดอนเมือง"
          ]
        }
      ]
    }
  ]);
  const byCode=new Map(AIRPORTS.map(airport=>[airport.code,airport]));
  const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s·・･()\uFF08\uFF09_\-]/g,'');
  const coord=station=>{
    const lat=Number(station?.latitude??station?.lat??station?.coordinates?.lat);
    const lon=Number(station?.longitude??station?.lon??station?.lng??station?.coordinates?.lng);
    return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)>0&&Math.abs(lon)>0?[lat,lon]:null;
  };
  const kilometers=(a,b)=>{
    const rad=Math.PI/180,p1=a[0]*rad,p2=b[0]*rad,dl=(b[1]-a[1])*rad,dp=(b[0]-a[0])*rad;
    return 6371*2*Math.asin(Math.sqrt(Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2));
  };
  function stationNames(station){
    return [station?.ko,station?.ja,station?.en,station?.romaji,station?.zh,
      station?.nameKo,station?.name,station?.names?.ko,station?.names?.ja,
      station?.names?.en,station?.names?.zh,station?.canonicalStationNames?.ja,
      station?.canonicalStationNames?.ko].filter(Boolean);
  }
  const shortAlias=alias=>['airport','機場','공항','공항역'].includes(normalize(alias));
  const aliasMatch=(names,aliases)=>aliases.some(alias=>{
    const key=normalize(alias);
    return key&&names.some(name=>name===key||(!shortAlias(alias)&&name.includes(key)));
  });
  function matchesPortal(station,route,airport,portalId){
    const portal=airport?.portals?.find(item=>item.id===portalId);
    if(!portal||!station||route?.countryId!==airport.countryId)return false;
    const point=coord(station);
    if(point&&kilometers(point,[airport.lat,airport.lon])>airport.radius)return false;
    const names=stationNames(station).map(normalize);
    if(!aliasMatch(names,portal.aliases))return false;
    if(!point&&portal.aliases.some(shortAlias)&&names.some(name=>['airport','機場','공항','공항역'].includes(name))){
      return /airport|공항|機場|空港|수완나품|gimhae|macau|마카오/i.test([route?.line?.ko,route?.line?.en,route?.line?.ja,route?.nameKo].join(' '));
    }
    return true;
  }
  function matchesStation(station,route,airport){
    if(!station||!route||!airport||route.countryId!==airport.countryId)return false;
    const point=coord(station);
    if(point&&kilometers(point,[airport.lat,airport.lon])>airport.radius)return false;
    const names=stationNames(station).map(normalize);
    const matched=aliasMatch(names,airport.aliases)||airport.portals?.some(p=>aliasMatch(names,p.aliases));
    if(!matched)return false;
    // Never treat an unrelated generic "Airport" station as a flight portal.
    if(!point&&names.some(name=>['airport','機場','공항','공항역'].includes(name))&&
        !/airport|공항|機場|空港|apm|마카오|macau|gimhae/i.test([
          route?.line?.ko,route?.line?.en,route?.line?.ja,route?.nameKo
        ].join(' ')))return false;
    return true;
  }
  function detect(state){
    const station=state?.station,route=state?.route;
    return AIRPORTS.find(airport=>matchesStation(station,route,airport))||null;
  }
  function candidate(route,airport,portalId){
    if(!route||route.countryId!==airport.countryId||route.playable===false||route.visibility==='internal')return false;
    if(['bus','village_bus','express_bus','brt','river_bus','ferry'].includes(route.mode))return false;
    const exact=station=>portalId?matchesPortal(station,route,airport,portalId):matchesStation(station,route,airport);
    if((route.stations||[]).some(exact))return true;
    const aliases=portalId
      ?airport.portals.find(p=>p.id===portalId)?.aliases||[]
      :[...airport.aliases,...(airport.portals||[]).flatMap(p=>p.aliases)];
    const named=items=>(items||[]).some(item=>{
      const names=typeof item==='string'?[item]:stationNames(item);
      return aliasMatch(names.map(normalize),aliases);
    });
    if(named(route.searchStations)||named(route.stationCatalog))return true;
    const line=[route?.line?.ko,route?.line?.en,route?.line?.ja,route?.nameKo].join(' ');
    const keywords={
      ICN:/공항철도|airport railroad|incheon airport/i,GMP:/공항철도|airport railroad|airport railway/i,
      PUS:/부산김해경전철|busan.gimhae|김해 경전철/i,NRT:/成田|나리타|narita/i,
      HND:/羽田|하네다|haneda/i,KIX:/関西空港|간사이공항|kansai airport/i,
      FUK:/福岡市営地下鉄空港線|후쿠오카.*공항선|fukuoka.*airport/i,
      CTS:/千歳|신치토세|chitose/i,NGO:/名鉄空港線|중부국제공항|中部国際空港|centrair/i,
      OKA:/沖縄都市モノレール|오키나와 모노레일|yui rail/i,
      HKG:/airport express|機場快|공항철도/i,TPE:/機場捷運|공항철도|airport mrt/i,
      KHH:/高雄捷運|가오슝 지하철|kaohsiung metro/i,MFM:/澳門輕軌|마카오 경전철|macau light rail/i,
      LHR:/heathrow|히스로/i,LGW:/gatwick|개트윅/i,STN:/stansted|스탠스테드/i,
      LCY:/dlr|docklands light railway|도클랜즈/i,CDG:/rer b|샤를드골|charles de gaulle/i,
      ORY:/métro 14|metro 14|orlyval|오를리/i,BKK:/airport rail link|suvarnabhumi|수완나품/i,
      DMK:/srt red|red line|돈므앙|don mueang/i
    };
    return keywords[airport.code]?.test(line)===true;
  }
  function findStation(route,airport,portalId){
    return (route?.stations||[]).findIndex(station=>portalId
      ?matchesPortal(station,route,airport,portalId):matchesStation(station,route,airport));
  }
  const historyKey='subtype-free-drive-airport-legs-v1';
  const readHistory=()=>{try{const v=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(v)?v.slice(-50):[]}catch{return []}};
  let bridge=null,current=null,busy=false,selected=null,dialog=null,trigger=null;
  function initialize(){
    if(dialog||!root.document)return;
    const actions=document.querySelector('#screen-game .game-actions');
    if(!actions)return;
    trigger=document.createElement('button');
    trigger.type='button';trigger.id='airport-transfer-trigger';
    trigger.className='btn ghost airport-transfer-trigger';
    trigger.textContent='✈ 공항 이동';trigger.hidden=true;
    actions.prepend(trigger);
    dialog=document.createElement('div');
    dialog.id='airport-transfer-dialog';dialog.className='airport-transfer-overlay';dialog.hidden=true;
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','자유주행 공항 이동');
    dialog.innerHTML='<section class="airport-transfer-panel"><header><div><small>AIRPORT TRANSFER · FREE DRIVE</small><h2>공항 이동</h2></div><button id="airport-transfer-close" type="button" aria-label="닫기">×</button></header><p id="airport-transfer-origin"></p><div id="airport-transfer-destinations" class="airport-transfer-destinations"></div><form id="airport-transfer-form" hidden><div id="airport-transfer-terminal-row"><label for="airport-transfer-terminal">도착 터미널·철도역 선택</label><select id="airport-transfer-terminal"></select></div><label for="airport-transfer-answer">도착 공항의 이름 또는 IATA 코드를 입력하세요</label><input id="airport-transfer-answer" autocomplete="off" spellcheck="false" placeholder="도착 공항명 / 코드" required><button id="airport-transfer-confirm" class="airport-transfer-confirm" type="submit">✈ 항공 이동 시작</button></form><p id="airport-transfer-status" role="status" aria-live="polite"></p><p class="airport-transfer-disclaimer">항공 이동은 게임 내 가상 연결입니다. 실제 항공편·시간표·요금·운항 여부를 나타내지 않습니다.</p><div id="airport-transfer-journey"></div></section>';
    document.body.append(dialog);
    trigger.addEventListener('click',open);
    dialog.querySelector('#airport-transfer-close').addEventListener('click',()=>{if(!busy)close()});
    dialog.addEventListener('pointerdown',event=>{if(event.target===dialog&&!busy)close()});
    dialog.querySelector('#airport-transfer-destinations').addEventListener('click',event=>{
      const choice=event.target.closest('[data-airport-code]');
      if(!choice||busy)return;
      selected=byCode.get(choice.dataset.airportCode)||null;renderSelection();
    });
    dialog.querySelector('#airport-transfer-form').addEventListener('submit',event=>{event.preventDefault();void depart()});
    document.addEventListener('keydown',event=>{
      if(dialog?.hidden)return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(!busy)close()}
    },true);
  }
  const setStatus=message=>{const node=dialog?.querySelector('#airport-transfer-status');if(node)node.textContent=message};
  function renderSelection(){
    if(!dialog)return;
    dialog.querySelectorAll('[data-airport-code]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.airportCode===selected?.code)));
    const form=dialog.querySelector('#airport-transfer-form');
    form.hidden=!selected;
    form.querySelector('label').textContent=selected?'도착 공항을 입력하세요 · '+selected.name+' ('+selected.code+')':'도착 공항을 선택하세요';
    form.querySelector('input').value='';
    const terminalRow=form.querySelector('#airport-transfer-terminal-row');
    const terminalSelect=form.querySelector('#airport-transfer-terminal');
    terminalRow.hidden=!selected||selected.portals.length<2;
    terminalSelect.innerHTML=selected?selected.portals.map(p=>'<option value="'+p.id+'">'+p.label+'</option>').join(''):'';
    if(selected)form.querySelector('input').focus();
    setStatus(selected?'선택한 터미널의 실제 등록된 철도역으로 연결합니다. 등록되지 않은 역이면 이동하지 않습니다.':'');
  }
  function open(){
    if(!bridge||!current||busy)return;
    initialize();if(!dialog)return;
    selected=null;dialog.hidden=false;dialog.querySelector('#airport-transfer-close').textContent='×';
    dialog.querySelector('#airport-transfer-origin').textContent='출발 '+current.name+' ('+current.code+')';
    const target=dialog.querySelector('#airport-transfer-destinations');
    target.innerHTML=AIRPORTS.filter(airport=>airport.code!==current.code).map(airport=>
      '<button type="button" data-airport-code="'+airport.code+'" aria-pressed="false"><strong>'+airport.code+'</strong><span>'+airport.name+'</span><small>'+airport.city+'</small></button>'
    ).join('');
    const previous=readHistory();
    dialog.querySelector('#airport-transfer-journey').textContent=previous.length?'이전 항공 이동 기록 '+previous.length+'회 · 이 브라우저에 저장됨':'첫 항공 이동을 시작해 보세요.';
    renderSelection();
  }
  function close(){if(dialog)dialog.hidden=true;selected=null;if(current)document.querySelector('#typing-input')?.focus()}
  function update(state){
    initialize();
    current=detect(state);
    if(trigger)trigger.hidden=!current||!document.querySelector('#screen-game')?.classList.contains('active');
    if(!current&&!busy)close();
    return current;
  }
  async function depart(){
    if(busy||!current||!selected||!bridge?.flyTo)return;
    const from=current,to=selected;
    const input=dialog.querySelector('#airport-transfer-answer');
    const typed=normalize(input.value);
    if(typed!==normalize(to.name)&&typed!==normalize(to.code)){
      setStatus('도착 공항명 또는 '+to.code+' 코드를 정확히 입력해 주세요.');
      input.focus();return;
    }
    busy=true;input.disabled=true;dialog.querySelector('#airport-transfer-confirm').disabled=true;
    const portalId=dialog.querySelector('#airport-transfer-terminal').value||to.portals[0]?.id;
    const portal=to.portals.find(p=>p.id===portalId);
    setStatus(from.code+' → '+to.code+' · '+(portal?.label||'공항역')+' 연결을 확인하는 중...');
    try{
      const arrival=await bridge.flyTo(to,portalId);
      const journey=readHistory();
      journey.push({from:from.code,to:to.code,portalId,at:new Date().toISOString(),arrivalStation:arrival?.station||'',arrivalRoute:arrival?.route||''});
      localStorage.setItem(historyKey,JSON.stringify(journey.slice(-50)));
      current=to;
      const target=dialog.querySelector('#airport-transfer-destinations');
      target.innerHTML='';
      dialog.querySelector('#airport-transfer-form').hidden=true;
      setStatus('✈ '+to.name+' 도착 · '+(arrival?.station||'공항역')+'에서 자유주행을 계속할 수 있습니다.');
      dialog.querySelector('#airport-transfer-journey').textContent='항공 이동 누적 '+readHistory().length+'회 · 로컬 저장';
      dialog.querySelector('#airport-transfer-close').textContent='계속 →';
      if(trigger)trigger.hidden=false;
    }catch(error){
      setStatus('이동하지 못했습니다: '+(error?.message||'도착 공항역 연결 실패'));
    }finally{
      busy=false;input.disabled=false;dialog.querySelector('#airport-transfer-confirm').disabled=false;
    }
  }
  const api={airports:AIRPORTS,byCode,normalize,coord,kilometers,matchesPortal,matchesStation,detect,candidate,findStation,
    configure(callbacks){bridge=callbacks;initialize()},
    update,open,close,readHistory};
  root.TRTAirportSystem=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
