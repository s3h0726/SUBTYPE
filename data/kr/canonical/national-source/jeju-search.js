//document.write("<script src='/resources/layouts/web/daumMapControl.js'></script>");

//=========================================
// 초기 생성자
//=========================================
function searchControl(){
	// 다음지도 API 
	this.daumMapApi = new daumMapControl();
	
	// 지도 Maker Icon
	this.icon = new Object();
	
	// 정류소 정보 저장 
	this.stationListByBounds = new ArrayList();
	
	// 노선ID 저장
	this.routeId = null;
	
	// 노선검색 정보 저장
	this.searchResultInfo = new ArrayList();

	// 노선에 대한 경유 정류소 리스트
	this.stationInfoList = new ArrayList();
	
	// 노선에 대한 버스종류
	this.busType;
	
	
	// 경유노선 정류소 list
	this.routeStationList = new ArrayList();
	
	// 경유노선 링크 리스트 (key-value)
	this.linkList;
	
	// 정류소 검색 리스트 
	this.stationSearchList = new ArrayList();
	
	// 정류소 검색 시 경유노선 리스트 
	this.routInfoList = new ArrayList();
	
	// 유사노선 리스트 
	this.similarLineList = new ArrayList();
		
	// 유사노선 경유 정류장 리스트 
	this.similarLineStationList = new ArrayList();
	
	// 길찾기 데이터 리스트  
	this.roadSearchList = new ArrayList();
}

//=========================================
// 초기 호출 시 초기화 함수
//=========================================
searchControl.prototype.init = function() {
	
	// 마커에 쓰이는 아이콘 세팅
	this.setMarkerIcon();
	
	// 다음맵 생성 및 화면 띄우기 
//	this.daumMapApi.createMap("layout_map");
	this.daumMapApi.createMap("map");
	
	// 현재 마커 가져옴.
	this.setStationMaker();
	
	// 지도 레벨에 따른 버스정류소 마커 생성 이벤트 등록 : view의 mapIdleEvent와 연계  
	this.daumMapApi.regMapEvent(this.daumMapApi.map,"idle", mapIdleEvent);

}

//=========================================
// 사이즈 조정
//=========================================
searchControl.prototype.displaySizeInit = function() {
	var screen_width = $(window).width(); 
	
	if(screen_width >= 1920){
		$(".layout_realtime .first_wrapper").css("width", "1200px");
		$(".layout_realtime .first_wrapper .line_scroll_wrap").css("width", "1250px");
		$(".layout_realtime .outer .first_wrapper .line_scroll_wrap .line_wrap").css("width", "1200px");
	}else if(screen_width > 1920 || screen_width >= 1680 ){
		$(".layout_realtime .first_wrapper").css("width", "1000px");
		$(".layout_realtime .first_wrapper .line_scroll_wrap").css("width", "1050px");
		$(".layout_realtime .outer .first_wrapper .line_scroll_wrap .line_wrap").css("width", "1000px");
	}else{
		$(".layout_realtime .first_wrapper").css("width", "600px");
		$(".layout_realtime .first_wrapper .line_scroll_wrap").css("width", "650px");
		$(".layout_realtime .outer .first_wrapper .line_scroll_wrap .line_wrap").css("width", "600px");
	}
	
}

//=========================================
//데이터 로딩 관련 함수 
//=========================================
searchControl.prototype.pageLoding =function(selector, status) {
	
	status = status ? status : "show"
	
	if(status == "show"){

		var opts = {
				  lines: 14, // The number of lines to draw
				  length: 10, // The length of each line
				  width: 6, // The line thickness
				  radius: 20, // The radius of the inner circle
				  color: '#000', // #rgb or #rrggbb
				  speed: 1, // Rounds per second
				  trail: 56, // Afterglow percentage
				  shadow: true // Whether to render a shadow
				};
		
		
		var sb = new StringBuilder();
		sb.Append("<div id=\"spinSpace\" style =\"position:absolute; z-index:100; width:100%; height:100%; background-color:#FFF; opacity:0.5; filter:alpha(opacity=50);\"></div>");
		
		selector.prepend(sb.ToString());
		
		var target = document.getElementById('spinSpace');
		var spinner = new Spinner(opts).spin(target);
		
	}else{
		
		$("#spinSpace").remove();
			
	}
}

//=========================================
//맵 마커 아이콘생성
//=========================================
searchControl.prototype.setMarkerIcon = function() {
	
	// 정류소 아이콘 이미지 생성 
	var inactiveStationParm = this.markerParameter(contextPath + "/resources/images/icon/stationIcon.png", "정류소");
	this.icon.inactiveStation = this.daumMapApi.createMarkerImage(inactiveStationParm, 26, 32);
	
	// 노선 정류소 아이콘 이미지 생성 
	var activeStationParm = this.markerParameter(contextPath + "/resources/images/icon/routStationIcon.png", "노선정류소");
	this.icon.activeStation = this.daumMapApi.createMarkerImage(activeStationParm, 26, 32);
	
	// 지선버스 아이콘 이미지 생성
	var localBusParm = this.markerParameter(contextPath + "/resources/images/img_bus_ico_local.png", "지선버스");
	this.icon.localBus = this.daumMapApi.createMarkerImage(localBusParm, 32, 32);
	
	// 간선버스 아이콘 이미지 생성
	var localBusParm = this.markerParameter(contextPath + "/resources/images/img_bus_ico_global.png", "간선버스");
	this.icon.globalBus = this.daumMapApi.createMarkerImage(localBusParm, 32, 32);
		
	// 급행버스 아이콘 이미지 생성
	var localBusParm = this.markerParameter(contextPath + "/resources/images/img_bus_ico_fast.png", "급행버스");
	this.icon.fastBus = this.daumMapApi.createMarkerImage(localBusParm, 32, 32);
	
	// 급행버스 아이콘 이미지 생성
	var localBusParm = this.markerParameter(contextPath + "/resources/images/img_bus_ico_tour.png", "기타버스");
	this.icon.tourBus = this.daumMapApi.createMarkerImage(localBusParm, 32, 32);
	
	// 출발 아이콘 이미지 생성
	var startParm = this.markerParameter(contextPath + "/resources/images/departure_icon.png", "기타버스");
	this.icon.startStation = this.daumMapApi.createMarkerImage(startParm, 32, 32);
		
	// 도착 아이콘 이미지 생성
	var endParm = this.markerParameter(contextPath + "/resources/images/arrival_icon.png", "기타버스");
	this.icon.endStation = this.daumMapApi.createMarkerImage(endParm, 32, 32);
	
	// 리무진버스 아이콘 이미지 생성
	var localBusParm = this.markerParameter(contextPath + "/resources/images/img_bus_ico_fast.png", "리무진");
	this.icon.fastBus = this.daumMapApi.createMarkerImage(localBusParm, 32, 32);
	
	// 2017.09.26 저상버스 추가
	// 저상버스 아이콘 이미지 생성
	var lowBusParm = this.markerParameter(contextPath + "/resources/images/img_bus_ico_low.png", "저상버스");
	this.icon.lowBus = this.daumMapApi.createMarkerImage(lowBusParm, 32, 32);
	//
	
}

searchControl.prototype.markerParameter = function(iconSrc, iconArt){
	
	var parameter = new Object();
	parameter.src = iconSrc;
	parameter.offset = "";
	parameter.shape = "poly";
	parameter.alt = iconArt;
	parameter.coords = "1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33";
	
	return parameter;
}


//=========================================
// 현재위치와 지도 zoom Level에 따른 정류장 마커 생성
//=========================================
searchControl.prototype.setStationMaker = function() {
	var _searchControl = this;
	var _daumMap = this.daumMapApi.map;
	
	// 지도레벨이 4 미만으로 축소 될 경우
	if (_daumMap.getLevel() < 4) {
		// API : 위도, 경도에 따른 정류소 리스트 가져오기(지도Bounds 안에 존재하는 정류장) 
		$.post(contextPath + "/data/search/stationListByBounds", {
			"southWestLat" : _daumMap.getBounds().getSouthWest().getLat(),
			"southWestLng" : _daumMap.getBounds().getSouthWest().getLng(),
			"northEastLat" : _daumMap.getBounds().getNorthEast().getLat(),
			"northEastLng" : _daumMap.getBounds().getNorthEast().getLng()
		}, function( result ) {
			if ( result ) {
				var stationList = new ArrayList();
				result = new ArrayList(result);
				
				// 기존 생성된 마커는 삭제한다.
				_searchControl.daumMapApi.hiddenMarker("station");
				
				for ( var i = 0; i < result.size(); ++i ) {
					var stationInfo = new Object();
					
					// 정류장 ID 삽입
					stationInfo.stationId = result.get(i).stationId;
					
					// 정류장 이름 삽입 
					if ( locale == 'en' ) {
						stationInfo.stationNm = result.get(i).stationEngNm;
					} else if ( locale == 'jp' ) {
						stationInfo.stationNm = result.get(i).stationJpnNm;
					} else if ( locale == 'ch' ) {
						stationInfo.stationNm = result.get(i).stationChnNm;
					} else {
						stationInfo.stationNm = result.get(i).stationNm;
					}

					// 정류장 좌표 삽입
					stationInfo.latlng = new daum.maps.LatLng(result.get(i).localY, result.get(i).localX);
					
					// 정류장 마커생성 후 삽입 
					var MarkerTitle = stationInfo.stationId+","+stationInfo.stationNm;
					stationInfo.marker = _searchControl.insertStationMaker(MarkerTitle, stationInfo.latlng);
					
					stationList.add(stationInfo);
				}
				
				// Station 정보세팅
				_searchControl.stationListByBounds = stationList;
			}
		});
	} else {  // 지도레벨 4 이상이면, 정류장 마커를 삭제한다.
		_searchControl.daumMapApi.hiddenMarker("station");
		_searchControl.daumMapApi.deleteInfoWindow();
	}
}

//=========================================
//정류장 마커 생성
//=========================================
searchControl.prototype.insertStationMaker = function(markerTitle, position,type) {
	type = type ? type : "station";
	var iconImg = null;

	if(type == "station"){
		var titleArray = markerTitle.split(",");
		var stationId = titleArray[0];
		
		iconImg = this.icon.inactiveStation;
		
		// 노선정류장일 경우 아이콘을 변경한다. 
		for (var i = 0; i < this.routeStationList.size(); ++i) {
			if(this.routeStationList.get(i).stationId == stationId){
				iconImg = this.icon.activeStation;
			}
		}
	}else if(type == "start"){
		iconImg = this.icon.startStation;
	}else if(type == "end"){
		iconImg = this.icon.endStation;
	}else{
		var bus = this.busType ? this.busType : "지선";
		// 2017.09.26 저상버스 추가
		if(bus.match("저상")){
			iconImg = this.icon.lowBus;
		}
		//
		else if(bus.match("지선")){
			iconImg = this.icon.localBus;
		}else if(bus.match("간선")){
			iconImg = this.icon.globalBus;
		}else if(bus.match("급행")){
			iconImg = this.icon.fastBus;
		}else if(bus.match("관광")){
			iconImg = this.icon.tourBus;
		}else if(bus.match("심야")){
			iconImg = this.icon.tourBus;
		}
		else if(bus.match("리무진")){
			iconImg = this.icon.fastBus;
		}
	}
	
	var marker = this.daumMapApi.showMarker(markerTitle, position, iconImg);
	
	// 버스정류소 마커 생성 이벤트 등록 : view의 mapIdleEvent와 연계  
	this.daumMapApi.regMapEvent(marker,"click", markerClickEvent);
	
	return marker;
}

