/**
 * serch.js
 */

var busInterval = null;
var SelRoute = "";
var PATH_ARR = [];
var END_AHEAD;

$(document).ready(function() {
	
	setEvent();

	$(".place_result_wrap").hide();
	
	if(isPcConnected() == true)	{
		$("#map_wrap").width($(".map_conten").width());
		$("#map_wrap").height($(".map_conten").height());
		createMap("map_wrap", inquiryOverlay); 
		
		$(".nolist").show();
		$(".searchnone").hide();
	}else {
		$("#btn_print").hide();
		var wW = $(window).width();
		var wH = $(window).height();
		
		$("#map_wrap").width(wW - 1);
		$("#map_wrap").height(wH - 60 - 25 - 332);
		createMap("map_wrap", inquiryOverlay); 
		oMap.setSize(new naver.maps.Size(wW, (wH - 62 - 25 - 332)));
		//TODO
	}
});

/************************
 * map overlay 조회
 ************************/
function inquiryOverlay(zoom, bound) {
	
	if(zoom < SHOW_LEVEL) {
		if($("#btn_surr_bus").hasClass("click")) {
			$(this).removeClass("click");
		}
		hideOverlay();
	}else {
		if(VIA_STOP_ARRAY != null && VIA_STOP_ARRAY.length > 0) {
			for(var i=0; i < VIA_STOP_ARRAY.length; i++) {
				VIA_STOP_ARRAY[i].setMap(oMap);
			}
		}
		if($("#btn_surr_bus").hasClass("click")) {
			var params = {
					minLat : bound.getSW().lat(),
					maxLat : bound.getNE().lat(),
					minLng : bound.getSW().lng(),
					maxLng : bound.getNE().lng()
			}
			ajaxCall("../inq/selectMapStopList.do", params, null, onSuccessStop, null);
		}
	}
	
	function onSuccessStop(data) {
		if(data && data.resultList) {
			drawStopMarkers(data.resultList, true);
		}
	}
}

function setEvent() {
	/** 통합 검색 */
	$("#input_total_search").keydown(function(event) {
		if(event.keyCode == 13) {
			$("#btn_total_search").trigger("click");
		}
	});
	
	$("#btn_total_search").click(function() {
		var searchWord = $("#input_total_search").val();
		if($.trim(searchWord) == "") {
			showAlert("검색어를 입력하세요.");
			return;
		}
		reqSearchList();
	});
	
	/** 메인에서 입력된 검색어가 전달된 경우 */
	if(searchWord != null && searchWord != "") {
		$("#input_total_search").val(searchWord);
		searchWord = "";
		$("#btn_total_search").trigger("click");
	}
	
	/* 버스 정류 선택  */
	$("#check_routetp input").change(function() {
		var routetp = $(this).attr("id");
		if($(this).is(":checked") == true) {
			$("#route_list").find(".tp"+routetp).show();
		}else {
			$("#route_list").find(".tp"+routetp).hide();
		}
	});
	
	/** 통합검색 버스 탭 */
	$(".list1_t .bus").click(function(){
		clearOverlay();
		$('.bus').addClass('click');
        $('.stop').removeClass('click'); 
        $('.place').removeClass('click');
        $('.bus_box').show();
        $('.busstop_box').hide();
        $('.place_box').hide();
	});	
	
	/** 통합검색 정류소 탭 */
	$(".list1_t .stop").click(function(){
		clearOverlay();
		$('.stop').addClass('click');
        $('.bus').removeClass('click'); 
        $('.place').removeClass('click');
        $('.bus_box').hide();
		$('.busstop_box').show();
		$('.place_box').hide();
		if(busInterval) {
			clearInterval(busInterval);
			busInterval = null;
		}
	});
	
	/** 통합검색 지역 탭 */
	$(".list1_t .place").click(function(){
		clearOverlay();
		$('.stop').removeClass('click');
        $('.bus').removeClass('click'); 
        $('.place').addClass('click');
      
        $('.bus_box').hide();
		$('.busstop_box').hide();
		$('.place_box').show();
		if(busInterval) {
			clearInterval(busInterval);
			busInterval = null;
		}
	});
	
	/*모바일 지도 보기*/  
	$(".btn_map").click(function(){
		$('.map').show();
		var wW = $('.map').width();
		var wH = $('.map').height();
		oMap.setSize(new naver.maps.Size(wW, (wH - 25 - 32)));
		oMap.refresh();
	});	
	$(".btn_list").click(function(){
		$("#m_routetp2").show();
        $('.map').hide();
	});
	
	/** 주변버스 보기 */
	$("#btn_surr_bus").click(function() {
		if($(this).hasClass("click")==true) {
			$(this).removeClass("click");
			hideOverlay();
		}else {
			$(this).addClass("click");
			if(oMap.getZoom() < SHOW_LEVEL) oMap.setZoom(SHOW_LEVEL);
			naver.maps.Event.trigger(oMap, 'bounds_changed');
		}
	});
	
	/** 버스 종류 보기 */
	$("#btn_bus_type li").click(function() {
		var showType = $(this).attr("data-value");
		if($(this).hasClass("click")==true && showType != "ALL") {
			/*$(this).hasClass("click")
			.*/
			return false;
		}else if($(this).hasClass("click")==true && showType == "ALL") {
			$("#btn_bus_type li").removeClass("click");
			showBusMarker("NULL");
		}else {
			$("#btn_bus_type li").removeClass("click");
			$(this).addClass("click");
			showBusMarker(showType);
		}
//		btn_bus_type
	});
	
	//노선 상세 회차지, 출발지
	$("#btn_ahead li").click(function() {
		var cls = $(this).attr("class");
		if(cls == "moveBtn_up") {
			$(".detail_con").scrollTop(0);
		}else {
			$(".detail_con").scrollTop(END_AHEAD.top);
		}
	});
	
	//노선상세 갱신 주기 
	$("#select_bus_loc_interval").change(function() {
		reLoadBusLoc();
	});
	
	/** 지도 프린트 */
	$("#btn_print").click(function() {
		$(".map_conten").printThis();
	});
}

