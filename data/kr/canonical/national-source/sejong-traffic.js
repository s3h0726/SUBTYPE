document.write("<script type='text/javascript' src='../../resources/js/naverMapKey.js'></script>");

var oMap = null;	
var viewHeight = 0;
var viewWidth = 0;
var resizeEvent = null;
var SEARCH_PLACES_FUNCTION_ON = false;

//노선 정보 val
var oMarker = new Array();
var oMarkerMulti = new Array();
var mapRouteId = new Array();
var oBusStopMarker = new Array();
var ALL_BUSSTOP_INFO = new HashMap();
var ALL_BUSSTOP_LIST = new Array();

//도착정보 
var arriveInfoPopup = null; // naver.maps.InfoWindow()
var markerLabel = null;     // naver.maps.MarkerLabel()

//정류장
var mapBusStopId = new Array();
var hashMapBusStop = new Object();

//경로탐색
var markerCnt = 0;

var busstopMarker = false;

//마커 이미지 경로 정보
var MARKER_IMG = {
		START 		: "../../resources/images_new/c/icon_route_start.png",		//출발
		BUS_START 	: "../../resources/images_new/c/marker_route_start.png",	//승차	
		BUS_END 	: "../../resources/images_new/c/marker_route_end.png",		//하차	
		END 		: "../../resources/images_new/c/icon_route_end.png",		//도착
		TRANSFER 	: "../../resources/images_new/c/marker_route_transfer.png",	//환승
		BUS1 		: "../../resources/images_new/c/icon_Bus_blue.png", 		//일반 버스
		BUS2 		: "../../resources/images_new/c/icon_Bus_red.png",			//광역 버스
		BUS3 		: "../../resources/images_new/c/icon_Bus_LF.png",			//저상 버스
		BUSSTOP 	: "../../resources/images_new/c/marker_station.png",		//정류장
		BUSSTOP_ON 	: "../../resources/images_new/c/marker_station_ov.png",		//정류장
		GIJUM 		: "../../resources/images_new/c/marker_start.png",			//기점
		
		R_EXSE : {		//출도환
			W : 32,
			H : 37
		},
		S_STOP : {		//정류장
			W : 22,
			H : 22
		},
		S_STED : {		//기종점
			W : 22,
			H : 22
		},
		S_BUS : {		//버스
			W : 25,
			H : 27
		}
};

var CONTENT = '<div class="stationInfo_wrap" tabindex="0">'
    + '<div class="st_header">'
    + '<div class="st_info">'
    + '<p><span id="map_service_id" style="padding-left: 10px;"></span>'
    + '<span id="map_stop_name" style="padding-left: 5px;"></span>'
    + '<a id="btnclose1" href="javascript: void(0);" class="close-btn" title="닫기">대화상자 닫기</a></p></div>'
    + '</div>'
    + '<div class="st_list">'
    + '<table>'
    + '<caption style="height: 0px;width: 0px;font-size: 0px;">정류장 도착정보</caption>'
    + '<thead><tr>'
    + '<th class="st_busNum"><p>노선번호</p></th>'
    + '<th class="st_waitTime"><p>도착예정</p></th>'
    + '<th class="st_where"><p>현재위치</p></th>'
    + '<th class="st_XXX"><p>현재정류장</p></th></tr></thead>'
    + '<tbody id="map_route_data"></tbody>'
    + '</table>'
    + '</div></div>';

$(document).ready(function(){
	/*
	 document.body.oncontextmenu = function (){ return false; };
	 document.body.ondragstart = function (){ return false; };
	 document.body.onselectstart = function (){ return false; };
	 */
	var left_menu = $(".bis_left_menu").width() + 35;
	var header = $(".header1").height() + 10;
	fnResize();
	
	window.onresize = function() { 
		
		if($('#html1').width() > 850){
			fnResize(); 
			
			clearTimeout(resizeEvent);
			resizeEvent = setTimeout(function() {
	        	if(oMap != null)  {
	    			oMap.setSize(new naver.maps.Size(viewWidth - 1, viewHeight - 1)); //실제 크기보다 조금 줄여야 출력되는 이슈 있음
	    		}                
	        }, 10);
		}
	};
	
	createMapView();
	setMapEvent();
	function fnResize() {
		
		$('#html1').height();
		$('#html1').width();
		
		var mapWidth = null;
		if($('#html1').width() > 850){
			mapWidth = $('#html1').width() - left_menu;
		} else {
			mapWidth = 850 - left_menu;
		}
		
		var mapHeight = $('#html1').height() - header;
		
		var bis_search_box = $(".bis_search_box").outerHeight(true);
		var bis_contents_title = $(".bis_contents_title").outerHeight(true);
		
		var bis_contents_tab = 0;
		
		if (SEARCH_PLACES_FUNCTION_ON) {
			bis_contents_tab = $(".tab").outerHeight(true);
		}
		
		$(".map").width(mapWidth + 3);
		$(".map").height(mapHeight - 2);
		$(".bis_left_menu").height(mapHeight);
		$("#bis_contents_ul").height(mapHeight - (bis_search_box + bis_contents_title + 12) - bis_contents_tab);
		$("#local_list_ul").height(mapHeight - (bis_search_box + bis_contents_title + 10) - bis_contents_tab);

		//$("#bis_contents_result_ul").height(mapHeight - (bis_search_box + bis_contents_title + 12));
		$(".bis_footer").width(mapWidth);

		viewHeight = mapHeight - 2;
		viewWidth = mapWidth + 3;
		
		$(".map_cont").height(viewHeight);
		$(".map_cont").width(viewWidth);
		$("#loading_wrap").height(viewHeight);
		$("#loading_wrap").width(viewWidth);
		
	}
	
});

function fnResizeLeft() {
	var header = $(".header1").height() + 10;
	var mapHeight = $('#html1').height() - header;
	
	var bis_search_box = $(".bis_search_box").outerHeight(true);
	var bis_contents_title = $(".bis_contents_title").outerHeight(true);
	$("#bis_contents_result_ul").height(mapHeight - (bis_search_box + bis_contents_title + 12));
}

//BIS 공통 Ajax
function ajaxCall(url, data, beforeSend, success){
	$.ajax({
        type: "POST",
        url: url,
        data: data,
        dataType : "json",
        beforeSend: beforeSend,
        success: success
	});
}

//BIS 공통 Ajax
function ajaxCall(url, data, beforeSend, success, err){
	$.ajax({
      type: "POST",
      url: url,
      data: data,
      dataType : "json",
      beforeSend: beforeSend,
      success: success,
      error: err
	});
}

// 운영시간표 팝업 초기화
function removePopWrap() {
	var $popObj = $(".bis_pop_wrap");
	
	if ($popObj) {
		$(".bis_pop_wrap").empty();
	}	
}