//=========================================
//정류장 마커 클릭 시 InfoWindow 생성 
//=========================================
searchControl.prototype.clickStationMaker = function(marker) {
	
	this.daumMapApi.deleteInfoWindow();
	
	if(this.daumMapApi.map.getLevel() > 3){
		this.daumMapApi.map.setLevel(3);
	}
	
	
	var _searchControl = this;
	var stationId;
	
	var sb = new StringBuilder();
	
	var markerTitle = (marker.getTitle()).split(",");
	
	
	if(markerTitle[0].indexOf("제주") == -1){
		
		
		//마커가 출발 표시일때 
		if(markerTitle[0] == "start"){
			
			sb.Append("<div class=\"layout_marker_start\" style=\"top:100px;\">");
			sb.Append("<a href=\"#\" class=\"head_text color_text_start\">출발</a>");
			sb.Append("<p class=\"desc_text\">"+markerTitle[1]+"</p>");
			sb.Append("</div>");
        
            _searchControl.daumMapApi.createInfoWindow(sb.ToString(),marker);
            
		//마커가 도착 표시일때 
		}else if(markerTitle[0] == "end"){
			
			sb.Append("<div class=\"layout_marker_start\" style=\"top:100px;\">");
			sb.Append("<a href=\"#\" class=\"head_text color_text_start\">도착</a>");
			sb.Append("<p class=\"desc_text\">"+markerTitle[1]+"</p>");
			sb.Append("</div>");
        
            _searchControl.daumMapApi.createInfoWindow(sb.ToString(),marker);
			
		//마커가 정류장일때	
		}else{
			stationId = markerTitle[0];
			
			// API : 정류장에 대한 경유 노선 가져옴.
			$.post(contextPath + "/data/search/arriveScheduleAndTransitLineByStationId", {
				"stationId" : stationId,
				"type" : searchType
			}, function(result){
				
				var title = markerTitle[1];
				var stationNum = markerTitle[0];
				var routeInfoList = new ArrayList(result.routeInfoList);

				// infowindow의 타이틀 및 정류장번호 세팅
				sb.Append("<div class=\"layout_infowindow\">");
				sb.Append("		<a class=\"close_wrap\" href=\"#\" onclick=\"searchControl.daumMapApi.deleteInfoWindow();\"><img class=\"close_image\" src=\""+ contextPath + "/resources/images/close_icon.png\" /></a>");
				sb.Append("		<p class=\"title\"><span class=\"first\">"+title+"</span><span class=\"second\">["+stationNum+"]</span></p>");
				sb.Append("		<div class=\"wrap\">");
				sb.Append("			<ul class=\"position_list scrollbar-outer\">");
				
					if ( routeInfoList.size()>0 ) {
						// infowindow의 경유정류장 목록 생성(실시간 도착정보 포함)
						for (var i = 0; i < routeInfoList.size(); ++i) {
							var routeNm = routeInfoList.get(i).routeNum;
							var routeSubNm = " ("+routeInfoList.get(i).routeSubNm+")";
							var startPoint = routeInfoList.get(i).orgtNm;
							var endPoint = routeInfoList.get(i).dstNm;
							var routeId = routeInfoList.get(i).routeId;

							/* 2019버스정보시스템 고도화 :: 외국어기능 추가[시작] */
							if(locale == 'en'){
								startPoint = routeInfoList.get(i).orgtsEngNm;
								endPoint = routeInfoList.get(i).dstsEngNm;
							}
							else if(locale == 'ch'){
								startPoint = routeInfoList.get(i).orgtsChnNm;
								endPoint = routeInfoList.get(i).dstsChnNm;
							}
							else if (locale == 'jp'){
								startPoint = routeInfoList.get(i).orgtsJpnNm;
								endPoint = routeInfoList.get(i).dstsJpnNm;
							}
							
							/* 2019버스정보시스템 고도화 :: 외국어기능 추가[끝] */
							var busType = routeInfoList.get(i).busTypeStr ? routeInfoList.get(i).busTypeStr : "";
							var typeColor;
							
							// 2017.09.26 저상버스 추가
							var lowBusFlag = "";
							if (routeInfoList.get(i).lowPlateTp == "Y") {
								lowBusFlag = "저상버스";
								if ( locale == 'en' ) {
									lowBusFlag = "Low-floor";
								} else if ( locale == 'ch' ) {
									lowBusFlag = "低底盘公交";
								} else if ( locale == 'jp' ) {
									lowBusFlag = "低床バス";
								}
							}
							sb.Append("<li class=\"cell\">");
							
							if ( busType.match("지선") ) {
								typeColor = "color_local";
							} else if ( busType.match("간선") ) {
								typeColor = "color_global";
							} else if ( busType.match("급행") ) {
								typeColor = "color_fast";
							} else if ( busType.match("심야") ) {
								typeColor = "color_tour";
							} else if ( busType.match("관광지") ) {
								typeColor = "color_tour";
							} else if ( busType.match("리무진") ) {
								typeColor = "color_fast";
							} else {
								typeColor = "color_line";
							}
							

							sb.Append("<p class=\"name\"><span class=\"first "+typeColor+"\">"+routeNm+"</span>&nbsp;<span class=\"second\">"+routeSubNm+" <span class=\"first "+typeColor+"\">"+lowBusFlag+"</span></p>");
							sb.Append("<p class=\"course\">"+startPoint+" -&gt; "+endPoint+"</p>");

							var predictTravTm = routeInfoList.get(i).predictTravTm;
							var remainStation = routeInfoList.get(i).remainStation;
							var rmark = routeInfoList.get(i).rmark;
							var arriveInfo;
							var accident = routeInfoList.get(i).allocFaultType;
							if(accident != null && accident != "0"){
								if (accident == "1") {
									arriveInfo = "[ 결행 ]";
								} else if(accident == "2") {
									arriveInfo = "[ 고장 ]";
								} else {
									arriveInfo = "[ 만차 ]";
								}
								sb.Append("<span class=\"location text_arrive\">"+arriveInfo+"</span>");
							}else if(predictTravTm == "0" && remainStation == "0"){
								if(rmark == null || rmark == "") {
									arriveInfo = "도착정보 없음";
									if ( locale == 'en' ) {
										arriveInfo = "No arrival<br/>infomaion";
									} else if ( locale == 'ch' ) {
										arriveInfo = "无到站信息";
									} else if ( locale == 'jp' ) {
										arriveInfo = "到着情報なし";
									}
								}else {
									arriveInfo = rmark;
								}
								sb.Append("<span class=\"location text_none\">"+arriveInfo+"</span>");
							} else{
								arriveInfo = predictTravTm+"분 후("+remainStation+" 전)";
								if ( locale == 'en' ) {
									arriveInfo = "After "+predictTravTm+" min.<br/>(Before " +remainStation+")";
								} else if ( locale == 'ch' ) {
									arriveInfo = predictTravTm+"分钟后<br/>(前 " +remainStation+"个站点)";
								} else if ( locale == 'jp' ) {
									arriveInfo = predictTravTm+"分後<br/>("+remainStation+"停留所前 )";
								}
								
								sb.Append("<span class=\"location text_arrive\">"+arriveInfo+"</span>");
							}

							sb.Append("<button class='reserveBtn'>승차<br>예약</button>" +
								" <input type='hidden' class='route-id' value='"+routeId+"' />");
							sb.Append("<div class=\"divider\"></div>");
						}

				}else{
					sb.Append("<li class=\"cell\">");
					var viaInfo = "경유 노선정보가 없습니다.";
					if(locale == 'en'){
						viaInfo = "There is no via route information.";
					}
					else if(locale == 'ch'){
						viaInfo = "无经过线路信息。";
					}
					else if (locale == 'jp'){
						viaInfo = "経由路線情報がありません。";
					}

					sb.Append("<p class=\"name\"><span class=\"first color_local\">"+viaInfo+"</span>&nbsp;<span class=\"second\"></span></p>");
				}
					
							sb.Append("</li>");
						sb.Append("</ul>");
					sb.Append("</div>");
				sb.Append("</div>");
				
				
				_searchControl.daumMapApi.createStationInfoWindow(sb.ToString(),marker);
				
				$('.scrollbar-outer').scrollbar();
				
				/* 2019 버스정보시스템 고도화 :: 외국어 기능 추가 [시작]*/
				//언어가 외국어인 경우 cell 높이와 노선 번호 위치 변경
				if ( locale.indexOf('ko') <= -1 && routeInfoList.size() > 0 ) {
					$('li.cell').css('height', '80px');
					$('li.cell').find('.name').css('bottom', '40px');
					
					//영어인 경우는 2줄 표시되기 때문에 일어,중국어만 도착정보없음 위치 조정
					if ( locale != 'en' )
						$('li.cell').find('span.location.text_none').css('bottom', '40px');
				}
				/* 2019 버스정보시스템 고도화 :: 외국어 기능 추가 [끝]*/

				$(".reserveBtn").on("click", function () {
					// 팝업 요소가 이미 존재하면 열고, 없다면 새로 추가
					if ($(".infopopwrap").length === 0) {
						const popupHtml = `
							<div class="infopopwrap">
								<div class="infopopbox">
									<div class="modal-header">
										<img src="` + contextPath + `/resources/images/mobile/2019new/pop/text_head.png">
										<button type="button" class="close" data-dismiss="modal">×</button>
									</div>
									<div class="modal-body text-center" style="font-size: 15px;">
										<div style="width: 110px; margin: 0 auto 6px;">
											<button type="button" class="btn select-btn on" impairedtp="1">장애인</button>
											<button type="button" class="btn select-btn" impairedtp="2">노약자</button>
											<button type="button" class="btn select-btn" impairedtp="3">임산부</button>
											<button type="button" class="btn select-btn" impairedtp="4">영유아동반</button>
											<button type="button" class="btn select-btn" impairedtp="5">어린이</button>
											<button type="button" class="btn select-btn" impairedtp="6">일반</button>
										</div>
										<ul class="btn_area">
											<li>
												<span class="btn_reger">예약</span>
												<span class="btn_cancel" data-dismiss="modal">취소</span>
											</li>
										</ul>
									</div>
								</div>
							</div>`;
						$("body").append(popupHtml);
					}

					searchId = $(this).parent().find(".route-id").val();

					// 팝업 열기
					$(".infopopwrap").fadeIn();

					// 팝업 닫기
					$(".close, .btn_cancel").off().on("click", function () {
						$(".infopopwrap").fadeOut();
					});

					// 버튼 활성화 상태 변경
					$(".select-btn").off().on("click", function () {
						$(".select-btn").removeClass("on");
						$(this).addClass("on");
					});
					// http://localhost:8080/web/station/reservationTrafficWeak
					// const windowOrigin = window.location.origin;
					// const pagePath = window.location.pathname.split('/').filter(Boolean);
					// console.log(window.location, 'window.location');
					// console.log(windowOrigin + 'windowOrigin');
					// console.log(pagePath + 'pagePath');
					const pageContextPath = pagePath.length > 0 ? windowOrigin + '/' + pagePath[0] : windowOrigin;
					console.log(pageContextPath, 'pageContextPath');
					$(".btn_reger").off().on("click", function () {
						var impairedTp = $('.btn.select-btn.on').attr('impairedTp');
						$.ajax({
							type: "POST",
							cache: false,
							dataType: "json",
							data: {'stationId': stationNum, 'routeId': searchId, 'impairedTp': impairedTp},
							async: false,
							url: pageContextPath + "/web/station/reservationTrafficWeak",
							success: function (data) {
								if (data) {
									alert("승차예약이 완료되었습니다.");
									$(".infopopwrap").fadeOut();
									searchControl.daumMapApi.deleteInfoWindow();
								} else
									alert("승차예약 실패하였습니다.\n잠시후 다시 시도해주세요.");
							}, error: function (data) {
							}
						});
					});
				});

				// 경유 노선 클릭 시 검색페이지 이동
				$(".position_list li p").off().click(function(){
					var $li = $(this).closest("li");
					var selectIndex = $li.index();
					var selectRouteId = $li.find(".name").children().eq(0).text();

					if($(this).find(".second").text()){
						var selectRouteNum = routeInfoList.get(selectIndex).routeId;
						window.open(contextPath + "/search/line?searchText="+selectRouteId+"&lineId="+selectRouteNum,"_self");
					}

				});
				
				// 출발지, 도착지지정 버튼 클릭시 
				$(".set_start, .set_end").off().click(function() {
					var currentSrc = $(location).attr("pathname");
					var searchTitle;
					
					if ( title.indexOf('[') > 0 ) {
						var endIdx = title.indexOf('[');
						searchTitle = title.substring(0,endIdx);
					} else {
						searchTitle = title;
					}
					
					if($(this).hasClass(contextPath + "set_start")){
						
						//현재 페이지가 출도착 검색 페이지면 화면이동 없이 바로 출도착 지정  
						if(currentSrc.indexOf(contextPath + "/search/route") != -1 ){
							
							$("#start").find(".btn_time").val(stationNum);
							pointType = "start";
							searchControl.startEndStationSearch(stationNum, pointType, "click");
							
						}						
					}else{
						
						if(currentSrc.indexOf(contextPath + "/search/route") != -1 ){
							$("#end").find(".btn_time").val(stationNum);
							pointType = "end";
							searchControl.startEndStationSearch(stationNum, pointType, "click");
						}else{
//							window.open(contextPath + "/search/route?endRouteText="+stationNum,'_self');
							//window.open("/search/route?endRouteText="+encodeURI(encodeURIComponent(searchTitle)),'_self');
						}
						
					}
					
				});
			});
		}
	//마커가 버스일때
	} else {
		
		sb.Append("<div class='station_info_window' style='width: 150px; height: 82px;'>");
		
		if ( locale == 'en' ) {
			sb.Append("<div style='width: 150px; height: 15px; padding-top: 5px; font-size: 12px; font-family: 돋음; font-weight: bold; color: #000000; text-align: center; '>[bus vehicle number]</div>");
			sb.Append("<div style='width: 140px; height: 15px; padding-left:5px; padding-right:5px; padding-top: 10px; font-size: 12px; font-family: 돋음; font-weight: bold; color: #000000; text-align: center; white-space:nowrap;	overflow:hidden; text-overflow:ellipsis;'>" + marker.getTitle() + "</div>");
		} else if ( locale == 'ch' ) {
			sb.Append("<div style='width: 150px; height: 15px; padding-top: 5px; font-size: 12px; font-family: 돋음; font-weight: bold; color: #000000; text-align: center; '>[运行公交车牌号码]</div>");
			sb.Append("<div style='width: 140px; height: 15px; padding-left:5px; padding-right:5px; padding-top: 10px; font-size: 12px; font-family: 돋음; font-weight: bold; color: #000000; text-align: center; white-space:nowrap;	overflow:hidden; text-overflow:ellipsis;'>" + marker.getTitle() + "</div>");
		} else if ( locale == 'jp' ) {
			sb.Append("<div style='width: 150px; height: 15px; padding-top: 5px; font-size: 12px; font-family: 돋음; font-weight: bold; color: #000000; text-align: center; '>[運行バス車両番号]</div>");
			sb.Append("<div style='width: 140px; height: 15px; padding-left:5px; padding-right:5px; padding-top: 10px; font-size: 12px; font-family: 돋음; font-weight: bold; color: #000000; text-align: center; white-space:nowrap;	overflow:hidden; text-overflow:ellipsis;'>" + marker.getTitle() + "</div>");
		} else {
			sb.Append("<div style='width: 150px; height: 15px; padding-top: 5px; font-size: 12px; font-family: 돋음; font-weight: bold; color: #000000; text-align: center; '>[운행버스 차량번호]</div>");
			sb.Append("<div style='width: 140px; height: 15px; padding-left:5px; padding-right:5px; padding-top: 10px; font-size: 12px; font-family: 돋음; font-weight: bold; color: #000000; text-align: center; white-space:nowrap;	overflow:hidden; text-overflow:ellipsis;'>" + marker.getTitle() + "</div>");
		}
		
		sb.Append("</div>");
		/* 2019 버스정보시스템 고도화 :: 외국어 기능 추가  [끝]*/
		_searchControl.daumMapApi.createInfoWindow(sb.ToString(),marker);
	}
}

/**
 * 노선번호(텍스트) 검색
 * 2019 버스정보시스템고도화 :: 신규소스 추가
 * 추가내용 : 데이터 조회 시 언어 변경상태에 따른 정류장명 표현되도록 수정
 * 		  인포윈도우 클릭 시 노선 기본정보 뿌려주도록 기능 추가
 * 		  오류메시지 출력시 언어 변경상태에 따라 출력되도록 기능 추가
 * */
 /* 2019 버스정보시스템고도화 :: 노선번호(텍스트) 검색[시작] */
