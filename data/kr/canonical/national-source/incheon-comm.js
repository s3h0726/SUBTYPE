document.write('<script src="../js/comm/commEvent.js"></script>');

//$(window.document).on("selectstart", function(event){return false;}); //prevent drag

/**********************************************
 * 공통으로 사용하는 AJAX 함수
 * @param url 			 - ajax 호출 url
 * @param data 			 - ajax param
 * @param beforeSendFunc - ajax beforeSend 수행 함수
 * @param successFunc 	 - ajax success 수행 함수
 * @param errorFunc 	 - ajax error 수행 함수
 *********************************************/
$.ajaxSetup ({cache : false});

function ajaxCall(url, data, beforeSend, success, error){
	$.ajaxSettings.traditional = true;
	$.ajax({
        type: "POST",
        url: url,
        data: data,
        dataType : "json",
        beforeSend: beforeSend,
        success: success,
        error: error
	});
}

/**********************************************
 * data가 배열일 경우 사용하는 AJAX 함수
 * Controller에서 @RequestBody String으로 받고
 * 파싱해서 사용 가능
 * @param url 			 - ajax 호출 url
 * @param data 			 - ajax param
 * @param beforeSendFunc - ajax beforeSend 수행 함수
 * @param successFunc 	 - ajax success 수행 함수
 * @param errorFunc 	 - ajax error 수행 함수
 *********************************************/
$.ajaxSetup ({cache : false});

function ajaxCallList(url, data, beforeSend, success, error){
	$.ajax({
		type: "POST",
		url: url,
        data : JSON.stringify(data),
        dataType:"json",
        contentType: "application/json; charset=utf-8",
        beforeSend: beforeSend,
        success: success,
        error: error
	});
}

/**********************************************
 * 공통으로 사용하는 AJAX 함수
 * @param url 			 - ajax 호출 url
 * @param data 			 - ajax param
 * @param beforeSendFunc - ajax beforeSend 수행 함수
 * @param successFunc 	 - ajax success 수행 함수
 * @param errorFunc 	 - ajax error 수행 함수
 *********************************************/
$.ajaxSetup ({cache : false});

function ajaxFormData(url, data, beforeSend, success, error){
	$.ajaxSettings.traditional = true;
	$.ajax({
        type       : "POST",
        url        : url,
        data       : data,
        cache      : false,
		contentType: false,
		processData: false,
		beforeSend : beforeSend,
        success    : success,
        error      : error
	});
}

/********************************
 * 파일 다운로드 
 * @Require jquery.fileDownload.js
 * 
 **********************************/
function requestFileDownload(name) {
	
	$.fileDownload($("#"+name).prop('action'),{
	    httpMethod: "POST",
	    data: $("#"+name).serialize(),
	    successCallback: function (url) {
	    	
	    },
	    failCallback: function(responesHtml, url){
	    	
	    }
	});
}

/********************************
 * PC 모바일 접속 구분 
 **********************************/
function isPcConnected() {
	var filter = "win16|win32|win64|mac|macintel"; 
	var ret = false;
	
	if(navigator.platform) { 
		if (filter.indexOf( navigator.platform.toLowerCase() ) < 0) { 
			ret = false;
		}else { 
			ret = true;
		} 
	}
	return ret;
}

/********************************
 * 휴대폰 번호 정규식
 **********************************/
function isPhoneNumber(num) {
	var regExp = /[01](0|1|6|7|8|9)(\d{4}|\d{3})\d{4}$/g;

	if(regExp.test(num)){
		return true;
	}else {
		return false;
	}
}

/**********************
 * 비밀번호 규격 채크
 *********************/
function checkPw(passwd) {

	var regType = /^[A-Za-z0-9+]{8,12}$/; 
	
	if(!regType.test(passwd)) {
		showAlert("비밀번호는 숫자와 영문자 조합으로 8~12자리를 사용해야 합니다.");
		return false;
	}
	
	var chk_num = passwd.search(/[0-9]/g); 
    var chk_eng = passwd.search(/[a-z]/ig);

    if(chk_num < 0 || chk_eng < 0) { 
    	showAlert("비밀번호는 숫자와 영문자 조합이어야 합니다.");
        return false;
    }
    return true;
}

/******************
 ** Date format
 *****************/
Date.prototype.format = function(f) {
   if (!this.valueOf()) return " ";
   var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
   var d = this;
    
   return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
       switch ($1) {
           case "yyyy": return d.getFullYear();
           case "yy": return (d.getFullYear() % 1000).zf(2);
           case "MM": return (d.getMonth() + 1).zf(2);
           case "dd": return d.getDate().zf(2);
           case "E": return weekName[d.getDay()];
           case "HH": return d.getHours().zf(2);
           case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
           case "mm": return d.getMinutes().zf(2);
           case "ss": return d.getSeconds().zf(2);
           case "a/p": return d.getHours() < 12 ? "오전" : "오후";
           default: return $1;
       }
   });
};

String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};

/*
 * 
 * 이하 2017.11.28 추가
 * 
 */

/**********************************************************
 * date input 설정
 * id: input 아이디
 * format: 시간 형식 ex) yyyy-mm-dd yyyy:mm:dd 
 * maxLength: 최대 길이
 ***********************************************************/