//BIS 공통 슬라이드
function commonBISSlide(obj, slideTarget){
	removePopWrap();
	
	var onClassObj= $('#bis_contents_ul li.on');
	var slideFlag = obj.parents('li').attr('class');
	
	onClassObj.find('.'+slideTarget).hide();
	onClassObj.find('.'+slideTarget).find('ul').empty();
	onClassObj.attr('class', 'off');
	onClassObj.find('.btn_plus').attr("src","../../resources/images_new/w/btn_layer_open.png");
	onClassObj.find('.btn_plus').attr("alt","상세보기");
	onClassObj.find('a').attr("title","상세보기");

	// 키보드 초점
	setTimeout(function() {
		//$(".stationInfo_wrap").focus();
		$(".stationInfo_wrap .close-btn").focus();
	},500);
	
	if(slideFlag == "off") {
		obj.parent().parent().parent().find('.'+slideTarget).slideDown();
		obj.parent().parent().parent().attr('class', 'on');
		obj.parent().attr("title","상세접기");
		obj.attr("src","../../resources/images_new/w/btn_layer_close.png");
		obj.attr("alt","상세접기");
	}
	
}

//BIS 경로탐색 경로 슬라이드
function commonBISSlide0(obj, slideTarget){

	var onClassObj= $('#bis_contents_result_ul li.on');
	var slideFlag = obj.parents('li').attr('class');

	onClassObj.find('.'+slideTarget).hide();
	onClassObj.attr('class', 'off');
	onClassObj.find('.btn_plus').attr("src","../../resources/images_new/w/btn_layer_open.png");
	onClassObj.find('.btn_plus').attr("alt","상세보기");
	onClassObj.find('a').attr("title","상세보기");
	
	if(slideFlag == "off") {
		obj.parent().parent().parent().find('.'+slideTarget).slideDown();
		obj.parent().parent().parent().attr('class', 'on');
		obj.parent().attr("title","상세접기");
		obj.attr("src","../../resources/images_new/w/btn_layer_close.png");
		obj.attr("alt","상세접기");
	}
}

//BIS 경로탐색 정류장 상세 슬라이드
function commonBISSlide1(obj, slideTarget){

	var onClassObj= $('#bis_contents_ul li.on');
	var slideFlag = obj.parents('li').attr('class');
	
	onClassObj.find('.'+slideTarget).hide();
	onClassObj.find('.'+slideTarget).find('ul').empty();
	onClassObj.attr('class', 'off');
	$('.btn_map').attr('class', 'btn_map');
	
	if(slideFlag == "off") {
		obj.parent().parent().parent().find('.'+slideTarget).slideDown();
		obj.parent().parent().parent().attr('class', 'on');
		obj.attr('class', 'btn_map on');
	} else {
		obj.parent().parent().parent().find('.'+slideTarget).hide();
		obj.parent().parent().parent().attr('class', 'off');
		obj.attr('class', 'btn_map');
	}
}

//BIS 경로탐색 정류장 상세(버스 도착 정보) 슬라이드
function commonBISSlide2(obj, slideTarget, flag){

	var onClassObj= $('#bis_contents_ul li.on');
	
	onClassObj.find('.'+slideTarget).hide();
	onClassObj.find('.'+slideTarget).find('ul').empty();
	onClassObj.attr('class', 'off');
	$('.btn_map').attr('class', 'btn_map');
	
	if(flag == "on") {
		obj.parent().parent().parent().find('.'+slideTarget).hide();
		obj.parent().parent().parent().parent().attr('class', 'off');
		obj.attr('class', 'btn_map');
	} else {
		obj.parent().parent().parent().find('.'+slideTarget).slideDown();
		obj.parent().parent().parent().parent().attr('class', 'on');
		obj.attr('class', 'btn_map on');
	}
	
	$('#btnclose1').trigger('click');
	
	// 키보드 초점
	setTimeout(function() {
		//$(".stationInfo_wrap").focus();
		$(".stationInfo_wrap .close-btn").focus();
	},500);
}

//지도 생성	
/*function createMapView() {
	//20171108 네이버지도 관련 작업 후
	//최초 BIS center
	var lati = 36.4934587;
	var longi = 127.2566626;
	
	var tempZoomOptions = { useEffect : true, centerMark : false }; 
	
	var oPoint = new naver.maps.LatLng(lati, longi); // -  지도의 중심점을 나타내는 변수 선언
	oPoint.toString; // - 지도에서 기본적으로 사용하는 좌표계를 설정합니다.
	
	var opts = {
					//mapMode:0, 
					point : oPoint, // - 지도의 중심점을 나타냅니다.
					zoom : 8, // - 초기 줌 레벨은 8 둔다.
					enableWheelZoom : true,
					enableDragPan : true,
					enableDblClickZoom : false,
					mapMode : 0,
					activateTrafficMap : false,
					activateBicycleMap : false,
					minMaxLevel : [ 7, 12 ]
			   };
		
	oMap = new naver.maps.Map(document.getElementById('map_view'), opts);
	
//  	var mapTypeChangeButton = new naver.maps.MapTypeBtn(); // - 지도 타입 버튼 선언
// 	mapTypeChangeButton.setPosition({top:10, right:10}); 	// - 지도 타입 버튼 위치 지정

//    oMap.addControl(mapTypeChangeButton);
    
	arriveInfoPopup = new naver.maps.InfoWindow();
	
	oMap.setCenter(new naver.maps.LatLng(lati, longi), tempZoomOptions);
}
*/





function createMapView() {
	 //최초 BIS center (조치원, 신도시 모두 보이는 지점)
	  /* var lati = 36.558916;
	   var longi = 127.280111;*/
		var lati = 36.510602;
		var longi = 127.247060;
	   var tempZoomOptions = { useEffect : false, centerMark : false }; 
	   var oPoint = new naver.maps.LatLng(lati, longi); // -  지도의 중심점을 나타내는 변수 선언
	   oPoint.toString; // - 지도에서 기본적으로 사용하는 좌표계를 설정합니다.
	   
	   var opts = {
	               //mapMode:0, 
	               center : oPoint, // - 지도의 중심점을 나타냅니다.
	               zoom : 1, // - 초기 줌 레벨은 8으로 둔다.
	               enableWheelZoom : true,
	               enableDragPan : true,
	               enableDblClickZoom : false,
	               mapMode : 0,
	               activateTrafficMap : false,
	               activateBicycleMap : false,
	               //minMaxZoom : [ 8, 11 ],
	               mapTypeControl: true // - 지도 타입 버튼
	            };
	      
	   oMap = new naver.maps.Map(document.getElementById('map_view'),opts);      
	   
	 //  oMap.setOptions({ minZoom: 11, maxZoom: 14 });
	   oMap.setZoom(13);
	   
	   /*var mapZoom = new naver.maps.ZoomControl();          // - 줌 컨트롤 선언
	   oMap.setZoom(oMap.getZoom() + 1);
	   oMap.setZoom(oMap.getZoom() - 1);
	   oMap.setOptions("minZoom", 8);
	   oMap.setOptions("maxZoom", 11);         // - 줌 컨트롤 위치 지정
	*/   
	//   oMap.setCenter(new naver.maps.LatLng(lati, longi), tempZoomOptions);
	
	   // 지도 엔터키 이벤트 감지 - 지도 유형 설정
	   initKeyboardEvent(oMap);

	$("#map_view").removeAttr("tabindex");
}

