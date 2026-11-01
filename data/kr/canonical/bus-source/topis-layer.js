/* =========================================================
 * layer 생성 관련 함수 
 * [daum map layer, 소통상황 layer, road link layer, kml data layer, line layer, icon layer ... ] 
 * ========================================================== */
var MapLayer_Street = null;
var MapLayer_Sky = null;
var MapLayer_Road = null;
var MapLayer_Link_Level_1 = null;
var MapLayer_Link_Level_2 = null;
var MapLayer_Link_Level_3 = null;
var MapLayer_Link_Level_4 = null;
var MapLayer_Traffic_Level_1 = null;
var MapLayer_Traffic_Level_2 = null;
var MapLayer_Traffic_Level_3_1 = null;
var MapLayer_Traffic_Level_3_2 = null;
var MapLayer_Traffic_Level_4 = null;
var MapLayer_Walk_Level = null;			// 보행자 사고 레이어 추가
var MapLayer_ParkInfo = null;
var MapLayer_BicInfo = null;
var MapLayer_CctvInfo = null;
var MapLayer_CarshareInfo = null;
var MapLayer_SubwayInfo = null;
var MapLayer_SubwayInfo2 = null;
var MapLayer_VmsInfo = null;
var MapLayer_BusInfo = null;
var vectorIconLayers = [];
var vectorBusLineLayers = [];
var MapLayer_Traffic2_Level_1 = null;
var MapLayer_Traffic2_Level_2 = null;
var MapLayer_Traffic2_Level_3_1 = null;
var MapLayer_Traffic2_Level_3_2 = null;
var MapLayer_Traffic2_Level_4 = null;

var subZoomLevel = 11;

var wmsUrl = "https://topisgeo.eseoul.go.kr:8443/geoserver/wms";
var TRAFFIC_LAYERS1 = 'utopis:VW_MAP_TRAFFIC1';			//zoom level 6이하
var TRAFFIC_LAYERS2 = 'utopis:VW_MAP_TRAFFIC2';			//zoom level 7
var TRAFFIC_LAYERS3_1 = 'utopis:VW_MAP_TRAFFIC3_1';		//zoom level 8
var TRAFFIC_LAYERS3_2 = 'utopis:VW_MAP_TRAFFIC3_2';		//zoom level 9
var TRAFFIC_LAYERS4 = 'utopis:VW_MAP_TRAFFIC4';			//zoom level 10이상
var WALK_LAYERS = 'utopis:VW_MAP_WALK_ACC';				//보행 사고 (노인,어린이,무단횡단)
var WALK_LAYERS_1 = 'utopis:VW_MAP_WALK_ACC_NEW';		//보행 사고 (1:보행노인사고다발지역정보	)
var wmsUrl2 = "https://topisgeopd.eseoul.go.kr:8443/geoserver/wms";

//// 보행자 사고 정보 호출 source
var walkSource = new ol.source.TileWMS(({ 
	url: wmsUrl,
    serverType: 'geoserver',
    format: 'image/png',
    projection: projection,
    extent: projectionExtent,
    style: 'default',
    crossOrigin : null,
    preload: 0,
    params: { VERSION: '1.1.1',
              LAYERS: WALK_LAYERS,
              TILED: true,
              TRANSPARENT : 'true'
    },
    tileGrid: new ol.tilegrid.TileGrid({
        origin: ol.extent.getTopLeft(projectionExtent),
        resolutions: resolutions
    })
}));

/* ********************************************************
 * 소통상황 layer 생성
 ******************************************************** */
function fn_makeTrafficLayer() {

	//소통이미지 1 layer
	MapLayer_Traffic_Level_1 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS1,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic_Level_1);
	
	//소통이미지2 layer
	MapLayer_Traffic_Level_2 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS2,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic_Level_2);
	
	//소통이미지 3_1 layer
	MapLayer_Traffic_Level_3_1 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS3_1,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic_Level_3_1);
	
	//소통이미지 3_2 layer
	MapLayer_Traffic_Level_3_2 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS3_2,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic_Level_3_2);
	
	//소통이미지 4 layer
	MapLayer_Traffic_Level_4 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS4,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic_Level_4);
}

/* ********************************************************
 * 소통상황 layer 생성
 ******************************************************** */
