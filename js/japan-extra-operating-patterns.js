/* Japanese operating patterns — independently source-backed stop sequences.
 * Implemented on existing MLIT/OSM line geometry; NOT a claim of exhaustive,
 * train-specific 2026 timetables. Source & bounded section are explicit.
 * Load after js/service-data.js and before js/app.bundle.js.
 * Do not make older JR TrainLCD NEEDS_REPAIR patterns playable by guesswork.
 */
(function(){
  'use strict';
  const catalog=window.TRT_TOKYO_SERVICE_PATTERNS;
  if(!catalog || !Array.isArray(catalog.servicePatterns) || !Array.isArray(catalog.serviceJourneys))return;
  const definitions=[
  {
    "id": "jp-extra-25001-rapid-express",
    "routeId": "line-25001",
    "operatorId": "odakyu",
    "kind": "rapid-express",
    "names": {
      "ja": "快速急行",
      "ko": "쾌속급행",
      "en": "Rapid Express"
    },
    "priority": 45,
    "source": "https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu_odawara/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003700",
      "station-003847",
      "station-003908",
      "station-004130",
      "station-004227",
      "station-004387",
      "station-004426",
      "station-004672",
      "station-004715",
      "station-004771",
      "station-004844",
      "station-004885",
      "station-004909",
      "station-004913",
      "station-004906",
      "station-004981",
      "station-005037",
      "station-1130116"
    ],
    "stationNames": [
      "新宿",
      "代々木上原",
      "下北沢",
      "登戸",
      "新百合ヶ丘",
      "町田",
      "相模大野",
      "海老名",
      "本厚木",
      "愛甲石田",
      "伊勢原",
      "鶴巻温泉",
      "東海大学前",
      "秦野",
      "渋沢",
      "新松田",
      "開成",
      "小田原"
    ],
    "stationDisplayNames": [
      {
        "ja": "新宿",
        "ko": "신주쿠"
      },
      {
        "ja": "代々木上原",
        "ko": "요요기우에하라"
      },
      {
        "ja": "下北沢",
        "ko": "시모키타자와"
      },
      {
        "ja": "登戸",
        "ko": "노보리토"
      },
      {
        "ja": "新百合ヶ丘",
        "ko": "신유리가오카"
      },
      {
        "ja": "町田",
        "ko": "마치다"
      },
      {
        "ja": "相模大野",
        "ko": "사가미오노"
      },
      {
        "ja": "海老名",
        "ko": "에비나"
      },
      {
        "ja": "本厚木",
        "ko": "혼아츠기"
      },
      {
        "ja": "愛甲石田",
        "ko": "아이코이시다"
      },
      {
        "ja": "伊勢原",
        "ko": "이세하라"
      },
      {
        "ja": "鶴巻温泉",
        "ko": "츠루마키온센"
      },
      {
        "ja": "東海大学前",
        "ko": "도카이다이가쿠마에"
      },
      {
        "ja": "秦野",
        "ko": "하다노"
      },
      {
        "ja": "渋沢",
        "ko": "시부사와"
      },
      {
        "ja": "新松田",
        "ko": "신마츠다"
      },
      {
        "ja": "開成",
        "ko": "카이세이"
      },
      {
        "ja": "小田原",
        "ko": "오다와라"
      }
    ]
  },
  {
    "id": "jp-extra-25001-express",
    "routeId": "line-25001",
    "operatorId": "odakyu",
    "kind": "express",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 35,
    "source": "https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003700",
      "station-003847",
      "station-003908",
      "station-003970",
      "station-004036",
      "station-004130",
      "station-004150",
      "station-004227",
      "station-004387",
      "station-004426",
      "station-004672",
      "station-004715",
      "station-004771",
      "station-004844",
      "station-004885",
      "station-004909",
      "station-004913",
      "station-004906",
      "station-004981",
      "station-005037",
      "station-1130116"
    ],
    "stationNames": [
      "新宿",
      "代々木上原",
      "下北沢",
      "経堂",
      "成城学園前",
      "登戸",
      "向ヶ丘遊園",
      "新百合ヶ丘",
      "町田",
      "相模大野",
      "海老名",
      "本厚木",
      "愛甲石田",
      "伊勢原",
      "鶴巻温泉",
      "東海大学前",
      "秦野",
      "渋沢",
      "新松田",
      "開成",
      "小田原"
    ],
    "stationDisplayNames": [
      {
        "ja": "新宿",
        "ko": "신주쿠"
      },
      {
        "ja": "代々木上原",
        "ko": "요요기우에하라"
      },
      {
        "ja": "下北沢",
        "ko": "시모키타자와"
      },
      {
        "ja": "経堂",
        "ko": "쿄도"
      },
      {
        "ja": "成城学園前",
        "ko": "세이죠가쿠엔마에"
      },
      {
        "ja": "登戸",
        "ko": "노보리토"
      },
      {
        "ja": "向ヶ丘遊園",
        "ko": "무코가오카유엔"
      },
      {
        "ja": "新百合ヶ丘",
        "ko": "신유리가오카"
      },
      {
        "ja": "町田",
        "ko": "마치다"
      },
      {
        "ja": "相模大野",
        "ko": "사가미오노"
      },
      {
        "ja": "海老名",
        "ko": "에비나"
      },
      {
        "ja": "本厚木",
        "ko": "혼아츠기"
      },
      {
        "ja": "愛甲石田",
        "ko": "아이코이시다"
      },
      {
        "ja": "伊勢原",
        "ko": "이세하라"
      },
      {
        "ja": "鶴巻温泉",
        "ko": "츠루마키온센"
      },
      {
        "ja": "東海大学前",
        "ko": "도카이다이가쿠마에"
      },
      {
        "ja": "秦野",
        "ko": "하다노"
      },
      {
        "ja": "渋沢",
        "ko": "시부사와"
      },
      {
        "ja": "新松田",
        "ko": "신마츠다"
      },
      {
        "ja": "開成",
        "ko": "카이세이"
      },
      {
        "ja": "小田原",
        "ko": "오다와라"
      }
    ]
  },
  {
    "id": "jp-extra-27001-limited-express",
    "routeId": "line-27001",
    "operatorId": "keikyu",
    "kind": "limited-express",
    "names": {
      "ja": "特急",
      "ko": "특급",
      "en": "Limited Express"
    },
    "priority": 35,
    "source": "https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-004042",
      "station-1130103",
      "station-004184",
      "station-004294",
      "station-004331",
      "station-2700115",
      "station-004579",
      "station-1130105",
      "station-004790",
      "station-004986",
      "station-2700139",
      "station-005066",
      "station-005161",
      "station-005163",
      "station-2700147",
      "station-005202",
      "station-005206",
      "station-005227"
    ],
    "stationNames": [
      "泉岳寺",
      "品川",
      "青物横丁",
      "平和島",
      "京急蒲田",
      "京急川崎",
      "神奈川新町",
      "横浜",
      "上大岡",
      "金沢文庫",
      "金沢八景",
      "追浜",
      "汐入",
      "横須賀中央",
      "堀ノ内",
      "京急大津",
      "馬堀海岸",
      "浦賀"
    ],
    "stationDisplayNames": [
      {
        "ja": "泉岳寺",
        "ko": "센가쿠지"
      },
      {
        "ja": "品川",
        "ko": "시나가와"
      },
      {
        "ja": "青物横丁",
        "ko": "아오모노요코초"
      },
      {
        "ja": "平和島",
        "ko": "헤이와토"
      },
      {
        "ja": "京急蒲田",
        "ko": "케이큐카마타"
      },
      {
        "ja": "京急川崎",
        "ko": "케이큐카와사키"
      },
      {
        "ja": "神奈川新町",
        "ko": "카나가와신마치"
      },
      {
        "ja": "横浜",
        "ko": "요코하마"
      },
      {
        "ja": "上大岡",
        "ko": "카미오카"
      },
      {
        "ja": "金沢文庫",
        "ko": "카나자와분코"
      },
      {
        "ja": "金沢八景",
        "ko": "카나자와핫케이"
      },
      {
        "ja": "追浜",
        "ko": "옷파마"
      },
      {
        "ja": "汐入",
        "ko": "시오이리"
      },
      {
        "ja": "横須賀中央",
        "ko": "요코스카츄오"
      },
      {
        "ja": "堀ノ内",
        "ko": "호리노우치"
      },
      {
        "ja": "京急大津",
        "ko": "케이큐오츠"
      },
      {
        "ja": "馬堀海岸",
        "ko": "마보리카이간"
      },
      {
        "ja": "浦賀",
        "ko": "우라가"
      }
    ]
  },
  {
    "id": "jp-extra-27001-rapid-limited-express",
    "routeId": "line-27001",
    "operatorId": "keikyu",
    "kind": "rapid-limited-express",
    "names": {
      "ja": "快特（本線区間）",
      "ko": "쾌특(본선 구간)",
      "en": "Rapid Limited Express (Main Line Section)"
    },
    "priority": 45,
    "source": "https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/",
    "sourceSnapshot": "2025-06-24",
    "scope": "main-line-section",
    "stationIds": [
      "station-004042",
      "station-1130103",
      "station-004331",
      "station-2700115",
      "station-1130105",
      "station-004790",
      "station-004986",
      "station-2700139",
      "station-005163",
      "station-2700147"
    ],
    "stationNames": [
      "泉岳寺",
      "品川",
      "京急蒲田",
      "京急川崎",
      "横浜",
      "上大岡",
      "金沢文庫",
      "金沢八景",
      "横須賀中央",
      "堀ノ内"
    ],
    "stationDisplayNames": [
      {
        "ja": "泉岳寺",
        "ko": "센가쿠지"
      },
      {
        "ja": "品川",
        "ko": "시나가와"
      },
      {
        "ja": "京急蒲田",
        "ko": "케이큐카마타"
      },
      {
        "ja": "京急川崎",
        "ko": "케이큐카와사키"
      },
      {
        "ja": "横浜",
        "ko": "요코하마"
      },
      {
        "ja": "上大岡",
        "ko": "카미오카"
      },
      {
        "ja": "金沢文庫",
        "ko": "카나자와분코"
      },
      {
        "ja": "金沢八景",
        "ko": "카나자와핫케이"
      },
      {
        "ja": "横須賀中央",
        "ko": "요코스카츄오"
      },
      {
        "ja": "堀ノ内",
        "ko": "호리노우치"
      }
    ]
  },
  {
    "id": "jp-extra-24001-limited-express",
    "routeId": "line-24001",
    "operatorId": "keio",
    "kind": "limited-express",
    "names": {
      "ja": "特急",
      "ko": "특급",
      "en": "Limited Express"
    },
    "priority": 40,
    "source": "https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003700",
      "station-2400104",
      "station-003846",
      "station-003861",
      "station-003966",
      "station-003821",
      "station-003853",
      "station-003971",
      "station-003904",
      "station-004007",
      "station-003934"
    ],
    "stationNames": [
      "新宿",
      "笹塚",
      "明大前",
      "千歳烏山",
      "調布",
      "府中",
      "分倍河原",
      "聖蹟桜ヶ丘",
      "高幡不動",
      "北野",
      "京王八王子"
    ],
    "stationDisplayNames": [
      {
        "ja": "新宿",
        "ko": "신주쿠"
      },
      {
        "ja": "笹塚",
        "ko": "사사즈카"
      },
      {
        "ja": "明大前",
        "ko": "메이다이마에"
      },
      {
        "ja": "千歳烏山",
        "ko": "치토세카라스야마"
      },
      {
        "ja": "調布",
        "ko": "쵸후"
      },
      {
        "ja": "府中",
        "ko": "후츄"
      },
      {
        "ja": "分倍河原",
        "ko": "부바이가와라"
      },
      {
        "ja": "聖蹟桜ヶ丘",
        "ko": "세이세키사쿠라가오카"
      },
      {
        "ja": "高幡不動",
        "ko": "타카하타후도"
      },
      {
        "ja": "北野",
        "ko": "키타노"
      },
      {
        "ja": "京王八王子",
        "ko": "케이오하치오지"
      }
    ]
  },
  {
    "id": "jp-extra-24001-express",
    "routeId": "line-24001",
    "operatorId": "keio",
    "kind": "express",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 30,
    "source": "https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003700",
      "station-2400104",
      "station-003846",
      "station-003862",
      "station-003861",
      "station-003933",
      "station-003966",
      "station-003850",
      "station-003821",
      "station-003853",
      "station-003971",
      "station-003904",
      "station-004007",
      "station-003934"
    ],
    "stationNames": [
      "新宿",
      "笹塚",
      "明大前",
      "桜上水",
      "千歳烏山",
      "つつじヶ丘",
      "調布",
      "東府中",
      "府中",
      "分倍河原",
      "聖蹟桜ヶ丘",
      "高幡不動",
      "北野",
      "京王八王子"
    ],
    "stationDisplayNames": [
      {
        "ja": "新宿",
        "ko": "신주쿠"
      },
      {
        "ja": "笹塚",
        "ko": "사사즈카"
      },
      {
        "ja": "明大前",
        "ko": "메이다이마에"
      },
      {
        "ja": "桜上水",
        "ko": "사쿠라조스이"
      },
      {
        "ja": "千歳烏山",
        "ko": "치토세카라스야마"
      },
      {
        "ja": "つつじヶ丘",
        "ko": "츠츠지가오카"
      },
      {
        "ja": "調布",
        "ko": "쵸후"
      },
      {
        "ja": "東府中",
        "ko": "히가시후추"
      },
      {
        "ja": "府中",
        "ko": "후츄"
      },
      {
        "ja": "分倍河原",
        "ko": "부바이가와라"
      },
      {
        "ja": "聖蹟桜ヶ丘",
        "ko": "세이세키사쿠라가오카"
      },
      {
        "ja": "高幡不動",
        "ko": "타카하타후도"
      },
      {
        "ja": "北野",
        "ko": "키타노"
      },
      {
        "ja": "京王八王子",
        "ko": "케이오하치오지"
      }
    ]
  },
  {
    "id": "jp-extra-22001-express",
    "routeId": "line-22001",
    "operatorId": "seibu",
    "kind": "express",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 30,
    "source": "https://www.seiburailway.jp/railway/station/",
    "sourceSnapshot": "2026-11-08",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003390",
      "station-003292",
      "station-003242",
      "station-003131",
      "station-2200117",
      "station-003088",
      "station-003068",
      "station-003050",
      "station-003011",
      "station-003018",
      "station-003028",
      "station-003020",
      "station-2200125"
    ],
    "stationNames": [
      "池袋",
      "石神井公園",
      "ひばりヶ丘",
      "所沢",
      "西所沢",
      "小手指",
      "狭山ヶ丘",
      "武蔵藤沢",
      "稲荷山公園",
      "入間市",
      "仏子",
      "元加治",
      "飯能"
    ],
    "stationDisplayNames": [
      {
        "ja": "池袋",
        "ko": "이케부쿠로"
      },
      {
        "ja": "石神井公園",
        "ko": "샤쿠지이코엔"
      },
      {
        "ja": "ひばりヶ丘",
        "ko": "히바리가오카"
      },
      {
        "ja": "所沢",
        "ko": "토코로자와"
      },
      {
        "ja": "西所沢",
        "ko": "니시토코로자와"
      },
      {
        "ja": "小手指",
        "ko": "코테사시"
      },
      {
        "ja": "狭山ヶ丘",
        "ko": "사야마가오카"
      },
      {
        "ja": "武蔵藤沢",
        "ko": "무사시후지사와"
      },
      {
        "ja": "稲荷山公園",
        "ko": "이나리야마코엔"
      },
      {
        "ja": "入間市",
        "ko": "이루마시"
      },
      {
        "ja": "仏子",
        "ko": "부시"
      },
      {
        "ja": "元加治",
        "ko": "모토카지"
      },
      {
        "ja": "飯能",
        "ko": "한노"
      }
    ]
  },
  {
    "id": "jp-extra-22001-semi-express",
    "routeId": "line-22001",
    "operatorId": "seibu",
    "kind": "semi-express",
    "names": {
      "ja": "準急",
      "ko": "준급",
      "en": "Semi Express"
    },
    "priority": 25,
    "source": "https://www.seiburailway.jp/railway/station/",
    "sourceSnapshot": "2026-11-08",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003390",
      "station-003328",
      "station-003292",
      "station-003263",
      "station-003271",
      "station-003242",
      "station-003217",
      "station-003179",
      "station-003151",
      "station-003131",
      "station-2200117",
      "station-003088",
      "station-003068",
      "station-003050",
      "station-003011",
      "station-003018",
      "station-003028",
      "station-003020",
      "station-2200125"
    ],
    "stationNames": [
      "池袋",
      "練馬",
      "石神井公園",
      "大泉学園",
      "保谷",
      "ひばりヶ丘",
      "東久留米",
      "清瀬",
      "秋津",
      "所沢",
      "西所沢",
      "小手指",
      "狭山ヶ丘",
      "武蔵藤沢",
      "稲荷山公園",
      "入間市",
      "仏子",
      "元加治",
      "飯能"
    ],
    "stationDisplayNames": [
      {
        "ja": "池袋",
        "ko": "이케부쿠로"
      },
      {
        "ja": "練馬",
        "ko": "네리마"
      },
      {
        "ja": "石神井公園",
        "ko": "샤쿠지이코엔"
      },
      {
        "ja": "大泉学園",
        "ko": "오이즈미가쿠엔"
      },
      {
        "ja": "保谷",
        "ko": "호야"
      },
      {
        "ja": "ひばりヶ丘",
        "ko": "히바리가오카"
      },
      {
        "ja": "東久留米",
        "ko": "히가시쿠루메"
      },
      {
        "ja": "清瀬",
        "ko": "키요세"
      },
      {
        "ja": "秋津",
        "ko": "아키츠"
      },
      {
        "ja": "所沢",
        "ko": "토코로자와"
      },
      {
        "ja": "西所沢",
        "ko": "니시토코로자와"
      },
      {
        "ja": "小手指",
        "ko": "코테사시"
      },
      {
        "ja": "狭山ヶ丘",
        "ko": "사야마가오카"
      },
      {
        "ja": "武蔵藤沢",
        "ko": "무사시후지사와"
      },
      {
        "ja": "稲荷山公園",
        "ko": "이나리야마코엔"
      },
      {
        "ja": "入間市",
        "ko": "이루마시"
      },
      {
        "ja": "仏子",
        "ko": "부시"
      },
      {
        "ja": "元加治",
        "ko": "모토카지"
      },
      {
        "ja": "飯能",
        "ko": "한노"
      }
    ]
  }
];
  const existingPatterns=new Set(catalog.servicePatterns.map(x=>x.id));
  const existingJourneys=new Set(catalog.serviceJourneys.map(x=>x.id));
  const existingTypes=new Set((catalog.trainTypes||[]).map(x=>x.id));
  const existingDestinations=new Set((catalog.destinations||[]).map(x=>String(x.stationId)));
  if(!Array.isArray(catalog.trainTypes))catalog.trainTypes=[];
  if(!Array.isArray(catalog.destinations))catalog.destinations=[];
  let added=0;
  for(const def of definitions){
    const trainTypeId=def.id+'-type';
    if(!existingTypes.has(trainTypeId)){
      catalog.trainTypes.push({id:trainTypeId,operatorId:def.operatorId,names:def.names,priority:def.priority});
      existingTypes.add(trainTypeId);
    }
    for(const direction of ['forward','reverse']){
      const stops=direction==='reverse'?def.stationIds.slice().reverse():def.stationIds.slice();
      const displays=direction==='reverse'?def.stationDisplayNames.slice().reverse():def.stationDisplayNames;
      if(stops.length<2||new Set(stops).size!==stops.length)continue;
      const id=def.id+'-'+direction,journeyId='journey-'+id;
      if(existingPatterns.has(id)||existingJourneys.has(journeyId))continue;
      const origin=stops[0],destination=stops.at(-1);
      for(const [stationId,names] of [[origin,displays[0]],[destination,displays.at(-1)]]){
        if(!existingDestinations.has(stationId)){
          catalog.destinations.push({stationId,names});
          existingDestinations.add(stationId);
        }
      }
      const pattern={
        id,baseRouteId:def.routeId,trainTypeId,
        originStationId:origin,destinationStationId:destination,
        directionId:direction,stopStationIds:stops,names:def.names,
        status:'active',sourceStatus:'stop-pattern-crosschecked',
        sourceScope:def.scope,
        sources:[{type:def.source.includes('seiburailway.jp')?'official':'route-stop-matrix',url:def.source,sourceSnapshot:def.sourceSnapshot}]
      };
      catalog.servicePatterns.push(pattern);
      catalog.serviceJourneys.push({
        id:journeyId,baseRouteId:def.routeId,originStationId:origin,
        destinationStationId:destination,trainTypeId,directionId:direction,
        servicePatternId:id,throughServiceId:null,status:'active'
      });
      existingPatterns.add(id);existingJourneys.add(journeyId);
      added++;
    }
  }
  window.TRT_JP_EXTRA_OPERATING_PATTERN_AUDIT={
    version:1,operators:[...new Set(definitions.map(x=>x.operatorId))],
    expectedDirectionCount:definitions.length*2,addedDirections:added,
    definitions:definitions.map(x=>({id:x.id,routeId:x.routeId,source:x.source,scope:x.scope,stationCount:x.stationIds.length}))
  };
})();
