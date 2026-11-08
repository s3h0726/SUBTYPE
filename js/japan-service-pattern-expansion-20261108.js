/* SUBTYPE Japanese service stopping pattern expansion — 2026-11-08.
 * Station IDs and order checked against existing verified physical routes.
 * These are educational stopping patterns, not claims of a complete 2026 timetable.
 * Add after js/service-data.js and before js/app.bundle.js.
 * Source station sequences: https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/ | https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/keikyu_honsen/ | https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/ | https://rosen-zu.net/seibu-group/seibu_ikebukuro-top/seibu_ikebukuro-rosenzu/seibu_ikebukuro_hanno/
 */
(function(){
  'use strict';
  const catalog=window.TRT_TOKYO_SERVICE_PATTERNS;
  if(!catalog||!Array.isArray(catalog.servicePatterns)||!Array.isArray(catalog.trainTypes)){
    console.warn('[JP services] Missing Tokyo service catalog; skipping additions');
    return;
  }
  const newTypes=[
  {
    "id": "jp20261108-odakyu-rapid-express",
    "operatorId": "odakyu",
    "names": {
      "ja": "快速急行",
      "ko": "쾌속급행",
      "en": "Rapid Express"
    },
    "priority": 44
  },
  {
    "id": "jp20261108-odakyu-express",
    "operatorId": "odakyu",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 34
  },
  {
    "id": "jp20261108-odakyu-commuter-express",
    "operatorId": "odakyu",
    "names": {
      "ja": "通勤急行",
      "ko": "통근급행",
      "en": "Commuter Express"
    },
    "priority": 39
  },
  {
    "id": "jp20261108-keikyu-limited-express",
    "operatorId": "keikyu",
    "names": {
      "ja": "特急",
      "ko": "특급",
      "en": "Limited Express"
    },
    "priority": 46
  },
  {
    "id": "jp20261108-keikyu-rapid-limited",
    "operatorId": "keikyu",
    "names": {
      "ja": "快特（本線区間）",
      "ko": "쾌특(본선 구간)",
      "en": "Rapid Limited Express (main-line section)"
    },
    "priority": 46
  },
  {
    "id": "jp20261108-keio-limited-express",
    "operatorId": "keio",
    "names": {
      "ja": "特急",
      "ko": "특급",
      "en": "Limited Express"
    },
    "priority": 46
  },
  {
    "id": "jp20261108-keio-express",
    "operatorId": "keio",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 34
  },
  {
    "id": "jp20261108-seibu-express",
    "operatorId": "seibu",
    "names": {
      "ja": "急行",
      "ko": "급행",
      "en": "Express"
    },
    "priority": 34
  },
  {
    "id": "jp20261108-seibu-semi-express",
    "operatorId": "seibu",
    "names": {
      "ja": "準急",
      "ko": "준급",
      "en": "Semi Express"
    },
    "priority": 25
  }
];
  const newPatterns=[
  {
    "id": "jp-20261108-25001-rapid-express-forward",
    "baseRouteId": "line-25001",
    "trainTypeId": "jp20261108-odakyu-rapid-express",
    "originStationId": "station-003700",
    "destinationStationId": "station-1130116",
    "directionId": "forward",
    "stopStationIds": [
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
      "station-1130116"
    ],
    "names": {
      "ja": "快速急行 小田原行",
      "ko": "쾌속급행 오다와라행",
      "en": "Rapid Express for 小田原"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-25001-rapid-express-reverse",
    "baseRouteId": "line-25001",
    "trainTypeId": "jp20261108-odakyu-rapid-express",
    "originStationId": "station-1130116",
    "destinationStationId": "station-003700",
    "directionId": "reverse",
    "stopStationIds": [
      "station-1130116",
      "station-005037",
      "station-004981",
      "station-004906",
      "station-004913",
      "station-004909",
      "station-004885",
      "station-004844",
      "station-004771",
      "station-004715",
      "station-004672",
      "station-004426",
      "station-004387",
      "station-004227",
      "station-004130",
      "station-003908",
      "station-003847",
      "station-003700"
    ],
    "names": {
      "ja": "快速急行 新宿行",
      "ko": "쾌속급행 신주쿠행",
      "en": "Rapid Express for 新宿"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-25001-express-forward",
    "baseRouteId": "line-25001",
    "trainTypeId": "jp20261108-odakyu-express",
    "originStationId": "station-003700",
    "destinationStationId": "station-1130116",
    "directionId": "forward",
    "stopStationIds": [
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
    "names": {
      "ja": "急行 小田原行",
      "ko": "급행 오다와라행",
      "en": "Express for 小田原"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-25001-express-reverse",
    "baseRouteId": "line-25001",
    "trainTypeId": "jp20261108-odakyu-express",
    "originStationId": "station-1130116",
    "destinationStationId": "station-003700",
    "directionId": "reverse",
    "stopStationIds": [
      "station-1130116",
      "station-005037",
      "station-004981",
      "station-004906",
      "station-004913",
      "station-004909",
      "station-004885",
      "station-004844",
      "station-004771",
      "station-004715",
      "station-004672",
      "station-004426",
      "station-004387",
      "station-004227",
      "station-004150",
      "station-004130",
      "station-004036",
      "station-003970",
      "station-003908",
      "station-003847",
      "station-003700"
    ],
    "names": {
      "ja": "急行 新宿行",
      "ko": "급행 신주쿠행",
      "en": "Express for 新宿"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-25001-commuter-express-reverse",
    "baseRouteId": "line-25001",
    "trainTypeId": "jp20261108-odakyu-commuter-express",
    "originStationId": "station-004227",
    "destinationStationId": "station-003700",
    "directionId": "reverse",
    "stopStationIds": [
      "station-004227",
      "station-004150",
      "station-004036",
      "station-003908",
      "station-003847",
      "station-003700"
    ],
    "names": {
      "ja": "通勤急行 新宿行",
      "ko": "통근급행 신주쿠행",
      "en": "Commuter Express for 新宿"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-27001-limited-express-forward",
    "baseRouteId": "line-27001",
    "trainTypeId": "jp20261108-keikyu-limited-express",
    "originStationId": "station-004042",
    "destinationStationId": "station-005227",
    "directionId": "forward",
    "stopStationIds": [
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
    "names": {
      "ja": "特急 浦賀行",
      "ko": "특급 우라가행",
      "en": "Limited Express for 浦賀"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/keikyu_honsen/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-27001-limited-express-reverse",
    "baseRouteId": "line-27001",
    "trainTypeId": "jp20261108-keikyu-limited-express",
    "originStationId": "station-005227",
    "destinationStationId": "station-004042",
    "directionId": "reverse",
    "stopStationIds": [
      "station-005227",
      "station-005206",
      "station-005202",
      "station-2700147",
      "station-005163",
      "station-005161",
      "station-005066",
      "station-2700139",
      "station-004986",
      "station-004790",
      "station-1130105",
      "station-004579",
      "station-2700115",
      "station-004331",
      "station-004294",
      "station-004184",
      "station-1130103",
      "station-004042"
    ],
    "names": {
      "ja": "特急 泉岳寺行",
      "ko": "특급 센가쿠지행",
      "en": "Limited Express for 泉岳寺"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/keikyu_honsen/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-27001-rapid-limited-forward",
    "baseRouteId": "line-27001",
    "trainTypeId": "jp20261108-keikyu-rapid-limited",
    "originStationId": "station-004042",
    "destinationStationId": "station-2700147",
    "directionId": "forward",
    "stopStationIds": [
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
    "names": {
      "ja": "快特（本線区間） 堀ノ内行",
      "ko": "쾌특(본선 구간) 호리노우치행",
      "en": "Rapid Limited Express (main-line section) for 堀ノ内"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/keikyu_honsen/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-27001-rapid-limited-reverse",
    "baseRouteId": "line-27001",
    "trainTypeId": "jp20261108-keikyu-rapid-limited",
    "originStationId": "station-2700147",
    "destinationStationId": "station-004042",
    "directionId": "reverse",
    "stopStationIds": [
      "station-2700147",
      "station-005163",
      "station-2700139",
      "station-004986",
      "station-004790",
      "station-1130105",
      "station-2700115",
      "station-004331",
      "station-1130103",
      "station-004042"
    ],
    "names": {
      "ja": "快特（本線区間） 泉岳寺行",
      "ko": "쾌특(본선 구간) 센가쿠지행",
      "en": "Rapid Limited Express (main-line section) for 泉岳寺"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/keikyu_honsen/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-24001-limited-express-forward",
    "baseRouteId": "line-24001",
    "trainTypeId": "jp20261108-keio-limited-express",
    "originStationId": "station-003700",
    "destinationStationId": "station-003934",
    "directionId": "forward",
    "stopStationIds": [
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
    "names": {
      "ja": "特急 京王八王子行",
      "ko": "특급 케이오하치오지행",
      "en": "Limited Express for 京王八王子"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-24001-limited-express-reverse",
    "baseRouteId": "line-24001",
    "trainTypeId": "jp20261108-keio-limited-express",
    "originStationId": "station-003934",
    "destinationStationId": "station-003700",
    "directionId": "reverse",
    "stopStationIds": [
      "station-003934",
      "station-004007",
      "station-003904",
      "station-003971",
      "station-003853",
      "station-003821",
      "station-003966",
      "station-003861",
      "station-003846",
      "station-2400104",
      "station-003700"
    ],
    "names": {
      "ja": "特急 新宿行",
      "ko": "특급 신주쿠행",
      "en": "Limited Express for 新宿"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-24001-express-forward",
    "baseRouteId": "line-24001",
    "trainTypeId": "jp20261108-keio-express",
    "originStationId": "station-003700",
    "destinationStationId": "station-003934",
    "directionId": "forward",
    "stopStationIds": [
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
    "names": {
      "ja": "急行 京王八王子行",
      "ko": "급행 케이오하치오지행",
      "en": "Express for 京王八王子"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-24001-express-reverse",
    "baseRouteId": "line-24001",
    "trainTypeId": "jp20261108-keio-express",
    "originStationId": "station-003934",
    "destinationStationId": "station-003700",
    "directionId": "reverse",
    "stopStationIds": [
      "station-003934",
      "station-004007",
      "station-003904",
      "station-003971",
      "station-003853",
      "station-003821",
      "station-003850",
      "station-003966",
      "station-003933",
      "station-003861",
      "station-003862",
      "station-003846",
      "station-2400104",
      "station-003700"
    ],
    "names": {
      "ja": "急行 新宿行",
      "ko": "급행 신주쿠행",
      "en": "Express for 新宿"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-22001-express-forward",
    "baseRouteId": "line-22001",
    "trainTypeId": "jp20261108-seibu-express",
    "originStationId": "station-003390",
    "destinationStationId": "station-2200125",
    "directionId": "forward",
    "stopStationIds": [
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
    "names": {
      "ja": "急行 飯能行",
      "ko": "급행 한노행",
      "en": "Express for 飯能"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/seibu-group/seibu_ikebukuro-top/seibu_ikebukuro-rosenzu/seibu_ikebukuro_hanno/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-22001-express-reverse",
    "baseRouteId": "line-22001",
    "trainTypeId": "jp20261108-seibu-express",
    "originStationId": "station-2200125",
    "destinationStationId": "station-003390",
    "directionId": "reverse",
    "stopStationIds": [
      "station-2200125",
      "station-003020",
      "station-003028",
      "station-003018",
      "station-003011",
      "station-003050",
      "station-003068",
      "station-003088",
      "station-2200117",
      "station-003131",
      "station-003242",
      "station-003292",
      "station-003390"
    ],
    "names": {
      "ja": "急行 池袋行",
      "ko": "급행 이케부쿠로행",
      "en": "Express for 池袋"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/seibu-group/seibu_ikebukuro-top/seibu_ikebukuro-rosenzu/seibu_ikebukuro_hanno/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-22001-semi-express-forward",
    "baseRouteId": "line-22001",
    "trainTypeId": "jp20261108-seibu-semi-express",
    "originStationId": "station-003390",
    "destinationStationId": "station-2200125",
    "directionId": "forward",
    "stopStationIds": [
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
    "names": {
      "ja": "準急 飯能行",
      "ko": "준급 한노행",
      "en": "Semi Express for 飯能"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/seibu-group/seibu_ikebukuro-top/seibu_ikebukuro-rosenzu/seibu_ikebukuro_hanno/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  },
  {
    "id": "jp-20261108-22001-semi-express-reverse",
    "baseRouteId": "line-22001",
    "trainTypeId": "jp20261108-seibu-semi-express",
    "originStationId": "station-2200125",
    "destinationStationId": "station-003390",
    "directionId": "reverse",
    "stopStationIds": [
      "station-2200125",
      "station-003020",
      "station-003028",
      "station-003018",
      "station-003011",
      "station-003050",
      "station-003068",
      "station-003088",
      "station-2200117",
      "station-003131",
      "station-003151",
      "station-003179",
      "station-003217",
      "station-003242",
      "station-003271",
      "station-003263",
      "station-003292",
      "station-003328",
      "station-003390"
    ],
    "names": {
      "ja": "準急 池袋行",
      "ko": "준급 이케부쿠로행",
      "en": "Semi Express for 池袋"
    },
    "status": "active",
    "reference": {
      "url": "https://rosen-zu.net/seibu-group/seibu_ikebukuro-top/seibu_ikebukuro-rosenzu/seibu_ikebukuro_hanno/",
      "checkedOn": "2026-11-08",
      "type": "stop-pattern-reference",
      "scope": "station-sequence-only"
    }
  }
];
  const existingTypes=new Set(catalog.trainTypes.map(x=>x.id));
  for(const type of newTypes)if(!existingTypes.has(type.id)){catalog.trainTypes.push(type);existingTypes.add(type.id)}
  const existingIds=new Set(catalog.servicePatterns.map(x=>x.id));
  let added=0;
  for(const pattern of newPatterns){
    if(existingIds.has(pattern.id))continue;
    if(pattern.stopStationIds.length<2||new Set(pattern.stopStationIds).size!==pattern.stopStationIds.length){
      console.warn('[JP services] Invalid stop sequence',pattern.id);continue;
    }
    catalog.servicePatterns.push(pattern);existingIds.add(pattern.id);added++;
  }
  window.TRT_JAPAN_SERVICE_EXPANSION={
    version:'2026-11-08',total: newPatterns.length, added,
    affectedRoutes:[...new Set(newPatterns.map(x=>x.baseRouteId))],
    note:'Static route/station-order checked; current departure times and browser playthrough are not verified.'
  };
})();