function fn_makeTrafficLayer2() {

	//소통이미지 1 layer
	MapLayer_Traffic2_Level_1 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl2,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS1,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic2_Level_1);
	
	//소통이미지2 layer
	MapLayer_Traffic2_Level_2 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl2,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS2,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic2_Level_2);
	
	//소통이미지 3_1 layer
	MapLayer_Traffic2_Level_3_1 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl2,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS3_1,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic2_Level_3_1);
	
	//소통이미지 3_2 layer
	MapLayer_Traffic2_Level_3_2 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl2,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS3_2,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic2_Level_3_2);
	
	//소통이미지 4 layer
	MapLayer_Traffic2_Level_4 = new ol.layer.Tile({
	    extent: projectionExtent,
	    projection: projection,
		source: new ol.source.TileWMS(({
			url: wmsUrl2,
	        serverType: 'geoserver',
	        format: 'image/png',
	        projection: projection,
	        extent: projectionExtent,
	        style: 'default',
	        crossOrigin : null,
	        preload: 0,
	        params: { VERSION: '1.1.1',
	                  LAYERS: TRAFFIC_LAYERS4,
	                  TILED: true,
	                  TRANSPARENT : 'true'
	        },
	        tileGrid: new ol.tilegrid.TileGrid({
	            origin: ol.extent.getTopLeft(projectionExtent),
	            resolutions: resolutions
	        })
		}))
	});
	map.addLayer(MapLayer_Traffic2_Level_4);
}

/* ********************************************************
 * main map layer 생성
 ******************************************************** */
function fn_makeMainLayer(layer) {
	if (layer == "MapLayer_ParkInfo") {
		//주차장 정보
		MapLayer_ParkInfo = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: '/map/parkKml.do',
				format: new ol.format.KML({
					showPointNames: false
				})
			})
		});
		map.addLayer(MapLayer_ParkInfo);
	}

	if (layer == "MapLayer_BicInfo") {
		//자전거 정보
		MapLayer_BicInfo = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: '/map/bicKml.do',
				format: new ol.format.KML({
					showPointNames: false
				})
			})
		});
		map.addLayer(MapLayer_BicInfo);
	}

	if (layer == "MapLayer_CctvInfo") {
		//CCTV 정보
		MapLayer_CctvInfo = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: '/map/cctvKml.do',
				format: new ol.format.KML({
					showPointNames: false
				})
			})
		});
		map.addLayer(MapLayer_CctvInfo);
	}
		
	if (layer == "MapLayer_CarshareInfo") {
		//나눔카 정보
		MapLayer_CarshareInfo = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: '/map/carshareKml.do',
				format: new ol.format.KML({
					showPointNames: false
				})
			})
		});
		map.addLayer(MapLayer_CarshareInfo);
	}

	if (layer == "MapLayer_SubwayInfo") {
		//지하철역 정보
		MapLayer_SubwayInfo = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: '/map/subwayKml.do',
				format: new ol.format.KML({
					showPointNames: false
				})
			})
		});
		map.addLayer(MapLayer_SubwayInfo);
	}

	if (layer == "MapLayer_VmsInfo") {
		//VMS 정보
		MapLayer_VmsInfo = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: '/map/vmsKml.do',
				format: new ol.format.KML({
					showPointNames: false
				})
			})
		});
		map.addLayer(MapLayer_VmsInfo);
	}
	
	if (layer == "MapLayer_BusInfo") {
		//버스 정보
		MapLayer_BusInfo = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: '/map/busKml.do',
				format: new ol.format.KML({
					showPointNames: false
				})
			})
		});
		map.addLayer(MapLayer_BusInfo);
	}
	
	if (layer == "MapLayer_SubwayInfo2") {
		//지하철역 정보
		MapLayer_SubwayInfo2 = new ol.layer.Vector({
			source: new ol.source.Vector({
				url: '/map/subwayKml2.do', 
				format: new ol.format.KML({
					showPointNames: false
				})
			})
		});
		map.addLayer(MapLayer_SubwayInfo2);
	}
}

/* ********************************************************
 * line layer 생성
 ******************************************************** */
