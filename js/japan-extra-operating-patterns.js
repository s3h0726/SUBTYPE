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
  },
  {
    "id": "jp-extra-26001-limited-express",
    "routeId": "line-26001",
    "operatorId": "tokyu",
    "kind": "limited-express",
    "names": {
      "ja": "特急・Fライナー",
      "ko": "특급·F라이너",
      "en": "Limited Express / F Liner"
    },
    "priority": 40,
    "source": "https://rosen-zu.net/tokyu/tokyu_toyoko-top/tokyu_toyoko-rosenzu/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003922",
      "station-004014",
      "station-004196",
      "station-004297",
      "station-004487",
      "station-1130105"
    ],
    "stationNames": [
      "渋谷",
      "中目黒",
      "自由が丘",
      "武蔵小杉",
      "菊名",
      "横浜"
    ],
    "stationDisplayNames": [
      {
        "ja": "渋谷",
        "ko": "시부야"
      },
      {
        "ja": "中目黒",
        "ko": "나카메구로"
      },
      {
        "ja": "自由が丘",
        "ko": "지유가오카"
      },
      {
        "ja": "武蔵小杉",
        "ko": "무사시코스기"
      },
      {
        "ja": "菊名",
        "ko": "키쿠나"
      },
      {
        "ja": "横浜",
        "ko": "요코하마"
      }
    ]
  },
  {
    "id": "jp-extra-26001-commuter-limited-express",
    "routeId": "line-26001",
    "operatorId": "tokyu",
    "kind": "commuter-limited-express",
    "names": {
      "ja": "通勤特急",
      "ko": "통근특급",
      "en": "Commuter Limited Express"
    },
    "priority": 35,
    "source": "https://rosen-zu.net/tokyu/tokyu_toyoko-top/tokyu_toyoko-rosenzu/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003922",
      "station-004014",
      "station-004196",
      "station-004297",
      "station-004351",
      "station-004487",
      "station-1130105"
    ],
    "stationNames": [
      "渋谷",
      "中目黒",
      "自由が丘",
      "武蔵小杉",
      "日吉",
      "菊名",
      "横浜"
    ],
    "stationDisplayNames": [
      {
        "ja": "渋谷",
        "ko": "시부야"
      },
      {
        "ja": "中目黒",
        "ko": "나카메구로"
      },
      {
        "ja": "自由が丘",
        "ko": "지유가오카"
      },
      {
        "ja": "武蔵小杉",
        "ko": "무사시코스기"
      },
      {
        "ja": "日吉",
        "ko": "히요시"
      },
      {
        "ja": "菊名",
        "ko": "키쿠나"
      },
      {
        "ja": "横浜",
        "ko": "요코하마"
      }
    ]
  },
  {
    "id": "jp-extra-26001-express",
    "routeId": "line-26001",
    "operatorId": "tokyu",
    "kind": "express",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 30,
    "source": "https://www.tokyu.co.jp/railway/ticket/q-seat/ty/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003922",
      "station-004014",
      "station-004094",
      "station-004196",
      "station-004245",
      "station-004261",
      "station-004297",
      "station-004351",
      "station-004406",
      "station-004487",
      "station-1130105"
    ],
    "stationNames": [
      "渋谷",
      "中目黒",
      "学芸大学",
      "自由が丘",
      "田園調布",
      "多摩川",
      "武蔵小杉",
      "日吉",
      "綱島",
      "菊名",
      "横浜"
    ],
    "stationDisplayNames": [
      {
        "ja": "渋谷",
        "ko": "시부야"
      },
      {
        "ja": "中目黒",
        "ko": "나카메구로"
      },
      {
        "ja": "学芸大学",
        "ko": "가쿠게이다이가쿠"
      },
      {
        "ja": "自由が丘",
        "ko": "지유가오카"
      },
      {
        "ja": "田園調布",
        "ko": "덴엔쵸후"
      },
      {
        "ja": "多摩川",
        "ko": "타마가와"
      },
      {
        "ja": "武蔵小杉",
        "ko": "무사시코스기"
      },
      {
        "ja": "日吉",
        "ko": "히요시"
      },
      {
        "ja": "綱島",
        "ko": "츠나시마"
      },
      {
        "ja": "菊名",
        "ko": "키쿠나"
      },
      {
        "ja": "横浜",
        "ko": "요코하마"
      }
    ]
  },
  {
    "id": "jp-extra-26003-express",
    "routeId": "line-26003",
    "operatorId": "tokyu",
    "kind": "express",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 30,
    "source": "https://rosen-zu.net/tokyu/tokyu_denentoshi-top/tokyu_denentoshi-rosenzu/tokyu_denentoshi/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003922",
      "station-004016",
      "station-004177",
      "station-1130310",
      "station-004290",
      "station-004296",
      "station-004314",
      "station-004392",
      "station-1130609",
      "station-004484",
      "station-004498"
    ],
    "stationNames": [
      "渋谷",
      "三軒茶屋",
      "二子玉川",
      "溝の口",
      "鷺沼",
      "たまプラーザ",
      "あざみ野",
      "青葉台",
      "長津田",
      "南町田グランベリーパーク",
      "中央林間"
    ],
    "stationDisplayNames": [
      {
        "ja": "渋谷",
        "ko": "시부야"
      },
      {
        "ja": "三軒茶屋",
        "ko": "산겐자야"
      },
      {
        "ja": "二子玉川",
        "ko": "후타코타마가와"
      },
      {
        "ja": "溝の口",
        "ko": "미조노쿠치"
      },
      {
        "ja": "鷺沼",
        "ko": "사기누마"
      },
      {
        "ja": "たまプラーザ",
        "ko": "타마 플라자"
      },
      {
        "ja": "あざみ野",
        "ko": "아자미노"
      },
      {
        "ja": "青葉台",
        "ko": "아오바다이"
      },
      {
        "ja": "長津田",
        "ko": "나가츠타"
      },
      {
        "ja": "南町田グランベリーパーク",
        "ko": "미나미마치다그랑베리파크"
      },
      {
        "ja": "中央林間",
        "ko": "츄오린칸"
      }
    ]
  },
  {
    "id": "jp-extra-26003-semi-express",
    "routeId": "line-26003",
    "operatorId": "tokyu",
    "kind": "semi-express",
    "names": {
      "ja": "準急",
      "ko": "준급",
      "en": "Semi Express"
    },
    "priority": 25,
    "source": "https://rosen-zu.net/tokyu/tokyu_denentoshi-top/tokyu_denentoshi-rosenzu/tokyu_denentoshi/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003922",
      "station-003972",
      "station-004016",
      "station-004069",
      "station-004078",
      "station-004109",
      "station-004177",
      "station-1130310",
      "station-004290",
      "station-004296",
      "station-004314",
      "station-004392",
      "station-1130609",
      "station-004441",
      "station-004466",
      "station-004484",
      "station-004486",
      "station-004498"
    ],
    "stationNames": [
      "渋谷",
      "池尻大橋",
      "三軒茶屋",
      "駒沢大学",
      "桜新町",
      "用賀",
      "二子玉川",
      "溝の口",
      "鷺沼",
      "たまプラーザ",
      "あざみ野",
      "青葉台",
      "長津田",
      "つくし野",
      "すずかけ台",
      "南町田グランベリーパーク",
      "つきみ野",
      "中央林間"
    ],
    "stationDisplayNames": [
      {
        "ja": "渋谷",
        "ko": "시부야"
      },
      {
        "ja": "池尻大橋",
        "ko": "이케지리오하시"
      },
      {
        "ja": "三軒茶屋",
        "ko": "산겐자야"
      },
      {
        "ja": "駒沢大学",
        "ko": "코마자와다이가쿠"
      },
      {
        "ja": "桜新町",
        "ko": "사쿠라신마치"
      },
      {
        "ja": "用賀",
        "ko": "요가"
      },
      {
        "ja": "二子玉川",
        "ko": "후타코타마가와"
      },
      {
        "ja": "溝の口",
        "ko": "미조노쿠치"
      },
      {
        "ja": "鷺沼",
        "ko": "사기누마"
      },
      {
        "ja": "たまプラーザ",
        "ko": "타마 플라자"
      },
      {
        "ja": "あざみ野",
        "ko": "아자미노"
      },
      {
        "ja": "青葉台",
        "ko": "아오바다이"
      },
      {
        "ja": "長津田",
        "ko": "나가츠타"
      },
      {
        "ja": "つくし野",
        "ko": "츠쿠시노"
      },
      {
        "ja": "すずかけ台",
        "ko": "스즈카케다이"
      },
      {
        "ja": "南町田グランベリーパーク",
        "ko": "미나미마치다그랑베리파크"
      },
      {
        "ja": "つきみ野",
        "ko": "츠키미노"
      },
      {
        "ja": "中央林間",
        "ko": "츄오린칸"
      }
    ]
  },
  {
    "id": "jp-extra-22007-rapid-express",
    "routeId": "line-22007",
    "operatorId": "seibu",
    "kind": "rapid-express",
    "names": {
      "ja": "快速急行",
      "ko": "쾌속급행",
      "en": "Rapid Express"
    },
    "priority": 45,
    "source": "https://rosen-zu.net/seibu-group/seibu_shinjuku-top/seibu_shinjuku-rosenzu/",
    "sourceSnapshot": "2026-03-14",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003648",
      "station-003508",
      "station-003423",
      "station-003220",
      "station-003131",
      "station-003077",
      "station-003033",
      "station-002991",
      "station-002963",
      "station-002940",
      "station-002895"
    ],
    "stationNames": [
      "西武新宿",
      "高田馬場",
      "田無",
      "東村山",
      "所沢",
      "新所沢",
      "入曽",
      "狭山市",
      "新狭山",
      "南大塚",
      "本川越"
    ],
    "stationDisplayNames": [
      {
        "ja": "西武新宿",
        "ko": "세이부신주쿠"
      },
      {
        "ja": "高田馬場",
        "ko": "타카다노바바"
      },
      {
        "ja": "田無",
        "ko": "타나시"
      },
      {
        "ja": "東村山",
        "ko": "히가시무라야마"
      },
      {
        "ja": "所沢",
        "ko": "토코로자와"
      },
      {
        "ja": "新所沢",
        "ko": "신토코로자와"
      },
      {
        "ja": "入曽",
        "ko": "이리소"
      },
      {
        "ja": "狭山市",
        "ko": "사야마시"
      },
      {
        "ja": "新狭山",
        "ko": "신사야마"
      },
      {
        "ja": "南大塚",
        "ko": "미나미오츠카"
      },
      {
        "ja": "本川越",
        "ko": "혼카와고에"
      }
    ]
  },
  {
    "id": "jp-extra-22007-express",
    "routeId": "line-22007",
    "operatorId": "seibu",
    "kind": "express",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 30,
    "source": "https://rosen-zu.net/seibu-group/seibu_shinjuku-top/seibu_shinjuku-rosenzu/",
    "sourceSnapshot": "2026-03-14",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003648",
      "station-003508",
      "station-003451",
      "station-003427",
      "station-003423",
      "station-003430",
      "station-003340",
      "station-003262",
      "station-003220",
      "station-003131",
      "station-003094",
      "station-003077",
      "station-003033",
      "station-002991",
      "station-002963",
      "station-002940",
      "station-002895"
    ],
    "stationNames": [
      "西武新宿",
      "高田馬場",
      "鷺ノ宮",
      "上石神井",
      "田無",
      "花小金井",
      "小平",
      "久米川",
      "東村山",
      "所沢",
      "航空公園",
      "新所沢",
      "入曽",
      "狭山市",
      "新狭山",
      "南大塚",
      "本川越"
    ],
    "stationDisplayNames": [
      {
        "ja": "西武新宿",
        "ko": "세이부신주쿠"
      },
      {
        "ja": "高田馬場",
        "ko": "타카다노바바"
      },
      {
        "ja": "鷺ノ宮",
        "ko": "사기노미야"
      },
      {
        "ja": "上石神井",
        "ko": "카미샤쿠지이"
      },
      {
        "ja": "田無",
        "ko": "타나시"
      },
      {
        "ja": "花小金井",
        "ko": "하나코가네이"
      },
      {
        "ja": "小平",
        "ko": "코다이라"
      },
      {
        "ja": "久米川",
        "ko": "쿠메카와"
      },
      {
        "ja": "東村山",
        "ko": "히가시무라야마"
      },
      {
        "ja": "所沢",
        "ko": "토코로자와"
      },
      {
        "ja": "航空公園",
        "ko": "코쿠코엔"
      },
      {
        "ja": "新所沢",
        "ko": "신토코로자와"
      },
      {
        "ja": "入曽",
        "ko": "이리소"
      },
      {
        "ja": "狭山市",
        "ko": "사야마시"
      },
      {
        "ja": "新狭山",
        "ko": "신사야마"
      },
      {
        "ja": "南大塚",
        "ko": "미나미오츠카"
      },
      {
        "ja": "本川越",
        "ko": "혼카와고에"
      }
    ]
  },
  {
    "id": "jp-extra-22007-semi-express",
    "routeId": "line-22007",
    "operatorId": "seibu",
    "kind": "semi-express",
    "names": {
      "ja": "準急",
      "ko": "준급",
      "en": "Semi Express"
    },
    "priority": 25,
    "source": "https://rosen-zu.net/seibu-group/seibu_shinjuku-top/seibu_shinjuku-rosenzu/",
    "sourceSnapshot": "2026-03-14",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003648",
      "station-003508",
      "station-003451",
      "station-003427",
      "station-003419",
      "station-003408",
      "station-003409",
      "station-003423",
      "station-003430",
      "station-003340",
      "station-003262",
      "station-003220",
      "station-003131",
      "station-003094",
      "station-003077",
      "station-003033",
      "station-002991",
      "station-002963",
      "station-002940",
      "station-002895"
    ],
    "stationNames": [
      "西武新宿",
      "高田馬場",
      "鷺ノ宮",
      "上石神井",
      "武蔵関",
      "東伏見",
      "西武柳沢",
      "田無",
      "花小金井",
      "小平",
      "久米川",
      "東村山",
      "所沢",
      "航空公園",
      "新所沢",
      "入曽",
      "狭山市",
      "新狭山",
      "南大塚",
      "本川越"
    ],
    "stationDisplayNames": [
      {
        "ja": "西武新宿",
        "ko": "세이부신주쿠"
      },
      {
        "ja": "高田馬場",
        "ko": "타카다노바바"
      },
      {
        "ja": "鷺ノ宮",
        "ko": "사기노미야"
      },
      {
        "ja": "上石神井",
        "ko": "카미샤쿠지이"
      },
      {
        "ja": "武蔵関",
        "ko": "타케쿠라세키"
      },
      {
        "ja": "東伏見",
        "ko": "히가시후시미"
      },
      {
        "ja": "西武柳沢",
        "ko": "세이부야기사와"
      },
      {
        "ja": "田無",
        "ko": "타나시"
      },
      {
        "ja": "花小金井",
        "ko": "하나코가네이"
      },
      {
        "ja": "小平",
        "ko": "코다이라"
      },
      {
        "ja": "久米川",
        "ko": "쿠메카와"
      },
      {
        "ja": "東村山",
        "ko": "히가시무라야마"
      },
      {
        "ja": "所沢",
        "ko": "토코로자와"
      },
      {
        "ja": "航空公園",
        "ko": "코쿠코엔"
      },
      {
        "ja": "新所沢",
        "ko": "신토코로자와"
      },
      {
        "ja": "入曽",
        "ko": "이리소"
      },
      {
        "ja": "狭山市",
        "ko": "사야마시"
      },
      {
        "ja": "新狭山",
        "ko": "신사야마"
      },
      {
        "ja": "南大塚",
        "ko": "미나미오츠카"
      },
      {
        "ja": "本川越",
        "ko": "혼카와고에"
      }
    ]
  },
  {
    "id": "jp-extra-21001-express",
    "routeId": "line-21001",
    "operatorId": "tobu",
    "kind": "express",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 30,
    "source": "https://rosen-zu.net/station-stops-top/station-stops/%E5%B0%8F%E5%B7%9D%E7%94%BA%E5%9F%BC%E7%8E%89%E7%9C%8C%E9%A7%85%E3%81%AE%E8%B7%AF%E7%B7%9A%E5%9B%B3/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003390",
      "station-003156",
      "station-003123",
      "station-003097",
      "station-003061",
      "station-003049",
      "station-002987",
      "station-002909",
      "station-002893",
      "station-002874",
      "station-002852",
      "station-002837",
      "station-2100126",
      "station-002800",
      "station-002753",
      "station-002717",
      "station-002708",
      "station-002710",
      "station-002709",
      "station-1131805"
    ],
    "stationNames": [
      "池袋",
      "成増",
      "和光市",
      "朝霞",
      "朝霞台",
      "志木",
      "ふじみ野",
      "川越",
      "川越市",
      "霞ヶ関",
      "鶴ヶ島",
      "若葉",
      "坂戸",
      "北坂戸",
      "高坂",
      "東松山",
      "森林公園",
      "つきのわ",
      "武蔵嵐山",
      "小川町"
    ],
    "stationDisplayNames": [
      {
        "ja": "池袋",
        "ko": "이케부쿠로"
      },
      {
        "ja": "成増",
        "ko": "나리마스"
      },
      {
        "ja": "和光市",
        "ko": "와코시"
      },
      {
        "ja": "朝霞",
        "ko": "아사카"
      },
      {
        "ja": "朝霞台",
        "ko": "아사카다이"
      },
      {
        "ja": "志木",
        "ko": "시키"
      },
      {
        "ja": "ふじみ野",
        "ko": "후지미노"
      },
      {
        "ja": "川越",
        "ko": "카와고에"
      },
      {
        "ja": "川越市",
        "ko": "카와고에시"
      },
      {
        "ja": "霞ヶ関",
        "ko": "카스미가세키"
      },
      {
        "ja": "鶴ヶ島",
        "ko": "츠루가시마"
      },
      {
        "ja": "若葉",
        "ko": "와카바"
      },
      {
        "ja": "坂戸",
        "ko": "사카도"
      },
      {
        "ja": "北坂戸",
        "ko": "키타사카도"
      },
      {
        "ja": "高坂",
        "ko": "코사카"
      },
      {
        "ja": "東松山",
        "ko": "히가시마츠야마"
      },
      {
        "ja": "森林公園",
        "ko": "신린코엔"
      },
      {
        "ja": "つきのわ",
        "ko": "츠키노와"
      },
      {
        "ja": "武蔵嵐山",
        "ko": "무사시란잔"
      },
      {
        "ja": "小川町",
        "ko": "오가와마치"
      }
    ]
  },
  {
    "id": "jp-extra-24006-express",
    "routeId": "line-24006",
    "operatorId": "keio",
    "kind": "express",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 30,
    "source": "https://rosen-zu.net/keio/keio_inogashira-top/keio_inogashira-rosenzu/",
    "sourceSnapshot": "2025-06-24",
    "scope": "stop-pattern",
    "stationIds": [
      "station-003922",
      "station-003908",
      "station-003846",
      "station-003794",
      "station-003710",
      "station-1131104"
    ],
    "stationNames": [
      "渋谷",
      "下北沢",
      "明大前",
      "永福町",
      "久我山",
      "吉祥寺"
    ],
    "stationDisplayNames": [
      {
        "ja": "渋谷",
        "ko": "시부야"
      },
      {
        "ja": "下北沢",
        "ko": "시모키타자와"
      },
      {
        "ja": "明大前",
        "ko": "메이다이마에"
      },
      {
        "ja": "永福町",
        "ko": "에이후쿠쵸"
      },
      {
        "ja": "久我山",
        "ko": "쿠가야마"
      },
      {
        "ja": "吉祥寺",
        "ko": "키치죠지"
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
