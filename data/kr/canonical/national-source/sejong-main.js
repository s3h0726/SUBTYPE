var Browser = {
    chk : navigator.userAgent.toLowerCase()
};
  
Browser = {
    ie : Browser.chk.indexOf('msie') != -1,
    ie6 : Browser.chk.indexOf('msie 6') != -1,
    ie7 : Browser.chk.indexOf('msie 7') != -1,
    ie8 : Browser.chk.indexOf('msie 8') != -1,
    ie9 : Browser.chk.indexOf('msie 9') != -1,
    ie10 : Browser.chk.indexOf('msie 10') != -1,
    opera : !!window.opera,
    safari : Browser.chk.indexOf('safari') != -1,
    mac : Browser.chk.indexOf('mac') != -1,
    chrome : Browser.chk.indexOf('chrome') != -1,
    firefox : Browser.chk.indexOf('firefox') != -1
};
  
/**
 *  웹 상단 메뉴 공통
 */	
$(document).ready(function(){
	var wrapC_margL=$(".wrap_contents").css("margin-left");
	flowMenuShowNHide();
	
	if(wrapC_margL!='auto'){ 
		if(!(Browser.chrome) && (Browser.safari || Browser.firefox)) {
			$(".flow_menu").remove();
		// chrome
		} else {
			$(".flow_menu").css({"left": parseInt($(".wrap_contents").css("margin-left"))+1020+"px"});// flowMenu 의 초기 left 값
		}
	
	}else{ //  ~ ie8 이하
		$(".flow_menu").css({"left" : "50%", "margin-left" : "550px"});
	}
	
	// 공통 사이드 메뉴
	$(function(){
		$(window).resize(function() { 
			
			flowMenuShowNHide();
			
			if(wrapC_margL!='auto'){ // (ie7~8 이 아닐경우)창크기조절할때 flowMenu의 left 위치 조정
				$(".flow_menu").css({"left": parseInt($(".wrap_contents").css("margin-left"))+1020+"px"}); //wrap_contents 사이 여백 20
			}
			
			var footer_position = $(".header").height() + $(".wrap_contents").height() + $(".top_banner").height();
			var left_position = $(window).scrollTop()+menuTop + $(".flow_menu").height();
			if(footer_position <= left_position){
				$(".flow_menu").css("top", footer_position -  $(".flow_menu").height());
			}
		}); 
		var menuTop = parseInt($(".flow_menu").css("top")); // 우측배너 위쪽 위치값을 menu_Top 에 입력 즉 133px
		$(window).scroll(function() { 
			
			var footer_position = $(".header").height() + $(".wrap_contents").height() + $(".top_banner").height();
			var left_position = $(window).scrollTop()+menuTop + $(".flow_menu").height();
			
			if(footer_position > left_position){
				$(".flow_menu").stop().animate({
					"top": $(window).scrollTop()+menuTop+"px"
				}, 500);
			} else {
				$(".flow_menu").css("top", footer_position -  $(".flow_menu").height());
			}
		}); 
	});
	
	/*
	 * GNB 이벤트
	 * */	
	$('.cate li').hover(
		
		function (){
			
			hideSubMenu();
			
			var currentId = $(this).attr('id');
			
			if(currentId == "menu01") {
				$('#menu_sub01').css({display:'flex'});
			}else if(currentId == "menu02") {
				$('#menu_sub02').css({display:'flex'});
			}else if(currentId == "menu03") {
				$('#menu_sub03').css({display:'flex'});
			}else if(currentId == "menu04") {
				$('#menu_sub04').css({display:'flex'});
			}else if(currentId == "menu05") {
				$('#menu_sub05').css({display:'flex'});
			}else if(currentId == "menu06") {
				$('#menu_sub06').css({display:'flex'});
			}
			$(this).children('a').addClass('on');


			if($(this).children('.sub_cate').css('display') === 'flex'){
				$('.header').addClass('on');
			}
			
		}
	);

	$('.cate li').keyup(function(e) {
	    var code = e.keyCode || e.which;

	    if (code === 9) { 
			
			hideSubMenu();
			
			var currentId = $(this).attr('id');
			
			if(currentId == "menu01") {
				$('#menu_sub01').css({display:'flex'});
			}else if(currentId == "menu02") {
				$('#menu_sub02').css({display:'flex'});
			}else if(currentId == "menu03") {
				$('#menu_sub03').css({display:'flex'});
			}else if(currentId == "menu04") {
				$('#menu_sub04').css({display:'flex'});
			}else if(currentId == "menu05") {
				$('#menu_sub05').css({display:'flex'});
			}else if(currentId == "menu06") {
				$('#menu_sub06').css({display:'flex'});
			}
			$(this).children('a').addClass('on');
			
		    if($(this).children('.sub_cate').css('display') === 'flex'){
				$('.header').addClass('on');
			}
	    }
	});
	
	// 메뉴 마우스 이벤트
	$('.header').mouseleave(function() {
		hideSubMenu();
		$("#sub_cate").hide();
		$('.header').removeClass('on');
	});
	$('.cate li:last-child .sub_cate li:last-child a').focusout(function(){
		hideSubMenu();
		$("#sub_cate").hide();
		$('.header').removeClass('on');
	});
	
});