searchControl.prototype.lineSearchKeyword = function(lineKeyword, lineType) {
	var _searchControl = this;
	var apiUrl;
	var apiParameter;
	if(lineKeyword){
		
		_searchControl.pageLoding($(".layout_right"));
		
		if(lineType == "1"){
			apiUrl = contextPath+ "/data/search/searchSimpleLineListByLineNum";
			apiParameter = {
					"keyword" : lineKeyword	
			};
		}else if(lineType == "2"){
			apiUrl = contextPath + "/data/search/searchSimpleLineListByLineNumAndType";
			apiParameter = {
					"keyword" : lineKeyword,
					"type" : lineType
			};
		}
		
		//API : 노선번호(텍스트)로 노선 검색하기 		
		$.post(apiUrl, apiParameter, function(result){
		
			_searchControl.pageLoding($(".layout_right"),"hide");
			 
			if(result.length > 0){
				
				result = new ArrayList(result);
				
				_searchControl.searchResultInfo = result;
				
				
				// 대표번호에 대한 TiTle 표시 : 대표번호정보는 전부 들어가 있으므로 그냥 0번째 데이터 가져옴.
				var routeNum = $(".btn_time").val();
				var govTypeStr;
				var busType;
				
				if(lineType == 1){
					
					govTypeStr = "구노선";
					busType = "";
				}else{
					
					govTypeStr = result.get(0).govTypeStr;
					busType = result.get(0).busTypeStr;
				}
				
				//버스 타입 및 노선번호 출력
				_searchControl.lineSearchResultTitle(routeNum,govTypeStr, busType);
				
				
				// 셀렉트박스에 데이터를 뿌려줌.
				_searchControl.lineSearchResultInfo(result);
				
				
				// 인포윈도우 클릭, 라인아이디 넘어왔을 시
				if(searchId){
					for (var i = 0; i < result.size(); ++i) {
						
						var lineInfo = result.get(i);
						var routeId = lineInfo.routeId;

						if(routeId == searchId){
							
							var selectElement = $(".line_list li").eq(i+1);
							
							// 검색결과 클릭 상태 세팅
							var title = selectElement.find("p").eq(0).text();
							var path = selectElement.find("p").eq(1).text();
							
							_searchControl.lineSearchLineSelected(title, path);
							/* 2019 버스정보고도화 :: 버스 기본정보 표출 추가 [시작] */
							//노선 기본정보 뿌려줌 :: 2019.11.28 담당자 요청으로 주석처리
							//_searchControl.lineSearchBasicInfo(i);
							/* 2019 버스정보고도화 :: 버스 기본정보 표출 추가 [끝] */
							// 경유정류소 뿌려줌
							_searchControl.lineSearchResultStationList(i);
							
							// 경유노선 그리기
							_searchControl.setlineLink(searchId);
							
							
							// 10초마다 한번씩 실시간 버스위치 갱신 
							busUpdateTimer = setInterval(function() {
								var busType = lineInfo.busTypeStr;
								_searchControl.realTimeBusInfo(searchId, busType);
							},30000);
							
						}
					}
				}
				
				
				
			}else{
				_searchControl.pageLoding($(".layout_right"),"hide");

				var sb = new StringBuilder();
				
				//언어별 메시지 출력 수정
				if ( locale == 'en' ) {
					sb.Append("<p class=\"station_search_desc_result\">There is no search result for '"+lineKeyword+"'</p>");
				} else if ( locale == 'jp' ) {
					sb.Append("<p class=\"station_search_desc_result\">'"+lineKeyword+"'に関する検索結果がありません。</p>");
				} else if ( locale == 'ch' ) {
					sb.Append("<p class=\"station_search_desc_result\">没有关于'"+lineKeyword+"'的搜索结果。</p>");
				} else {
					sb.Append("<p class=\"station_search_desc_result\">'"+lineKeyword+"'에 대한 검색결과가 없습니다.</p>");
				}
				
				$(".time_table").html(sb.ToString());
				
				//최초 가려져있던거 보여줌
				$(".time_table").css('visibility', 'visible');
				
				// 뿌리기전 기존 li Elemet 삭제 
				$(".line_list li").remove();
				$(".station_list").children().remove();
				
				//검색 결과가 없을 경우 기본정보 그리드 숨김 처리
				$(".realtime_info").children().remove();
			}
			
		});
		
	}else{
		//jsp 페이지에서 리턴 되도록 처리
		_searchControl.pageLoding($(".layout_right"),"hide");
		alert("[노선검색] 검색어를 입력하세요!");
	}
}
/* 2019 버스정보시스템고도화 :: 노선번호(텍스트) 검색 [끝] */

//=========================================
//검색어에 대한 정류장 검색 
//=========================================
searchControl.prototype.stationSearchKeyword = function(stationKeyword) {
	
	var _searchControl = this;
	
	if(stationKeyword){
		
		_searchControl.pageLoding($(".layout_right"));
		
		//API : 정류소명(텍스트)으로 정류소 검색하기 
		$.post(contextPath + "/data/search/searchStationByKeyword", {
			"keyword" : stationKeyword
		}, function(result){
			if(result.length > 0){
				result = new ArrayList(result);
				_searchControl.stationSearchList = result;
				
				// 정류소 검색 Titile 설정
				_searchControl.stationSearchResultTitle(stationKeyword);
				
				// 정류소 검색 결과값 뿌려줌
				_searchControl.stationSearchResultInfo(result);
				
				
				_searchControl.pageLoding($(".layout_right"),"hide");
				
			}else{
				_searchControl.pageLoding($(".layout_right"),"hide");
				//alert("[정류소검색] "+stationKeyword+" 에 대한 검색결과가 없습니다.");
				
				var sb = new StringBuilder();

				if(locale == 'en'){
					sb.Append("<p class=\"station_search_desc_result\">There is no search result for '"+stationKeyword+"'</p>");
				}
				else if(locale == 'ch'){
					sb.Append("<p class=\"station_search_desc_result\">没有关于'"+stationKeyword+"'的搜索结果。</p>");
				}
				else if (locale == 'jp'){
					sb.Append("<p class=\"station_search_desc_result\">'"+stationKeyword+"'に関する検索結果がありません。</p>");
				}
				else{
					sb.Append("<p class=\"station_search_desc_result\">'"+stationKeyword+"'에 대한 검색결과가 없습니다.</p>");
				}
				
				/* 2019 버스정보시스템 고도화  :: 외국어 조회 기능 추가  [끝]*/
				
				$(".layout_result").html(sb.ToString());
				
				//최초 가려져있던거 보여줌
				$(".layout_result").css('visibility', 'visible');
				// search_list 하위요소들 삭제
				$(".search_list").children().remove();
			}
			
		});
		
	}else{
		_searchControl.pageLoding($(".layout_right"),"hide");
		alert("[정류소검색] 검색어를 입력하세요!");
	}
}

//=========================================
// 노선검색 후 Title 설정
//=========================================
searchControl.prototype.lineSearchResultTitle = function(routeNum,govTypeStr,busType) {
	$(".time_table").children().remove();
	
	var sb = new StringBuilder();
	
	routeNum = routeNum ? routeNum : "999";
	
	var routeTextArry = routeNum.split('-');
	var title = routeTextArry[0];
	
	var busType = busType ? busType : "";
	
	var typeColor = typeColor ? typeColor : "color_local";
	var imgSrc = imgSrc ? imgSrc : "/resources/images/img_bus_top_line.png";
	
	/* 2019 버스정보시스템고도화 :: */
	if(locale.indexOf('ko')> -1){
		if(busType.match("지선")){
			typeColor = "color_local";
			imgSrc = contextPath + "/resources/images/img_bus_top_local.png";
			if(busType == "읍면지선"){
				govTypeStr = "읍면";
				busType = "지선";	
			}
		}else if(busType.match("간선")){
			typeColor = "color_global";
			imgSrc = contextPath + "/resources/images/img_bus_top_global.png";
			if(busType == "일반간선"){
				govTypeStr = "일반";
				busType = "간선";	
			}
		}else if(busType.match("급행")){
			typeColor = "color_fast";
			imgSrc = contextPath + "/resources/images/img_bus_top_fast.png";
			govTypeStr = "급행";
			busType = "버스";
		}else if(busType.match("심야")){
			typeColor = "color_tour";
			imgSrc = contextPath + "/resources/images/img_bus_top_tour.png";
		}else if(busType.match("관광지")){
			typeColor = "color_tour";
			imgSrc = contextPath + "/resources/images/img_bus_top_tour.png";
			govTypeStr = "관광지";
			busType = "순환";
		}else if(busType.match("리무진")){
				typeColor = "color_fast";
				imgSrc = contextPath + "/resources/images/img_bus_top_fast.png";
				govTypeStr = "리무진";
				busType = "버스";
		}
		else if(busType.match("마을")){
			typeColor = "color_local";
			imgSrc = contextPath + "/resources/images/img_bus_top_local.png";
			govTypeStr = "마을";
			busType = "버스";
		}
		else{
			typeColor = "color_line";
			govTypeStr = "";
			busType = "";
		}
	}
	else if(locale == 'en' ){
		//영어인 경우 다른 이미지 적용 
		if(busType.match("지선")){
			typeColor = "color_local";
			imgSrc = contextPath + "/resources/images/2019new/img_bus_top_local.png";
			if(busType == "읍면지선"){
				govTypeStr = "Eup/myeon";
			}
			busType = "branch route";	
		}else if(busType.match("간선")){
			typeColor = "color_global";
			imgSrc = contextPath + "/resources/images/2019new/img_bus_top_global.png";
			if(busType == "일반간선"){
				govTypeStr = "General";
			}
			busType = "main route";	
		}else if(busType.match("급행")){
			typeColor = "color_fast";
			imgSrc = contextPath + "/resources/images/2019new/img_bus_top_fast.png";
			govTypeStr = "Express";
			busType = "bus";
		}else if(busType.match("심야")){
			typeColor = "color_tour";
			imgSrc = contextPath + "/resources/images/2019new/img_bus_top_tour.png";
			busType="Late Night";
		}else if(busType.match("관광지")){
			typeColor = "color_tour";
			imgSrc = contextPath + "/resources/images/2019new/img_bus_top_tour.png";
			govTypeStr = "Tourist<br/>attraction";
			busType = "circulation ";
		}else if(busType.match("리무진")){
				typeColor = "color_fast";
				imgSrc = contextPath + "/resources/images/2019new/img_bus_top_fast.png";
				govTypeStr = "Limousine";
				busType = "bus";
		}
		else if(busType.match("마을")){
			typeColor = "color_local";
			imgSrc = contextPath + "/resources/images/2019new/img_bus_top_local.png";
			govTypeStr = "Community";
			busType = "bus";
		}
		else{
			typeColor = "color_line";
			govTypeStr = "";
			busType = "";
		}
		
		if(govTypeStr == "제주"){
			govTypeStr = "Jeju";
		}
		else if(govTypeStr == "서귀포"){
			govTypeStr = "Seogwipo";
		}
	}
	else if(locale == 'ch' ){
		if(busType.match("지선")){
			typeColor = "color_local";
			imgSrc = contextPath + "/resources/images/img_bus_top_local.png";
			if(busType == "읍면지선"){
				govTypeStr = "邑面";
			}
			busType = "支线";	
		}else if(busType.match("간선")){
			typeColor = "color_global";
			imgSrc = contextPath + "/resources/images/img_bus_top_global.png";
			if(busType == "일반간선"){
				govTypeStr = "普通";
			}
			busType = "干线";	
		}else if(busType.match("급행")){
			typeColor = "color_fast";
			imgSrc = contextPath + "/resources/images/img_bus_top_fast.png";
			govTypeStr = "快速";
			busType = "公交";
		}else if(busType.match("심야")){
			typeColor = "color_tour";
			imgSrc = contextPath + "/resources/images/img_bus_top_tour.png";
			busType="夜间公交";
		}else if(busType.match("관광지")){
			typeColor = "color_tour";
			imgSrc = contextPath + "/resources/images/img_bus_top_tour.png";
			govTypeStr = "景点循环";
			busType = "公交 ";
		}else if(busType.match("리무진")){
				typeColor = "color_fast";
				imgSrc = contextPath + "/resources/images/img_bus_top_fast.png";
				govTypeStr = "机场";
				busType = "大巴";
		}
		else if(busType.match("마을")){
			typeColor = "color_local";
			imgSrc = contextPath + "/resources/images/img_bus_top_local.png";
			govTypeStr = "社区";
			busType = "公交";
		}
		else{
			typeColor = "color_line";
			govTypeStr = "";
			busType = "";
		}
		
		if(govTypeStr == "제주"){
			govTypeStr = "济州";
		}
		else if(govTypeStr == "서귀포"){
			govTypeStr = "西归浦";
		}
	}
	else if(locale == 'jp' ){
		if(busType.match("지선")){
			typeColor = "color_local";
			imgSrc = contextPath + "/resources/images/img_bus_top_local.png";
			if(busType == "읍면지선"){
				govTypeStr = "邑面";
			}
			busType = "支線";	
		}else if(busType.match("간선")){
			typeColor = "color_global";
			imgSrc = contextPath + "/resources/images/img_bus_top_global.png";
			if(busType == "일반간선"){
				govTypeStr = "一般";
			}
			busType = "幹線";	
		}else if(busType.match("급행")){
			typeColor = "color_fast";
			imgSrc = contextPath + "/resources/images/img_bus_top_fast.png";
			govTypeStr = "急行";
			busType = "バス";
		}else if(busType.match("심야")){
			typeColor = "color_tour";
			imgSrc = contextPath + "/resources/images/img_bus_top_tour.png";
			busType="深夜";
		}else if(busType.match("관광지")){
			typeColor = "color_tour";
			imgSrc = contextPath + "/resources/images/img_bus_top_tour.png";
			govTypeStr = "観光地";
			busType = "循環 ";
		}else if(busType.match("리무진")){
			typeColor = "color_fast";
			imgSrc = contextPath + "/resources/images/img_bus_top_fast.png";
			govTypeStr = "リムジン";
			busType = "バス";
		}
		else if(busType.match("마을")){
			typeColor = "color_local";
			imgSrc = contextPath + "/resources/images/img_bus_top_local.png";
			govTypeStr = "町";
			busType = "バス";
		}
		else{
			typeColor = "color_line";
			govTypeStr = "";
			busType = "";
		}
		
		if(govTypeStr == "제주"){
			govTypeStr = "済州";
		}
		else if(govTypeStr == "서귀포"){
			govTypeStr = "西帰浦";
		}
	}

	
	sb.Append("<div class=\"middle\">");
	if(searchType != "1"){
		sb.Append("<img src="+imgSrc+" alt='"+ govTypeStr + " " + busType +"' />");
	}
	
	sb.Append("<span class=\"tour "+typeColor+"\">"+govTypeStr+"<br>"+busType+"</span>");
	sb.Append("<span class=\"second "+typeColor+"\">"+title+"</span>");
	sb.Append("</div>");
	
	
	sb.Append("<p class=\"wrap_button\">");
	
	if(locale.indexOf('ko') > -1){
		sb.Append("<input type=\"button\" id=\"timeTable_button\" class=\"button_search\" value=\"버스운행시간표\">");
	}

	sb.Append("</p>");
	
	$(".time_table").html(sb.ToString());
	
	/* 2019 버스정보시스템 고도화 :: 외국어 기능 추가 [시작]*/
	//외국어 경우 시간표 버튼 숨겨지므로 버스 노선번호 길이 넓게 표현
	if(locale.indexOf('ko') <= -1){
		$('.time_table').find('.middle').css('width', '230px');
	}
	
	//영어가 아닌 경우 css 기존 조건 추가
	if(locale != 'en'){
		$('.middle').find('img').css('width','164px');
		$('.middle').find('img').css('height','27px');
	}
	/* 2019 버스정보시스템 고도화 :: 외국어 기능 추가 [끝]*/
	
	//최초 가려져있던거 보여줌
	$(".time_table").css('visibility', 'visible');
	$(".wrap_button").css('visibility', 'visible');
	
	// 버스운행시간표
	$("#timeTable_button").click(function() {
		
		var fileName = routeNum;

		siteLink('/schedule/viewNew/'+fileName);
	});
}