/*****************
 * 통합 검색 결과 요청
 ****************/
function reqSearchList() {
	var param = {
			searchWord : $("#input_total_search").val(),
			routeid : ROUTEID
	};
	ajaxCall("../inq/selectRouteSearchList.do", param, null, successFunc1, null);
	ajaxCall("../inq/selectStopSearchList.do", {searchWord : $("#input_total_search").val()}, null, successFunc2, null);
	ajaxCall("../inq/selectPlaceList.do", {searchWord : $("#input_total_search").val()}, null, successFunc3, null);

	clearOverlay();

	function successFunc1(data) {
		$(".nolist1").hide();
		$("#txt_routeCnt").text(data.routeList != null ? data.routeList.length : 0);
		
		var strTemp = "";
		
		$("#route_list").empty();
		/**
		 * case 1:  //간선
		 * case 2:  //지선 마을
		 * case 3:  //급행
		 * case 4:  //광역
		 * case 5:  //공항
		 */
		if(data.routeList && data.routeList.length > 0) {
			$("#route_none").hide();
			$(".route_result_wrap").show();
			$.each(data.routeList, function(index, value) {
				switch (parseInt(value.routetpcd)) {
					case 1:
					case 9:
						strTemp += "<li id='"+value.routeid+"' class='tp2'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_nml'>지선</span>";
						break;
					case 2:
						strTemp += "<li id='"+value.routeid+"' class='tp1'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_ex'>간선</span>";
						break;
					case 4: //좌석형
						strTemp += "<li id='"+value.routeid+"' class='tp3'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_in'>광역</span>";
						break;
					case 5:
						strTemp += "<li id='"+value.routeid+"' class='tp3'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_in'>공항</span>";
						break;
					case 6:
						strTemp += "<li id='"+value.routeid+"' class='tp2'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_nml'>마을</span>";
						break;
					case 8:
						strTemp += "<li id='"+value.routeid+"' class='tp3'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_in'>급행</span>";
						break;
					case 3:
						strTemp += "<li id='"+value.routeid+"' class='tp4'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_town'>좌석</span>";
						break;
					case 10:
						strTemp += "<li id='"+value.routeid+"' class='tp4'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_town'>좌석</span>";
						break;
				}
				
//				-- 1: 지선형           녹색
//				-- 9: 지선(순환) 녹색
//				-- 2: 간선형          파랑색
//				-- 3: 좌석형          회색
//				-- 4: 광역형          빨강
//				-- 5: 리무진         갈색
//				-- 8: 급행간선       빨강
				
				strTemp += "<span class='nomber'>"+value.routeno+"</span>";
				strTemp += "<span class='btn_name'>노선상세</span></a>";
				
				strTemp += "<input type='hidden' id='originbstopkr' value='"+value.originbstopkr+"'>"; //기점
				strTemp += "<input type='hidden' id='destbstopkr' value='"+value.destbstopkr+"'>";     //종점
			
				strTemp += "<input type='hidden' id='first_tm' value='"+value.first_tm+"'>";     //첫차
				strTemp += "<input type='hidden' id='last_tm' value='"+value.last_tm+"'>";       //막차
				strTemp += "<input type='hidden' id='first_tm_sat' value='"+value.first_tm_sat+"'>";     //첫차
				strTemp += "<input type='hidden' id='last_tm_sat' value='"+value.last_tm_sat+"'>";       //막차
				strTemp += "<input type='hidden' id='first_tm_holi' value='"+value.first_tm_holi+"'>";     //첫차
				strTemp += "<input type='hidden' id='last_tm_holi' value='"+value.last_tm_holi+"'>";       //막차
				
				strTemp += "<input type='hidden' id='turn_first_tm' value='"+value.turn_first_tm+"'>";     //첫차
				strTemp += "<input type='hidden' id='turn_last_tm' value='"+value.turn_last_tm+"'>";       //막차
				strTemp += "<input type='hidden' id='turn_first_tm_sat' value='"+value.turn_first_tm_sat+"'>";     //첫차
				strTemp += "<input type='hidden' id='turn_last_tm_sat' value='"+value.turn_last_tm_sat+"'>";       //막차
				strTemp += "<input type='hidden' id='turn_first_tm_holi' value='"+value.turn_first_tm_holi+"'>";     //첫차
				strTemp += "<input type='hidden' id='turn_last_tm_holi' value='"+value.turn_last_tm_holi+"'>";       //막차
				
				strTemp += "<input type='hidden' id='day_busdispt' value='"+value.day_busdispt+"'>";   //배차간격
				strTemp += "<input type='hidden' id='satday_busdispt' value='"+value.satday_busdispt+"'>";   //배차간격
				strTemp += "<input type='hidden' id='holiyday_busdispt' value='"+value.holiyday_busdispt+"'>";   //배차간격
				
				strTemp += "<input type='hidden' id='compnm' value='"+value.compnm+"'>";   //운수사
				strTemp += "<input type='hidden' id='telephone' value='"+value.telephone+"'>";   //전화번호
				strTemp += "</li>";
				
			});
			$("#route_list").append(strTemp);
			$("#check_routetp input").trigger("change");
		
			/*노선보기*/
			$("#route_list li").click(function(){
				$("#btn_surr_bus").removeClass("click");
				SelRoute = $(this).attr("id");
				
				if(busInterval) {
					clearInterval(busInterval);
					busInterval = null;
				}
				$("#txt_origin").text($(this).find("#originbstopkr").val());
				$("#txt_dest").text($(this).find("#destbstopkr").val());
				if($(this).find("#first_tm").val() == "-") {
					$("#first_last").text("정보없음"); //평일 첫 막차
				}else {
					$("#first_last").text($(this).find("#first_tm").val()+"~"+$(this).find("#last_tm").val()); //평일 첫 막차
				}
				
				if($(this).find("#first_tm_holi").val() == "-") {
					$("#first_last_holi").text("정보없음"); //평일 첫 막차
				}else {
					$("#first_last_holi").text($(this).find("#first_tm_holi").val()+"~"+$(this).find("#last_tm_holi").val()); //주말 첫 막차
				}
				
				if($(this).find("#turn_first_tm").val() == "-") {
					$("#turn_first_last").text("정보없음"); //평일 첫 막차
				}else {
					$("#turn_first_last").text($(this).find("#turn_first_tm").val()+"~"+$(this).find("#turn_last_tm").val()); //평일 첫 막차
				}
				
				if($(this).find("#turn_first_tm_holi").val() == "-") {
					$("#turn_first_last_holi").text("정보없음"); //평일 첫 막차
				}else {
					$("#turn_first_last_holi").text($(this).find("#turn_first_tm_holi").val()+"~"+$(this).find("#turn_last_tm_holi").val()); //주말 첫 막차
				}
				
				
				$("#txt_delay").text("평일 " +$(this).find("#day_busdispt").val()+"분 / 주말 " +$(this).find("#holiyday_busdispt").val()+"분");
//				$("#txt_comp_info").html(setCompInfo($(this).find("#compnm").val(),$(this).find("#telephone").val()));
				//XXX
				setCompInfo($(this).find("#compnm").val(),$(this).find("#telephone").val());
				inqRouteDetailInfo(SelRoute, true);
				
			});	
			$(".nosun_close").click(function(){
				$("#route_detail_wrap").hide();
				$("#m_list_wrap").empty();
				clearOverlay();
				$(".info_close").attr("title","정보닫기").text("정보닫기");
				$(".open_body").addClass("close_body");
				$(".open_body").removeClass("open_body");
			});
			$(".info_close").unbind().click(function(){
				if($(".close_body").length){
					$(this).attr("title","정보열기").text("정보열기");
					$(".close_body").addClass("open_body");
					$(".close_body").removeClass("close_body");
				}else if($(".open_body").length){
					$(this).attr("title","정보닫기").text("정보닫기");
					$(".open_body").addClass("close_body");
					$(".open_body").removeClass("open_body");
				}
			});
			if(ROUTEID != null && ROUTEID != "") {
				$("#route_list #"+ROUTEID).trigger("click");
				ROUTEID = null;
			}
		}else { //결과 없음
			$("#route_none").find("span").text("'"+$("#input_total_search").val()+"'");
			$("#route_none").show();
			$(".route_result_wrap").hide();
		}
	}
	
	function successFunc2(data) {
		$(".nolist1").hide();
		$("#txt_stopCnt").text(data.stopList != null ? data.stopList.length : 0);
		
		var strTemp = "";
		
		$("#stop_list").empty();
		
		if(data.stopList && data.stopList.length > 0) {
			$("#stop_none").hide();
			$(".stop_result_wrap").show();
			$.each(data.stopList, function(index, value) {
				strTemp += "<li id='"+value.bstopid+"'>";
				strTemp += "<a title='정류장 상세보기' class=''>";
				strTemp += "<p class='stop_name'>"+value.bstopnm+"</p>";
				strTemp += "<p class='stop_num'>["+value.short_bstopid+"]</p>";
				strTemp += "<input type='hidden' id='lat' value='"+value.lat+"'>";
				strTemp += "<input type='hidden' id='lng' value='"+value.lng+"'>";
				strTemp += "<input type='hidden' id='nm' value='"+value.bstopnm+"\n["+value.short_bstopid+"]'>";
				strTemp += "</a></li>";
			});
			$("#stop_list").append(strTemp);
			
			$("#stop_list").find("li").click(function() {
				var lat = $(this).find("#lat").val();
				var lng = $(this).find("#lng").val();
				var stopnm = $(this).find("#nm").val();
				var stopid = $(this).attr("id");
				
				//노선 버스위치 갱신 중지
				if(busInterval) {
					clearInterval(busInterval);
					busInterval = null;
				}
				if(isPcConnected() == true) {
					if(lat == "" || lng == "") {
						showAlert("정류장 위치정보가 없습니다.");
						return;
					}
					drawStop(lat, lng, stopnm, stopid);
				}else {
					moveArrival(stopid);
				}
			});
			
		}else { //결과 없음
			$("#stop_none").find("span").text("'"+$("#input_total_search").val()+"'");
			$("#stop_none").show();
			$(".stop_result_wrap").hide();
		}
	}
	
	function successFunc3(data) {
		$(".nolist1").hide();
		$(".place_result_wrap").show();
		
		$("#place_list").empty();
		var list = JSON.parse(data.result);
		$("#txt_placeCnt").text(list.items.length);
		var strTemp = "";
		
		$.each(list.items, function(index, value) {
			if((value.address).indexOf("인천광역시") != -1 || (value.title).indexOf("인천") != -1) {
				strTemp += "<li>";
				strTemp += "<a title='정류장 상세보기' class=''>";
				strTemp += "<p class='stop_name'>"+value.title+"</p>";
				strTemp += "<p class='stop_num'>"+value.address+"</p>";
				strTemp += "<input type='hidden' id='mapx' value='"+value.mapx+"'>";
				strTemp += "<input type='hidden' id='mapy' value='"+value.mapy+"'>";
				strTemp += "</a></li>";
			}
		});
		
		$.each(list.items, function(index, value) {
			if((value.address).indexOf("인천광역시") == -1 && (value.title).indexOf("인천") == -1) {
				strTemp += "<li>";
				strTemp += "<a title='정류장 상세보기' class=''>";
				strTemp += "<p class='stop_name'>"+value.title+"</p>";
				strTemp += "<p class='stop_num'>"+value.address+"</p>";
				strTemp += "<input type='hidden' id='mapx' value='"+value.mapx+"'>";
				strTemp += "<input type='hidden' id='mapy' value='"+value.mapy+"'>";
				strTemp += "</a></li>";
			}
		});
		$("#place_list").append(strTemp);
		
		$("#place_list li").click(function() {
			getLatLngToAddr($(this).find(".stop_num").text(), $(this).find(".stop_name").text());
			$(".btn_map").trigger("click");
			$("#m_routetp2").hide();
			$("#m_routeno2").text($(this).find(".stop_name").text());
		});
		
		
		/*<li>
		<a href="" title="지역 상세보기" class="">
			<span class="stop_name">동아서안임광10단지아파트</span>
			<span class="stop_num">경기 고양시 일산서구 일산동 1074</span>
		</a>
	</li>*/
	}
	
	/*function successFunc(data) {
		$(".nolist1").hide();
		$("#txt_routeCnt").text(data.routeList != null ? data.routeList.length : 0);
		$("#txt_stopCnt").text(data.stopList != null ? data.stopList.length : 0);
		
		var strTemp = "";
		if(data.routeList.length == 0 && (data.stopList != null && data.stopList.length > 0)) {
			$(".list1_t .stop").trigger("click");
			
		}else if(data.routeList.length > 0 && (data.stopList == null || data.stopList.length == 0)) {
			$(".list1_t .bus").trigger("click");
		}else {
			$(".list1_t .bus").trigger("click");
		}
		
		$("#route_list").empty();
		*//**
		 * case 1:  //간선
		 * case 2:  //지선 마을
		 * case 3:  //급행
		 * case 4:  //광역
		 * case 5:  //공항
		 *//*
		if(data.routeList && data.routeList.length > 0) {
			$("#route_none").hide();
			$(".route_result_wrap").show();
			$.each(data.routeList, function(index, value) {
				switch (parseInt(value.routetpcd)) {
					case 1:
					case 9:
						strTemp += "<li id='"+value.routeid+"' class='tp2'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_nml'>지선</span>";
						break;
					case 2:
						strTemp += "<li id='"+value.routeid+"' class='tp1'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_ex'>간선</span>";
						break;
					case 4: //좌석형
						strTemp += "<li id='"+value.routeid+"' class='tp3'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_in'>광역</span>";
						break;
					case 5:
						strTemp += "<li id='"+value.routeid+"' class='tp3'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_in'>공항</span>";
						break;
					case 6:
						strTemp += "<li id='"+value.routeid+"' class='tp2'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_nml'>마을</span>";
						break;
					case 8:
						strTemp += "<li id='"+value.routeid+"' class='tp3'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_in'>급행</span>";
						break;
					case 3:
						strTemp += "<li id='"+value.routeid+"' class='tp4'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_town'>좌석</span>";
						break;
					case 10:
						strTemp += "<li id='"+value.routeid+"' class='tp4'>";
						strTemp += "<a class='nosun' title='노선상세'><span class='bus_p bus_town'>좌석</span>";
						break;
				}
				
//				-- 1: 지선형           녹색
//				-- 9: 지선(순환) 녹색
//				-- 2: 간선형          파랑색
//				-- 3: 좌석형          회색
//				-- 4: 광역형          빨강
//				-- 5: 리무진         갈색
//				-- 8: 급행간선       빨강
				
				strTemp += "<span class='nomber'>"+value.routeno+"</span>";
				strTemp += "<span class='btn_name'>노선상세</span></a>";
				
				strTemp += "<input type='hidden' id='originbstopkr' value='"+value.originbstopkr+"'>"; //기점
				strTemp += "<input type='hidden' id='destbstopkr' value='"+value.destbstopkr+"'>";     //종점
				strTemp += "<input type='hidden' id='upfirsttime' value='"+value.upfirsttime+"'>";     //상행 첫차
				strTemp += "<input type='hidden' id='uplasttime' value='"+value.uplasttime+"'>";       //상행 막차
				strTemp += "<input type='hidden' id='downfirsttime' value='"+value.downfirsttime+"'>"; //하행 첫차
				strTemp += "<input type='hidden' id='downlasttime' value='"+value.downlasttime+"'>";   //하행 막차
				strTemp += "<input type='hidden' id='period' value='"+value.period+"'>";   //배차간격
				strTemp += "<input type='hidden' id='compnm' value='"+value.compnm+"'>";   //운수사
				strTemp += "<input type='hidden' id='telephone' value='"+value.telephone+"'>";   //전화번호
				strTemp += "</li>";
			});
			$("#route_list").append(strTemp);
			$("#check_routetp input").trigger("change");
		
			노선보기
			$("#route_list li").click(function(){
				$("#btn_surr_bus").removeClass("click");
				SelRoute = $(this).attr("id");
				
				if(busInterval) {
					clearInterval(busInterval);
					busInterval = null;
				}
				inqRouteDetailInfo(SelRoute, true);
			});	
			$(".nosun_close").click(function(){
				$("#route_detail_wrap").hide();
				$("#m_list_wrap").empty();
				clearOverlay();
			});
			if(ROUTEID != null && ROUTEID != "") {
				$("#route_list #"+ROUTEID).trigger("click");
				ROUTEID = null;
			}
		}else { //결과 없음
			$("#route_none").find("span").text("'"+$("#input_total_search").val()+"'");
			$("#route_none").show();
			$(".route_result_wrap").hide();
		}
		
		*//**
		 * 정류장 결과
		 *//*
		strTemp = "";
		$("#stop_list").empty();
		if(data.stopList && data.stopList.length > 0) {
			$("#stop_none").hide();
			$(".stop_result_wrap").show();
			$.each(data.stopList, function(index, value) {
				strTemp += "<li id='"+value.bstopid+"'>";
				strTemp += "<a title='정류장 상세보기' class=''>";
				strTemp += "<p class='stop_name'>"+value.bstopnm+"</p>";
				strTemp += "<p class='stop_num'>["+value.short_bstopid+"]</p>";
				strTemp += "<input type='hidden' id='lat' value='"+value.lat+"'>";
				strTemp += "<input type='hidden' id='lng' value='"+value.lng+"'>";
				strTemp += "<input type='hidden' id='nm' value='"+value.bstopnm+"\n["+value.short_bstopid+"]'>";
				strTemp += "</a></li>";
			});
			$("#stop_list").append(strTemp);
			
			$("#stop_list").find("li").click(function() {
				var lat = $(this).find("#lat").val();
				var lng = $(this).find("#lng").val();
				var stopnm = $(this).find("#nm").val();
				var stopid = $(this).attr("id");
				
				//노선 버스위치 갱신 중지
				if(busInterval) {
					clearInterval(busInterval);
					busInterval = null;
				}
				if(isPcConnected() == true) {
					if(lat == "" || lng == "") {
						showAlert("정류장 위치정보가 없습니다.");
						return;
					}
					drawStop(lat, lng, stopnm, stopid);
				}else {
					alert("모바일 도착정보 페이지 이동.");
//					moveArrival(stopid);
				}
			});
			
		}else { //결과 없음
			$("#stop_none").find("span").text("'"+$("#input_total_search").val()+"'");
			$("#stop_none").show();
			$(".stop_result_wrap").hide();
		}
	}*/
}

