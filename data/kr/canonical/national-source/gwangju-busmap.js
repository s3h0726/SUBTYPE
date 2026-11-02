/**
 * 다음맵 API 정의
 * 2014.01.06
 * 김지훈
 * compress : http://javascriptcompressor.com/
 */
var map; // 맵

var gId    = "map"             ;
var gLevel = 5                 ;
var gLat   = 35.16021187397791 ;
var gLng   = 126.85160343265265;

var busIcon                   = []; // 기본으로 깔리는 정류장 아이콘
var lineColor                 = []; // 라인컬러
var routeLineColor            = []; // 라인컬러(환승)
var line                      = []; // 라인
var busStopMarker             = []; // 버스정류소 마크
var busLocationMarker         = []; // 버스위치 마크
var busCompLocationMarker     = []; // 버스위치 마크(운수회사용)
var busStationMarker          = []; // 버스정류소 마크
var busStopInfowindow         = []; // 버스정류소 정보
var busLocationInfowindow     = []; // 버스위치 정보
var busCompLocationInfowindow = []; // 버스위치 정보(운수회사용)
var busArriveInfowindow       = []; // 버스도착 정보
var busStationInfowindow      = []; // 버스정류소 정보
var busStopCircle             = []; // 원
var arriveLine                = []; // 출발도착 라인
var busStationLocationMarker;
var busStationLocationInfowindow;
var markerStart, markerEnd, markerRoute;
var pointX, pointY, pointDiv;
var mapBusStopMarker          = []; // 지도내 버스정류소 마크
var mapBusStopInfowindow      = []; // 지도내 버스정류소 정보


var routeLine                     ; // 환승라인
var routeBusStopMarker        = []; // 환승 버스정류소 마크