//=========================================
// 노선검색 결과 SelectBox에 노선리스트 생성  
//=========================================
searchControl.prototype.lineSearchResultInfo = function(result) {
	
	//$(".wrap_button").css('visibility', 'hidden');
	$(".layout_map").css('visibility', 'visible');
	$(".layout_info,.realtime_background,.layout_realtime").css('visibility', 'hidden');
	
	
	// 뿌리기전 기존 li Elemet 삭제 
	$(".line_list li").remove();
	$(".station_list").children().remove();
	
	result = result ? result : this.searchResultInfo;
	
	var sb = new StringBuilder();
	
	/* 2019 버스정보시스템 고도화 :: 언어에 따라 선택 메시지 수정 [시작] */
	var selectMsg = "노선을 선택해주세요.";
	if(locale == 'en'){
		selectMsg = "Please select a route.";
	}
	else if(locale == 'ch'){
		selectMsg = "请选择线路。";
	}
	else if(locale == 'jp'){
		selectMsg = "路線を選択して下さい。";
	}
	/* 2019 버스정보시스템 고도화 :: 언어에 따라 선택 메시지 수정 [끝] */
	
	sb.Append("<li>");
	sb.Append("<div class=\"select_wrap\">");
	sb.Append("<p class=\"first_text\">"+ selectMsg +"</p>");
	sb.Append("<img class=\"arrow\" alt=\"열림닫힘이미지\" src=\"" + contextPath + "/resources/images/ico_tri.png\" />");
	sb.Append("</div>");
	sb.Append("</li>");
	
	for (var i = 0; i < result.size(); ++i) {
		var routeNum = result.get(i).routeNum ? result.get(i).routeNum : "정보없음";
		var name = result.get(i).routeSubNm ? result.get(i).routeSubNm : "정보없음";
		var startPoint = result.get(i).orgtNm ? result.get(i).orgtNm : "정보없음";
		var endPoint = result.get(i).dstNm ? result.get(i).dstNm : "정보없음";
		var imgSrc = contextPath + "/resources/images/ico_tri.png";
		
		if(locale == 'en'){
			startPoint = result.get(i).orgtsEngNm ? result.get(i).orgtsEngNm : "No information";
			endPoint = result.get(i).dstsEngNm ? result.get(i).dstsEngNm : "No information";
		}
		else if(locale == 'ch'){
			startPoint = result.get(i).orgtsChnNm ? result.get(i).orgtsChnNm : "没有信息";
			endPoint = result.get(i).dstsChnNm ? result.get(i).dstsChnNm : "没有信息";
		}
		else if(locale == 'jp'){
			startPoint = result.get(i).orgtsJpnNm ? result.get(i).orgtsJpnNm : "情報なし";
			endPoint = result.get(i).dstsJpnNm ? result.get(i).dstsJpnNm : "情報なし";
		}
		
		sb.Append("<li>");
		sb.Append("<div>");
		
		sb.Append("<p class=\"item_title\"><span class=\"item_num\">[" + i + "]</span> " +routeNum+" ["+name+"]</p>");
		sb.Append("<p class=\"item\">"+startPoint+" &gt;&gt; "+endPoint+"</p>");
		sb.Append("<img  src="+imgSrc+"  alt=\"열림닫힘이미지\" />");
		sb.Append("</div>");
		sb.Append("</li>");	    
	}

	$(".line_list").append(sb.ToString());
	
	//최초 가려져있던거 보여줌
	$(".first_blind_wrap").css('visibility', 'visible');
	$(".realtime_info").css('visibility', 'hidden');
	$(".clip").css('visibility', 'hidden');
	
	//타이틀 설정
	var title = $(".btn_time").val();
	$(".time_table").find("span").eq(1).text(title);
	
	
	//노선선택 셀렉트박스 클릭시 : 지도 레벨 3, 중심좌표 시청, 인포윈도우 삭제
	this.daumMapApi.map.setLevel(3);
	
	var moveLatLng = new daum.maps.LatLng(33.49947, 126.53120)   
	this.daumMapApi.map.panTo(moveLatLng);
	
	this.daumMapApi.deleteInfoWindow();
	
	this.daumMapApi.dropLine();
}



//=========================================
// 노선 선택 시 SelectBox 설정  
//=========================================
searchControl.prototype.lineSearchLineSelected = function(title, path) {
	$(".line_list li").remove();
	$(".station_list").children().remove();
	
	
	var sb = new StringBuilder();
	
	//IE8 호환성 관련 소스 추가[START]
	if ($('html').is('.lt-ie7, .lt-ie8, .lt-ie9')) {
		sb.Append("<li class=\"border_off\">");
    }
	else {
		sb.Append("<li>");
	}
	//IE8 호환성 관련 소스 추가[END]
	
	sb.Append("<div class=\"station_selected\">");
	sb.Append("<img class=\"arrow\" src=\"" + contextPath + "/resources/images/ico_tri.png\"  alt=\"열림닫힘이미지\" />");
	sb.Append("<p class=\"item\">"+title+"</p>");
	sb.Append("<p class=\"item\">"+path+"</p>");
	sb.Append("</div>");
	sb.Append("</li>");
	
	$(".line_list").append(sb.ToString());
	
	//선택된 타이틀로 변경
	$(".time_table").find("span").eq(1).text(title.split(" ")[1]);
}

//=========================================
//노선 기본정보 세팅  
//=========================================
searchControl.prototype.lineSearchBasicInfo = function(selectIndex) {
	
//	if(searchType != "1"){
//		$(".wrap_button").css('visibility', 'visible');
//	}
	
	$(".wrap_button").css('visibility', 'visible');
	
	$(".realtime_info").children().remove();
	
	var basicLineInfo = this.searchResultInfo.get(selectIndex);

	var startPoint = basicLineInfo.orgtNm ? basicLineInfo.orgtNm : "정보없음.";
	var endPoint = basicLineInfo.dstNm ? basicLineInfo.dstNm : "정보없음";
	
	var firstTm = basicLineInfo.startTm;
	var lastTm = basicLineInfo.endTm;
	
	var firstTmH = basicLineInfo.startTmH;
	var lastTmH = basicLineInfo.endTmH;
	
	var tm = "";
	if (firstTm == null || lastTm == null) {
		tm = "정보없음.";
		firstTm = "-";
		lastTm = "-";
	}
	else {
		tm = firstTm +" - "+lastTm;
	}
	
	var tmH = "";
	if (firstTmH == null || lastTmH == null) {
		tmH = "정보없음.";
		firstTmH = "-";
		lastTmH = "-";
	}
	else {
		tmH = firstTmH +" - "+lastTmH;
	}
	
	
	
	var companyNm = basicLineInfo.transportationCompanyName ? basicLineInfo.transportationCompanyName : "정보없음.";
	var companyNum = basicLineInfo.transportationCompanyTel ? basicLineInfo.transportationCompanyTel : "정보없음.";
	
	var sb = new StringBuilder();
	
//	sb.Append("<div class=\"dot_line\"></div>");
//	sb.Append("<p class=\"basic_text\">버스 기본정보</p>");
//	sb.Append("<p class=\"station_point\">| 기점-종점 : "+startPoint +" - "+endPoint+"</p>");
//	sb.Append("<p class=\"station_type\">| 첫차-막차 : "+fristTm +" - "+lastTm+"</p>");
//	sb.Append("<p class=\"comapay_name\">운수사 명 : "+companyNm+"</p>");
//	sb.Append("<p class=\"comapay_tel\">운수사 전화번호 : "+companyNum+"</p>");
	
	sb.Append("<div class=\"dot_line\"></div>");
	sb.Append("<p class=\"basic_text\">버스 기본정보</p>");
	sb.Append("<p class=\"station_point\">| 기점-종점 |</p>");
	sb.Append("<p class=\"station_point\">"+startPoint +" - "+endPoint+"</p>");
	sb.Append("</p>");
	
	/*
	sb.Append("<p class=\"station_type\">| 첫차-막차 |</p>");
	sb.Append("<p class=\"station_point\">");
	sb.Append("평일 : "+tm+"<BR>");
	sb.Append("휴일 : "+tmH+"<BR>");
	sb.Append("</p>");
	*/
	
	sb.Append("<p class=\"comapay_name\">운수사 명 : "+companyNm+"</p>");
	sb.Append("<p class=\"comapay_tel\">운수사 전화번호 : "+companyNum+"</p>");
	
	$(".realtime_info").append(sb.ToString());
	$(".realtime_info").css('visibility', 'visible');
	$(".clip").css('visibility', 'visible');

    var selectBoxH = $('div.station_selected').height();
    if(selectBoxH > 61){
    	//div.bus_info padding-top 사이즈 기본 설정 값 65
    	var padding = 65 + (selectBoxH - 61);
    	
    	$('.bus_info').css('padding-top', padding+'px');
    }
}

//=========================================
//노선 선택 시 경유 정류장 리스트 생성  
//=========================================
searchControl.prototype.lineSearchResultStationList = function(infoIdx) {
	$(".wrap_button").css('visibility', 'visible');
	var _searchControl = this;
	var routeId = this.searchResultInfo.get(infoIdx).routeId;
	$.post(contextPath + "/data/search/getLineInfoByLineId", {
		"lineId" : routeId
	}, function(result){
		var stationData = new ArrayList(result.stationInfoList);
		
		_searchControl.routeStationList = stationData;
		
		_searchControl.busType = result.busTypeStr;
		
		var sb = new StringBuilder();
		
		sb.Append("<div class=\"station_list\">");
		sb.Append("<div class=\"scroll_wrap scrollbar-outer\">");
		
		for (var i = 0; i < stationData.size(); ++i) {
			sb.Append("<div class=\"container\">");

			var stationNm = stationData.get(i).stationNm;
			
			if(locale == 'en'){
				stationNm = stationData.get(i).stationEngNm;
			}
			else if(locale == 'ch'){
				stationNm = stationData.get(i).stationChnNm;
			}
			else if(locale == 'jp'){
				stationNm = stationData.get(i).stationJpnNm;
			}
			
			sb.Append("<p class=\"station_text\">"+stationNm+"</p>");
			
			if(i == 0){
				sb.Append("<div class=\"first_bot_line\"></div>");
				sb.Append("<img class=\"start_image\" src=\""+ contextPath + "/resources/images/img_station_ico_start.png\" />");
				sb.Append("<div class=\"first_vertical_line\"></div>");
				
			}else if(i == stationData.size()-1){
				sb.Append("<div class=\"end_vertical_line\"></div>");
				sb.Append("<img class=\"end_img\" src=\""+ contextPath + "/resources/images/img_station_ico_end.png\" />");
				sb.Append("<div class=\"bot_line\"></div>");
			
			}else{
				sb.Append("<div class=\"bot_line\"></div>");
				sb.Append("<div class=\"vertical_line\"></div>");
				sb.Append("<img class=\"node_img\" src=\""+ contextPath + "/resources/images/img_station_ico_normal.png\" />");
			}
			
			sb.Append("</div>");
		}
		
		sb.Append("</div>");
		sb.Append("</div>");
		
		$(".station_list").append(sb.ToString());
		$('.scrollbar-outer').scrollbar();

		// 실시간버스 위치 표시 
		searchControl.realTimeBusInfo(routeId, result.busTypeStr);
		
	});
}

//=========================================
// 노선 선택 시 지도에 뿌려질 링크 생성  
//=========================================
searchControl.prototype.setlineLink = function(routeId) {
	
	var _searchControl = this;
	
	_searchControl.pageLoding($("#map"));
	
	$.post(contextPath + "/data/search/getLinkInfoByLineId", {
		"lineId" : routeId
	}, function(result){
		
		_searchControl.pageLoding($("#map"),"hide");
		
		if(result){
			
			
			result = new ArrayList(result);

			var linkInfo = new Object();
			var stationLinkList = new ArrayList();
			
			
			for (var i = 0; i < result.size(); ++i) {
				if (result.get(i).localY && result.get(i).localX) {
					var latlng = new Object();
					latlng.lat = result.get(i).localY;
					latlng.lng = result.get(i).localX;

					stationLinkList.add(latlng);
				}
			}
			
			_searchControl.linkList = null;
			_searchControl.linkList = {
				routeId: routeId,
				link: stationLinkList
			};
			
			// 경유노선 그리기 
			_searchControl.drawlineLink();
			
			
		}else{
			_searchControl.pageLoding($("#map"),"hide");
		}
	});
	
}

//=========================================
//노선 선택 시 지도에 경로 표시  
//=========================================
searchControl.prototype.drawlineLink = function() {
	
	var linkInfo = this.linkList.link;
	
	if(linkInfo.size() > 0){
		
		var path = new ArrayList();
		
		
		// 노선을 나타낼 시 지도 중심을 이동시키기 위한 변수설정
		var bounds = new daum.maps.LatLngBounds();
		
		for (var i = 0; i < linkInfo.size(); ++i) {			
			
			var latLng = new daum.maps.LatLng(linkInfo.get(i).lat, linkInfo.get(i).lng);
			
			bounds.extend(latLng);
			path.add(latLng);
		}
		
		this.daumMapApi.dropLine();
		this.daumMapApi.drawLine(path.toArray());
		
		this.daumMapApi.map.setBounds(bounds);
	}
}