/*******************
 * 모바일 도착정보 페이지 이동
 *******************/
function moveArrival(stopid) {
	$("#arrival").remove();
	var form = document.createElement("form");
	form.setAttribute("id", "arrival");
	form.setAttribute("method", "post");
	form.setAttribute("action", "../bis/arrival.view");
	
	var hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "stopid");
	hiddenField.setAttribute("value", stopid);
	form.appendChild(hiddenField);
	
	var m_routeno = $("#m_routeno").text();
	
	hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "m_routeno");
	hiddenField.setAttribute("value", m_routeno);
	form.appendChild(hiddenField);
	
	hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "SelRoute");
	hiddenField.setAttribute("value", SelRoute);
	
	form.appendChild(hiddenField);
	document.body.appendChild(form);

	form.submit();
}


function setCompInfo(name, tel) {
	
	$(".comp_info").text("");
	
	var names = name.split(",");
	var tels = tel.split(",");
	
	//20201116 추가 (소스 받은 후 기존 유지보수 업체에서 변경하여 추가함)
	if(names.length == 1) {
		$("#txt_comp_info0").attr("colspan", "2");
		$("#txt_comp_info1").hide();
	}else {
		$("#txt_comp_info0").attr("colspan", "1");
		$("#txt_comp_info1").show();
	}
	//------------------------------------------------
	
	for(var i=0; i < names.length; i++) {
		var info = "";
		if(tels[i] == "") {
			info = names[i] +"(정보없음)";
		}else {
			info = names[i] +"("+tels[i]+")";
		}
		$("#txt_comp_info"+i).text(info);
		$("#txt_comp_info"+i).attr("title", info);
	}
}