var vectorLineLayer = null;
function makeLineLayer(coordinates, linkId, pointFlag, color){
	if(color == undefined){
		color = '#0000ff';
	}

	var lineString = new ol.geom.LineString(coordinates);
	if(hpMapDivCd == "N" || hpMapDivCd == "S"){
		lineString.transform('EPSG:5181',epsgDaum);
	}
	var lwidth = [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 6, 10];	//선굵기
	var idx = map.getView().getZoom();
	
	vectorLineLayer = new ol.layer.Vector({
		name: "Link" + linkId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: linkId,
	            linkId:linkId
	        })]
	    }),
	    style: new ol.style.Style({
	        stroke: new ol.style.Stroke({
	            color: color,
	            width: lwidth[idx],
	            pointRadius: 6
	        })
	    })
	}); 

	//vectorLineLayer.setOpacity(0.7);
	map.addLayer(vectorLineLayer);

	if(pointFlag != null && pointFlag != undefined && pointFlag == 'Y'){	//선끝에 표인트 표시
		
		var iconPoint = new ol.geom.Point( coordinates[coordinates.length-1] );
		//iconPoint.transform(epsg4326, epsgDaum);
		if(hpMapDivCd == "N" || hpMapDivCd == "S") {
			iconPoint.transform('EPSG:5181',epsgDaum);
		}
		vectorIconLayer = new ol.layer.Vector({
			name: 'LinkIcon' + linkId,
		    source: new ol.source.Vector({
		        features: [new ol.Feature({
		            geometry: iconPoint,
		            name: 'LinkIcon' + linkId,
		            desc: linkId,
		            draggable: false,
		            coordinates: coordinates[coordinates.length-1],
		            data: {}
		        })]
		    }),
			style: new ol.style.Style({
				image: new ol.style.Icon(({
					//anchor: [4, 29], //아이콘 크기에 따라 유동적으로 변경 필요
					anchorXUnits: 'pixels',
					anchorYUnits: 'pixels',
					src: '/images/map/icon_point.png'
				}))
			})
		}); 
		
		map.addLayer(vectorIconLayer);
		vectorIconLayers.push(vectorIconLayer);
	}
}

/* ********************************************************
 * 돌발 icon layer 생성
 * 돌발정보는 KML파일로 가지고 있지 않고 매번 조회해서 생성 하므로 레이어 따로 생성
 ******************************************************** */
var vectorAccIconLayer = null;
var vectorAccIconLayers = [];
function makeAccIconLayer(coordinate, linkId, icon, desc, data, transform){
	if (transform == undefined) {
		transform = false;
		if(hpMapDivCd == "N" || hpMapDivCd == "S"){
			var coordinates = ol.proj.transform(coordinate,'EPSG:5181', epsgDaum);
		}
	}
	
	if (icon == undefined) {
		icon = '/common/img/map/tit_pin_on.png';
	}
	
	if (linkId == undefined) {
		linkId = '99999';
	}
	
	if (desc == undefined) {
		desc = linkId;
	}
	
	if (data == undefined) {
		data = {};
	}
	
	var iconImg = new Image();
	iconImg.src = icon;
	
	var iconWidth;
	var iconHeight;
	
	//이미지 로드 후 아이콘 그리기
	iconImg.onload = function() {
		iconWidth = parseInt(iconImg.width);
		iconHeight = parseInt(iconImg.height);
		
		iconWidth = iconWidth / 2;
		iconHeight = iconHeight / 2;
		
		
		if(hpMapDivCd =="N" || hpMapDivCd == "S") var iconPoint = new ol.geom.Point(coordinates);
		else var iconPoint = new ol.geom.Point(coordinate); 
		
		if (transform == true) {
			iconPoint.transform(epsg4326, epsgDaum);
		}
					
		vectorAccIconLayer = new ol.layer.Vector({
			name: 'Icon' + linkId,
		    source: new ol.source.Vector({
		        features: [new ol.Feature({
		            geometry: iconPoint,
		            name: 'Icon' + linkId,
		            code: linkId,
		            desc: desc,
		            draggable: false,
		            coordinates: coordinate,
		            layerGubn: data.layerGubn,
		            data: data
		        })]
		    }),
			style: new ol.style.Style({
				image: new ol.style.Icon(({
					anchor: [iconWidth, iconHeight], //아이콘 크기에 따라 유동적으로 변경 필요
					anchorXUnits: 'pixels',
					anchorYUnits: 'pixels',
					src: icon
				}))
			})
		}); 
		map.addLayer(vectorAccIconLayer);
		vectorAccIconLayers.push(vectorAccIconLayer);
    };
}