//=========================================
//정류소 검색 후 Title 설정
//=========================================
searchControl.prototype.stationSearchResultTitle = function(stationKeyword) {
	
	// text_result 셀렉터를 가져와서 텍스트를 바꿔줌
	//$(".layout_result .text_result").text(stationKeyword);
	
	var sb = new StringBuilder();
	sb.Append("<img class=\"img_leaf\" src=\"" + contextPath + "/resources/images/img_leaf.png\" alt=\"정류소 검색 결과\">");
	sb.Append("<span class=\"text_result\">"+stationKeyword+"</span>");
	/* 2019 버스정보시스템 고도화 :: 외국어 조회 기능 추가 [시작] */
	//sb.Append("<span class=\"text_desc\">검색결과</span>");
	if ( locale == 'en' ) {
		sb.Append("<span class=\"text_desc\">Result</span>");
	} else if ( locale == 'ch' ) {
		sb.Append("<span class=\"text_desc\">查询结果</span>");
	} else if ( locale == 'jp' ) {
		sb.Append("<span class=\"text_desc\">検索結果</span>");
	} else {
		sb.Append("<span class=\"text_desc\">검색결과</span>");
	}

	sb.Append("<div class=\"result_line\"> </div>");
	sb.Append("</div>");
	
	$(".layout_result").html(sb.ToString());
	
	//최초 가려져있던거 보여줌
	$(".layout_result").css('visibility', 'visible');
}

//=========================================
//정류소검색 결과 SelectBox에 정류소리스트 생성  
//=========================================
searchControl.prototype.stationSearchResultInfo = function(result) {
	
	// search_list 하위요소들 삭제
	$(".search_list").children().remove();
	
	var sb = new StringBuilder();
	
	sb.Append("<div class=\"scroll_wrap scrollbar-outer\">");
	
	for (var i = 0; i < result.size(); ++i) {
		sb.Append("<div class=\"wrap_off\">");
			//부모
			sb.Append("<div>");
				sb.Append("<div class=\"station_text_containter\">");
					sb.Append("<div class=\"station_text_child\">");
					/* 2019 버스정보시스템 고도화 :: 외국어 조회 기능 추가 [시작] */
					//sb.Append("<p class=\"title\">"+result.get(i).stationNm+"</p>");
					if ( locale == 'en' ) {
						sb.Append("<p class=\"title\">"+result.get(i).stationEngNm+"</p>");
					} else if ( locale == 'ch' ) {
						sb.Append("<p class=\"title\">"+result.get(i).stationChnNm+"</p>");
					} else if ( locale == 'jp' ) {
						sb.Append("<p class=\"title\">"+result.get(i).stationJpnNm+"</p>");
					} else {
						sb.Append("<p class=\"title\">"+result.get(i).stationNm+"</p>");
					}
						
					sb.Append("<p class=\"number\">["+result.get(i).stationId+"]</p>");
					sb.Append("</div>");
//				sb.Append("<a class=\"station_close\" href=\"#\"></a>");
				sb.Append("<a class=\"station_close\" href=\"#\"><img class='img_cntr_state' src='" + contextPath + "/resources/images/main/btn_station_close.png' /></a>");
			sb.Append("</div>");
			sb.Append("<div class=\"parent_line\"></div>");
			sb.Append("</div>");
			//자식
			sb.Append("<div class=\"child_wrapper\" style=\"display:none;\">");
				sb.Append("<div class=\"child_station scrollbar-outer\">");
				sb.Append("</div>");
			sb.Append("</div>");
		sb.Append("</div>");
	}

	sb.Append("</div>");
	
	$(".search_list").append(sb.ToString());
	
	//스크롤바 적용
	$('.scroll_wrap.scrollbar-outer').scrollbar();
	
	//최초 가려져있던거 보여줌
	$(".second_blind_wrap").css('visibility', 'visible');
}

//=========================================
//정류소검색 결과 SelectBox에 정류소리스트 생성  
//=========================================
searchControl.prototype.stationSearchResultDetailInfo = function(selectIdx,selectStationInfo) {
	
	this.daumMapApi.dropLine();
	var _searchControl = this;
	var stationId = this.stationSearchList.get(selectIdx).stationId

	selectStationInfo.find(".child_wrapper").children().remove();
	
	var apiUrl;
	
	if(searchType == "1"){
		apiUrl = contextPath + "/data/search/getStationInfoByStationId";
	}else if(searchType == "2"){
		apiUrl = contextPath + "/data/search/getNewStationInfoByStationId";
	}
	
	
	$.post(apiUrl, {
		"stationId" : stationId
	}, function(result){

		if(result){
			
			var routeInfo = new ArrayList(result.routeInfoList);
			
			_searchControl.routInfoList = routeInfo;

			
			var sb = new StringBuilder();
			
			
			sb.Append("<div class=\"child_station scrollbar-outer\">");
			
			sb.Append("<div class=\"line_station_bottom\"></div>");
			
			for (var i = 0; i < routeInfo.size(); ++i) {
						
				var busTypeStr = routeInfo.get(i).busTypeStr;
				var typeColor;
				if(busTypeStr.match("지선")){
					typeColor = "color_local";
				}else if(busTypeStr.match("간선")){
					typeColor = "color_global";
				}else if(busTypeStr.match("급행")){
					typeColor = "color_fast";
				}else if(busTypeStr.match("심야")){
					typeColor = "color_tour";
				}else if(busTypeStr.match("관광지")){
					typeColor = "color_tour";
				}else if(busTypeStr.match("리무진")){
					typeColor = "color_fast";
				}else{
					typeColor = "color_line";
				}
				
				var routeNum = routeInfo.get(i).routeNum + "번";
				
				
				var routeSubNm = "("+routeInfo.get(i).routeSubNm + ")";
				var startPoint = routeInfo.get(i).orgtNm;
				var endPoint = routeInfo.get(i).dstNm;
				
				if ( locale == 'en' ) {
					routeNum = routeInfo.get(i).routeNum ;
					startPoint = routeInfo.get(i).orgtsEngNm;
					endPoint = routeInfo.get(i).dstsEngNm;
				} else if ( locale == 'ch' ) {
					routeNum = routeInfo.get(i).routeNum ;
					startPoint = routeInfo.get(i).orgtsChnNm;
					endPoint = routeInfo.get(i).dstsChnNm;
				} else if ( locale == 'jp' ) {
					routeNum = routeInfo.get(i).routeNum ;
					startPoint = routeInfo.get(i).orgtsJpnNm;
					endPoint = routeInfo.get(i).dstsJpnNm;
				}
				
				sb.Append("<div class=\"parent\">");
					sb.Append("<div class=\"text_wrap\">");
						sb.Append("<div class=\"text_area\">");
							//sb.Append("<p class=\"child_title "+typeColor+"\">"+routeNum+routeSubNm+"</p>");
							sb.Append("<p class=\"child_title\">");
								sb.Append("<span class=\"first "+typeColor+"\">"+routeNum+"</span>");
								sb.Append("<span class=\"second\">"+routeSubNm+"</span>");
							sb.Append("</p>");
							sb.Append("<p class=\"child_desc\">"+startPoint+" &gt;&gt; "+endPoint+"</p>");
						sb.Append("</div>");
					sb.Append("</div>");
					sb.Append("<div class=\"child_bottom_line\"></div>");
				sb.Append("</div>");
			}
			
			sb.Append("</div>");
			
			selectStationInfo.find(".child_wrapper").append(sb.ToString());
			
			//스크롤바 적용
			$('.child_station.scrollbar-outer').scrollbar();			
		}
		
	});
	
}

//=========================================
//정류소검색 결과 경유 노선클릭 시 노선그리기 
//=========================================
searchControl.prototype.stationSearchResultDrawRoute = function(selectIndex) {
	
	var _searchControl = this;
	var routeId = this.routInfoList.get(selectIndex).routeId;
	
	
	$.post("/data/search/getLineInfoByLineId", {
		"lineId" : routeId
	}, function(result){
		_searchControl.routeStationList = new ArrayList(result.stationInfoList);
		
		searchControl.setlineLink(routeId);
		searchControl.realTimeBusInfo(routeId);
		
	});
	
		
}

//=========================================
// 실시간 버스정보 가져오기  
//=========================================
searchControl.prototype.realTimeBusInfo = function(routeId, busTypeStr) {
	var _searchControl = this;
	busTypeStr = busTypeStr ? busTypeStr : "지선";
	
	if(routeId){
		$.post(contextPath + "/data/search/getRealTimeBusPositionByLineId", {
			"lineId" : routeId
		}, function(result){
			
			//현재 화면에 보이고 있는 버스 타입 마커들을 가린다.
//			_searchControl.daumMapApi.hiddenMarker("bus");
			//버스 위치를 가려도 버스 위치들은 업데이트 되기 때문에 기존 버스들을 삭제하고 다시 추가하는 방법으로 변경함.
			_searchControl.daumMapApi.removeBusMarker();
			
			// 실시간 버스위치를 위해 기존 이미지 초기화
			$(".container img").attr("class","node_img");
			$(".container img").attr("src", contextPath + "/resources/images/img_station_ico_normal.png");
			$(".container img").first().attr("class","start_image");
			$(".container img").first().attr("src", contextPath + "/resources/images/img_station_ico_start.png");
			$(".container img").last().attr("class","end_img");
			$(".container img").last().attr("src", contextPath + "/resources/images/img_station_ico_end.png");
			
			if ( result.length > 0 ) {				
				var stationInfo = _searchControl.routeStationList;

				result = new ArrayList(result);
				
				for (var i = 0; i < result.size(); ++i) {
					for (var j = 0; j < stationInfo.size(); ++j) {
						if(stationInfo.get(j).stationId == result.get(i).currStationId){
							
							// 경유 정류장에 실시간버스 위치 표시
							var busImageSelector = $(".container").eq(j).children().eq(3);
							busImageSelector.attr("class", "bus_icon");
							
							// 2017.09.26 저상버스 추가
							var lowPlateTp = result.get(i).lowPlateTp;
							if(lowPlateTp.match("Y")){
								busImageSelector.attr("src", contextPath + "/resources/images/img_bus_ico_low.png");
								_searchControl.busType = "저상";
							} else if(busTypeStr.match("지선")){
								busImageSelector.attr("src", contextPath + "/resources/images/img_bus_ico_local.png");
								_searchControl.busType = "지선";
							} else if(busTypeStr.match("간선")){
								busImageSelector.attr("src", contextPath + "/resources/images/img_bus_ico_global.png");
								_searchControl.busType = "간선";
							} else if(busTypeStr.match("급행")){
								busImageSelector.attr("src", contextPath + "/resources/images/img_bus_ico_fast.png");
								_searchControl.busType = "급행";
							} else if(busTypeStr.match("심야")){
								busImageSelector.attr("src", contextPath + "/resources/images/img_bus_ico_tour.png");
								_searchControl.busType = "심야";
							} else if(busTypeStr.match("관광")){
								busImageSelector.attr("src", contextPath + "/resources/images/img_bus_ico_tour.png");
								_searchControl.busType = "관광";
							} else if(busTypeStr.match("리무진")){
								busImageSelector.attr("src", contextPath + "/resources/images/img_bus_ico_fast.png");
								_searchControl.busType = "리무진";
							}
							
							// 지도상에 실시간버스 마커생성해서 추가한다.
							var title = result.get(i).plateNo;
							var position = new daum.maps.LatLng(result.get(i).localY, result.get(i).localX);
							var marker = _searchControl.insertStationMaker(title,position,"bus");
						}
					}	
				}
			}
		});
	}
}

//=========================================
//실시간 버스위치 메뉴 노선 그리기  
//=========================================
searchControl.prototype.realTimeRouteDraw = function(selectIndex) {
	
	
	$(".layout_arrive_info").remove();
	var _searchControl = this;
	var routeInfo = this.searchResultInfo.get(selectIndex);
	
	
	var routeId = routeInfo.routeId;
	this.routeId = routeId;
	var routeNum = routeInfo.routeNum;
	
	
	$.post(contextPath + "/data/search/getLineInfoByLineId", {
		"lineId" : routeId
	}, function(result){
		
		//var stationInfoList = new ArrayList(result.stationInfoList);
		
		_searchControl.stationInfoList = new ArrayList(result.stationInfoList);
		
		// 타이틀 설정
		_searchControl.realTimeRouteTitle(routeNum, result.busTypeStr);
		
		// 노선만 그리기 
		_searchControl.realTimeStationDraw(_searchControl.stationInfoList,_searchControl.routeId, result.busTypeStr);
		
//		// 실시간 버스위치 갱신
//		_searchControl.realTimeBusPositionUpdate(_searchControl.routeId, _searchControl.stationInfoList, result.busTypeStr);
	});
	
	
}