/****************
 * 노선 상세 정보 요청
 * @param id
 * @param isPc
 ***************/
function inqRouteDetailInfo(id, isPc) {
	
	ajaxCall("../inq/selectRouteDetailInfo.do", {routeid: id, isPc: isPc}, null, successDetail, null);
	
	function successDetail(data) {
		$("#route_detail_wrap").show();
		clearOverlay();
		drawViaStopList(data); //목록
		drawRoutePolyline(data.vertexList);
		drawStopMarkers(data.viaStopList, false);
	}
}

/***************************
 * 노선 경유 정류장 목록 표출 
 **************************/
function drawViaStopList(data) {
	
	var aHead = data.viaStopList[0];
	
	switch (parseInt(aHead.routetpcd)) {
		case 1:
		case 9:
			$("#m_routetp").removeClass().addClass("bus_nml");
			$("#m_routetp").text("지선");
			$("#m_routetp2").removeClass().addClass("bus_nml");
			$("#m_routetp2").text("지선");
			break;
		case 6:
			$("#m_routetp").removeClass().addClass("bus_nml");
			$("#m_routetp").text("마을");
			$("#m_routetp2").removeClass().addClass("bus_nml");
			$("#m_routetp2").text("마을");
			break;
		case 2:
			$("#m_routetp").removeClass().addClass("bus_ex");
			$("#m_routetp").text("간선");
			$("#m_routetp2").removeClass().addClass("bus_ex");
			$("#m_routetp2").text("간선");
			break;
		case 4: //좌석형
			$("#m_routetp").removeClass().addClass("bus_in");
			$("#m_routetp").text("광역");
			$("#m_routetp2").removeClass().addClass("bus_in");
			$("#m_routetp2").text("광역");
			break;
		case 5:
			$("#m_routetp").removeClass().addClass("bus_in");
			$("#m_routetp").text("공항");
			$("#m_routetp2").removeClass().addClass("bus_in");
			$("#m_routetp2").text("공항");
			break;
		case 8:
			$("#m_routetp").removeClass().addClass("bus_in");
			$("#m_routetp").text("급행");
			$("#m_routetp2").removeClass().addClass("bus_in");
			$("#m_routetp2").text("급행");
			break;
		case 3:
			$("#m_routetp").removeClass().addClass("bus_town");
			$("#m_routetp").text("좌석");
			$("#m_routetp2").removeClass().addClass("bus_town");
			$("#m_routetp2").text("좌석");
			break;
		case 10:
			$("#m_routetp").removeClass().addClass("bus_town");
			$("#m_routetp").text("좌석");
			$("#m_routetp2").removeClass().addClass("bus_town");
			$("#m_routetp2").text("좌석");
			break;
	}
	
	$("#m_routeno").text(aHead.routeno); //노선 번호
	$("#m_routeno2").text(aHead.routeno); 
	
	$("#txt_drv_cnt").text("");
	
	$("#txt_Sdir").text(aHead.s_dir);
	$("#txt_Sdir").parent("a").attr("title", aHead.s_dir);
	$("#txt_Edir").text(aHead.e_dir);
	$("#txt_Edir").parent("a").attr("title", aHead.e_dir);
	
	if(aHead.dircd != 0 && aHead.dircd != 1) {
		$(".moveBtn_up").css("width", "100%");
		$(".moveBtn_down").hide();
	} else {
		$(".moveBtn_up").css("width", "50%");
		$(".moveBtn_down").show();
	}
	
	$("#m_list_wrap").empty();
	$(".detail_con").scrollTop(0);
	
	PATH_ARR = [];
	var strTemp = "";
	
	$.each(data.viaStopList, function(index, value) {
		PATH_ARR.push(value.pathseq);
		var clss;
		var nextDir, curDir;
		try {
			nextDir = data.viaStopList[index+1].dircd;
		} catch (e) {
			nextDir = value.dircd;
		}
		curDir = value.dircd;
		
		if(curDir == 0) {
			if(index == 0) {
				clss = "start_blue";
			}else if(nextDir == 1){
				clss = "blue_turn";
			}else {
				clss = "line_blue";
			}
		}else if(curDir == 1) {
			if(index == (data.viaStopList.length-1)) {
				clss = "last_red";
			}else {
				clss = "line_red";
			}
		}else if(curDir == 2) {
			if(index == 0) {
				clss = "start_blue";
			}else if(index == (data.viaStopList.length-1)) {
				clss = "last_blue";
			}else {
				clss = "line_blue";
			}
		} 
		strTemp += "<li id='"+value.bstopid+"' class='"+value.pathseq+"'>";
		strTemp += "<p class='name'>"+value.nodenm+"<span>["+value.short_bstopid+"]</span></p>";
		strTemp += "<div class='"+clss+"'></div>";
		strTemp += "<input type='hidden' id='lat' value='"+value.lat+"'>";
		strTemp += "<input type='hidden' id='lng' value='"+value.lng+"'></li>";
	});
	
	$("#m_list_wrap").append(strTemp);
	
	$("#m_list_wrap li").click(function() {
		var id = $(this).attr("id");
	
		if(isPcConnected() == true) {
			var lat = $(this).find("#lat").val();
			var lng = $(this).find("#lng").val();
			setCenterPosition(lat, lng);
			
			clickTriggerStopMarker(id);
		}else {
			moveArrival(id);
		}
	});
	
	//방면 버튼 선택 시 스크롤 위치 
	END_AHEAD = $("#m_list_wrap li").find(".blue_turn").parent("li").position();
	
	setBusLocation(data);
	reLoadBusLoc();
}