function flowMenuShowNHide(){
	if($(window).width() < 1300){
		$(".flow_menu").hide();
	} else {
		$(".flow_menu").show();
	}
}

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

// 메뉴 마우스 이벤트
function hideSubMenu() {
	$('.sub_cate').hide();
	$('.cate').find('.on').removeClass('on');
}

// 상단메뉴 팝업창 띄우기
function popTraffic(param, param1) {
	var url = "";
	
	if(param == 'tr_01') {
		url = "../../web/traffic/traffic_bus_line_search.view";
	} else if (param == 'tr_02') {
		url = "../../web/traffic/traffic_station_search.view";
	} else if (param == 'tr_03') {
		url = "../../web/traffic/traffic_real_time_bus.view";
	} else if (param == 'tr_04') {
		url = "../../web/traffic/traffic_route_explore.view";
	} else if (param == 'tr_05') {
		url = "../../web/atms/atms_map.view?type=1";
	} else if (param == 'tr_06') {
		url = "../../web/atms/atms_map.view?type=2";
	} else if (param == 'tr_07') {
		url = "../../web/atms/atms_map.view?type=3";
	} else if (param == 'traffic') {
		url = "../../web/atms/atms_map.view";
	} else if (param == 'tr_08') {
		url = "../../web/atms/atms_event_map.view";
	} else if (param == 'tr_09') {
		url = "../../web/atms/atms_event_map.view?id=" + param1;
	}
	
	var params  = 'width=1500';
	params += ', height='+(screen.height-100);
	params += ', top=0, left=0';
	params += ', fullscreen=no, resizable=yes';
	
	window.open(url, 'popup', params);
	
}
/**
 * 이메일유효성 채크
 * 
 * RETURN : true, false
 */
function isUsefulEmail( inputValue ){
	
	eCheck=/^[_a-zA-Z0-9]+([-+.][_a-zA-Z0-9]+)*@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/i;
	
	var mail_check=eCheck.test(inputValue);
	
	if(mail_check==true){
		return true;
	}else{
		return false;
	}
}

//맞춤노선 검색 팝업 
function popCustomBusLine() {
	
	var cw=screen.availWidth;     //화면 넓이
	var ch=screen.availHeight;    //화면 높이
	var sw=575;    				  //띄울 창의 넓이
	var sh=480;    				  //띄울 창의 높이
	var ml=(cw-sw)/2;        	  //가운데 띄우기위한 창의 x위치
	var mt=(ch-sh)/2;         	  //가운데 띄우기위한 창의 y위치

	window.open("../../web/traffic/pop_bus_line.view", 'popup', "width="+sw+",height="+sh+",top="+mt+",left="+ml+",resizable=yes,scrollbars=no, toolbar=no, menubar=no" );     
}

