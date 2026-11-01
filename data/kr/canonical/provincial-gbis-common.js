
		// HashMap 구현
	HashMap = function(){ 
    this.map = new Array(); 
	};
	HashMap.prototype = {   
    put : function(key, value){   
        this.map[key] = value; 
    },   
    get : function(key){   
        return this.map[key]; 
    },   
    getAll : function(){   
        return this.map; 
    },   
    clear : function(){   
        this.map = new Array(); 
    },   
    isEmpty : function(){     
         return (this.map.size() == 0); 
    }, 
    remove : function(key){     
         delete this.map[key]; 
    }, 
    toString : function(){ 
        var temp = ''; 
        for(i in this.map){   
            temp = temp + ',' + i + ':' +  this.map[i]; 
        } 
        temp = temp.replace(',',''); 
          return temp; 
    }, 
    keySet : function(){   
        var keys = new Array();   
        for(i in this.map){   
            keys.push(i); 
        }   
        return keys; 
    } 
	};
	// HashMap 구현 끝
	var frmFlag= false;
	$(document).ready(function(){
		
		if(gunbunVal){
			jQuery("#search_main1").hide();
			jQuery("#search_main1_1").hide();
			jQuery("#busLoading").show();
		}
		
		init(); // 맵 생성
		
		//메인 통합검색 키워드 있을 시
		var mainFlag = false;
		if(mainSearchTxt && !routeIdVal) {
			mainFlag = true;
			$('#bisSearchKeyword').val(mainSearchTxt);
			searchTotal();
		}else if(mainSearchTxt && routeIdVal){
			getRouteDetail(routeIdVal, mainSearchTxt, "", "");
		}
		
		//지도 탭 구분 있을 시
		if(mapTabCd) {
			if(mapTabCd == 1 || mapTabCd == 2 || mapTabCd == 3){
				$('.menu').addClass('active_tab'+mapTabCd);
				selectSec(mapTabCd);
				
				if(mapTabCd == 3 && busNumVal && routeIdVal){
					searchRealtime(busNumVal, routeIdVal); // 실시간버스와 연동
				}
			}
		}
		
		//경기도교통정보센터 도착지 있을 시
		if(endIp) {
			endMarkers.clearMarkers(); //도착지 마커 리셋
			jQuery("#ipEnd").val("경기도교통정보센터");
			$("#ipEnd").prev('.i_label').css('visibility','hidden');
			endLocName = "경기도교통정보센터";
			endFlag = true;
			endLon = "14130531.8846145"; // end 좌표 저장
			endLat = "4476538.6468633";
			popupSetFindway(endLon, endLat, 1);
			map.setCenter(new Tmap.LonLat(endLon, endLat));
			
			jQuery("#beforeEndBtn").hide();
			jQuery("#afterEndBtn").show();
		}
		
		// 경로 탐색 시작지점 엔터 클릭시 이벤트
		jQuery("#ipStart").keydown(function(evt){
			if(evt.keyCode == '13'){ // 엔터 클릭
				if(jQuery("#ipStart").val() == ""){
					alert("출발지를 입력해주세요.");
					return;
				}
				//출발지 검색 시작
				roadSearchStartEnd(0, true);
				jQuery("#beforeStartBtn").hide();
				jQuery("#afterStartBtn").show();
			}
		});
		
		// 경로 탐색 도착지점 엔터 클릭시 이벤트
		jQuery("#ipEnd").keydown(function(evt){
			if(evt.keyCode == '13'){ // 엔터 클릭
				if(jQuery("#ipEnd").val() == ""){
					alert("도착지를 입력해주세요.");
					return;
				}
				// 도착지 검색 시작
				roadSearchStartEnd(0, false);
				jQuery("#beforeEndBtn").hide();
				jQuery("#afterEndBtn").show();
			}
		});
		//최정빈 끝
		jQuery("#bisSearchKeyword").keydown(function(evt) {
			if(evt.keyCode != '8' && evt.keyCode != '46'  ){
				$(".recent_list").hide();
			}
			
			if (evt.keyCode==13){ //엔터키
				searchTotal();
			}
		});
		
		//초기화 버튼 마우스 오버 이벤트
		jQuery('.mapctrl .tools a:last').hover(function(){
			$(this).addClass('active');
		},function(){
			$(this).removeClass('active');
		});
		
		//최정빈
		// 경로검색 X 눌렀을 경우 초기화
		//출발지
		jQuery("#afterStartBtn").click(function(){
			jQuery("#ipStart").val("");
			if(startFlag){
				startMarkers.clearMarkers();
				startFlag = false;
			}
			if(resetSearchFlag){
				removeLineMarker();
				resetSearchFlag = false;
			}
			
			stationMarkerLayer.setVisibility(false);
			poiMarkerLayer.setVisibility(false);
			subwayMarkerLayer.setVisibility(false);
			tooltipClose();
			localBusMarkerLayer.clearMarkers();
			 $("#localBus").removeClass("active");//버스 아이콘 비활성화
			localBusStatus = false;
			
			jQuery("#beforeStartBtn").show();
			jQuery("#afterStartBtn").hide();
			jQuery("#roadbusSearchResult").hide();
			jQuery("#mainInfo").show();
			jQuery("#roadSearchResult").hide();
			jQuery("#ipStart").prev('.i_label').css('visibility','visible');
		});
		// 도착지
		jQuery("#afterEndBtn").click(function(){
			jQuery("#ipEnd").val("");
			if(endFlag){
				endMarkers.clearMarkers();
				endFlag = false;
			}
			if(resetSearchFlag){
				removeLineMarker();
				resetSearchFlag = false;
			}
			
			stationMarkerLayer.setVisibility(false);
			poiMarkerLayer.setVisibility(false);
			subwayMarkerLayer.setVisibility(false);
			tooltipClose();
			localBusMarkerLayer.clearMarkers();
			 $("#localBus").removeClass("active");//버스 아이콘 비활성화
			localBusStatus = false;
			
			jQuery("#beforeEndBtn").show();
			jQuery("#afterEndBtn").hide();
			jQuery("#roadbusSearchResult").hide();
			jQuery("#mainInfo").show();
			jQuery("#roadSearchResult").hide();
			jQuery("#ipEnd").prev('.i_label').css('visibility','visible');
		});
		//초기화 끝
	});
	
	// 버스탭 마우스 오버 시 백그라운드 음영
	function listBusEvt(){
		$('.list_bus > li').click(function(){
			$(this).css('background','none');
			$('.dtl_wrap').removeClass('active');
			$(this).find('.dtl_wrap').addClass('active');
		});
	}
	
	//탭이동 검색 결과 리셋
	function selectTabReset(){
		
		//통합검색
		resetSearch();
		routeBtnClose();
		//다중노선 초기화
		resetMultiRoute();
		//경로탐색
		resetRoute();
		removeLineMarker();
		
		jQuery("#bisSearchKeyword").val("");
		jQuery("#lineNumber").val("");
		jQuery("#ipStart").val("");
		jQuery("#ipEnd").val("");
		jQuery("#search_main1").show();
		jQuery("#search_main1_1").show();
		jQuery("#mainInfo").show();
		jQuery("#search_result1").hide();
		jQuery("#roadSearchResult").hide();
		jQuery("#roadbusSearchResult").hide();
		jQuery("#search_main3").show();
		jQuery("#search_result3").hide();
		jQuery("#ipStart").prev('.i_label').css('visibility','visible');
		jQuery("#ipEnd").prev('.i_label').css('visibility','visible');
		
		//상행 리스트 개수 초기화
		upListCnt = 0;
		//노선 상세 노선명 초기화
		route_name = "";
		//검색결과 정류소ID 초기화
		stationIdArr.length = 0;
		routeStationIdArr.length = 0;
	}
	
	var selectSecFlag = 1;
	//통합검색, 경로검색, 실시간 버스 탭
	function selectSec(i) {
		//탭이동시 버스갱신 중지
		if(t) stopInterval();
		
		if (i == 1){
			if(selectSecFlag != i){
				jQuery("#roadSearchBtn").removeClass("on");
				jQuery("#roadSearchBtn").attr("title","");
				jQuery("#realTimeBusBtn").removeClass("on");
				jQuery("#realTimeBusBtn").attr("title","");
				jQuery("#allSearchBtn").addClass("on");
				jQuery("#allSearchBtn").attr("title","통합검색 선택됨");
				
				jQuery("#allSearch").css("display", "");
				jQuery("#roadSearch").css("display", "none");
				jQuery("#realTimeBus").css("display", "none");
				
				jQuery(".local_info").css("display","");
				jQuery(".icon_info").css("display", "none");
				jQuery(".route_dtl").css("display", "none");
				jQuery(".cross").css("display","none");
				
				document.title="통합검색-버스정보안내 | 경기버스정보";
				
				//탭이동 검색 결과 리셋
				selectTabReset();
				
				//열려있는 툴팁 있을 시 툴팁 닫기
				if(crPopup) tooltipClose();
				
				//플래그 설정
				selectSecFlag = i;
				
				jQuery(".desc3").css("display","");
				jQuery(".mapctrl").css("display","");
				jQuery(".v2").css("display","");
			}
			
		}else if (i == 2){
			if(selectSecFlag != i){
				jQuery("#allSearchBtn").removeClass("on");
				jQuery("#allSearchBtn").attr("title","");
				jQuery("#realTimeBusBtn").removeClass("on");
				jQuery("#realTimeBusBtn").attr("title","");
				jQuery("#roadSearchBtn").addClass("on");
				jQuery("#roadSearchBtn").attr("title","경로검색 선택됨");
				
				jQuery("#allSearch").css("display", "none");
				jQuery("#roadSearch").css("display", "");
				jQuery("#realTimeBus").css("display", "none");
				
				jQuery(".local_info").css("display","");
				jQuery(".icon_info").css("display", "none");
				jQuery(".route_dtl").css("display", "none");
				
				//탭이동 검색 결과 리셋
				selectTabReset();
				document.title="경로검색-버스정보안내 | 경기버스정보";
				//열려있는 툴팁 있을 시 툴팁 닫기
				if(crPopup) tooltipClose();
				
				//플래그 설정
				selectSecFlag = i;
				
				jQuery(".desc3").css("display","");
				jQuery(".mapctrl").css("display","");
				jQuery(".v2").css("display","");
			}
		}else if (i == 3){
			if(selectSecFlag != i){
				jQuery("#allSearchBtn").removeClass("on");
				jQuery("#allSearchBtn").attr("title","");
				jQuery("#roadSearchBtn").removeClass("on");
				jQuery("#roadSearchBtn").attr("title","");
				jQuery("#realTimeBusBtn").addClass("on");
				jQuery("#realTimeBusBtn").attr("title","실시간버스 선택됨");
				
				jQuery("#allSearch").css("display", "none");
				jQuery("#roadSearch").css("display", "none");
				jQuery("#realTimeBus").css("display", "");
				
				jQuery(".local_info").css("display","none");
				jQuery(".icon_info").css("display", "");
				jQuery(".cross").css("display", "none");
				jQuery('.route_dtl').hide();
				$("#lineNumber").prev('.i_label').css('visibility','visible');
				//탭이동 검색 결과 리셋
				selectTabReset();
				document.title="실시간버스-버스정보안내 | 경기버스정보";
				//열려있는 툴팁 있을 시 툴팁 닫기
				if(crPopup) tooltipClose();
				
				//플래그 설정
				selectSecFlag = i;
			}
		}
	}
	
	//버스, 정류장, 지하철, 장소 탭
	function selectSec2(param) {
		if(param == 'bus'){
			$("#secBus").addClass("active");
			$("#secBus").siblings("a").removeClass("active");
			$("#secBus2").addClass("active");
			$("#secBus2").siblings("a").removeClass("active");
			
			$(".stationChosen").text('');
			$(".subwayChosen").text('');
			$(".placeChosen").text('');
			$(".busChosen").text('선택됨');
			
			$(".list_bus").show();
			$(".list_bus").siblings("ul").hide();
			//버스 마커 표출
			if(routeMarkerLayer.markers.length != 0) {
				routeMarkerLayer.setVisibility(true);
				map.zoomToExtent(routeMarkerLayer.getDataExtent());
			}
			if(stationMarkerLayer.markers.length != 0) stationMarkerLayer.setVisibility(false);
			if(subwayMarkerLayer.markers.length != 0) subwayMarkerLayer.setVisibility(false);
			if(poiMarkerLayer.markers.length != 0) poiMarkerLayer.setVisibility(false);
			
			//열려있는 툴팁 있을 시 툴팁 닫기
			if(crPopup) tooltipClose();
		}else if(param == 'station'){
			$("#secStation").addClass("active");
			$("#secStation").siblings("a").removeClass("active");
			$("#secStation2").addClass("active");
			
			$(".busChosen").text('');
			$(".subwayChosen").text('');
			$(".placeChosen").text('');
			$(".stationChosen").text('선택됨');
			
			$("#secStation2").siblings("a").removeClass("active");
			$(".list_station").show();
			$(".list_station").siblings("ul").hide();
			
			//정류장 마커 표출
			if(routeMarkerLayer.markers.length != 0) routeMarkerLayer.setVisibility(false);
			if(stationMarkerLayer.markers.length != 0){
				stationMarkerLayer.setVisibility(true);
				map.zoomToExtent(stationMarkerLayer.getDataExtent());
			}
			if(subwayMarkerLayer.markers.length != 0) subwayMarkerLayer.setVisibility(false);
			if(poiMarkerLayer.markers.length != 0) poiMarkerLayer.setVisibility(false);
			
			//열려있는 툴팁 있을 시 툴팁 닫기
			if(crPopup) tooltipClose();
		}else if(param == 'subway'){
			$("#secSubway").addClass("active");
			$("#secSubway").siblings("a").removeClass("active");
			$("#secSubway2").addClass("active");
			$("#secSubway2").siblings("a").removeClass("active");
			
			$(".busChosen").text('');
			$(".stationChosen").text('');
			$(".placeChosen").text('');
			$(".subwayChosen").text('선택됨');
			
			$(".list_subway").show();
			$(".list_subway").siblings("ul").hide();
			
			//지하철 마커 표출
			if(routeMarkerLayer.markers.length != 0) routeMarkerLayer.setVisibility(false);
			if(stationMarkerLayer.markers.length != 0) stationMarkerLayer.setVisibility(false);
			if(subwayMarkerLayer.markers.length != 0){
				subwayMarkerLayer.setVisibility(true);
				map.zoomToExtent(subwayMarkerLayer.getDataExtent());
			}
			if(poiMarkerLayer.markers.length != 0) poiMarkerLayer.setVisibility(false);
			
			//열려있는 툴팁 있을 시 툴팁 닫기
			if(crPopup) tooltipClose();
		}else if(param == 'place'){
			$("#secPlace").addClass("active");
			$("#secPlace").siblings("a").removeClass("active");
			$("#secPlace2").addClass("active");
			$("#secPlace2").siblings("a").removeClass("active");
			
			$(".busChosen").text('');
			$(".stationChosen").text('');
			$(".subwayChosen").text('');
			$(".placeChosen").text('선택됨');
			
			$(".list_place").show();
			$(".list_place").siblings("ul").hide();
			
			//장소 마커 표출
			if(routeMarkerLayer.markers.length != 0) routeMarkerLayer.setVisibility(false);
			if(stationMarkerLayer.markers.length != 0) stationMarkerLayer.setVisibility(false);
			if(subwayMarkerLayer.markers.length != 0) subwayMarkerLayer.setVisibility(false);
			if(poiMarkerLayer.markers.length != 0){
				poiMarkerLayer.setVisibility(true);
				map.zoomToExtent(poiMarkerLayer.getDataExtent());
			}
			
			//열려있는 툴팁 있을 시 툴팁 닫기
			if(crPopup) tooltipClose();


		}else if(param == 'metro'){
			$("input:radio:radio[value!='metro']").attr("checked",false);
			searchTotal(1, 'metro');
		}else if(param == 'wideDir'){
			$("input:radio:radio[value!='wideDir']").attr("checked",false);
			searchTotal(1,'wideDir');
		}else if(param == 'town'){
			$("input:radio:radio[value!='town']").attr("checked",false);
			searchTotal(1,'town');
		}else if(param == 'outAir'){
			$("input:radio:radio[value!='outAir']").attr("checked",false);
			searchTotal(1,'outAir');
		}
	}
	var updownStatus;
	var upListCnt = 0;
	function selectUpDown(param) {
		//상행
		if (param == "up"){
			$('.schbus_rtb_bt ul.schtab li.red').removeClass('on');
			$('.schbus_rtb_bt ul.schtab li.dblue').addClass('on');
			
			updownStatus = "up";
			//$("#start").addClass("active");
			//$("#start").siblings("a").removeClass("active");
			$("#resultUpline").show();
			$("#resultDownline").hide();
			
			$("#resultUpline").animate({scrollTop:0},0,function(){
				//$('.s_map_wrap .mapct_left .schbus_rtb_top').animate({height:'305'}, 500);
	        	$('.s_map_wrap .mapct_left .schbus_rtb_bt').css('height', 'calc(100% - 315px)');
			});
			//열려있는 툴팁 있을 시 툴팁 닫기
			if(crPopup) tooltipClose();
			
			//하행라인 벡터, 마커 표출
			if(down_line_layer != null) down_line_layer.setVisibility(true);
			if(downRouteMarkerLayer.markers.length != 0) downRouteMarkerLayer.setVisibility(true);
			if(downRealBusRouteMarkerLayer.markers.length != 0) downRealBusRouteMarkerLayer.setVisibility(true);
			if(downRealBusRouteLowMarkerLayer.markers.length != 0) downRealBusRouteLowMarkerLayer.setVisibility(true);
			
			//상행라인 벡터, 마커 표출
			if(up_line_layer != null) up_line_layer.setVisibility(true);
			if(upRouteMarkerLayer.markers.length != 0) upRouteMarkerLayer.setVisibility(true);
			if(upRealBusRouteMarkerLayer.markers.length != 0) upRealBusRouteMarkerLayer.setVisibility(true);
			if(upRealBusRouteLowMarkerLayer.markers.length != 0) upRealBusRouteLowMarkerLayer.setVisibility(true);
			
			if(up_line_layer.features.length > 0) map.zoomToExtent(up_line_layer.getDataExtent());
			
		//하행
		}else if (param == "down"){
			//$('.schbus_rtb_bt ul.schtab li.dblue').removeClass('on');
			//$('.schbus_rtb_bt ul.schtab li.red').addClass('on');
			
			updownStatus = "down";
			
			var box = document.querySelector('#resultUpline'),
		    targetElm = document.querySelector('#downlist_route_station_0').closest('li'); // <-- Scroll to here within ".box"
			
//			console.log('box');
//			console.log(box);
//			console.log('targetElm');
//			console.log(targetElm);
			scrollToElm( box, targetElm , 400 );
			document.querySelector('#downlist_route_station_0').focus();

			
			//$("#end").addClass("active");
			//$("#end").siblings("a").removeClass("active");
			//$("#resultDownline").show();
			//$("#resultUpline").hide();
			
			//$("#resultDownline").animate({scrollTop:(upListCnt-1)*57},0,function(){
	        //	$('.s_map_wrap .mapct_left .schbus_rtb_top').animate({height:'305'}, 500);
	        //	$('.s_map_wrap .mapct_left .schbus_rtb_bt').css('height', 'calc(100% - 315px)');
			//});
			//열려있는 툴팁 있을 시 툴팁 닫기
			if(crPopup) tooltipClose();
			
			//상행라인 벡터, 마커 표출
			if(up_line_layer != null) up_line_layer.setVisibility(true);
			if(upRouteMarkerLayer.markers.length != 0) upRouteMarkerLayer.setVisibility(true);
			if(upRealBusRouteMarkerLayer.markers.length != 0) upRealBusRouteMarkerLayer.setVisibility(true);
			if(upRealBusRouteLowMarkerLayer.markers.length != 0) upRealBusRouteLowMarkerLayer.setVisibility(true);
			
			//하행라인 벡터, 마커 표출
			if(down_line_layer != null) down_line_layer.setVisibility(true);
			if(downRouteMarkerLayer.markers.length != 0) downRouteMarkerLayer.setVisibility(true);
			if(downRealBusRouteMarkerLayer.markers.length != 0) downRealBusRouteMarkerLayer.setVisibility(true);
			if(downRealBusRouteLowMarkerLayer.markers.length != 0) downRealBusRouteLowMarkerLayer.setVisibility(true);
			
			if(down_line_layer.features.length > 0) map.zoomToExtent(down_line_layer.getDataExtent());
		}
	}
	
