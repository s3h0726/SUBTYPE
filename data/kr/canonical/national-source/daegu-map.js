var bsObject = {};
var modalSearch = false;

var ZMAP = {
    init: function(options, onComplete) {
        ZMAP.initResource(options);

        $('body').click(function() {
            ZMAP.closePopup();
        });
        map.events.on({
            movestart: function(event) {
                ZMAP.closePopup();
            }
        });

        map.events.register('moveend', map, ZMAP.onMoveEnd);
        map.events.register('zoomend', map, ZMAP.onZoomEnd);
        map.addLayer(ZMAP.measureCoordLayer);
        map.addControl(ZMAP.hoverCtrl);
        ZMAP.hoverCtrl.activate();
        map.addControl(ZMAP.clickCtrl);
        ZMAP.clickCtrl.activate();
        ZMAP.addDefaultLayers();

        map.addLayer(ZMAP.measureLayer);
        ZMAP.resetMap();

        if (window.onunload) {
            var unload = window.onunload;
            window.onunload = function() {
                ZMAP.destroy();
                unload();
            };
        } else {
            window.onunload = ZMAP.destroy;
        }

        if (ZMAP.options.addDefaultTools) {
            ZMAP.addDefaultTools();
        }

        if (onComplete) {
            onComplete();
        }
        
    },

    destroy: function() {
        ZMAP.hoverCtrl.destroy(); // for IE
    },

    transform: function(lon, lat, geographic) {
        var lonlat = new OpenLayers.Geometry.Point(lon, lat);
        lonlat.transform(geographic, ZMAP.mercator);
        return lonlat;
    },

    resetMap: function() {
        var popups = map.popups;
        if (popups) {
            var cnt = popups.length - 1;
            for (var i = cnt; i >= 0; i--) {
                var popup = popups[i];
                if (popup != null) {
                    popup.destroy();
                }
            }
        }

        ZMAP.onUnSelectFeature();
        ZMAP.options.resetTool();
        ZMAP.measureLayer.destroyFeatures(ZMAP.measureLayer.features);

        map.setCenter(ZMAP.options.center, ZMAP.options.initZoom);
    },

    addDefaultLayers: function() {
        var layersInfo = ZMAP.layerInfo;
        var layerId = null;
        var layer = null;

        for (var layerId in layersInfo) {
            var layerInfo = layersInfo[layerId];
            var styleMaps = [new OpenLayers.StyleMap(), null];
            var styleMap = styleMaps[0];
            var strategies = [new OpenLayers.Strategy.Fixed()];

            styleMap.addUniqueValueRules('default', 'style', layerInfo.symbolizers);

            if (layerInfo.cluster) {
                strategies.push(new OpenLayers.Strategy.Cluster(layerInfo.cluster.option));
                styleMap.styles['default'].addRules([new OpenLayers.Rule({
                    elseFilter: true,
                    symbolizer: layerInfo.cluster.style['default']
                })]);
                styleMap.styles['select'].addRules([new OpenLayers.Rule({
                    elseFilter: true,
                    symbolizer: layerInfo.cluster.style.select
                })]);
                styleMap.styles['default'].context = layerInfo.cluster.styleContext;
            }

            if (layerInfo.symbolizersZI) {
                var styleMapZI = new OpenLayers.StyleMap();

                styleMapZI.addUniqueValueRules('default', 'style', layerInfo.symbolizersZI);
                styleMapZI.styles['default'].addRules([new OpenLayers.Rule({
                    elseFilter: true,
                    symbolizer: layerInfo.cluster.style['default']
                })]);
                styleMapZI.styles['select'].addRules([new OpenLayers.Rule({
                    elseFilter: true,
                    symbolizer: layerInfo.cluster.style.select
                })]);
                styleMapZI.styles['default'].context = layerInfo.cluster.styleContext;

                styleMaps[1] = styleMapZI;
            }

            layer = new OpenLayers.Layer.Vector(layerId, {
                strategies: strategies,
                projection: new OpenLayers.Projection('EPSG:5187'),
                protocol: new OpenLayers.Protocol.WFS({
                    version: '1.1.0',
                    url: CONFIG.apiPrefix + '/wfs',
                    featurePrefix: 'bms',
                    featureType: layerId,
                    featureNS: 'http://businfo.daegu.go.kr',
                    srsName: 'EPSG:5187',
                    geometryName: 'geom',
                    outputFormat: 'JSON',
                    headers: {
                        'Accept-Language': $Z.locale
                    }
                }),
                styleMap: styleMap,
                styleMaps: styleMaps,
                //filter: new OpenLayers.Filter.FeatureId({
                //    fids: ['1500015300']
                //}),
                maxResolution: layerInfo.maxResolution,
                eventListeners: {
                    loadend: ZMAP.onLoadLayer
                }
            });
            ZMAP.layer[layerId] = layer;
            layer.fit = false;
            layer.setVisibility(true);
            map.addLayer(layer);
        }

        ZMAP.layer.route.events.on({
            loadend: function(event) {
                var layer = event.object;
                ZMAP.zoomToExtent(layer);
                if (layer.loadend) {
                    layer.loadend();
                    delete layer.loadend;
                }
            }
        });

        // 아이콘 클릭/마우스오버 처리
        var selectCtrl = new OpenLayers.Control.SelectFeature([ZMAP.layer.bs, ZMAP.layer.vhcPos], {
            //onSelect: $.noop,
            //onUnselect: $.noop,
            callbacks: {
                over: function(feature) {
                    ZMAP.onSelectFeature(feature);
                },
                click: function(feature) {
                    var layerId = (feature.layer ? feature.layer : feature.parent.layer).name;
                    if (layerId == "vhcPos" && vhcMode == "UPGPS") {
                        showNaviPanel(feature.fid);
                        vhcScrollAuto(feature.fid);
                    }
                    ZMAP.onSelectFeature(feature);
                },
                out: function(feature) {
                    ZMAP.onUnSelectFeature(feature);
                }
            }
        });

        map.addControl(selectCtrl);
        selectCtrl.activate();
    },

    getEmptyLayer: function(id) {
        var layer = ZMAP.layer[id];

        if (layer.CLASS_NAME == 'OpenLayers.Layer.Vector') {
            layer.destroyFeatures();
        } else if (layer.CLASS_NAME == 'OpenLayers.Layer.Markers') {
            var m = null;
            while (m = ZMAP.marker[id].pop()) {
                layer.removeMarker(m);
                m.destroy();
            }
        }

        return layer;
    },

    hideLayers: function(ids, destroyFeatures) {
        if (!ids) {
            ids = [];
        }

        for (var i = 0, cnt = ids.length; i < cnt; i++) {
            var id = ids[i];
            if (ZMAP.layer[id]) {
                if (destroyFeatures) {
                    ZMAP.getEmptyLayer(id);
                }
                ZMAP.layer[id].setVisibility(false);
            }
        }

        var popups = map.popups;
        if (popups) {
            var cnt = popups.length - 1;
            for (var i = cnt; i >= 0; i--) {
                var popup = popups[i];
                if (popup != null) {
                    popup.destroy();
                }
            }
        }
    },

    toggleLayer: function(id, show) {
        var layer = ZMAP.layer[id];
        if (layer) {
            layer.fit = false;
            layer.setVisibility(show);
        }
    },

    addDefaultTools: function() {
        map.addControls([
            new OpenLayers.Control.Attribution(),
            ZMAP.naviCtrl,
            new OpenLayers.Control.ZoomBar({
                alignRight: true,
                zoomInOut: true,
                btSize: {
                    w: 20
                }
            }),
            ZMAP.navHistCtrl,
            //ZMAP.mousePosCtrl,
            //new OpenLayers.Control.NavToolbar(),
            new OpenLayers.Control.KeyboardDefaults()
        ]);

        var tools = {
            zoomBox: new OpenLayers.Control.ZoomBox({
                zoomOnClick: false,
                eventListeners: {
                    activate: function(event) {
                        this.map.div.style.cursor = 'crosshair';
                    },
                    deactivate: function(event) {
                        this.map.div.style.cursor = 'default';
                    }
                }
            })
        };

        if ($('#map-tooltip').length == 0) {
            $('#' + map.options.div).append('<div id="map-tooltip" style="display: none; position: absolute; padding: 5px; border: 2px solid #aaa; background: #fff; z-index: 9999;">마우스를<br>더블클릭하면 마침</div>');
        }

        var sketchSymbolizers = {
            Point: {
                pointRadius: 4,
                fillColor: 'white',
                fillOpacity: 0.3,
                strokeWidth: 3,
                strokeOpacity: 1,
                strokeColor: '#00ff00'
            },
            Line: {
                strokeWidth: 3,
                strokeOpacity: 0.5,
                strokeColor: 'red',
            },
            Polygon: {
                strokeWidth: 3,
                strokeOpacity: 0.5,
                strokeColor: 'blue',
                fillColor: 'blue',
                fillOpacity: 0.2
            }
        };
        var style = new OpenLayers.Style();
        style.addRules([new OpenLayers.Rule({
            symbolizer: sketchSymbolizers
        })]);
        var styleMap = new OpenLayers.StyleMap({
            'default': style
        });

        tools.measureDist = new OpenLayers.Control.Measure(OpenLayers.Class(OpenLayers.Handler.Path, {
            addPoint: function(pixel) {
                OpenLayers.Handler.Path.prototype.addPoint.apply(this, arguments);

                var vertices = this.line.geometry.getVertices();
                var sum = 0;
                var text = null;

                for (var i = 0, cnt = vertices.length - 1; i < cnt; i++) {
                    sum += ZMAP.dist(vertices[i], vertices[i + 1]);
                }

                sum = sum / 1000;
                if (sum >= 1.0) {
                    text = sum.toFixed(1) + '㎞';
                } else {
                    text = (sum * 1000).toFixed(1) + 'm';
                }

                if (sum == 0) {
                    ZMAP.measureGrp++;
                    map.events.register('mousemove', map, ZMAP.measureMouseMoveHandler);
                }

                var lonlat = map.getLonLatFromPixel(pixel);
                var pointFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat));
                pointFeature.attributes = {
                    style: 'measureDistPoint'
                };
                pointFeature.measureGrp = ZMAP.measureGrp;
                ZMAP.measureLayer.addFeatures([pointFeature]);

                if (sum > 0) {
                    var html = '<div style="white-space: nowrap;">' + text + '</div>';
                    var popupMeasure = new OpenLayers.Popup.Anchored('popupMeasure', lonlat.clone(), null, html, null, false);
                    popupMeasure.autoSize = true;
                    popupMeasure.setBorder('2px solid #aaaaaa');
                    popupMeasure.anchor = {
                        size: new OpenLayers.Size(0, 0),
                        offset: new OpenLayers.Pixel(0, 0)
                    };
                    popupMeasure.relativePosition = 'br';
                    popupMeasure.calculateRelativePosition = function() {
                        return 'tr';
                    };
                    popupMeasure.measureGrp = ZMAP.measureGrp;
                    pointFeature.popup = popupMeasure;
                    map.addPopup(pointFeature.popup);
                }
            }
        }), {
            persist: true,
            geodesic: true,
            immediate: true,
            handlerOptions: {
                layerOptions: {
                    styleMap: styleMap
                }
            }
        });
        tools.measureDist.events.on({
            measure: ZMAP.measureFinish,
            activate: ZMAP.measureActivated,
            deactivate: ZMAP.measureDeactivated
        });

        tools.measureArea = new OpenLayers.Control.Measure(OpenLayers.Class(OpenLayers.Handler.Polygon, {
            addPoint: function(pixel) {
                OpenLayers.Handler.Polygon.prototype.addPoint.apply(this, arguments);

                var vertices = this.line.geometry.getVertices();
                var sum = 0;

                for (var i = 0, cnt = vertices.length - 1; i < cnt; i++) {
                    sum += ZMAP.dist(vertices[i], vertices[i + 1]);
                }

                if (sum == 0) {
                    ZMAP.measureGrp++;
                    map.events.register('mousemove', map, ZMAP.measureMouseMoveHandler);
                }

                var lonlat = map.getLonLatFromPixel(pixel);
                var pointFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat));
                pointFeature.attributes = {
                    style: 'measureAreaPoint'
                };
                pointFeature.measureGrp = ZMAP.measureGrp;
                ZMAP.measureLayer.addFeatures([pointFeature]);
            }
        }), {
            persist: true,
            geodesic: true,
            immediate: true,
            handlerOptions: {
                layerOptions: {
                    styleMap: styleMap
                }
            }
        });
        tools.measureArea.events.on({
            measure: ZMAP.measureFinish,
            activate: ZMAP.measureActivated,
            deactivate: ZMAP.measureDeactivated
        });

        for (var id in tools) {
            var tool = tools[id];
            map.addControl(tool);
        }

        ZMAP.tool = tools;
    },

    changeTool: function(toolId, o) {
        ZMAP.options.resetTool(true);
        $(o).addClass('active');

        if (toolId == 'pan') {
            ZMAP.hoverCtrl.activate();
        } else {
            ZMAP.hoverCtrl.deactivate();
        }

        var tools = ZMAP.tool;
        for (var id in tools) {
            var tool = tools[id];
            if (id == toolId) {
                tool.activate()
            } else {
                tool.deactivate();
            }
        }

        switch (toolId) {
            case 'navPrev':
                ZMAP.navHistCtrl.previousTrigger();
                ZMAP.options.resetTool();
                break;
            case 'navNext':
                ZMAP.navHistCtrl.nextTrigger();
                ZMAP.options.resetTool();
                break;
            case 'reset':
                ZMAP.resetMap();
                break;
        }

        ZMAP.toolId = toolId;
    },

    measureMouseMoveHandler: function(event) {
        var px = map.getLayerPxFromViewPortPx(event.xy);
        $('#map-tooltip').css({
            left: px.x + 7,
            top: px.y + 7
        });
        $('#map-tooltip').show();
    },

    measureFinish: function(event) {
        var geometry = event.geometry;
        var units = event.units;
        var order = event.order;
        var sum = event.measure;
        var html = '<div style="position: relative; padding: 5px 10px 5px 5px; font-weight:bold; white-space: nowrap;">';
        var control = null;
        var measureType = null;
        var pos = null;

        map.events.unregister('mousemove', map, ZMAP.measureMouseMoveHandler);
        $('#map-tooltip').hide();

        if (order == 1) {
            var text = sum.toFixed(1) + units;
            html += '총거리: ' + text;
            control = ZMAP.tool.measureDist;
            measureType = 'Dist';
            pos = geometry.components[geometry.components.length - 1];
        } else {
            if (units == 'm') {
                units = '㎡';
            } else if (units == 'km') {
                units = '㎢';
            }

            var text = sum.toFixed(1) + units;
            html += '총면적: ' + text;
            control = ZMAP.tool.measureArea;
            measureType = 'Area';
            pos = geometry.components[0];
            pos = pos.components[pos.components.length - 2];
        }
        html += '<div style="position: absolute; top: -6px; right: -3px;"><img src="' + CONFIG.ctx + '/img/ngii/x-box.png" onclick="ZMAP.measureClearFeature('
                + ZMAP.measureGrp
                + ');" width="8" height="8" style="cursor: pointer;"></div></div>';

        var lonlat = new OpenLayers.LonLat(pos.x, pos.y);
        var pointFeature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat));
        var pointStyle = 'measure' + measureType + 'Point';
        pointFeature.attributes = {
            style: pointStyle
        };
        pointFeature.measureGrp = ZMAP.measureGrp;
        // ZMAP.measureLayer.addFeatures([pointFeature]);

        var lineFeature = new OpenLayers.Feature.Vector(geometry.clone());
        var lineStyle = 'measure' + measureType;
        lineFeature.attributes = {
            style: lineStyle
        };
        lineFeature.measureGrp = ZMAP.measureGrp;
        ZMAP.measureLayer.addFeatures([pointFeature, lineFeature]);

        var popupMeasure = new OpenLayers.Popup.Anchored('popupMeasure', lonlat.clone(), null, html, null, false);
        popupMeasure.autoSize = true;
        popupMeasure.setBorder('2px solid ' + ZMAP.measureSymbolizers[pointStyle].strokeColor);
        popupMeasure.anchor = {
            size: new OpenLayers.Size(0, 0),
            offset: new OpenLayers.Pixel(0, 0)
        };
        popupMeasure.relativePosition = 'br';
        popupMeasure.calculateRelativePosition = function() {
            return 'tr';
        };
        popupMeasure.measureGrp = ZMAP.measureGrp;
        pointFeature.popup = popupMeasure;
        map.addPopup(pointFeature.popup);

        ZMAP.measuring = false;
        control.deactivate();
    },

    measureClearFeature: function(measureGrp) {
        var layer = ZMAP.measureLayer;
        var feature = null;

        while ((feature = layer.getFeatureBy('measureGrp', measureGrp)) != null) {
            layer.removeFeatures(feature);
        }

        var popups = map.popups || ZMAP.getPopups();
        var cnt = popups.length - 1;
        for (var i = cnt; i >= 0; i--) {
            var popup = popups[i];
            if (popup != null && popup.measureGrp && popup.measureGrp == measureGrp) {
                popup.destroy();
            }
        }
    },

    measureActivated: function() {
        ZMAP.measuring = true;
    },

    measureDeactivated: function() {
        if (ZMAP.measuring) {
            map.events.unregister('mousemove', map, ZMAP.measureMouseMoveHandler);
            $('#map-tooltip').hide();
            ZMAP.measureClearFeature(ZMAP.measureGrp);
        }
        ZMAP.measuring = false;
        ZMAP.options.resetTool();
    },

    dist: function(p1, p2) {
        var pt1 = new OpenLayers.Geometry.Point(p1.x, p1.y);
        var pt2 = new OpenLayers.Geometry.Point(p2.x, p2.y);
        if ((typeof (p1) == 'undefined') || (typeof (p2) == 'undefined')) {
            return 0;
        }
        var segment = new OpenLayers.Geometry.LineString([pt1, pt2]);
        return segment.getGeodesicLength(ZMAP.mercator);
    },

    zoomToExtent: function(layer) {
        if (layer.fit !== false) {
            var bounds = layer.getDataExtent();

            if (bounds) {
                map.zoomToExtent(bounds);
            }
        }
    },

    cleanUp: function() {
        ZMAP.layer.vhcPos.destroyFeatures();
    },

    setCenterByPos: function(lon, lat, style) { // lon, lat: WGS84
        hideNaviPanel(naviCrfId);

        var geometry = ZMAP.transform(lon, lat, ZMAP.geographicWGS84);
        var lonlat = new OpenLayers.LonLat(geometry.x, geometry.y);

        map.setCenter(lonlat, ZMAP.options.bsZoom - 2);
        ZMAP.addIcon(ZMAP.layer.position, 'ZMAP_ICON_' + (style || 'HERE').toUpperCase(), geometry, null, {style: (style || 'herePos')});
    },

    setIconByPos: function(lon, lat, style) { // lon, lat: WGS84
        var geometry = ZMAP.transform(lon, lat, ZMAP.geographicWGS84);
        var lonlat = new OpenLayers.LonLat(geometry.x, geometry.y);
        
        ZMAP.addIcon(ZMAP.layer.route, 'ZMAP_ICON_POS', geometry, null, style);
    },

    setCenterByFid: function(fid, click, zoom) {
        hideNaviPanel(naviCrfId);

        var id = fid.split('.');
        var layerId = id[0];
        var layer = ZMAP.layer[layerId];
        var feature = layer.getFeatureByFid(fid);

        if (!feature) {
            //Swal.fire('Warning', '존재하지 않는 도형입니다.', 'warning');
            console.log('setCenterByFid] Shape not exist: ' + fid);
            return;
        }

        var vertices = feature.geometry.getVertices();
        var vertex = vertices[Math.floor(vertices.length / 2)];
        var lonlat = new OpenLayers.LonLat(vertex.x, vertex.y);

        if (zoom === false) {
            map.setCenter(lonlat);
        } else if (zoom === true || zoom === undefined) {
            map.setCenter(lonlat, ZMAP.options.bsZoom - 2);
        } else {
            map.setCenter(lonlat, zoom);
        }

        if (click) {
           ZMAP.onSelectFeature(feature.parent || feature, true);
        }

        return feature;
    },

    setCenterByBsId: function(bsId, style) {
        var fid = 'bs.' + bsId;
        var feature = ZMAP.setCenterByFid(fid);

        ZMAP.addIcon(ZMAP.layer.position, 'ZMAP_ICON_' + (style || 'HERE').toUpperCase(), feature.geometry, null, {style: (style || 'hereBs'), upon: 'bs'});
    },

    setCenterByBsId2: function(bsId, style) {
        var fid = 'bs.' + bsId;
        var feature = ZMAP.setCenterByFid(fid, false, 7);

        ZMAP.addIcon(ZMAP.layer.position, 'ZMAP_ICON_' + (style || 'HERE').toUpperCase(), feature.geometry, null, {style: (style || 'hereBs'), upon: 'bs'});
    },

    setCenterByBsId3: function(bsId, style) {
        var fid = 'bs.' + bsId;

        hideNaviPanel(naviCrfId);

        var id = fid.split('.');
        var layerId = id[0];
        var layer = ZMAP.layer[layerId];
        var feature = layer.getFeatureByFid(fid);

        // new OpenLayers.Bounds(minx, miny, maxx, maxy);
        var bounds = new OpenLayers.Bounds(-180, -90, 0, 0);
        map.zoomToExtent(bounds);

        ZMAP.addIcon(ZMAP.layer.position, 'ZMAP_ICON_' + (style || 'HERE').toUpperCase(), feature.geometry, null, {style: (style || 'hereBs'), upon: 'bs'});
    },

    drawRoute: function(routeId, routeTCd, fit, loadend, autoRef) {
        if (vhcMode != "UPGPS") {
            var layer = ZMAP.layer.route;

            ZMAP.cleanUp();

            if (routeTCd != "")
                routeId = routeId + "," + routeTCd;

            layer.filter = new OpenLayers.Filter.FeatureId({
                fids: [routeId]
            });
            layer.fit = (curMapRouteId == routeId || routeId.indexOf('|') >= 0 ? fit : true);
            curMapRouteId = routeId;

            layer.loadend = loadend;
            layer.refresh();
        } else {
            if (autoRef == true) {
                loadend();
            } else {
                var layer = ZMAP.layer.route;

                ZMAP.cleanUp();

                if (routeTCd != "")
                    routeId = routeId + "," + routeTCd;

                layer.filter = new OpenLayers.Filter.FeatureId({
                    fids: [routeId]
                });
                if (typeof(searchArrTimeCrfIdsByRoute) != 'undefined' && searchArrTimeCrfIdsByRoute[routeId] != undefined) {
                    layer.fit = false;
                } else {
                    layer.fit = (typeof(curMapRouteId) != 'undefined' && (curMapRouteId == routeId || routeId.indexOf('|') >= 0) ? fit : true);
                }
                curMapRouteId = routeId;

                layer.loadend = loadend;
                layer.refresh();

                if (typeof(searchArrTimeCrfIdsByRoute) != 'undefined' && searchArrTimeCrfIdsByRoute[routeId] != undefined && searchArrTimeCrfIdsByRouteBounds[routeId] != undefined) {
                    // new OpenLayers.Bounds(minx, miny, maxx, maxy);
//                    var minx = (searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[0] < searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[2] ? searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[0] : searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[2]);
//                    var miny = (searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[1] < searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[3] ? searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[1] : searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[3]);
//                    var maxx = (searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[0] < searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[2] ? searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[2] : searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[0]);
//                    var maxy = (searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[1] < searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[3] ? searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[3] : searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[1]);
                    var minx = 9999999999;
                    var miny = 9999999999;
                    var maxx = -1;
                    var maxy = -1;
                    for (var i = 0; i < 3; i++) {
                        if (minx > searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[0 + (i*2)])
                            minx = searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[0 + (i*2)];
                        if (miny > searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[1 + (i*2)])
                            miny = searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[1 + (i*2)];

                        if (maxx < searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[0 + (i*2)])
                            maxx = searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[0 + (i*2)];
                        if (maxy < searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[1 + (i*2)])
                            maxy = searchArrTimeCrfIdsByRouteBounds[routeId].split(",")[1 + (i*2)];
                    }

                    var bounds = new OpenLayers.Bounds(minx - 100, miny - 100, maxx + 100, maxy + 100);
                    map.zoomToExtent(bounds);
                }

//                searchArrTimeCrfIdsByRoute = [];
//                searchArrTimeCrfIdsByRouteBounds = [];
            }
        }
    },

    redrawBsUponIcons: function(zoom) {
        var showBsZoom = ZMAP.options.showBsZoom;

        for (var layerId in ZMAP.layerInfo) {
            var layerInfo = ZMAP.layerInfo[layerId];
            if (!layerInfo.upon) {
                continue;
            }

            var layer = ZMAP.layer[layerId];
            var features = layer.features;
            if (!features) {
                continue;
            }

            for (var i = 0, cnt = features.length; i < cnt; i++) {
                var feature = features[i];
                var fgClassNm = feature.geometry.CLASS_NAME;

                if (fgClassNm == 'OpenLayers.Geometry.Point' && feature.attributes.upon == 'bs') {
                    var style = feature.attributes.style;

                    if (zoom >= showBsZoom) {
                        if (style.indexOf('Upon') < 0) {
                            feature.attributes.style = style + 'Upon';
                            layer.drawFeature(feature);
                        }
                    } else if (style.indexOf('Upon') >= 0) {
                        feature.attributes.style = style.replace('Upon', '');
                        layer.drawFeature(feature);
                    }
                }

                if (feature.attributes.cssClass) {
                    $('#' + feature.geometry.id).addClass(feature.attributes.cssClass);
                }
            }
        }
    },

    drawVhc: function(param) {
        var layer = ZMAP.layer.vhcPos;
        var features = [];

        ZMAP.cleanUp();
//        if (curMapZoom != 0 && curMapCenter != null) {
//            map.setCenter(curMapCenter, curMapZoom);
//        }

        if (!Array.isArray(param)) {
            param = [param];
        }

        for (var i = 0, cnt = param.length; i < cnt; i++) {
            if (searchArrTimeCrfIds != "") {
                if (searchArrTimeCrfIds.indexOf(param[i].crfId) < 0) {
                    continue;
                }
            }
            var vhc = param[i];
            var feature = new OpenLayers.Feature.Vector(ZMAP.transform(vhc.ngisXPos, vhc.ngisYPos, ZMAP.geographic), vhc);

            feature.fid = 'vhc.' + vhc.busId;
            feature.renderIntent = 'default';
            features.push(feature);
        }

        layer.addFeatures(features);
        layer.setVisibility(true);
    },

    drawVhcPos: function(routeId, fit) {
        var layer = ZMAP.layer.vhcPos;

        layer.filter = new OpenLayers.Filter.FeatureId({
            fids: [routeId]
        });
        layer.fit = fit;
        layer.refresh();
    },

    drawDirections: function(param, fit) { // [{routeId|subRouteId, moveDir, stBsId|stSubstId, arBsId|arSubstId}, ...]
        var layer = ZMAP.layer.route;
        var fids = [];

        ZMAP.cleanUp();

        for (var i = 0, cnt = param.length; i < cnt; i++) {
            fids[i] = JSON.stringify(param[i]);
        }

        layer.filter = new OpenLayers.Filter.FeatureId({
            fids: fids
        });
        layer.fit = fit;
        layer.refresh();
    },

    addIcon: function(layer, id, geometry, style, attributes) {
        var feature = layer.getFeatureById(id);
        var oldGeometry = null;

        if (feature) {
            oldGeometry = feature.geometry;
            feature.attributes = attributes;
            feature.geometry.move(geometry.x - oldGeometry.x, geometry.y - oldGeometry.y);
            layer.drawFeature(feature);
//            feature.attributes.cssClass = 'blinking';
            /*if(id == 'ZMAP_ICON_MYPOS'){
                var el = feature.geometry.id;
                $('#' + el).addClass('blinking');
            }*/
        } else {
            feature = new OpenLayers.Feature.Vector(geometry.clone(), attributes, style);
            feature.id = id;
            layer.addFeatures([feature]);
            layer.setVisibility(true);
//            feature.attributes.cssClass = 'blinking';
            /*if(id == 'ZMAP_ICON_MYPOS'){
                var el = feature.geometry.id;
                $('#' + el).addClass('blinking');
            }*/
        }

        ZMAP.redrawBsUponIcons(map.getZoom());
    },

    getCoord: function(callback) {
        if (ZMAP.coordCtrl === undefined) {
            var coordCtrl = new OpenLayers.Control.DrawFeature(ZMAP.layer.route, OpenLayers.Handler.Point);

            map.addControl(coordCtrl);
            coordCtrl.events.on({
                featureadded: function(event) {
                    var feature = event.feature;

                    ZMAP.coordCtrl.deactivate();
                    if (callback) {
                        var geometry = feature.geometry;
                        ZMAP.addIcon(ZMAP.layer.route, 'ZMAP_ICON_HERE', geometry, null, {style: 'herePos'});
                        callback(geometry.x, geometry.y);
                    }

                    feature.destroy();
                }
            });
            ZMAP.coordCtrl = coordCtrl;
        }

        ZMAP.coordCtrl.activate();
    },

    closePopup: function(popupId) {
        if (popupId === undefined) {
            $('.map-popup:visible').each(function() {
                if ($(this).data('keepTimer')) {
                    return;
                }

                if ($(this).attr('id') == 'map-popup') {
                    $(this).hide();
                } else {
                    $(this).remove();
                }
            });

            return;
        }

        var popup = $('#' + popupId);

        if (popup.data('keepTimer')) {
            return;
        }

        popup.removeData('keepTimer');

        if (popupId == 'map-popup') {
            popup.hide();
        } else {
            popup.remove();
        }
    },

    openMap: function(param) { // {bsId, routeId}
        var query = '?_=d';

        for (k in param) {
            query += ('&' + k + '=' + param[k]);
        }

        var w = window.open(CONFIG.ctx + '/map/popup' + query, 'MAP_WINDOW', 'left=0,top=0,width=798,height=640,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=yes');
        w.focus();
    },

    onLoadLayer: function(event) {
        var layer = event.object;
        var layerId = layer.name;

        console.log('onLoadLayer] ' + layerId);
        layer.loaded = true;
        layer.events.un({
            loadend: ZMAP.onLoadLayer
        });

        var layers = ZMAP.layer;
        for (var id in layers) {
            var layer = layers[id];
            if (!layer.loaded) {
                return;
            }
        }

        $(map.div).trigger('loaded.map.layers');
    },

    onMoveEnd: function() {
//        if (vhcMode == "UPGPS") {
//            setTimeout(function() {
//                if (naviMode) {
//                    if (naviMoveEnd) {
//                        naviMoveEnd = false;
//                    } else {
//                        naviCrfId = "";
//                        naviMode = false;
//                        naviMoveEnd = false;
//                        naviZoomEnd = false;
//                    }
//                } else {
//                    naviCrfId = "";
//                    naviMode = false;
//                    naviMoveEnd = false;
//                    naviZoomEnd = false;
//                }
//            }, map.panDuration);
//        }
//        console.log('onMoveEnd]');
//        setTimeout(function() { curMapCenter = map.center; }, 1000);
    },

    onZoomEnd: function() {
        if(typeof vhcMode === 'undefined') {
        } else {
            if (vhcMode == "UPGPS") {
    ////            setTimeout(function() {
    ////                if (naviMode) {
    ////                    if (naviZoomEnd) {
    ////                        naviZoomEnd = false;
    ////                    } else {
    ////                        naviCrfId = "";
    ////                        naviMode = false;
    ////                        naviMoveEnd = false;
    ////                        naviZoomEnd = false;
    ////                    }
    ////                } else {
    ////                    naviCrfId = "";
    ////                    naviMode = false;
    ////                    naviMoveEnd = false;
    ////                    naviZoomEnd = false;
    ////                }
    ////            }, map.panDuration);
                for (var i = 0; i < ZMAP.layer.vhcPos.features.length; i++) {
                    var curFeature = ZMAP.layer.vhcPos.features[i];
                    var highlight ='';
                    if (curFeature.attributes.style.indexOf('_H') > 0) {
                        highlight ='_H';
                    }
                    if (map.getZoom() < ZMAP.options.bsZoom - 5) {
                        if (curFeature.attributes.style != ('vhcGpsS'+highlight)) {
                            curFeature.attributes.style = ('vhcGpsS'+highlight);
                            ZMAP.layer.vhcPos.drawFeature(curFeature);
                        }
                    } else if (map.getZoom() < ZMAP.options.bsZoom) {
                        if (curFeature.attributes.style != ('vhcGpsM'+highlight)) {
                            curFeature.attributes.style = ('vhcGpsM'+highlight);
                            ZMAP.layer.vhcPos.drawFeature(curFeature);
                        }
                    } else {
                        if (curFeature.attributes.style != ('vhcGps'+highlight)) {
                            curFeature.attributes.style = ('vhcGps'+highlight);
                            ZMAP.layer.vhcPos.drawFeature(curFeature);
                        }
                    }
                }
            }
        }
        var zoom = map.getZoom();

        ZMAP.redrawBsUponIcons(zoom);
//        console.log('onZoomEnd] zoom : ' + zoom);
//        setTimeout(function() { curMapZoom = map.getZoom(); }, 1000);
    },

    onSelectFeature: function(feature, force, keepPopup, multiple) {
        var attr = feature.attributes;
        var layerId = (feature.layer ? feature.layer : feature.parent.layer).name;
        var popup = '';
        var tooltip = '';
        var offsetY = 14;

        console.log('onSelectFeature] ' + layerId + ' ' + feature.fid);

        // 모바일 브라우저에서 정류소 아이콘 터치 후 지도 드래그 할 때 팝업 사라지지 않는 문제 수정
        setTimeout(function() {
            map.pan(0, 0, {
                animate: false,
                dragging: false
            });
        }, 10);

        if (keepPopup === undefined) {
            keepPopup = force;
        }

        feature.keepPopup = keepPopup;

        switch (layerId) {
            case 'bs':
                vhcTracking(false);

                offsetY = 54;
                var start;
                var end
                if ($Z.locale == 'ko') {
                    start = '출발지';
                    end = '도착지';
                }else{
                    start = 'Start';
                    end = 'End';
                }
                popup += '<p class="popup-title" onclick="ZMAP.modalAutoSearch(\'' + attr.bsNm +'\', \'' + attr.wincId +'\')">';
                popup += '<strong style="cursor: pointer;" >' + attr.bsNm + '</strong></p>'
                popup += '<div class="btn-group selectMap-group">\
                    <button type="button" onclick="selectMapBsSt();" class="selectStEd btn btn-outline-primary">' + start + '</button>\
                    <button type="button" onclick="selectMapBsEd();" class="selectStEd btn btn-outline-danger">' + end + '</button>\
                    </div>';
                if ($Z.locale == 'ko') {
                    popup += '<table class="popup" style="background:#fff;">\
                                <tbody>\
                                    <tr>\
                                        <th>경유노선</th>\
                                        <td colspan="3">' + attr.routeList + '</td>\
                                    </tr>\
                                    <tr>\
                                        <th>정류소번호</th>\
                                        <td class="winc_id" style="width : 65px;">' + (attr.wincId || '') + '</td>\
                                        <th>정류소유형</th>\
                                        <td>' + attr.bsTCdNm + '</td>\
                                    </tr>\
                                </tbody>\
                            </table>';
                }
                popup += '<div class="arr-info" style="text-align: center;"><img src="' + CONFIG.ctx + '/static/img/loading.gif" class="arr-info-loading" /></div>';

                $.ajax({
                    method: 'GET',
                    url: '/realtime/arr/' + attr.bsId.trim(),
                    cache: false,
                    loadingTarget: false,
                    dataType: 'json',
                    success: function(data) {
                        var msg = data.body.msg;
                        var block = data.body.block;
                        var blockMsg = data.body.blockMsg;
                        var html = '';

                        if (blockMsg) {
                            html += '<div class="arr_notice" style="color: red !important;">' + blockMsg + '</div>';
                        }

                        if (!block) {
                            var list = data.body.list;
                            var cnt = list.length;

                            html += '<table><tbody>';

                            for (var i = 0; i < cnt; i++) {
                                var item = list[i];
                                var routeNote = item.routeNote;
                                var arrState = (item.bsGap < 0 && item.bsGap > -3 ? '' : item.arrState) || '&nbsp;';
                                var busType = ' bus' + (item.busTCd2 || 'N') + (item.busTCd3 || 'N');

                                if (routeNote) {
                                    routeNote = ' <span class=\"route_note\">(' + routeNote + ')</span>';
                                } else {
                                    routeNote = '';
                                }

                                if (item.bsNm !== undefined) {
                                    html += '<tr>\
                                                <th class="route_no' + busType + '">' + item.routeNo + '</th>\
                                                <td class="arr_state" style="padding: 0 !important">' + arrState + '</td>\
                                                <td class="cur_pos"' + (item.bsNm.indexOf("우회") >= 0 || item.bsNm.indexOf("미정차") >= 0 ? ' style="color: red !important;"' : '') + '>' + (item.bsNm || '') + routeNote + '</td>\
                                            </tr>';
                                }
                            }

                            if (msg) {
                                html += '<tr>\
                                            <td colspan="3" style="color: red !important;">' + msg + '</td>\
                                        </tr>';
                            }

                            html += '</tbody></table>';
                        }

                        $('#map-popup>.popup-content>.arr-info').html(html);
                        bsObject = attr;
                    }
                });
                break;

            case 'vhcPos':
                if (vhcMode != "UPGPS") {
                    offsetY = 40;

                    popup += '<table class="popup" style="background:#fff;">\
                                <thead>\
                                    <tr>\
                                        <th>차량번호</th>\
                                        <th>노선번호</th>\
                                        <th>방면</th>\
                                    </tr>\
                                </thead>\
                                <tbody>\
                                    <tr>\
                                        <td class="text-center">' + attr.vhcNo2 + '</td>\
                                        <td class="text-center">' + attr.routeNo + '</td>\
                                        <td class="text-left">' + (attr.routeNote || '') + '</td>\
                                    </tr>\
                                </tbody>\
                            </table>';
                }
                break;
        }

        var fgClassNm = feature.geometry.CLASS_NAME;
        var px = null;

        if (fgClassNm == 'OpenLayers.Geometry.Point') {
            px = map.getPixelFromLonLat(feature.geometry.getBounds().getCenterLonLat());
        } else {
            //var vertices = feature.geometry.getVertices();
            //var vertex = vertices[Math.floor(vertices.length / 2)];
            //var lonlat = new OpenLayers.LonLat(vertex.x, vertex.y);
            //px = map.getPixelFromLonLat(lonlat);
            px = ZMAP.mousePosCtrl.lastXy;
        }

        $('#map-popup, #map-tooltip').hide();

        if (popup) {
            var mapPopup = $('#map-popup');

            if (multiple) {
                mapPopup = mapPopup.clone();
                mapPopup.attr('id', 'map-popup' + (new Date().getTime()));
                $('#map-popup').after(mapPopup);
            }

            $('.popup-content', mapPopup).html(popup);

            var mw = $('#map').width();
            var mh = $('#map').height();
            var pw = mapPopup.width();
            var ph = mapPopup.height();
            var pb = mh - px.y + offsetY - ($('#footer').css('backgroundImage') == 'none' ? 0 : $('#footer').height());
            var pl = px.x - pw / 2;
            var dx = 0, dy = 0;

            if (pw * 1.5 > mw) {
                dx = px.x - mw / 2;
            }

            if (ph * 2 > mh) {
                dy = px.y - mh / 2 - ph / 2;
            }

            if (dx != 0 || dy != 0) {
                map.pan(dx, dy, {
                    animate: false,
                    dragging: true
                });
                pl -= dx;
                pb += dy;
            }

            var keepTimer = mapPopup.data('keepTimer'); // 안드로이드에서 바로 movestart 이벤트가 발생하는 경우가 있어 팝업이 닫히는 문제 방지

            if (keepTimer) {
                clearTimeout(keepTimer);
            }

            keepTimer = setTimeout(function() {
                mapPopup.removeData('keepTimer');
            }, 500);

            mapPopup.css({
                bottom: pb + 'px',
                left: pl + 'px'
            }).data('keepTimer', keepTimer).show();
        } else if (tooltip) {
            var mapTooltip = $('#map-tooltip');

            $('#map-tooltip .tooltip-content').html(tooltip);
            mapTooltip.css({
                bottom: ($('#map').height() - px.y + offsetY) + 'px',
                left: (px.x - mapTooltip.width() / 2) + 'px'
            }).show();
        }
    },

    onUnSelectFeature: function(feature) {
        if (feature && feature.keepPopup) {
            return;
        }

        $('#map-popup, #map-tooltip').hide();
    },
    
    modalAutoSearch : function(bsNm, wincId){
        location.href='map?mapMode=0&searchText=' + bsNm +'&wincId=' + wincId +'&auto=false';
//        $('#searchText').val(bsNm);
//        if (!(wincId == null || typeof (wincId) == 'undefined')) {
//            $('#wincId').val();
//        }
//        modalSearch = true;
//        searchBtn();
    }
};