//지도 재생성
function reloadMapView(){
	$('#map_view').empty();
	createMapView();
	setMapEvent();
}

//지도 이벤트
function setMapEvent() {
	if (typeof(setGnssMapEvent) == 'function') {
		setGnssMapEvent();
		return;
	}
	
	// 마커위에 마우스 올라간거면
	naver.maps.Event.addListener(oMap, 'mouseenter', function(oCustomEvent) {
/*		var oTarget = oCustomEvent.target;
        if (oTarget instanceof naver.maps.Marker) {
               // markerLabel.setVisible(true, oTarget); // - 특정 마커를 지정하여 해당 마커의 title을 보여준다.
        }
*/	});
	
	naver.maps.Event.addListener(oMap, 'mouseleave', function(oCustomEvent) {
/*		var oTarget = oCustomEvent.target;
        if (oTarget instanceof naver.maps.Marker) {
               // markerLabel.setVisible(true, oTarget); // - 특정 마커를 지정하여 해당 마커의 title을 보여준다.
        }
*/	});
/*	oMap.attach('mouseenter', function(oCustomEvent) {
        var oTarget = oCustomEvent.target;
        if (oTarget instanceof naver.maps.Marker) {
               // markerLabel.setVisible(true, oTarget); // - 특정 마커를 지정하여 해당 마커의 title을 보여준다.
        }
	});*/

	// 마커위에서 마우스 나간거면
/*	oMap.attach('mouseleave', function(oCustomEvent) {
		var oTarget = oCustomEvent.target;
        if (oTarget instanceof naver.maps.Marker) {
        	//markerLabel.setVisible(false);
        }
	});*/
	// 마커 클릭하면
	//oMap.attach('click', function(oCustomEvent) {
	naver.maps.Event.addListener(oMap, 'click', function(oCustomEvent) {
		
		
		//경로 탐색 마커 클릭
			//var oTarget = oCustomEvent.target;

            //if ((oTarget instanceof naver.maps.Map) && !(oTarget instanceof naver.maps.Marker)) {
		if($("#stSearchType").val() == "1" || $("#edSearchType").val() == "1"){
            	$("#loading_wrap").show();
 	    	   
	            var clickPoint = oCustomEvent.coord;
	            
	            clearOverlayMap();
	            CIRCLE = new naver.maps.Circle({
	                map: oMap,
	                center: clickPoint,
	                radius: 350,
	                zoom : 12,
	                strokeColor:"red",
	                strokeOpacity:0.4,
	                strokeWidth:1,
	                fillColor:"green",
	                fillOpacity:0.4	                
	            });
	    		 CIRCLE.setMap(oMap);
    			//Ajax Call
	 			var form_data = {
	             		lat: clickPoint.y,
	             		lng: clickPoint.x
	             };
	         	ajaxCall("../../web/traffic/searchBusStopNearUserPoint.do", form_data, ajaxBeforeSendNearPoint, ajaxSuccessNearPoint); //TODO 반경 200미터
	         	oMap.setZoom(10);
             

		}

          // if (oTarget instanceof naver.maps.Event) {
           		//var stop_id = mapBusStopId[oTarget.getZIndex()];
           		
		/*	if(stop_id != undefined && stop_id != "" && stop_id != null){
	           		var stopNmArr = oTarget.getTitle().split("[");

	           		arriveInfoPopup.setVisible(false);
	           		
	           		if($("#stSearchType").val() != null || $("#edSearchType").val() != null){
	           		//경로탐색
		           		if ($("#stSearchType").val() == "1" && $("#edSearchType").val() == "1"){
		           		//출발지/도착지 검색
		           			arriveInfoPopup.setContent(SELECT);
			               	arriveInfoPopup.setPosition({right : 19, top : -55});
			               	
							$("#btn_map_st").click( function(){ 
								$("#stStopId").val(stop_id);
								$("#stBusStop").val(stopNmArr[0]);
								arriveInfoPopup.setVisible(false);	
								STSEARCHFLAG = true;
			        		});
							$("#btn_map_ed").click( function(){ 
								$("#edStopId").val(stop_id);
								$("#edBusStop").val(stopNmArr[0]);
								arriveInfoPopup.setVisible(false);	
								EDSEARCHFLAG = true;
			        		});
			               	
		           		} else if($("#stSearchType").val() == "1"){
						//출발지만 검색	           			
		           			arriveInfoPopup.setContent(SELECT1);
			               	arriveInfoPopup.setPosition({right : 19, top : -25});
			               	
			               	$("#btn_map_st").click( function(){ 
			               		$("#stStopId").val(stop_id);
			               		$("#stBusStop").val(stopNmArr[0]);
			               		arriveInfoPopup.setVisible(false);	
			               		STSEARCHFLAG = true;
			        		});
			               	
		           		} else if ($("#edSearchType").val() == "1"){
		           		//도착지만 검색	
		           			arriveInfoPopup.setContent(SELECT2);
			               	arriveInfoPopup.setPosition({right : 19, top : -25});
			               	
							$("#btn_map_ed").click( function(){ 
								$("#edStopId").val(stop_id);
								$("#edBusStop").val(stopNmArr[0]);
								arriveInfoPopup.setVisible(false);	
								EDSEARCHFLAG = true;
			        		});
			               	
		           		} 
		           		
		           		arriveInfoPopup.setPoint(oTarget.getPoint());
		               	arriveInfoPopup.setVisible(true);
		               	
	           		} else if ($("#stationSearchType").val() != null){
	           		//정류장 검색
	           			if($("#stationSearchType").val() == "1"){
	           		    
	           				$("#busStopId").val(stop_id);
	           				$("#busStop").val(stopNmArr[0]);
	           				
	           				oMap.setCenter(oCustomEvent.point);
	           				
	           				arriveInfoPopup.setVisible(false);
	    	            	arriveInfoPopup.setContent(CONTENT);
	    	            	arriveInfoPopup.setPoint(oTarget.getPoint());
	    	            	arriveInfoPopup.setVisible(true);
	    	            	arriveInfoPopup.setPosition({right : -207, top : 35});
	    	            	
	    	            	$(".stationInfo_wrap").removeAttr("tabindex");
	    	            	
	    	            	var form_data = {
	    	            			busStopId: stop_id
	    	                };
	    	                
	    	                ajaxCall("../../web/traffic/searchBusStopRoute.do", form_data, ajaxBeforeSendMapRouteInfo, ajaxSuccessMapRouteInfo);
		           		}
	           		}*/
	          
               return false;
          // }
           
		//} 
	});
}

