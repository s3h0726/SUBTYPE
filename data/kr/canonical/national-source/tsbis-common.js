/**
 * 
 */
"use strict";

let lon;
let lat;

// 현재 위치 가져오기
navigator.geolocation.getCurrentPosition((position) => {
    //console.log(position.coords.latitude, position.coords.longitude);
    lon = position.coords.longitude;
    lat = position.coords.latitude;
});

window.navigator.geolocation.watchPosition((position) => {
    //console.log(position.coords.latitude, position.coords.longitude);
    lon = position.coords.longitude;
    lat = position.coords.latitude;
});


$(function() {
	
	// 헤더 지역 선택
	const gnbItems = document.querySelectorAll('#regionList .gnb-item');
  	gnbItems.forEach((item) => {
    	const subList = item.querySelector('.sub-list');

    	if (subList) {
      		item.addEventListener('mouseenter', function () {
        		subList.classList.add('active');
      		});

      		item.addEventListener('mouseleave', function () {
        		subList.classList.remove('active');
      		});
    	}
  	});
});

//필드값 Number 체크 함수
function isNumber(strNumber) {
    //var reg = RegExp(/^ (\d|-)?(\d|,)*\.?\d*$/);
	let reg = RegExp(/^\d*\d*$/);    
        
    return reg .test(strNumber);      
    
}

//필드값 Number 체크 함수
function checkNumber(field) {

	if( !isNumber(field.value) ) {
      alert("숫자형식만 입력해주십시오.");
      field.value="";
      field.focus();
      field.select();
   }
}

// 숫자만 추출
function getNum(param) {
	let regex = /[^0-9]/g;
	
	if(isNullorEmpty(param)) {
		let msg = "빈 값입니다.";
		return msg;
	}
	return param.replace(regex, '');
}