OpenLayers.Layer.Vector.prototype.getFeatureBy = function(property, value) {
    var features = this.features;
    var feature = null;

    for (var i = 0, cnt = features.length; i < cnt; i++) {
        feature = features[i];

        if (feature[property] == value) {
            return feature;
        }

        if (feature.cluster) {
            var cluster = feature.cluster;
            var clusterFeature = null;

            for (var j = 0, jcnt = cluster.length; j < jcnt; j++) {
                clusterFeature = cluster[j];

                if (clusterFeature[property] == value) {
                    clusterFeature.parent = feature;
                    return clusterFeature;
                }
            }
        }
    }

    return null;
};

OpenLayers.Handler.Drag.prototype.dragstart = function(evt) {
    var propagate = true;
    this.dragging = false;
    if (this.checkModifiers(evt) &&
           (OpenLayers.Event.isLeftClick(evt) ||
            OpenLayers.Event.isSingleTouch(evt))) {
        this.started = true;
        this.start = evt.xy;
        this.last = evt.xy;
        OpenLayers.Element.addClass(
            this.map.viewPortDiv, "olDragDown"
        );
        this.down(evt);
        this.callback("down", [evt.xy]);

        // prevent document dragging
        OpenLayers.Event.preventDefault(evt);

        if(!this.oldOnselectstart) {
            this.oldOnselectstart = document.onselectstart ?
                document.onselectstart : OpenLayers.Function.True;
        }
        document.onselectstart = OpenLayers.Function.False;

        //propagate = !this.stopDown; // 모바일 브라우저에서 정류소 아이콘 터치 할 때 도착정보 팝업 안 뜨는 문제 때문에 주석 처리
    } else {
        this.started = false;
        this.start = null;
        this.last = null;
    }
    return propagate;
}