function ajaxBeforeSendMapRouteInfo(xhr){
	var strTemp = "";
	strTemp += "<tr><td style='height: 133px;' colspan='3'><img style='width: 20px; height: 20px;' alt='로딩중' src='../../resources/images/w/loader.gif'></td></tr>";
	$("#map_route_data").empty().append(strTemp);
}
function ajaxSuccessMapRouteInfo(data){

	var strTemp = "";
	if(data.busStopRouteList.length == 0){
		strTemp += strTemp += "<tr><td style='font-weight: bold;border-bottom: none;width: 368px;display: inline-block;margin-top: 45px;' colspan='3'>검색결과가 없습니다.</td></tr>";
	} else {
		$("#map_service_id").text("[" + data.busStopRouteList[0].service_id + "]");
		$("#map_stop_name").text(data.busStopRouteList[0].stop_name);
	}
	
	var bef_name = "";
	var bef_veh_id = ""; //차량정보
	
	$.each( data.busStopRouteList, function( index, value ) {
		
		if(value.route_type == 43){
	    	//세종광역
			strTemp += '<tr><td class="st_busNum" style="color: red;">(세종)'+value.route_name+'</td>'; // tabindex="0" 제거 (웹접근성 관련)
	    } else if(value.route_type == 50){
	    	//대전광역
	    	strTemp += '<tr><td class="st_busNum" style="color: red;">(대전)'+value.route_name+'</td>'; // tabindex="0" 제거 (웹접근성 관련)
	    } else if(value.route_type == 51){
	    	//청주광역
	    	strTemp += '<tr><td class="st_busNum" style="color: red;">(청주)'+value.route_name+'</td>'; // tabindex="0" 제거 (웹접근성 관련)
	    }else if(value.route_type == 60 || value.route_type == 13 || value.route_type == 30){ // 마을(30)순환(60)
	    	if(bef_name != value.route_name){
	    			strTemp += '<tr><td class="st_busNum">'+value.route_name+'</td>'; // tabindex="0" 제거 (웹접근성 관련)
	    	}else{
	    		if(bef_veh_id != value.veh_id ){
	    			strTemp += '<tr><td class="st_busNum">'+value.route_name+'</td>'; // tabindex="0" 제거 (웹접근성 관련)
	    		}
	    	}
	    } else {
	    	//일반
	    	strTemp += '<tr><td class="st_busNum">'+value.route_name+'</td>'; // tabindex="0" 제거 (웹접근성 관련)
	    }
		
		if(value.provide_code == 1){
			
			if(value.route_type == 60 || value.route_type == 13 || value.route_type == 30){
		    	if(bef_name != value.route_name){
		    		strTemp += '<td class="st_waitTime">'+(value.provide_type).replace(" 예정", "") + '</td><td class="st_where">'+value.rstop+'</td><td class="st_XXX">'+value.last_stop_name+'</td></tr>';
		    	}else{
		    		if(bef_veh_id != value.veh_id ){
		    			strTemp += '<td class="st_waitTime">'+(value.provide_type).replace(" 예정", "") + '</td><td class="st_where">'+value.rstop+'</td><td class="st_XXX">'+value.last_stop_name+'</td></tr>';
		    		}
		    	}
		    }else{
		    	strTemp += '<td class="st_waitTime">'+(value.provide_type).replace(" 예정", "") + '</td><td class="st_where">'+value.rstop+'</td><td class="st_XXX">'+value.last_stop_name+'</td></tr>';
		    }
			
		} else if(value.provide_code == 2){
			
			if(value.route_type == 60 || value.route_type == 13 || value.route_type == 30){
		    	if(bef_name != value.route_name){
		    		strTemp += '<td class="st_waitTime">회차지 대기중</td><td class="st_where"></td><td class="st_XXX"></td></tr>';
		    	}else{
		    		if(bef_veh_id != value.veh_id ){
		    			strTemp += '<td class="st_waitTime">회차지 대기중</td><td class="st_where"></td><td class="st_XXX"></td></tr>';
		    		}
		    	}
			}else{	
				strTemp += '<td class="st_waitTime">회차지 대기중</td><td class="st_where"></td><td class="st_XXX"></td></tr>';
			}
		} else {
			 if(value.route_type == 60 || value.route_type == 13 || value.route_type == 30){
			    	if(bef_name != value.route_name){
			    		strTemp += '<td class="st_waitTime">'+value.provide_type+'</td><td class="st_where">'+value.rstop+'</td><td class="st_XXX">'+value.last_stop_name+'</td></tr>';
			    	}else{
			    		if(bef_veh_id != value.veh_id ){
			    			strTemp += '<td class="st_waitTime">'+value.provide_type+'</td><td class="st_where">'+value.rstop+'</td><td class="st_XXX">'+value.last_stop_name+'</td></tr>';
			    		}
			    	}
			    }else{
			    	strTemp += '<td class="st_waitTime">'+value.provide_type+'</td><td class="st_where">'+value.rstop+'</td><td class="st_XXX">'+value.last_stop_name+'</td></tr>';    	
			    }			
		}
		
		bef_name = value.route_name;
		bef_veh_id = value.veh_id;
	});
	$("#map_route_data").empty().append(strTemp);
}

//노선 정보 리스트 폴리라인 그리기
function createRoutePolyline(list){
	
	var tempZoomOptions = { useEffect : true, centerMark : false }; 
    //var oPolyline = new naver.maps.Polyline();
    
    
    var oCenterPoint = null; //마커포인트
    
    var latLngArray = new Array();
    
    var oPolyline = new naver.maps.Polyline({
    	path: latLngArray,
    	strokeColor : '#FF0000',
    	strokeWidth : 3,
    	strokeOpacity : 1,
    	//strokeStyle : 'solid'
    });
    var minX = 37.622942;
	var minY = 126.833167;
	var maxX = 37.622942;
	var maxY = 126.833167;
    var boundArray = new Array();
    
    $.each( list, function( index, value ) {
    	
    	if(index == 0){
    		oMap.setCenter(new naver.maps.LatLng(value.lat, value.lng), tempZoomOptions);	// 중심점 변경
    	}
    	latLngArray.push(new naver.maps.LatLng(value.lat, value.lng));
    	
    	if(index == 0 && value.lat != 0 && value.lng != 0) {
    		minX = value.lat;
    		maxX = value.lat;
    		minY = value.lng;
    		maxY = value.lng;
    	}else if(value.lat != 0 && value.lng != 0) {
    		minX = Math.min(minX, value.lat);
    		maxX = Math.max(maxX, value.lat);
    		minY = Math.min(minY, value.lng);
    		maxY = Math.max(maxY, value.lng);
    	}
    	
	});
   
    //oPolyline.setPoints(latLngArray);
    oPolyline = new naver.maps.Polyline({
    	path : latLngArray,
	 	strokeColor : '#FF0000',
		strokeWidth : 3,
		strokeOpacity : 1,
		strokeStyle : 'solid'
	});
//	oMap.addOverlay(oPolyline);
	
    oPolyline.setMap(oMap);
    
	boundArray.push(new naver.maps.LatLng(minX, maxY));
    boundArray.push(new naver.maps.LatLng(maxX, minY));
    //oMap.setBound(boundArray);

    //oMap.fitBounds(boundArray);
    

}