/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////WA 웹접근성 //////////////////////////////////////////////////////	
	
	function scrollToElm(container, elm, duration){
		  var pos = getRelativePos(elm);
		  scrollTo( container, pos.top , 1);  // duration in seconds
		}

		function getRelativePos(elm){
		  var pPos = elm.parentNode.getBoundingClientRect(), // parent pos
		      cPos = elm.getBoundingClientRect(), // target pos
		      pos = {};

		  pos.top    = cPos.top    - pPos.top + elm.parentNode.scrollTop,
		  pos.right  = cPos.right  - pPos.right,
		  pos.bottom = cPos.bottom - pPos.bottom,
		  pos.left   = cPos.left   - pPos.left;

		  return pos;
		}
		    
		function scrollTo(element, to, duration, onDone) {
		    var start = element.scrollTop,
		        change = to - start,
		        startTime = performance.now(),
		        val, now, elapsed, t;

		    function animateScroll(){
		        now = performance.now();
		        elapsed = (now - startTime)/1000;
		        t = (elapsed/duration);

		        element.scrollTop = start + change * easeInOutQuad(t);

		        if( t < 1 )
		            window.requestAnimationFrame(animateScroll);
		        else
		            onDone && onDone();
		    };

		    animateScroll();
		}

		function easeInOutQuad(t){ return t<.5 ? 2*t*t : -1+(4-2*t)*t };