function reLoadBusLoc() {
	if(busInterval) {
		clearInterval(busInterval);
		busInterval = null;
	}
	
	var term = $("#select_bus_loc_interval option:selected").val();
	
	busInterval = setInterval(function(){
		ajaxCall("../inq/selectBusLocList.do", {routeid: SelRoute, isPc: isPcConnected()}, null, setBusLocation, null);
	}, Number(term) * 1000);
}

function setBusLocation(data) {

	//draw bus marker 
	$("#txt_drv_cnt").text(data.busLocList.length);
	drawBusMarkers(data.busLocList);
	
	$("#m_list_wrap li div").empty();
	
	$.each(data.busLocList, function(index, value) {
		
		var nearPath = getApproximateValue(value.pathseq);
		
		var $target =  $("#m_list_wrap").find("."+nearPath).find("div");
		var strTemp = "";
		
		if(value.evtsubtpcd == "2") {
			//strTemp += "<p><span>"+(value.carregno).substr(5,4)+"</span></p>";
			strTemp += "<p><span>"+(value.carregno).slice(-4)+"</span></p>";
		}else {
			//strTemp += "<p><span>"+(value.carregno).substr(5,4)+"</span></p>";
			strTemp += "<p><span>"+(value.carregno).slice(-4)+"</span></p>";
		}
		
		if(value.remaind_seat != "" && value.remaind_seat != "255") {
			strTemp += "<span class='seat1'>"+value.remaind_seat+"석</span>";
		}else if(value.congestion != "" && value.congestion != "255") {
			if(value.congestion == "1") {
				strTemp += "<span class='seat1'>여유</span>";
			}else if(value.congestion == "2") {
				strTemp += "<span class='seat2'>보통</span>";
			}else if(value.congestion == "3") {
				strTemp += "<span class='seat3'>혼잡</span>";
			}
		}
		
		if(value.dircd == "0") {
			if(value.lowplateyn == "1") {
				strTemp += "<span class='bus_blue_l'></span>";
    		}else {
    			strTemp += "<span class='bus_blue'></span>";
    		}
		}else if(value.dircd == "1"){
			if(value.lowplateyn == "1") {
				strTemp += "<span class='bus_red_l'></span>";
    		}else {
    			strTemp += "<span class='bus_red'></span>";
    		}
		}else if(value.dircd == "2"){
			if(value.lowplateyn == "1") {
				strTemp += "<span class='bus_green_l'></span>";
    		}else {
    			strTemp += "<span class='bus_green'></span>";
    		}
		}else {
			if(value.lowplateyn == "1") {
				strTemp += "<span class='bus_blue_l'></span>";
    		}else {
    			strTemp += "<span class='bus_blue'></span>";
    		}
		}
		$target.empty().append(strTemp);
	});
}