//경로 탐색 리스트 폴리라인 그리기
function createRoutePolyline1(list){

	var tempZoomOptions = { useEffect : true, centerMark : false }; 
    var oCenterPoint = null; //마커포인트
    var latLngArray = new Array();
    var latLngArray1 = new Array();
    
    //var oPolyline = new naver.maps.Polyline();
    var oPolyline = new naver.maps.Polyline({
        path: latLngArray,
        strokeColor : '#FF0000',
		strokeWidth : 3,
		strokeOpacity : 1,
		strokeStyle : 'solid'
    });
    
    //var oPolyline1 = new naver.maps.Polyline();
    var oPolyline1 = new naver.maps.Polyline({
        path: latLngArray1,
        strokeColor : '#FF0000',
		strokeWidth : 3,
		strokeOpacity : 1,
		strokeStyle : 'solid'
    });
    
    
    
    var startFlag = false;
    var endFlag = false;
    
    var minX = 37.622942;
	var minY = 126.833167;
	var maxX = 37.622942;
	var maxY = 126.833167;
    var boundArray = new Array();
    
    $.each( list, function( index, value ) {
    	
    	if(value.st_rank == "1"){
    		startFlag = true;
    	}
    	if(value.ed_rank == "1"){
    		endFlag = true;
    	}

    	if(startFlag){
    		oCenterPoint = new naver.maps.LatLng(value.lat, value.lng);
    		if(endFlag){
 
    			//oCenterPoint.setMap(oMap);
    			
    			//oMap.setCenter(new naver.maps.LatLng(value.lat, value.lng), tempZoomOptions);
    		    //oMap.setCenter(oCenterPoint);
    		    oPolyline.setMap(oMap);
    		    oPolyline1.setMap(oMap);
    		    //oMap.addOverlay(oPolyline);
    			//oMap.addOverlay(oPolyline1);
    			
    			return;
    		}
    		
	    	if(value.seq == "0"){
	    		latLngArray.push(new naver.maps.LatLng(value.lat, value.lng));
	    	} else {
	    		latLngArray1.push(new naver.maps.LatLng(value.lat, value.lng));
	    	}
	    	    	
    	}
    	
    	if(index == 0 && value.lat != 0 && value.lng != 0) {
    		minX = value.lat;
    		maxX = value.lat;
    		minY = value.lng;
    		maxY = value.lng;
    	}else if(value.lat != 0 && value.lng != 0) {
    		minX = Math.min(minX, value.lat);
    		maxX = Math.max(maxX, value.lat);
    		minY = Math.min(minY, value.lng);
    		maxY = Math.max(maxY, value.lng);
    	}
	});
    
  //var oPolyline = new naver.maps.Polyline();
    var oPolyline = new naver.maps.Polyline({
        path: latLngArray,
        strokeColor : '#FF0000',
		strokeWidth : 3,
		strokeOpacity : 1,
		strokeStyle : 'solid'
    });
    
    //var oPolyline1 = new naver.maps.Polyline();
    var oPolyline1 = new naver.maps.Polyline({
        path: latLngArray1,
        strokeColor : '#FF0000',
		strokeWidth : 3,
		strokeOpacity : 1,
		strokeStyle : 'solid'
    });
    
    oPolyline.setMap(oMap);
    oPolyline1.setMap(oMap);
    
    boundArray.push(new naver.maps.LatLng(minX, maxY));
    boundArray.push(new naver.maps.LatLng(maxX, minY));
    //oMap.setBound(boundArray);
    oMap.fitBounds(boundArray);
}

//노선검색 정류장 선택 지도 이벤트
function setScreenLocationCenter(lat, lng, id){

	//var oSize = new naver.maps.Size(MARKER_IMG.S_STOP.W, MARKER_IMG.S_STOP.H);
    //var oOffset = new naver.maps.Size(MARKER_IMG.S_STOP.W/2, MARKER_IMG.S_STOP.H/2);

    //var ori_oIcon = new naver.maps.Icon(MARKER_IMG.BUSSTOP, oSize, oOffset);
    //var sel_oIcon = new naver.maps.Icon(MARKER_IMG.BUSSTOP_ON, oSize, oOffset);
    
    var oPoint = new naver.maps.LatLng(lat, lng); //마커포인트 
	var markerOptions = {
			position: oPoint,
		    //title : value.plate_no,
	        visible : true,
	        clickable : true,
		    icon: {
		    	url: MARKER_IMG.BUSSTOP_ON,
		        //url: '../../resources/images_new/c/icon_Bus_red.png',
//		        size: new naver.maps.Size(oSize),
//		        anchor: new naver.maps.Point(width/2, height/2)
				scaledSize : new naver.maps.Size(22, 22)
		    }
		};
	
	oMarker = new naver.maps.Marker(markerOptions);  //마커 생성 
	oMarker.setMap(oMap); // 추가
   	
	var infowindow = new naver.maps.InfoWindow({
	    content: '선택하신 정류장입니다.'
	    	
	});

	infowindow.open(oMap, oMarker);
    window.setTimeout(function() {
    	infowindow.close();
    	}, 5000);
    
    //for(var i = 0; i < ALL_BUSSTOP_LIST.length; i++){
    //	ALL_BUSSTOP_LIST[i].setIcon(ori_oIcon);
    //}
    
	//(ALL_BUSSTOP_INFO.get(id)).setIcon(sel_oIcon);
	
	var tempZoomOptions = { useEffect : true, centerMark : false }; 
	oMap.setZoom(12);
	oMap.setCenter(new naver.maps.LatLng(lat, lng), tempZoomOptions);	// 중심점 변경
}