function initCalendar(id, format, init) {
	jQuery(function($){
		 $.datepicker.regional['ko'] = {
		  closeText: '닫기',
		  prevText: '이전',
		  nextText: '다음',
		  currentText: '오늘',
		  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
		  monthNamesShort: ['1','2','3','4','5','6','7','8','9','10','11','12'],
		  dayNames: ['일','월','화','수','목','금','토'],
		  dayNamesShort: ['일','월','화','수','목','금','토'],
		  dayNamesMin: ['일','월','화','수','목','금','토'],
		  weekHeader: 'Wk',
		  dateFormat: format,
		  firstDay: 1,    //시작요일 
		  isRTL: false,
		  showMonthAfterYear: true,
		  yearSuffix: '년'};
		 $.datepicker.setDefaults($.datepicker.regional['ko']);
	});
	$("#"+id).datepicker({changeMonth: true, changeYear:true});
	
	if(init == true) {
		var currentDate = new Date();
		
	//	var next = new Date(Date.parse(currentDate) + 1000 * 60 * 5); //5분 후
	//	var yesterday = new Date(Date.parse(currentDate) - 1000 * 60 * 60 * 24);	//어제
		$("#"+id).val($.datepicker.formatDate(format, currentDate));
	}
}

function setCalendar(objId, format, date) {
	$("#"+objId).val($.datepicker.formatDate(format, date));
}

/********************************
 * modal dialog 
 * id : wrap id
 * containerId : draggable container id
 **********************************/
function getDialog(id, containerId) {
	var dlg = $("#" + id).dialog({
		autoOpen: false,
		height: 446,
		width: 389,
//		height: "auto",
//		width: "auto",
//	      resizable: false,
		draggable: false,
		modal: true
	});
	$(".ui-dialog").draggable({containment: "#"+containerId});
	
	return dlg;
}

/********************************
 * 타이머 용 텍스트 변환 MM:SS
 ********************************/
Number.prototype.toMMSS = function () {
    var remainSec = this;
	
    var minutes = Math.floor(remainSec / 60);
    var seconds = remainSec - (minutes * 60);

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
}

function removeChar(event) {
    event = event || window.event;
    var keyID = (event.which) ? event.which : event.keyCode;
    if ( keyID == 8 || keyID == 9 || keyID == 46 || keyID == 37 || keyID == 39 ) {
        return;
    } else {
    	var val = event.target.value.replace(/[^0-9]/g, "");
    	if(val != "") {
    		event.target.value = val;
    	}else {
    		event.target.value = "";
    	}
    }
}

function setSelected(name, val, trigger) {
	$("#"+name + " option[value='"+val+"']").prop("selected", true);
	if(trigger != null) $("#"+name).trigger("change");
}

function getSelectedVal(name) {
	return $("#"+name + " option:selected").val();
}

function checkBroswerIE(){

	var agent = navigator.userAgent.toLowerCase(),
        name = navigator.appName,
        browser = false;
    // MS 계열 브라우저를 구분
    if(name === 'Microsoft Internet Explorer' || agent.indexOf('trident') > -1 || agent.indexOf('edge/') > -1) {
    	browser = true;
    } 
    return browser;
}

function appendLoader(text) {
	$("body").prepend('<div class="loader"><div class="wrap"><img src="../images/loader_2.gif"><p>'+text+'</p></div></div>');
}
function setLoaderText(text){
	$(".loader p").text(text);
}
function getLoaderText(){
	return $(".loader p").text();
}
function showLoader() {
	$(".loader").show();
}
function hideLoader() {
	$(".loader").hide();
}

/*****************
 * 검색기간 체크
 * s1, s2 : 시작 date
 * e1, e2 : 종료 date
 */
function checkPeriod(s1, e1, s2, e2) {
	var s1 = s1.replace(/-/g,"");
	var s2 = s2 == undefined ? "" : s1.replace(/-/g,"");
	var e1 = e1.replace(/-/g,"");
	var e2 = e2 == undefined ? "" : s1.replace(/-/g,"");

	if(parseInt(s1+s2+"") > parseInt(e1+e2+"")) {
		return false;
	}else {
		return true;
	}
}

/*****************
 * 날짜 체크 및 - 생성
 */
function add_dash_date( obj )
{
	var v_dt 		= obj.value.replace(/-/g, "");
	var mikExp 		= "0123456789";
	var strLength 	= v_dt.length;
	var strValue 	= 0;

	//숫자만입력
  	for (var i=0;i<strLength;i++)
  	{
    	if (mikExp.indexOf(v_dt.charAt(i))<0)
    	{
      		strValue = strValue + 1;
      		break;
    	}
  	}

  	if(strValue > 0)
  	{
  		obj.value = "";
  		obj.focus();
  		return false;
  	}

	var v_date = obj.value;
	v_date = del_dash(v_date);

	if (fun_length(v_date) <= 3)  obj.value = v_date ;
	if (fun_length(v_date) == 4)  obj.value = v_date ;
	if (fun_length(v_date) == 5)  obj.value = v_date.substring(0,4) + "-" + v_date.substring(4,5) ;
	if (fun_length(v_date) == 6)  obj.value = v_date.substring(0,4) + "-" + v_date.substring(4,6) ;
	if (fun_length(v_date) == 7)  obj.value = v_date.substring(0,4) + "-" + v_date.substring(4,6) + "-" + v_date.substring(6,7);
	if (fun_length(v_date) == 8)  obj.value = v_date.substring(0,4) + "-" + v_date.substring(4,6) + "-" + v_date.substring(6,8);
}

function del_dash(val)
{
	return val.replace(/-/gi,"").replace(/ /gi,"");
}

function fun_length(val)
{
	return(val.length + (escape(val) + "%u").match(/%u/g).length - 1);
}