/********************
 * 버스위치 찾기
 ********************/
function getApproximateValue(val) {

    var nearData = 0;                       // 가까운 값을 저장할 변수
    var min = 100;
    
    for(var i = 0; i < PATH_ARR.length; i++){
    	var compVal = Math.abs(PATH_ARR[i] - val);  // 절대값을 취한다.
    	if(compVal == 0) {
    		nearData = val;
    		break;
    	}
        if(min > compVal){
               min = compVal;
               nearData = PATH_ARR[i];
        }
    }
    return nearData;
} 


function getLatLngToAddr(address, title) {
    naver.maps.Service.geocode({
        query: address
    }, function(status, response) {
        if (status === naver.maps.Service.Status.ERROR) {
            return showAlert('명칭의 위치좌표가 없습니다.');
        }

        if (response.v2.meta.totalCount === 0) {
        	return showAlert('명칭의 위치좌표가 없습니다.');
        }

        var htmlAddresses = [];
        var item = response.v2.addresses[0];
        var point = new naver.maps.Point(item.x, item.y);
        
        drawPlace(item.y, item.x, title);
       /* oMap.setCenter(point);
        
        .
        if (item.roadAddress) {
            htmlAddresses.push('[도로명 주소] ' + item.roadAddress);
        }

        if (item.jibunAddress) {
            htmlAddresses.push('[지번 주소] ' + item.jibunAddress);
        }

        if (item.englishAddress) {
            htmlAddresses.push('[영문명 주소] ' + item.englishAddress);
        }

        infoWindow.setContent([
            '<div style="padding:10px;min-width:200px;line-height:150%;">',
            '<h4 style="margin-top:5px;">검색 주소 : '+ address +'</h4><br />',
            htmlAddresses.join('<br />'),
            '</div>'
        ].join('\n'));

        
        infoWindow.open(map, point);*/
    });
}


function moveRouteDetail(routeno, routeid) {
	$("#moveSearch").remove();
	var form = document.createElement("form");
	form.setAttribute("id", "moveSearch");
	form.setAttribute("method", "post");
	form.setAttribute("action", "../bis/search1.view");
	
	var hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "word");
	hiddenField.setAttribute("value", routeno);
	form.appendChild(hiddenField);
	
	hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "routeid");
	hiddenField.setAttribute("value", routeid);
	form.appendChild(hiddenField);
	
	document.body.appendChild(form);

	form.submit();
}

//버스 예약 팝업창 오픈
function busReservationPop(bstopid){
	var m_routeno = $("#m_routeno").text();
	
	oInfoWindow.close();   //popup close
	
	window.open('reservation.view?bstopid='+bstopid+'&SelRoute='+SelRoute+'&m_routeno='+m_routeno, '버스 예약 서비스', 'width=460px,height=470px,scrollbars=yes')
}