//단건 마커 생성
function createCommonBisMarkerOne(lat, lng, tit, type, img, width, height, stop_id){

	//arriveInfoPopup.setVisible(false);
	
	var tempZoomOptions = { useEffect : true, centerMark : false }; 
	
	//var oSize = new naver.maps.Size(width, height);
    //var oOffset = new naver.maps.Size(width/2, height/2);
    //var oIcon = new naver.maps.Icon(img, oSize, oOffset);
    
	var oPoint = new naver.maps.LatLng(lat, lng); //마커포인트 
	if(type == 1){
		var markerOptions = {
		    position: oPoint,
		    title : tit,
	        visible : true,
	        clickable : true,
		    icon: {
		    	url : MARKER_IMG.GIJUM,
		        //size: new naver.maps.Size(30, 30),
		        //anchor: new naver.maps.Point(80, 80),
				scaledSize : new naver.maps.Size(MARKER_IMG.R_EXSE.W, MARKER_IMG.R_EXSE.H)
		    }
		};
		
		oMarker[type] = new naver.maps.Marker(markerOptions);  //마커 생성
		oMarker[type].setMap(oMap);
	}else if(type == 2){
		var markerOptions = {
			    position: oPoint,
			    title : tit,
		        visible : true,
		        clickable : true,
			    icon: {
			    	url : MARKER_IMG.BUSSTOP,
					scaledSize : new naver.maps.Size(22, 22)
			    }
			};
		    
			$("#busStopId").val(stop_id);
			//$("#busStop").val(stopNmArr[0]);
				
			//oMap.setCenter(oCustomEvent.point);
			
			// 마커 정보 표시
			arriveInfoPopup = new naver.maps.InfoWindow({
			    content: CONTENT,
			    maxWidth: 400,
			    backgroundColor: "#eee",
			    //borderColor: "#2db400",
			    //borderWidth: 5,
			    anchorSize: new naver.maps.Size(20, 30),
			    anchorSkew: true,
			    //anchorColor: "#eee",
			    pixelOffset: new naver.maps.Point(50, -20)

			});
        
        	oMarker[type] = new naver.maps.Marker(markerOptions);  //마커 생성
        	oMap.setZoom(12);
        	oMarker[type].setMap(oMap);
       		arriveInfoPopup.open(oMap, oMarker[type]);
			
			
/*			arriveInfoPopup.setVisible(false);
        	arriveInfoPopup.setContent(CONTENT);
        	arriveInfoPopup.setPoint(oTarget.getPoint());
        	arriveInfoPopup.setVisible(true);
        	arriveInfoPopup.setPosition({right : -207, top : 35});
*/        	
        	var form_data = {
        			busStopId: stop_id
            };
            
            ajaxCall("../../web/traffic/searchBusStopRoute.do", form_data, ajaxBeforeSendMapRouteInfo, ajaxSuccessMapRouteInfo);
            $('#btnclose1').click(function(){
            	// 팝업 닫기
            	arriveInfoPopup.close();
            	
            	// 키보드 초점
            	//$("#" + keyObj).focus();
            	if(keyObj) {
            		$(keyObj).focus();
            	}
            	//2025.09.30 추가.
            	if(bisKeyObj2) {
            		$(bisKeyObj2).focus();
            	}
            	
    		});
            
			$(oMarker[type].eventTarget).on("click", function() {
            //naver.maps.Event.addListener(oMarker[type], 'click', function() {
            	arriveInfoPopup.open(oMap, oMarker[type]);
            	
            	// 키보드 초점
            	setTimeout(function() {
            		//$(".stationInfo_wrap").focus();
					$(".stationInfo_wrap .close-btn").focus();
            	},500);		
            	
            	keyObj = $(this);		
            	
            });
            
            $(".stationInfo_wrap").removeAttr("tabindex");
            
   		
	}else{
		var markerOptions = {
			    position: oPoint,
			    title : tit,
		        visible : true,
		        clickable : true,
			    icon: {
			    	url : img,
			        //size: new naver.maps.Size(30, 30),
			        //anchor: new naver.maps.Point(80, 80),
					scaledSize : new naver.maps.Size(MARKER_IMG.R_EXSE.W, MARKER_IMG.R_EXSE.H)
			    }
			};
			
			oMarker[type] = new naver.maps.Marker(markerOptions);  //마커 생성
			oMarker[type].setMap(oMap);
	}
	
/*	oMarker[type] = new naver.maps.Marker(markerOptions);  //마커 생성
	oMarker[type].setMap(oMap);*/
	
	//oMap.setLevel(12);
	oMap.setCenter(new naver.maps.LatLng(lat, lng), tempZoomOptions);	// 중심점 변경
	
	if(stop_id != "" && stop_id != null){
		oMarker[type].setZIndex(0);
		mapBusStopId[0] = stop_id;
	}
	return oMarker[type];
}

//정류장 검색 마커 선택
function setBusStopMarkerSelect(lat, lng, tit, type, img, width, height, stop_id){
	
	arriveInfoPopup.setVisible(false);
	
	var tempZoomOptions = { useEffect : true, centerMark : false }; 
	
	oMap.setLevel(12);
	oMap.setCenter(new naver.maps.LatLng(lat, lng), tempZoomOptions);	// 중심점 변경
	
	return oMarker[type];
}

//포인트 변경
function setCenterPointLocation(lat, lng){
	
	arriveInfoPopup.close();
	
	var tempZoomOptions = { useEffect : true, centerMark : false }; 
	
	//oMap.setLevel(12);
	oMap.setCenter(new naver.maps.LatLng(lat, lng), tempZoomOptions);	// 중심점 변경
}

//버스 정류장 멀티 마커 생성
function createBisBusStopMarkerMulti(list, type, img, width, height){

	//var oSize = new naver.maps.Size(width, height);
    //var oOffset = new naver.maps.Size(width/2, height/2);
    //var oIcon = new naver.maps.Icon(img, oSize, oOffset);
    
    $.each( list, function( index, value ) {
    	//oMarker[type] = new naver.maps.Marker(oIcon, { title : value.stop_name +"["+value.service_id+"]" });
    	
    	var oPoint = new naver.maps.LatLng(value.lat, value.lng); //마커포인트 
		var markerOptions = {
				position: oPoint,
			    title : value.stop_name +"["+value.service_id+"]",
		        visible : true,
		        clickable : true,
			    icon: {
			        url: MARKER_IMG.BUSSTOP,
//			        size: new naver.maps.Size(oSize),
//			        anchor: new naver.maps.Point(width/2, height/2)
			        scaledSize : new naver.maps.Size(22, 22)
			    }
			};

		oMarker[type] = new naver.maps.Marker(markerOptions);  //마커 생성 
		oMarker[type].setMap(oMap); // 추가
    	
    	
    	
    	//oMarker[type].setPoint(new naver.maps.LatLng(value.lat, value.lng));
    	//oMap.addOverlay(oMarker[type]); 
    	
    	oMarker[type].setZIndex(index+1);
    	mapBusStopId[index+1] = value.stop_id;
	});
	
}

//노선 검색 버스 정류장 멀티 마커 생성
function createBisBusStopMarkerMulti1(list, img, width, height){
    
    $.each( list, function( index, value ) {
    	
    	var oPoint = new naver.maps.LatLng(value.lat, value.lng); //마커포인트 
		var markerOptions;
		if(index == 0) {
			markerOptions = {
				position: oPoint,
			    title : value.stop_name +"["+value.service_id+"]",
		        visible : true,
		        clickable : true,
				zIndex : list.length + 1,
			    icon: {
			    	url : MARKER_IMG.GIJUM,
			        scaledSize : new naver.maps.Size(22, 26)
			    }
			};
		}else {
			markerOptions = {
				position: oPoint,
			    title : value.stop_name +"["+value.service_id+"]",
		        visible : true,
		        clickable : true,
				zIndex : index+1,
			    icon: {
			    	url : img,
			        scaledSize : new naver.maps.Size(22, 22)
			    }
			};
		}
		oBusStopMarker[index] = new naver.maps.Marker(markerOptions);  //마커 생성 
		oBusStopMarker[index].setMap(oMap); // 추가
		
		$(oBusStopMarker[index].eventTarget).attr("id", "img_" + value.stop_id);
		
		$(oBusStopMarker[index].eventTarget).on("click", function() {
		//var listener = naver.maps.Event.addListener(oBusStopMarker[index], 'click', function() {
			
			if(value.stop_id != undefined && value.stop_id != "" && value.stop_id != null){
				
				arriveInfoPopup = new naver.maps.InfoWindow({
				    content: CONTENT,
				    maxWidth: 400,
				    //backgroundColor: "#eee",
				    //borderColor: "#2db400",
				    //borderWidth: 5,
				    anchorSize: new naver.maps.Size(30, 30),
				    anchorSkew: true,
				    //anchorColor: "#eee",
				    pixelOffset: new naver.maps.Point(50, -20)

				});
            	
            	var form_data = {
            			busStopId: value.stop_id
                };
            	
           		arriveInfoPopup.open(oMap, oBusStopMarker[index]);
                ajaxCall("../../web/traffic/searchBusStopRoute.do", form_data, ajaxBeforeSendMapRouteInfo, ajaxSuccessMapRouteInfo);
                $('#btnclose1').click(function(){
                	arriveInfoPopup.close();

                	//키보드 초점
                	$("#" + value.stop_id).focus();
					//$("#img_" + value.stop_id).focus();
	    		});
                
                // 노선검색 지도 아이콘 - 키보드 초점
            	setTimeout(function() {
            		//$(".stationInfo_wrap").focus();
					$(".stationInfo_wrap .close-btn").focus();
            	},500);

				$(".stationInfo_wrap").removeAttr("tabindex");
                
        	}
            return false;
		});
    	
    //	oBusStopMarker[index].setZIndex(index+1);
    	mapBusStopId[index+1] = value.stop_id;
    	ALL_BUSSTOP_INFO.put(value.stop_id, oBusStopMarker[index]);
    	ALL_BUSSTOP_LIST.push(oBusStopMarker[index]);

	});
}