//=========================================
//실시간 버스위치 메뉴 노선 타이틀 설정  
//=========================================
searchControl.prototype.realTimeBusPositionUpdate = function(routeId, stationInfoList, busTypeStr) {
	
	var drawStationList = $(".line_cell.multi.odd_line, .line_cell.multi.even_line");

	drawStationList.find("div.line_top.middle").children().remove();
	busTypeStr = busTypeStr ? busTypeStr : "지선";
	
	$.post(contextPath + "/data/search/getRealTimeBusPositionByLineId", {
		"lineId" : routeId
	}, function(result){
		
		if(result.length > 0){
			
			result = new ArrayList(result);
			
			for (var i = 0; i < result.size(); ++i) {
				for (var j = 0; j < stationInfoList.size(); ++j) {
					
					if(stationInfoList.get(j).stationId == result.get(i).currStationId){
					
						drawStationList.eq(j).find("div.line_top.middle").attr("class","line_top middle");
						
						var busNum = result.get(i).plateNo;
						
						var sb = new StringBuilder();
						
						// 2017.09.26 저상버스 추가
						var lowPlateTp = result.get(i).lowPlateTp;
						if(lowPlateTp.match("Y")){
							sb.Append("<img class=\"bug_image\" alt=\"저상버스  도착  안내 이미지\" src=\"" + contextPath + "/resources/images/img_bus_ico_low.png\">");
						}

						else if(busTypeStr.match("지선")){
							sb.Append("<img class=\"bug_image\" alt=\"지선버스  도착  안내 이미지\" src=\"" + contextPath + "/resources/images/img_bus_ico_local.png\">");
						}else if(busTypeStr.match("간선")){
							sb.Append("<img class=\"bug_image\" alt=\"간선버스  도착  안내 이미지\" src=\"" + contextPath + "/resources/images/img_bus_ico_global.png\">");
						}else if(busTypeStr.match("급행")){
							sb.Append("<img class=\"bug_image\" alt=\"급행버스  도착  안내 이미지\" src=\"" + contextPath + "/resources/images/img_bus_ico_fast.png\">");
						}else if(busTypeStr.match("심야")){
							sb.Append("<img class=\"bug_image\" alt=\"심야버스  도착  안내 이미지\" src=\"" + contextPath + "/resources/images/img_bus_ico_tour.png\">");
						}else if(busTypeStr.match("관광")){
							sb.Append("<img class=\"bug_image\" alt=\"관광버스  도착  안내 이미지\" src=\"" + contextPath + "/resources/images/img_bus_ico_tour.png\">");
						}else if(busTypeStr.match("리무진")){
							sb.Append("<img class=\"bug_image\" alt=\"리무진버스  도착  안내 이미지\" src=\"" + contextPath + "/resources/images/img_bus_ico_fast.png\">");
						}
						
						sb.Append("<p class=\"img_desc\">"+busNum+"</p>");
						
						drawStationList.eq(j).find("div.line_top.middle").append(sb.ToString());
					}
				}
			}
		}
	});
}

//=========================================
//실시간 버스위치 메뉴 노선 타이틀 설정  
//=========================================
searchControl.prototype.realTimeRouteTitle = function(routeNum, busType) {
	
	//맵화면 숨기고 실시간 버스위치 화면 보여줌
	$(".layout_map").css('visibility', 'hidden');
	$(".layout_info,.realtime_background,.layout_realtime").css('visibility', 'visible');
	
	$(".line_info").children().remove();
	
	var imgTitleSrc = imgTitleSrc ? imgTitleSrc : contextPath + "/resources/images/img_bus_top_local.png";
	var imgSymbolSrc = imgSymbolSrc ? imgSymbolSrc : contextPath + "/resources/images/img_bus_ico_local.png";
	
	if(busType.match("지선")){
		imgTitleSrc = contextPath + "/resources/images/img_bus_top_local.png";
		imgSymbolSrc = contextPath + "/resources/images/img_bus_ico_local.png";
		busType = "지선";
	}else if(busType.match("간선")){
		imgTitleSrc = contextPath + "/resources/images/img_bus_top_global.png";
		imgSymbolSrc = contextPath + "/resources/images/img_bus_ico_global.png";
		busType = "간선";
	}else if(busType.match("급행")){
		imgTitleSrc = contextPath + "/resources/images/img_bus_top_fast.png";
		imgSymbolSrc = contextPath + "/resources/images/img_bus_ico_fast.png";
		busType = "급행";
	}else if(busType.match("심야")){
		imgTitleSrc = contextPath + "/resources/images/img_bus_top_tour.png";
		imgSymbolSrc = contextPath + "/resources/images/img_bus_ico_tour.png";
		busType = "심야";
	}else if(busType.match("관광")){
		imgTitleSrc = contextPath + "/resources/images/img_bus_top_tour.png";
		imgSymbolSrc = contextPath + "/resources/images/img_bus_ico_tour.png";
		busType = "관광";
	}else if(busType.match("리무진")){
		imgTitleSrc = contextPath + "/resources/images/img_bus_top_fast.png";
		imgSymbolSrc = contextPath + "/resources/images/img_bus_ico_fast.png";
		busType = "리무진";
	}
	
	var busName = routeNum;
	var sb = new StringBuilder();
	
	sb.Append("<img class=\"symbal\" alt=\"지선버스 안내 이미지\" src="+imgTitleSrc+">");
	sb.Append("<img class=\"type\" alt=\"지선버스 심벌 이미지\" src="+imgSymbolSrc+">");
	sb.Append("<p><span class=\"name\">"+busName+"</span></p>");
		
	$(".line_info").append(sb.ToString());
}

//=========================================
//실시간 버스위치 메뉴 경유정류소 그리기
//=========================================
searchControl.prototype.realTimeStationDraw = function(stationInfoList, routeId, busTypeStr) {
	var _searchControl = this;
	$(".line_wrap").children().remove();
	
	// 1줄에 그릴 수 있는 컨텐츠 최대개수 (컨텐츠 넓이는 100 임.)
	var maxConunt = $(".line_wrap").width()/100;
	
	//Station 개수는 최대컨텐츠 개수에서 앞,뒤에 곡선을 제외한 개수 
	var stationConunt = maxConunt-2;
	
	// 총 라인 수
	var roofCount = Math.ceil(stationInfoList.size()/stationConunt);
	var sb = new StringBuilder();

	// 구간별 속도데이터 가져옴 
	$.post(contextPath + "/data/search/getAvgSpeedByLineId", {
		"lineId" : this.routeId
	}, function(result){
		
		// 그리는 순서 : front(꺽는선) - middle(정류장 리스트) - rear(꺽는선)
		for (var i = 0; i < roofCount; ++i) {
			
			//홀수라인 짝수라인 구분 
			var type = i%2 == 0 ? "odd_line" : "even_line";
			
			// 맨 처음은 공백이므로 정류장만 그림 
			if(i==0){
				sb.Append("<div class=\"line_cell dummy odd_line\"></div>");
				sb.Append(_searchControl.middleSpaceDraw(type, i,stationConunt, stationInfoList,result));
			  
			}else{
				
				sb.Append(_searchControl.frontSpaceDraw(type,i, stationConunt,result));
				sb.Append(_searchControl.middleSpaceDraw(type, i,stationConunt, stationInfoList,result));
			}
			
			//맨마지막도 공백이므로 
			if(i != roofCount-1){
				sb.Append(_searchControl.rearSpaceDraw(type,i, stationConunt,result));
			}	
			
		}
		
		$(".line_wrap").append(sb.ToString());
		
		_searchControl.realTimeBusPositionUpdate(routeId, stationInfoList, busTypeStr);
	});
	
}

searchControl.prototype.frontSpaceDraw = function(type,i, stationConunt, result) {
	
	var sb = new StringBuilder();
	
	//짝수열
	if(type == "odd_line"){
		
		sb.Append("<div class=\"line_cell dummy odd_line\">");
		sb.Append("<div class=\"bottom_left_line border_"+this.getTrafficStatus(result[i*stationConunt-1].AVG_SPD)+"\"></div>");
		
		sb.Append("</div>");
		
		
	//홀수열일때는 오른쪽 정렬이므로 
	}else{
		
		//홀수열일때 앞단은 내려오면서 왼쪽으로 꺽는 모양
		sb.Append("<div class=\"line_cell dummy even_line first\">");
		sb.Append("<div class=\"bottom_right_line border_"+this.getTrafficStatus(result[i*stationConunt-1].AVG_SPD)+"\"></div>");
		
		sb.Append("</div>");
		
	}
	
	
	return sb.ToString();
	
				
}

searchControl.prototype.middleSpaceDraw = function(type, i,stationConunt,stationInfoList, result) {
	
	var sb = new StringBuilder();
	
	for (var j = i*stationConunt; j < stationConunt+(i*stationConunt); ++j) {
		
		if(j == stationInfoList.size()){
			break;
		}
		
		var stationId = stationInfoList.get(j).stationId;
		var stationNm = stationInfoList.get(j).stationNm;
		
		//짝수열
		if(type == "odd_line"){
			sb.Append("<div class=\"line_cell multi odd_line\">");
        //홀수열
		}else{
			sb.Append("<div class=\"line_cell multi even_line\">");
		}
		
		sb.Append("<div class=\"line_top middle\"></div>");
		
		
		//맨처음 이미지
		if(j==0){
			
			sb.Append("<div class=\"hor_line2 color_"+this.getTrafficStatus(result[j].AVG_SPD)+"\"></div>");
			
			sb.Append("<img class=\"line_start\" alt=\"출발점 마커 이미지\" src=\"" + contextPath + "/resources/images/ico_line_start.png\">");
		
		//맨마지막 이미지
		}else if(j == stationInfoList.size()-1){
			
			if(type == "odd_line"){
				sb.Append("<div class=\"hor_line1 color_"+this.getTrafficStatus(result[j-1].AVG_SPD)+"\"></div>");
				
			}else{
				sb.Append("<div class=\"hor_line2 color_"+this.getTrafficStatus(result[j-1].AVG_SPD)+"\"></div>");
			}
			
			sb.Append("<img class=\"line_end\" src=\"" + contextPath + "/resources/images/ico_line_end.png\" alt=\"종료점 마커 이미지\">");		
		
		//일반 이미지
		}else{
			if ( j==1 ) {
				sb.Append("<div class=\"hor_line1 color_"+this.getTrafficStatus(result[0].AVG_SPD)+"\"></div>");
				sb.Append("<div class=\"hor_line2 color_"+this.getTrafficStatus(result[j].AVG_SPD)+"\"></div>");
			} else {
				if ( type == "odd_line" ) {
					sb.Append("<div class=\"hor_line1 color_"+this.getTrafficStatus(result[j-1].AVG_SPD)+"\"></div>");
					sb.Append("<div class=\"hor_line2 color_"+this.getTrafficStatus(result[j].AVG_SPD)+"\"></div>");
				} else {
					sb.Append("<div class=\"hor_line1 color_"+this.getTrafficStatus(result[j].AVG_SPD)+"\"></div>");
					sb.Append("<div class=\"hor_line2 color_"+this.getTrafficStatus(result[j-1].AVG_SPD)+"\"></div>");
				}
			}

			sb.Append("<img class=\"line_normal\" alt=\"일반정류장 마커 이미지\" src=\"" + contextPath + "/resources/images/img_station_ico_normal.png\">");
		}
		
		sb.Append("<div class=\"botttom_type\">");
		sb.Append("<p class=\"line_text\">"+(j+1)+". "+stationNm+"</p>");
		sb.Append("<p class=\"line_number\">"+stationId+"</p>");
		sb.Append("</div>");
		
		sb.Append("</div>");
	}
	
	return sb.ToString();
}


searchControl.prototype.rearSpaceDraw = function(type, i, stationConunt, result) {
	
	var sb = new StringBuilder();
	
	//짝수열
	if(type == "odd_line"){
		
		//짝수열일때 뒷단은 내려오면서 왼쪽으로 꺽는 모양
		sb.Append("<div class=\"line_cell dummy odd_line\">");
		sb.Append("<div class=\"top_right_line border_"+this.getTrafficStatus(result[(i*stationConunt + stationConunt)-1].AVG_SPD)+"\"></div>");
		sb.Append("</div>");
		
		
	//홀수열일때는 오른쪽 정렬이므로 
	}else{
		
		sb.Append("<div class=\"line_cell dummy even_line\">");
		sb.Append("<div class=\"top_left_line border_"+this.getTrafficStatus(result[(i*stationConunt + stationConunt)-1].AVG_SPD)+"\"></div>");
		sb.Append("</div>");
		
	}
	
	
	return sb.ToString();
	
}

searchControl.prototype.getTrafficStatus = function(avgSpeed) {
	if(avgSpeed < 11){
		
		return "bad"
		
	}else if(avgSpeed > 10 && avgSpeed < 31){
		
		return "low"
	
	}else if(avgSpeed > 30 ){
	
		return "good"
	
	}else{
	
		return "unknown"
	}
}

//=========================================
// 경유 노선목록 중 정류소 클릭 시 발생 이벤트   
//=========================================
searchControl.prototype.clickRouteStation = function(idx, type) {
	var stationInfo;
	
	if(type == "line"){
		stationInfo = this.routeStationList.get(idx);
	}else if(type == "station"){
		stationInfo = this.stationSearchList.get(idx);
	}

	this.daumMapApi.map.setLevel(3);
	
	var markerTitle = stationInfo.stationId+","+stationInfo.stationNm

	if ( locale == 'en' ) {
		markerTitle = stationInfo.stationId+","+stationInfo.stationEngNm
	} else if ( locale == 'ch' ) {
		markerTitle = stationInfo.stationId+","+stationInfo.stationChnNm
	} else if ( locale == 'jp' ) {
		markerTitle = stationInfo.stationId+","+stationInfo.stationJpnNm
	}
	
	var position = new daum.maps.LatLng(stationInfo.localY, stationInfo.localX);
	
	
	
	var marker = this.insertStationMaker(markerTitle,position);
	this.clickStationMaker(marker);
	
}

//=========================================
//실시간 버스정보 경유 정류소 클릭했을 시   
//=========================================
searchControl.prototype.clickRealTimeRouteStation = function(routeId,stationId, selectElement) {
	
	$(".layout_arrive_info").remove();
	
	$.post(contextPath + "/data/search/getArriveScheduleByStationId", {
		"stationId" : stationId
	}, function(result){
		
		var arriveInfo;
		var title = selectElement.find("p").eq(0).text();
		var stationNum = selectElement.find("p").eq(1).text();
		
		var routeInfoList = new ArrayList(result.routeInfoList);
		
		for (var i = 0; i < routeInfoList.size(); ++i) {
			if(routeInfoList.get(i).routeId == routeId){
				arriveInfo = routeInfoList.get(i);
			}
		}
		
		
		$(".cell_wrap p").eq(0).text(title);
		$(".cell_wrap p").eq(1).text("(" + stationNum + ")");
		
		
		var sb = new StringBuilder();
		sb.Append("<div class=\"layout_arrive_info\">");
		sb.Append("<div class=\"title_wrap\">");
		sb.Append("<p class=\"arrive_title\">버스도착 예정정보</p>");
		sb.Append("</div>");
		sb.Append("<div class=\"top_container\">");
		sb.Append("<div class=\"cell_wrap\">");
        
		sb.Append("<p>"+title+"</p>");
		sb.Append("<p>"+"(" + stationNum + ")"+"</p>");
        sb.Append("</div>");
        sb.Append("</div>");
		
		// 노선에 대한 도착예상정보가 있을 때 
		if(arriveInfo){
			
			sb.Append("<div class=\"bottom_container\">");
			sb.Append("<p class=\"state\">"+arriveInfo.predictTravTm +"분 후("+arriveInfo.remainStation+" 전)"+"</p>");
			sb.Append("</div>");
			
		// 도착예상 정보가 없을때
		}else{
			
			sb.Append("<div class=\"bottom_container\">");
			sb.Append("<p class=\"state\">도착 예정정보가 없습니다.</p>");
			sb.Append("</div>");
			
		}
		
		sb.Append("<a class=\"arrive_btn_close\" href=\"#\">");
		/*웹호환성 관련 소스 수정[START]*/
		sb.Append("<img style=\"width:30px;height:30px;display:block;border:0px; \" src=\"" + contextPath + "/resources/images/main/img_btn_realtime_close.png\" href=\"#\">");
		/*웹호환성 관련 소스 수정[END]*/
		sb.Append("</a>");
		sb.Append("</div>");
		
		$(".first_wrapper").prepend(sb.ToString());
		
		
		//도착 예정정보 표출 위치 조정  
		var elementHight = selectElement.height()/2;
		var stationTop = selectElement.offset().top + elementHight - elementHight*2;
 		var stationleft = selectElement.offset().left + (selectElement.width()/2)/2;
 		var topPosi = stationTop - $(".layout_arrive_info").height();
 		var leftPosi = stationleft - $(".layout_arrive_info").width()/2;
 		$(".layout_arrive_info").offset({top: topPosi, left: leftPosi})
		
	});
		
}

