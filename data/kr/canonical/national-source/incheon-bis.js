/**
 * main.js
 */



$(document).ready(function() {
	if(isPcConnected() == true)	{
		setMainSlider();
	}
	setEvent();
	setBannerSlider();
	setPopup();
});

function setEvent() {
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
		moveSearchResult(searchWord);
	});
	
	$(".main_notice_list tr").click(function() {
		moveNoticeDetail($(this).attr("id"));
	});
	
	$(".main_mybus_list li").click(function() {
		var id = $(this).attr("id");
		var no = $(this).find("a").text();
		if(id == "" || id == undefined) {
			window.location.href = "../mem/mybus.view";
		}else {
			moveMyBusSearch(no, id);
		}
	});
}

function moveSearchResult(param) {
	$("#searchForm").remove();
	var form = document.createElement("form");
	form.setAttribute("id", "searchForm");
	form.setAttribute("method", "post");
	form.setAttribute("action", "../bis/search1.view");
	
	var hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "word");
	hiddenField.setAttribute("value", param);
	
	form.appendChild(hiddenField);
	document.body.appendChild(form);

	form.submit();
}

function moveNoticeDetail(param) {
	$("#moveForm").remove();
	var form = document.createElement("form");
	form.setAttribute("id", "moveForm");
	form.setAttribute("method", "post");
	form.setAttribute("action", "../bis/noticeView.view");
	
	var hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "bbsno");
	hiddenField.setAttribute("value", param);
	
	form.appendChild(hiddenField);
	document.body.appendChild(form);

	form.submit();
}

function moveMyBusSearch(routeno, routeid) {
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

function setMainSlider() {
	
	var mainSlider = $(".banner_img").bxSlider({
			auto  : true,
			autoHover: true,
			speed : 1000,
			pause : 5000,
			infiniteLoop : true,
			touchEnabled : (navigator.maxTouchPoints > 0)
			/*,
			autoControls : true,
			nextSelector: "#slide_next",
			prevSelector: "#slide_prev",
			nextText:'',  //객체 텍스트
	        prevText:'',   
			autoControlsSelector: "#slide_stop",
			startText:'',
			stopText:''*/
	});
	
	$("#slide_next").click(function() {
		mainSlider.goToPrevSlide();
	});
	$("#slide_prev").click(function() {
		mainSlider.goToNextSlide();
	});
	$("#slide_stop").click(function() {
		var clss = $(this).attr("class");
		if(clss == "banner_stop") {
			mainSlider.stopAuto();
			$(this).removeClass().addClass("banner_start");
		}else {
			mainSlider.startAuto();
			$(this).removeClass().addClass("banner_stop");
		}
	});
	
}

function setBannerSlider() {
	
	var bannerSlider = $("#banner").bxSlider({
		auto  : true,
		autoHover: true,
		speed : 1000,
		pause : 5000,
		slideWidth : 112, 
		moveSlides : 1,
		maxSlides : 6,  
		minSlides : 6,
		infiniteLoop : true,
		touchEnabled : (navigator.maxTouchPoints > 0)
		/*auto  : true,
		autoHover: true,
		speed : 1000,
		pause : 5000,
		autoControls : true,
//		slideMargin : 12,
		nextSelector: "#slide_prev2",  
		prevSelector: "#slide_next2",
		nextText:'',  //객체 텍스트
        prevText:'',   
		autoControlsSelector: "#slide_stop2",
		startText:'',
		stopText:''*/
	});
	
	$("#slide_next2").click(function() {
		bannerSlider.goToPrevSlide();
	});
	$("#slide_prev2").click(function() {
		bannerSlider.goToNextSlide();
	});
	$("#slide_stop2").click(function() {
		var clss = $(this).attr("class");
		if(clss == "banner_stop2") {
			bannerSlider.stopAuto();
			$(this).removeClass().addClass("banner_start2");
		}else {
			bannerSlider.startAuto();
			$(this).removeClass().addClass("banner_stop2");
		}
	});
}

function setPopup(){
	ajaxCall("../img/selectBannerList.do", {useyn:"1",bannertpcd:"3"}, null, success_popList, null);
	function success_popList(data){
		$.each(data.resultList,function(idx,val){
			if(!getCookie("bannerid"+val.bannerid)){
				window.open('../bis/popup.view?bannerid='+val.bannerid,val.bannerid,'width=548px, height=362px, resizable=0, scrollbars=0, toolbar=0, menubar=no');
			}
		});
	};
};

function getCookie(name){
	var found = false;
	var start, end;
	var i = 0;
	
	while(i<= document.cookie.length){
		start = i;
		end = start + name.length;
		if(document.cookie.substring(start,end) == name){
			found = true;
			break;
		}
		i++
	}
	
	if(found == true){
		start = end+1;
		end = document.cookie.indexOf(";",start);
		if(end < start) end = document.cookie.length;
		return document.cookie.substring(start,end);
	}
	return "";
};