function setIconImg() {
    
    // 정류소
    busIcon[0] = new daum.maps.MarkerImage("/images/busmap/st_ic03_1.gif",
                                            new daum.maps.Size(10, 14),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          );
    
    // 버스(상행)
    busIcon[1] = new daum.maps.MarkerImage("/images/busmap/busfront_ic01.gif",
                                            new daum.maps.Size(22, 23),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          ); // 노랑
    
    // 버스(하행)
    busIcon[2] = new daum.maps.MarkerImage("/images/busmap/busfront_ic02.gif",
                                            new daum.maps.Size(22, 23),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          ); // 청록

    // 버스(고장/사고)
    busIcon[3] = new daum.maps.MarkerImage("/images/busmap/busfront_ic03.gif",
                                            new daum.maps.Size(22, 23),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          );
    
    
    // 핀
    busIcon[4] = new daum.maps.MarkerImage("/images/busmap/icon_tack01.png",
                                            new daum.maps.Size(32, 55),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          );
    
    // 기점
    busIcon[5] = new daum.maps.MarkerImage("/images/busmap/start_ic01.gif",
                                            new daum.maps.Size(62, 67),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          );
    
    
    // 종점
    busIcon[6] = new daum.maps.MarkerImage("/images/busmap/end_ic01.gif",
                                            new daum.maps.Size(62, 67),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          );
    
    // 정류소 (BIT 설치 정류소)
    busIcon[7] = new daum.maps.MarkerImage("/images/busmap/st_ic03_2.gif",
                                            new daum.maps.Size(10, 14),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          );    
    
    // 정류소 (지도내 정류소)
    busIcon[8] = new daum.maps.MarkerImage("/images/busmap/st_ic03_3.gif",
                                            new daum.maps.Size(10, 14),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          );
    
    // 버스(저상상행)
    busIcon[9] = new daum.maps.MarkerImage("/images/busmap/busfront_ic01_1.gif",
                                            new daum.maps.Size(22, 23),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          ); // 노랑
    
    // 버스(저상하행)
    busIcon[10] = new daum.maps.MarkerImage("/images/busmap/busfront_ic02_1.gif",
                                            new daum.maps.Size(22, 23),
                                            "",
                                            "poly",
                                            "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                                          ); // 청록
    
    
}

//--------------------------------------------------
// 노선 컬러
//--------------------------------------------------
function setLineColor() {
    lineColor[0]  = "#FF0000";
    lineColor[1]  = "#0100FF"; // FF9900 #3DB7CC #0100FF
    lineColor[2]  = "#6633FF";
    lineColor[3]  = "#00CC33";
    lineColor[4]  = "#3333FF";
    lineColor[5]  = "#330099";
    lineColor[6]  = "#9933CC";
    lineColor[7]  = "#990000";
    lineColor[8]  = "#CCFF00";
    lineColor[9]  = "#FF33FF";
    lineColor[10] = "#006600";
    
    routeLineColor[0]  = "#FF0000";
    routeLineColor[1]  = "#0033FF"; //"#3333FF";
    routeLineColor[2]  = "#6633FF";
}

//--------------------------------------------------
// 다음지도 노선, 정류소, 정보 DRAW
//--------------------------------------------------
var daum_map = {
        
        //--------------------------------------------------
        // 지도 초기화
        //--------------------------------------------------
        init:function (vId, vLevel, vLat, vLng, vArrive) {

            if (vId    == "" || vId    == undefined) vId    = gId   ; // 지도가 위치할 HTML 엘리먼트
            if (vLevel == "" || vLevel == undefined) vLevel = gLevel; // 확대 수준 (기본값: 3)
            if (vLat   == "" || vLat   == undefined) vLat   = gLat  ; // 중심 좌표 (필수) 
            if (vLng   == "" || vLng   == undefined) vLng   = gLng  ; // 중심 좌표 (필수)
            
            map = new daum.maps.Map(
                    vId,
                    {
                        center: new daum.maps.LatLng(vLat, vLng),
                        level : vLevel
                    }
                  );
            
            var zoomControl    = new daum.maps.ZoomControl();
            map.addControl(zoomControl, daum.maps.ControlPosition.RIGHT);
            
            var mapTypeControl = new daum.maps.MapTypeControl();
            map.addControl(mapTypeControl, daum.maps.ControlPosition.TOPRIGHT);
            
            daum.maps.event.addListener(map, "idle", function() {
                
                if (vArrive != 1) {
                
                    if (map.getLevel() <= 4) {
                        var coords = map.getBounds();
                        
                        daum_map.mapBusStopMarker(coords.getSouthWest().getLat(), coords.getSouthWest().getLng(), coords.getNorthEast().getLat(), coords.getNorthEast().getLng(), map.getLevel());
                    } else {
                        if (mapBusStopMarker.length != 0) {
                            daum_map.mapBusStopUnMarker();
                        }
                    }
                } else { // 출발도착 검색일 경우에는 3레벨 부터 정류소 표시
                    if (map.getLevel() <= 3) {
                        var coords = map.getBounds();
                        
                        daum_map.mapBusStopMarker(coords.getSouthWest().getLat(), coords.getSouthWest().getLng(), coords.getNorthEast().getLat(), coords.getNorthEast().getLng(), map.getLevel());
                    } else {
                        if (mapBusStopMarker.length != 0) {
                            daum_map.mapBusStopUnMarker();
                        }
                    }
                }
            });            
            
            if(vArrive == 1) { // 빠른 길찾기
                daum.maps.disableBusSymbol();
                
                daum.maps.event.addListener(map, "rightclick",  function(event) {           
                    daum_map.arriveLayer(event.point.x, event.point.y, event.latLng);
                });
                
                daum.maps.event.addListener(map, "click",  function(event) {            
                    $("#divArrive").hide();
                });
            } else {
                daum.maps.disableBusSymbol();
            }
            
            setIconImg(); // 아이콘 이미지
            setLineColor(); // 라인컬러
        },
		
		// -----------------
		// 특별제안 추가 부분(거리계산) 
		// ------------------
        
		mapLine:function () {
           
            
            var drawingFlag = false; // 선이 그려 지고 있는 상태를 가지고 있을 변수입니다
            var moveLine2; // 선이 그려지고 있을때 마우스 움직임에 따라 그려질 선 객체 입니다
            var clickLine2; // 마우스로 클릭한 좌표로 그려질 선 객체입니다
            var distanceOverlay2; // 선의 거리정보를 표시할 커스텀오버레이 입니다
            var dots2 = {}; // 선이 그려지고 있을때 클릭할 때마다 클릭 지점과 거리를 표시하는 커스텀 오버레이 배열입니다.
            
         // 지도에 클릭 이벤트를 등록합니다
         // 지도를 클릭하면 선 그리기가 시작됩니다 그려진 선이 있으면 지우고 다시 그립니다
         daum.maps.event.addListener(map, 'click', function(mouseEvent) {

             // 마우스로 클릭한 위치입니다 
             var clickPosition = mouseEvent.latLng;
             
             // 지도 클릭이벤트가 발생했는데 선을 그리고있는 상태가 아니면
             if (!drawingFlag) {

                 // 상태를 true로, 선이 그리고있는 상태로 변경합니다
                 drawingFlag = true;
                 
                 // 지도 위에 선이 표시되고 있다면 지도에서 제거합니다
                 deleteclickLine2();
                 
                 // 지도 위에 커스텀오버레이가 표시되고 있다면 지도에서 제거합니다
                 deleteDistnce();

                 // 지도 위에 선을 그리기 위해 클릭한 지점과 해당 지점의 거리정보가 표시되고 있다면 지도에서 제거합니다
                 deleteCircleDot();
             
                 // 클릭한 위치를 기준으로 선을 생성하고 지도위에 표시합니다
                 clickLine2 = new daum.maps.Polyline({
                     map: map, // 선을 표시할 지도입니다 
                     path: [clickPosition], // 선을 구성하는 좌표 배열입니다 클릭한 위치를 넣어줍니다
                     strokeWeight: 3, // 선의 두께입니다 
                     strokeColor: '#db4040', // 선의 색깔입니다
                     strokeOpacity: 1, // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
                     strokeStyle: 'solid' // 선의 스타일입니다
                 });
                 
                 // 선이 그려지고 있을 때 마우스 움직임에 따라 선이 그려질 위치를 표시할 선을 생성합니다
                 moveLine2 = new daum.maps.Polyline({
                     strokeWeight: 3, // 선의 두께입니다 
                     strokeColor: '#db4040', // 선의 색깔입니다
                     strokeOpacity: 0.5, // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
                     strokeStyle: 'solid' // 선의 스타일입니다    
                 });
             
                 // 클릭한 지점에 대한 정보를 지도에 표시합니다
                 displayCircleDot(clickPosition, 0);

                     
             } else { // 선이 그려지고 있는 상태이면

                 // 그려지고 있는 선의 좌표 배열을 얻어옵니다
                 var path = clickLine2.getPath();

                 // 좌표 배열에 클릭한 위치를 추가합니다
                 path.push(clickPosition);
                 
                 // 다시 선에 좌표 배열을 설정하여 클릭 위치까지 선을 그리도록 설정합니다
                 clickLine2.setPath(path);

                 var distance = Math.round(clickLine2.getLength());
                 displayCircleDot(clickPosition, distance);
             }
         });
         
      // 지도에 마우스무브 이벤트를 등록합니다
      // 선을 그리고있는 상태에서 마우스무브 이벤트가 발생하면 그려질 선의 위치를 동적으로 보여주도록 합니다
      daum.maps.event.addListener(map, 'mousemove', function (mouseEvent) {

          // 지도 마우스무브 이벤트가 발생했는데 선을 그리고있는 상태이면
          if (drawingFlag){
              
              // 마우스 커서의 현재 위치를 얻어옵니다 
              var mousePosition = mouseEvent.latLng; 

              // 마우스 클릭으로 그려진 선의 좌표 배열을 얻어옵니다
              var path = clickLine2.getPath();
              
              // 마우스 클릭으로 그려진 마지막 좌표와 마우스 커서 위치의 좌표로 선을 표시합니다
              var movepath = [path[path.length-1], mousePosition];
              moveLine2.setPath(movepath);    
              moveLine2.setMap(map);
              
              var distance = Math.round(clickLine2.getLength() + moveLine2.getLength()), // 선의 총 거리를 계산합니다
                  content = '<div class="dotOverlay distanceInfo">총거리 <span class="number">' + distance + '</span>m</div>'; // 커스텀오버레이에 추가될 내용입니다
              
              // 거리정보를 지도에 표시합니다
              showDistance(content, mousePosition);   
          }             
      });                 

      // 지도에 마우스 오른쪽 클릭 이벤트를 등록합니다
      // 선을 그리고있는 상태에서 마우스 오른쪽 클릭 이벤트가 발생하면 선 그리기를 종료합니다
      daum.maps.event.addListener(map, 'rightclick', function (mouseEvent) {

          // 지도 오른쪽 클릭 이벤트가 발생했는데 선을 그리고있는 상태이면
          if (drawingFlag) {
              
              // 마우스무브로 그려진 선은 지도에서 제거합니다
              moveLine2.setMap(null);
              moveLine2 = null;  
              
              // 마우스 클릭으로 그린 선의 좌표 배열을 얻어옵니다
              var path = clickLine2.getPath();
          
              // 선을 구성하는 좌표의 개수가 2개 이상이면
              if (path.length > 1) {

                  // 마지막 클릭 지점에 대한 거리 정보 커스텀 오버레이를 지웁니다
                  if (dots2[dots2.length-1].distance) {
                      dots2[dots2.length-1].distance.setMap(null);
                      dots2[dots2.length-1].distance = null;    
                  }

                  var distance = Math.round(clickLine2.getLength()), // 선의 총 거리를 계산합니다
                      content = getTimeHTML(distance); // 커스텀오버레이에 추가될 내용입니다
                      
                  // 그려진 선의 거리정보를 지도에 표시합니다
                  showDistance(content, path[path.length-1]);  
                   
              } else {

                  // 선을 구성하는 좌표의 개수가 1개 이하이면 
                  // 지도에 표시되고 있는 선과 정보들을 지도에서 제거합니다.
                  deleteclickLine2();
                  deleteCircleDot(); 
                  deleteDistnce();

              }
              
              // 상태를 false로, 그리지 않고 있는 상태로 변경합니다
              drawingFlag = false;          
          }  
      });    

      // 클릭으로 그려진 선을 지도에서 제거하는 함수입니다
      function deleteclickLine2() {
          if (clickLine2) {
              clickLine2.setMap(null);    
              clickLine2 = null;        
          }
      }

      // 마우스 드래그로 그려지고 있는 선의 총거리 정보를 표시하거
      // 마우스 오른쪽 클릭으로 선 그리가 종료됐을 때 선의 정보를 표시하는 커스텀 오버레이를 생성하고 지도에 표시하는 함수입니다
      function showDistance(content, position) {
          
          if (distanceOverlay2) { // 커스텀오버레이가 생성된 상태이면
              
              // 커스텀 오버레이의 위치와 표시할 내용을 설정합니다
              distanceOverlay2.setPosition(position);
              distanceOverlay2.setContent(content);
              
          } else { // 커스텀 오버레이가 생성되지 않은 상태이면
              
              // 커스텀 오버레이를 생성하고 지도에 표시합니다
              distanceOverlay2 = new daum.maps.CustomOverlay({
                  map: map, // 커스텀오버레이를 표시할 지도입니다
                  content: content,  // 커스텀오버레이에 표시할 내용입니다
                  position: position, // 커스텀오버레이를 표시할 위치입니다.
                  xAnchor: 0,
                  yAnchor: 0,
                  zIndex: 3  
              });      
          }
      }

      // 그려지고 있는 선의 총거리 정보와 
      // 선 그리가 종료됐을 때 선의 정보를 표시하는 커스텀 오버레이를 삭제하는 함수입니다
      function deleteDistnce () {
          if (distanceOverlay2) {
              distanceOverlay2.setMap(null);
              distanceOverlay2 = null;
          }
      }

      // 선이 그려지고 있는 상태일 때 지도를 클릭하면 호출하여 
      // 클릭 지점에 대한 정보 (동그라미와 클릭 지점까지의 총거리)를 표출하는 함수입니다
      function displayCircleDot(position, distance) {

          // 클릭 지점을 표시할 빨간 동그라미 커스텀오버레이를 생성합니다
          var circleOverlay = new daum.maps.CustomOverlay({
              content: '<span class="dot"></span>',
              position: position,
              zIndex: 1
          });

          // 지도에 표시합니다
          circleOverlay.setMap(map);

          if (distance > 0) {
              // 클릭한 지점까지의 그려진 선의 총 거리를 표시할 커스텀 오버레이를 생성합니다
              var distanceOverlay2 = new daum.maps.CustomOverlay({
                  content: '<div class="dotOverlay">거리 <span class="number">' + distance + '</span>m</div>',
                  position: position,
                  yAnchor: 1,
                  zIndex: 2
              });

              // 지도에 표시합니다
              distanceOverlay2.setMap(map);
          }

          // 배열에 추가합니다
          dots2.push({circle:circleOverlay, distance: distanceOverlay2});
      }

      // 클릭 지점에 대한 정보 (동그라미와 클릭 지점까지의 총거리)를 지도에서 모두 제거하는 함수입니다
      function deleteCircleDot() {
          var i;

          for ( i = 0; i < dots2.length; i++ ){
              if (dots2[i].circle) { 
                  dots2[i].circle.setMap(null);
              }

              if (dots2[i].distance) {
                  dots2[i].distance.setMap(null);
              }
          }

          dots2 = [];
      }

      // 마우스 우클릭 하여 선 그리기가 종료됐을 때 호출하여 
      // 그려진 선의 총거리 정보와 거리에 대한 도보, 자전거 시간을 계산하여
      // HTML Content를 만들어 리턴하는 함수입니다
      function getTimeHTML(distance) {

          // 도보의 시속은 평균 4km/h 이고 도보의 분속은 67m/min입니다
          var walkkTime = distance / 67 | 0;
          var walkHour = '', walkMin = '';

          // 계산한 도보 시간이 60분 보다 크면 시간으로 표시합니다
          if (walkkTime > 60) {
              walkHour = '<span class="number">' + Math.floor(walkkTime / 60) + '</span>시간 '
          }
          walkMin = '<span class="number">' + walkkTime % 60 + '</span>분'

          // 자전거의 평균 시속은 16km/h 이고 이것을 기준으로 자전거의 분속은 267m/min입니다
          var bycicleTime = distance / 227 | 0;
          var bycicleHour = '', bycicleMin = '';

          // 계산한 자전거 시간이 60분 보다 크면 시간으로 표출합니다
          if (bycicleTime > 60) {
              bycicleHour = '<span class="number">' + Math.floor(bycicleTime / 60) + '</span>시간 '
          }
          bycicleMin = '<span class="number">' + bycicleTime % 60 + '</span>분'

          // 거리와 도보 시간, 자전거 시간을 가지고 HTML Content를 만들어 리턴합니다
          var content = '<ul class="dotOverlay distanceInfo">';
          content += '    <li>';
          content += '        <span class="label">총거리</span><span class="number">' + distance + '</span>m';
          content += '    </li>';
          content += '    <li>';
          content += '        <span class="label">도보</span>' + walkHour + walkMin;
          content += '    </li>';
          content += '    <li>';
          content += '        <span class="label">자전거</span>' + bycicleHour + bycicleMin;
          content += '    </li>';
          content += '</ul>'

          return content;
      }

        },


        //--------------------------------------------------
        // 버스 초기화
        //--------------------------------------------------
        busInit:function () {
            
            for (var i=0; i < line.length; i++) {
                
                // 버스링크 경로 해제
                daum_map.busUnLinkLine(i);
                
                // 버스 정류소 해제, 버스 정류소 팝업 원도우 해제, 도착정보 팝업 원도우 해제
                daum_map.busStopUnMarker(i);                
                
                // 버스 위치 해제
                daum_map.busLocationUnMarker(i);
            }
            
            // 버스 정류소 핀 마크 해제
            daum_map.busDetailUnStation();
            
        },

        //--------------------------------------------------
        // 지도 중앙선택 + 지도레벨
        //--------------------------------------------------
        setCenterLevel:function (latitude, longitude, level) {
            map.setCenter(new daum.maps.LatLng(latitude, longitude));
            map.setLevel(level);
        },
        
        //--------------------------------------------------
        // 버스링크 경로 그리기
        //--------------------------------------------------
        busLinkLine:function (idx, list) {
            
            var arr = [];
            if (list != "") {
                
                $(list).each(function(index, item) {
            
                    if (index == 0) {
                        if (item.LATITUDE != null && item.LONGITUDE != null) {
                            map.setCenter(new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE));
                        } else {
                             alert('좌표정보가 존재하지 않습니다.');
                             return;
                        }
                    }
                    
                    if (item.LATITUDE != null && item.LONGITUDE != null) {
                        arr.push(new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE));  
                    }
                    
                });
            }
            
            var len = String(idx).length;
            
            line[idx] = new daum.maps.Polyline({
                strokeColor : lineColor[idx < 10 ? idx:String(idx).substring(len-1)] // "#F00000" //#FE908D #0035F3
            });
            
            line[idx].setPath(arr);
            line[idx].setMap(map);
            
            map.setLevel(7);
        },
        
        //--------------------------------------------------
        // 버스링크 경로 해제
        //--------------------------------------------------
        busUnLinkLine:function (idx) {
            if (line[idx] != undefined) {
                line[idx].setMap(null);    
            }
        },
        
        //--------------------------------------------------
        // 버스 정류소 그리기
        //--------------------------------------------------
        busStopMarker:function (idx, list) {
            
            if (list != "") {
                
                busStopMarker      [idx] = new Array(list.length);
                busStopInfowindow  [idx] = new Array(list.length);
                busArriveInfowindow[idx] = new Array(list.length);

                var busIconImg = "";
                 
                $(list).each(function(index, item) {
                    
                    if (item.RETURN_FLAG == 2) {        // 기점
                        busIconImg = busIcon[5];
                    } else if (item.RETURN_FLAG == 3) { // 종점
                        busIconImg = busIcon[6];
                    } else {
                        if (item.BIT_FLAG == 'Y') {     // BIT 설치 정류소 (파랑)
                            busIconImg = busIcon[7];
                        } else {                        // 일반 정류소(주황)
                            busIconImg = busIcon[0];
                        }
                    }

                    busStopMarker[idx][index] = new daum.maps.Marker({
                        position : new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE),
                        image    : busIconImg
                    });
                    
                    // 타이틀 설정
                    //busStopMarker[idx][index].setTitle("[" + item.ARS_ID + "] "+ item.BUSSTOP_NAME + "("+ item.BUSSTOP_ID + ")");
                    
                    busStopMarker[idx][index].setZIndex(100);
                    busStopMarker[idx][index].setMap(map);
                    
                    // Mouse Over Event
                    daum.maps.event.addListener(busStopMarker[idx][index], "mouseover", function() {
                        
                        busStopInfowindow[idx][index] = new daum.maps.InfoWindow({
                            //content   : '<p><b>' + item.LINE_NAME  + "</b>:[" + item.ARS_ID + "] "+ item.BUSSTOP_NAME + "("+ item.BUSSTOP_ID + ")" + '</p>',
                            content   : '<p><b>' + item.LINE_NAME  + "</b>:[" + item.ARS_ID + "] "+ item.BUSSTOP_NAME + '</p>',
                            removable : false
                        });
                        
                        busStopInfowindow[idx][index].setZIndex(200);
                        busStopInfowindow[idx][index].open(map, busStopMarker[idx][index]);
                        
                    });
                    
                    // Mouse Out Event
                    daum.maps.event.addListener(busStopMarker[idx][index], "mouseout", function() {
                        busStopInfowindow[idx][index].close();
                    });
                    
                    // Click Event
                    daum.maps.event.addListener(busStopMarker[idx][index], "click", function() {
                        daum_map.busStationInfo(idx, index, item);
                    });
                    
                });
            }            

        },

        //--------------------------------------------------
        // 버스 정류소 그리기 (지도내 버스 정류소) 초기화
        //--------------------------------------------------
        mapBusStopUnMarker:function() {
            if (busStationLocationInfowindow != undefined) {
                busStationLocationInfowindow.close();
            }

            if (busStationLocationMarker != undefined) {
                busStationLocationMarker.setMap(null);
            }
            
            if(mapBusStopMarker.length != 0) {
                
                for(var i=0; i<mapBusStopMarker.length; i++){              
                    mapBusStopMarker[i].setMap(null); 
                }
            }
            
            if(mapBusStopInfowindow.length != 0) {
                for(var i=0; i<mapBusStopInfowindow.length; i++){              
                    mapBusStopInfowindow[i].setMap(null); 
                }
            }   
            
        },
        
        //--------------------------------------------------
        // 버스 정류소 그리기 (지도내 버스 정류소)
        //--------------------------------------------------
        mapBusStopMarker:function (swLat, swLng, neLat, neLng, mapLv) {
            
            daum_map.mapBusStopUnMarker();
            
            var url = '/busmap/mapStationListTemp2?SW_LNG=' + swLng + '&NE_LNG=' + neLng + '&SW_LAT=' + swLat + '&NE_LAT=' + neLat;
            
            $.ajax({
                url        : url,
                type       : 'POST',
                cache      : false,
                dataType   : 'json',
                success    : function(data, textStatus, jqXHR) {
                                 var ARS_ID = "";
                                 //var NEXT_BUSSTOP = "";
                                 $(data.list).each(function(index, item) {
                                     mapBusStopMarker[index] = new daum.maps.Marker({
                                         position : new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE),
                                         image    : busIcon[8]
                                     });
                                     
                                     ARS_ID = "";
                                     if (item.ARS_ID != null) {
                                         ARS_ID = "[" + item.ARS_ID + "] ";
                                     }

                                     // 시청요청으로 다음정류소 제거 : (2014-07-02 김지훈)
                                     //NEXT_BUSSTOP = "";
                                     //if (item.NEXT_BUSSTOP != null) {
                                     //    NEXT_BUSSTOP = "→" + item.NEXT_BUSSTOP;
                                     //}
                                     
                                     mapBusStopMarker[index].setZIndex(10);
                                     //mapBusStopMarker[index].setTitle(ARS_ID + item.BUSSTOP_NAME + NEXT_BUSSTOP + "("+ item.BUSSTOP_ID + ")");
                                     //mapBusStopMarker[index].setTitle(ARS_ID + item.BUSSTOP_NAME + NEXT_BUSSTOP);
                                     mapBusStopMarker[index].setTitle(ARS_ID + item.BUSSTOP_NAME);
                                     mapBusStopMarker[index].setMap(map);
                                     
                                     // 버스 타이틀
                                     if (mapLv <= 3) { // 지도레벨이 2이하 일때만 버스 정류소명을 표시한다. (2014-07-02 추가 김지훈)
                                         //mapBusStopInfowindow[index] = new SimpleTextMarker(new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE), "<span style='font-size:11px;font-weight:bold;text-align:center;background-color:white'>" + ARS_ID + item.BUSSTOP_NAME + NEXT_BUSSTOP + "("+ item.BUSSTOP_ID + ")" + "<span>");
                                         //mapBusStopInfowindow[index] = new SimpleTextMarker(new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE), "<span style='font-size:11px;font-weight:bold;text-align:center;background-color:white'>" + ARS_ID + item.BUSSTOP_NAME + NEXT_BUSSTOP + "<span>");
                                         mapBusStopInfowindow[index] = new SimpleTextMarker(new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE), "<span style='font-size:11px;font-weight:bold;text-align:center;background-color:white'>" + ARS_ID + item.BUSSTOP_NAME + "<span>");
                                         mapBusStopInfowindow[index].setMap(map);
                                     }
                                     
                                     // Click Event
                                     daum.maps.event.addListener(mapBusStopMarker[index], "click", function() {
                                         daum_map.busStationLocation(item.BUSSTOP_ID, item.BUSSTOP_NAME + "→" + item.NEXT_BUSSTOP , item.LONGITUDE, item.LATITUDE);
                                     });
                                     
                                     
                                 });
                             },
                error      : function(data, textStatus, jqXHR) {
                                
                             }
           });
        },

        //--------------------------------------------------
        // 버스 정류소 해제, 버스 정류소 팝업 원도우 해제, 도착정보 팝업 원도우 해제
        //--------------------------------------------------
        busStopUnMarker:function (idx) {
            
            // 버스 정류소 해제
            if (busStopMarker[idx] != undefined) {
                if(busStopMarker[idx].length!=0){
                    
                    for(var i=0; i<busStopMarker[idx].length; i++){ 
                        if (busStopMarker[idx][i] != undefined) {
                            busStopMarker[idx][i].setMap(null);
                        }
                    }
                }
            }
            
            // 버스 정류소 팝업 원도우 해제
            if (busStopInfowindow[idx] != undefined) {
                if(busStopInfowindow[idx].length != 0) {

                    for(var i=0; i<busStopInfowindow[idx].length; i++){
                        if (busStopInfowindow[idx][i] != undefined) {
                            busStopInfowindow[idx][i].close();
                        }
                    }
                }           
            }
            
            // 도착정보 팝업 원도우 해제
            if (busArriveInfowindow[idx] != undefined) {
                if(busArriveInfowindow[idx].length != 0){

                    for(var i=0; i<busArriveInfowindow[idx].length; i++){               
                        
                        if (busArriveInfowindow[idx][i] != undefined) {
                            busArriveInfowindow[idx][i].close();
                        }
                    }
                }   
            }
            
            // 버스 정류소 핀 마크 해제
            daum_map.busDetailUnStation();
        },
        
        //--------------------------------------------------
        // 버스 정류소 정보(버스도착정보)
        //--------------------------------------------------
        busStationInfo:function (idx, index, param) {
            
            var url = '/busmap/lineStationArriveInfoListTemp2?BUSSTOP_ID=' + param.BUSSTOP_ID;
            
            $.ajax({
                url        : url,
                type       : 'POST',
                cache      : false,
                //data       : $("#form1").serialize(),
                dataType   : 'json',
                success    : function(data, textStatus, jqXHR) {
                    
                               var sHtml;
							   // 계림사거리(1001) BUSSTOP_ID=2765 정류소 예외처리를 26.5.8 '99999'번으로 예외처리하여 동작안하도록 변경하였습니다.
                               if(param.BUSSTOP_ID == 99999)
                                   sHtml = fnArriveHtml2(param.LINE_NAME, param.BUSSTOP_NAME, data.list, data.line);
                               else
                                   sHtml = fnArriveHtml(param.LINE_NAME, param.BUSSTOP_NAME, data.list, data.line);
                               
                               busArriveInfowindow[idx][index] = new daum.maps.InfoWindow({
                                   content   : '<p>' + sHtml + '</p>',
                                   removable : true
                               });
                               
                               busArriveInfowindow[idx][index].setZIndex(300);
                               
                               busArriveInfowindow[idx][index].open(map, busStopMarker[idx][index]);
                               
                             },
                error      : function(data, textStatus, jqXHR) {
                                alert("'" + param.BUSSTOP_NAME + "' 버스도착정보 취득중 에러가 발생 했습니다.");
                             }

           });          
            
        },
        
        //--------------------------------------------------
        // 버스 위치 그리기
        //--------------------------------------------------
        busLocationMarker:function(idx, list) {
            
            if (list != "") {
                
                busLocationMarker    [idx] = new Array(list.length);
                busLocationInfowindow[idx] = new Array(list.length);
                
                var busIconImg = "";
                
                $(list).each(function(index, item) {
                    
                    if (item.CURR_BUSSTOP_SEQ < item.RETURN_SEQ) { // 상행
                        busIconImg = busIcon[1];
                        
                        if (item.LOW_BUS == 1) {
                            busIconImg = busIcon[9];
                        }

                    } else { // 하행
                        busIconImg = busIcon[2];

                        if (item.LOW_BUS == 1) { // 저상버스
                            busIconImg = busIcon[10];
                        }
                    }
                    
                    busLocationMarker[idx][index] = new daum.maps.Marker({
                        position : new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE),
                        image    : busIconImg
                        
                    });
                    
                    //busLocationMarker[idx][index].setTitle("[" + item.BUS_ID + "] "+ item.BUSSTOP_NAME + item.NEXT_BUSSTOP + "("+ item.CURR_BUSSTOP_SEQ + ")");
                    
                    busLocationMarker[idx][index].setMap(map);
                    
                    
                    // Mouse Over Event
                    daum.maps.event.addListener(busLocationMarker[idx][index], "mouseover", function() {
                        
                        busLocationInfowindow[idx][index] = new daum.maps.InfoWindow({
                            content   : "<p>[" + item.BUS_ID + "] "+ item.BUSSTOP_NAME + item.NEXT_BUSSTOP + "("+ item.CURR_BUSSTOP_SEQ + ")</p>",
                            removable : false
                        });
                        
                        busLocationInfowindow[idx][index].open(map, busLocationMarker[idx][index]);
                    });
                    
                    // Mouse Out Event
                    daum.maps.event.addListener(busLocationMarker[idx][index], "mouseout", function() {
                        busLocationInfowindow[idx][index].close();
                    });                 
                    
                });
            }                       
        },            
       
        //--------------------------------------------------
        // 버스 위치 초기화
        //--------------------------------------------------
        busLocationUnMarker:function(idx) {
            
            // 버스 위치 마크 해제
            if (busLocationMarker[idx] != undefined) {
                if(busLocationMarker[idx].length!=0) {
                    
                    for(var i=0; i<busLocationMarker[idx].length; i++){             
                        busLocationMarker[idx][i].setMap(null); 
                    }
                }
            }
            
            // 버스 위치 팝업 원도우 해제
            if (busLocationInfowindow[idx] != undefined) {
                if(busLocationInfowindow[idx].length != 0){

                    for(var i=0; i<busLocationInfowindow[idx].length; i++){
                        if (busLocationInfowindow[idx][i] != undefined) {
                            busLocationInfowindow[idx][i].close();
                        }
                    }
                }           
            }
        },     
        
        //--------------------------------------------------
        // 버스 위치 그리기(운수회사용)
        //--------------------------------------------------
        busCompLocationMarker:function(idx, list) {
            
            if (list != "") {
                
                busCompLocationMarker    [idx] = new Array(list.length);
                busCompLocationInfowindow[idx] = new Array(list.length);
                
                var busIconImg = "";
                var busHint    = "";
                $(list).each(function(index, item) {
                    
                    if (item.CURR_STATUS == "6" || item.CURR_STATUS == "7" || item.CURR_STATUS == "8" || item.CURR_STATUS == "9" || item.CURR_STATUS == "12") {
                        
                        if (item.CURR_STATUS == "6") {
                            busHint = "사고";
                        } else if (item.CURR_STATUS == "7") {
                            busHint = "고장";
                        } else if (item.CURR_STATUS == "8") {
                            busHint = "노선이탈";
                        } else if (item.CURR_STATUS == "9") {
                            busHint = "공차";
                        } else if (item.CURR_STATUS == "12") {
                            busHint = "단말기장애";
                        }
                            
                        busIconImg = busIcon[3];
                    } else if (item.CURR_BUSSTOP_SEQ < item.RETURN_SEQ) {
                        busIconImg = busIcon[1];
                    } else {
                        busIconImg = busIcon[2];
                    }

                    busCompLocationMarker[idx][index] = new daum.maps.Marker({
                        position : new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE),
                        image    : busIconImg
                        
                    });
                    
                    //busCompLocationMarker[idx][index].setTitle("[" + item.BUS_ID + "] "+ item.BUSSTOP_NAME + "("+ item.CURR_BUSSTOP_SEQ + ")");
                    
                    busCompLocationMarker[idx][index].setMap(map);
                    
                    
                    busCompLocationInfowindow[idx][index] = new daum.maps.InfoWindow({
                        content   : "<span style='font-size:11px'>" + busHint + "[" + item.BUS_ID + "] "+ item.BUSSTOP_NAME + "<span>",
                        removable : false,
                        disableAutoPan : true
                    });
                    
                    busCompLocationInfowindow[idx][index].open(map, busCompLocationMarker[idx][index]);

                    /*
                    // Mouse Over Event
                    daum.maps.event.addListener(busCompLocationMarker[idx][index], "mouseover", function() {
                        
                        busCompLocationInfowindow[idx][index] = new daum.maps.InfoWindow({
                            content   : "<p>[" + item.BUS_ID + "] "+ item.BUSSTOP_NAME + "("+ item.CURR_BUSSTOP_SEQ + ")</p>",
                            removable : false
                        });
                        
                        busCompLocationInfowindow[idx][index].open(map, busCompLocationMarker[idx][index]);
                    });
                    
                    // Mouse Out Event
                    daum.maps.event.addListener(busCompLocationMarker[idx][index], "mouseout", function() {
                        busCompLocationInfowindow[idx][index].close();
                    });
                    */                 
                    
                });
            }                       
        },            
       
        //--------------------------------------------------
        // 버스 위치 초기화(운수회사용)
        //--------------------------------------------------
        busCompLocationUnMarker:function(idx) {
            
            // 버스 위치 마크 해제
            if (busCompLocationMarker[idx] != undefined) {
                if(busCompLocationMarker[idx].length!=0) {
                    
                    for(var i=0; i<busCompLocationMarker[idx].length; i++){             
                        busCompLocationMarker[idx][i].setMap(null); 
                    }
                }
            }
            
            // 버스 위치 팝업 원도우 해제
            if (busCompLocationInfowindow[idx] != undefined) {
                if(busCompLocationInfowindow[idx].length != 0){

                    for(var i=0; i<busCompLocationInfowindow[idx].length; i++){
                        if (busCompLocationInfowindow[idx][i] != undefined) {
                            busCompLocationInfowindow[idx][i].close();
                        }
                    }
                }           
            }
        },          
        
        //--------------------------------------------------
        // 버스 정류소 선택
        //--------------------------------------------------
        busDetailStation:function(idx, line_name, busstop_id, busstop_name, longitude, latitude) {
            
            daum_map.busDetailUnStation();
            
            map.setCenter(new daum.maps.LatLng(latitude, longitude));
            
            busStationMarker[idx] = new daum.maps.Marker({
                position : new daum.maps.LatLng(latitude, longitude),
                image    : busIcon[4]
            });         
            busStationMarker[idx].setMap(map);
            
            var url = '/busmap/lineStationArriveInfoListTemp2?BUSSTOP_ID=' + busstop_id;
            
            
            $.ajax({
                url        : url,
                type       : 'POST',
                cache      : false,
                //data       : $("#form1").serialize(),
                dataType   : 'json',
                success    : function(data, textStatus, jqXHR) {
                    
                               var sHtml;
							   // 계림사거리(1001) BUSSTOP_ID=2765 정류소 예외처리를 26.5.8 '99999'번으로 예외처리하여 동작안하도록 변경하였습니다.
                               if(busstop_id == 99999)
                                   sHtml = fnArriveHtml2(line_name, busstop_name, data.list, data.line);
                               else
                                   sHtml = fnArriveHtml(line_name, busstop_name, data.list, data.line);
                               
                               busStationInfowindow[idx] = new daum.maps.InfoWindow({
                                   content   : '<p>' + sHtml + '</p>',
                                   removable : true
                               });
                               
                               busStationInfowindow[idx].setZIndex(300);
                               
                               busStationInfowindow[idx].open(map, busStationMarker[idx]);
                               
                               // Click Event
                               daum.maps.event.addListener(busStationMarker[idx], "click", function() {

                                   busStationInfowindow[idx].open(map, busStationMarker[idx]);
                               });                             
                               
                             },
                error      : function(data, textStatus, jqXHR) {
                                alert("'" + param.BUSSTOP_NAME + "' 버스도착정보 취득중 에러가 발생 했습니다.");
                             }

           });          
        },
        
        //--------------------------------------------------
        // 버스 정류소 초기화
        //--------------------------------------------------
        busDetailUnStation:function() {
            
            if (busStationMarker != undefined) {
                if(busStationMarker.length != 0) {
                    for(var i=0; i<busStationMarker.length; i++){
                        if (busStationMarker[i] != undefined) {
                            busStationMarker[i].setMap(null);
                        }   
                    }
                }
            }

            if (busStationInfowindow != undefined) {
                if(busStationInfowindow.length != 0){
                    for(var i=0; i<busStationInfowindow.length; i++){               
                        if (busStationInfowindow[i] != undefined) {
                            busStationInfowindow[i].close();
                        }
                    }
                }
            }
        },        
        
        //--------------------------------------------------
        // 버스 정류소 위치 선택
        //--------------------------------------------------
        busStationLocation:function(busstop_id, busstop_name, longitude, latitude) {
            daum_map.busStationUnLocation();
            map.setCenter(new daum.maps.LatLng(latitude, longitude));
            
            busStationLocationMarker = new daum.maps.Marker({
                position : new daum.maps.LatLng(latitude, longitude),
                image    : busIcon[4]
            });
            busStationLocationMarker.setMap(map);
            
            var url = '/busmap/lineStationArriveInfoListTemp2?BUSSTOP_ID=' + busstop_id;
            
            $.ajax({
                url        : url,
                type       : 'POST',
                cache      : false,
                //data       : $("#form1").serialize(),
                dataType   : 'json',
                success    : function(data, textStatus, jqXHR) {
                    
                               var sHtml;
                               // 계림사거리(1001) BUSSTOP_ID=2765 정류소 예외처리를 26.5.8 '99999'번으로 예외처리하여 동작안하도록 변경하였습니다.
                               if(busstop_id == 99999)
                                   sHtml = fnArriveHtml2('', busstop_name, data.list, data.line);
                               else
                                   sHtml = fnArriveHtml('', busstop_name, data.list, data.line);
                               
                               busStationLocationInfowindow = new daum.maps.InfoWindow({
                                   content   : '<p>' + sHtml + '</p>',
                                   removable : true
                               });
                               
                               busStationLocationInfowindow.setZIndex(300);
                               
                               busStationLocationInfowindow.open(map, busStationLocationMarker);
                               
                               // Click Event
                               daum.maps.event.addListener(busStationLocationMarker, "click", function() {

                                   busStationLocationInfowindow.open(map, busStationLocationMarker);
                               });                               
                               
                             },
                error      : function(data, textStatus, jqXHR) {
                                alert("'" + param.BUSSTOP_NAME + "' 버스도착정보 취득중 에러가 발생 했습니다.");
                             }

           });              
        },
        
        //--------------------------------------------------
        // 버스 정류소 위치 초기화
        //--------------------------------------------------
        busStationUnLocation:function() {
            if (busStationLocationMarker != undefined) {
                busStationLocationMarker.setMap(null);
            } 
            
            if (busStationLocationInfowindow != undefined) {
                busStationLocationInfowindow.close();
            } 
        }, 
        
        //--------------------------------------------------
        // 빠른길찾기 버스링크 경로 그리기
        //--------------------------------------------------
        busArriveInfoLinkLine:function (list) {
            
            for (var i=0; i < arriveLine.length; i++) {
                // 버스링크 경로 해제
                daum_map.busArriveInfoUnLinkLine(i);
            }
            
            var lineInfos       = list.split("^");
            var lineInfo        = "";
            var busTypes        = "";
            var pointInfo       = "";
            var arriveLineColor = "";
            
            
            for (var i=0; i<lineInfos.length; i++) {
                
                lineInfo  = lineInfos[i].split("|");
                
                busTypes  = lineInfo[0].split("_");
                pointInfo = lineInfo[1].split(",");
                
                arriveLineColor = daum_map.getArriveLineColor(busTypes[0], busTypes[1]);
                
                var arr = [];
                for(var j=0; j<pointInfo.length; j++) {
                    
                    arr.push(new daum.maps.LatLng(pointInfo[j+1], pointInfo[j]));
                    
                    if (i == 0 && j == 0) {           
                        map.setLevel(7);
                        var point = new daum.maps.LatLng(pointInfo[j+1], pointInfo[j]);     
                        map.setCenter(point);
                        
                        daum_map.setImage(pointInfo[j+1], pointInfo[j], "S", "busArrival");
                        
                    } else if (i == lineInfos.length-1 && j == pointInfo.length-2) {
                        daum_map.setImage(pointInfo[j+1], pointInfo[j], "E", "busArrival");
                    }
                    
                    j++;
                    
                }
                
                arriveLine[i] =  new daum.maps.Polyline({ strokeWeight:5, strokeColor:arriveLineColor, fillColor: arriveLineColor, strokeOpacity : 1});
                arriveLine[i].setPath(arr);
                arriveLine[i].setMap(map);
            }
        },    
        
        //--------------------------------------------------
        // 빠른길찾기 버스링크 경로 해제
        //--------------------------------------------------
        busArriveInfoUnLinkLine:function (idx) {
            if (arriveLine[idx] != undefined) {
                arriveLine[idx].setMap(null);    
            }
        },
        
        busArriveInfoInit:function () {
            for (var i=0; i < arriveLine.length; i++) {
                // 버스링크 경로 해제
                daum_map.busArriveInfoUnLinkLine(i);
            }
            
            if(pointX != null) {
                pointX = null;
            }
        
            if (pointY != null) {        
                pointY = null;
            }
            
            if(markerStart != null) {
                markerStart.setMap(null);
            }
        
            if (markerEnd!=null) {        
                markerEnd.setMap(null);
            }
        },
        
        
        //--------------------------------------------------
        // 빠른길찾기 출발, 도착 이미지 설정 해제
        //--------------------------------------------------
        setUnImage:function (sType) {
            if (sType == "S") {
                if(markerStart != null) {
                    markerStart.setMap(null);
                }
            } else if (sType == "E") {
                if (markerEnd!=null) {        
                    markerEnd.setMap(null);
                }
            } else if (sType == "R") {
                if (markerRoute!=null) {        
                    markerRoute.setMap(null);
                }
            }
        },

        //--------------------------------------------------
        // 빠른길찾기 출발, 도착 이미지 설정
        //--------------------------------------------------
        setImage:function (sX, sY, sType, sGubun) {
            
            if (sType == "S") {
                if(markerStart != null) {
                    markerStart.setMap(null);
                }
            } else if (sType == "E") {
                if (markerEnd!=null) {        
                    markerEnd.setMap(null);
                }
            } else if (sType == "R") {
                if (markerRoute!=null) {        
                    markerRoute.setMap(null);
                }
            }
            
            var point = new daum.maps.LatLng(sX, sY);       
                
            var imgPath = "/images/busmap/arrive_start01.gif"; // 출발
            
            if(sGubun =="busLine"){
                imgPath = "/images/busmap/start_ic01.gif"; // 기점
            }
            
            if(sType=="E"){       
                if(sGubun =="busLine") {
                    imgPath = "/images/busmap/end_ic01.gif"; // 종점
                } else {  
                    imgPath = "/images/busmap/arrive_end01.gif"; // 도착
                }
            }
            
            if(sType=="R"){       
                imgPath = "/images/busmap/icon_transfer.gif"; // 환승
            }            
            
            var icon = new daum.maps.MarkerImage (
                           imgPath,
                           new daum.maps.Size(26, 29),
                           "",
                           "poly",
                           "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
                       );
                
            if (sType=="S") {
                markerStart = new daum.maps.Marker({
                                  position: point,
                                  image: icon
                              }); 
                markerStart.setMap(map);
                
            } else if (sType=="E"){    
                markerEnd = new daum.maps.Marker({
                                position: point,
                                image: icon
                            }); 
                markerEnd.setMap(map);
                
            } else if (sType=="R"){    
                markerRoute = new daum.maps.Marker({
                                position: point,
                                image: icon
                            }); 
                markerRoute.setMap(map);                
                
            }            
        },
        
        //--------------------------------------------------
        // 빠른길찾기 노선 컬러 취득
        //--------------------------------------------------
        getArriveLineColor:function (type, subType) {
            
            var lineColor = "";
            
            if (type == '02') { // 버스
                switch (subType) {
                    case '0101' : lineColor = '#009CE2'; break; // 간선
                    case '0102' : lineColor = '#009CE2'; break; // 지선
                    case '0103' : lineColor = '#009CE2'; break; // 광역
                    case '0104' : lineColor = '#009CE2'; break; // 순환
                    case '0105' : lineColor = '#009CE2'; break; // 공항
                    case '0106' : lineColor = '#009CE2'; break; // 일반
                    case '0107' : lineColor = '#FF4500'; break; // 좌석
                    case '0108' : lineColor = '#FF4500'; break; // 급행
                    case '0109' : lineColor = '#009CE2'; break; // 마을
                    case '0110' : lineColor = '#009CE2'; break; // 직행
                    case '0111' : lineColor = '#009CE2'; break; // 외곽
                    case '0112' : lineColor = '#009CE2'; break; // 시외
                    case '0113' : lineColor = '#009CE2'; break; // 농어촌
                    default     : lineColor = '#808080'; break; // 기타
                } 
                
            } else if (type == '06') { // 지하철
                switch (subType) {
                    case '062401' : lineColor = '#FF5F00'; break; // 광주지하철 1호선
                    case '062402' : lineColor = '#4CBC01'; break; // 광주지하철 2호선
                    default       : lineColor = '#808080'; break; // 기타
                }
                
            } else if (type == "99") { // 도보
                lineColor = "#808080";
            
            } else {
                lineColor = "#808080";
                
            }
            
            return lineColor;
        },        
        
        //--------------------------------------------------
        // 빠른길찾기 출발/도착 레이어
        //--------------------------------------------------
        arriveLayer:function (pX, pY, latLng) {
            $("#divArrive").attr("style", "position:absolute; top:"+(pY)+"px; left:"+(pX)+"px; width:130px;border-top:1px solid #B1C8E0; border-left:1px solid #B1C8E0;border-right:2px solid #7E9BB1;border-bottom:2px solid #7E9BB1; background:#FFF;z-index:50; display:black");
            pointX = latLng.getLat();
            pointY = latLng.getLng();
        },
        
        
        
        //--------------------------------------------------
        // 환승 버스링크 경로 해제
        //--------------------------------------------------
        routeBusUnLinkLine:function (idx) {
            if (arriveLine[idx] != undefined) {
                arriveLine[idx].setMap(null);    
            }
        },
        
        routeInfoInit:function () {
            for (var i=0; i < arriveLine.length; i++) {
                // 버스링크 경로 해제
                daum_map.routeBusUnLinkLine(i);
            }
            
            if(pointX != null) {
                pointX = null;
            }
        
            if (pointY != null) {        
                pointY = null;
            }
            
            if(markerStart != null) {
                markerStart.setMap(null);
            }
        
            if (markerEnd!=null) {        
                markerEnd.setMap(null);
            }

            if (markerRoute!=null) {        
                markerRoute.setMap(null);
            }
            
            if (busStopMarker != undefined) {
                if(busStopMarker.length != 0) {
                    for(var i=0; i<busStopMarker.length; i++){
                        daum_map.busStopUnMarker(i);  
                    }
                }
            }
            
            daum_map.busStationUnLocation();
        },
        
        //--------------------------------------------------
        // 환승 버스링크 경로 그리기
        //--------------------------------------------------
        routeBusLinkLine:function (idx, list) {
            
            daum_map.routeBusUnLinkLine(idx);
            
            var arr = [];
            if (list != "") {
                
                $(list).each(function(index, item) {
                    if (item.LATITUDE != null && item.LONGITUDE != null) {
                        arr.push(new daum.maps.LatLng(item.LATITUDE, item.LONGITUDE));  
                    }
                    
                });
            }
            
            arriveLine[idx] = new daum.maps.Polyline({
                strokeColor : routeLineColor[idx < 10 ? idx:String(idx).substring(len-1)]
            });
            
            arriveLine[idx].setPath(arr);
            arriveLine[idx].setMap(map);
            
        }        
};