//=========================================
//행정구분에 따른 구노선번호 리스트 정보 가져오기 
//=========================================
searchControl.prototype.oldLineList = function(govCd, routeTp) {
	
	$(".select_line").children().remove();
	
	//API : 행정구분에 따른 구노선 검색하기 		
	$.post(contextPath + "/data/search/similar/oldLineListByGovCd",{
		"govCd" : govCd,
		"routeTp" : routeTp
	}, function(result){
		if(result.length > 0){
				
			//result = new ArrayList(result);
			var sb = new StringBuilder();
			
			sb.Append("<option value=\"0\">노선번호선택</option>");
			
			for (var i = 0; i < result.length; ++i) {
				
				sb.Append("<option value=\""+(i+1)+"\">"+result[i]+"번</option>");
			}
			
			$(".select_line").append(sb.ToString());
		}
		
	});
}

//=========================================
//유사노선 리스트 정보 가져오기 
//=========================================
searchControl.prototype.similarLineSearch = function(govCd, selectedIndex) {
	
	var _searchControl = this;
	
	$(".line_scroll").children().remove();
	
	//API : 행정구분에 따른 구노선 검색하기 		
	$.post(contextPath + "/data/search/similar/newLineListBySelectBox",{
		"govCd" : govCd,
		"selectedIndex" : selectedIndex
	}, function(result){
		
		var sb = new StringBuilder();
		
		if(result.length > 0){
			
			result = new ArrayList(result);
			
			_searchControl.similarLineList = result;

			$(".sline_result").text("유사노선 검색결과(총 "+result.size()+"건)");
			sb.Append("<li class=\"cell_item\">");
			sb.Append("<a class=\"link\" href=\"#\">");
			sb.Append("<div class=\"cell_wrap\">");
			sb.Append("<p class=\"first color_line\">"+$(".select_line option:selected").text()+" 유사노선 검색결과</p>");
			sb.Append("<p class=\"second\"></p>");
			sb.Append("</div>");
			sb.Append("</a>");
			sb.Append("</li>");
			
			for (var i = 0; i < result.size(); ++i) {
				var govTypeStr = result.get(i).govTypeStr;
				var busTypeStr = result.get(i).busTypeStr;
				var routeNum = result.get(i).routeNum;
				var routeSubNm = result.get(i).routeSubNm;
				
				sb.Append("<li class=\"cell_item\">");
				sb.Append("<a class=\"link\" href=\"#\">");
				sb.Append("<div class=\"cell_wrap\">");
				
				if(busTypeStr.match("지선")){
					
					if(busTypeStr == "읍면지선"){
						sb.Append("<p class=\"first color_local\">[읍면지선] "+routeNum+"</p>");
					}else{
						sb.Append("<p class=\"first color_local\">["+govTypeStr+"지선] "+routeNum+"</p>");
					}
				}else if(busTypeStr.match("간선")){
					
					if(busTypeStr == "일반간선"){
						sb.Append("<p class=\"first color_global\">[일반간선] "+routeNum+"</p>");	
					}else{
						sb.Append("<p class=\"first color_global\">["+govTypeStr+"간선] "+routeNum+"</p>");
					}
				}else if(busTypeStr.match("급행")){
					sb.Append("<p class=\"first color_fast\">[급행] "+routeNum+"</p>");
				}else if(busTypeStr.match("심야")){
					sb.Append("<p class=\"first color_tour\">["+govTypeStr+"심야] "+routeNum+"</p>");
				}else if(busTypeStr.match("관광지")){
					sb.Append("<p class=\"first color_tour\">[관광지순환] "+routeNum+"</p>");
				}else if(busTypeStr.match("리무진")){
					sb.Append("<p class=\"first color_fast\">[리무진] "+routeNum+"</p>");
				}
				
				sb.Append("<p class=\"second\">"+routeSubNm+"</p>");
				sb.Append("</div>");
				sb.Append("</a>");
				sb.Append("</li>");
			}
			
			$(".line_scroll").append(sb.ToString());
			
		}else{
			$(".sline_result").text("유사노선 검색결과(총 0건)");
			sb.Append("<li class=\"cell_item\">");
			sb.Append("<a class=\"link\" href=\"#\">");
			sb.Append("<div class=\"cell_wrap\">");
			sb.Append("<p class=\"first color_line\">검색결과가 없습니다.</p>");
			sb.Append("<p class=\"second\"></p>");
			sb.Append("</div>");
			sb.Append("</a>");
			sb.Append("</li>");
			$(".line_scroll").append(sb.ToString());
			
			$(".station_scroll .cell_item").eq(0).children().find("p").text("검색결과가 없습니다.");
		}
	});
}

//=========================================
//유사노선 경유 정류장 정보 가져오기 
//=========================================
searchControl.prototype.getSimilarLineStation = function(lineId) {
	
	var _searchControl = this;
	
	
	//API : 행정구분에 따른 구노선 검색하기 		
	$.post(contextPath + "/data/search/similar/lineInfoByLineID",{
		"lineId" : lineId
	}, function(result){
		
		$(".station_scroll").children().remove();
		var sb = new StringBuilder();
		var stationInfoList = new ArrayList(result.stationInfoList);
		
		var busTypeStr = result.busTypeStr;
		var routeNum = result.routeNum;
		
		sb.Append("<li class=\"cell_item\">");
		sb.Append("<a class=\"link\" href=\"#\">");
		
		if(busTypeStr.match("지선")){
			sb.Append("<p class=\"text color_local\">["+busTypeStr+" "+routeNum+"번] 경유 정류장 목록</p>");
		}else if(busTypeStr.match("간선")){
			sb.Append("<p class=\"text color_global\">["+busTypeStr+" "+routeNum+"번] 경유 정류장 목록</p>");
		}else if(busTypeStr.match("급행")){
			sb.Append("<p class=\"text color_fast\">["+busTypeStr+" "+routeNum+"번] 경유 정류장 목록</p>");
		}else if(busTypeStr.match("심야")){
			sb.Append("<p class=\"text color_tour\">["+busTypeStr+" "+routeNum+"번] 경유 정류장 목록</p>");
		}else if(busTypeStr.match("관광")){
			sb.Append("<p class=\"text color_tour\">["+busTypeStr+" "+routeNum+"번] 경유 정류장 목록</p>");
		}else if(busTypeStr.match("리무진")){
			sb.Append("<p class=\"text color_fast\">["+busTypeStr+" "+routeNum+"번] 경유 정류장 목록</p>");
		}
		
		
		sb.Append("</a>");
		sb.Append("</li>");
		
		_searchControl.similarLineStationList = stationInfoList;
		
		for (var i = 0; i < stationInfoList.size(); ++i) {
			
			var stationNm = stationInfoList.get(i).stationNm;
			
			sb.Append("<li class=\"cell_item\">");
			sb.Append("<a class=\"link\" href=\"#\">");
			sb.Append("<p class=\"text\">"+stationNm+"</p>");
			sb.Append("</a>");
			sb.Append("</li>");
			
		}
		
		$(".station_scroll").append(sb.ToString());
		
		$('.station_wrapper .scrollbar_wrap.scrollbar-outer.scroll-content').animate({scrollTop:0}, 200);
	});
}

//=========================================
//출도착 검색어에 대한 정류장 검색 
//=========================================
searchControl.prototype.startEndStationSearch = function(stationKeyword, type, status) {
	
	var _searchControl = this;
	
	if(stationKeyword){
		
		_searchControl.pageLoding($(".layout_right"));
		
		//API : 정류소명(텍스트)으로 정류소 검색하기 
		$.post(contextPath + "/data/search/searchStationByKeyword", {
			"keyword" : stationKeyword
		}, function(result){
			if(result.length > 0){
				
				_searchControl.pageLoding($(".layout_right"),"hide");
				
				result = new ArrayList(result);
				_searchControl.stationSearchList = result;
				
				$(".layout_result.point_result").css('visibility', 'visible');
				
				//타이틀 설정
				if(type == "start"){
					$(".text_result.point_text_result").text($("#start").find("input").val());
				}else{
					$(".text_result.point_text_result").text($("#end").find("input").val());
				}
				$(".text_desc.point_text_desc").text("정류소 검색결과");
				
				// 정류소 검색 결과값 뿌려줌
				_searchControl.startEndSearchResultInfo(result);
				
				// status가 "click"이면 인포윈도우에서 넘어왔으므로 출도착 지점으로 설정
				if(status == "click"){
					setStartEndPoint(0);
				}
				
				
				
			}else{
				
				_searchControl.pageLoding($(".layout_right"),"hide");
				
				
				$(".layout_result.point_result").css('visibility', 'visible');

				$(".text_result.point_text_result").text("'"+stationKeyword+"'");
				$(".text_desc.point_text_desc").text("정류소 검색결과가 없습니다.");
				
				// search_list 하위요소들 삭제
				$(".search_list").children().remove();
				
			}
			
		});
		
	}else{
		_searchControl.pageLoding($(".layout_right"),"hide");
		alert("[정류소검색] 검색어를 입력하세요!");
	}
}

//=========================================
//출도착 검색결과 정류소리스트 생성  
//=========================================
searchControl.prototype.startEndSearchResultInfo = function(result) {
	
	// search_list 하위요소들 삭제
	$(".search_list").children().remove();
	
	
	var sb = new StringBuilder();
	
	sb.Append("<div class=\"scroll_wrap scrollbar-outer\">");
	
	for (var i = 0; i < result.size(); ++i) {
		
		sb.Append("<div class=\"point_lay_wrap\">");
			//부모
			sb.Append("<div>");
				sb.Append("<div class=\"station_text_containter point_container\">");
					sb.Append("<div class=\"station_text_child\">");
						sb.Append("<p class=\"title p_title\">"+result.get(i).stationNm+"</p>");
						sb.Append("<p class=\"number p_number\">["+result.get(i).stationId+"]</p>");
					sb.Append("</div>");
				sb.Append("</div>");
			
				sb.Append("<a class=\"btn_wrap btn_start\" href=\"#\">출발</a>");
				sb.Append("<a class=\"btn_wrap btn_end\" href=\"#\">도착</a>");
				
				/*sb.Append("<a class=\"icon fix_start\" href=\"#\"></a>");
				sb.Append("<a class=\"icon fix_end\" href=\"#\"></a>");*/
				
				/*IE8 웹호환성 관련 소스 수정[START]*/
				sb.Append("<a class=\"icon fix_start\" href=\"#\">");
				sb.Append("<img style='width: 39px;height: 32px;display: block;border:0px;' src='" + contextPath + "/resources/images/img_point_start.png' />");
				sb.Append("</a>");
				sb.Append("<a class=\"icon fix_end\" href=\"#\">");
				sb.Append("<img style='width: 39px;height: 32px;display: block;border:0px;' src='" + contextPath + "/resources/images/img_point_end.png' />");
				sb.Append("</a>");
				/*IE8 웹호환성 관련 소스 수정[END]*/
				
				
				
				sb.Append("<div class=\"parent_line\"></div>");
			sb.Append("</div>");
			
			//자식
			sb.Append("<div class=\"parent_bottom_wrap off\">");
				sb.Append("<div class=\"line\"></div>");
			sb.Append("</div>");
		sb.Append("</div>");
	}

	sb.Append("</div>");
	
	$(".search_list").append(sb.ToString());
	
	//스크롤바 적용
	$('.scrollbar-outer').scrollbar();
	
	//최초 가려져있던거 보여줌
	$(".second_blind_wrap").css('visibility', 'visible');
	$(".btn_wrap").css('visibility', 'hidden');
}

//=========================================
//출도착 검색어에 대한 Daum API 요청(7.대중교통 길찾기)
//=========================================
searchControl.prototype.busRoadSearch = function(sx,sy,ex,ey) {
	
	var _searchControl = this;
	
	_searchControl.pageLoding($(".layout_right"));
	
	$.ajax({
        url:"http://apis.daum.net/jejubus/v1/route/search.json",
        method:"GET",
        dataType:"jsonp",
        jsonp:"callback",
        data:{
        	"sx" : sx,
    		"sy" : sy,
    		"ex" : ex,
    		"ey" : ey,
    		"maximumResults" : "10",
    		"inputCoordSystem" : "WTM",
    		"outputCoordSystem" : "WGS84",
    		"appkey" : "d71c493709c29bb2479148b423458c12"
        }, 
        success:function(result) {
        	
        	
        	if(result){
        		$(".text_result").text("검색결과");
            	
            	_searchControl.pageLoding($(".layout_right"),"hide");
                
            	result = new ArrayList(result.routes);
            	
            	_searchControl.roadSearchList = result;
            	
            	_searchControl.startEndSearchResultDetailInfo(result);
        	}
        	
       	
        }
    });
	
	
}