//경로탐색 전용 버스 정류장 멀티 마커 생성
function createBisBusStopMarkerMulti_1(list, type,img, width, height){
	
    $.each( list, function( index, value ) {
    	//oMarker[index] = new naver.maps.Marker(oIcon, { title : value.stop_name +"["+value.service_id+"]" });
    	
    	var oPoint = new naver.maps.LatLng(value.lat, value.lng); //마커포인트 
		var markerOptions = {
				position: oPoint,
			    title : value.stop_name +"["+value.service_id+"]",
		        visible : true,
		        clickable : true,
			    icon: {
			        url: img,
//			        size: new naver.maps.Size(oSize),
//			        anchor: new naver.maps.Point(width/2, height/2)
			        scaledSize : new naver.maps.Size(22, 22)
			    }
			};

		oMarker[index] = new naver.maps.Marker(markerOptions);  //마커 생성 
		oMarker[index].setMap(oMap); // 추가
		
		$(oMarker[index].eventTarget).attr("id", "img_" + value.service_id);
    			
		var listener = naver.maps.Event.addListener(oMarker[index], 'click', function() {
			//var clickPoint = oCustomEvent.coord;
			if(value.stop_id != undefined && value.stop_id != "" && value.stop_id != null){

				if(type == 1){
					arriveInfoPopup = new naver.maps.InfoWindow({
					    content: CONTENT,
					    maxWidth: 400,
					    backgroundColor: "#eee",
					    borderColor: "#2db400",
					    borderWidth: 5,
					    anchorSize: new naver.maps.Size(20, 30),
					    anchorSkew: true,
					    anchorColor: "#eee",
					    pixelOffset: new naver.maps.Point(50, -20)
	
					});
	            	
	            	var form_data = {
	            			busStopId: value.stop_id
	                };
	            	
	           		arriveInfoPopup.open(oMap, oMarker[index]);
	                ajaxCall("../../web/traffic/searchBusStopRoute.do", form_data, ajaxBeforeSendMapRouteInfo, ajaxSuccessMapRouteInfo);
	                $('#btnclose1').click(function(){
	                	arriveInfoPopup.close();
	                	
	                	if(keyObj) {
	                		$(keyObj).focus();
	                	}
		    		});
	    	        //	arriveInfoPopup.close();
	    	        
	    	        $(".stationInfo_wrap").removeAttr("tabindex");
	        	    
				}else if(type == 2){
						           		
		           	if(value.stop_id != undefined && value.stop_id != "" && value.stop_id != null){
		           		var stopNmArr = oMarker[index].getTitle().split("[");

		           		//arriveInfoPopup.setVisible(false);

		           		if($("#stSearchType").val() != null || $("#edSearchType").val() != null){
		           		//경로탐색
			           		if ($("#stSearchType").val() == "1" && $("#edSearchType").val() == "1"){
			           		//출발지/도착지 검색
			           			arriveInfoPopup = new naver.maps.InfoWindow({
			    				    content: SELECT,
			    				    maxWidth: 400,
			    				    backgroundColor: "#eee",
			    				    borderColor: "#2db400",
			    				    borderWidth: 5,
			    				    anchorSize: new naver.maps.Size(20, 30),
			    				    anchorSkew: true,
			    				    anchorColor: "#eee",
			    				    pixelOffset: new naver.maps.Point(50, -20)

			    				});
			           			
			           			arriveInfoPopup.open(oMap, oMarker[index]);
			           			//arriveInfoPopup.setContent(SELECT);
				               	//arriveInfoPopup.setPosition({right : 19, top : -55});
				               	
								$("#btn_map_st").click( function(){ 
									$("#stStopId").val(value.stop_id);
									$("#stBusStop").val(stopNmArr[0]);

									$("#startName").val( stopNmArr[0] ); 
									$("#startY").val( value.lat ); 
									$("#startX").val( value.lng ); 
									//arriveInfoPopup.setVisible(false);	
									STSEARCHFLAG = true;
				        		});
								$("#btn_map_ed").click( function(){ 
									$("#edStopId").val(value.stop_id);
									$("#edBusStop").val(stopNmArr[0]);

									$("#endName").val( stopNmArr[0] ); 
									$("#endY").val( value.lat ); 
									$("#endX").val( value.lng  ); 	
									//arriveInfoPopup.setVisible(false);	
									EDSEARCHFLAG = true;
				        		});
				               	
			           		} else if($("#stSearchType").val() == "1"){
							//출발지만 검색
			           			arriveInfoPopup = new naver.maps.InfoWindow({
			    				    content: SELECT1,
			    				    maxWidth: 400,
			    				    backgroundColor: "#eee",
			    				    borderColor: "#2db400",
			    				    borderWidth: 5,
			    				    anchorSize: new naver.maps.Size(20, 30),
			    				    anchorSkew: true,
			    				    anchorColor: "#eee",
			    				    pixelOffset: new naver.maps.Point(50, -20)

			    				});
			           			
			           			arriveInfoPopup.open(oMap, oMarker[index]);
			           			//arriveInfoPopup.setContent(SELECT1);
				               	//arriveInfoPopup.setPosition({right : 19, top : -25});
				               	
				               	$("#btn_map_st").click( function(){ 
				               		$("#stStopId").val(value.stop_id);
				               		$("#stBusStop").val(stopNmArr[0]);
				               		
									$("#startName").val( stopNmArr[0] ); 
									$("#startY").val( value.lat ); 
									$("#startX").val( value.lng ); 
				               		//arriveInfoPopup.setVisible(false);	
				               		STSEARCHFLAG = true;
				        		});
				               	
			           		} else if ($("#edSearchType").val() == "1"){
			           		//도착지만 검색
			           			arriveInfoPopup = new naver.maps.InfoWindow({
			    				    content: SELECT2,
			    				    maxWidth: 400,
			    				    backgroundColor: "#eee",
			    				    borderColor: "#2db400",
			    				    borderWidth: 5,
			    				    anchorSize: new naver.maps.Size(20, 30),
			    				    anchorSkew: true,
			    				    anchorColor: "#eee",
			    				    pixelOffset: new naver.maps.Point(50, -20)

			    				});
			           			
			           			arriveInfoPopup.open(oMap, oMarker[index]);
			           			//arriveInfoPopup.setContent(SELECT2);
				               	//arriveInfoPopup.setPosition({right : 19, top : -25});
				               	
								$("#btn_map_ed").click( function(){ 
									$("#edStopId").val(value.stop_id);
									$("#edBusStop").val(stopNmArr[0]);

									$("#endName").val( stopNmArr[0] ); 
									$("#endY").val( value.lat ); 
									$("#endX").val( value.lng  ); 	
									//arriveInfoPopup.setVisible(false);	
									EDSEARCHFLAG = true;
				        		});
				               	
			           		} 
			           		//arriveInfoPopup.setPoint(oTarget.getPoint());
			               	//arriveInfoPopup.setVisible(true);
			               	
		           		}
		           	}
		           	return false;
				}

        	}
            return false;
		});
    	//oMarker[index].setPoint(new naver.maps.LatLng(value.lat, value.lng));
    	//oMap.addOverlay(oMarker[index]); 
    	
    	oMarker[index].setZIndex(index+1);
    	mapBusStopId[index+1] = value.stop_id;
    	markerCnt ++;
	});
	
}

