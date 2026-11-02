/**
 * GEON lEE (http://aljjabaegi.tistory.com)

 * 2017/08/23
 * 
01. getDate(moveDay, format)
 - 현재일자 기분으로 몇일 전/후 날짜를 가져온다.
 - ex) 3일전 getDate(-3), 3일후 getDate(3)
 - format은 boolean값. format이 true 일 경우 2017-01-01로 반환, 없을경우 20170101

02. getCurrTime(type, format)
 - 현재시간을 구한다.
 - 파라메터가 없을 경우 시분만 리턴 0101
 - 파라메터가 하나일 경우 format으로 간주, format은 boolean값
 - getCurrTime(true)는 01:01, getCurrTime(false)는 0101
 - type이 hms일 경우 시분초 리턴 010101

03.getCurrDateTime(format)
 - 현재 연월일시분초를 리턴
 - fotmat은 boolean값. true일 경우 2017-01-01 01:01:01
 - false일 경우 20170101010101

04. getThisWeek()
 - 이번주가 몇일부터 몇일까지인지 배열로 리턴
 - 오늘이 20171121 이라면 [20171119, 20171125] 을 리턴
 - 일요일 시작, 토요일 끝

05. getThisMonth()
 - 이번달이 몇일부터 몇일까지인지 배열로 리턴
 - 오늘이 20171121 이라면 ["20171101", "20171130"] 을 리턴

06. getFormatDate(originDate, type)
 - 날짜의 포멧을 변환해 리턴 (ex : originDate - 20170101010101)
 - type 이 'ymdhms' 라면 2017-01-01 01:01:01
 - type 이 'ymdhm' 라면 2017-01-01 01:01
 - type 이 'ymdh' 라면 2017-01-01 01
 - type 이 'ymd' 라면 2017-01-01
 - type 이 'ym' 라면 2017-01
 - type 이 'mdhm' 라면 01-01 01:01
 - type 이 'md' 라면 01-01
 - type 이 'hm' 라면 01:01
 - type 이 'mdh' 라면 01-01 01시
 - type 이 'hms' 라면 01:01:01

07. getDateDiff(시작일자, 종료일자)
 - 시작일자와 종료일자 사이의 파이 일수를 계산
 - 종료일자가 시작일자보다 커야됨 작을경우 음수 출력
 - getDateDiff('20171121','20171128') 은 7
 - getDateDiff('20171128','20171121') 은 -7

08.getTimeDiff(originDate, minutes)
 - 분까지 있는 originDate를 받아 minutes 전 후의 데이터를 리턴
 - AF.getTimeDiff('201711221000', 20) => ["20171122094000", "20171122102000"]
 - 2017년11월22일10시00분 의 20분 전후 데이터를 배열로 리턴

09. getLastDay(date)
 - 해당 연월의 마지막 일자를 구해 리턴
 - getLastDay('20171122') => 30
 - getLastDay('20171022') => 31

10. setDate(selectorId, moveDay)
 - selectorId 에 날짜를 바인딩
 - setDate('stDate', 0) => 오늘 날짜를 stDate에 바인딩
 - setDate('stDate', 1) => 내일 날짜를 stDate에 바인딩
 - setDate('stDate', 7) => 7일 후 날짜를 stDate에 바인딩


11.getDecimal(num, type)
 - num에 소수점을 처리하여 리턴
 - type이 숫자일 경우 해당 자리수까지 반올림 하여 리턴
 - type = 'r' 반올림
 - type = 'c' 올림
 - type = 'f' 버림


12. getOnlyNumber(data)
 - 문자열에서 숫자만을 추출해서 리턴
 - getOnlyNumber('2017/11/22') => 20171122

13. getCommaNumber(number)
 - 천단위마다 콤마(,)를 찍어서 리턴
 - getCommaNumber(1000) => 1,000

14.getBrowser()
 - 현재 브라우져명을 리턴
 - Internt Explorer = 'ie'
 - Crome = 'cr'
 - Safari = 'sf'
 - FireFox = 'ff'
 - opera = 'op'

15. mobileChk()
 - 해당 기기가 모바일인지 확인
 - 모바일이면 true, 아니면 false

16.chkboxAll(chkAllId, chkListNm)
 - 테이블 헤더에 체크박스 클릭 시 테이블 체크박스 전체 선택, 해제
 - chkAllId : thead의 체크박스 id, chkListNm : 리스트의 체크박스 명

distStr(str)
 - 문자열에 어떤 타입의 문자가 있는지 리턴해주는 함수
 - 여러가지 타입이 있다면 배열로 리턴
 - 하나의 타입이 있다면 String으로 리턴
 - 공백(blank), 숫자(number), 영어대문자(upperEng), 영어소문자(lowerEng), 특수문자(spChar), 한글(kor), 한글자음(vowKor), 한글모음(conKor)
 - distStr("ㄱ가dD1") => ["vowKor", "kor", "lowerEng", "upperEng", "number"]

17. getChoHangul(str)
 - 한글의 초성 추출 하여 리턴
 - getChoHangul('가나다라'); =>  'ㄱㄴㄷㄹ'

getChoMatch(vowels, str)
  - 초성과 문자열을 받아 문자열에 초성에 해당하는 문자를 배열로 리턴해주는 함수
  - getChoMatch("ㄱㄴ", "가나다라구누가갸"); => ["가나", "구누"]

chgKeywordStr(keyword, strArray, tagName)
 - 초성과 문자열배열을 보내 문자열에 초성에 해당하는 단어를 찾아 highlight 처리한 스트링배열 값을 배열로 리턴해주는 함수
 - chgKeywordStr("가나", "가나다라"); => ["<span style='background-color:#FFFF00; display:inline;'>가나</span>다라"]
 - keyword(한글자음(초성)), strArray(변환할 스트링배열), tagName(하이라이트 처리시 변경할 tag명, 기본은 span)

18. getBytes(str)
 - 문자열의 바이트를 구하여 리턴

19. setCookie(cNm, cVal, cDay)
 - 쿠키를 저장하는 함수
 - cNm : 쿠키명, cVal : 쿠키값, cDay : 쿠키저장기간, 없을경우 기본 30일

20. getCookie(cNm)
 - 쿠키명으로 쿠키값을 가져와 리턴

21. delCookie(cNm)
 - 쿠키명으로 쿠키값을 삭제하는 함수

22. autoLink(selectorId)
 - selectorId 에 URL 이 있다면 자동으로 하이퍼링크를 걸어주는 함수

23. arraySort(array, sort)
 - 배열 내 값을 정렬하는 함수
 - sort값이 'desc'일 경우 내림차순, 'asc'일 경우 오름차순

24. arrayRemoveOverlap(array)
 - 배열 내 중복값을 제거한 후 배열 리턴

25.arrayGetSum(array)
 - 숫자값만 있는 배열일 경우 해당 값들을 모두 더하여 리턴
 - [1,2,3,4,5] => 15

26. startTimer(obj, time)
 - obj를 time 마다 반복하는 함수
 - obj는 함수명이거나 함수명이있는 배열, 함수명만 보낸다.
 - time의 단위는 ms, 3초(3000)
 - timer를 종료하기 위해선 해당값을 받아서 stopTimer의 매개변수로 보낸다.
 - var timer = startTimer(obj,time);
 - stopTimer(timer);

27. stopTimer(obj)
 - 타이머를 종료하는 함수
 - 설명은 위 startTimer 참조

28. openPopup(url, height, width, loc, cLeft, cTop)
 - 팝업을 호출하는 함수
 - url : 팝업을 호출할 url
 - height : 팝업의 height 크기
 - width : 팝업의 width 크기
 - loc : 팝업을 띄울 위치, 'leftTop' 좌측상단, 'rightTop' 우측상단, 'point' 클릭한 위치, 'custom' 사용자 설정
 - loc 이 'custom' 일 경우 cLeft, cTop을 매개변수로 보낸다.
 - AF.openPopup('${ctx}/openPopup.do', 200, 200, 'leftTop');
 - AF.openPopup('${ctx}/openPopup.do', 200, 200, 'custom', 200, 200);

29. focusFirstEle(element)
 - 해당 element의 첫번째 요소에 포커스를 보낸다.

30. initChildEle(selectorId)
 - 모든 자식 요소의 값을 초기화 한다. form 내의 값을 초기화 할때 사용
 - text : 값을 비운다.
 - password : 값을 비운다.
 - checkbox : 선택을 해제 한다.
 - radio : name을 기준으로 첫번째 값을 선택한다.
 - select : 첫번째 옵션값 선택한다.

31. keyPressEvent(selectorId, key, funcNm)
 - selectorId 에서 key를 눌렀을 때 funcNm함수를 실행시키는 함수
 - key는 'enter', 'space', 다른키는 추후 추가 예정
 - funcNm은 함수의 명만 보낸다. getDate()일 경우 getDate
 - 이 기능을 사용하기 위해선 AF.aljjaModeObj.keyPressMode = 'Y' 로 설정해야 한다.

32. setModalPopup(selectorId)
 - selectorId를 받아 모달팝업으로 설정한다.

33. ocModalPopup(selectorId)
 - 해당 selectorId 모달 팝업을 열고 닫는다.
 - setModalPopup(selectorId) 가 선행되어야 한다.

34. createBgLayer(selectorId)
 - 모달팝업의 백그라운드 레이어를 생성한다. (배경 흐림 및 선택 안되게 처리)
 - ocModalPopup 시 자동 실행된다. 

35. clearBgLayer(selectorId)
 - 모달팝업의 백그라운드 레이어를 제거한다.
 - ocModalPopup 시 자동 실행된다.

36. calendar(selectorId)
 - selectorId에 datePicker(달력) 기능을 추가한다.
 - 폴더내 jquery-ui-1.10.3.custom.js 파일 필요.

37. timeInterval(div)
 - 년, 월, 일, 주, 시, 분 <select>내 추가될 <option> 값을 리턴한다.
 - div가 time일 경우 00:00 ~ 24:00 까지 
 - div가 month일 경우 01월 ~ 12월 까지 
 - div가 year일 경우 2016년 ~ 2027년 까지 
 - div가 weekday일 경우 일 ~ 토 까지, 일(0), 월(1)...토(6)
 - div가 hour일 경우 00 ~ 24 까지 
 - div가 min일 경우 00 ~ 60 까지

38. addZero(data)
 - data가 10보다 작을 경우 앞에 0을 붙여서 리턴
 - addZero(9) => 09

39. removeZero(data)
 - data가 0으로 시작한다면 0을 제거하고 리턴
 - removeZero(09) => 9

40. getDateString(date)
 - Date타입인 date를 String 타입으로 변환하여 리턴

41. getTimestampToDate(timestamp, formatYn)
 - UNIX timestamp 값을 String Date 혹은 포멧이 있는 String Date로 리턴
 - getFormatTs('1511499761') => '20171124140241'
 - getFormatTs('1511499761', true) => '2017-11-24 14:02:41'

42. removeBlank(data)
 - 데이터의 모든 공백과 엔터처리를 제거한 후 리턴 한다. 
43. setStopwatch()
 - 스탑워치를 위한 시분초 증가 함수
 - 스탑워치에 대한 객체는 <ul class="timeClock" id="stopWarch"><li>00</li><li class="point">:</li><li>00</li><li class="point">:</li><li>00</li></div>
44. startStopwatch()
 - 스탑워치 시작 함수
45. stopStopwatch()
 - 스탑워치 종료 함수
46. clearStopwatch()
 - 스탑워치 초기화 함수
47. disturbRefresh(div)
 - 새로고침 막는 함수
 - F5, ctrl+r, backspace
 - div =true이면 막기, false이면 풀기
48. removeDisturbBackspace()
 - 백스페이스만 푸는 함수
49. mouseRightClick(div)
 - 마우스 오른쪽버튼 클릭 이벤트 막는 함수
 - div가 false 이면 막기, true이면 풀기
 - AF.mouseRightClick(true) or AF.mouseRightClick(false)
50. getDistanceFromLatlng(obj)
 - 두 좌표 사이의 거리(m값 리턴)
 - 배열의 아래와 같은 2개의 object
   ib: 127.05685, jb: 37.183661
   ib: 127.060016, jb: 37.183951
51. getSecondDiff(startTime, endTime);
 - 파라메터는 년월일시분초 포맷으로 ex) 20180621134203
 - 같은 날짜일 경우 시간 차이를 초로 리턴
52. getContextPath();
 - ${ctx}, contextPath 값을 리턴
53. createElement
 - document.createElement 함수를 보다 편히 쓸수 있게 한다. 
54. foreach(배열DOM객체(혹은 셀렉터), 콜백함수)
 - 유사배열객체 foreach 사용을 위한 메소드로 돔객체 혹은 셀렉터(문자열)을 보내면 된다 
55. setDragPopup(id 셀렉터) 
 - 셀렉터는 팝업의 id (string) 혹은 객체를 보내면 된다
 - 팝업의 헤더 아이디를 "팝업id + header"로 지정한 경우 헤더위치에서만 드래그 이벤트 적용
 - 팝업 헤더 id를 지정하지 않은 경우 모달팝업 드래그 이벤트 적용
56. setMultiCombo(id)
 - 멀티 콤보박스 표출될 div 객체 id 값을 넘긴다
57.setMtCbData(id, data)
 - 멀티 콤보박스 표출할 데이터를 넘긴다
 - 여기서 데이터는 cbKey, cbValue 를 키로 갖는 객체 배열이다 
58.getMtCbKey(id)
 - 콤보박스 선택한 데이터의 key값을 가져온다
59.getMtCbValue(id)
 - 콤보박스 선택한 데이터의 텍스트값을 가져온다
60.getMonthDiff(d1, d2)
 - 두 날짜의 월 차이 계산, 파라메터의 두 날짜는 new Date(2020-12) 포맷으로 보내야한다
61.getStrByteLength(string)
 - 문자열의 byte 계산 
 **/