/* ********************************************************
 * icon layer 생성
 ******************************************************** */
function makeIconLayer(coordinates, linkId, icon, desc, data, transform, customVectorIconLayers) {
	if (transform == undefined) {
		transform = false;
	}
	
	if (icon == undefined) {
		icon = '/common/img/map/tit_pin_on.png';
	}
	
	if (linkId == undefined) {
		linkId = '99999';
	}
	
	if (desc == undefined) {
		desc = linkId;
	}
	
	if (data == undefined) {
		data = {};
	}
	
	var iconImg = new Image();
	iconImg.src = icon;
	
	var iconWidth;
	var iconHeight;
	
	//이미지 로드 후 아이콘 그리기
	iconImg.onload = function() {
		iconWidth = parseInt(iconImg.width);
		iconHeight = parseInt(iconImg.height);
		
		if (linkId == "_StartFlag" || linkId == "_EndFlag" || linkId == "_Via1Flag" || linkId == "_Via2Flag" || linkId == "_GetOn"  || linkId == "_GetOff" ) { //경탐 출발/도착/경유/승차/하차
			iconWidth = (iconWidth / 2);
		} else {
			iconWidth = iconWidth / 2;
			iconHeight = iconHeight / 2;
		}
		
		var iconPoint = new ol.geom.Point(coordinates);
		
		
		
		if(transform == true){		
			iconPoint.transform(epsg4326, epsgDaum);
		}
					
		vectorIconLayer = new ol.layer.Vector({
			name: 'Icon' + linkId,
		    source: new ol.source.Vector({
		        features: [new ol.Feature({
		            geometry: iconPoint,
		            name: 'Icon' + linkId,
		            code: linkId,
		            desc: desc,
		            draggable: false,
		            coordinates: coordinates,
		            layerGubn : data.layerGubn,
		            data: data
		        })]
		    }),
			style: new ol.style.Style({
				image: new ol.style.Icon(({
					anchor: [iconWidth, iconHeight], //아이콘 크기에 따라 유동적으로 변경 필요
					anchorXUnits: 'pixels',
					anchorYUnits: 'pixels',
					src: icon
				}))
			})
		}); 
		
		map.addLayer(vectorIconLayer);
		if (customVectorIconLayers == undefined) vectorIconLayers.push(vectorIconLayer);
		else customVectorIconLayers.push(vectorIconLayer);
    };
}

/* ********************************************************
 * BUS line layer 생성
 ******************************************************** */
var vectorBusLineLayer = [];
var vectorBusLineLayer2 = [];
var vectorBusLineLayer3 = [];
function makeBusLineLayer(coordinates, routId, color) {
	if (color == undefined) {
		color = 'rgba(0, 179, 253, 1)';
	}
	
	var lineString = new ol.geom.LineString(coordinates);
	var idx = map.getView().getZoom();
	
	var lineStyle1 = new ol.style.Style({ // 테두리
          stroke: new ol.style.Stroke({
              color: 'rgba(255, 0, 0, 1)',
              lineCap: 'square', //butt
              lineJoin: 'round',
              width: 8
          })
    });
    
    var lineStyle2 = function(feature) {
		var geometry = feature.getGeometry();
		var styles = [
			// linestring
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: color,
					width: 6
				})
			})
        ];
		
		geometry.forEachSegment(function(start, end) {
        	if (lineString.getLastCoordinate()[0] == end[0] && lineString.getLastCoordinate()[1] == end[1]) {
				var dx = end[0] - start[0];
				var dy = end[1] - start[1];
				var rotation = Math.atan2(dy, dx);
				// arrows
				styles.push(new ol.style.Style({
					geometry: new ol.geom.Point(end),
					/*image: new ol.style.RegularShape({
			            fill: new ol.style.Fill({color: color}),
			            stroke: new ol.style.Stroke({color: 'rgba(255, 0, 0, 1)', width: 1}),
			            points: 3, //삼각형
			            radius: 12, //크기
			            rotation: -rotation,
			            rotateWithView: true,
			            angle: Math.PI / 2
			        })*/
					image: new ol.style.Icon({
						src: "/common/img/map/arrow_br.png",
						anchor: [1, 0.5],
						rotateWithView: true,
						rotation: -rotation
	            	})
	          	}));
			}
        });

        return styles;
	};

    var lineStyle3 = new ol.style.Style({ // 라인 안 점선 
          stroke: new ol.style.Stroke({
              color: 'rgba(255, 255, 255, 1)',
              lineDash: [1, 5],
              width: 2
          })
    });
	
	var vectorBusLineLayer1 = new ol.layer.Vector({
		name: "Bus" + routId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: "",
	            axisCd:routId
	        })]
	    }),
	    style: lineStyle1
	});
	
	vectorBusLineLayer.push(vectorBusLineLayer1);
	
	var vectorBusLineLayer12 = new ol.layer.Vector({
		name: "Bus" + routId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: "",
	            axisCd:routId
	        })]
	    }),
	    style: lineStyle2
	});
	
	vectorBusLineLayer2.push(vectorBusLineLayer12);
	
	var vectorBusLineLayer13 = new ol.layer.Vector({
		name: "Bus" + routId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: "",
	            axisCd:routId
	        })]
	    }),
	    style: lineStyle3
	});
	
	vectorBusLineLayer3.push(vectorBusLineLayer13);
	
	map.addLayer(vectorBusLineLayer1);
	map.addLayer(vectorBusLineLayer12);
	map.addLayer(vectorBusLineLayer13);
}