//버스 멀티 마커 생성
function createBisBusMarkerMulti(list, type, width, height, busType){
	
	//마커 제거
	if(oMarkerMulti != null){
		for(var i = 0; i < oMarkerMulti.length; i++){
			oMarkerMulti[i].setMap(null);
			//oMap.removeOverlay(oMarkerMulti[i]);
		}
		
		//oMarkerMulti.setMap(null);
		
		oMarkerMulti = new Array();
	}
	
	//var oSize = new naver.maps.Size(width, height);
    //var oOffset = new naver.maps.Size(width/2, height/2);
    var oIcon = null;
    
    $.each( list, function( index, value ) {
    	/*
    	if(value.turn_flag == "UP"){
    		oIcon = new naver.maps.Icon(MARKER_IMG.BUS1, oSize, oOffset);
    	} else if(value.turn_flag == "DW"){
    		oIcon = new naver.maps.Icon(MARKER_IMG.BUS2, oSize, oOffset);
    	} else {
    		oIcon = new naver.maps.Icon(MARKER_IMG.BUS1, oSize, oOffset);
    	}
    	*/
    	
    	if(value.low_flag == '1'){
    		
    		var oPoint = new naver.maps.LatLng(value.lat, value.lng); //마커포인트 
			var markerOptions = {
					position: oPoint,
				    title : value.plate_no,
				    vehId : value.veh_id,
			        visible : true,
			        clickable : true,
				    icon: {
				    	url: MARKER_IMG.BUS3,
				        //url: '../../resources/images_new/c/icon_Bus_LF.png',
//				        size: new naver.maps.Size(oSize),
//				        anchor: new naver.maps.Point(width/2, height/2)
				        scaledSize : new naver.maps.Size(25, 27)
				    }
				};

			oMarkerMulti[index] = new naver.maps.Marker(markerOptions);  //마커 생성 
			oMarkerMulti[index].setMap(oMap); // 추가
    		
    		//oIcon = new naver.maps.Icon(MARKER_IMG.BUS3, oSize, oOffset);
    	} else {
    		if(busType == 43 || busType == 50 || busType == 51 || busType == 52 || busType == 53){
    	    	//광역
    			var oPoint = new naver.maps.LatLng(value.lat, value.lng); //마커포인트 
    			var markerOptions = {
    					position: oPoint,
    				    title : value.plate_no,
    				    vehId : value.veh_id,
    			        visible : true,
    			        clickable : true,
    				    icon: {
    				    	url: MARKER_IMG.BUS2,
    				        //url: '../../resources/images_new/c/icon_Bus_red.png',
//    				        size: new naver.maps.Size(oSize),
//    				        anchor: new naver.maps.Point(width/2, height/2)
    						scaledSize : new naver.maps.Size(25, 27)
    				    }
    				};

    			oMarkerMulti[index] = new naver.maps.Marker(markerOptions);  //마커 생성 
    			oMarkerMulti[index].setMap(oMap); // 추가
    			//oIcon = new naver.maps.Icon(MARKER_IMG.BUS2, oSize, oOffset);
    	    } else {
    	    	//일반    	    	
    	    	oPoint = new naver.maps.LatLng(value.lat, value.lng); //마커포인트 
    			var markerOptions = {
    				    position: oPoint,
    				    title : value.plate_no,
    				    vehId : value.veh_id,
    			        visible : true,
    			        clickable : true,
    				    icon: {
    				    	url: MARKER_IMG.BUS1,
    				        //url: '../../resources/images_new/c/icon_Bus_blue.png',
    				        //size: new naver.maps.Size(10, 15),
    				        scaledSize : new naver.maps.Size(25, 27)
    				        //anchor: new naver.maps.Point(width/2, height/2)
    				    }
    				};

    			oMarkerMulti[index] = new naver.maps.Marker(markerOptions);  //마커 생성 
    			oMarkerMulti[index].setMap(oMap); // 추가
    	    	//oIcon = new naver.maps.Icon(MARKER_IMG.BUS1, oSize, oOffset);
    	    }	
    	}
    	
    	oMarkerMulti[index].setZIndex(999);
    	//마커 재생성
    	oMarkerMulti[index].setMap(oMap);

    	
    	//oMarkerMulti[index] = new naver.maps.Marker(oIcon, { title : value.plate_no}); 
    	//oMarkerMulti[index].setPoint(new naver.maps.LatLng(value.lat, value.lng));
    	//oMap.addOverlay(oMarkerMulti[index]); 
    	
	});
	
}

// 지도 키보드 엔터키 이벤트 감지 - 지도 유형 설정
// 지도 유형 선택 외에는 기본 클릭 이벤트 설정
function initKeyboardEvent(oMap) {
	window.addEventListener("keydown", function(e) {
	   if (e.keyCode === 13) {
		   e.preventDefault();
		   // 지도 유형
		   if ($(e.target)[0].__mapTypeId != null) {
			   var mapTypeText = e.target.text;
			   $(e.target.parentNode.parentNode).find('a').attr('title','');
			   
			   if (mapTypeText == "일반") {
				   oMap.setMapTypeId(naver.maps.MapTypeId.NORMAL);
				   e.target.setAttribute('title','선택됨');
			   } else if (mapTypeText == "위성") {
				   oMap.setMapTypeId(naver.maps.MapTypeId.SATELLITE);
				   e.target.setAttribute('title','선택됨');
			   } else {
				   console.log('MapTypeId none')
			   }
			} else {
				console.log('keydown etc');
				$(e.target)[0].click();
			}
		}
	});
}