"use strict";
var AF = function () {
	var aljjaMsgObj = {
		paramCntErr: "[AF]매개변수 갯수가 올바르지 않습니다.",
		paramTypeErr: "[AF]매개변수 타입 형태가 올바르지 않습니다.",
		paramDataErr: "[AF]매개변수 데이터 타입이 올바르지 않습니다.",
		paramLenErr: "[AF]매개변수 데이터 길이가 올바르지 않습니다.",
		paramErr: "[AF]파라미터 값이 올바르지 않습니다.",
		ajaxDataErr: "[AF]데이터를 조회하는데 실패하였습니다.",
		ajaxNetworkErr: "[AF]네트워크에 연결 할 수 없습니다.",
		ajax404Err: "[AF]요청하신 페이지를 찾을 수 없습니다.",
		ajax500Err: "[AF]내부 서버에 에러가 있습니다.",
		ajaxJsonErr: "[AF]Json 데이터 요청에 실패하였습니다.",
		ajaxTimeoutErr: "[AF]요청 시간을 초과하였습니다.",
		ajaxUnkownErr: "[AF]알 수 없는 에러가 발생하였습니다.",
		loginOverlapErr: "[AF] 중복 로그인이 감지 되었습니다.\n로그인 페이지로 이동합니다.",
	},
		aljjaPopObj = {
			target: '_blank',  //_self : 현재창, _blank : 새창, _parent : 부모창, _top, name : 윈도우창 타이틀
			scrollbars: 'yes', // 스크롤바 여부
			resizable: 'no',   // 페이지 사이즈 조절 여부
			status: 'no',      // 상태바(하단에 페이지 사이즈조절한 창) 여부
			toolbar: 'no',     // 메뉴 표시줄 여부
			titlebar: 'no',    // 타이틀바 여부
			location: 'no',    // 주소창 여부
			menubar: 'no',     // 메뉴바 여부
		},
		aljjaModeObj = {
			keyPressMode: 'off',
		},
		aljjaStopwatch = {
			id: '',
			seconds: 0,
			minutes: 0,
			hours: 0,
			t: '',
		},
		aljjaCountDown = {
			id: '',
			seconds: 0,
			min: 0,
			stdSeconds: 0,
			stdMin: 0,
			actionFunc: '',
		},
		aljjaElement = ['input', 'select'],
		version = '2.0.0';

	var func = new Function();
	func.prototype = {
		version: version,
		constructor: "Aljjabaegi Programmer",
		homePage: "http://aljjabaegi.tistory.com",
		aljjaPopObj: aljjaPopObj,
		aljjaModeObj: aljjaModeObj,
		aljjaElement: aljjaElement,

		ajax: function (url, params, func, type, method) {
			const xhr = new XMLHttpRequest();
			var contentType = '';
			if (!!type) {
				if (type == 'json') {
					contentType = 'application/json'; //javascript object notation json
				} else if (type == 'file') {
					contentType = 'multipart/form-data';
				} else if (type == "form") {
					contentType = 'application/x-www-form-urlencoded';
				} else if (type == 'text') {
					contentType = "text/plain";
				} else if (type == 'excel') {
					contentType = "application/json";
				}
			}
			var data = '';
			if (!!params && params != '') {
				if (type == 'json') {
					data = JSON.stringify(params);
				} else if (type == 'form' || type == 'file') {
					data = this.jsonToForm(params); //form 데이터의 경우 serialize해야함
				} else if (type == "text") {
					data = param;
				} else if (type == "excel") {
					data = JSON.stringify(params);
				}
			}

			xhr.open(((typeof method !== "undefined") ? method : "POST"), url, true);
			//				xhr.processData = false;
			xhr.responseType = 'json';
			if (type == "excel") xhr.responseType = 'blob';
			xhr.setRequestHeader('Content-type', contentType + '; charset=UTF-8;');
			xhr.onload = function (e) {
				if (this.status == 200 && this.readyState == 4) {
					func((this.responseType == 'json' || this.responseType == 'blob') ? this.response : JSON.parse(this.response));
				} else if (this.status == 404 && this.readyState == 4) {
					alert(aljjaMsgObj.ajax404Err);
				} else if (this.status == 500 && this.readyState == 4) {
					alert(aljjaMsgObj.ajax500Err);
				} else {
					if (this.readyState == 4) {
						alert(aljjaMsgObj.ajaxDataErr);
					}
				}
			};
			xhr.send(data);
		},
		jsonToForm: function (jsObj) {
			const formData = new FormData();
			/*화살표 함수는 IE에서 동작안함*/
			//				Object.keys(jsObj).forEach(key => formData.append(key, jsObj[key]));
			var keys = Object.keys(jsObj);
			for (var i = 0; i < keys.length; i++) {
				//					formData.append(keys[i], jsObj[keys[i]]);
				formData.set(keys[i], jsObj[keys[i]]);
			}
			return formData;
		},
		/*요소에 이벤트를 등록한다. ids는 , 로 구분해 전달하면 멀티 등록이 가능하다.*/
		addEvent: function (ids, event, func) {
			ids = this.removeBlank(ids).split(',');
			for (var i in ids) {
				var selectElement = document.querySelector('#' + ids[i]);
				selectElement.addEventListener(event, function (e) {
					func.call(selectElement, e);
				});
			}
		},
		/**현재일자 기준으로 몇일 전/후 날짜를 가져온다. 
		 * 파라메터가 없을 경우 현재 일자.
		 * 전일은 -를 붙여서, 후일은 양수로
		 * ex) 3일전 => getDate(-3), 3일후 => getDate(3)
		 * 포멧이 있는 날짜구할 시 getDate(true) => 2017-08-29
		 * **/
		getDate: function (moveDay, format) {
			if (arguments.length == 0) {
				moveDay = 0;
			} else {
				if (typeof moveDay == 'boolean') {
					format = moveDay;
					moveDay = 0;
				} else {
					if (typeof moveDay != 'number') { alert(aljjaMsgObj.paramDataErr); return; }
				}
			}
			var now = new Date();
			var dayOfMonth = now.getDate();
			now.setDate(dayOfMonth + parseInt(moveDay));
			var year = now.getFullYear();
			var mon = now.getMonth() + 1;
			var day = now.getDate();
			mon = ((mon < 10) ? "0" : "") + mon;
			day = ((day < 10) ? "0" : "") + day;
			return (format == true) ? this.getFormatDate(year + mon + day, 'ymd') : year + mon + day;
		},
		/**
		 * 현재 시분초를 구한다 ex) 1130 or 113010 
		 * 
		 * **/
		getCurrTime: function (type, format) {
			var now = new Date();
			var hour = now.getHours() > 9 ? '' + now.getHours() : '0' + now.getHours();
			var min = now.getMinutes() > 9 ? '' + now.getMinutes() : '0' + now.getMinutes();
			var sec = now.getSeconds() > 9 ? '' + now.getSeconds() : '0' + now.getSeconds();
			if (arguments.length == 0) {
				return hour + min;
			} else {
				if (typeof type == 'boolean') {
					return this.getFormatDate(hour + min, 'hm');
				} else {
					if (type == 'hms') {
						return (format == true) ? this.getFormatDate(hour + min + sec, 'hms') : hour + min + sec;
					} else {
						alert(aljjaMsgObj.paramTypeErr);
					}
				}
			}
		},
		/**현재 일자와 시간을 리턴 ex) 201708231130 
		 * format 값이 있으면 format을 맞춰서
		 * **/
		getCurrDateTime: function (format) {
			return (format) ? this.getFormatDate(this.getDate() + this.getCurrTime('hms'), 'ymdhms') : this.getDate() + this.getCurrTime();
		},
		/**이번주가 몇일부터 몇일까진지 구하여 배열로 리턴 하는 기능
		 * 일요일이 시작, 토요일이 끝
		 * var myWeekDay = date.getDate()+1; 로 수정하면 월요일이 시작 일요일이 끝**/
		getThisWeek: function () {
			var value = [];
			var formatDate = function (date) {
				var myMonth = date.getMonth();
				var myWeekDay = date.getDate();
				myMonth = ((myMonth < 10) ? "0" : "") + myMonth;
				myWeekDay = ((myWeekDay < 10) ? "0" : "") + myWeekDay;
				return myMonth + myWeekDay;
			}
			var now = new Date();
			var nowDayOfWeek = now.getDay();
			var nowDay = now.getDate();
			var nowMonth = now.getMonth() + 1;
			var nowYear = now.getFullYear();
			var weekStartDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek);
			var weekEndDate = new Date(nowYear, nowMonth, nowDay + (6 - nowDayOfWeek));
			value.push(nowYear + formatDate(weekStartDate));
			value.push(nowYear + formatDate(weekEndDate));
			return value;
		},
		/**이번달이 몇일부터 몇일까진지 구해서 배열로 리턴 하는 기능**/
		getThisMonth: function () {
			var value = [];
			var now = new Date();
			var nowYear = now.getFullYear();
			var firstDate, lastDate;
			var formatDate = function (date) {
				var myMonth = date.getMonth() + 1;
				var myWeekDay = date.getDate();
				myMonth = ((myMonth < 10) ? "0" : "") + myMonth;
				myWeekDay = ((myWeekDay < 10) ? "0" : "") + myWeekDay;
				return myMonth + myWeekDay;
			}
			firstDate = new Date(now.getFullYear(), now.getMonth(), 1);
			lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
			value.push(nowYear + formatDate(firstDate));
			value.push(nowYear + formatDate(lastDate));
			return value;
		},
		/**날짜 포멧을 변환해 리턴 하는 기능**/
		getFormatDate: function (originDate, type) {
			var yyyy, mm, dd, hh, mi, ss;
			if (arguments.length == 2) {
				var size = originDate.length;
				if (size > 0) {
					if (size == 14) {
						yyyy = originDate.substring(0, 4);
						mm = originDate.substring(4, 6);
						dd = originDate.substring(6, 8);
						hh = originDate.substring(8, 10);
						mi = originDate.substring(10, 12);
						ss = originDate.substring(12, 14);
					} else if (size == 12) {
						yyyy = originDate.substring(0, 4);
						mm = originDate.substring(4, 6);
						dd = originDate.substring(6, 8);
						hh = originDate.substring(8, 10);
						mi = originDate.substring(10, 12);
					} else if (size == 8) {
						yyyy = originDate.substring(0, 4);
						mm = originDate.substring(4, 6);
						dd = originDate.substring(6, 8);
					} else if (size == 6) {
						hh = originDate.substring(0, 2);
						mi = originDate.substring(2, 4);
						ss = originDate.substring(4, 6);
					} else if (size == 4) {
						hh = originDate.substring(0, 2);
						mi = originDate.substring(2, 4);
					} else {
						alert(aljjaMsgObj.paramLenErr);
						return;
					}
				}
				if (type == "ymdhms") {
					return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mi + ":" + ss;
				} else if (type == "ymdhm") {
					return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mi;
				} else if (type == "ymdh") {
					return yyyy + "-" + mm + "-" + dd + " " + hh;
				} else if (type == "ymd") {
					return yyyy + "-" + mm + "-" + dd;
				} else if (type == "ym") {
					return yyyy + "-" + mm;
				} else if (type == "mdhm") {
					return mm + "-" + dd + " " + hh + ":" + mi;
				} else if (type == "md") {
					return mm + "-" + dd;
				} else if (type == "hm") {
					return hh + ":" + mi;
				} else if (type == "mdh") {
					return mm + "-" + dd + " " + hh + "시";
				} else if (type == "hms") {
					return hh + ":" + mi + ":" + ss;
				} else {
					alert(aljjaMsgObj.paramTypeErr);
					return;
				}
			} else {
				alert(aljjaMsgObj.paramCntErr);
				return;
			}
		},
		/**두 날짜의 차이월수 계산 (파라메터는 2020-12 형식 문자열)**/
		getMonthDiff: function (d1, d2) {
			if (arguments.length == 2) {
				var months;
				months = (d2.getFullYear() - d1.getFullYear()) * 12;
				months -= d1.getMonth();
				months += d2.getMonth();
				return months <= 0 ? 0 : months;
			} else {
				alert(aljjaMsgObj.paramCntErr);
				return;
			}
		},
		/**두 날짜의 차이일수 계산**/
		getDateDiff: function (stDate, edDate) {
			if (arguments.length == 2) {
				stDate = this.getOnlyNumber(stDate);
				edDate = this.getOnlyNumber(edDate);
				var yyyySt = stDate.substring(0, 4);
				var mmSt = stDate.substring(4, 6);
				var ddSt = stDate.substring(6, 8);
				var yyyyEd = edDate.substring(0, 4);
				var mmEd = edDate.substring(4, 6);
				var ddEd = edDate.substring(6, 8);
				var getDateSt = new Date(parseInt(yyyySt), parseInt(mmSt), parseInt(ddSt));
				var getDateEd = new Date(parseInt(yyyyEd), parseInt(mmEd), parseInt(ddEd));
				var getDiffTime = getDateEd.getTime() - getDateSt.getTime();
				return Math.floor(getDiffTime / (1000 * 60 * 60 * 24));
			} else {
				alert(aljjaMsgObj.paramCntErr);
				return;
			}
		},
		/** 분까지 있는 데이터를 받아 minutes 전 후의 데이터를 리턴
		 * AF.getTimeDiff('201711221000', 20) => ["20171122094000", "20171122102000"]
		 *  **/
		getTimeDiff: function (originDate, minutes) {
			var yyyy, mm, dd, hh, mi, ss, returnArray = [];
			yyyy = originDate.substring(0, 4);
			mm = Number(originDate.substring(4, 6)) - 1;
			dd = originDate.substring(6, 8);
			hh = originDate.substring(8, 10);
			mi = originDate.substring(10, 12);
			ss = originDate.substring(12, 14);

			var date = new Date(yyyy, mm, dd, hh, mi, ss);

			var bDate = new Date(Date.parse(date) - minutes * 1000 * 60);
			var aDate = new Date(Date.parse(date) + minutes * 1000 * 60);

			var yyyy, mm, dd, hh, mi;
			yyyy = bDate.getFullYear().toString();
			mm = this.addZero(bDate.getMonth() + 1);
			dd = this.addZero(bDate.getDate());
			hh = this.addZero(bDate.getHours());
			mi = this.addZero(bDate.getMinutes());
			returnArray.push(yyyy + mm + dd + hh + mi + ss);

			yyyy = aDate.getFullYear().toString();
			mm = this.addZero(aDate.getMonth() + 1);
			dd = this.addZero(aDate.getDate());
			hh = this.addZero(aDate.getHours());
			mi = this.addZero(aDate.getMinutes());
			returnArray.push(yyyy + mm + dd + hh + mi + ss);
			return returnArray;
		},
		/**해당 연월의 마지막 일자를 구 하는 기능
		 * ex) 201708  => return 31 **/
		getLastDay: function (date) {
			if (arguments.length != 1) { alert(aljjaMsgObj.paramCntErr); return; }
			if (date.length < 6) { alert(aljjaMsgObj.paramLenErr); return; }
			date = getOnlyNumber(date);
			var dt = new Date(date.substring(0, 4), date.substring(4, 6), 0);
			return dt.getDate();
		},
		/** 요소의 id값을 받아 현재일자 바인딩 함수
		 * id : 현재날짜를 입력할 돔 요소의 id값 
		 * **/
		setDate: function (id, moveDay) {
			if (arguments.length == 1) {
				if (typeof id == 'string') {
					moveDay = 0;
				} else {
					alert(aljjaMsgObj.paramTypeErr);
					return;
				}
			}
			document.getElementById(id).value = this.getDate(moveDay, true);
		},
		/**소수점 처리 
		 * type 이 숫자일 경우 해당 자리수 까지 반올림 하여 표출
		 * type = r : 반올림
		 * type = c : 올림
		 * type = f : 버림
		 * **/
		getDecimal: function (num, type) {
			if (arguments.length != 2) {
				alert(aljjaMsgObj.paramCntErr);
				return;
			} else {
				if (typeof num != 'number') {
					alert(aljjaMsgObj.paramDataErr);
					return;
				}
				if (typeof type == 'number') {
					return num.toFixed(type);
				} else {
					if (type == 'r') {  //반올림
						return Math.round(num);
					} else if (type == 'c') {  //올림
						return Math.ceil(num);
					} else if (type == 'f') {  //버림
						return Math.floor(num);
					} else {
						alert(aljjaMsgObj.paramDataErr);
					}
				}
			}
		},
		/** 문자열에서 숫자값만을 리턴 하는 기능 ex) 2017/01/07 => 20170107 **/
		getOnlyNumber: function (data) {
			var pattern = /[^0-9]/gi;
			data = data.replace(pattern, "");
			return data;
		},
		/** 천단위마다 콤마 추가 ex) 1000 => 1,000 **/
		getCommaNumber: function (number) {
			if (number != undefined) {
				return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			} else {
				return number;
			}
		},
		/** 브라우저명을 구해  리턴  하는 기능 **/
		getBrowser: function () {
			var agent = navigator.userAgent.toLowerCase();
			var browser = '';
			if ((navigator.appName == 'Netscape' && navigator.userAgent.search('Trident') != -1) || (agent.indexOf("msie") != -1)) {
				browser = 'ie';
			} else if (agent.indexOf("chrome") != -1) {
				browser = 'cr';
			} else if (agent.indexOf("safari") != -1) {
				browser = 'sf';
			} else if (agent.indexOf("firefox") != -1) {
				browser = 'ff';
			} else if (agent.indexOf("opera") != -1) {
				browser = 'op';
			}
			return browser;
		},
		/** 접속한 기기가 모바일인지 아닌지 구분  하는 기능 모바일일경우 true, 아니면 false **/
		mobileChk: function () {
			var flag = false;
			var mobileKeyWords = new Array('Mobile', 'iPhone', 'iPod', 'BlackBerry', 'Android', 'Windows CE', 'Windows CE;', 'LG', 'MOT', 'SAMSUNG', 'SonyEricsson', 'Symbian', 'Opera Mobi', 'Opera Mini', 'IEmobile');
			for (var word in mobileKeyWords) {
				if (navigator.userAgent.indexOf(mobileKeyWords[word]) != -1) {
					flag = true;
				}
			}
			return flag;
		},
		/** thead 의 체크박스 선택 시 리스트 체크박스 전체 선택/해제
		 * chkAllEle : input checkbox element (전체체크박스 element)
		 * chkListNm : 전체변경할 체크박스 name**/
		chkboxAll: function (chkAllEle, chkListNm) {
			const chkbox = document.getElementsByName(chkListNm);
			if (chkAllEle.checked == true) {
				for (var i = 0; i < chkbox.length; i++) {
					chkbox[i].checked = true;
				}
			} else {
				for (var i = 0; i < chkbox.length; i++) {
					chkbox[i].checked = false;
				}
			}
		},
		/*문자열에 있는 값들에 어떤 값들이 있는지 askii코드로 판단하는 함수*/
		distStr: function (str) {
			var size = str.length;
			var ascii = "";
			var getCharType = function (char) {
				ascii = char.charCodeAt(0);
				if (ascii == 32) { /*공백*/
					return "blank"
				} else if (ascii >= 48 && ascii <= 57) { /*숫자*/
					return "number"
				} else if (ascii >= 65 && ascii <= 90) { /*영어 대문자*/
					return "upperEng";
				} else if (ascii >= 97 && ascii <= 122) { /*영어 소문자*/
					return "lowerEng";
				} else if ((ascii >= 33 && ascii <= 47)
					|| (ascii >= 58 && ascii <= 64)
					|| (ascii >= 91 && ascii <= 96)
					|| (ascii >= 123 && ascii <= 126)) { /*특수문자*/
					return "spChar";
				} else if (ascii >= 44032 && ascii <= 55203) { /*한글*/
					return "kor"
				} else if (ascii >= 12593 && ascii <= 12622) { /*한글자음*/
					return "vowKor";
				} else if (ascii >= 12623 && ascii <= 12643) { /*한글모음*/
					return "conKor";
				}
			}
			var result = [];
			for (var i in str) {
				var type = getCharType(str[i]);
				if (result.indexOf(type) === -1) result.push(type);
			}
			return (result.length === 1) ? result[0] : result;
		},
		/** 초성을 추출해 문자열로 리턴 하는 기능, 공백이나 특수문자, 영문(대소문자)의 경우는 그대로 표출**/
		getChoHangul: function (str) {
			var cho = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
			var result = "", charType = "";
			var size = str.length;
			for (var i = 0; i < size; i++) {
				charType = this.distStr(str[i]);
				if (charType == "kor") {
					var code = str.charCodeAt(i) - 44032;
					if (code > -1 && code < 11172) {
						result += cho[Math.floor(code / 588)];
					}
				} else {
					result += str[i];
				}
			}
			return result;
		},
		getChoMatch: function (keyword, data) {
			var keywordCho = keyword.toLowerCase();
			var dataCho = this.getChoHangul(data).toLowerCase();
			if (keywordCho === "") keywordCho = keyword;
			var strArray = [], resultArray = [];
			var opt = true;
			while (opt) {
				if (i == 20) opt = false;
				var strIdx = dataCho.indexOf(keywordCho);
				if (strIdx !== -1) {
					strArray.push(strIdx);
					dataCho = dataCho.substr(strIdx + keywordCho.length);
				} else {
					opt = false;
				}
			}
			var beforeValue = 0, val = "";
			for (var i in strArray) {
				val = data.substr(strArray[i] + beforeValue, keywordCho.length);
				if (resultArray.indexOf(val) == -1) resultArray.push(val);
				beforeValue += strArray[i] + keywordCho.length;
			}
			return resultArray;
		},
		chgKeywordStr: function (keyword, strArray, tagName) {
			var chgStrArray = [];
			if (typeof keyword !== "undefined" && keyword !== "") {
				var allStr = "";
				var strType = this.distStr(keyword);
				var vowYn = (strType.indexOf("vowKor") !== -1 || strType.indexOf("blank") !== -1) ? true : false;
				if (vowYn) {
					for (var i in strArray) {
						allStr += strArray[i];
					}
					var matchChoArray = this.getChoMatch(keyword, allStr);
					if (matchChoArray.length > 0) {
						for (var i in strArray) {
							var beforeTitl = "";
							for (var j in matchChoArray) {
								chgStrArray[i] = this.highlight(((beforeTitl !== "") ? beforeTitl : strArray[i]), matchChoArray[j], tagName);
								beforeTitl = chgStrArray[i];
							}
						}
					} else {
						for (var i in strArray) {
							chgStrArray[i] = strArray[i];
						}
					}
				} else {
					if (strType == "upperEng" || strType == "lowerEng") {	// 영문일 경우 대문자는 대문자, 소문자는 소문자로 리턴되게 수정
						keyword = (allStr.indexOf(keyword.toLowerCase()) != -1 ? keyword.toLowerCase() : keyword.toUpperCase());
					}
					for (var i in strArray) {
						chgStrArray[i] = this.highlight(strArray[i], keyword, tagName);
					}
				}
			} else {
				for (var i in strArray) {
					chgStrArray[i] = strArray[i];
				}
			}
			return chgStrArray;
		},
		/** byte 크기 구해서 리턴 하는 기능
		 * 매개변수 str : 바이트를 구할 문자열 String **/
		getBytes: function (str) {
			var i, tmp = escape(str);
			var bytes = 0;
			var size = tmp.length;
			for (i = 0; i < size; i++) {
				if (tmp.charAt(i) == "%") {
					if (tmp.charAt(i + 1) == "u") {
						bytes += 2;
						i += 5;
					} else {
						bytes += 1;
						i += 2;
					}
				} else {
					bytes += 1;
				}
			}
			return bytes;
		},
		/**쿠키를 저장한다
		 * cNm : 쿠키명
		 * cVal : 쿠키값
		 * cDay : 쿠키저장 기간, 없을 시 기본 30일
		 * **/
		setCookie: function (cNm, cVal, cDay) {
			var expire = new Date();
			cDay = (cDay == undefined) ? 30 : cDay;
			expire.setDate(expire.getDate() + cDay);
			var cookies = cNm + '=' + escape(cVal) + '; path=/;';
			if (typeof cDay == 'number') {
				cookies += 'expires=' + expire.toGMTString() + ';';
			}
			document.cookie = cookies;
		},
		/** 쿠키명으로 쿠키 값을 가져온다.**/
		getCookie: function (cNm) {
			cNm = cNm + '=';
			var cookieData = document.cookie;
			//indexOf : 배열의 앞에서 부터 검색
			//lastIndexOf : 배열의 뒤에서 부터 검색
			//값이 있다면 해당 인자의 index를 리턴, 없다면 -1을 리턴
			var start = cookieData.indexOf(cNm);
			var cookieValue = '';
			if (start != -1) {
				start += cNm.length;
				var end = cookieData.indexOf(';', start);
				if (end == -1) end = cookieData.length;
				cookieValue = cookieData.substring(start, end);
			}
			return unescape(cookieValue);
		},
		/** 쿠키명으로 쿠키를 삭제 하는 기능**/
		delCookie: function (cNm) {
			var expire = new Date();
			//어제 날짜를 쿠키 소멸 날짜로 설정 하는 기능
			expire.setDate(expire.getDate() - 1);
			document.cookie = cNm + "=; expires=" + expire.toGMTString() + "; path=/";
		},
		/** 요소의 id를 받아 그 내에 있는 주소값에 자동으로 하이퍼링크를 건다.
		 * 텍스트에 http, https, ftp, telnet, new, irc 가 있다면 하이퍼링크
		 * **/
		autoLink: function (id) {
			var container = document.getElementById(id);
			var doc = container.innerHTML;
			var regURL = new RegExp("(http|https|ftp|telnet|news|irc)://([-/.a-zA-Z0-9_~#%$?&=:200-377()]+)", "gi");
			var regEmail = new RegExp("([xA1-xFEa-z0-9_-]+@[xA1-xFEa-z0-9-]+\.[a-z0-9-]+)", "gi");
			container.innerHTML = doc.replace(regURL, "<a href='$1://$2' target='_blank'>$1://$2</a>").replace(regEmail, "<a href='mailto:$1'>$1</a>");
		},
		/**배열을 정렬 하는 기능
		 * 파라메터 : array, sort
		 * array : 배열
		 * sort : 오름차순(asc), 내림차순(desc)
		 * 예시 : aljjaFunc.arraySort(array, 'desc');
		 * **/
		arraySort: function (array, sort) {
			array.sort(function (left, right) {
				if (sort == 'desc') {
					return right - left;
				} else if (sort == 'asc') {
					return left - right;
				}
			});
		},
		/** 배열에서 중복된 데이터를 삭제한 후 배열을 리턴 하는 기능 
		 * 예시 : var aray = aljjaFunc.arrayRemoveOverlap(array);
		 * **/
		arrayRemoveOverlap: function (array) {
			var returnArray = array.reduce(function (a, b) {
				if (a.indexOf(b) < 0) a.push(b);
				return a;
			}, []);
			return returnArray;
		},
		/**배열의 숫자값의 합을 구해서 리턴  하는 기능
		 * 예시 : var total = aljjaFunc.arrayGetSum(array);
		 * **/
		arrayGetSum: function (array) {
			var getSum = function (total, num) {
				return total + num;
			}
			return array.reduce(getSum);
		},
		/** 매개변수 time 시간마다 obj를 반복하는 타이머 시작 기능 
		 * obj : 한개의 함수나 복수의 함수를 배열에 넣어 보낸다.(함수명만 보낸다) 
		 * 예시1 : var timer = aljjaFunc.startTimer(funcNm, 5000);
		 * 예시2 : var timerArray = aljjaFunc.startTimer(funcArray, 5000);
		 * time : millisecond, 1초 1000, 5초 5000
		 * **/
		startTimer: function (obj, time) {
			if (typeof obj == 'function') {
				obj();
				var returnInterval = setInterval(function () {
					obj();
				}, time);
				return returnInterval;
			} else {
				//혹은 Array.isArray(obj)==true이면
				if (Array.isArray(obj) == true) {
					for (var i in obj) {
						if (typeof obj[i] != 'function') {
							alert(aljjaMsgObj.paramErr);
							return;
						}
					}
					var returnIntervalArray = new Array();
					for (var i in obj) {
						obj[i]();
						var timeFunc = function (j) {
							returnIntervalArray[j] = setInterval(function () {
								obj[j]();
							}, time);
						}(i);
					}
					return returnIntervalArray;
				}
			}
		},
		/**타이머 종료 기능
		 * obj : 함수나 배열
		 * 예시1 : aljjaFunc.stopTimer(timer);
		 * 예시2 : aljjaFunc.stopTimer(timerArray);
		 * setInterval을 통해 리턴받은 값에는 number 타입의 값이 저장된다.
		 *  **/
		stopTimer: function (obj) {
			if (typeof obj == 'number') {
				clearInterval(obj);
			} else {
				for (var i in obj) {
					if (typeof obj[i] != 'number') {
						alert(aljjaMsgObj.paramErr);
						return;
					}
				}
				for (var i in obj) {
					clearInterval(obj[i]);
				}
			}
		},
		/**팝업창을 연다.
		 * url : 팝업 호출 url 
		 * height : 팝업 height
		 * width : 팝업 width
		 * loc : 팝업을 띄울 위치 (leftTop : 왼쪽상단, rightTop, 클릭한위치 : point, 사용자설정 : custom)
		 * loc 이 custom 일 경우 left, top을 매개변수로 보낸다. 
		 * 팝업창의 크기가 모니터 사이즈 보다 커질 경우엔 100px 정도 안쪽에 팝업을 띄운다.
		 * 기타 옵션 수정은 aljjaPopObj를 수정 하는 기능
		 * 예시1 : aljjaFunc.openPopup('${ctx}/openPopup.do', 200, 200, 'leftTop');
		 * 예시2 : aljjaFunc.openPopup('${ctx}/openPopup.do', 200, 200, 'custom', 200, 200);
		 * **/
		openPopup: function (url, height, width, loc, cLeft, cTop) {
			var left, top;
			if (loc == "center") {
				left = (screen.availWidth - width) / 2;
				top = (screen.availHeight - height) / 2;
			} else if (loc == "leftTop") {
				left = 0;
				top = 0;
			} else if (loc == "rightTop") {
				left = (screen.availWidth) - (width + 100);
				top = 0
			} else if (loc == "point") {
				var pageWidth = screen.availWidth;
				var pageHeight = screen.availHeight;
				var popWidth = parent.event.clientX + width;
				var popHeight = parent.event.clientY + height;
				left = (popWidth > pageWidth) ? screen.availWidth - (width + 100) : parent.event.clientX;
				top = (popHeight > pageHeight) ? screen.availHeight - (height + 100) : parent.event.clientY + 50;
			} else if (loc == "custom") {
				if (arguments.length != 6) {
					alert(aljjaMsgObj.paramCntErr);
					return;
				} else {
					left = cLeft;
					top = cTop;
				}
			}
			window.open(url,
				this.aljjaPopObj.target,
				"height=" + height
				+ ",width=" + width
				+ ",left=" + left
				+ ",top=" + top
				+ ",scrolbars=" + this.aljjaPopObj.scrollbars
				+ ",resizable=" + this.aljjaPopObj.resizable
				+ ",status=" + this.aljjaPopObj.status
				+ ",toolbar=" + this.aljjaPopObj.toolbar
				+ ",titlebar=" + this.aljjaPopObj.titlebar
				+ ",location=" + this.aljjaPopObj.location
				+ ",menubar=" + this.aljjaPopObj.menubar
			);
		},
		/**첫번째 요소에 포커스
		 * 예시 : aljjaFunc.focusFirstEle('input');
		 * **/
		focusFirstEle: function (element) {
			document.getElementsByTagName(element)[0].focus();
		},
		/**자식 요소의 값을 초기화  하는 기능
		 * input type=text : 값을 비운다. 
		 * input type=password : 값을 비운다.
		 * input type=checkbox : 선택을 해제 하는 기능
		 * input type=radio : name을 기준으로 첫번째 값을 선택 하는 기능
		 * select : 첫번째 옵션값 선택 하는 기능
		 * date 타입은 추후 적용 예정
		 * 예시 : aljjaFunc.initChildEle('frm');
		 * **/
		initChildEle: function (id) {
			var element = document.getElementById(id);
			if (element.hasChildNodes()) {
				var children = element.childNodes;
				for (var i = 0; i < children.length; i++) {
					var type = children[i].type;
					var child = children[i];
					if (type != undefined) {
						if (type == 'text') child.value = '';
						if (type == 'password') child.value = '';
						if (type == 'checkbox') child.checked = false;
						if (type == 'select-one') child.options[0].selected = true;
						if (type == 'radio') child.checked = false;
					}
				}
			}
		},
		/**개체에 키 입력 이벤트를 추가 하는 기능
		 * element : 개체
		 * key : enter(13), space(32)...
		 * funcNm : 키를 눌렀을때 실행할 함수명
		 * 예시 : aljjaFunc.keyPressEvent('pw', 'enter', loginCheck);
		 * **/
		keyPressEvent: function (id, key, func) {
			if (arguments.length == 3) {
				this.aljjaModeObj.keyPressMode = 'on';
				if (this.aljjaModeObj.keyPressMode == 'on') {
					this.addEvent(id, 'keypress', function (e) {
						if (key.toLowerCase() == 'enter') {
							if (e.keyCode == 13) {
								func();
							}
						} else if (key.toLowerCase() == 'space') {
							if (event.keyCode == 32) {
								func();
							}
						}
					});
				}
			} else {
				alert(aljjaMsgObj.paramCntErr);
			}
		},
		/**
		 * 매개변수로 받은 id 를 모달팝업으로 세팅한다.
		 * **/
		setModalPopup: function (id) {
			var modalPop = document.getElementById(id);
			modalPop.style.position = 'absolute';
			modalPop.style.display = 'none';
			modalPop.style.zIndex = 9001;
		},
		/**
		 * 모달팝업을 열고 닫는다. open/close Modal Popup 
		 * **/
		ocModalPopup: function (id, flag) {
			var modalPop = document.getElementById(id);
			if (modalPop.style.display == "none") {
				//팝업을 중앙에 위치
				var left = (window.innerWidth / 2) - (this.getOnlyNumber(modalPop.style.width) / 2);
				var top = ((window.innerHeight / 2) - ((this.getOnlyNumber(modalPop.style.height) - 70) / 2) - 100);
				modalPop.style.left = left;
				modalPop.style.top = top;
				if (flag) this.createBgLayer(id);
				modalPop.style.display = 'block';
			} else {
				if (flag) this.clearBgLayer(id);
				modalPop.style.display = 'none';
			}
		},
		/**
		 * 모달팝업의 백그라운드 레이어를 생성한다.
		 * 고려사항
		 * 1. 화면 리사이즈시 배경 사이즈 변하도록.
		 * 2. 팝업창은 화면 가운데 생성. 리사이즈 되어도 가운데 출력.
		 * 3. 모달팝업 오픈시 스크롤을 없앤다./닫으면 생성필요시 생성.
		 * **/
		createBgLayer: function (id) {
			var modalPop = document.getElementById(id);
			var background = document.querySelector('.aljjaBgLayer');
			if (background == null) {
				var bg = document.createElement('div');
				bg.classList.add('aljjaBgLayer');
				bg.style.display = 'none';
				bg.style.position = 'fixed';
				bg.style.top = 0;
				bg.style.left = 0;
				bg.style.width = '100%';
				bg.style.height = '100%';
				bg.style.backgroundColor = '#000';
				bg.style.opacity = 0.5;
				bg.style.filter = 'alpha(opacity=50)';
				bg.style.zIndex = 9000;
				bg.style.display = 'block';
				document.body.style.overflow = 'hidden';
				document.body.appendChild(bg);
			} else {
				document.body.style.overflow = 'hidden'; /*스크롤 제거*/
				background.style.display = 'block';
			}
		},
		/**
		 * 모달팝업의 백그라운드 레이어를 제거한다.
		 * **/
		clearBgLayer: function (id) {
			var modalPop = document.getElementById(id);
			var background = document.querySelector('.aljjaBgLayer');
			document.body.style.overflow = 'auto';
			if (background != null) {
				background.style.display = 'none';
			}
		},
		/* calendar 함수를 쓰기 위해서는 jquery-ui-1.10.3.custom.js 필요 
		 * datepicker는 jquery library 라 제거*/

		//			calendar : function(dateId){
		//				document.getElementById(dateId).datepicker({
		//			        changeMonth: true, 
		//			        changeYear: true,
		//			        nextText: '다음 달',
		//			        prevText: '이전 달', 
		//			        dateFormat: 'yy-mm-dd',
		//			        dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
		//			        dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'], 
		//			        monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
		//			        monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
		//					showAnim : "slideDown",
		//			    });
		//			},

		setMultiCombo: function (id) {
			var div = document.getElementById(id);
			div.className = "af_multi_combo_div"
			div.style = "position:relative; display:inline-block; width:250px;";

			var selDiv = document.createElement("div");
			selDiv.id = "sel_box";
			selDiv.innerHTML = "<select style='width:100%;'><option value=''>전체</option></select>";

			var cmDiv = document.createElement("div");
			cmDiv.id = "cm_box";
			cmDiv.style = "display: none; width:100%; max-height: 335px; position: absolute; border: 1px solid #c2c2c2; background-color: #fff; z-index: 99;";
			cmDiv.innerHTML = "<div class='mc_chkBox' style='padding: 5px; height: calc(100% - 35px); overflow-y: auto; max-height: 300px;'></div>";

			div.appendChild(selDiv);
			div.appendChild(cmDiv);

			var ocBtn = document.createElement("div");
			selDiv.appendChild(ocBtn);

			ocBtn.style = "position:absolute; left:0; right:0; top:0; bottom:0; cursor:pointer;";
			ocBtn.addEventListener("click", function (e) {
				e.stopPropagation();

				var left = this.parentElement.offsetLeft;
				var top = this.parentElement.offsetTop;

				cmDiv.style.top = this.clientHeight + top + 1 + "px";
				cmDiv.style.left = left + "px";
				cmDiv.style.width = this.clientWidth + "px";

				if (cmDiv.style.display != "none") {
					cmDiv.style.display = "none";
				} else {
					cmDiv.style.display = "block";
				}
			});

			var txtbx = document.createElement("div");
			cmDiv.appendChild(txtbx);

			txtbx.className = "mc_txtBox";
			txtbx.style = "padding: 5px; width: 100%; height: 35px;";

			var btn = document.createElement("input");
			txtbx.appendChild(btn);

			btn.style = "width:100%; margin:0 auto;"
			btn.type = "button";
			btn.value = "적용";
			btn.addEventListener("click", function (e) {
				e.stopPropagation();

				var keyArray = [], valueArray = [];
				var inpList = div.querySelectorAll(".mc_chkBox input");

				Array.prototype.forEach.call(inpList, function (chkInput, i) {
					if (chkInput.checked && chkInput.id != "mc_all_" + id) {
						keyArray.push(chkInput.id.split("_").pop());
						valueArray.push(chkInput.parentElement.querySelector("span").innerHTML);
					}
				});

				var option = selDiv.querySelector("option");
				option.value = keyArray.toString();
				option.innerHTML = (valueArray.toString() ? valueArray.toString() : "전체");

				cmDiv.style.display = "none";
			});

			document.body.addEventListener("click", function (e) {
				if (cmDiv.style.display == "block") {
					var ele = e.target;
					var elepp = ele.parentElement.parentElement;
					var tgList = [ele, ele.parentElement, elepp, elepp.parentElement];
					if (tgList.indexOf(cmDiv) == -1) {
						cmDiv.style.display = "none";
					}
				}
			});
		},

		setMtCbData: function (id, data) {
			var html = "<label for='mc_all_" + id + "'><input type='checkbox' id='mc_all_" + id + "'><span>전체</span></label>";
			if (data && data.length > 0) {
				for (var i in data) {
					html += "<label for='mc_" + data[i].cbKey + "'>";
					html += "<input type='checkbox' class='mc_chk_" + id + "' id='mc_" + data[i].cbKey + "'>";
					html += "<span>" + data[i].cbValue + "</span></label>";
				}
			}
			document.querySelector("#" + id + " #cm_box .mc_chkBox").innerHTML = html;

			document.getElementById("mc_all_" + id).addEventListener("change", function (e) {
				var chkall = this;
				var chkinp = document.querySelectorAll("#" + id + " #cm_box .mc_chkBox .mc_chk_" + id);
				Array.prototype.forEach.call(chkinp, function (input) {
					input.checked = (chkall.checked ? true : false);
				});
			});
		},
		setMtCbKey: function (id, cbKey) {
			var div = document.getElementById(id);
			var key = "mc_" + cbKey;
			var value = div.querySelector(".mc_chkBox #" + key).parentElement.querySelector("span").innerHTML;
			var option = div.querySelector("#sel_box option");
			option.value = (value ? key : "");
			option.innerHTML = (value ? value : "전체");
		},
		getMtCbKey: function (id) {
			return document.querySelector("#" + id + " #sel_box select").value;
		},
		getMtCbValue: function (id) {
			var dom = document.querySelector("#" + id + " #sel_box select").options;
			return dom[dom.selectedIndex].textContent;
		},
		setDragPopup: function (selector) {
			var elmnt = (typeof selector === "string" ? document.getElementById(selector) : selector);

			var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
			if (document.getElementById(elmnt.id + "header")) {
				// if present, the header is where you move the DIV from:
				document.getElementById(elmnt.id + "header").style.cursor = "pointer";
				document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
			} else {
				// otherwise, move the DIV from anywhere inside the DIV:
				elmnt.onmousedown = dragMouseDown;
			}

			function dragMouseDown(e) {
				e = e || window.event;
				e.preventDefault();
				// get the mouse cursor position at startup:
				pos3 = e.clientX;
				pos4 = e.clientY;
				document.onmouseup = closeDragElement;
				// call a function whenever the cursor moves:
				document.onmousemove = elementDrag;
			}

			function elementDrag(e) {
				e = e || window.event;
				e.preventDefault();
				// calculate the new cursor position:
				pos1 = pos3 - e.clientX;
				pos2 = pos4 - e.clientY;
				pos3 = e.clientX;
				pos4 = e.clientY;
				// set the element's new position:
				elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
				elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
			}

			function closeDragElement() {
				// stop moving when mouse button is released:
				document.onmouseup = null;
				document.onmousemove = null;
			}
		},
		timeInterval: function (selectId, div) {
			var time = '', month = '', year = '', option = '';
			if (div == 'time') {
				for (var i = 0; i < 24; i++) {
					var hour = '';
					i = i.toString();
					if (i.length < 2) {
						for (var j = 0; j < 2 - i.length; j++) {
							hour += '0' + i;
						}
					} else {
						hour = i;
					}
					time = hour + ':00';
					option += '<option value="' + time + '">' + time + '</option>';
				}
			} else if (div == 'month') {
				option = '';
				for (var i = 1; i <= 12; i++) {
					i = i.toString();
					if (i.length < 2) {
						month = '0' + i + '월';
						i = '0' + i
					} else {
						month = i + '월';
					}
					option += '<option value="' + i + '">' + month + '</option>';
				}
			} else if (div == 'year') {
				var now = new Date();
				var currYear = now.getFullYear();
				option = '';
				for (var i = currYear - 10; i <= currYear + 10; i++) {
					year = i + '년';
					option += '<option value="' + i + '">' + year + '</option>';
				}
			} else if (div == 'weekday') {
				option = '';
				option += '<option value="0">일</option>';
				option += '<option value="1">월</option>';
				option += '<option value="2">화</option>';
				option += '<option value="3">수</option>';
				option += '<option value="4">목</option>';
				option += '<option value="5">금</option>';
				option += '<option value="6">토</option>';
			} else if (div == 'hour') {
				var hour = '';
				option = '';
				for (var i = 0; i < 24; i++) {
					i = i.toString();
					if (i.length < 2) {
						hour = '0' + i;
						i = '0' + i;
					} else {
						hour = i;
					}
					option += '<option value="' + i + '">' + hour + '</option>';
				}
			} else if (div == 'min') {
				var min = '';
				option = '';
				for (var i = 0; i < 60; i++) {
					i = i.toString();
					if (i.length < 2) {
						min = '0' + i;
						i = '0' + i;
					} else {
						min = i;
					}
					option += '<option value="' + i + '">' + min + '</option>';
				}
			}
			document.getElementById(selectId).innerHTML = option;
		},
		/*날짜 시간 등에서 1자리일 경우 0 더하기*/
		addZero: function (data) {
			return (data[1]) ? data : '0' + data[0];
		},
		/*날짜 시간 등에서 1자리일 경우 0 빼기*/
		removeZero: function (data) {
			return (data.substr(0, 1) == 0) ? data.substr(1, 1) : data;
		},
		/*날짜형태를 스트링으로 변환*/
		getDateString: function (date) {
			var yyyy, mm, dd, hh, mi;
			yyyy = date.getFullYear().toString();
			mm = this.addZero(date.getMonth());
			dd = this.addZero(date.getDate());
			hh = this.addZero(date.getHours());
			mi = this.addZero(date.getMinutes());
			return yyyy + mm + dd + hh + mi + "00";
		},
		/*타임스템프를 데이트로 변환*/
		getTimestampToDate: function (timestamp, formatYn) {
			var returnDate = "";
			var date = new Date(timestamp * 1000);
			var chgTimestamp = date.getFullYear().toString()
				+ this.addZero(date.getMonth() + 1)
				+ this.addZero(date.getDate().toString())
				+ this.addZero(date.getHours().toString())
				+ this.addZero(date.getMinutes().toString())
				+ this.addZero(date.getSeconds().toString());
			if (formatYn) {
				returnDate = this.getFormatDate(chgTimestamp, 'ymdhms');
			} else {
				returnDate = chgTimestamp;
			}
			return returnDate;
		},
		/*모든 공백 제거*/
		removeBlank: function (data) {
			data = data.replace(/\n/g, "");//행바꿈제거
			data = data.replace(/(\s*)/g, "");  //모든 공백 제거
			data = data.replace(/\r/g, "");//엔터제거
			return data;
		},
		/*스탑워치 세팅
		 * 			<ul class="timeClock" id="stopwatch">
		 *				<li>00</li>
		 *				<li class="point">:</li>
		 *				<li>00</li>
		 *				<li class="point">:</li>
		 *				<li>00</li>
		 *			</ul>
		 * */
		setStopwatch: function (ulId) {
			if (aljjaStopwatch.id == '') aljjaStopwatch.id = ulId;
			aljjaStopwatch.seconds++;
			if (aljjaStopwatch.seconds >= 60) {
				aljjaStopwatch.seconds = 0;
				aljjaStopwatch.minutes++;
				if (aljjaStopwatch.minutes >= 60) {
					aljjaStopwatch.minutes = 0;
					aljjaStopwatch.hours++;
				}
			}
			var child = document.getElementById(aljjaStopwatch.id).childNodes;
			for (var i = 0; i < child.length; i++) {
				if (i == 1) {
					child[i].textContent = (aljjaStopwatch.hours ? (aljjaStopwatch.hours > 9 ? aljjaStopwatch.hours : "0" + aljjaStopwatch.hours) : "00");
				} else if (i == 5) {
					child[i].textContent = (aljjaStopwatch.minutes ? (aljjaStopwatch.minutes > 9 ? aljjaStopwatch.minutes : "0" + aljjaStopwatch.minutes) : "00");
				} else if (i == 9) {
					child[i].textContent = (aljjaStopwatch.seconds > 9 ? aljjaStopwatch.seconds : "0" + aljjaStopwatch.seconds);
				}
			}
		},
		/*스탑워치 시작*/
		startStopwatch: function () {
			aljjaStopwatch.t = setInterval(this.setStopwatch, 1000);
		},
		/*스탑워치 종료*/
		stopStopwatch: function () {
			clearTimeout(aljjaStopwatch.t);
		},
		/*스탑워치 초기화*/
		clearStopwatch: function () {
			var child = document.getElementById(aljjaStopwatch.id).childNodes;
			for (var i = 0; i < child.length; i++) {
				if (i == 1) {
					child[i].textContent = '00';
				} else if (i == 5) {
					child[i].textContent = '00';
				} else if (i == 9) {
					child[i].textContent = '00';
				}
			}
			aljjaStopwatch.hours = 0, aljjaStopwatch.minutes = 0, aljjaStopwatch.seconds = 0;
		},
		/*새로고침 할 수 있는 키 막기*/
		disturbRefresh: function (div) {
			/*
			 * 8 : backspace
			 * 116 : F5
			 * 17 : ctrl
			 * 82 : r
			 * */
			if (div) {
				window.onkeydown = function () {
					var kcode = event.keyCode;
					if (kcode == 8 || kcode == 116 || kcode == 17 || kcode == 82) {
						if (typeof event == "object") {
							event.keyCode = 0;
						}
						event.returnValue = false;
						return false;
					}
				}
			} else {
				window.onkeydown = null;
			}
		},
		/*백스페이스만 풀기*/
		removeDisturbBackspace: function () {
			window.onkeydown = null;
			window.onkeydown = function () {
				var kcode = event.keyCode;
				if (kcode == 116 || kcode == 17 || kcode == 82) {
					if (typeof event == "object") {
						event.keyCode = 0;
					}
					event.returnValue = false;
					return false;
				}
			}
		},
		/*마우스 오른쪽 버튼 클릭 막기*/
		disturbRightClick: function () {
			document.body.addEventListener('contextmenu', function (e) {
				e.preventDefault();
				alert('마우스 오른쪽 버튼은 사용하실 수 없습니다.');
			});
		},
		/*지도 js 파일로 이동*/

		/*두 좌표 사이의 거리(m값 리턴)*/
		/* 배열의 아래와 같은 2개의 object
		 * var position1 = new daum.maps.LatLng(x,y);
		 * var position2 = new daum.maps.LatLng(x,y);
		 * d.push(position1, position2);
		 * d를 파라메터로 전달.
		 * ib: 127.05685, jb: 37.183661
		 * ib: 127.060016, jb: 37.183951
		 * */
		getDistanceFromLatlng: function (array) {
			var lat1 = array[0].jb;
			var lng1 = array[0].ib;
			var lat2 = array[1].jb;
			var lng2 = array[1].ib;

			function deg2rad(deg) {
				return deg * (Math.PI / 180)
			}
			var r = 6371; //지구의 반지름(km)
			var dLat = deg2rad(lat2 - lat1);
			var dLon = deg2rad(lng2 - lng1);
			var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			var d = r * c; // Distance in km
			return Math.round(d * 1000);
		},
		/*같은 날짜일 경우 시간차를 초로 리턴*/
		getSecondDiff: function (startTime, endTime) {
			if (startTime.substring(0, 4) == endTime.substring(0, 4)) {
				var startDate = new Date(parseInt(startTime.substring(0, 4), 10),
					parseInt(startTime.substring(4, 6), 10) - 1,
					parseInt(startTime.substring(6, 8), 10),
					parseInt(startTime.substring(8, 10), 10),
					parseInt(startTime.substring(10, 12), 10),
					parseInt(startTime.substring(12, 14), 10)
				);
				var endDate = new Date(parseInt(endTime.substring(0, 4), 10),
					parseInt(endTime.substring(4, 6), 10) - 1,
					parseInt(endTime.substring(6, 8), 10),
					parseInt(endTime.substring(8, 10), 10),
					parseInt(endTime.substring(10, 12), 10),
					parseInt(endTime.substring(12, 14), 10)
				);
				var timeGap = new Date(0, 0, 0, 0, 0, 0, endDate - startDate);
				var hour = timeGap.getHours() * 60 * 60;
				var minute = timeGap.getMinutes() * 60;
				var second = timeGap.getSeconds();
				return hour + minute + second;
			} else {
				alert(aljjaMsgObj.paramErr);
			}
		},
		/*시간이 1초식 줄어드는 다운카운트*/
		setCountDown: function (id, sec, min, hr, func) {
			aljjaCountDown.id = id;
			aljjaCountDown.seconds = sec;
			aljjaCountDown.minutes = min;
			aljjaCountDown.stdSeconds = sec;
			aljjaCountDown.stdMinutes = min;
			aljjaCountDown.actionFunc = func;
		},
		/*카운트 시간이 0이되면 setting된 function 이 실행*/
		chkCountDown: function () {
			if (aljjaCountDown.seconds == '00' && aljjaCountDown.minutes == '00') {
				this.stopCountDown();
				if (typeof (aljjaCountDown.actionFunc) === 'function') aljjaCountDown.actionFunc();
			};
		},
		/*시간 다운*/
		doDownCount: function (that) {
			aljjaCountDown.seconds--;
			if (aljjaCountDown.seconds < 0) {
				aljjaCountDown.seconds = 59;
				aljjaCountDown.minutes--;
			}
			this.chkCountDown();
			var child = document.getElementById(aljjaCountDown.id).childNodes;
			for (var i = 0; i < child.length; i++) {
				if (i == 1) {
					child[i].textContent = (aljjaCountDown.minutes ? (aljjaCountDown.minutes > 9 ? aljjaCountDown.minutes : "0" + aljjaCountDown.minutes) : "00");
				} else if (i == 5) {
					child[i].textContent = (aljjaCountDown.seconds > 9 ? aljjaCountDown.seconds : "0" + aljjaCountDown.seconds);
				}
			}
		},
		/*카운트다운 시작*/
		startCountDown: function () {
			var that = this;
			aljjaCountDown.t = setInterval(function () {
				that.doDownCount(that);
			}, 1000);
		},
		/* 카운트다운 종료*/
		stopCountDown: function () {
			clearTimeout(aljjaCountDown.t);
		},
		/* 카운트다운 초기화*/
		clearCountDown: function () {
			var child = document.getElementById(aljjaCountDown.id).childNodes;
			for (var i = 0; i < child.length; i++) {
				if (i == 1) {
					child[i].textContent = "00";
				} else if (i == 5) {
					child[i].textContent = "00";
				}
			}
			aljjaCountDown.hours = aljjaCountDown.stdHours, aljjaCountDown.minutes = aljjaCountDown.stdMinutes, aljjaCountDown.seconds = aljjaCountDown.stdSeconds;
		},
		/*html을 override*/
		html: function (parentId, html) {
			var parent = document.getElementById(parentId);
			parent.innerHTML = html;
		},
		/*부모요소 가장 마지막에 html 추가*/
		append: function (parentId, html) {
			var parent = document.getElementById(parentId);
			/*position
			 * beforebegin : 요소 앞에
			 * afterbegin : 요소안에 가장 첫번째 child
			 * beforeend : 요소안에 가장 마지막 child
			 * afterend : 요소 뒤에
			 * */
			parent.insertAdjacentHTML('beforeend', html);
		},
		/*부모요소 가장 처음에 html 추가*/
		prepend: function (parentId, html) {
			var parent = document.getElementById(parentId);
			parent.insertAdjacentHTML('afterbegin', html);
		},
		/*해당 요소 제거*/
		remove: function (element) {
			element.parentNode.removeChild(element);
		},
		/*모든 자식 요소를 제거*/
		removeChildren: function (id) {
			var parent = document.getElementById(id);
			while (parent.hasChildNodes()) {
				parent.removeChild(parent.firstChild);
			}
		},
		/*부모요소에서 자식요소가 몇번째 요소인지(같은요소등중에) index를 리턴*/
		getIndex: function (element, range) {
			if (!!range) { /*range!=undefined(x)*/
				// range == string 예시) '.classname' 혹은 '#id'의 selector
				if (typeof range === 'string') {
					return Array.prototype.indexOf.call(document.querySelectorAll(range), element);
				} else {
					// range != string : document 객체 자체를 넘긴 경우
					return Array.prototype.indexOf.call(range, element);
				}
			} else {
				var eleArray = Array.prototype.slice.call(element.parentNode.children);
				function isSame(value) {
					return value.tagName == element.tagName;
				}
				eleArray = eleArray.filter(isSame);
				return Array.prototype.indexOf.call(eleArray, element);
			}
		},
		foreach: function (selector, callback) {
			var elelist = (typeof selector === "string" ? document.querySelectorAll(selector) : selector);
			Array.prototype.forEach.call(elelist, function (ele, idx, list) {
				callback(ele, idx, list);
			});
		},
		/*window.onload 중복문제로 인한 함수 공통화 ==> ready function 대신 사용하기 : AF.onload(function(){ });*/
		onload: function (func) {
			var oldonload = window.onload;
			if (typeof window.onload != 'function') {
				window.onload = func;
			} else {
				window.onload = function () {
					if (oldonload) {
						oldonload();
					}
					func();
				}
			}
		},
		/*DOC 추가예정*/
		/*단어 배경색 강조 (param:전체문자열, 단어, 색상) - 색상 default는 노란색*/
		highlight: function (str, keyword, color, tagName) {
			var result = "", background = "#FFFF00", tag = "span";
			if (color != undefined && color != "") background = color;
			if (tagName != undefined && tagName != "") tag = tagName;
			if (str != undefined && str != "") {
				if (keyword != undefined && keyword != "") {
					var span = '<' + tag + ' style="background-color:' + background + '; display:inline;">' + keyword + '</' + tag + '>';
					result = str.replace(new RegExp(keyword, 'gi'), span);
				}
			}
			return result;
		},
		/*eventListener 등록*/
		on: function (selector, eventName, callback) {
			var elements = document.querySelectorAll(selector);
			Array.prototype.forEach.call(elements, function (element, index, array) {
				element.addEventListener(eventName, callback);
			});
		},
		/*class 제어 이벤트 (selector는 string)*/
		removeClass: function (selector, className) {
			var elements = document.querySelectorAll(selector);
			Array.prototype.forEach.call(elements, function (element, index, array) {
				element.classList.remove(className);
			});
		},
		/*select option selected된 option 객체 반환*/
		selected: function (selector) {
			var result;
			var select = document.querySelector(selector);
			if (this.getBrowser() != 'ie') {
				result = select.selectedOptions[0];
			} else {
				result = select.options[select.selectedIndex];
			}
			return result;
		},
		/*context path 값을 얻는다.*/
		getContextPath: function () {
			return window.location.pathname.substring(0, window.location.pathname.indexOf("/", 2))
		},
		createElement: function (tag, id, className, textContent, event, callback) {
			var tag = document.createElement(tag);
			if (typeof id !== "undefined" || id !== "") tag.id = id;
			if (typeof className !== "undefined" || className !== "") tag.className = className;
			if (typeof textContent !== "undefined" || textContent !== "") tag.textContent = textContent;
			if (typeof event !== "undefined" || event !== "") {
				tag.addEventListener(event, callback);
			}
			return tag;
		},
		getStrByteLength: function (str) {
			var stringByteLength = str.replace(/[\0-\x7f]|([0-\u07ff]|(.))/g, "$&$1$2").length;
			return stringByteLength;
		}
	}
	return func;
}();
var AF = new AF();