// 특수문자 제거
function removeChar(param) {
	let regex = /[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
	
	if(isNullorEmpty(param)) {
		let msg = "빈 값입니다.";
		return msg;
	}
	return param.replace(regex, '');
}

// 공백 제거
function removeSpace(param) {
	let regex = / /g;
	
	if(isNullorEmpty(param)) {
		let msg = "빈 값입니다.";
		return msg;
	}
	return param.replace(regex, '');
}

// 게시글 입력 특수문자 체크(태그입력 방지)
function fnXXSS(Objectname) {
	let intErr = 0;
	let strValue = Objectname.value;
	let re = /[<>;'&=^]/gi; //특수문자 정규식 변수 선언
	for (let i = 0; i < strValue.length; i++) {
		var retCode = strValue.charCodeAt(i);
		retCode = parseInt(retCode);
		if(re.test(strValue)) {
			intErr = -1;
			break;
		}
	}
	if (intErr < 0) {
		alert("특수문자 중  < > ; ' & = ^ 는 사용할수 없습니다.");
		Objectname.value = strValue.replace(/[<>;'&=^]/gi,'');
	}
}

//Null 값 체크
function isNull(str) {
	let strResult = delSpace(str);
	let isnull = false;

	if (strResult == null)
		isnull = true;
	else if (strResult.length < 1)
		isnull = true;

	return isnull;
}

// 빈값 및 null check
function isNullorEmpty(param) {
	if(param == "undefined" ||
	   param == null ||
	   param.replace(/ /gi,"") == "") {
		return true;
	}
	return false;
}

function strToInt(s){
	try{
		s = s.replace(/px/gi, "");
		return parseInt(s);
	}catch(exception){
		console.error("strToInt Error [" + exception.name + "] : "+ exception.message);
	}finally{
		
	}	
}

//숫자 천단위마다 콤마 찍어주는 함수
function addCommas(nStr) {
	nStr += '';
	let x = nStr.split('.');
	let x1 = x[0];
	let x2 = x.length > 1 ? '.' + x[1] : '';
	let rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function strToDate(str) {
	let year = str.substr(0, 4);
	let month = str.substr(4, 2);
	let day = str.substr(6, 2);
	return new Date(year,month -1, day);
}

function strToDateTime(str) {
	let year = str.substr(0, 4);
	let month = str.substr(4, 2);
	let day = str.substr(6, 2);
	let hour = str.substr(8, 2);
	let min = str.substr(10, 2);
	let sec = str.substr(12, 2);
	return new Date(year,month -1, day, hour, min, sec);
}

// 좌측문자열채우기
function lpad(str, padLen, padStr) {
    if (padStr.length > padLen) {
        console.log("오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다");
        return str;
    }
    str += ""; // 문자로
    padStr += ""; // 문자로
    while (str.length < padLen)
        str = padStr + str;
    str = str.length >= padLen ? str.substring(0, padLen) : str;
    return str;
}

 // 우측문자열채우기
function rpad(str, padLen, padStr) {
    if (padStr.length > padLen) {
        console.log("오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다");
        return str + "";
    }
    str += ""; // 문자로
    padStr += ""; // 문자로
    while (str.length < padLen)
        str += padStr;
    str = str.length >= padLen ? str.substring(0, padLen) : str;
    return str;
}

function pad(n, width) {
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

// YYYY-MM-DD -> YYYYMMDD
function formatDate(date) {
	var formattedDate = date.replace(/\D/g, '');
	return formattedDate.substring(0, 8);
}

// YYYY-MM-DD HH:mm:ss  ->  YYYYMMDDHHmmss 
function formatDateToHms(date) {
	var formattedDate = date.replace(/\D/g, '');
	return formattedDate.substring(0, 8) + formattedDate.substring(9, 11) + formattedDate.substring(12, 14);
}

// YYYYMMDD -> YYYY-MM-DD
function reverseFormatDate(date) {
    var year = date.substring(0, 4);
    var month = date.substring(4, 6);
    var day = date.substring(6, 8);

    return year + "-" + month + "-" + day;
}

// YYYYMMDDHHmmss -> YYYY-MM-DD HH:mm:ss
function reverseFormatDateHms(date) {
    var year = date.substring(0, 4);
    var month = date.substring(4, 6);
    var day = date.substring(6, 8);
    var hour = date.substring(8, 10);
    var minute = date.substring(10, 12);
    var second = date.substring(12, 14);

    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

//날짜(일수) 차이 계산
function dateDiff(date_1, date_2){
	var diff_date_1 = date_1 instanceof Date ? date_1 : new Date(date_1);
	var diff_date_2 = date_2 instanceof Date ? date_2 : new Date(date_2);
	
	diff_date_1 = new Date(diff_date_1.getFullYear(), diff_date_1.getMonth()+1, diff_date_1.getDate());
	diff_date_2 = new Date(diff_date_2.getFullYear(), diff_date_2.getMonth()+1, diff_date_2.getDate());
	
	var diff = Math.abs(diff_date_2.getTime() - diff_date_1.getTime());
	diff = Math.ceil(diff/(1000 * 3600 * 24));
	
	return diff;
}

function addData(name, value) {
    var elem = document.createElement("input");
    elem.setAttribute("type", "hidden");
    elem.setAttribute("name", name);
    elem.setAttribute("value", value);
    return elem;
}

//yyyymm 형태로 포멧팅하여 날짜 반환
Date.prototype.yyyymm = function()
{
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
 
    return yyyy + (mm[1] ? mm : '0'+ mm[0]);
}

//yyyymmdd 형태로 포멧팅하여 날짜 반환
Date.prototype.yyyy_mm = function()
{
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
 
    return yyyy + "-" + (mm[1] ? mm : '0'+ mm[0]);
}

//yyyymmdd 형태로 포멧팅하여 날짜 반환
Date.prototype.yyyymmdd = function()
{
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
    var dd = this.getDate().toString();
 
    return yyyy + (mm[1] ? mm : '0'+mm[0]) + (dd[1] ? dd : '0'+dd[0]);
}

//yyyymmdd 형태로 포멧팅하여 날짜 반환
Date.prototype.yyyy_mm_dd = function()
{
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
    var dd = this.getDate().toString();
 
    return yyyy + "-" + (mm[1] ? mm : '0'+mm[0]) + "-" + (dd[1] ? dd : '0'+dd[0]);
}

//HHmmss 형태로 포멧팅하여 날짜 반환
Date.prototype.hhmmss = function()
{
    
    var hh = this.getHours().toString();
    var mm_ = this.getMinutes().toString();
    var ss = this.getSeconds().toString();
    return (hh[1] ? hh :'0'+hh[0])+ (mm_[1] ? mm_ : '0' + mm_[0]) + (ss[1] ? ss : '0' + ss[0]);
}

//HHmmss 형태로 포멧팅하여 날짜 반환
Date.prototype.hh_mm_ss = function()
{
    var hh = this.getHours().toString();
    var mm_ = this.getMinutes().toString();
    var ss = this.getSeconds().toString();
    return (hh[1] ? hh :'0'+hh[0])+ ":"+ (mm_[1] ? mm_ : '0' + mm_[0]) +":"+ (ss[1] ? ss : '0' + ss[0]);
}

//yyyymmddhhmmss 형태로 포멧팅하여 날짜 반환
Date.prototype.yyyymmddhhmmss = function()
{
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
    var dd = this.getDate().toString();
    
    var hh = this.getHours().toString();
    var mm_ = this.getMinutes().toString();
    var ss = this.getSeconds().toString();
    return yyyy + (mm[1] ? mm : '0'+mm[0]) + (dd[1] ? dd : '0'+dd[0]) +(hh[1] ? hh :'0'+hh[0])+ (mm_[1] ? mm_ : '0' + mm_[0]) + (ss[1] ? ss : '0' + ss[0]);
}

//yyyymmddhhmmss 형태로 포멧팅하여 날짜 반환
Date.prototype.yyyy_mm_ddhhmmss = function()
{
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
    var dd = this.getDate().toString();
    
    var hh = this.getHours().toString();
    var mm_ = this.getMinutes().toString();
    var ss = this.getSeconds().toString();
    return yyyy + "-" + (mm[1] ? mm : '0'+mm[0]) +"-" + (dd[1] ? dd : '0'+dd[0]) + " " +(hh[1] ? hh :'0'+hh[0])+ ":"+ (mm_[1] ? mm_ : '0' + mm_[0]) +":"+ (ss[1] ? ss : '0' + ss[0]);
}

//입력창 포커스 이동
function setFocus(elementId) {
    $('#' + elementId).focus();
}

function AjaxJson(){
	var params = arguments;
	
	switch(params.length){
	case 4:
		var url = params[0];
		var data = params[1];
		var fnSuccess = params[2];
		var fnError = params[3];
		$.ajax({
			url : url,
			method : "POST",
			dataType: "json",
			data:data,
			success:fnSuccess,
			error:fnError
		});
		break;
	case 5:
		var url = params[0];
		var data = params[1];
		var async = params[2];
		var fnSuccess = params[3];
		var fnError = params[4];
		$.ajax({
			url : url,
			method : "POST",
			dataType: "json",
			async:async,
			data:data,
			success:fnSuccess,
			error:fnError
		});
	case 6:
		var url = params[0];
		var data = params[1];
		var procData = params[2];
		var conType = params[3];
		var fnSuccess = params[4];
		var fnError = params[5];
		$.ajax({
			url : url,
			method : "POST",
			dataType: "json",
			data:data,
			processData: procData,
			contentType: conType,
			success:fnSuccess,
			error:fnError
		});
		break;
	};
};

// 공통 페이징 업데이트 함수
function updatePagination(paginationInfo, containerId, linkFunctionName) {
    const paginationDiv = document.querySelector(containerId);
    paginationDiv.innerHTML = "";

    const paginationHTML = `
        <div class="group-pagination">
            <button class="btn-left" ${paginationInfo.currentPageNo == 1 ? 'disabled' : ''} title="이전페이지">
            	<a href="#" ${paginationInfo.currentPageNo > 1 ? `onclick="${linkFunctionName}(${paginationInfo.currentPageNo - 1})"` : ''}>
	            	<i class="ic-arrow_open_left"><span class="blind">이전</span>
		            	<svg class="${paginationInfo.currentPageNo == 1 ? 'deactive' : ''}" width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		                    <g clip-path="url(#clip0_135_38)">
		                      <path d="M9.09 16.59L13.67 12L9.09 7.41L10.5 6L16.5 12L10.5 18L9.09 16.59Z" fill="black"/>
		                    </g>
		                    <defs>
		                      <clipPath id="clip0_135_38">
		                        <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
		                      </clipPath>
		                    </defs>
		                </svg>
	                </i>
            	</a>
            </button>
            <ul class="pagination-list">
                ${(() => {
                    const pageSize = 5; // 한 화면에 표시할 페이지 수
                    const startPage = Math.floor((paginationInfo.currentPageNo - 1) / pageSize) * pageSize + 1;
                    const endPage = Math.min(startPage + pageSize - 1, paginationInfo.totalPageCount);

                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                        const pageNum = startPage + i;
                        return `
                            <li class="${paginationInfo.currentPageNo == pageNum ? 'active' : ''}" title="${pageNum}페이지">
                                <button class="btn-pagination" onclick="${linkFunctionName}(${pageNum})">
                                    ${pageNum}
                                </button>
                            </li>`;
                    }).join('');
                })()}
            </ul>
            <button class="btn-right" ${paginationInfo.currentPageNo == paginationInfo.totalPageCount ? 'disabled' : ''} title="다음페이지">
            	<a href="#" ${paginationInfo.totalPageCount > paginationInfo.currentPageNo ? `onclick="${linkFunctionName}(${paginationInfo.currentPageNo + 1})"` : ''}>
            		<i class="ic-arrow_open_right"><span class="blind">다음</span>
	                  	<svg class="${paginationInfo.currentPageNo == paginationInfo.totalPageCount ? 'deactive' : ''}" width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		                    <g clip-path="url(#clip0_135_38)">
		                      <path d="M9.09 16.59L13.67 12L9.09 7.41L10.5 6L16.5 12L10.5 18L9.09 16.59Z" fill="black"/>
		                    </g>
		                    <defs>
		                      <clipPath id="clip0_135_38">
		                        <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
		                      </clipPath>
		                    </defs>
	                  	</svg>
                	</i>
            	</a>
            </button>
        </div>`;

    paginationDiv.innerHTML = paginationHTML;
}

// 메인 화면 쿠키 제거
function fnHome() {
	document.cookie = "savedRegion=; path=/; max-age=0";
}

// 지역 설정 쿠키 저장
function fnLocalPage(adminId) {
	/** 쿠키값 저장 만료시간 1일 (86400초), 1주일 (604800초)  */
	document.cookie = "savedRegion=" + adminId + "; path=/; max-age=604800";
}