//--------------------------------------------------
// 버스타입
//--------------------------------------------------
var busType = function (value) {
    var image_name = "ic_type_";
    
    if (value == 1) { // 급행간선
        image_name += "gp.gif";
    } else if (value == 2) { // 간선
        image_name += "gan.gif";
    } else if (value == 3) { // 지선
        image_name += "ji.gif";
    } else if (value == 4) { // 마을버스
        image_name += "ma.gif";
    } else if (value == 5) { // 공항버스
        image_name += "gong.gif";            
    } else if (value == 8) { // 직행
        image_name += "jik.png";
    }
    else {
        image_name += "etc.gif";
    }
    
    return '<img style="margin-left:5px;margin-top:0px" height="14" width="14" src="/images/busmap/' + image_name + '" /> ';
};

//--------------------------------------------------
// 버스 도착정보 Html
//--------------------------------------------------
function fnArriveHtml(sLineName, sBusstopName, dataList, dataLine) {
    
       var sHtml        = "";
       var line_name    = ""; // 노선번호
       var busstop_name = ""; // 현재위치
       var remain_time  = ""; // 도착예상시간
       var dir_name     = ""; // 행선지
       var arrive_flag  = ""; // 곧도착 : 1
       var remain_stop  = ""; // 남은 정류소 수
       
       
       var bgcolor      = "#C7DAC1"; //"#FCF9D1"; //"#F3F5E0";

       if (sLineName == "") {
           sHtml += "<div id='busArriveInfo' style='height:250px;overflow-x:hidden; overflow-y:auto;'>";
           sHtml += "<ul style='width:600px;'>";
           sHtml += "  <li style='float:left; list-style-type:none; text-align:center; width:550px;height:25px;margin-top:5px;color:#660099'><b>'" + sBusstopName  + "' 버스도착정보</b></li>";
           sHtml += "</ul>";
       } else {
           sHtml += "<div id='busArriveInfo' style='height:250px;overflow-x:hidden; overflow-y:auto;'>";
           sHtml += "<ul style='width:600px;'>";
           sHtml += "  <li style='float:left; list-style-type:none; text-align:center; width:550px;height:25px;margin-top:5px;color:#660099'><b>버스운행정보(" + sLineName + ") '" + sBusstopName  + "' 버스도착정보</b></li>";
           sHtml += "</ul>";
       }
       
//       sHtml += "<ul style='width:600px;'>";
//       sHtml += "  <li style='float:left; list-style-type:none;width:580px;border-bottom:1px solid #e5e5e5; '></li>";
//       sHtml += "</ul>";

       sHtml += "<ul style='width:600px;background-color:" + bgcolor + "; color:#003366;'>";
       sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:80px;height:22px; line-height:22px; background-color:" + bgcolor + ";'>노선번호</li>";
       sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:150px;height:22px; line-height:22px; background-color:" + bgcolor + ";'>현재위치</li>";
       sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:100px;height:22px;line-height:22px; background-color:" + bgcolor + ";'>도착예상시간</li>";
       sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:80px;height:22px; line-height:22px; background-color:" + bgcolor + ";'>남은정류소</li>";
       sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:140px;height:22px; line-height:22px; background-color:" + bgcolor + ";'>행선지</li>";
       sHtml += "</ul>";

//       sHtml += "  <li style='float:left; list-style-type:none;width:580px;border-bottom:1px solid #e5e5e5; '></li>";
       sHtml += "</ul>";

       $(dataList).each(function(index, item) {
           
           //alert(item.REMAIN_STOP);
           
//           line_name    = item.LINE_NAME; // 노선번호
           line_name    = item.SHORT_LINE_NAME; // 노선번호
           busstop_name = item.BUSSTOP_NAME  ; // 현재위치
           remain_time  = item.REMAIN_MIN    ; // 도착예상시간
           dir_name     = item.DIR_END       ; 
           arrive_flag  = item.ARRIVE_FLAG   ;
           remain_stop  = item.REMAIN_STOP   ;
           
        //    if (item.LOW_BUS == 1) { // 저상버스
        //        line_name += "(저)";
        //    }
           
           if (busstop_name == "" || busstop_name == "999") {
               remain_time  = ""; // 운행대기
               busstop_name = ""; // 운행대기
               
           } else if (arrive_flag == "1") {
               remain_time  = "곧 도착";
               
           } else {
               remain_time  = "약 " + remain_time + " 분";
           }
           
           sHtml += "<ul style='width:600px;'>"; 
           sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:5px; width:80px; height:20px'>" + line_name    + "</li>";
           sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:5px; width:150px;'>" + busstop_name + "</li>";
           sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:5px; width:100px ;'>" + remain_time  + "</li>";
           sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:5px; width:80px ;'>" + remain_stop  + "</li>";
           sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:5px; width:140px;'>" + dir_name     + "</li>";
           sHtml += "</ul>";
           
           sHtml += "<ul style='width:600px;'>";
           sHtml += "  <li style='float:left; list-style-type:none;width:550px;border-bottom:1px solid #e5e5e5; '></li>";
           sHtml += "</ul>";
       });
       
       if (dataList.length == 0) {
           sHtml += "<ul style='width:600px;'>";
           sHtml += "  <li style='float:left; list-style-type:none;text-align:center;width:550px;'>버스 도착정보가 없습니다.</li>";
           sHtml += "</ul>";
           
           sHtml += "<ul style='width:600px;'>";
           sHtml += "  <li style='float:left; list-style-type:none;width:550px;border-bottom:1px solid #e5e5e5; '></li>";
           sHtml += "</ul>";
           
       }
       
       // 경유노선
       sHtml += "<ul style='width:600px;background-color:#FFFFFF; color:#003366;'>";
       sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:10px;font-weight:bold; width:550px ;height:20px;background-color:#FFFFFF;'>" + sBusstopName + " 경유노선</li>";
       sHtml += "</ul>";
       
       $(dataLine).each(function(index, item) {
           if (index%6 == 0) {
               sHtml += "<ul style='width:600px;'>";    
           }
           
//           sHtml += "  <li style='float:left; list-style-type:none; text-align:left;margin-top:5px; width:90px ;height:20px'>" + busType(item.LINE_KIND) + item.LINE_NAME  + "</li>";
           sHtml += "  <li style='float:left; list-style-type:none; text-align:left;margin-top:5px; width:90px ;height:20px'; title='aaa'>" + busType(item.LINE_KIND) +"<div style='display:inline-block;width:66px;white-space: nowrap;overflow: hidden;" +
           		"'>"+ item.LINE_NAME  + "</div></li>";
            
           if (index%5 == 0) {
               sHtml += "</ul>";    
           }           
       });
       
       sHtml += "<ul style='width:600px;'>";
       sHtml += "  <li style='list-style-type:none;width:550px;height=10px'>&nbsp;</li>";
       sHtml += "</ul>";
       sHtml += "</div>";
       
       return sHtml;
}