/* ********************************************************
 * Road line layer 생성
 ******************************************************** */
var vectorRoadLineLayer = null;
function makeRoadLineLayer(coordinates, axisCd, color){
	if(color == undefined){
		color = '#ff0000';
	}
 
	var lineString = new ol.geom.LineString(coordinates);
	if(hpMapDivCd == "N" || hpMapDivCd == "S") {
		lineString.transform("EPSG:5181",epsgDaum);
	}
	//var lwidth = [3, 3, 6, 6, 9, 9, 12, 12, 15, 15, 18, 18, 21, 21, 24, 24, 27, 27, 30, 30];	//선굵기
	var idx = map.getView().getZoom();	
	
	vectorRoadLineLayer = new ol.layer.Vector({
		name: "Road" + axisCd,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: axisCd,
	            axisCd:axisCd
	        })]
	    }),
	    style: new ol.style.Style({
	        stroke: new ol.style.Stroke({
	            color: color,
	            width: 20,
	            pointRadius: 6
	        })
	    })
	}); 
	
	vectorRoadLineLayer.setOpacity(0.3);
	
	map.addLayer(vectorRoadLineLayer);	
}

/* ********************************************************
 * Route line layer 생성
 ******************************************************** */
var vectorLineLayer2 = null;
var vectorLineLayer3 = null;
function makeRouteLineLayer(coordinates, linkId, pointFlag, color){
	if(color == undefined){
		color = 'rgba(0, 179, 253, 1)';
	}

	var lineString = new ol.geom.LineString(coordinates);
	if(hpMapDivCd == "N" || hpMapDivCd == "S") {
		lineString.transform("EPSG:5181",epsgDaum);
	}
	//var lwidth = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];	//선굵기
	var lwidth = [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 6, 10];	//선굵기
	var idx = map.getView().getZoom();
	
	var lineStyle1 = new ol.style.Style({ // 테두리
          stroke: new ol.style.Stroke({
              color: 'rgba(255, 0, 0, 1)',
              lineCap: 'square',
              lineJoin: 'round',
              width: 8
          })
    });

    var lineStyle2 = new ol.style.Style({ // 서라인색상 
          stroke: new ol.style.Stroke({
              color: color,
              lineCap: 'square',
              width: 6
          })
    });

    var lineStyle3 = new ol.style.Style({ // 라인 안 점선 
          stroke: new ol.style.Stroke({
              color: 'rgba(255, 255, 255, 1)',
              lineDash: [1, 5],
              width: 2
          })
    });
	
	vectorLineLayer = new ol.layer.Vector({
		name: "Link" + linkId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: linkId,
	            linkId:linkId
	        })]
	    }),
	    style: lineStyle1/*new ol.style.Style({
	        stroke: new ol.style.Stroke({
	            color: color,
	            width: lwidth[idx],
	            pointRadius: 6
	        })
	    })*/
	}); 
	
	vectorLineLayer2 = new ol.layer.Vector({
		name: "Link" + linkId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: linkId,
	            linkId:linkId
	        })]
	    }),
	    style: lineStyle2
	}); 
	
	vectorLineLayer3 = new ol.layer.Vector({
		name: "Link" + linkId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: linkId,
	            linkId:linkId
	        })]
	    }),
	    style: lineStyle3
	}); 

	//vectorLineLayer.setOpacity(0.7);
	map.addLayer(vectorLineLayer);
	map.addLayer(vectorLineLayer2);
	map.addLayer(vectorLineLayer3);

	if(pointFlag != null && pointFlag != undefined && pointFlag == 'Y'){	//선끝에 표인트 표시
		
		var iconPoint = new ol.geom.Point( coordinates[coordinates.length-1] );
		//iconPoint.transform(epsg4326, epsgDaum);
		
		vectorIconLayer = new ol.layer.Vector({
			name: 'LinkIcon' + linkId,
		    source: new ol.source.Vector({
		        features: [new ol.Feature({
		            geometry: iconPoint,
		            name: 'LinkIcon' + linkId,
		            desc: linkId,
		            draggable: false,
		            coordinates: coordinates[coordinates.length-1],
		            data: {}
		        })]
		    }),
			style: new ol.style.Style({
				image: new ol.style.Icon(({
					//anchor: [4, 29], //아이콘 크기에 따라 유동적으로 변경 필요
					anchorXUnits: 'pixels',
					anchorYUnits: 'pixels',
					src: '/images/map/icon_point.png'
				}))
			})
		}); 
		
		map.addLayer(vectorIconLayer);
		vectorIconLayers.push(vectorIconLayer);
	}
}