// 맞춤정류장 검색 팝업
function popCustomStation() {
	
	var cw=screen.availWidth;     //화면 넓이
	var ch=screen.availHeight;    //화면 높이
	var sw=575;    //띄울 창의 넓이
	var sh=480;    //띄울 창의 높이
	var ml=(cw-sw)/2;        //가운데 띄우기위한 창의 x위치
	var mt=(ch-sh)/2;         //가운데 띄우기위한 창의 y위치

	window.open("../../web/traffic/pop_bus_station.view", 'popup', "width="+sw+",height="+sh+",top="+mt+",left="+ml+",resizable=yes,scrollbars=no, toolbar=no, menubar=no" );     
}

// 맞춤버스 검색 팝업
function popCustomBus() {
	
	var cw=screen.availWidth;     //화면 넓이
	var ch=screen.availHeight;    //화면 높이
	var sw=575;    //띄울 창의 넓이
	var sh=480;    //띄울 창의 높이
	var ml=(cw-sw)/2;        //가운데 띄우기위한 창의 x위치
	var mt=(ch-sh)/2;         //가운데 띄우기위한 창의 y위치

	window.open("../../web/traffic/pop_bus.view", 'popup', "width="+sw+",height="+sh+",top="+mt+",left="+ml+",resizable=yes,scrollbars=no, toolbar=no, menubar=no" );     
}
	
//맞춤노선 팝업 
function popCustomBusLineReal(param, param2) {
	
	var cw=screen.availWidth;     //화면 넓이
	var ch=screen.availHeight;    //화면 높이
	var sw=318;    				  //띄울 창의 넓이
	var sh=480;    				  //띄울 창의 높이
	var ml=(cw-sw)/2;        	  //가운데 띄우기위한 창의 x위치
	var mt=(ch-sh)/2;         	  //가운데 띄우기위한 창의 y위치

	window.open("../../web/traffic/pop_bus_line_real_time.view?routeId=" + param + "&routeName=" + param2, 'popup', "width="+sw+",height="+sh+",top="+mt+",left="+ml+",resizable=yes,scrollbars=no, toolbar=no, menubar=no" );     
}

// 맞춤정류장 팝업
function popCustomStationReal(param) {
	
	var cw=screen.availWidth;     //화면 넓이
	var ch=screen.availHeight;    //화면 높이
	var sw=318;    //띄울 창의 넓이
	var sh=480;    //띄울 창의 높이
	var ml=(cw-sw)/2;        //가운데 띄우기위한 창의 x위치
	var mt=(ch-sh)/2;         //가운데 띄우기위한 창의 y위치

	window.open("../../web/traffic/pop_bus_station_real_time.view?stopId=" + param, 'popup', "width="+sw+",height="+sh+",top="+mt+",left="+ml+",resizable=yes,scrollbars=no, toolbar=no, menubar=no" );     
}

// 맞춤버스 팝업
function popCustomBusReal(param) {
	
	var cw=screen.availWidth;     //화면 넓이
	var ch=screen.availHeight;    //화면 높이
	var sw=318;    //띄울 창의 넓이
	var sh=480;    //띄울 창의 높이
	var ml=(cw-sw)/2;        //가운데 띄우기위한 창의 x위치
	var mt=(ch-sh)/2;         //가운데 띄우기위한 창의 y위치

	window.open("../../web/traffic/pop_bus_location_real_time.view?vehId=" + param, 'popup', "width="+sw+",height="+sh+",top="+mt+",left="+ml+",resizable=yes,scrollbars=no, toolbar=no, menubar=no" );     
}	
	
//예약발송 검색 팝업 
function popCustomBusLineSms() {
	
	var cw=screen.availWidth;     //화면 넓이
	var ch=screen.availHeight;    //화면 높이
	var sw=575;    				  //띄울 창의 넓이
	var sh=550;    				  //띄울 창의 높이
	var ml=(cw-sw)/2;        	  //가운데 띄우기위한 창의 x위치
	var mt=(ch-sh)/2;         	  //가운데 띄우기위한 창의 y위치

	window.open("../../web/traffic/pop_bus_line_sms.view", 'popup', "width="+sw+",height="+sh+",top="+mt+",left="+ml+",resizable=yes,scrollbars=no, toolbar=no, menubar=no" );     
}
	
	
	
	
	
	