//=========================================
//출도착 검색결과 정류소리스트 생성  
//=========================================
searchControl.prototype.startEndSearchResultDetailInfo = function(result) {

	// search_list 하위요소들 삭제
	$(".search_list").children().remove();
	
	var sb = new StringBuilder();
	
	sb.Append("<div class=\"scroll_wrap scrollbar-outer\">");
	
	for (var i = 0; i < result.size(); ++i) {
		
		var totalTime = result.get(i).time.text;
		var workingTime = result.get(i).walkingTime.text;
		var summaries = new ArrayList(result.get(i).summaries);
		var transform = result.get(i).transfers;
		
		
		sb.Append("<div class=\"detail_wrap\">");
			//Top
			sb.Append("<div class=\"part_top\">");
				sb.Append("<p class=\"text_wrap\">");
					sb.Append("<span class=\"first\">"+totalTime+"</span>");   
				sb.Append("</p>");
				sb.Append("<p class=\"text_wrap\">");
					sb.Append("<span class=\"fifth\"> (도보 "+workingTime+", 환승 "+transform+"회)</span>");   
				sb.Append("</p>");
//				sb.Append("<a class=\"point close\" href=\"#\"></a>");
				/*IE8 웹호환성 관련 소스 수정[START]*/
				sb.Append("<a class=\"point close\" href=\"#\">");
				sb.Append("<img class=\"img_pnt_ctrl\" style=\"display:block;width:30px;height:30px;border:0px;\" src=\"" + contextPath + "/resources/images//btn_station_open.png\"/>");
				sb.Append("</a>");
				/*IE8 웹호환성 관련 소스 수정[END]*/
				
			sb.Append("</div>");
			
			//bottom
			sb.Append("<div class=\"part_contents\">");
			
			for (var k = 0; k < summaries.size(); ++k) {
				
				var statStationInfo = summaries.get(k).startLocation.name;
				var endStationInfo = summaries.get(k).endLocation.name;
				var busInfo = (summaries.get(k).infomation).split("(")[0];
				
				if(k==0){
					//출발 
					sb.Append("<div class=\"point_cell\">");
						sb.Append("<img class=\"image_icon\" src=\"" + contextPath + "/resources/images/img_bus_ico_basic.png\">");
						sb.Append("<span class=\"text_sttn\">"+statStationInfo+" 승차"+"</span>");
						sb.Append(" <span class=\"text_rute color_line\">"+busInfo+"</span>");
						sb.Append("<div class=\"line_bot bg_color_end2\"></div>");
					sb.Append("</div>");
					
				}else{
					
					//환승 
					sb.Append("<div class=\"point_cell\">");
						sb.Append("<div class=\"line_top bg_color_end2\"></div>");	
						sb.Append("<img class=\"image_icon\" src=\"" + contextPath + "/resources/images/img_bus_ico_basic.png\">");
						sb.Append("<span class=\"text_sttn\">"+statStationInfo+" 환승"+"</span>");
						sb.Append(" <span class=\"text_rute color_line\">"+busInfo+"</span>");
						sb.Append("<div class=\"line_bot bg_color_end2\"></div>");
					sb.Append("</div>");
				}
				
				if(k==summaries.size()-1){
					// 도착
					sb.Append("<div class=\"point_cell\">");
						sb.Append("<div class=\"line_top bg_color_end2\"></div>");
						sb.Append("<div class=\"end_circle bg_color_end2\"></div>");
						sb.Append("<span class=\"text_sttn\">"+endStationInfo+" 하차"+"</span>");
						
					sb.Append("</div>");
				}
				
			}
			
			
			sb.Append("</div>");
		sb.Append("</div>");
	}
	
	sb.Append("</div>");
	
	$(".search_list").append(sb.ToString());
	
	//스크롤바 적용
	$('.scrollbar-outer').scrollbar();
}

//=========================================
//출도착 검색어에 대한 대중교통 길 찾기 목록 생성
//=========================================
searchControl.prototype.detailRoadContentslist = function(selectElemet, roadSearchResult) {
	
	selectElemet.find(".part_contents").hide();
	selectElemet.find(".part_info").remove();
	
	
	var sb = new StringBuilder();
	
	var summaries = new ArrayList(roadSearchResult.summaries);
	var totalDistance = roadSearchResult.distance.text;
	var steps = new ArrayList(roadSearchResult.steps);
	
	sb.Append("<div class=\"part_info\">");
    
	// 요금정보 
	sb.Append("<span class=\"add_dess\">요금정보 없음 : 총 "+totalDistance+"</span>");
    
	// 출발 타이틀설정
	sb.Append(this.detailRoadContentsSetTitle("start", summaries));
    
	// Step 설정
	sb.Append(this.detailRoadContentsSetStep(steps));
   
	//도착 타이틀설정
	sb.Append(this.detailRoadContentsSetTitle("end", summaries));;
	
	sb.Append("</div>");
	
	selectElemet.append(sb.ToString());
	
	
}

//=========================================
//대중교통 길 찾기 타이틀설정 
//=========================================
searchControl.prototype.detailRoadContentsSetTitle = function(type,summaries) {
	
	var sb = new StringBuilder();
	
	sb.Append("<div class=\"part_cmm\">");
	
	if(type == "start"){
		var startStation = summaries.get(0).startLocation.name;

		sb.Append("<img class=\"image_first\" src=\"" + contextPath + "/resources/images/img_point_result_start.png\">");
		sb.Append("<span class=\"second_wrap\">");
			sb.Append("<span class=\"stts_tit\">"+startStation+"</span>");
		sb.Append("</span>");

		
	}else{
		var endStation = summaries.get(summaries.size() - 1).endLocation.name;
		
		sb.Append("<img class=\"image_first\" src=\"" + contextPath + "/resources/images/img_point_result_end.png\">");
		sb.Append("<span class=\"second_wrap\">");
			sb.Append("<span class=\"stts_tit\">"+endStation+"</span>");
		sb.Append("</span>");
		
	}
	
	sb.Append("</div>");
	    
	return sb.ToString();
}

//=========================================
//대중교통 길 찾기 방법 표시 
//=========================================
searchControl.prototype.detailRoadContentsSetStep = function(steps) {

	var imgSrc = contextPath + "/resources/images/img_bus_ico_local.png";
	var lineColor = "color_etc";
	
	var sb = new StringBuilder();
	
	sb.Append("<div class=\"part_list\">");
	
	for (var i = 0; i < steps.size(); ++i) {
		
		var type = steps.get(i).type ? steps.get(i).type : "";
		var action = steps.get(i).action;
		var distance = new ArrayList(steps.get(i).distance);
		var time = new ArrayList(steps.get(i).time);
		var infomation = steps.get(i).information;
		var nodes = new ArrayList(steps.get(i).nodes);
		var vehicles = new ArrayList(steps.get(i).vehicles);
		var busColor;
		var startlocation =new ArrayList(steps.get(i).startLocation);
		var endlocation =new ArrayList(steps.get(i).endLocation);
		
		
		sb.Append("<div class=\"cell_type\">");
		
		if(type == "WALKING"){
		
			sb.Append("<div class=\"left_wrap\">");
			
				sb.Append("<div class=\"walk_wrap\">");
				sb.Append("<img class=\"img_walk\" src=\"" + contextPath +"/resources/images/img_point_walk.png\">");
				sb.Append("</div>");
    
			sb.Append("</div>");
    
	        sb.Append("<div class=\"right_wrap\">");
	        	sb.Append("<div class=\"area_text\">");
	        	
	        	
	        	if(infomation.indexOf("null") != -1){
	        		infomation = "도착지점까지 도보로 이동"
	        	}
	        	
	        	sb.Append("<p class=\"one\">"+infomation+"</p>");
	        	sb.Append("<p class=\"three\">도보로 이동 "+time["buffer"].text+" | "+distance["buffer"].text+"</p>");
	        	sb.Append("</div>");
	        sb.Append("</div>");
			
		}else if(type == "BUS"){
			
			sb.Append("<div class=\"left_wrap\">");
			
				if(action != "GETOFF"){
					if(vehicles.get(0).subTypeName == "지선"){
						imgSrc = contextPath + "/resources/images/img_bus_ico_local.png";
						lineColor = "color_local";
					}else if(vehicles.get(0).subTypeName == "간선"){
						imgSrc = contextPath + "/resources/images/img_bus_ico_global.png";
						lineColor = "color_global";
					}else if(vehicles.get(0).subTypeName == "급행"){
						imgSrc = contextPath + "/resources/images/img_bus_ico_fast.png";
						lineColor = "color_fast";
					}else{
						imgSrc = contextPath + "/resources/images/img_bus_ico_tour.png";
						lineColor = "color_etc";
					}
				}
				
				sb.Append("<img class=\"image_bus_cell\" src=\""+imgSrc+"\">");
			
			sb.Append("</div>");
        
			sb.Append("<div class=\"right_wrap\">");
				sb.Append("<div class=\"area_text\">");
				
					var stationName, pointX, pointY;
					
					if(action == "GETON" || action == "TRANSFER"){
						stationName = startlocation["buffer"].name;
						pointX = startlocation["buffer"].x;
						pointY = startlocation["buffer"].y;
					}else{
						stationName = endlocation["buffer"].name;
						pointX = endlocation["buffer"].x;
						pointY = endlocation["buffer"].y;
					}
				
					sb.Append("<p class=\"one\" onclick=\"startEndResultClickStation('"+stationName+"','"+pointX+"','"+pointY+"');\" style=\"cursor:pointer;\" onmouseout=\"this.style.textDecoration='none'\" onmouseover=\"this.style.textDecoration='underline'\">"+infomation+"</p>");
					sb.Append("<p class=\"two\">");
					
					for (var j = 0; j < vehicles.size(); ++j) {
						
						if(vehicles.get(j).subTypeName == "지선"){
							busColor = "color_local";
						}else if(vehicles.get(j).subTypeName == "간선"){
							busColor = "color_global";
						}else if(vehicles.get(j).subTypeName == "급행"){
							busColor = "color_fast";
						}else{
							busColor = "color_etc";
						}
						
						if(vehicles.get(j).subTypeName != "일반"){

							sb.Append("<a class=\""+busColor+"\" href=\"javascript:window.open('"+contextPath +"/search/line?searchText="+vehicles.get(j).name1+"','_self');\" style=\"cursor:pointer;\" onmouseout=\"this.style.textDecoration='none'\" onmouseover=\"this.style.textDecoration='underline'\">["+vehicles.get(j).subTypeName+" "+vehicles.get(j).name1+"]</a>");

						}
						
					}
						
                    sb.Append("</p>");
                    
                    if(action != "GETOFF"){
                    	sb.Append("<p class=\"three\" href=\"#\">"+nodes.size()+"개 정류장 이동("+time["buffer"].text+")</p>");
                    }
                    
                    
				sb.Append("</div>");
			sb.Append("</div>");
			
		}
		
		// 라인그리기
		
		if(i==1){
			if(type == "BUS"){
				sb.Append("<div class=\"long_line_top bg_color_none\"></div>");
				sb.Append("<div class=\"long_line_bot bg_"+lineColor+"\"></div>");
			}else if(type == "WALKING"){
				sb.Append("<div class=\"long_line_top bg_color_none\"></div>");
				sb.Append("<div class=\"long_line_bot border_dash\"></div>");
			}
			
		}else if(i>1 && i<steps.size()-2){
			
			var prvType = steps.get(i-1).type;
			
			if(prvType == "BUS"){
				
				if(type == "WALKING"){
					
					sb.Append("<div class=\"long_line_top border_dash\"></div>");
					
				}else{
					sb.Append("<div class=\"long_line_top bg_"+lineColor+"\"></div>");
				}
				
				
			}else if (prvType == "WALKING"){
				
				sb.Append("<div class=\"long_line_top border_dash\"></div>");
			}
			
			if(type == "BUS"){
				
				if(steps.get(i+1).type == "WALKING"){
					sb.Append("<div class=\"long_line_bot border_dash\"></div>");
				}else{
					sb.Append("<div class=\"long_line_bot bg_"+lineColor+"\"></div>");
				}
				
			}else if(type == "WALKING"){
				
				sb.Append("<div class=\"long_line_bot border_dash\"></div>");
			}
			
		}else if(i==steps.size()-2){
			var prvType = steps.get(i-1).type;
			
			if(prvType == "BUS"){
				
				if(type == "WALKING"){
					
					sb.Append("<div class=\"long_line_top border_dash\"></div>");
					
				}else{
					sb.Append("<div class=\"long_line_top bg_"+lineColor+"\"></div>");
				}
				
				
			}else if (prvType == "WALKING"){
				
				sb.Append("<div class=\"long_line_top border_dash\"></div>");
			}
		}

		sb.Append("</div>");
	
	}
	
	sb.Append("</div>");
	
	return sb.ToString();
}

//=========================================
//출도착 결과목록에서 정류장 클릭시 발생
//=========================================
function startEndResultClickStation(stationNm, pointX, pointY) {
	
	stationNm = encodeURI(encodeURIComponent(stationNm));
	
	window.open(contextPath +"/search/station?searchText="+stationNm,"_self");

}

//=========================================
//출도착 검색어에 대한 대중교통 길 찾기 목록 생성
//=========================================
searchControl.prototype.detailRoadSearch = function(roadSearchResult) {
	var _searchControl = this;
	
	_searchControl.pageLoding($("#map"));
	
	var linkInfo = new ArrayList(roadSearchResult.steps);
	
	var xycode = new ArrayList();
	
	//
	
	for (var i = 0; i < linkInfo.size(); ++i) {
		
		var type = linkInfo.get(i).type;
		var action = linkInfo.get(i).action;
		
		var path = linkInfo.get(i).polyline;
		
		var linePath = "";
		
		if(type == "WALKING"){
			
			linePath = path.split("|");
			for(var j = 0; j<linePath.length; ++j){
				if(j%2 != 0){
					var latLng = new daum.maps.LatLng(linePath[j], linePath[j-1]);

					xycode.add(latLng);
				}
			}
		}else if(type == "BUS" && (action == "GETON" || action == "TRANSFER")){
			
			linePath = path.split("|");
			for(var j = 0; j<linePath.length; ++j){
				if(j%2 != 0){
					var latLng = new daum.maps.LatLng(linePath[j], linePath[j-1]);

					xycode.add(latLng);
				}
			}
		}
	}

	_searchControl.daumMapApi.drawLine(xycode.toArray());

	_searchControl.pageLoding($("#map"),"hide");
}