function makeRouteLineLayer2(coordinates, linkId, pointFlag, color){
	if (color == undefined) {
		color = '#0000ff';
	}

	var lineString = new ol.geom.LineString(coordinates);
	
	vectorLineLayer = new ol.layer.Vector({
		name: "Link" + linkId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: linkId,
	            linkId:linkId
	        })]
	    }),
	    style: new ol.style.Style({
	        stroke: new ol.style.Stroke({
	            color: color,
	            width: 6,
	            pointRadius: 6
	        })
	    })
	});
	
	map.addLayer(vectorLineLayer);
}

/* ********************************************************
 * BUS line layers 생성
 ******************************************************** */
function makeBusLineLayers(coordinates, routId, color){
	
	var vectorBusLineLayer9 = null;

	if(color == undefined){
		color = '#00B3FD';
	}
	
	if (vectorBusLineLayer9 != null) {
	 	map.removeLayer(vectorBusLineLayer9);
	}
	
	var lineString = new ol.geom.LineString(coordinates);
	//var lwidth = [3, 3, 6, 6, 9, 9, 12, 12, 15, 15, 18, 18, 21, 21, 24, 24, 27, 27, 30, 30];	//선굵기
	var idx = map.getView().getZoom();	
	
	vectorBusLineLayer9 = new ol.layer.Vector({
		name: "Bus" + routId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: routId,
	            axisCd:routId
	        })]
	    }),
	    style: new ol.style.Style({
	        stroke: new ol.style.Stroke({
	            color: color,
	            opacity: 0.1,
	            width: 5,
	            pointRadius: 6
	        })
	    })
	}); 
	
	map.addLayer(vectorBusLineLayer9);
	vectorBusLineLayers.push(vectorBusLineLayer9);
	
}

/* ********************************************************
 * Subway line layer 생성
 ******************************************************** */
var vectorSubLineLayer = null;
function makeSubLineLayer(coordinates, routeId, color){
	
	var lineString = new ol.geom.LineString(coordinates);
	//var lwidth = [3, 3, 6, 6, 9, 9, 12, 12, 15, 15, 18, 18, 21, 21, 24, 24, 27, 27, 30, 30];	//선굵기
	var idx = map.getView().getZoom();	
	
	vectorSubLineLayer = new ol.layer.Vector({
		name: "Sub" + routeId,
	    source: new ol.source.Vector({
	        features: [new ol.Feature({
	            geometry: lineString,
	            name: routeId,
	            axisCd:routeId
	        })]
	    }),
	    style: new ol.style.Style({
	        stroke: new ol.style.Stroke({
	            color: color,
	            opacity: 0.1,
	            width: 5,
	            pointRadius: 6
	        })
	    })
	}); 
	
	map.addLayer(vectorSubLineLayer);
	
}