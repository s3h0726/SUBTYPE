'use strict';

const LAYER_NAME_ROUTE = "routeLayer";

let Route = function() {
	CustomLayer.apply(this, arguments);
};

Route.prototype = new CustomLayer();
Route.prototype.constructor = Node;
Route.prototype.Cycle = 60;
Route.prototype.src_line_url = contextPath + "/route/getWfsRoute.do";
Route.prototype.region_boundXY_url = contextPath + "/route/getRegionBoundXY.do";
Route.prototype.src_param_route = {
	route_id : ""
};

Route.prototype.initialize = function() {
	this.Layer = new ol.layer.Vector({
		name : LAYER_NAME_ROUTE,
		source : new ol.source.Vector(),
		style : function(feature) {
			if (feature.get('up_down') == '0') {
				// 상행
				return new ol.style.Style({
					fill : new ol.style.Fill({
						color : 'rgba(255,255,255, 0.4)'
					}),
					stroke : new ol.style.Stroke({
					color : 'rgba(255,0,0, 0.7)',
						width : 2
					})
				});
			}
			// 하행
			return new ol.style.Style({
				fill : new ol.style.Fill({
					color : 'rgba(255,255,255, 0.4)'
				}),
				stroke : new ol.style.Stroke({
					color : 'rgba(0,0,255, 0.7)',
					width : 2
				})
			});
		}
	});
	this.LayerSource = this.Layer.getSource();
}

// 지도 줌인시 노선 굵기 변경
Route.prototype.RouteLayerSetStyle = function(zoom) {
	var line_width = 2;
	switch (rxMap.getZoom()) {
		case 21 : line_width = 7; break;
		case 20 : line_width = 6; break;
		case 19 : line_width = 5; break;
		case 18 : line_width = 4.5; break;
		case 17 : line_width = 4; break;
		case 16 : line_width = 3.5; break;
		case 15 : line_width = 3; break;
		case 14 : line_width = 2.5; break;
		default : line_width = 2; break;
	}

	var features = rxMap.route.LayerSource.getFeatures();
	for (var i = 0, len = features.length; i < len; i++) {
		if (features[i].get('up_down') == '0') {
			features[i].setStyle(null);
			// 상행
			features[i].setStyle(new ol.style.Style({
				fill : new ol.style.Fill({
					color : 'rgba(255,255,255, 0.4)'
				}),
				stroke : new ol.style.Stroke({
					color : 'rgba(255,0,0, 0.7)',
					width : line_width
				})
			}));
		} else {
			// 하행
			features[i].setStyle(new ol.style.Style({
				fill : new ol.style.Fill({
					color : 'rgba(255,255,255, 0.4)'
				}),
				stroke : new ol.style.Stroke({
					color : 'rgba(0,0,255, 0.7)',
					width : line_width
				})
			}));
		}
	}
};

// 노선 조회
Route.prototype.search_route_line = function(route_id) {
	this.src_param_route = {
		route_id : route_id
	};
	AjaxJson(this.src_line_url, this.src_param_route, this.route_line_loader
			.bind(this), this.route_line_loader_error.bind(this));
};

Route.prototype.route_line_loader = function(response) {
	
	let format = new ol.format.GeoJSON();
	let features = format.readFeatures(response, {
		dataProjection : this.MapProjection,
		featureProjection : this.LayerProjection
	});

	this.LayerSource.clear(true);
	this.LayerSource.addFeatures(features);
	
	this.map.BoundXyToExtent(Number(response.extent.minx),
			Number(response.extent.miny), Number(response.extent.maxx),
			Number(response.extent.maxy));
			
	rxMap.station.search_route_station(response.features[0].properties.route_id);
};

Route.prototype.route_line_loader_error = function(request,status,error) {
	console.log("Route Line get error :" + status + "\n" + "message:"+request.responseText + "\n" + "error:" + error);
};

// 지도 지역별 초기 bound 셋팅
Route.prototype.set_region_extent = function(get_admin_id) {
	AjaxJson(this.region_boundXY_url, {
			admin_id : get_admin_id
		}, this.set_region_extent_loader.bind(this), this.set_region_extent_error.bind(this));
};

// 지도 지역별 초기 bound 셋팅 1
Route.prototype.set_region_extent_loader = function(response) {
	this.map.BoundXyToExtent(Number(response.min_coords_x),
		Number(response.min_coords_y), Number(response.max_coords_x),
		Number(response.max_coords_y));
	
	// 지자체 라인 생성
	rxMap.region.set_region_line($("#adminId").val());
};

Route.prototype.set_region_extent_error = function(request,status,error) {
	console.log("Set Region Extent get error :" + status + "\n" + "message:"+request.responseText + "\n" + "error:" + error);
};