function fnArriveHtml2(sLineName, sBusstopName, dataList, dataLine) {

    var sHtml        = "";
    var line_name    = ""; // 노선번호
    var busstop_name = ""; // 현재위치
    var remain_time  = ""; // 도착예상시간
    var dir_name     = ""; // 행선지
    var arrive_flag  = ""; // 곧도착 : 1
    var remain_stop  = ""; // 남은 정류소 수
    
    
    var bgcolor      = "#C7DAC1"; //"#FCF9D1"; //"#F3F5E0";

    if (sLineName == "") {
        sHtml += "<div id='busArriveInfo' style='height:250px;overflow-x:hidden; overflow-y:auto;'>";
        sHtml += "<ul style='width:600px;'>";
        sHtml += "  <li style='float:left; list-style-type:none; text-align:center; width:550px;height:25px;margin-top:5px;color:#660099'><b>'" + sBusstopName  + "' 버스도착정보</b></li>";
        sHtml += "</ul>";
    } else {
        sHtml += "<div id='busArriveInfo' style='height:250px;overflow-x:hidden; overflow-y:auto;'>";
        sHtml += "<ul style='width:600px;'>";
        sHtml += "  <li style='float:left; list-style-type:none; text-align:center; width:550px;height:25px;margin-top:5px;color:#660099'><b>버스운행정보(" + sLineName + ") '" + sBusstopName  + "' 버스도착정보</b></li>";
        sHtml += "</ul>";
    }
    
//    sHtml += "<ul style='width:600px;'>";
//    sHtml += "  <li style='float:left; list-style-type:none;width:580px;border-bottom:1px solid #e5e5e5; '></li>";
//    sHtml += "</ul>";

    sHtml += "<ul style='width:600px;background-color:" + bgcolor + "; color:#003366;'>";
    sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:80px;height:22px; line-height:22px; background-color:" + bgcolor + ";'>노선번호</li>";
    sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:150px;height:22px; line-height:22px; background-color:" + bgcolor + ";'>현재위치</li>";
    sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:100px;height:22px;line-height:22px; background-color:" + bgcolor + ";'>도착예상시간</li>";
    sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:80px;height:22px; line-height:22px; background-color:" + bgcolor + ";'>남은정류소</li>";
    sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:0px;font-weight:bold; width:140px;height:22px; line-height:22px; background-color:" + bgcolor + ";'>행선지</li>";
    sHtml += "</ul>";

//    sHtml += "  <li style='float:left; list-style-type:none;width:580px;border-bottom:1px solid #e5e5e5; '></li>";
    sHtml += "</ul>";
    
    sHtml += "<ul style='width:600px;'>";
    sHtml += "  <li style='float:left; list-style-type:none;text-align:center;width:550px; height:80px; line-height:80px; color:#a00; font-weight:bold; font-size:17px;'>재개발 공사로 인해 진행방향 서방사거리육교 정류소와 통합 운영</li>";
    sHtml += "</ul>";
    
    sHtml += "<ul style='width:600px;'>";
    sHtml += "  <li style='float:left; list-style-type:none;width:550px;border-bottom:1px solid #e5e5e5; '></li>";
    sHtml += "</ul>";

    
    // 경유노선
    sHtml += "<ul style='width:600px;background-color:#FFFFFF; color:#003366;'>";
    sHtml += "  <li style='float:left; list-style-type:none; text-align:center;margin-top:10px;font-weight:bold; width:550px ;height:20px;background-color:#FFFFFF;'>" + sBusstopName + " 경유노선</li>";
    sHtml += "</ul>";
    
    $(dataLine).each(function(index, item) {
        if (index%6 == 0) {
            sHtml += "<ul style='width:600px;'>";    
        }
        
//        sHtml += "  <li style='float:left; list-style-type:none; text-align:left;margin-top:5px; width:90px ;height:20px'>" + busType(item.LINE_KIND) + item.LINE_NAME  + "</li>";
        sHtml += "  <li style='float:left; list-style-type:none; text-align:left;margin-top:5px; width:90px ;height:20px'; title='aaa'>" + busType(item.LINE_KIND) +"<div style='display:inline-block;width:66px;white-space: nowrap;overflow: hidden;" +
             "'>"+ item.LINE_NAME  + "</div></li>";
         
        if (index%5 == 0) {
            sHtml += "</ul>";    
        }           
    });
    
    sHtml += "<ul style='width:600px;'>";
    sHtml += "  <li style='list-style-type:none;width:550px;height=10px'>&nbsp;</li>";
    sHtml += "</ul>";
    sHtml += "</div>";
    
    return sHtml;
}


SimpleTextMarker.prototype = new daum.maps.AbstractOverlay;
SimpleTextMarker.prototype.onAdd = function() {
    var panel = this.getPanels().overlayLayer;
    panel.appendChild(this.node_);
};
 
SimpleTextMarker.prototype.onRemove = function() {
    this.node_.parentNode.removeChild(this.node_);
};
 
SimpleTextMarker.prototype.draw = function() {
    var projection = this.getProjection();
    var point = projection.pointFromCoords(this.position_);
    var width = this.node_.offsetWidth;
    var height = this.node_.offsetHeight;
    
    this.node_.style.left = (point.x - width/2) + "px";
    //this.node_.style.top = (point.y - height/2) + "px";
    this.node_.style.top = ((point.y - height/2) - 20) + "px";
    
    //this.node_.style.cssText = "";

};

function SimpleTextMarker(position, text) {
    this.position_ = position;
    this.node_ = document.createElement('div');
    this.node_.setAttribute("style", "z-index:100");
    this.node_.style.position = 'absolute';
    this.node_.style.whiteSpace = 'nowrap';
    this.node_.innerHTML = text;
    //this.node_.appendChild(document.createTextNode(text));
}
