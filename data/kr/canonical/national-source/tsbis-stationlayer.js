'use strict';

const LAYER_NAME_STATION = "stationLayer";

let Station = function() {
	CustomLayer.apply(this, arguments);
};

let selectedStationId = null;
let currentZoom = "";

Station.prototype = new CustomLayer();
Station.prototype.constructor = Station;
Station.prototype.Cycle = 60;

// 전체 정류장
Station.prototype.src_station_url = contextPath + "/station/getWfsStation.do";
Station.prototype.src_param_station = {
	main_searchKeyword : ""
}

// 노선별 정류장 조회
Station.prototype.src_route_url = contextPath + "/station/getWfsRouteStation.do";
Station.prototype.src_param_route = {
	route_id : ""
};

// 주변 정류소 조회
Station.prototype.src_around_station_url = contextPath + "/station/getAroundStationList.do";

Station.prototype.initialize = function() {
	
	var stationIconStyle = new ol.style.Style({
        image: new ol.style.Icon({
            src: contextPath + '/resources/images/search/ic-bus_yellow.png',
            scale: 0.4
        })
    });
    let firstStationStyle = new ol.style.Style({
        image: new ol.style.Icon({
            src: contextPath + '/resources/images/search/ic-bus_yellow.png',
            scale: 0.4
        })
    });

    let lastStationStyle = new ol.style.Style({
        image: new ol.style.Icon({
            src: contextPath + '/resources/images/search/ic-bus_yellow.png',
            scale: 0.4
        })
    });
    
    let selectedStationStyle = new ol.style.Style({
        image: new ol.style.Icon({
            src: contextPath + '/resources/images/search/ic-bus_blue.png',
            scale: 0.4
        })
    });
	
	this.Layer = new ol.layer.Vector({
		name : LAYER_NAME_STATION,
		source : new ol.source.Vector(),
		style : function(feature) {
		
	        if (feature.get('isFirstStation')) {
	            return firstStationStyle;
	        } else if (feature.get('isLastStation')) {
	            return lastStationStyle;
	        } else if (feature.get("station_id") == selectedStationId) {
				return selectedStationStyle;
	        } else {
	            return stationIconStyle;
	        }
            
        }.bind(this)
	});
	this.LayerSource = this.Layer.getSource();
}

// 지도 줌인시 정류소 아이콘 크기 변경
Station.prototype.StationLayerSetStyle = function(zoom) {
    var iconScale = 0.45;
	
	switch (rxMap.getZoom()) {
        case 21: iconScale = 0.6; break;
        case 20: iconScale = 0.57; break;
        case 19: iconScale = 0.54; break;
        case 18: iconScale = 0.5; break;
        case 17: iconScale = 0.47; break;
        case 16: iconScale = 0.44; break;
        case 15: iconScale = 0.4; break;
        case 14: iconScale = 0.37; break;
        case 13: iconScale = 0.34; break;
        default: iconScale = 0.3; break;
    }
    
    var features = this.Layer.getSource().getFeatures();
    for (var i = 0, len = features.length; i < len; i++) {
		
        var feature = features[i];
        var isSelected = (feature.get("station_id") == selectedStationId);
         
        feature.setStyle(new ol.style.Style({
			image : new ol.style.Icon({
				crossOrigin : 'anonymous',
            	src: isSelected ? contextPath + '/resources/images/search/ic-bus_blue.png' : contextPath + '/resources/images/search/ic-bus_yellow.png',         
				scale: iconScale
			})
		}));    
	}
	currentZoom = rxMap.getZoom();
};


// 정류장 조회
Station.prototype.view_all_station = function(data) {
	AjaxJson(this.src_station_url, data, this.view_all_station_loader.bind(this),
			this.view_all_station_loader_error.bind(this));
}

Station.prototype.view_all_station_loader = function(response) {
	let format = new ol.format.GeoJSON();
	let features = format.readFeatures(response, {
		dataProjection : this.MapProjection,
		featureProjection : this.LayerProjection
	});

	this.map.BoundXyToExtentBySearch(Number(response.extent.minx),
      Number(response.extent.miny), Number(response.extent.maxx),
      Number(response.extent.maxy));
         
	this.LayerSource.clear(true);
	this.LayerSource.addFeatures(features);
};

Station.prototype.view_all_station_loader_error = function(request, status, error) {
	console.log("View All Station Get Error : " + request.responseText);
};

// 노선별 정류장 조회
Station.prototype.search_route_station = function(route_id) {
	this.src_param_route = {
		route_id : route_id
	};

	AjaxJson(this.src_route_url, this.src_param_route,
 			this.route_station_loader.bind(this), this.route_station_loader_error.bind(this));
}

Station.prototype.route_station_loader = function(response) {
	
    let format = new ol.format.GeoJSON();
    let features = format.readFeatures(response, {
        dataProjection: this.MapProjection,
        featureProjection: this.LayerProjection
    });

    this.LayerSource.clear(true);

	// 첫 번째와 마지막 feature
    let firstFeature = features[0];
    let lastFeature = features[features.length - 1];
    
 	// 첫 번째와 마지막 feature의 시퀀스
    let firstSequence = firstFeature.getProperties().rnum;
    let lastSequence = lastFeature.getProperties().rnum;

    features.forEach(function(feature) {
        let rnum = feature.get('rnum');
        
		feature.set('isFirstStation', rnum == firstSequence);
        feature.set('isLastStation', rnum == lastSequence);
    });
    
	this.LayerSource.clear(true);
    this.LayerSource.addFeatures(features);
};

Station.prototype.route_station_loader_error = function(request, status, error) {
	console.log("Station get error : " + request.responseText);
};

// 주변 정류소 조회
Station.prototype.search_around_station_station = function() {

	var data = {
		main_searchKeyword : lon,
		sub_searchKeyword : lat,
		extra_searchKeyword : "1.5"
	}

	AjaxJson(this.src_around_station_url, data,
 			this.around_station_loader.bind(this), this.around_station_loader_error.bind(this));
}

Station.prototype.around_station_loader = function(response) {
	
	let format = new ol.format.GeoJSON();
    let features = format.readFeatures(response, {
        dataProjection: this.MapProjection,
        featureProjection: this.LayerProjection
    });

	this.map.BoundXyToExtent(Number(response.extent.minx),
			Number(response.extent.miny), Number(response.extent.maxx),
			Number(response.extent.maxy));
	rxMap.map.updateSize();	
	

    this.LayerSource.clear(true);
	this.LayerSource.addFeatures(features);
};

Station.prototype.around_station_loader_error = function(request, status, error) {
	
	// 현재위치 호출
	rxMap.setCenter(lon, lat);
    rxMap.Zoom(17);
    rxMap.map.updateSize();
   
	// 주변 정류소가 없습니다.
	setTimeout(() => {
	    alert("주변 정류소가 없습니다.");
	}, 0);
	
	console.log("Station get error : " + request.responseText);
};