////////////////// WA 웹접근성 /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
		
	//버스 노선 상세 탭 활성
	var routeRtbTime = null;
	var routeRtbTableYn = 'Y';
	function routeRtbTable(pType){
		if(pType == '' && $('.s_map_wrap .mapsch_after2').css('display') != 'none' && routeRtbTableYn == 'Y'){
			if(routeRtbTime != null) clearTimeout(routeRtbTime);
			routeRtbTime = setInterval(function() {
			  if(routeRtbTableYn == 'Y'){
				  if($('.schbus_rtb_top .rtb_table:eq(1)').css('display') == 'none'){
					  $('.schbus_rtb_top .rtb_table:eq(1)').fadeIn('fast');
				  }else{
					  $('.schbus_rtb_top .rtb_table:eq(1)').fadeOut('fast');
				  }
			  }
			}, 3000);
		}else if(pType == 'stop'){
			if($('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').attr('class').indexOf('fa-pause') > -1){
				clearTimeout(routeRtbTime);
				routeRtbTableYn = 'N';
				$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').removeClass('fa-pause');
				$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').addClass('fa-play');
				$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').parent().attr('title', '재생');
			}else{
				routeRtbTableYn = 'Y';
				$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').removeClass('fa-play');
				$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').addClass('fa-pause');
				$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').parent().attr('title', '정지');
				routeRtbTable('');
			}
		}else if(pType == 'prev' || pType == 'next'){
			clearTimeout(routeRtbTime);
			routeRtbTableYn = 'N';
			$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').removeClass('fa-pause');
			$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').addClass('fa-play');
			$('.schbus_rtb_top .rtb_top .slide_bt i:eq(2)').parent().attr('title', '재생');
			
			if($('.schbus_rtb_top .rtb_table:eq(1)').css('display') == 'none'){
				$('.schbus_rtb_top .rtb_table:eq(1)').fadeIn('fast');
			}else{
				$('.schbus_rtb_top .rtb_table:eq(1)').fadeOut('fast');
			}
		}
	}
	
	//버스 노선 상세 닫기
	function routeBtnClose(){
		clearTimeout(routeRtbTime);
		routeRtbTableYn = 'N';
		
		routeStationIdArr.length = 0; //검색결과 노선상세 정류소ID 초기화
		//열려있는 툴팁 있을 시 툴팁 닫기
		if(crPopup) tooltipClose();
		//정보갱신 중지
		if(routeT) stopRouteInterval();
		
		$(".mapsch_after2").hide();
		$('#bus_info').html("");
		$('#resultUpline ol').html("");
		$('#resultDownline ol').html("");
		
		//버스 마커 표출
		if(routeMarkerLayer.markers.length != 0) {
			routeMarkerLayer.setVisibility(true);
			map.zoomToExtent(routeMarkerLayer.getDataExtent());
		}
		
		//기존 지도 경로 삭제
		if(up_line_layer != null) up_line_layer.destroyFeatures();
		if(down_line_layer != null) down_line_layer.destroyFeatures();
		
		//기존 마커 삭제
		if(upRouteMarkerLayer.markers.length != 0) upRouteMarkerLayer.clearMarkers();
		if(downRouteMarkerLayer.markers.length != 0) downRouteMarkerLayer.clearMarkers();
		if(upRealBusRouteMarkerLayer.markers.length != 0) upRealBusRouteMarkerLayer.clearMarkers();
		if(downRealBusRouteMarkerLayer.markers.length != 0) downRealBusRouteMarkerLayer.clearMarkers();
		if(upRealBusRouteLowMarkerLayer.markers.length != 0) upRealBusRouteLowMarkerLayer.clearMarkers();
		if(downRealBusRouteLowMarkerLayer.markers.length != 0) downRealBusRouteLowMarkerLayer.clearMarkers();
		
		//상행 리스트 개수 초기화
		upListCnt = 0;
		//노선 상세 노선명 초기화
		route_name = "";
		
		$(".mapct_left2").hide();
		$(".mapct_right").css("width", "calc(100% - 380px)"); 
		
	}
	
	//지도 이동시 이벤트
	function onMoveEnd() 
	{
		
		ReverseGeocoding(); //리버스 지오코딩
		if(localSubwayStatus) {
			localSubwayMarkerLayer.clearMarkers(); //지하철 마커레이어 삭제
			searchAroundSubwayJson(); //지하철 조회
		}
		if(localBusStatus) {
			localBusMarkerLayer.clearMarkers(); //버스 마커레이어 삭제
			searchAroundBusJson(); //버스 조회
		}
		if(localOfficeStatus) {
			localOfficeMarkerLayer.clearMarkers(); //공공기관 마커레이어 삭제
			searchAroundPublicPOIJson(); //공공기관 조회
		}
		
		//15레벨 이하 주변 버스,지하철,관공서 보기 아이콘 비활성화
		if(map.getZoom() < 16){
			$("#localBus").removeClass("active");//버스 아이콘 비활성화
			localBusStatus = false;
			$("#localSubway").removeClass("active");//지하철 아이콘 비활성화
			localSubwayStatus = false;
			$("#localPublic").removeClass("active");//공공기관 아이콘 비활성화
			localOfficeStatus = false;
		}
	}
	
	//리버스 지오코딩
	var lonlat;
	function ReverseGeocoding(){
		lonlat = map.getCenter();
		
		if(map.getZoom() > 8){
			var url = "/gbis2014/schBusAPI.action";
			var data = 'cmd=getDongFromLLJson';
			data += "&lon="+lonlat.lon+"&lat="+lonlat.lat;
			
			$.ajax({
				type: "post",
				contentType: "application/x-www-form-urlencoded;charset=UTF-8",
				dataType: "json",
				url: url,
				data: data,
				success: getAddress
			});
		}
	}
	
	function getAddress(data)
	{	
		var address = "";
		var sido = (data.result.sido != undefined) ? data.result.sido : "";
		var gugun = (data.result.gu_gun != undefined) ? data.result.gu_gun : "";
		var dong = (data.result.legalDong != undefined) ? data.result.legalDong : "";
		
		if(sido != "") address += '<span class="province">'+sido+'</span>';
		if(gugun != ""){
			address += '<i class="fa fa-angle-right" aria-hidden="true"></i>';
			address += '<span class="county">'+gugun+'</span>';
		}
		if(dong != ""){
			address += '<i class="fa fa-angle-right" aria-hidden="true"></i>';
			address += '<span class="town">'+dong+'</span>';
		}
		
		jQuery(".map_addr").html(address);
	}
	
	//툴팁 출발,도착,닫기 버튼
	function btnStartFlag(){
		crPopup.hide();
		
		jQuery("#ipStart").val(routeName);
		$("#ipStart").prev('.i_label').css('visibility','hidden');
		startLocName = routeName;
		startFlag = true;
		startLon = crLon;  // start 좌표 저장
		startLat = crLat;
		popupSetFindway(crLon, crLat, 0);
		
		jQuery("#beforeStartBtn").hide();
		jQuery("#afterStartBtn").show();
		//경로검색 탭으로 이동
		jQuery("#allSearch").css("display", "none");
		jQuery("#roadSearch").css("display", "");
		jQuery("#realTimeBus").css("display", "none");
		
		jQuery(".local_info").css("display","");
		jQuery(".icon_info").css("display", "none");
		jQuery(".route_dtl").css("display", "none");
		
		var tabLen = $('.map_service .menu a').length;
		for (var i = 0; i < tabLen  ; i ++)	{
			$('.menu').removeClass('active_tab' + (i + 1));
		}
		$('.menu').addClass('active_tab2');
		
		routeBtnClose();
		/*if(startFlag && endFlag) {
			//검색 결과 리셋
			resetSearch();
			//대중교통 길찾기
			searchRoute();
		}*/
		//focusBackToEndInput();
		$('#ipEnd').css('display','block' ).attr('tabindex','0').focus();
	}
	
	function btnEndFlag(){
		crPopup.hide();
		
		jQuery("#ipEnd").val(routeName);
		$("#ipEnd").prev('.i_label').css('visibility','hidden');
		endLocName = routeName;
		endFlag = true;
		endLon = crLon; // end 좌표 저장
		endLat = crLat;
		popupSetFindway(crLon, crLat, 1);
		
		jQuery("#beforeEndBtn").hide();
		jQuery("#afterEndBtn").show();
		//경로검색 탭으로 이동
		jQuery("#allSearch").css("display", "none");
		jQuery("#roadSearch").css("display", "");
		jQuery("#realTimeBus").css("display", "none");
		
		jQuery(".local_info").css("display","");
		jQuery(".icon_info").css("display", "none");
		jQuery(".route_dtl").css("display", "none");
		
		var tabLen = $('.map_service .menu a').length;
		for (var i = 0; i < tabLen  ; i ++)	{
			$('.menu').removeClass('active_tab' + (i + 1));
		}
		$('.menu').addClass('active_tab2');
		
		routeBtnClose();
		
		/*if(startFlag && endFlag){
			//검색 결과 리셋
			resetSearch();
			//대중교통 길찾기
			searchRoute();
		}*/
		$('#route_search').css('display','block' ).attr('tabindex','0').focus();
	}
	
	function tooltipClose(){
		//툴팁 있을 시 삭제 
		if(crPopup) map.removePopup(crPopup);
		map.controls[0].activate();
		
		jQuery('.busLine_detail2').hide(); //정류소 다중노선보기 레이어 숨김
		jQuery('.list_cmn li ').removeClass('list_selected'); //리스트에서 선택된 백그라운드 컬러 삭제
		if(s) clearTimeout(s);
	}
	
	//마우스 우측버튼 출발,도착 버튼
	var findway_type;
	function setRightFlag(findwayType){
		findway_type = findwayType;
		
		var tData = new Tmap.TData();
	    tData.getAddressFromLonLat(rightLonlat.transform("EPSG:3857", "EPSG:4326"));
	    tData.events.register("onComplete", tData, onCompleteAddress);
	    
	    closeMenu();
	}
	
	function onCompleteAddress(){
		var xml = this.responseXML;
		var items = xml.getElementsByTagName("addressInfo");
		
		if(items[0]){
			var address = items[0].getElementsByTagName("fullAddress")[0].firstChild.data;
			
			if(findway_type == 0){
				startMarkers.clearMarkers(); //출발지 마커 리셋
				jQuery("#ipStart").val(address);
				$("#ipStart").prev('.i_label').css('visibility','hidden');
				startLocName = address;
				startFlag = true;
				rightLonlat.transform("EPSG:4326", "EPSG:3857");
				startLon = rightLonlat.lon;  // start 좌표 저장
				startLat = rightLonlat.lat;
				popupSetFindway(startLon, startLat, 0);
				
				jQuery("#beforeStartBtn").hide();
				jQuery("#afterStartBtn").show();
			}else if(findway_type == 1){
				endMarkers.clearMarkers(); //도착지 마커 리셋
				jQuery("#ipEnd").val(address);
				$("#ipEnd").prev('.i_label').css('visibility','hidden');
				endLocName = address;
				endFlag = true;
				rightLonlat.transform("EPSG:4326", "EPSG:3857");
				endLon = rightLonlat.lon; // end 좌표 저장
				endLat = rightLonlat.lat;
				popupSetFindway(endLon, endLat, 1);
				
				jQuery("#beforeEndBtn").hide();
				jQuery("#afterEndBtn").show();
			}
			
			//경로검색 탭으로 이동
			selectSecFlag = 2;
			jQuery("#allSearch").css("display", "none");
			jQuery("#roadSearch").css("display", "");
			jQuery("#realTimeBus").css("display", "none");
			
			jQuery(".local_info").css("display","");
			jQuery(".icon_info").css("display", "none");
			jQuery(".route_dtl").css("display", "none");
			
			var tabLen = $('.map_service .menu a').length;
			for (var i = 0; i < tabLen  ; i ++)	{
				$('.menu').removeClass('active_tab' + (i + 1));
			}
			$('.menu').addClass('active_tab2');
			
			if(startFlag && endFlag){
				//대중교통 길찾기
				jQuery("#mainInfo").hide();
				searchRoute();
			}
		}
	}
	
	//출발,경유,도착 클릭 시 마커 생성
	function popupSetFindway(x, y, search_type_local) {

		var start_symbol = "/gbis2014/images/ico/common/pin_start.png";
		var end_symbol = "/gbis2014/images/ico/common/pin_end.png";

		map.addLayer(startMarkers);
		map.addLayer(endMarkers);
		map.addLayer(viaMarkers);
		// 출발버튼 클릭시
		if (search_type_local == 0) {

			if (startMarker != undefined) {
				if (startMarker.icon != null) {
					startMarkers.clearMarkers();
					//startMarker.destroy();
				}
			}
			var size = new Tmap.Size(26, 30);
			var offset = new Tmap.Pixel(-(size.w / 2), -(size.h));
			var icon = new Tmap.Icon(start_symbol, size, offset);

			startMarker = new Tmap.Markers(new Tmap.LonLat(x, y), icon);
			startMarkers.addMarker(startMarker);

		//도착버튼 클릭시
		} else if (search_type_local == 1) {

			if (endMarker != undefined) {
				if (endMarker.icon != null) {
					endMarkers.clearMarkers();
					//endMarker.destroy();
				}
			}
			var size = new Tmap.Size(26, 30);
			var offset = new Tmap.Pixel(-(size.w / 2), -(size.h));
			var icon = new Tmap.Icon(end_symbol, size, offset);
			endMarker = new Tmap.Markers(new Tmap.LonLat(x, y), icon);
			endMarkers.addMarker(endMarker);
		}
	}
	
	//실시간 버스 닫기
	function closeRealtime(){
		
		document.mainForm.routeId.value = "";
	    document.mainForm.turnSeq.value = "";
	    
	    document.mainForm.cmd.value = "seeBusPos";
	    document.mainForm.target = "wndTrafficInfo";
	    document.mainForm.action = "/gbis2014/schBusRealtime.action";
	    document.mainForm.method = "post";
	    document.mainForm.submit();
	    
		jQuery(".route_dtl").css("display", "none");
		jQuery(".cross").css("display","none");
		
		jQuery(".desc3").css("display","");
		jQuery(".mapctrl").css("display","");
		jQuery(".v2").css("display","");
		
		stopInterval(); //실시간버스 정보갱신 중지
    }
	
	//인쇄하기
	var printPop;
	var printStatus = false;
	function goPrint(){
		if(!printStatus){
			printPop = window.open( "schBus.action?cmd=print", "_blank", "height=800,width=800,menubar=0,resizable=1,scrollbars=1,status=0,titlebar=0,toolbar=0" );
			$('.tools .print').addClass('active');
			printStatus = true;
		}
	}
	function printPopInit(){
		var cC = map.getCenter();
		var cS = map.getSize();
		var cP = map.getPixelFromLonLat(cC);
		cP.x = cP.x + (cS.w-800)/2;
		cP.y = cP.y + (cS.h-400)/2;

		map.setCenter(map.getLonLatFromPixel(cP));
		printPop.document.getElementById('map_div').innerHTML = document.getElementById('map_div').innerHTML;
		map.setCenter(cC);
	}
	
	//좌표값 보기
	function getLonLat(){
		var tData = new Tmap.TData();
	    tData.getAddressFromLonLat(rightLonlat.transform("EPSG:3857", "EPSG:4326"));
	    tData.events.register("onComplete", tData, onCompleteAddressLonlat);
	    
	    closeMenu();
	}
	
	function onCompleteAddressLonlat(){
		var xml = this.responseXML;
		var items = xml.getElementsByTagName("addressInfo");
		
		if(items[0]){
			var address = items[0].getElementsByTagName("fullAddress")[0].firstChild.data;
			
			jQuery("#tooltip_lonlat h1").text(address);
			jQuery("#tooltip_lonlat .tooltip_content .inner").text("Lon : " + rightLonlat.lon + " , Lat : " + rightLonlat.lat);
			
			var menuLonlat = document.getElementById("tooltip_lonlat");
			var cX = (lnbStatus) ? clientX - 325 - (jQuery("#tooltip_lonlat").width()/2 + 1) : clientX - (jQuery("#tooltip_lonlat").width()/2 + 1);
		   	var cY = clientY - $("#header").height() - (jQuery("#tooltip_lonlat").height() + 12);
			menuLonlat.style.left=cX+"px";
			menuLonlat.style.top=cY+"px";
			menuLonlat.style.display='block';
		}
	}
	
	function closeLonlat(){
		jQuery("#tooltip_lonlat").hide();
	}
	
	//공공기관, 지하철, 버스 출발,도착
	function setCommonFlag(findwayType, poiNm, lon, lat){
		
		//현재 팝업 닫기
		crPopup.hide();
		
		findway_type = findwayType;
		
		if(findway_type == 0){
			startMarkers.clearMarkers(); //출발지 마커 리셋
			jQuery("#ipStart").val(poiNm);
			$("#ipStart").prev('.i_label').css('visibility','hidden');
			startLocName = poiNm;
			startFlag = true;
			startLon = lon;  // start 좌표 저장
			startLat = lat;
			popupSetFindway(startLon, startLat, 0);
			
			jQuery("#beforeStartBtn").hide();
			jQuery("#afterStartBtn").show();

		}else if(findway_type == 1){
			endMarkers.clearMarkers(); //도착지 마커 리셋
			jQuery("#ipEnd").val(poiNm);
			$("#ipEnd").prev('.i_label').css('visibility','hidden');
			endLocName = poiNm;
			endFlag = true;
			endLon = lon; // end 좌표 저장
			endLat = lat;
			popupSetFindway(endLon, endLat, 1);
			
			jQuery("#beforeEndBtn").hide();
			jQuery("#afterEndBtn").show();

		}
		
		//경로검색 탭으로 이동
		selectSecFlag = 2;
		jQuery("#allSearch").css("display", "none");
		jQuery("#roadSearch").css("display", "");
		jQuery("#realTimeBus").css("display", "none");
		
		jQuery(".local_info").css("display","");
		jQuery(".icon_info").css("display", "none");
		jQuery(".route_dtl").css("display", "none");
		
		var tabLen = $('.map_service .menu a').length;
		for (var i = 0; i < tabLen  ; i ++)	{
			$('.menu').removeClass('active_tab' + (i + 1));
		}
		$('.menu').addClass('active_tab2');
		
		if(startFlag && endFlag){
			//대중교통 길찾기
			jQuery("#mainInfo").hide();
			searchRoute();
		}
	}
	
	//리스트 선택시 백그라운드 컬러 적용
	function listSelectEvt(){
		jQuery('.list_cmn li').click(function(){
			if(!jQuery(this).hasClass('paginate_wrap') && !jQuery(this).hasClass('btn_multi') && !jQuery(this).hasClass('cannot_find')) {//페이징, 다중노선 li 제외
				jQuery('.list_cmn li ').removeClass('list_selected');
				jQuery(this).addClass('list_selected');
			}
	 	});
	}
	
	//리스트 클릭 시 출발,도착 버튼 생성
	function listStartFlag(){
		
		jQuery("#ipStart").val(routeName);
		$("#ipStart").prev('.i_label').css('visibility','hidden');
		startLocName = routeName;
		startFlag = true;
		startLon = crLon;  // start 좌표 저장
		startLat = crLat;
		popupSetFindway(crLon, crLat, 0);
		
		jQuery("#beforeStartBtn").hide();
		jQuery("#afterStartBtn").show();
		//경로검색 탭으로 이동
		jQuery("#allSearch").css("display", "none");
		jQuery("#roadSearch").css("display", "");
		jQuery("#realTimeBus").css("display", "none");
		
		jQuery(".local_info").css("display","");
		jQuery(".icon_info").css("display", "none");
		jQuery(".route_dtl").css("display", "none");
		
		var tabLen = $('.map_service .menu a').length;
		for (var i = 0; i < tabLen  ; i ++)	{
			$('.menu').removeClass('active_tab' + (i + 1));
		}
		$('.menu').addClass('active_tab2');
	}
	
	function listEndFlag(){
		
		jQuery("#ipEnd").val(routeName);
		$("#ipEnd").prev('.i_label').css('visibility','hidden');
		endLocName = routeName;
		endFlag = true;
		endLon = crLon; // end 좌표 저장
		endLat = crLat;
		popupSetFindway(crLon, crLat, 1);
		
		jQuery("#beforeEndBtn").hide();
		jQuery("#afterEndBtn").show();
		//경로검색 탭으로 이동
		jQuery("#allSearch").css("display", "none");
		jQuery("#roadSearch").css("display", "");
		jQuery("#realTimeBus").css("display", "none");
		
		jQuery(".local_info").css("display","");
		jQuery(".icon_info").css("display", "none");
		jQuery(".route_dtl").css("display", "none");
		
		var tabLen = $('.map_service .menu a').length;
		for (var i = 0; i < tabLen  ; i ++)	{
			$('.menu').removeClass('active_tab' + (i + 1));
		}
		$('.menu').addClass('active_tab2');
		
	}