ZMAP.initResource = function(options) {
    var defaults = {
        locale: 'ko',
        mapProjectionName: 'EPSG:5179',
        initZoom: 6,
        bsZoom: 12,
        showBsZoom: 10,
        bsMaxResolution: 2.1943285667419434,
        addDefaultTools: true,

        resetTool: function() {}
    };

    ZMAP.options = $.extend({}, defaults, options);

    var locale = ZMAP.options.locale;

    if (locale != 'en' && locale.startsWith('en_')) {
        locale = 'en';
    } else {
        locale = 'ko';
    }

    ZMAP.locale = ZMAP.options.locale = locale;
    ZMAP.bsMaxResolution = ZMAP.options.bsMaxResolution;
    ZMAP.geometryPoint = new OpenLayers.Geometry.Point();
    ZMAP.geographic = new OpenLayers.Projection('EPSG:5187');
    ZMAP.geographicWGS84 = new OpenLayers.Projection('EPSG:4326');
    ZMAP.mercator = new OpenLayers.Projection(ZMAP.options.mapProjectionName);
    ZMAP.stSelectMode = false;
    ZMAP.edSelectMode = false;

    ZMAP.options.center = (new OpenLayers.LonLat(128.601277028, 35.8714742094319)).transform(ZMAP.geographicWGS84, ZMAP.mercator);

    if (typeof daum != 'undefined' && daum.maps.services.Geocoder) {
        ZMAP.geocoder = new daum.maps.services.Geocoder();
    }

    ZMAP.layerInfo = { // 레이어 순서대로 (bottom -> top)
        bs: {
            symbolizers: {
                bs: {
                    //title: '${name}',
                    externalGraphic: CONFIG.ctx + '/static/img/icon_${bsBit}.png',
                    graphicWidth: 22,
                    graphicHeight: 28,
                    graphicXOffset: -11,
                    graphicYOffset: -27,
                    graphicOpacity: 1
                }
            },
            maxResolution: ZMAP.bsMaxResolution
        },
        route: {
            symbolizers: {
                route: {
                    strokeColor: '${color}',
                    strokeOpacity: 1,
                    strokeWidth: 3
                },
                route0: {
                    //strokeColor: '#ff0000', // red
                    //strokeColor: '#cc6666', // red
                    strokeColor: '#cc3333', // red
                    strokeOpacity: 1,
                    strokeWidth: 3
                },
                route1: {
                    //strokeColor: '#0000ff', // blue
                    //strokeColor: '#6699cc', // blue
                    strokeColor: '#3333cc', // blue
                    strokeOpacity: 1,
                    strokeWidth: 3
                },
                route2: {
                    strokeColor: 'green',
                    strokeOpacity: 1,
                    strokeWidth: 3
                },
                st: {
                    externalGraphic: CONFIG.ctx + '/static/img/' + ZMAP.locale + '/icon_route_st.png',
                    graphicWidth: 28,
                    graphicHeight: 26,
                    graphicXOffset: -14,
                    graphicYOffset: -26,
                    graphicOpacity: 1
                },
                ed: {
                    externalGraphic: CONFIG.ctx + '/static/img/' + ZMAP.locale + '/icon_route_ed.png',
                    graphicWidth: 28,
                    graphicHeight: 26,
                    graphicXOffset: -14,
                    graphicYOffset: -26,
                    graphicOpacity: 1
                },
                hereBs: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_here_bs.png',
                    graphicWidth: 25,
                    graphicHeight: 35,
                    graphicXOffset: -12,
                    graphicYOffset: -35,
                    graphicOpacity: 1
                },
                herePos: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_here_pos.png',
                    graphicWidth: 25,
                    graphicHeight: 35,
                    graphicXOffset: -12,
                    graphicYOffset: -35,
                    graphicOpacity: 1
                },
                directionsDeparture: {
                    externalGraphic: CONFIG.ctx + '/static/img/' + ZMAP.locale + '/icon_directions_departure.png',
                    graphicWidth: 28,
                    graphicHeight: 26,
                    graphicXOffset: -14,
                    graphicYOffset: -26,
                    graphicOpacity: 1
                },
                directionsArrival: {
                    externalGraphic: CONFIG.ctx + '/static/img/' + ZMAP.locale + '/icon_directions_arrival.png',
                    graphicWidth: 28,
                    graphicHeight: 26,
                    graphicXOffset: -14,
                    graphicYOffset: -26,
                    graphicOpacity: 1
                },
                directionsTrans: {
                    externalGraphic: CONFIG.ctx + '/static/img/' + ZMAP.locale + '/icon_directions_trans.png',
                    graphicWidth: 28,
                    graphicHeight: 26,
                    graphicXOffset: -14,
                    graphicYOffset: -26,
                    graphicOpacity: 1
                },
                myPos: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_current_on.png',
                    graphicWidth: 28,
                    graphicHeight: 28,
                    graphicXOffset: -14,
                    graphicYOffset: -14,
                    graphicOpacity: 1
                }
            },
            upon: true
        },
        position: {
            symbolizers: {
                directionsDeparture: {
                    externalGraphic: CONFIG.ctx + '/static/img/' + ZMAP.locale + '/icon_point_departure.png',
                    graphicWidth: 39,
                    graphicHeight: 33,
                    graphicXOffset: -19,
                    graphicYOffset: -33,
                    graphicOpacity: 1
                },
                directionsArrival: {
                    externalGraphic: CONFIG.ctx + '/static/img/' + ZMAP.locale + '/icon_point_arrival.png',
                    graphicWidth: 39,
                    graphicHeight: 33,
                    graphicXOffset: -19,
                    graphicYOffset: -33,
                    graphicOpacity: 1
                },
                directionsTrans: {
                    externalGraphic: CONFIG.ctx + '/static/img/' + ZMAP.locale + '/icon_directions_trans.png',
                    graphicWidth: 28,
                    graphicHeight: 26,
                    graphicXOffset: -14,
                    graphicYOffset: -26,
                    graphicOpacity: 1
                },
                hereBs: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_here_bs.png',
                    graphicWidth: 25,
                    graphicHeight: 35,
                    graphicXOffset: -12,
                    graphicYOffset: -35,
                    graphicOpacity: 1
                },
                herePos: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_here_pos.png',
                    graphicWidth: 25,
                    graphicHeight: 35,
                    graphicXOffset: -12,
                    graphicYOffset: -35,
                    graphicOpacity: 1
                },
                myPos: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_current_on.png',
                    graphicWidth: 28,
                    graphicHeight: 28,
                    graphicXOffset: -14,
                    graphicYOffset: -14,
                    graphicOpacity: 1
                }
            },
            upon: true
        },
        vhcPos: {
            symbolizers: {
                vhc: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${vhcTCd}.png?v=20251029_01',
                    graphicWidth: 32,
                    graphicHeight: 32,
                    graphicXOffset: -16,
                    graphicYOffset: -18,
                    graphicOpacity: 1
                },
//                vhcGps: {
//                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_${moveDir}_${textDir}_${routeIdNo}.gif?v=20251029_01',
//                    graphicWidth: 33,
//                    graphicHeight: 84,
//                    graphicXOffset: -16,
//                    graphicYOffset: -42,
//                    graphicOpacity: 1,
//                    rotation: '${angle}'
//                },
//                vhcGpsM: {
//                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_${moveDir}_${textDir}_${routeIdNo}_m.gif?v=20251029_01',
//                    graphicWidth: 25,
//                    graphicHeight: 64,
//                    graphicXOffset: -12,
//                    graphicYOffset: -32,
//                    graphicOpacity: 1,
//                    rotation: '${angle}'
//                },
//                vhcGpsS: {
//                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_${moveDir}_s.gif?v=20251029_01',
//                    graphicWidth: 19,
//                    graphicHeight: 48,
//                    graphicXOffset: -9,
//                    graphicYOffset: -24,
//                    graphicOpacity: 1,
//                    rotation: '${angle}'
//                },
                vhcGps: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_${textDir}_${routeIdNo}.gif?v=20251029_01',
                    graphicWidth: 38,
                    graphicHeight: 80,
                    graphicXOffset: -19,
                    graphicYOffset: -40,
                    graphicOpacity: 1,
                    rotation: '${angle}'
                },
                vhcGps_H: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_${textDir}_${routeIdNo}_h.png?v=20251029_01',
                    graphicWidth: 100,
                    graphicHeight: 100,
                    graphicXOffset: -50,
                    graphicYOffset: -50,
                    graphicOpacity: 1,
                    rotation: '${angle}'
                },
                vhcGpsM: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_${textDir}_${routeIdNo}_m.gif?v=20251029_01',
                    graphicWidth: 26,
                    graphicHeight: 55,
                    graphicXOffset: -13,
                    graphicYOffset: -27,
                    graphicOpacity: 1,
                    rotation: '${angle}'
                },
                vhcGpsM_H: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_${textDir}_${routeIdNo}_m_h.png?v=20251029_01',
                    graphicWidth: 70,
                    graphicHeight: 70,
                    graphicXOffset: -35,
                    graphicYOffset: -35,
                    graphicOpacity: 1,
                    rotation: '${angle}'
                },
                vhcGpsS: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_s.gif?v=20251029_01',
                    graphicWidth: 16,
                    graphicHeight: 34,
                    graphicXOffset: -8,
                    graphicYOffset: -17,
                    graphicOpacity: 1,
                    rotation: '${angle}'
                },
                vhcGpsS_H: {
                    externalGraphic: CONFIG.ctx + '/static/img/icon_vhc_${routeTCd}_s_h.png?v=20251029_01',
                    graphicWidth: 44,
                    graphicHeight: 44,
                    graphicXOffset: -22,
                    graphicYOffset: -22,
                    graphicOpacity: 1,
                    rotation: '${angle}'
                }
            }
        }
    };

    var bsIconHeight = ZMAP.layerInfo.bs.symbolizers.bs.graphicHeight;

    for (var layerId in ZMAP.layerInfo) {
        var layerInfo = ZMAP.layerInfo[layerId];
        if (!layerInfo.upon) {
            continue;
        }

        var symbolizers = layerInfo.symbolizers;

        for (var k in symbolizers) {
            var symbolizer = symbolizers[k];
            if (symbolizer.externalGraphic !== undefined) {
                var upon = $.extend({}, symbolizer);
                upon.graphicYOffset -= bsIconHeight;
                symbolizers[k + 'Upon'] = upon;
            }
        }
    }

    ZMAP.layerInfo.route.symbolizers.vhc = $.extend({}, ZMAP.layerInfo.vhcPos.symbolizers.vhc);

    ZMAP.layer = {};
    ZMAP.dummyLayer = new OpenLayers.Layer.Vector('dummy');
    ZMAP.mapDivOffset = $(map.div).offset();
    ZMAP.naviCtrl = new OpenLayers.Control.Navigation({
        dragPanOptions: {
            enableKinetic: true
        }
    });
    ZMAP.navHistCtrl = new OpenLayers.Control.NavigationHistory();
    //ZMAP.mousePosCtrl = new OpenLayers.Control.MousePosition();
    ZMAP.hoverCtrl = new OpenLayers.Control.SelectFeature(ZMAP.dummyLayer, {
        hover: true,
        highlightOnly: true,
        eventListeners: {
            beforefeaturehighlighted: ZMAP.onMouseOverFeature,
            featureunhighlighted: ZMAP.onMouseOutFeature
        }
    });

    if (OpenLayers.Control.Click) {
        map.div.oncontextmenu = function(event) {
            if (event.preventDefault) {
                event.preventDefault();
            }

            return false;
        };

        $.contextMenu({
            selector: '#' + map.div.id, 
            className: 'context-menu-map',
            trigger: 'none',
            callback: function(key, options, e) {
                var lonlat = ZMAP.clickCtrl.lonlat;
                $(map.div).trigger('click.map.context-menu', {
                    key: key,
                    lon: lonlat.lon,
                    lat: lonlat.lat
                });
            },
            items: {
                //sep1: '---------',
                departure: {
                    name: '출발지 지정',
                    icon: 'departure'
                },
                arrival: {
                    name: '도착지 지정',
                    icon: 'arrival'
                }
            }
        });

        ZMAP.clickCtrl = new OpenLayers.Control.Click({
            eventMethods: {
                click: function(event) {
                    var xy = event.xy;
                    var lonlat = null;
                    if (typeof(map.getLonLatFromViewPortPx) == 'undefined')
                        lonlat = map.getLonLatFromPixel(xy);
                    else
                        lonlat = map.getLonLatFromViewPortPx(xy);

                    ZMAP.closePopup();
                    ZMAP.clickCtrl.lonlat = lonlat;

                    if (ZMAP.stSelectMode) {
                        handleContextMenu('departure', lonlat.lon, lonlat.lat);
                        ZMAP.stSelectMode = false;
                    } else if (ZMAP.edSelectMode) {
                        handleContextMenu('arrival', lonlat.lon, lonlat.lat);
                        ZMAP.edSelectMode = false;
                    }
                },
                rightclick: function(event) {
                    var xy = event.xy;
                    var lonlat = null;
                    if (typeof(map.getLonLatFromViewPortPx) == 'undefined')
                        lonlat = map.getLonLatFromPixel(xy);
                    else
                        lonlat = map.getLonLatFromViewPortPx(xy);

                    ZMAP.clickCtrl.lonlat = lonlat;
                    $(map.div).contextMenu({
                        x: xy.x + ZMAP.mapDivOffset.left,
                        y: xy.y + ZMAP.mapDivOffset.top
                    });
                },
                dblrightclick: function(event) {
//                    
                }
            }
        });
    }

    ZMAP.measureGrp = 0;
    ZMAP.measureSymbolizers = {
        measureDistPoint: {
            pointRadius: 4,
            fillColor: 'white',
            fillOpacity: 1,
            strokeWidth: 3,
            strokeOpacity: 1,
            strokeColor: 'red',
            strokeLinecap: 'round'
        },
        measureAreaPoint: {
            pointRadius: 4,
            fillColor: 'white',
            fillOpacity: 1,
            strokeWidth: 3,
            strokeOpacity: 1,
            strokeColor: 'blue',
            strokeLinecap: 'round'
        },
        measureDist: {
            strokeWidth: 3,
            strokeOpacity: 0.5,
            strokeColor: 'red',
            strokeLinecap: 'round'
        },
        measureArea: {
            fillColor: 'blue',
            fillOpacity: 0.2,
            strokeWidth: 3,
            strokeOpacity: 0.5,
            strokeColor: 'blue',
            strokeLinecap: 'round'
        }
    };
    ZMAP.measureStyleMap = new OpenLayers.StyleMap();
    ZMAP.measureStyleMap.addUniqueValueRules('default', 'style', ZMAP.measureSymbolizers);
    ZMAP.measureLayer = new OpenLayers.Layer.Vector('measure', {
        styleMap: ZMAP.measureStyleMap,
        rendererOptions: {
            yOrdering: true
        }
    });

    ZMAP.measureCoordLayer = new OpenLayers.Layer.Vector('measureCoord', {
        style: {
            pointRadius: 4,
            fillColor: 'lime',
            fillOpacity: 1,
            strokeWidth: 2,
            strokeColor: 'blue'
        }
    });
};
