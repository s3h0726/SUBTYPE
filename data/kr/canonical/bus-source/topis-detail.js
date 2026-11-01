/* =========================================================
 * detail.js v1.0
 * map에서 표시되는 교통정보의 상세 데이터 표출 관련 함수 
 * [팝업layer 생성 등]
 * Copyright 2019 Seoul TOPIS
 * ========================================================== */

/* ********************************************************
 * VMS 팝업 생성
 ******************************************************** */
function openPopupVms(code, name, coordinate, flag, layerGubn) {
	$("#popup-content").empty();	
	$("#popup").removeClass();
	$("#popup").addClass("map_layer");
	$("#popup").addClass("vms");
	
	var html = "";
	html += "\n<div class='tit'><span tabindex='1' id='popupNm'>" + name + "</span></div> ";
	html += "\n<div class='content'> ";
	html += "\n	<div id='formArea' style='position:relative; overflow:hidden; text-align:center;'> ";
	html += "\n		<ul id='vmsForm' style='position:absolute;'> ";
	html += "\n		</ul> ";
	html += "\n		<div class='footer_arrow'> ";
	html += "\n			<div class='bgpopup-closerpopup-closerpopup-closerpopup-closerpopup-closerpopup-closerpopup-closerpopup-closerpopup-closer_right'> ";
	html += "\n			</div> ";
	html += "\n		</div> ";
	html += "\n	</div> ";
	html += "\n</div> ";	

	$("#popup-content").append(html);
	
	//이미지 슬라이드
 	var canvasSize = 0;
	var canvasLen = 0;
	var $list = $('#vmsForm');
	var speed = 3000;
	var timer = null;
	var auto = true;
	var slideCnt = 1;
	var duration = 0;
	
	if (layerGubn == "VMS") {
		//Canvas DIV Setting
		var data = {"sVmsId": code};
		var url = "/map/selectVmsImgCnt.do";
		commonAjax(data, url, callback = function(returnData) {
			if (returnData == null || returnData.rows == undefined) {
				return;
			}
			
			/* ************************************************************************************
				VMS에 따른 이미지 DIV 동적 생성을 위한 html 코딩
				
				<div>		canvasDiv1 ~	: 폼순번(formSeq1~)
				<canvas>	1_1 ~			: 폼순번(formSeq)_영역폼순번(areaFormSeq)
			***************************************************************************************/
			for (var i=0; i<returnData.rows.length; i++) {
				var formSeq = returnData.rows[i].formSeq;			//폼순번
				var areaSeq = returnData.rows[i].areaSeq;			//영역순번 MAX
				var cnt = returnData.rows[i].cnt;					//영역폼갯수 MAX
				var screenRowPx = returnData.rows[i].screenRowPx;	//폼전체 세로픽셀
				var screenColPx = returnData.rows[i].screenColPx;	//폼전체 가로픽셀
				
				canvasSize = screenColPx;
				
				$("#formArea").width(screenColPx);
				$("#formArea").height(screenRowPx);
				
				for (var j=1; j<=cnt; j++) {
					var html = "<li id='canvasDiv" + formSeq + "' class='canvasDiv" + formSeq + "' style='float:left;  width:" + screenColPx + "px; height:" + screenRowPx + "px;'>";
					html += "<canvas id='" + formSeq + "_" + j + "' width=" + screenColPx + " height=" + screenRowPx + "</canvas> " ;
					html += "</li>";
					$("#vmsForm").append(html);
					
					canvasLen++;
				}
			}
			
			//slide
			$list.css('width', canvasLen*canvasSize);
			
			if (auto) timer = setInterval(autoSlide, speed);
			
			function autoSlide() {
				if (slideCnt > canvasLen-1) {
					slideCnt = 0;
				}
				
				$list.animate({'left': -(slideCnt*canvasSize)+'px' }, duration);
	
				slideCnt++;
			}
			//slide
		}, false);	
		
		//Canvas그렸으니 이미지 넣으러 가보자~
		var data = {"sVmsId": code};
		var url = "/map/selectVmsImgList.do";
			  
		commonAjax(data, url, callback = function(returnData) {
			//동적으로 생성된 Canvas에 이미지를 삽입한다.
			for (var i=0; i<returnData.rows.length; i++) {
				var formSeq = 		returnData.rows[i].formSeq;			//폼순번
				var areaSeq = 		returnData.rows[i].areaSeq;			//영역순번
				var areaFormSeq = 	returnData.rows[i].areaFormSeq;		//영역폼순번
				var areaTime = 		returnData.rows[i].areaTime;		//영역표출시간
				var areaLeft = 		returnData.rows[i].areaLeft;		//영역LEFT
				var areaTop = 		returnData.rows[i].areaTop;			//영역TOP
				var areaWidth = 	returnData.rows[i].areaWidth;		//영역WIDTH
				var areaHeight = 	returnData.rows[i].areaHeight;		//영역HEIGHT
				var areaType = 		returnData.rows[i].areaType;		//영역타입
				var screenRow = 	returnData.rows[i].screenRow;		//화면구성_단(Height)
				var screenCol = 	returnData.rows[i].screenCol;		//화면구성_열(Width)
				
				var src = "data:image/jpg;base64," + returnData.rows[i].bmpData;
				
				switch (areaType) {
					case "IMAGE" :
						var findId = formSeq + "_";	//formSeq로 해당 Canvas를 찾기위한 값
						
						$("[id^='" + findId + "']").each(function(index) {	//ex) id가 "1_"로시작하는 걸 찾아서 돌아돌아돌아
							var canvasId = $(this).attr('id');
							var canvas = document.getElementById(canvasId);
							var	context = canvas.getContext('2d');
							var imageObj = new Image();
							imageObj.src = src;
							
							context.drawImage(imageObj, areaLeft, areaTop);
						});
						break;
					case "TEXT" :
						var canvasId = formSeq + "_" + areaFormSeq;
						
						var canvas = document.getElementById(canvasId);
						var	context = canvas.getContext('2d');
						var imageObj = new Image();
						imageObj.src = src;
						
						context.drawImage(imageObj, areaLeft, areaTop);
						break;
					case "VIDEO" :
					case "CCTV" :
						var findId = formSeq + "_";	//formSeq로 해당 Canvas를 찾기위한 값
						
						$("[id^='" + findId + "']").each(function(index) {	//ex) id가 "1_"로시작하는 걸 찾아서 돌아돌아돌아
							var canvasId = $(this).attr('id');
							
							var canvas = document.getElementById(canvasId);
							var	context = canvas.getContext('2d');
							context.font = '30px bold';
							
							//텍스트 가운데 정렬을 위한 x,y 값 구하기.
							var textWidth = context.measureText(areaType).width;
							var x = (canvas.width / 2) - (textWidth / 2);
							var y = canvas.height / 2;
							context.fillText(areaType, x, y);
						});
						break;
				} //end switch(areaType)
			} //end for
		}); //end commonAjax
	} else {
		if(flag){
			var count = 0;
			for (var j=1; j<=10; j++) {
				var img = new Image();
				
				img.onload = function() {
					canvasSize = this.width;
					$("#formArea").width(this.width);
					$("#formArea").height(this.height);
					$(".canvasDiv"+code).width(this.width);
					$(".canvasDiv"+code).height(this.height);
				}
				
				img.onerror = function() {
					
					var src = this.src;
					var seq = src.substring(src.indexOf("msgDispSeq=")+11);
					$("#"+code+"_"+seq).parent().remove();
					
					count ++;
					if(count > 9){
						img.src = "/images/map/vms_topis.png";
	
						var html = "<li id='canvasDiv"+code+"' class='canvasDiv"+code+"' style='float:left;'>";
						html += "<img src='"+img.src+"' id='"+code+"_11'/>" ;
						html += "</li>";
						$("#vmsForm").append(html);
	
					}
					
				}
				
				//img.src = 'http://www.smartway.seoul.kr/cctv/'+flag+'?vmsId='+code+'&msgDispSeq='+j;
				img.src = 'https://smartway.seoul.go.kr/cctv/'+flag+'?vmsId='+code+'&msgDispSeq='+j;
				
				var html = "<li id='canvasDiv"+code+"' class='canvasDiv"+code+"' style='float:left;'>";
				html += "<img src='"+img.src+"' id='"+code+"_"+j+"'/>" ;
				html += "</li>";
				$("#vmsForm").append(html);
	
				}
			
			
			setTimeout(function() {
				canvasLen = $("#vmsForm").children("li").length;
				
				if (canvasLen > 0) {
					$list.css('width', canvasLen*canvasSize);
			
					if (auto) timer = setInterval(autoSlide, speed);
			
					function autoSlide() {
						if (slideCnt > canvasLen-1) {
							slideCnt = 0;
						}
						
						$list.animate({'left': -(slideCnt*canvasSize)+'px' }, duration);
			
						slideCnt++;
					}
				}
			}, 1000);
		} else {
			var img = new Image();
			img.src = "/images/map/vms_topis.png";
			
			img.onload = function() {
				canvasSize = this.width;
				$("#formArea").width(this.width);
				$("#formArea").height(this.height);
				$(".canvasDiv"+code).width(this.width);
				$(".canvasDiv"+code).height(this.height);
			}
			
			var html = "<li id='canvasDiv"+code+"' class='canvasDiv"+code+"' style='float:left;'>";
			html += "<img src='"+img.src+"' id='"+code+"_11'/>" ;
			html += "</li>";
			$("#vmsForm").append(html);

		}

	}
	
	popup.setPosition(coordinate);
	
	//popup close
	closer.onclick = function() {
		clearInterval(timer);
		popup.setPosition(undefined);
		closer.blur();
		return false;
	};
	$("#popupNm").focus();
}

/* ********************************************************
 * 지하철 팝업 생성
 ******************************************************** */
function openPopupSubway(code, coordinate) {
	var arr = code.split("|");
	var statnId = arr[0];
	var subwayId = arr[1];
	
	//if (subwayId == "1099") return; //우이신설선 => 20200727 해제
	
	var apiUrl = "/";
	if (location.href.indexOf("localhost") >= 0 || location.href.indexOf("192") >= 0) { //개발
		apiUrl = "/api/rest/subwayInfo/";
	}
	var type1 = "getStatnById";
	var type2 = "getArvlByInfo";
	var type3 = "getBusByStatn";
	var type4 = "getLastcarByStatn";
	var data = {"url": apiUrl, "statnId": statnId, "subwayId": subwayId, "type1": type1, "type2": type2, "type3": type3, "type4": type4};
	var url = "/map/getSubway.do";
	
	commonAjax(data, url, callback = function(returnData) {
		$("#popup").removeClass();
		$("#popup").addClass("map_layer");
		$("#popup").addClass("train");
		
		if (returnData != null && returnData.rows1 != undefined && returnData.rows1.length > 0) {
			var data1 = returnData.rows1[0];
			var data2 = returnData.rows2;
			var data3 = returnData.rows3;
			var data4 = returnData.rows4;
			var data5 = returnData.rows5;
			
			var htmCont = "";
			
			htmCont += "\n<div class='tit'><strong>" + data1.statnNm + " ( <i style='padding-left:15px; background:url(/common/img/map/ico_call.png) 0 4px no-repeat;'>" + data1.telNo + "</i> )</strong></div> ";
			
			htmCont += "\n<div class='content'> ";
			
			htmCont += "\n	<div class='stationBox " + getSubwayClass(data1.subwayNm) + "'> ";
			htmCont += "\n		<div class='st_prev'><a href='#' onclick='moveStation("+data1.statnFid+", "+data1.subwayId+", "+data1.x+", "+data1.y+")'>" + data1.statnFnm + "</a></div> ";
			htmCont += "\n		<div class='st_name'><span class='i_train'>"+ data1.subwayNm + "</span><strong>" + data1.statnNm + "</strong></div> ";
			htmCont += "\n		<div class='st_next'><a href='#' onclick='moveStation("+data1.statnTid+", "+data1.subwayId+", "+data1.x+", "+data1.y+")'>" + data1.statnTnm + "</a></div> ";
			htmCont += "\n	</div> ";
			htmCont += "\n	<ul class='tabs'> ";
			htmCont += "\n		<li class='active'><a href='#layer_traintabs1' onclick='trainTabs($(this));return false;'>도착정보</a></li> ";
			htmCont += "\n		<li><a href='#layer_traintabs2' onclick='trainTabs($(this));return false;'>기본정보</a></li> ";
			htmCont += "\n		<li class='last'><a href='#layer_traintabs3' onclick='trainTabs($(this));return false;'>출구정보</a></li> ";
			htmCont += "\n	</ul> ";
			
			htmCont += "\n	<div id='layer_traintabs1' class='trainInfor' style='display:block; width:100%;'> ";
			htmCont += "\n		<table class='tby02'> ";
			htmCont += "\n			<caption>지하철도착정보</caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:50%'/> ";
			htmCont += "\n				<col style='width:auto'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<thead> ";
			htmCont += "\n				<tr> ";
			htmCont += "\n					<th scope='col' style='background-color: #f3f5f8;'>" + data1.statnFnm + "</th> ";
			htmCont += "\n					<th scope='col' style='background-color: #f3f5f8;'>" + data1.statnTnm + "</th> ";
			htmCont += "\n				</tr> ";
			htmCont += "\n			</thead> ";
			htmCont += "\n			<tbody> ";
			htmCont += "\n				<tr> ";
			htmCont += "\n					<td> ";
			if (data2.length > 0) {
			   for (var i=0; i<data2.length; i++) {
				   if (data2[i].updnLine == '하행' || data2[i].updnLine == '내선') {
					   var bStatnNm = data2[i].bStatnNm.indexOf("-1") > -1 ? "" : data2[i].bStatnNm;
					   htmCont += "<p class='mb5'><span>" + bStatnNm + "</span>" + fn_getArrmsg2(data2[i].arvlMsg2) + "</p>";
				   }
			    }
        	} else { // 운행정보 없음
        		htmCont += "<p class='mb5'>운행정보없음</p>";
        	}
			htmCont += "\n					</td> ";
			htmCont += "\n					<td> ";
			if (data2.length > 0) {
			   for (var i=0; i<data2.length; i++) {
				   if (data2[i].updnLine == '상행' || data2[i].updnLine == '외선') {
					   var bStatnNm = data2[i].bStatnNm.indexOf("-1") > -1 ? "" : data2[i].bStatnNm;
					   htmCont += "<p class='mb5'><span>" + bStatnNm + "</span>" + fn_getArrmsg2(data2[i].arvlMsg2) + "</p>";
				   }
			    }
        	} else { // 운행정보 없음
        		htmCont += "<p class='mb5'>운행정보없음</p>";
        	}
			htmCont += "\n					</td> ";
			htmCont += "\n				</tr> ";
			htmCont += "\n			</tbody> ";
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";
			
			htmCont += "\n	<div id='layer_traintabs2' class='trainInfor scroll' style='width:100%;'> ";
			htmCont += "\n		<table class='tby03 txtC min'> ";
			htmCont += "\n			<caption>지하철기본정보</caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:18%'/> ";
			htmCont += "\n				<col style='width:auto'/> ";
			htmCont += "\n				<col style='width:20%'/> ";
			htmCont += "\n				<col style='width:20%'/> ";
			htmCont += "\n				<col style='width:20%'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<thead> ";
			htmCont += "\n				<tr> ";
			htmCont += "\n					<th scope='col'>첫/막차</th> ";
			htmCont += "\n					<th scope='col'>방면</th> ";
			htmCont += "\n					<th scope='col'>평일</th> ";
			htmCont += "\n					<th scope='col'>토요일</th> ";
			htmCont += "\n					<th scope='col'>일&middot;공휴일</th> ";
			htmCont += "\n				</tr> ";
			htmCont += "\n			</thead> ";
			htmCont += "\n			<tbody> ";
			data4 = sortJSON(data4, 'lastcarNm', '321');
			if (data4.length > 0) {
				for(i=0;i<data4.length;i++) {
				htmCont += "\n				<tr> ";
				htmCont += "\n					<td>" + data4[i].lastcarNm + "</td> ";
				htmCont += "\n					<td>" + data4[i].statnNm + "</td> ";
				htmCont += "\n					<td>" + data4[i].arvlHm1 + "</td> ";
				htmCont += "\n					<td>" + data4[i].arvlHm2 + "</td> ";
				htmCont += "\n					<td>" + data4[i].arvlHm3 + "</td> ";
				htmCont += "\n				</tr> ";
				}
			} else {
				htmCont += "\n          <tr>";
				htmCont += "\n          	<td colspan='5' style='text-align:center'>첫차/막차 정보가 없습니다.</td>";
				htmCont += "\n          </tr>";
			}
			htmCont += "\n			</tbody> ";
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";
			
			htmCont += "\n	<div id='layer_traintabs3' class='trainInfor scroll' style='width:100%;'> ";
			htmCont += "\n		<table class='tby03 min'> ";
			htmCont += "\n			<caption>지하철출구정보</caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:100px'/> ";
			htmCont += "\n				<col style='width:auto'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<tbody> ";
			htmCont += "\n				<tr>";
			htmCont += "\n					<th>출구번호</th>";
			htmCont += "\n					<th>출구정보</th>";
			htmCont += "\n				</tr>";
			if (data5.length != null) {
				for (var j=0; j<data5.length; j++) {
					htmCont += "\n				<tr>";
					htmCont += "\n					<th>" + data5[j].exitNum + "</th>";
					htmCont += "\n					<td style='text-align:left;'>" + data5[j].exitInfo + "</td>";
					htmCont += "\n				</tr>";
				}
			}
			htmCont += "\n			</tbody> ";
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";
			
			htmCont += "\n</div>";
			
			htmCont += "\n</div>";
		
			content.innerHTML = htmCont;
			popup.setPosition(coordinate);
			//map.getView().setCenter(coordinate);
		}
	});
}

/* ********************************************************
 * 지하철 팝업 이동
 ******************************************************** */
function moveStation(stnId, subwayId, x, y) {
	var code = stnId + "|" + subwayId;
	
	var data = {"sStationId": stnId};
	var url = "/map/selectSubwayInfo.do";
	
	commonAjax(data, url, callback = function(returnData) {
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows[0];
			var posX = data.posX;
			var posY = data.posY;
			var coordinate = [parseFloat(posX), parseFloat(posY)];
			
			openPopupSubway(code, coordinate);
		} else {
			alert("지하철 정보가 없습니다.");
			return;
		}
	});
}

/* ********************************************************
 * 지하철 노선별 CSS 클래스명
 ******************************************************** */
function getSubwayClass(subwayNm) {
	rtVal = "line1";
	
	if (subwayNm == "1호선") 		rtVal = "line1";
	if (subwayNm == "2호선") 		rtVal = "line2";
	if (subwayNm == "3호선") 		rtVal = "line3";
	if (subwayNm == "4호선") 		rtVal = "line4";
	if (subwayNm == "5호선") 		rtVal = "line5";
	if (subwayNm == "6호선") 		rtVal = "line6";
	if (subwayNm == "7호선") 		rtVal = "line7";
	if (subwayNm == "8호선") 		rtVal = "line8";
	if (subwayNm == "9호선") 		rtVal = "line9";
	if (subwayNm == "분당선") 	rtVal = "line10";
	if (subwayNm == "인천선") 	rtVal = "line11";
	if (subwayNm == "인천1호선") 	rtVal = "line11";
	if (subwayNm == "신분당선") 	rtVal = "line12";
	if (subwayNm == "경의중앙선") 	rtVal = "line13";
	if (subwayNm == "경춘선") 	rtVal = "line14";
	if (subwayNm == "공항철도") 	rtVal = "line15";
	if (subwayNm == "의정부선") 	rtVal = "line16";
	if (subwayNm == "에버라인선") 	rtVal = "line17";
	if (subwayNm == "수인분당선") 	rtVal = "line18";
	
	return rtVal;
}

function fn_getArrmsg2(arrmsg2) {
	var newArrmsg1 = arrmsg2.indexOf("분");
	var newArrmsg2 = arrmsg2.indexOf("후 (");
	
	if (newArrmsg2 < 0) {
		return arrmsg2;
	} else {	
		return arrmsg2.substring(0, newArrmsg1+1) + " " + arrmsg2.substring(newArrmsg2);
	}
}

/* ********************************************************
 * 따릉이 팝업 생성
 ******************************************************** */
function openPopupBic(feature, coordinate) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	
	var data = {"bicRackId": code};
	var url = "/map/selectBicInfo.do";
	
	commonAjax(data, url, callback = function(returnData) {
		$("#popup").removeClass();
		$("#popup").addClass("map_layer");
		$("#popup").addClass("bike");
		
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows[0];
			var htmCont = "";
			
			htmCont += "\n<div class='tit'><strong tabindex='1' id='popBicRackNm'>" + data.bicRackNm + "</strong></div> ";
			htmCont +="<div class='content'> ";
			htmCont +="	<table class='tby01'> ";
			/*htmCont +="		<caption>" + data.bicRackNm + "</caption> ";*/
			htmCont +="			<colgroup> ";
			htmCont +="				<col style='width:90px'/> ";
			htmCont +="				<col style='width:*'/> ";
			htmCont +="				<col style='width:90px'/> ";
			htmCont +="				<col style='width:*'/> ";
			htmCont +="			</colgroup> ";
			htmCont +="		<tbody> ";
			htmCont +="			<tr> ";
			htmCont +="				<td colspan='4' class='last'>" + data.addr + "</td> ";
			htmCont +="			</tr> ";
			htmCont +="			<tr> ";
			htmCont +="				<th class='last'>따릉이 수</td> ";
			htmCont +="				<td class='last' style='text-align:center'>" + data.parkingBikeTotCnt + "</td> ";
			htmCont +="				<th class='last'>거치대 수</td> ";
			htmCont +="				<td class='last' style='text-align:center'>"  + data.rackTotCnt + "</td> ";
			htmCont +="			</tr> ";
			htmCont +="		</tbody> ";
			htmCont +="	</table> ";
			htmCont +="</div> ";
			
			content.innerHTML = htmCont;
			popup.setPosition(coordinate);
			$("#popBicRackNm").focus();
		} else {
			alert("따릉이 정보가 존재하지 않습니다.");
		}
	});
}

/* ********************************************************
 * 돌발 팝업 생성
 ******************************************************** */
function openPopupAcc(feature, coordinate) {
	
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	var linkId = feature.linkId == undefined ? feature.get('linkId') : feature.linkId;
	
	var data = {"accId": code};
	var url = "/map/selectAccList.do";
	
	var accImg = [], accMsg = [];
	var accMsgLen = 0;
	var chnId = "";
	var hlsUrl = "";
	var cctvDispYn = "";
	
	// 돌발진행정보(트위터등록) 조회
	commonAjax(data, "/com/sns/selectSnsInfoList.do", callback = function(returnData) {
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			for (var i=0; i<returnData.rows.length; i++) {
				accMsg.push(returnData.rows[i].snsMsg);
				accImg.push(returnData.rows[i].snsImg);
			}
		}
		accMsgLen = accMsg.length;
	}, false);
	
	// 돌발 팝업
	commonAjax(data, url, callback = function(returnData) {
		$("#popup").removeClass();
		$("#popup").addClass("map_layer");
		$("#popup").addClass("unex");
		
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows[0];
			var htmCont = "";
			cctvDispYn = data.cctvDispYn;
			var cctvName = "&nbsp;";
			if (data.cctvName != null) {
				cctvName = "[ CCTV ] " +data.cctvName;
			}
			
			htmCont += " <div class='toggle'> ";
			htmCont += " 	<div tabindex='1' class='switcher'> ";
			htmCont += " 		<input type='radio' name='accViewType' value='on' id='on' class='switcher__input switcher__input--on' checked=''> ";
			htmCont += " 		<label for='on' class='switcher__label'>돌발진행정보</label> ";
			htmCont += " 		<input type='radio' name='accViewType' value='off' id='off' class='switcher__input switcher__input--off'> ";
			htmCont += " 		<label for='off' class='switcher__label'>CCTV</label> ";
			htmCont += " 		<span class='switcher__toggle'></span> ";
			htmCont += " 	</div> ";
			htmCont += " </div> ";
			htmCont += " <div class='tit'> ";
			htmCont += " 	<div style='float: left; width: 645px'><strong tabindex='1' id='popCctvName'>[ " + data.roadNm + " - " + data.accTypeNm + " ]</strong> </div><strong>" + cctvName + "</strong></div> ";
			htmCont += " 	<div class='content'> ";
			htmCont += " 		<table class='tby01'> ";
			htmCont += " 			<caption>" + data.roadNm + "돌발정보</caption> ";
			htmCont += "			<colgroup> ";
			htmCont += "				<col style='width:100px'/> ";
			htmCont += "				<col style='width:auto'/> ";
			htmCont += "				<col style='width:520px'/> ";
			htmCont += "			</colgroup> ";
			htmCont += "			<tbody> ";
			htmCont += "				<tr> ";
			htmCont += "					<th scope='row' style='height: 38px;'>기간</th> ";
			htmCont += "					<td style='height: 38px;'>" + data.occrDt + " ~ " + data.clrDt +"</td> ";
			htmCont += "					<td tabindex='1' class='last' rowspan='5' style='height: 342px; text-align: center;'> ";
			htmCont += "						<div id='accInfoSlick' style='width:450px; margin:0 auto;'>";
			if (accMsgLen > 0){
				for (var j=0; j<accMsgLen; j++){
					htmCont += " 					<div>"
					htmCont += " 						<img style='width:450px;height:250px;' src='data:image/png;base64, "+accImg[j]+"'/> ";
					htmCont += "						<span style='display:inline-block; width:450px; word-break:keep-all;'>" +accMsg[j].substring(0, accMsg[j].indexOf("https")) + "</span>" ;
					htmCont += " 					</div>";
				}
			} else {
				htmCont += "<div style='text-align:center;padding:70px 170px;'>돌발진행정보 없음</div>";
			}
			htmCont += "						</div>";
			if (cctvDispYn == "N") {
				htmCont += "                        <div id='noCctvInArea' style='text-align:center;padding:70px 170px;'>주변 CCTV가 없습니다.</div>";
			} else {
				htmCont += "						<div id='videoInfos' class='tab_content'><video width=500 height=300 id='video' controls muted></video> ";
				htmCont += "						※ 현장과 가장 인접한 CCTV영상입니다.</div>"; 
			}
			htmCont += " 					</td> ";
			htmCont += "				</tr> ";
			htmCont += "				<tr> ";
			htmCont += "					<th scope='row' style='height: 38px;'>돌발유형</th> ";
			htmCont += "					<td style='height: 38px;'>" + data.accTypeNm + "(" + data.accDtypeNm + ")</td> "; //class='last' 
			htmCont += "				</tr> ";
			htmCont += "				<tr> ";
			htmCont += "					<th scope='row' style='height: 65px;'>도로</th> ";
			htmCont += "					<td style='height: 65px;'>" + data.linkNm + "</td> "; //class='last' 
			htmCont += "				</tr> ";
			htmCont += "				<tr> ";
			htmCont += "					<th scope='row' style='height: 38px;'>통제여부</th> ";
			htmCont += "					<td style='height: 38px;'>" + data.accRoadYn + "</td> "; //class='last' 
			htmCont += "				</tr> ";
			htmCont += "				<tr> ";
			htmCont += "					<td colspan='2' style='vertical-align: top;'>" + data.accInfo + "</td> "; //class='last' 
			htmCont += "				</tr> ";
			htmCont += "			</tbody> ";
			htmCont += "		</table> ";
			htmCont += "	</div> ";
			htmCont += " </div> ";
			
			content.innerHTML = htmCont;
			
			if (accMsg.length > 0){ // 돌발진행정보(트위터등록)가 있을 때
				$("#accInfoSlick").css("display", "block");
				$("#videoInfos").css("display", "none");
				$("#noCctvInArea").css("display", "none");
			} else { // 돌발진행정보 없을때
				$('input:radio[name="accViewType"]:radio[value="off"]').prop("checked", true);
				
				if(cctvDispYn == "N"){
					$("#accInfoSlick").css("display", "none");
					$("#videoInfos").css("display", "none");
					$("#noCctvInArea").css("display", "block");
				} else {
					if (data.chnId == null || data.hlsUrl == null) {
						$("#videoInfos").html("CCTV 없음");
					} else {
						playCctv('video', data.hlsUrl, true);
					}
					$("#accInfoSlick").css("display", "none");
					$("#videoInfos").css("display", "block");
				}
			}
			
			var coordiX, coordiY;
			var currLevel = map.getView().getZoom();
			
			if (currLevel < 6){
				coordiX = coordinate[0] + 16000;
				coordiY = coordinate[1] - 11200;
			} else if (currLevel == 6){
				coordiX = coordinate[0] + 8000;
				coordiY = coordinate[1] - 5600;
			} else if (currLevel == 7){
				coordiX = coordinate[0] + 4000;
				coordiY = coordinate[1] - 2800;
			} else if (currLevel == 8) {
				coordiX = coordinate[0] + 2000;
				coordiY = coordinate[1] - 1400 ;
			} else if (currLevel == 9) {
				coordiX = coordinate[0] + 1000;
				coordiY = coordinate[1] - 700 ;
			} else if (currLevel == 10) {
				coordiX = coordinate[0] + 500;
				coordiY = coordinate[1] - 350 ;
			} else if (currLevel == 11) {
				coordiX = coordinate[0] + 250;
				coordiY = coordinate[1] - 175 ;
			} else if (currLevel == 12) {
				coordiX = coordinate[0] + 125;
				coordiY = coordinate[1] - 88 ;		
			} else if (currLevel == 13) {
				coordiX = coordinate[0] + 63;
				coordiY = coordinate[1] - 44 ;						
			} else {
				coordiX = coordinate[0];
				coordiY = coordinate[1];
			}

			popup.setPosition(coordinate);
			map.getView().setCenter([parseFloat(coordiX), parseFloat(coordiY)]);
			
			chnId = data.chnId;
			hlsUrl = data.hlsUrl;
			
		} else {
			alert("돌발 정보가 존재하지 않습니다.");
		}
	}, false);
	
	$('input:radio[name="accViewType"]').on("click", function(){
		if ($('input:radio[name="accViewType"]:checked').val() == "on"){ //'돌발진행정보' 탭 선택
		
			$("#accInfoSlick").css("display", "block");
			$("#videoInfos").css("display", "none");
			$("#noCctvInArea").css("display", "none");
		} else { //'CCTV' 탭 선택
			if(cctvDispYn == "N"){
				$("#accInfoSlick").css("display", "none");
				$("#noCctvInArea").css("display", "block");
			} else {
				if (chnId == null || hlsUrl == null) {
					$("#videoInfos").html("CCTV 없음");
				} else {
					playCctv('video', hlsUrl, true);
				}
				$("#accInfoSlick").css("display", "none");
				$("#videoInfos").css("display", "block");
			}
		}
	});
	
	$("#accInfoSlick").slick({
		arrows         : true
	  , dots           : true
	  , infinite       : true
	  , autoplay       : false
	  , prevArrow      : "<button type='button' class='slick-prev'>Previous</button>" // 이전 화살표 모양 설정
	  , nextArrow      : "<button type='button' class='slick-next'>Next</button>"     // 다음 화살표 모양 설정
	  , variableWidth  : true
	  , slidesToShow   : 1
	  , slidesToScroll : 1
	  , initialSlide   : accMsgLen-1 // 초기 슬라이드 설정페이지 : 제일 마지막(최신)꺼
	});
	
	$(".slick-prev").css("width", "36px");
	$(".slick-next").css({"width" : "40px", "right" : "-38px"});
	$("#popCctvName").focus();
}

/* ********************************************************
 * CCTV 팝업 생성
 ******************************************************** */
function openPopupCctv(feature, coordinate) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	
	var data = {
		"camId": code , 
		"cctvSourceCd" : "HP" // 공통코드 CCTV_SOURCE_CD 설정
	};
	
	var url = "/map/selectCctvInfo.do";
	
	commonAjax(data, url, callback = function(returnData) {
		$("#popup").removeClass();
		$("#popup").addClass("map_layer");
		$("#popup").addClass("cctv");
		
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows[0];
			var tempCctvName = (data.cctvName ?? "") && ((data.gvrCd ?? "") === 'SUE' ? "서울시설공단 제공" : "서울경찰청 제공");	 
			var htmCont = "";			
			htmCont += "<div class='tit'><strong tabindex='1' id='popupCctvName' style='display: flex; justify-content: space-between; align-items: center;'><span>" + data.cctvName + "</span><span style='font-size: 12px; color: #8E8E8E;'>" + tempCctvName + "</span></strong></div> ";
			htmCont += "<div class='content'> ";
			htmCont += "	<table class='tby01'> ";
			htmCont += "		<tbody> ";
			htmCont += "			<tr> ";
			//htmCont += "				<td class='last' style='border-bottom: none; height: 322px;' colspan='2' id='flashDiv'></td> ";
			htmCont += "				<td class='last' style='border-bottom: none; height: 322px;' colspan='2' id='cctvDiv'> ";
			htmCont += "					<video width=500 id='video' controls muted></video> ";
			htmCont += "				</td> ";
			htmCont += "			</tr> ";
			htmCont += "			<tr> ";
			var lCamId = "", lX = "", lY = "", lCamNm = "";
			var rCamId = "", rX = "", rY = "", rCamNm = "";
			if (data.axisDirCd == "EB" || data.axisDirCd == "NB") {
				lCamId = chgNull(data.lCamId);
				lX = chgNull(data.lX);
				lY = chgNull(data.lY);
				lCamNm = chgNull(data.lCamNm);
				
				rCamId = chgNull(data.rCamId);
				rX = chgNull(data.rX);
				rY = chgNull(data.rY);
				rCamNm = chgNull(data.rCamNm);
			} else {
				lCamId = chgNull(data.rCamId);
				lX = chgNull(data.rX);
				lY = chgNull(data.rY);
				lCamNm = chgNull(data.rCamNm);
				
				rCamId = chgNull(data.lCamId);
				rX = chgNull(data.lX);
				rY = chgNull(data.lY);
				rCamNm = chgNull(data.lCamNm);
			}
			if (lCamNm == "") {
				htmCont += "				<td class='last' style='border-bottom: none; text-align: left; padding-top: 0px; padding-bottom: 10px;'></td> ";
			} else {
				htmCont += "				<td class='last' style='border-bottom: none; text-align: left; padding-top: 0px; padding-bottom: 10px;'><a href='javascript:moveCctv(\""+lCamId+"\", \""+lX+"\", \""+lY+"\")' style='float: left; display: block; width: 28px; height: 29px; background:url(\"/common/img/main/btn_ban_prev.png\") no-repeat;'></a><p style='float: left; padding-left: 5px; margin-top: 3px;'>" + lCamNm + "</p></td> ";
			}
			if (rCamNm == "") {
				htmCont += "				<td class='last' style='border-bottom: none; text-align: right; padding-top: 0px; padding-bottom: 10px;'></td> ";
			} else {
				htmCont += "				<td class='last' style='border-bottom: none; text-align: right; padding-top: 0px; padding-bottom: 10px;'><a href='javascript:moveCctv(\""+rCamId+"\", \""+rX+"\", \""+rY+"\")' style='float: right; display: block; width: 28px; height: 29px; background:url(\"/common/img/main/btn_ban_next.png\") no-repeat;'></a><p style='float: right; padding-right: 5px; margin-top: 3px;'>" + rCamNm + "</p></td> ";
			}
			htmCont += "			</tr> ";
			htmCont += "		</tbody> ";
			htmCont += "	</table> ";
			htmCont += "</div> ";
			
			content.innerHTML = htmCont;
			popup.setPosition(coordinate);
			if (coordinate == null) {
				coordinate = new ol.proj.transform([data.axX*1, data.axY*1], epsg4326, epsgDaum);
				map.getView().setCenter(coordinate);
			}
			
			//livePlay(data.chnId, 500, 300);
			playCctv('video', data.hlsUrl, true,data.timerYn);
			
		} else {
			alert("CCTV 정보가 존재하지 않습니다.");
		}
		$("#popupCctvName").focus();
	});
}

function moveCctv(camId, x, y) {
	setTimeout(function() {
		var feature = {'code': camId};
		var coordinates = [x*1, y*1];
		openPopupCctv(feature, coordinates);
		map.getView().setCenter(coordinates);
	}, 100);
}

function playCctv(videoId, hlsUrl, autoPlay, timerYn) {
	if (nPlayer.isSupported()) {
    	var video = document.getElementById(videoId);
    	var liveConfig = { autoStartLoad: true };
    	var live = new nPlayer(liveConfig);
    	
    	live.attachMedia(video);
    	live.on(nPlayer.Events.MEDIA_ATTACHED, function () {
	        live.loadSource(hlsUrl);
	    	live.on(nPlayer.Events.MANIFEST_PARSED, function() {
	    		live.startLoad();
	    	});
	    });
    	
    	video.addEventListener('canplay', function() {
    		if (autoPlay) {
    			video.play();
    		}
    	});
    	
    	if(timerYn == null) {
    		timerYn = "Y";
    	}
    	
    	if(timerYn == "Y") {
	    	video.addEventListener('durationchange', function() {
	    		for (var i=0; i<video.buffered.length; i++) {
	    			if (video.buffered.end(i) > 20) {
		    			live.stopLoad();
		    		}
	    		}
	    	});
    	
    	
	    	video.addEventListener('timeupdate', function() {
	    		for (var i=0; i<video.buffered.length; i++) {
	    			if (video.buffered.end(i) > 30) {
		    			live.stopLoad();
		    		}
	    		}
	    		
	    		if (video.currentTime >= 29.5) {
	    			live.detachMedia();
	    			autoPlay = false;
	    			setTimeout(function() {playCctv(videoId, hlsUrl, autoPlay, timerYn);}, 500);
	    		}
	    	});
    	};
    } else {
    	alert("해당 브라우저에서 뷰어가 동작하지 않습니다.");
    }
}

/* ********************************************************
 * 나눔카 조회 후 팝업
 ******************************************************** */
function openPopupCar(feature, coordinate) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
		
	var apiUrl = "http://openapi.seoul.go.kr:8088/475a424d67776176363270496d6851/xml/NanumcarCarList/1/5/" + code;
	var data = {"spotId": code, "url": apiUrl};
	var url = "/map/getCarshare.do";
	
	commonAjax(data, url, callback = function(returnData) {
		$("#popup").removeClass();
		$("#popup").addClass("map_layer");
		$("#popup").addClass("bike");
		
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows[0];
			var data1 = returnData.rows1[0];
			var data2 = returnData.rows2[0];
			var htmCont = "";
			
			htmCont += "\n	<div class='tit'><strong>" + data.agent + "</strong></div> ";
			htmCont += "\n	<div class='loc'> ";
			htmCont += "\n	<strong>" + data.addr + "</strong> ";
			htmCont += "\n	</div> ";
			htmCont += "\n	<div class='content'> ";
			htmCont += "\n		<table class='tby01'> ";
			htmCont += "\n			<caption>"+data.gubun+"정보</caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:auto'/> ";
			htmCont += "\n				<col style='width:33%'/> ";
			htmCont += "\n				<col style='width:33%'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<thead> ";
			htmCont += "\n				<tr> ";
			htmCont += "\n					<th scope='col'>구분</th> ";
			htmCont += "\n					<th scope='col'>전체차량</th> ";
			htmCont += "\n					<th scope='col' class='last'>이용가능</th> ";
			htmCont += "\n				</tr> ";
			htmCont += "\n			</thead> ";
			htmCont += "\n			<tbody> ";
			if (data1 != undefined && data1 != null) {
				htmCont += "\n				<tr> ";
				htmCont += "\n					<th scope='col'>그린카</th> ";
				htmCont += "\n					<td class='bikenum' style='padding: 0px;'>" + data1.reservAbleAllCnt + "대</td> ";
				htmCont += "\n					<td class='bikenum last' style='padding: 0px;'>" + data1.reservAbleCnt + "대</td> ";
				htmCont += "\n				</tr> ";
			}
			if (data2 != undefined && data2 != null) {
				htmCont += "\n				<tr> ";
				htmCont += "\n					<th>쏘카</th> ";
				htmCont += "\n					<td class='bikenum' style='padding: 0px;'>" + data2.reservAbleAllCnt + "대</td> ";
				htmCont += "\n					<td class='bikenum last' style='padding: 0px;'>" + data2.reservAbleCnt + "대</td> ";
				htmCont += "\n				</tr> ";
			}
			htmCont += "\n			</tbody> ";
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";
			htmCont += "\n	<div class='btnBox txtC'> ";
			htmCont += "\n		<a href='http://www.seoulnanumcar.com' class='minBtn btnGray' target='_blank'>나눔카 바로가기</a> ";
			htmCont += "\n	</div> ";
			htmCont += "\n</div> ";
			
			content.innerHTML = htmCont;
			popup.setPosition(coordinate);
		} else {
			alert("나눔카 정보가 존재하지 않습니다.");
		}
	});
}

/* ********************************************************
 * 주차장 팝업 생성
 ******************************************************** */
function openPopupPark(feature, coordinate) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	
	var apiUrl = "/getParkingCount";
	//var apiUrl = "http://parking.seoul.go.kr/WCFA/ParklandSCH.svc/GetParkingCount";
	var data = {"parkCd": code, "url": apiUrl};
	var url = "/map/getPark.do";
	
	commonAjax(data, url, callback = function(returnData) {
		$("#popup").removeClass();
		$("#popup").addClass("map_layer");
		$("#popup").addClass("parking");
		
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows[0];
			var htmCont = "";
			
			if (chgNull(data.parkNm) == "") {
				alert("주차장 상세 정보가 없습니다.");
				return;
			}
			
			var maxParkCnt = 0;
			var parkingCnt = 0;
			if (data.maxParkingCnt > 0) maxParkCnt = data.maxParkingCnt;
			if (data.parkingCnt > 0) parkingCnt = data.parkingCnt;
			
			if (data.remark != null && data.remark != undefined) {
				var remark = data.remark;
				remark = remark.replace(/\\n/g, '<br>');
			};
			
			htmCont +="<div class='tit'><strong tabindex='1' id='popParkNm'>" +	data.parkNm + "</strong></div> ";
			htmCont +="	<div class='content'> ";
			if (chgNull(data.maxParkingCnt) != "" && chgNull(data.parkingCnt) != "") {
				htmCont += "\n		<table class='tby01'> ";
				htmCont += "\n			<colgroup> ";
				htmCont += "\n				<col style='width:50%'/> ";
				htmCont += "\n				<col style='width:auto'/> ";
				htmCont += "\n			</colgroup> ";
				htmCont += "\n			<thead> ";
				htmCont += "\n				<tr> ";
				htmCont += "\n					<th scope='col'>전체</th> ";
				htmCont += "\n					<th scope='col' class='last'>가능</th> ";
				htmCont += "\n				</tr> ";
				htmCont += "\n			</thead> ";
				htmCont += "\n			<tbody> ";
				htmCont += "\n				<tr> ";
				htmCont += "\n					<td class='bikenum'>" + addComma(maxParkCnt) + "대</td> ";
				htmCont += "\n					<td class='bikenum last'>" + addComma(parkingCnt) + "대</td> ";
				htmCont += "\n				</tr> ";
				htmCont += "\n			</tbody> ";
				htmCont += "\n		</table> ";
			}
			htmCont +="		<table class='tby01'> ";
			htmCont +="			<caption>" + data.parkNm + " 주차장 정보</caption> ";
			htmCont +="			<colgroup> ";
			htmCont +="				<col style='width:80px'/> ";
			htmCont +="				<col style='width:auto'/> ";
			htmCont +="			</colgroup> ";
			htmCont +="			<tbody> ";
			htmCont +="				<tr> ";
			htmCont +="					<th scope='row'>운영방식</th> ";
			htmCont +="					<td class='last'>" + data.operationRuleNm + "</td> ";
			htmCont +="				</tr> ";
			htmCont +="				<tr> ";
			htmCont +="					<th scope='row'>용도구분</th> ";
			htmCont +="					<td class='last'>" + data.parkTypeNm + "</td> ";
			htmCont +="				</tr> ";
			htmCont +="					<th scope='row'>주소</th> ";
			htmCont +="					<td class='last'>" + chgNull(data.addr) + "</td> ";
			htmCont +="				</tr> ";
			htmCont +="				<tr> ";
			htmCont +="					<th scope='row'>연락처</th> ";
			htmCont +="					<td class='last'>" + chgNull(data.telNo) + "</td> ";
			htmCont +="				</tr> ";
			htmCont +="				<tr> ";
			htmCont +="					<th scope='row'>기본요금</th> ";
			if(data.rates == '-' && data.timeRate == '-'){
				htmCont +="					<td class='last'>" + "무료" + "</td> ";
			} else if(data.rates =='-' && data.timeRate != '-'){
				htmCont +="					<td class='last'>" + "무료" + " / " + data.timeRate + "</td> ";
			} else {
				htmCont +="					<td class='last'>" + data.rates + " / " + data.timeRate + "</td> ";
			}
			htmCont +="				</tr> ";
			htmCont +="				<tr> ";
			htmCont +="					<th scope='row'>추가요금</th> ";			
			if(data.addRates == '-' && data.addTimeRate == '-'){
				htmCont +="					<td class='last'>" + "무료" + "</td> ";
			} else if(data.addRates =='-' && data.addTimeRate != '-'){
				htmCont +="					<td class='last'>" + "무료" + " / " + data.addTimeRate + "</td> ";
			} else {
				htmCont +="					<td class='last'>" + data.addRates + " / " + data.addTimeRate + "</td> ";
			}
			htmCont +="				</tr> ";
			htmCont +="				<tr> ";
			htmCont +="					<th scope='row'>운영시간</th> ";
			htmCont +="					<td class='last'> ";
			htmCont +="						평일 : " +	data.weekdayBeginTime + "-" + data.weekdayEndTime + "<br/> ";
			htmCont +="						토요일 : " + data.weekendBeginTime + "-" + data.weekendEndTime + "<br/> ";
			htmCont +="						일요일 : " + data.holidayBeginTime + "-" + data.holidayEndTime + " ";
			htmCont +="					</td> ";
			if (remark != null) {
				htmCont +="				</tr> ";
				htmCont +="					<th scope='row'>기타안내</th> ";
				htmCont +="						<td class='last'> " + remark;
				htmCont +="						</td> ";
				htmCont +="				</tr> ";
			}
			htmCont +="			</tbody> ";
			htmCont +="		</table> ";
			htmCont +="	</div> ";
			
			content.innerHTML = htmCont;
			popup.setPosition(coordinate);
			if (coordinate == null) {
				coordinate = new ol.proj.transform([data.x*1, data.y*1], epsg4326, epsgDaum);
				map.getView().setCenter(coordinate);
			}
		} else {
			alert("주차장 정보가 존재하지 않습니다.");
		}
		
		$("#popParkNm").focus();
	});	
}
/* ********************************************************
 * 버스 정류소 팝업 생성 - 지도에서 아이콘 클릭시 이벤트 발생
 ******************************************************** */
function openPopupBusStn(feature, coordinate){
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	var codeNm = "";
	
	if (feature.name == undefined && feature.desc == undefined) {
		if (feature.get('desc') == undefined) {
			codeNm = feature.get('name');
		} else {
			codeNm = feature.get('desc');
		}
	} else {
		if (feature.desc == undefined) {
			codeNm = feature.name;
		} else {
			codeNm = feature.desc;
		}
	}
	
	var stnId = feature.flag == undefined ? feature.get('flag') : feature.flag;
	if (stnId == "" || stnId == undefined) {
		stnId = feature.get('data').stnId;
	}
	
	$("#popup-refresh").off("click");
	$("#popup-refresh").on("click", function() {
		refreshPopupBusStn(code, stnId);
	});
	
	if (code == "0") {
		alert("ARS ID가 없습니다.");
		return;
	}
	
	var apiUrl = "/getStationByUidDetourAt";
	if (location.href.indexOf("localhost") >= 0 || location.href.indexOf("192") >= 0) { //개발
		apiUrl = "/api/rest/stationinfo/getStationByUidDetourAt";
	}
	var data = {"url": apiUrl, "arsId": code};
	var url = "/map/getBusStn.do";
	
	commonAjax(data, url, callback = function(returnData) {
		$("#popup").removeClass();
		$("#popup").addClass("map_layer");
		$("#popup").addClass("bustraffic");
		$("#popup-refresh").show();
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows;
			var htmCont = "";
			
			htmCont += "\n<div class='tit'><strong tabindex='1' id='popupCodeNm'>" + codeNm + "</strong></div> ";
			htmCont += "\n<div class='content'> ";
			htmCont += "\n	<div class='trafficInfor'> ";
			htmCont += "\n		<table class='tby03'> ";
			htmCont += "\n			<caption>" + codeNm + "버스운행정보</caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:*'/> ";
			htmCont += "\n				<col style='width:19%'/> ";
			htmCont += "\n				<col style='width:13%'/> ";
			htmCont += "\n				<col style='width:19%'/> ";
			htmCont += "\n				<col style='width:13%'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<tbody> ";
			htmCont += "\n			<tr> ";
			htmCont += "\n				<th style='border-bottom: none; font-size: 16px;'>곧도착</th> ";
			htmCont += "\n				<td style='border-bottom: none; font-size: 16px; padding: 5px;' colspan='4' id='bus_soon'></td> ";
			htmCont += "\n			</tr> ";
			
			var bus_soon = "";
			for (var i=0; i<data.length; i++) {
				if(code == "00007" && data[i].adirection.indexOf("마곡") > -1) {
					continue;
				}
				
				if(code == "00001" && data[i].adirection.indexOf("잠실") > -1) {
					continue;
				}
				
				if (stnId == data[i].stId) {
					var busTypeNm1 = "[일반]";
					var busTypeNm2 = "[일반]";
					
					if (data[i].busType1 == "0") {
						busTypeNm1 = "[일반]";
					} else if (data[i].busType1 == "1") {
						busTypeNm1 = "[저상]";
					} else if (data[i].busType1 == "2") {
						busTypeNm1 = "[굴절]";
					}
					
					if (data[i].busType2 == "0") {
						busTypeNm2 = "[일반]";
					} else if (data[i].busType2 == "1") {
						busTypeNm2 = "[저상]";
					} else if (data[i].busType2 == "2") {
						busTypeNm2 = "[굴절]";
					}
					
					if (data[i].routeType == "14") {
						busTypeNm1 = "-";
						busTypeNm2 = "-";
					}
					
					var arrmsgMin1 = fn_getArrmsg(data[i].arrmsg1);
					if (arrmsgMin1.indexOf("곧 도착") > -1) {
						bus_soon += ", " + data[i].rtNm;
					}
					if (data[i].isLast1 != "0") arrmsgMin1 = "막차 " + arrmsgMin1;
					
					var arrmsgMin2 = fn_getArrmsg(data[i].arrmsg2);
					if (data[i].isLast2 != "0") arrmsgMin2 = "막차 " + arrmsgMin2;
					
					htmCont += "\n	<tr> ";
					htmCont += "\n		<td style='font-size: 16px; text-align: left; padding: 5px;'> ";
					htmCont += "\n		<a href='javascript:void(0)' onclick='fn_showBusLine(\""+data[i].busRouteId+"\",\""+data[i].routeType+"\");'>" + getBusTypeHtml(data[i].routeType);
					htmCont += "\n		<strong>"
					htmCont += data[i].rtNm;
					htmCont += "\n		</strong> ";
					htmCont += "\n		<br> ";
					htmCont += "\n		<p style='font-size: 12px; margin: 0px;'>(" + data[i].adirection + " 방향)</p> ";
					htmCont += "\n		</a> ";
					htmCont += "\n		</td> ";
					htmCont += "\n		<td style='font-size: 16px; text-align: center; padding: 5px;'>" + arrmsgMin1 + fn_getCongetion(data[i].congetion1, data[i].isLast1, data[i].routeType, data[i].arrmsg1, data[i].detourAt) + "</td> ";
					htmCont += "\n		<td style='font-size: 14px; text-align: center; padding: 5px;'>" + busTypeNm1 + "</td> ";
					htmCont += "\n		<td style='font-size: 16px; text-align: center; padding: 5px;'>" + arrmsgMin2 + fn_getCongetion(data[i].congetion2, data[i].isLast2, data[i].routeType, data[i].arrmsg2, data[i].detourAt) + "</td> ";
					htmCont += "\n		<td style='font-size: 14px; text-align: center; padding: 5px;'>" + busTypeNm2 + "</td> ";
					htmCont += "\n	</tr> ";
				}
			}

			htmCont += "\n			</tbody> ";
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";
			htmCont += "\n</div> ";
			
			content.innerHTML = htmCont;
			popup.setPosition(coordinate);
			
			$("#bus_soon").html(bus_soon.substring(2));			
		} else {
			alert("버스 정류소 정보가 존재하지 않습니다.");
		}
		$("#popupCodeNm").focus();
	});
}

/* ********************************************************
 * 버스 정류소 팝업 새로고침
 ******************************************************** */
function refreshPopupBusStn(arsId, stnId) {
	var apiUrl = "/getStationByUidDetourAt";
	if (location.href.indexOf("localhost") >= 0 || location.href.indexOf("192") >= 0) { //개발
		apiUrl = "/api/rest/stationinfo/getStationByUidDetourAt";
	}
	var data = {"url": apiUrl, "arsId": arsId};
	var url = "/map/getBusStn.do";
	
	commonAjax( data, url, callback = function(returnData) {
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows;
			var htmCont = "";
			
			htmCont += "\n			<tr> ";
			htmCont += "\n				<th style='border-bottom: none; font-size: 16px;'>곧도착</th> ";
			htmCont += "\n				<td style='border-bottom: none; font-size: 16px; padding: 5px;' colspan='4' id='bus_soon'></td> ";
			htmCont += "\n			</tr> ";
			
			var bus_soon = "";
			for (var i=0; i<data.length; i++) {
				if(data[i].arsId == "00007" && data[i].adirection.indexOf("마곡") > -1) {
					continue;
				}
				
				if(data[i].arsId == "00001" && data[i].adirection.indexOf("잠실") > -1) {
					continue;
				}
				
				if (stnId == data[i].stId) {
					var busTypeNm1 = "[일반]";
					var busTypeNm2 = "[일반]";
					
					if (data[i].busType1 == "0") {
						busTypeNm1 = "[일반]";
					} else if (data[i].busType1 == "1") {
						busTypeNm1 = "[저상]";
					} else if (data[i].busType1 == "2") {
						busTypeNm1 = "[굴절]";
					}
					
					if (data[i].busType2 == "0") {
						busTypeNm2 = "[일반]";
					} else if (data[i].busType2 == "1") {
						busTypeNm2 = "[저상]";
					} else if (data[i].busType2 == "2") {
						busTypeNm2 = "[굴절]";
					}
					
					if (data[i].routeType == "14") {
						busTypeNm1 = "-";
						busTypeNm2 = "-";
					}
					
					var arrmsgMin1 = fn_getArrmsg(data[i].arrmsg1);
					if (arrmsgMin1.indexOf("곧 도착") > -1) {
						bus_soon += ", " + data[i].rtNm;
					}
					if (data[i].isLast1 != "0") arrmsgMin1 = "막차 " + arrmsgMin1;
					
					var arrmsgMin2 = fn_getArrmsg(data[i].arrmsg2);
					if (data[i].isLast2 != "0") arrmsgMin2 = "막차 " + arrmsgMin2;
					htmCont += "\n	<tr> ";
					htmCont += "\n		<td style='font-size: 16px; text-align: left; padding: 5px;'> ";
					htmCont += "\n		<a href='javascript:void(0)' onclick='fn_showBusLine(\""+data[i].busRouteId+"\",\""+data[i].routeType+"\");'>" + getBusTypeHtml(data[i].routeType);
					htmCont += "\n		<strong>"
					htmCont += data[i].rtNm;
					htmCont += "\n		</strong> ";
					htmCont += "\n		<br> ";
					htmCont += "\n		<p style='font-size: 12px; margin: 0px;'>(" + data[i].adirection + " 방향)</p> ";
					htmCont += "\n		</a> ";
					htmCont += "\n		</td> ";
					htmCont += "\n		<td style='font-size: 16px; text-align: center; padding: 5px;'>" + arrmsgMin1 + fn_getCongetion(data[i].congetion1, data[i].isLast1, data[i].routeType, data[i].arrmsg1, data[i].detourAt) + "</td> ";
					htmCont += "\n		<td style='font-size: 14px; text-align: center; padding: 5px;'>" + busTypeNm1 + "</td> ";
					htmCont += "\n		<td style='font-size: 16px; text-align: center; padding: 5px;'>" + arrmsgMin2 + fn_getCongetion(data[i].congetion2, data[i].isLast2, data[i].routeType, data[i].arrmsg2, data[i].detourAt) + "</td> ";
					htmCont += "\n		<td style='font-size: 14px; text-align: center; padding: 5px;'>" + busTypeNm2 + "</td> ";
					htmCont += "\n	</tr> ";
				}
			}
			
			$("#popup-content > .content > .trafficInfor > .tby03 > tbody").html(htmCont);
			
			$("#bus_soon").html(bus_soon.substring(2));
		} else {
			alert("버스 정류소 정보가 존재하지 않습니다.");
		}
	});
}

var vectorIconLayersBusLineStn = [];
function fn_showBusLine(busRouteId,routeType) {
	for (var i=0; i<vectorIconLayersBusLineStn.length;i++) {
		map.removeLayer(vectorIconLayersBusLineStn[i]);
	}
	vectorBusLineLayer.forEach(function(layer1) {
		map.removeLayer(layer1);
	});
	vectorBusLineLayer2.forEach(function(layer2) {
		map.removeLayer(layer2);
	});
	vectorBusLineLayer3.forEach(function(layer3) {
		map.removeLayer(layer3);
	});
	
	var data = {"routId": busRouteId};
	
	commonAjax(data, "/map/busMap/selectBusLineList.do", callback = function(returnData) {
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var coordinates = [];
			
		    for (var i=0; i<returnData.rows.length; i++) {
				var data = returnData.rows[i];
				coordinates.push(new ol.proj.transform([data.posX, data.posY], epsg4326, epsgDaum));
			}
			
			makeBusLineLayer(coordinates, busRouteId);
			
			fn_showBusPosi(busRouteId,routeType);
		} else {
			alert("버스노선 정보가 존재하지 않습니다.");
		}
	}, false);
}

var vectorIconLayersBusPosition = [];
function fn_showBusPosi(busRouteId,routeType) {
	for (var i=0; i<vectorIconLayersBusPosition.length;i++) {
		map.removeLayer(vectorIconLayersBusPosition[i]);
	}
	
	var apiUrl = "/getBusPosByRtidDetourAt";
	if (location.href.indexOf("localhost") >= 0 || location.href.indexOf("192") >= 0) { //개발
		apiUrl = "/api/rest/buspos/getBusPosByRtidDetourAt";
	}
	var data = {"url": apiUrl, "routId": busRouteId};
	var url = "/map/busMap/getBusPosition.do";
	
	commonAjax(data, url, callback = function(returnData) {
		if (returnData != null && returnData.rows != undefined && returnData.rows.length > 0) {
			var data = returnData.rows;
	
			//지도 iconLayer		
			var coordinates, linkId, icon, desc;
			
			for (var i=0; i<data.length; i++) {
				coordinates = [parseFloat(data[i].posX), parseFloat(data[i].posY)];
				if(hpMapDivCd == "N" || hpMapDivCd){
					coordinates = ol.proj.transform(coordinates,"EPSG:5181",epsgDaum);
				}
				linkId = busRouteId;
				
				if(routeType != '14'){
					if (data[i].busType == "0") { //일반
						icon = "/images/map/icon_bus_pos_blue.png";
					} else if (data[i].busType == "1") { //저상
						icon = "/images/map/icon_bus_pos_low.png";
					} else { //굴절 등
						icon = "/images/map/icon_bus_pos_blue.png";
					}
				} else {
					icon = "/images/map/icon_bus_pos_hangang.png";
				}
				
				desc = data[i].plainNo;
				
				makeIconLayer(coordinates, linkId, icon, desc, data[i], undefined, vectorIconLayersBusPosition);
			}
		} else {
			alert("버스위치 정보가 존재하지 않습니다.");
		}
	}, false);
}

function fn_getArrmsg(arrmsg) {
	if(arrmsg != undefined && arrmsg != null){
		var newArrmsg = arrmsg.split("[")[0];
		if (newArrmsg.split("분").length > 1) {
			newArrmsg = newArrmsg.split("분")[0] + "분";
		}
		
		/*if (newArrmsg == "1분") {
			newArrmsg = "곧 도착";
		}*/
		
		if (newArrmsg.indexOf("출발대기") > -1) {
			newArrmsg = "출발대기";
		}
		
		if (newArrmsg.indexOf("도착") > -1) {
			newArrmsg = "곧 도착";
		}
		
		if (newArrmsg.indexOf("운행종료") > -1) {
			newArrmsg = "운행종료";
		}
		
		if (arrmsg.indexOf("차고지") > -1) {
			newArrmsg = "차고지";
		}
	} else {
		var newArrmsg = "정보없음";
	}
	
	return newArrmsg;
}

/* ********************************************************
 * 버스 타입별 Html
 ******************************************************** */
function getBusTypeHtml(pRoutType) {

	var rtnHtml = "<span class='i_bus'>&nbsp;</span>";

	if (pRoutType == "3")
	{
		rtnHtml = "<span class='i_bus r2'>간선</span>";
	}
	else if (pRoutType == "4")
	{
		rtnHtml = "<span class='i_bus r1'>지선</span>";
	}
	else if (pRoutType == "5")
	{
		rtnHtml = "<span class='i_bus r4'>순환</span>";
	}
	else if (pRoutType == "6")
	{
		rtnHtml = "<span class='i_bus r3'>광역</span>";
	}
	else if (pRoutType == "1")
	{
		rtnHtml = "<span class='i_bus r6'>공항</span>";
	}
	else if (pRoutType == "7")
	{
		rtnHtml = "<span class='i_bus r7'>인천</span>";
	}
	else if (pRoutType == "8")
	{
		rtnHtml = "<span class='i_bus r8'>경기</span>";
	}
	else if (pRoutType == "2")
	{
		rtnHtml = "<span class='i_bus r5'>마을</span>";
	}
	else if (pRoutType == "10")
	{
		rtnHtml = "<span class='i_bus r10'>관광</span>";
	}
	else if (pRoutType == "12")
	{
		rtnHtml = "<span class='i_bus r12'>자율</span>";
	}
	else if (pRoutType == "13")
	{
		rtnHtml = "<span class='i_bus r13'>동행</span>";
	}
	else if (pRoutType == "14")
	{
		rtnHtml = "<span class='i_bus r14'>한강</span>";
	}
	
	return rtnHtml;
}

/* ********************************************************
 * 버스 상세 팝업 생성 - 버스 검색 결과 버스번호 클릭 시
 ******************************************************** */
function openPopupBusDetl(feature, coordinate) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	var name = feature.desc == undefined ? feature.get('desc') : feature.desc;
	var rtCd = feature.rtCd == undefined ? feature.get('rtCd') : feature.rtCd;
	var stnFirst = feature.stnFirst == undefined ? feature.get('stnFirst') : feature.stnFirst;
	var stnLast = feature.stnLast == undefined ? feature.get('stnLast') : feature.stnLast;
	var timeFirst = feature.timeFirst == undefined ? feature.get('timeFirst') : feature.timeFirst;
	var timeLast = feature.timeLast == undefined ? feature.get('timeLast') : feature.timeLast;
	var norTerms = feature.norTerms == undefined ? feature.get('norTerms') : feature.norTerms;
	var satTerms = feature.satTerms == undefined ? feature.get('satTerms') : feature.satTerms;
	var holTerms = feature.holTerms == undefined ? feature.get('holTerms') : feature.holTerms;
	var turnPlaceStationId = feature.turnPlaceStationId == undefined ? feature.get('turnPlaceStationId') : feature.turnPlaceStationId;
	var companyNm = feature.companyNm == undefined ? feature.get('companyNm') : feature.companyNm;
	var telNo = feature.telNo == undefined ? feature.get('telNo') : feature.telNo;
	var satTimeFirst = feature.satTimeFirst == undefined ? feature.get('satTimeFirst') : feature.satTimeFirst;
	var satTimeLast = feature.satTimeLast == undefined ? feature.get('satTimeLast') : feature.satTimeLast;
	var holTimeFirst = feature.holTimeFirst == undefined ? feature.get('holTimeFirst') : feature.holTimeFirst;
	var holTimeLast = feature.holTimeLast == undefined ? feature.get('holTimeLast') : feature.holTimeLast;
	
	var pop_container = document.getElementById('pop_busDetl');
	var pop_content = document.getElementById('pop_content');
	var openAPI = "/getBusPosByRtidDetourAt";
	var openAPI2 = "/getStaionByRoute";
	if (location.href.indexOf("localhost") >= 0 || location.href.indexOf("192") >= 0) { //개발
		openAPI = "/api/rest/buspos/getBusPosByRtidDetourAt";
		openAPI2 = "/api/rest/busRouteInfo/getStaionByRoute";	
	}
	var data = { "url": openAPI, "routId": code, "url2":openAPI2 };
	var url = "/map/busMap/selectBusLineStnXMLList.do";
	
	commonAjax(data, url, callback = function(returnData) {
		var data = returnData.rows;
		var htmCont = "";
		var colorString = "spare";
		if (data.length > 0) {
			htmCont += "\n<div id='" + code + "' name='" + rtCd + "' class='tit' style='font-size: 17px; padding-right: 60px;'>" + getBusTypeHtml(rtCd) + "<strong>" + name + "</strong> (" + stnFirst + "<span class='path_arrd'>↔</span>" + stnLast + ")</div> ";
			htmCont += "\n<div id='" + turnPlaceStationId + "' class='content'> ";
			
			var companyNmGrp = companyNm.split(" ");
			htmCont += "\n	<div class='time mb10'> ";
			for(var i=0; i<companyNmGrp.length; i++) {
				if(i==0) { 
					htmCont += "\n		<p><em>" + companyNmGrp[i] + "</em><i>" + telNo + "</i></p> ";
				} else {
					htmCont += "\n		<p><em>" + companyNmGrp[i] + "</em></p>";
				}
			}
			htmCont += "\n	</div> ";
			
			htmCont += "\n	<div class='mb10'> ";
			htmCont += "\n		<table class='tby03 min txtC'> ";
			htmCont += "\n			<caption> "+ name +"배차간격</caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:20%'/> ";
			htmCont += "\n				<col style='width:26.6%'/> ";
			htmCont += "\n				<col style='width:26.6%'/> ";
			htmCont += "\n				<col style='width:auto'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<thead> ";
			htmCont += "\n				<tr> ";
			htmCont += "\n					<th scope='col'>구분</th> ";
			htmCont += "\n					<th scope='col'>평일</th> ";
			htmCont += "\n					<th scope='col'>토요일</th> ";
			htmCont += "\n					<th scope='col'>공휴일</th> ";
			htmCont += "\n				</tr> ";
			htmCont += "\n			</thead> ";
			htmCont += "\n			<tbody> ";
			htmCont += "\n				<tr> ";
			htmCont += "\n					<td>배차간격</td> ";
			htmCont += "\n					<td>" + norTerms + "분</td> ";
			htmCont += "\n					<td>" + satTerms + "분</td> ";
			htmCont += "\n					<td>" + holTerms + "분</td> ";
			htmCont += "\n				</tr> ";
			htmCont += "\n				<tr> ";
			htmCont += "\n					<td>첫차</td> ";
			htmCont += "\n					<td>" + setTimes(timeFirst) + "</td> ";
			htmCont += "\n					<td>" + setTimes(satTimeFirst) + "</td> ";
			htmCont += "\n					<td>" + setTimes(holTimeFirst) + "</td> ";
			htmCont += "\n				</tr> ";
			htmCont += "\n				<tr> ";
			htmCont += "\n					<td>막차</td> ";
			htmCont += "\n					<td>" + setTimes(timeLast) + "</td> ";
			htmCont += "\n					<td>" + setTimes(satTimeLast) + "</td> ";
			htmCont += "\n					<td>" + setTimes(holTimeLast) + "</td> ";
			htmCont += "\n				</tr> ";
			htmCont += "\n			</tbody> ";
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";
			
			htmCont += "\n	<div class='txtR mb10'> ";
			htmCont += "\n		<a href='javascript:fn_btnConBus(\""+code+"\",\""+rtCd+"\",\""+name+"\",\""+stnFirst+"\",\""+stnLast+"\",\""+turnPlaceStationId+"\");' id='btnBusCon' class='minBtn btnGray'>차내 혼잡도 보기</a> ";
			htmCont += "\n		<a href='javascript:fn_btnDrawBus(\"btnBusPos\");' id='btnBusPos' class='minBtn btnGray'>실시간 버스위치 보기</a> ";
			htmCont += "\n		<a href='javascript:fn_btnDrawBus(\"btnBusStn\", false);' id='btnBusStn' class='minBtn btnGray'>정류소 보기</a> ";
			htmCont += "\n	</div> ";
			
			htmCont += "\n	<ul class='tabs'> ";
			htmCont += "\n		<li class='active'> ";
			htmCont += "\n			<a href='#layer_bustabs1' onclick='busTabs($(this));return false;'>" + stnLast + " 방면</a> ";
			htmCont += "\n		</li> ";
			htmCont += "\n		<li> ";
			htmCont += "\n			<a href='#layer_bustabs2' onclick='busTabs($(this));return false;'>" + stnFirst + " 방면</a> ";
			htmCont += "\n		</li> ";
			htmCont += "\n	</ul> ";
			
			htmCont += "\n	<div id='refresh_content'> ";
			htmCont += "\n	<div id='layer_bustabs1' class='busInfor busloc "+getBusTypeClass(rtCd)+"' style='display:block'> ";
			htmCont += "\n		<ul class='busloclist'> ";
			
			var contentHtml = "";
			for (var i=0; i<data.length; i++) {
				contentHtml += "\n		<li> ";
				
				//[uinetworks]
				if(data[i].acdntInfo){
					if (data[i].acdntInfo.split("|")[0] == "0"){ //무정차
						contentHtml += "\n			<p><strong><a href='#' style='color:#888;' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>무정차</span></strong></p> ";
					} else if (data[i].acdntInfo.split("|")[0] == "1"){ //우회
						contentHtml += "\n			<p><strong><a href='#' style='color:#888;' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>우회</span></strong></p> ";
					}

					//contentHtml += "\n			<p><strong><a href='#' style='color:#888;' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>우회</span></strong></p> ";
//					coordinates = new ol.proj.transform([parseFloat(data[i].posX), parseFloat(data[i].posY)], epsg4326, epsgDaum);
//					var linkId = data[i].arsId;
//					var icon = "/common/img/map/map_icon_26_c.png";
//					var desc = "[무정차]"+data[i].stnName + "(" + data[i].arsId + ")";
//					makeIconLayer(coordinates, linkId, icon, desc, data, undefined, vectorIconLayersBusLineStn);
					if (rtCd != "14") {
						contentHtml += '<span class="lt '+colorString+'"></span>';
						colorString = fn_spdConfusion(data[i].stationSpd);
					} else {
						colorString = "";
						contentHtml += '<span class="lt '+colorString+'"></span>';
					}
					contentHtml += '<span class="lb '+colorString+'"></span>';
					contentHtml += '<span class="icon"></span>';
				}else{
					contentHtml += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a></strong></p> ";
					if (rtCd != "14") {
						contentHtml += '<span class="lt '+colorString+'"></span>';
						colorString = fn_spdConfusion(data[i].stationSpd);
					} else {
						colorString = "";
						contentHtml += '<span class="lt '+colorString+'"></span>';
					}
					contentHtml += '<span class="lb '+colorString+'"></span>';
					contentHtml += '<span class="icon"></span>';
				}
				//contentHtml += "\n			<p>(" + data[i].dir + ")방향</p> ";

				if (data[i].isBus) {
//					var plainNo = data[i].plainNo;
					if (data[i].rtCd != '14') {
						var busPosIcon = "icon_bus_pos_blue.png";
						if (data[i].busType == "0") { //일반
							busPosIcon = "icon_bus_pos_blue.png";
						} else if (data[i].busType == "1") { //저상
							busPosIcon = "icon_bus_pos_low.png";
						} else { //굴절 등
							busPosIcon = "icon_bus_pos_blue.png";
						}
					} else {
						var busPosIcon = "icon_bus_pos_hangang.png";
					}
					
					if (fn_getCongetion_st(data[i].congetion, data[i].isLast, data[i].rtCd, data[i].rerdeNum) != "<font color='#C0C0C0'>&nbsp;</font>"){
						contentHtml += "\n			<span style='font-size: 0.8em; display: flex; position: absolute; right: 16px; top: 12%;'>";
						contentHtml += "<span style='display: flex; flex-direction: column; align-items: flex-end; line-height: 1.5; margin: 0 3px;'>";
						contentHtml += '<span>' + data[i].plainNo + '</span>';
						contentHtml += '<span>';
						contentHtml += fn_getCongetion_st(data[i].congetion, data[i].isLast, data[i].rtCd, data[i].rerdeNum) + '</span>';						
					} else {
						contentHtml += "\n			<span style='font-size: 0.8em; display: flex; position: absolute; right: 16px; top: 12%; margin-top: 4px;'>";
						contentHtml += "<span style='display: flex; flex-direction: row; align-items: center; line-height: 1.5; margin: 0 3px;'>";
						contentHtml += '<span>' + data[i].plainNo + '</span>';					
					}
					contentHtml += "</span>";
					contentHtml += " <img src='/images/map/" + busPosIcon + "' alt='버스' style='object-fit: none'; />";
					contentHtml += '</span>';
				} 
				contentHtml += "\n		</li> ";
				
				if (data[i].stnId == turnPlaceStationId && i>1) {
					htmCont += contentHtml;
					contentHtml = "";
					
					htmCont += "\n		</ul> ";
					htmCont += "\n	</div> ";
					htmCont += "\n	<div id='layer_bustabs2' class='busInfor busloc "+getBusTypeClass(rtCd)+"'> ";
					htmCont += "\n		<ul class='busloclist'> ";
					
					htmCont += "\n		<li> ";
					//[uinetworks]
					if(data[i].acdntInfo){
						
						if (data[i].acdntInfo.split("|")[0] == "0"){ //무정차
							htmCont += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>무정차</span></strong></p> ";
						} else if (data[i].acdntInfo.split("|")[0] == "1"){ //우회
							htmCont += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>우회</span></strong></p> ";
						}	
						
						//htmCont += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>우회</span></strong></p> ";
//						coordinates = new ol.proj.transform([parseFloat(data[i].posX), parseFloat(data[i].posY)], epsg4326, epsgDaum);
//						var linkId = data[i].arsId;
//						var icon = "/common/img/map/map_icon_26_c.png";
//						var desc = data[i].stnName + "(" + data[i].arsId + ")";
//						makeIconLayer(coordinates, linkId, icon, desc, data, undefined, vectorIconLayersBusLineStn);
						if(rtCd != "14"){
							htmCont += '<span class="lt '+fn_spdConfusion(data[i].stationSpd)+'"></span>';
							htmCont += '<span class="lb '+fn_spdConfusion(data[i].stationSpd)+'"></span>';
						} else {
							htmCont += '<span class="lt"></span>';
							htmCont += '<span class="lb"></span>';
						}
						htmCont += '<span class="icon"></span>';
					}else{
						htmCont += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a></strong></p> ";
						if(rtCd != "14"){
							htmCont += '<span class="lt '+fn_spdConfusion(data[i].stationSpd)+'"></span>';
							htmCont += '<span class="lb '+fn_spdConfusion(data[i].stationSpd)+'"></span>';
						} else {
							htmCont += '<span class="lt"></span>';
							htmCont += '<span class="lb"></span>';
						}
						htmCont += '<span class="icon"></span>';
					}
					//contentHtml += "\n			<p>(" + data[i].dir + ")방향</p> ";
					/*if (data[i].isBus) {
						if (data[i].busType == "0") { //일반
							htmCont += "\n			<span style='float: right; margin-top: -22px; font-size: 0.8em;'>" + data[i].plainNo + " <img src='/images/map/icon_bus_pos_blue.png' alt='버스' /></span> ";
						} else if (data[i].busType == "1") { //저상
							htmCont += "\n			<span style='float: right; margin-top: -22px; font-size: 0.8em;'>" + data[i].plainNo + " <img src='/images/map/icon_bus_pos_low.png' alt='버스' /></span> ";
						} else { //굴절 등
							htmCont += "\n			<span style='float: right; margin-top: -22px; font-size: 0.8em;'>" + data[i].plainNo + " <img src='/images/map/icon_bus_pos_blue.png' alt='버스' /></span> ";
						}
					}*/ 
					if (data[i].isBus) {
						if (data[i].rtCd != '14') {
							var busPosIcon = "icon_bus_pos_blue.png";
							if (data[i].busType == "0") { //일반
								busPosIcon = "icon_bus_pos_blue.png";
							} else if (data[i].busType == "1") { //저상
								busPosIcon = "icon_bus_pos_low.png";
							} else { //굴절 등
								busPosIcon = "icon_bus_pos_blue.png";
							}
						} else {
							var busPosIcon = "icon_bus_pos_hangang.png";
						}
						if (fn_getCongetion_st(data[i].congetion, data[i].isLast, data[i].rtCd, data[i].rerdeNum) != "<font color='#C0C0C0'>&nbsp;</font>"){
							htmCont += "\n			<span style='font-size: 0.8em; display: flex; position: absolute; right: 16px; top: 12%;'>";
							htmCont += "<span style='display: flex; flex-direction: column; align-items: flex-end; line-height: 1.5; margin: 0 3px;'>";
							htmCont += '<span>' + data[i].plainNo + '</span>';
							htmCont += '<span>';
							htmCont += fn_getCongetion_st(data[i].congetion, data[i].isLast, data[i].rtCd, data[i].rerdeNum) + '</span>';						
						} else {
							htmCont += "\n			<span style='font-size: 0.8em; display: flex; position: absolute; right: 16px; top: 12%; margin-top: 4px;'>";
							htmCont += "<span style='display: flex; flex-direction: row; align-items: center; line-height: 1.5; margin: 0 3px;'>";
							htmCont += '<span>' + data[i].plainNo + '</span>';					
						}
						htmCont += "</span>";
						htmCont += " <img src='/images/map/" + busPosIcon + "' alt='버스' style='object-fit: none'; />";
						htmCont += '</span>';
					}
					htmCont += "\n		</li> ";
				}
			}
			htmCont += contentHtml;
			htmCont += "\n		</ul> ";
			htmCont += "\n	</div> ";
			htmCont += "\n	</div> ";
			htmCont += "\n</div> ";
			htmCont += "\n</div> ";
			
			pop_content.innerHTML = htmCont;
			$("#pop_busDetl").show();
		} else {
			alert("버스 정보가 존재하지 않습니다.");
		}
		$("#pop_busDetl").focus();
	});
}

/* ********************************************************
 * 버스 상세 팝업 새로고침
 ******************************************************** */
function refreshPopupBusDetl(routId, turnPlaceStationId,rtCd) {
	var openAPI = "/getBusPosByRtidDetourAt";
	var openAPI2 = "/getStaionByRoute";
	if (location.href.indexOf("localhost") >= 0 || location.href.indexOf("192") >= 0) { //개발
		openAPI = "/api/rest/buspos/getBusPosByRtidDetourAt";
		openAPI2 = "/api/rest/busRouteInfo/getStaionByRoute";	
	}
	var data = { "url": openAPI, "routId": routId , "url2":openAPI2 };
	var url = "/map/busMap/selectBusLineStnXMLList.do";
	var colorString = "spare";
	
	commonAjax(data, url, callback = function(returnData) {
		var data = returnData.rows;
		var htmCont = "";
		
		if (data.length > 0) {
			var contentHtml = "";
			
			htmCont += "\n	<div id='layer_bustabs1' class='busInfor busloc "+getBusTypeClass(rtCd)+"' style='display:block'> ";
			htmCont += "\n		<ul class='busloclist'> ";
			for (var i=0; i<data.length; i++) {
				contentHtml += "\n		<li> "; 
				//contentHtml += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a></strong></p> ";
				//[uinetworks]
				if(data[i].acdntInfo){

					if (data[i].acdntInfo.split("|")[0] == "0"){ //무정차
						contentHtml += "\n			<p><strong><a href='#' style='color:#888;' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>무정차</span></strong></p> ";
					} else if (data[i].acdntInfo.split("|")[0] == "1"){ //우회
						contentHtml += "\n			<p><strong><a href='#' style='color:#888;' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>우회</span></strong></p> ";
					}
					//contentHtml += "\n			<p><strong><a href='#' style='color:#888;' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>우회</span></strong></p> ";
					if (rtCd != "14") {
						contentHtml += '<span class="lt '+colorString+'"></span>';
						colorString = fn_spdConfusion(data[i].stationSpd);
					} else {
						colorString = "";
						contentHtml += '<span class="lt '+colorString+'"></span>';
					}
					contentHtml += '<span class="lb '+colorString+'"></span>';
					contentHtml += '<span class="icon"></span>';
				}else{
					contentHtml += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a></strong></p> ";
					if (rtCd != "14") {
						contentHtml += '<span class="lt '+colorString+'"></span>';
						colorString = fn_spdConfusion(data[i].stationSpd);
					} else {
						colorString = "";
						contentHtml += '<span class="lt '+colorString+'"></span>';
					}
					contentHtml += '<span class="lb '+colorString+'"></span>';
					contentHtml += '<span class="icon"></span>';
				}
				if (data[i].isBus) {
					if (data[i].rtCd != '14') {
						var busPosIcon = "icon_bus_pos_blue.png";
						if (data[i].busType == "0") { //일반
							busPosIcon = "icon_bus_pos_blue.png";
						} else if (data[i].busType == "1") { //저상
							busPosIcon = "icon_bus_pos_low.png";
						} else { //굴절 등
							busPosIcon = "icon_bus_pos_blue.png";
						}
					} else {
						var busPosIcon = "icon_bus_pos_hangang.png";
					}
					
					if (fn_getCongetion_st(data[i].congetion, data[i].isLast, data[i].rtCd, data[i].rerdeNum) != "<font color='#C0C0C0'>&nbsp;</font>"){
						contentHtml += "\n			<span style='font-size: 0.8em; display: flex; position: absolute; right: 16px; top: 12%;'>";
						contentHtml += "<span style='display: flex; flex-direction: column; align-items: flex-end; line-height: 1.5; margin: 0 3px;'>";
						contentHtml += '<span>' + data[i].plainNo + '</span>';
						contentHtml += '<span>';
						contentHtml += fn_getCongetion_st(data[i].congetion, data[i].isLast, data[i].rtCd, data[i].rerdeNum) + '</span>';						
					} else {
						contentHtml += "\n			<span style='font-size: 0.8em; display: flex; position: absolute; right: 16px; top: 12%; margin-top: 4px;'>";
						contentHtml += "<span style='display: flex; flex-direction: row; align-items: center; line-height: 1.5; margin: 0 3px;'>";
						contentHtml += '<span>' + data[i].plainNo + '</span>';					
					}
					contentHtml += "</span>";
					contentHtml += " <img src='/images/map/" + busPosIcon + "' alt='버스' style='object-fit: none'; />";
					contentHtml += '</span>';
				} 
				contentHtml += "\n		</li> ";
				
				if (data[i].stnId == turnPlaceStationId && i > 1) {
					htmCont += contentHtml;
					contentHtml = "";
					
					htmCont += "\n		</ul> ";
					htmCont += "\n	</div> ";
					htmCont += "\n	<div id='layer_bustabs2' class='busInfor busloc "+getBusTypeClass(rtCd)+"'> ";
					htmCont += "\n		<ul class='busloclist'> ";
					
					htmCont += "\n		<li> "; 
					//htmCont += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a></strong></p> ";
					//[uinetworks]
					if(data[i].acdntInfo){
						
						if (data[i].acdntInfo.split("|")[0] == "0"){ //무정차
							htmCont += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>무정차</span></strong></p> ";	
						} else if (data[i].acdntInfo.split("|")[0] == "1"){ //우회
							htmCont += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a><span style='color:#F00; margin-left:10px;'>우회</span></strong></p> ";
						} 
						
						if(rtCd != "14"){
							htmCont += '<span class="lt '+fn_spdConfusion(data[i].stationSpd)+'"></span>';
							htmCont += '<span class="lb '+fn_spdConfusion(data[i].stationSpd)+'"></span>';
						} else {
							htmCont += '<span class="lt"></span>';
							htmCont += '<span class="lb"></span>';
						}
						
						htmCont += '<span class="icon"></span>';
					}else{
						htmCont += "\n			<p><strong><a href='#' onclick='openPopupBusStnP2P(\"" + data[i].arsId + "\", \"" + data[i].stnName + "\", \"" + data[i].posX + "\", \"" + data[i].posY + "\",  \"" + data[i].stationCd + "\",  \"" + data[i].acdntInfo + "\",  \"" + data[i].stnId + "\"); return false'>" + data[i].stnName + "(" + data[i].arsId + ")</a></strong></p> ";
						if(rtCd != "14"){
							htmCont += '<span class="lt '+fn_spdConfusion(data[i].stationSpd)+'"></span>';
							htmCont += '<span class="lb '+fn_spdConfusion(data[i].stationSpd)+'"></span>';
						} else {
							htmCont += '<span class="lt"></span>';
							htmCont += '<span class="lb"></span>';
						}
						htmCont += '<span class="icon"></span>';
					}
					
					//contentHtml += "\n			<p>(" + data[i].dir + ")방향</p> ";
					if (data[i].isBus) {
						if (data[i].rtCd != '14') {
							var busPosIcon = "icon_bus_pos_blue.png";
							if (data[i].busType == "0") { //일반
								busPosIcon = "icon_bus_pos_blue.png";
							} else if (data[i].busType == "1") { //저상
								busPosIcon = "icon_bus_pos_low.png";
							} else { //굴절 등
								busPosIcon = "icon_bus_pos_blue.png";
							}
						} else {
							var busPosIcon = "icon_bus_pos_hangang.png";
						}
						if (fn_getCongetion_st(data[i].congetion, data[i].isLast, data[i].rtCd, data[i].rerdeNum) != "<font color='#C0C0C0'>&nbsp;</font>"){
							htmCont += "\n			<span style='font-size: 0.8em; display: flex; position: absolute; right: 16px; top: 12%;'>";
							htmCont += "<span style='display: flex; flex-direction: column; align-items: flex-end; line-height: 1.5; margin: 0 3px;'>";
							htmCont += '<span>' + data[i].plainNo + '</span>';
							htmCont += '<span>';
							htmCont += fn_getCongetion_st(data[i].congetion, data[i].isLast, data[i].rtCd, data[i].rerdeNum) + '</span>';						
						} else {
							htmCont += "\n			<span style='font-size: 0.8em; display: flex; position: absolute; right: 16px; top: 12%; margin-top: 4px;'>";
							htmCont += "<span style='display: flex; flex-direction: row; align-items: center; line-height: 1.5; margin: 0 3px;'>";
							htmCont += '<span>' + data[i].plainNo + '</span>';					
						}
						htmCont += "</span>";
						htmCont += " <img src='/images/map/" + busPosIcon + "' alt='버스' style='object-fit: none'; />";
						htmCont += '</span>';
					} 
					htmCont += "\n		</li> ";
				}
			}
			htmCont += contentHtml;
			htmCont += "\n		</ul> ";
			htmCont += "\n	</div> ";
			
			$("#refresh_content").html(htmCont);
			if ($("#pop_busDetl").find(".tabs").find("li")[0].className == "active") {
				$("#layer_bustabs2").hide();
				$("#layer_bustabs1").show();
			} else {
				$("#layer_bustabs1").hide();
				$("#layer_bustabs2").show();
			}
		} else {
			alert("버스 정보가 존재하지 않습니다.");
		}
	});
}

/* ********************************************************
 * 버스 상세 팝업 =>>> 버스 정류소 팝업 생성
 ******************************************************** */
//[uinetworks]
function openPopupBusStnP2P(arsId, stnName, posX, posY, stationCd, ainfo, stnId) {
	if ($('#popup-closer') != undefined) $('#popup-closer').click();
	
	var coordinate = new ol.proj.transform([parseFloat(posX), parseFloat(posY)], epsg4326, epsgDaum);
	
	var linkId = arsId;
	var layerGubn = {"layerGubn" : "BUSSTN"};
	var icon;
	if(ainfo != 'null'){
		icon = "/images/map/map_icon_26_d.png";
		desc = "[우회]"+stnName + "(" + arsId + ")";
	}else{
		if (stationCd == "1" || stationCd == "2") {
			icon = "/images/map/map_icon_26_b.png";
		} else {
			icon = "/images/map/map_icon_26.png";
		}
		desc = stnName + "(" + arsId + ")";
	}
	//var desc = stnName + "(" + arsId + ")";
	for (var i=0; i<vectorIconLayers.length; i++) {
		map.removeLayer(vectorIconLayers[i]);
	}
	makeIconLayer(coordinate, linkId, icon, desc, desc);
	
	setTimeout(function() {
		var feature = {'code':arsId, 'desc':stnName+"("+arsId+")", 'flag':stnId};
		openPopupBusStn(feature, coordinate);
		map.getView().setCenter(coordinate);
	}, 100);
}

/* ********************************************************
 * 단속카메라 팝업 생성
 ******************************************************** */
function openPopupCamera(feature, coordinate, newAddr) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	var desc = feature.desc == undefined ? feature.get('desc') : feature.desc;
	if(newAddr == undefined){
		var data = feature.data == undefined ? feature.get('data') : feature.data;
		var newAddr = feature.newAddr == undefined ? data.newAddr : feature.newAddr;
	}
	
	var htmCont = "";
	$("#popup").removeClass();
	$("#popup").addClass("map_layer");
	$("#popup").addClass("bike");

	htmCont +="<div class='tit'><strong tabindex='1' id='popCameraNm'>" + desc + "</strong></div> ";
	htmCont +="<div class='content'> ";
	htmCont +="	<table class='tby01'> ";
	/*htmCont +="		<caption>" + desc + "</caption> ";*/
	htmCont +="		<colgroup> ";
	htmCont +="			<col style='width:100%'/> ";
	htmCont +="		</colgroup> ";
	htmCont +="		<tbody> ";
	htmCont +="			<tr> ";
	htmCont +="				<td class='last'>" + newAddr + "</td> ";
	htmCont +="			</tr> ";
	htmCont +="		</tbody> ";
	htmCont +="	</table> ";
	htmCont +="</div> ";
	
	content.innerHTML = htmCont;
	popup.setPosition(coordinate);
	$("#popCameraNm").focus();
}

/* ********************************************************
 * 주요도로소통 팝업 생성 (상행)
 ******************************************************** */
function openPopupRoad(feature, coordinate) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	var name = feature.name == undefined ? feature.get('name') : feature.name;
	
	var data = {"axisCd": code, "axisDirDivCd": "1"};	//상행을 먼저 조회
	var url = "/map/trafficMap/selectRoadDetailList.do";
	
	commonAjax(data, url, callback = function(returnData) {
		$("#popup").removeClass();
		$("#popup").addClass("map_layer");
		$("#popup").addClass("traffic");
		
		if (returnData != undefined && returnData.rows != undefined) {
			var data = returnData.rows;
			var htmCont = "";
			
			if (data.length > 0) {
				for (var i=0; i<data.length; i++) {
					htmCont += "\n		<tr> ";
					htmCont += "\n			<td>" + data[i].stNodeNm + "</td> ";
					htmCont += "\n			<td>" + data[i].edNodeNm + "</td> ";
					htmCont += "\n			<td>" + data[i].speed + "km/h" + "</td> ";
	
					//소통정보 구분
					if(data[i].trfClsCd == "0") {
						htmCont += "\n			<td><strong class=''>" + data[i].trfClsNm + "</strong></td> ";
					 }else if(data[i].trfClsCd == "1") {
						 htmCont += "\n			<td><strong class='fcGreen'>" + data[i].trfClsNm + "</strong></td> ";
					} else if(data[i].trfClsCd == "2") {
						htmCont += "\n			<td><strong class='fcYellow'>" + data[i].trfClsNm + "</strong></td> ";
					} else if(data[i].trfClsCd == "3") {
						htmCont += "\n			<td><strong class='fcRed'>" + data[i].trfClsNm + "</strong></td> ";
					}
					
					htmCont += "\n		</tr> ";
				}
				
				var popupNm = document.getElementById('popupNm').innerHTML
				var captionHtml = popupNm + "상행소통정보";
				$("#layer_traffic1>table>caption").html(captionHtml)
				var traffic_tbody1 = document.getElementById('traffic_tbody1'); 
				traffic_tbody1.innerHTML = htmCont;
				openPopupRoad2(feature, coordinate, true);
			} else {
				var htmCont = "";
				htmCont += "\n		<tr><td colspan='4'>검색된 내역이 없습니다.</td></tr> ";
				openPopupRoad2(feature, coordinate, false);
				
				var traffic_tbody1 = document.getElementById('traffic_tbody1'); 
				traffic_tbody1.innerHTML = htmCont;
				openPopupRoad2(feature, coordinate, true);
			}
		}
	});
}

/* ********************************************************
 * 주요도로소통 팝업 생성 (하행)
 ******************************************************** */
function openPopupRoad2(feature, coordinate, bUpData) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	var name = feature.name == undefined ? feature.get('name') : feature.name;
	
	var data = {"axisCd": code, "axisDirDivCd": "2"};	//상행을 먼저 조회
	var url = "/map/trafficMap/selectRoadDetailList.do";
	
	commonAjax(data, url, callback = function(returnData) {
		//alert(JSON.stringify(returnData));
		if (returnData != undefined && returnData.rows != undefined) {
			var data = returnData.rows;
			var htmCont = "";
	
			if (data.length > 0) {
				for(var i=0; i<data.length; i++){
					htmCont += "\n		<tr> ";
					htmCont += "\n			<td>" + data[i].stNodeNm + "</td> ";
					htmCont += "\n			<td>" + data[i].edNodeNm + "</td> ";
					htmCont += "\n			<td>" + data[i].speed + "km/h" + "</td> ";
	
					//소통정보 구분
					if(data[i].trfClsCd == "0") {
						htmCont += "\n			<td><strong class=''>" + data[i].trfClsNm + "</strong></td> ";
					 }else if(data[i].trfClsCd == "1") {
						 htmCont += "\n			<td><strong class='fcGreen'>" + data[i].trfClsNm + "</strong></td> ";
					} else if(data[i].trfClsCd == "2") {
						htmCont += "\n			<td><strong class='fcYellow'>" + data[i].trfClsNm + "</strong></td> ";
					} else if(data[i].trfClsCd == "3") {
						htmCont += "\n			<td><strong class='fcRed'>" + data[i].trfClsNm + "</strong></td> ";
					}
					
					htmCont += "\n		</tr> ";
				}
				
				var popupNm = document.getElementById('popupNm').innerHTML
				var captionHtml = popupNm + "하행소통정보";
				$("#layer_traffic2>table>caption").html(captionHtml)
				var traffic_tbody2 = document.getElementById('traffic_tbody2'); 
				traffic_tbody2.innerHTML = htmCont;
				
	//			popup.setPosition(coordinate);
				$("#pop_traffic").show();
				$("#popupNm").focus();
				//$("#pop_traffic_closer").focus();
			} else {
				if(bUpData) {	//상행데이터가 있을경우
					var htmCont = "";
					htmCont += "\n		<tr><td colspan='4'>검색된 내역이 없습니다.</td></tr> ";
					
					var traffic_tbody2 = document.getElementById('traffic_tbody2'); 
					traffic_tbody2.innerHTML = htmCont;
					
	//				popup.setPosition(coordinate);
					$("#pop_traffic").show();
					$("#popupNm").focus();
				} else {		//상행데이터가 없을경우
					alert("소통정보가 존재하지 않습니다.");
				}			
			}
		}
	});
}

/* ********************************************************
 * 택시승차대 팝업 생성
 ******************************************************** */
function openPopupTaxi(feature, coordinate) {
	var code = feature.code == undefined ? feature.get('code') : feature.code;
	var url = "/map/taxiMap/selectTaxiStopList.do";
	var data = {"taxiStatnId": code};
	
	commonAjax( data, url, callback = function(returnData) {
		if (returnData.rows != null) {
			var data = returnData.rows[0];
			
			var htmCont = "";
			$("#popup").removeClass();
			$("#popup").addClass("map_layer");
			$("#popup").addClass("bike");
			
			htmCont +="<div class='tit'><strong tabindex='1' id='popTaxiNm'>" + data.itlpc + "</strong></div> ";
			htmCont +="<div class='content'> ";
			htmCont +="	<table class='tby01'> ";
			/*htmCont +="		<caption>" + data.itlpc + "택시승차대정보</caption> ";*/
			htmCont +="		<colgroup> ";
			htmCont +="			<col style='width:100%'/> ";
			htmCont +="		</colgroup> ";
			htmCont +="		<tbody> ";
			htmCont +="			<tr> ";
			htmCont +="				<td class='last'>" + data.atdrcNm + data.adres + "</td> ";
			htmCont +="			</tr> ";
			htmCont +="		</tbody> ";
			htmCont +="	</table> ";
			htmCont +="</div> ";
			
			content.innerHTML = htmCont;
			
			popup.setPosition(coordinate);
			$("#popTaxiNm").focus();
		}
	});
}

/* ********************************************************
 * 상황판용 버스 정류소 팝업 생성
 ******************************************************** */
function openPopupBusStnBrd(feature, coordinate){
	var code = feature[0];
	var codeNm = feature[1];
	
	var openAPI = "/getStationByUidDetourAt";
	if (location.href.indexOf("localhost") >= 0 || location.href.indexOf("192") >= 0) { //개발
		openAPI = "/api/rest/stationinfo/getStationByUidDetourAt";
	}

	var url = "/map/getBusStn.do";
	var data = {"url": openAPI, "arsId": code};
	
	commonAjax( data, url, callback = function(returnData) {
		
		var data = returnData.rows;
		var htmCont = "";

		if(data.length > 0) {

			htmCont += "\n<dl style='top: 10px; z-index: 999;'> ";
			
			// 20160601 추가
			htmCont += "<dt>도착정보(Bus Arrival)</dt>";
			htmCont += "\n<dd class='mpCont1'>" + codeNm + "(" + code + ")</dd> ";
			// 20160601 추가 end.

			htmCont += "\n<dd class='mpCont2'> ";
			
			for(var i=0; i<data.length; i++){
				var busTypeNm1 = "일반";
				var busTypeNm2 = "일반";
				
				if (data[i].busType1 == "0") {
					busTypeNm1 = "일반";
				} else if (data[i].busType1 == "1") {
					busTypeNm1 = "저상";
				} else if (data[i].busType1 == "2") {
					busTypeNm1 = "굴절";
				}
				
				if (data[i].busType2 == "0") {
					busTypeNm2 = "일반";
				} else if (data[i].busType2 == "1") {
					busTypeNm2 = "저상";
				} else if (data[i].busType2 == "2") {
					busTypeNm2 = "굴절";
				}
				
				var arrmsgMin1 = fn_getArrmsg(data[i].arrmsg1); 
				var arrmsgMin2 = fn_getArrmsg(data[i].arrmsg2); 

				htmCont += "\n	<ul> ";
				htmCont += "\n		<li class='row1'><strong>" + getBusTypeHtmlBrd(data[i].routeType) + "" + data[i].rtNm + "</strong>";
				if (arrmsgMin1.indexOf("도착")) htmCont += "\n			<p><i style='background: #395cb3'>" + busTypeNm1 + "</i>" + arrmsgMin1 + "</p> ";
				else htmCont += "\n			<p><i style='background: #395cb3'>" + busTypeNm1 + "</i>" + arrmsgMin1 + " 도착</p> ";
				htmCont += "\n		</li> ";
				htmCont += "\n		<li class='row2'><strong>방면정보 : " + data[i].adirection + " 방향</strong>";
				htmCont += "\n			<p>다음버스시간 : " + arrmsgMin2 + "</p> ";
				htmCont += "\n		</li> ";
				htmCont += "\n	</ul> ";
			}

			htmCont += "\n	</dd> ";
			htmCont += "\n</dl> ";
			
			$("#popup").append(htmCont);
			popup.setPosition(coordinate);
			map.getView().setCenter(coordinate);

		}
	});
}

/* ********************************************************
 * 상황판용 버스 타입별 Html
 ******************************************************** */
function getBusTypeHtmlBrd(pRoutType) {

	var rtnHtml = "<span class='optBus1'>지선</span>";

	if (pRoutType == "3")
	{
		rtnHtml = "<span class='optBus2'>간선</span>";
	}
	else if (pRoutType == "4")
	{
		rtnHtml = "<span class='optBus1'>지선</span>";
	}
	else if (pRoutType == "5")
	{
		rtnHtml = "<span class='optBus4'>순환</span>";
	}
	else if (pRoutType == "6")
	{
		rtnHtml = "<span class='optBus3'>광역</span>";
	}
	else if (pRoutType == "2")	//마을버스
	{
		rtnHtml = "<span class='optBus5'>마을</span>";
	}
	else if (pRoutType == "1")
	{
		rtnHtml = "<span class='optBus6'>공항</span>";
	}
	else if (pRoutType == "7")
	{
		rtnHtml = "<span class='optBus7'>인천</span>";
	}
	else if (pRoutType == "8")
	{
		rtnHtml = "<span class='optBus8'>경기</span>";
	}
	else if (pRoutType == "10")
	{
		rtnHtml = "<span class='optBus10'>관광</span>";
	}
	else if (pRoutType == "12")
	{
		rtnHtml = "<span class='optBus12'>자율</span>";
	}
	else if (pRoutType == "13")
	{
		rtnHtml = "<span class='optBus13'>동행</span>";
	}
	else if (pRoutType == "14")
	{
		rtnHtml = "<span class='optBus14'>한강</span>";
	}
	
	return rtnHtml;
}

/* ********************************************************
 * 아이콘용 버스 타입별 Html
 ******************************************************** */
function getBusTypeClass(pRoutType) {
	var rtVal = "";
	
	//지선
	if (pRoutType == "4") rtVal = "list_btype1";
	//간선
	else if (pRoutType == "3") rtVal = "list_btype2";
	//순환
	else if (pRoutType == "5") rtVal = "list_btype4";
	//마을
	else if (pRoutType == "2") rtVal = "list_btype5";
	//공항
	else if (pRoutType == "1") rtVal = "list_btype6";
	//광역
	else if (pRoutType == "6") rtVal = "list_btype3";
	//인천
	else if (pRoutType == "7") rtVal = "list_btype7";
	//경기
	else if (pRoutType == "8") rtVal = "list_btype8";
	//관광
	else if (pRoutType == "10") rtVal = "list_btype10";
	//자율
	else if (pRoutType == "12") rtVal = "list_btype12";
	//동행
	else if (pRoutType == "13") rtVal = "list_btype13";
	//한강
	else if (pRoutType == "14") rtVal = "list_btype14";
	else rtVal = "list_btype3";
	
	return rtVal;
}

/* ********************************************************
 * 상황판용 지하철 팝업 생성
 ******************************************************** */
function openPopupSubwayBrd(code, coordinate){
	var arr = code.split("|");
	var statnId = arr[0];
	var subwayId = arr[1];
	
	var apiUrl = "/subwayInfo/";
	if (location.href.indexOf("localhost") >= 0 || location.href.indexOf("192") >= 0) { //개발
		apiUrl = "/api/rest/subwayInfo/";
	}
	
	var type1 = "getStatnById";
	var type2 = "getArvlByInfo";
	var type3 = "getBusByStatn";
	var type4 = "getLastcarByStatn";

	var data = {"url": apiUrl, "statnId": statnId, "subwayId": subwayId, "type1": type1, "type2": type2, "type3": type3, "type4": type4};
	var url = "/map/getSubway.do";
	
	commonAjax( data, url, callback = function(returnData) {
		
		if(returnData != null){
			
			var data1 = returnData.rows1[0];
			var data2 = returnData.rows2;
			var data3 = returnData.rows3;
			var data4 = returnData.rows4;
			var data5 = returnData.rows5;
		
			var htmCont = "";
			
			htmCont += "\n	<div style='top: 10px;'> ";
			htmCont += "\n		<div class='swTit " + getSubwayClassBrd(data1.subwayNm) + "'> ";
			htmCont += "\n			<p><span>" + data1.statnFnm + "</span><span>" + data1.statnTnm + "</span></p> ";
			htmCont += "\n			<strong><span>" + getSubwayNo(data1.subwayNm) + "</span>" + data1.statnNm + "</strong> ";
			htmCont += "\n		</div> ";
			
//			htmCont += "\n	<div class='swTab'> ";
//			htmCont += "\n		<p class='on'><a href='#layer_traintabs1' onclick='brdTrainTabs($(this)); return false;'>도착정보</a></p> ";
//			htmCont += "\n		<p><a href='#layer_traintabs2' onclick='brdTrainTabs($(this)); return false;'>기본정보</a></p> ";
//			htmCont += "\n		<p><a href='#layer_traintabs3' onclick='brdTrainTabs($(this)); return false;'>출구정보</a></p> ";
//			htmCont += "\n	</ul> ";

			htmCont += "\n	<div id='layer_traintabs1' class='swCont swCont1 display_none_'> ";
			htmCont += "\n		<table summary=''> ";
			htmCont += "\n			<caption></caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:50%'/> ";
			htmCont += "\n				<col style='width:*'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<tr> ";
			htmCont += "\n				<th>" + data1.statnFnm + " 방향</th> ";
			htmCont += "\n				<th>" + data1.statnTnm + " 방향</th> ";
			htmCont += "\n			</tr> ";
			htmCont += "\n			<tr> ";
			htmCont += "\n				<td> ";
			if(data2.length > 0) {
			   var dSeq = 1;
			   for(var i=0; i<data2.length; i++){
				   if(data2[i].updnLine == '하행'){
					   htmCont += "<p><strong><i>" + dSeq + "</i>" + data2[i].arvlMsg2 + "</strong><span>방면정보(" + data2[i].bStatnNm + " 방향)" + "</span></p>";
					   dSeq++;
				   }
			   }
			} else { // 운행정보 없음
				htmCont += "<span>운행정보없음</span>";
			}
			htmCont += "\n				</td> ";
			htmCont += "\n				<td> ";
			if(data2.length > 0) {
				var uSeq = 1;
				for(var i=0; i<data2.length; i++){
					if(data2[i].updnLine == '상행'){
						htmCont += "<p><strong><i>" + uSeq + "</i>" + data2[i].arvlMsg2 + "</strong><span>방면정보(" + data2[i].bStatnNm + " 방향)" + "</span></p>";
						uSeq++;
					}
				}
			} else { // 운행정보 없음
				htmCont += "<span>운행정보없음</span>";
			}
			htmCont += "\n				</td> ";
			htmCont += "\n			</tr> ";
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";
			
			htmCont += "\n	<div id='layer_traintabs2' class='swCont swCont2 display_none'> ";
			htmCont += "\n		<table summary=''> ";
			htmCont += "\n			<caption></caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:20%'/> ";
			htmCont += "\n				<col style='width:20%'/> ";
			htmCont += "\n				<col style='width:20%'/> ";
			htmCont += "\n				<col style='width:20%'/> ";
			htmCont += "\n				<col style='width:*'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<tr> ";
			htmCont += "\n				<th scope='col'>첫/막차</th> ";
			htmCont += "\n				<th scope='col'>방면</th> ";
			htmCont += "\n				<th scope='col'>평일</th> ";
			htmCont += "\n				<th scope='col'>토요일</th> ";
			htmCont += "\n				<th scope='col'>일·공휴일</th> ";
			htmCont += "\n			</tr> ";
			data4 = sortJSON(data4, 'lastcarNm', '321');
			if (data4.length > 0) {
				for(i=0;i<data4.length;i++) {
				htmCont += "\n		<tr> ";
				htmCont += "\n			<td>" + data4[i].lastcarNm + "</td> ";
				htmCont += "\n			<td>" + data4[i].statnNm + "</td> ";
				htmCont += "\n			<td>" + data4[i].arvlHm1 + "</td> ";
				htmCont += "\n			<td>" + data4[i].arvlHm2 + "</td> ";
				htmCont += "\n			<td>" + data4[i].arvlHm3 + "</td> ";
				htmCont += "\n		</tr> ";
				}
			} else {
				htmCont += "\n      <tr>";
				htmCont += "\n        	<td colspan='5' style='text-align:center'>첫차/막차 정보가 없습니다.</td>";
				htmCont += "\n      </tr>";
			}
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";

			htmCont += "\n	<div id='layer_traintabs3' class='swCont swCont3 display_none'> ";
			htmCont += "\n		<table summary=''> ";
			htmCont += "\n			<caption></caption> ";
			htmCont += "\n			<colgroup> ";
			htmCont += "\n				<col style='width:30%'/> ";
			htmCont += "\n				<col style='width:*'/> ";
			htmCont += "\n			</colgroup> ";
			htmCont += "\n			<tr>";
			htmCont += "\n				<th>출구번호</th>";
			htmCont += "\n				<th>출구정보</th>";
			htmCont += "\n			</tr>";
			if(data5.length != null){
				for(var j=0; j<data5.length; j++) {
					htmCont += "\n	<tr>";
					htmCont += "\n		<th>" + data5[j].exitNum + "</th>";
					htmCont += "\n		<td>" + data5[j].exitInfo + "</td>";
					htmCont += "\n	</tr>";
				}
			}
			htmCont += "\n		</table> ";
			htmCont += "\n	</div> ";
			htmCont += "\n</div>";
		
			$("#popup").append(htmCont);
			popup.setPosition(coordinate);
			map.getView().setCenter(coordinate);
		}
	}, false);
}

/* ********************************************************
 * 상황판용 지하철 노선별 CSS 클래스명
 ******************************************************** */
function getSubwayClassBrd(subwayNm) {
	rtVal = "opt1";
	
	if (subwayNm == "1호선") 		rtVal = "opt1";
	if (subwayNm == "2호선") 		rtVal = "opt2";
	if (subwayNm == "3호선") 		rtVal = "opt3";
	if (subwayNm == "4호선") 		rtVal = "opt4";
	if (subwayNm == "5호선") 		rtVal = "opt5";
	if (subwayNm == "6호선") 		rtVal = "opt6";
	if (subwayNm == "7호선") 		rtVal = "opt7";
	if (subwayNm == "8호선") 		rtVal = "opt8";
	if (subwayNm == "9호선") 		rtVal = "opt9";
	if (subwayNm == "분당선") 	rtVal = "opt10";
	if (subwayNm == "인천선") 	rtVal = "opt11";
	if (subwayNm == "인천1호선") 	rtVal = "opt11";
	if (subwayNm == "신분당선") 	rtVal = "opt12";
	if (subwayNm == "경의중앙선") 	rtVal = "opt13";
	if (subwayNm == "경춘선") 	rtVal = "opt14";
	if (subwayNm == "공항철도") 	rtVal = "opt15";
	if (subwayNm == "의정부선") 	rtVal = "opt16";
	if (subwayNm == "에버라인선") 	rtVal = "opt17";
	if (subwayNm == "수인선") 	rtVal = "opt18";
	
	return rtVal;
}

/* ********************************************************
 * 상황판용 지하철 노선 번호
 ******************************************************** */
function getSubwayNo(subwayNm) {
	rtVal = "1";
	
	if (subwayNm == "1호선") 		rtVal = "1";
	if (subwayNm == "2호선") 		rtVal = "2";
	if (subwayNm == "3호선") 		rtVal = "3";
	if (subwayNm == "4호선") 		rtVal = "4";
	if (subwayNm == "5호선") 		rtVal = "5";
	if (subwayNm == "6호선") 		rtVal = "6";
	if (subwayNm == "7호선") 		rtVal = "7";
	if (subwayNm == "8호선") 		rtVal = "8";
	if (subwayNm == "9호선") 		rtVal = "9";
	if (subwayNm == "분당선") 	rtVal = "분당";
	if (subwayNm == "인천선") 	rtVal = "인천";
	if (subwayNm == "인천1호선") 	rtVal = "인천";
	if (subwayNm == "신분당선") 	rtVal = "신분당";
	if (subwayNm == "경의중앙선") 	rtVal = "경의중앙";
	if (subwayNm == "경춘선") 	rtVal = "경춘";
	if (subwayNm == "공항철도") 	rtVal = "공항";
	if (subwayNm == "의정부선") 	rtVal = "의정부";
	if (subwayNm == "에버라인선") 	rtVal = "에버라인";
	if (subwayNm == "수인선") 	rtVal = "수인";
	
	return rtVal;
}

/* ********************************************************
 * 버스 정류소 팝업 차내 혼잡도 표시
 ******************************************************** */
function fn_getCongetion(cong, isLast, routeType, arrmsg, detourAt) {
	var rtVal = "&nbsp;";
	if(arrmsg == "운행종료" || arrmsg == "출발대기") return rtVal;
	if(detourAt == "11" || detourAt == "13" || detourAt == "16" || detourAt == "17") return rtVal;
	
	if (isLast == "1") { //막차
		rtVal = "<label style='display: inline-block; width: 43px; height: 18px; line-height: 21px; background-color: #f00; color: #fff; font-size: 12.5px; margin-left: 5px; border-radius: 3px; font-weight: bold; text-align: center;'>막차</label>";
	} else {
		if (routeType == "6" || routeType == "14") { //광역, 한강
			rtVal = "<label style='display: inline-block; width: 43px; height: 18px; line-height: 21px; background-color: #0c82e9; color: #fff; font-size: 10.5px; margin-left: 5px; border-radius: 3px; font-weight: bold; text-align: center;'>잔여 "+cong+"</label>";
		} else {
			if (cong == "3") { //여유 
				rtVal = "<img src='/common/img/map/cong3.png' style='width: 43px; margin-top: 1px;'/>";
			} else if (cong == "4") { //보통
				rtVal = "<img src='/common/img/map/cong4.png' style='width: 43px; margin-top: 1px;'/>";
			} else if (cong == "5") { //혼잡
				rtVal = "<img src='/common/img/map/cong5.png' style='width: 43px; margin-top: 1px;'/>";
			}
		}
	}
	
	return rtVal;
}
/* ********************************************************
 * 버스 팝업 차내 잔여 좌석 표시
 ******************************************************** */
function fn_getCongetion_st(cong, isLast, rtCd, rerdeNum) {
	var rtVal = "<font color='#C0C0C0'>&nbsp;</font>";
	
	if (isLast) {
		rtVal = "<font color='#f00'>막차</font>";
	} else {
		if (rtCd == "6" || rtCd == "14") { //광역,한강
			rtVal = "<font color='#0c82e9'>잔여 "+rerdeNum+"</font>";
		} else {
			if (cong == "3") {
				rtVal = "<font color='#9ECB3A'>여유</font>";
			} else if (cong == "4") {
				rtVal = "<font color='#FEB825'>보통</font>";
			} else if (cong == "5") {
				rtVal = "<font color='#ED8560'>혼잡</font>";
			}
		}
	}
	
	return rtVal;
}

/* ********************************************************
 * 버스 팝업 소통 혼잡도 표시
 ******************************************************** */
function fn_spdConfusion(val) {
	if(val < 11) {
		return "confuse";
	} else if(val>10 && val <21){
		return "normal";
	} else {
		return "spare";
	}
}

/* ********************************************************
 * 버스 차내 혼잡도 팝업 창
 ******************************************************** */
function fn_btnConBus(code,rtCd,name,stnFirst,stnLast,turnPlaceStationId){
	var pop_container = document.getElementById('pop_busCon');
	var pop_content = document.getElementById('pop_busContent');
	if($("#currTimeCd").val() == undefined){
		paramTime = fn_getTodayDateTime();
		timeRange = [moveTime('minus'), paramTime, moveTime('plus')];
		
		prevTime = timeRange[0].hhmm
		currTime = timeRange[1].hhmm
		plusTime = timeRange[2].hhmm
		
	} else {
		prevTime = $('#prevTimeCd').val();
		currTime = $('#currTimeCd').val();
		plusTime = $('#plusTimeCd').val();
	}
	
	var data = {"routeId":code
			, prevTime : prevTime
			, currTime : currTime
			, plusTime : plusTime
			, dayOfWeek : "PREDICT_AVRG_LOAD_SUN"
			};
	var url = "/map/busMap/selectBusConList.do";
	var htmlCont = "";
	commonAjax(data, url, callback = function(returnData){
		var datas = returnData.rows;
		var htmlCont = "";
		
		if(datas.length > 0) {
			htmlCont += "\n<div id='" + code + "' class='tit' style='font-size: 17px; padding-right: 60px;' tabindex='1'>" + getBusTypeHtml(rtCd) + "<strong>" + name + "</strong> (" + stnFirst + "<span class='path_arrd'>↔</span>" + stnLast + ")</div> ";
			htmlCont += "\n<input type='hidden' id='prevTimeCd'>";
			htmlCont += "\n<input type='hidden' id='currTimeCd'>";
			htmlCont += "\n<input type='hidden' id='plusTimeCd'>";
			htmlCont += "\n<div class='dpl_time'>";
			htmlCont += "\n<select id='pdDt' onchange='fn_updateCon("+code+","+turnPlaceStationId+")' style='width: 38%; height: 30px; font-size: 15px; font-weight: bold; color:#444; float: left; margin: 10px 5px 5px 15px;' title='예보 날짜 선택'></select>";
			htmlCont += "\n<select id='pdHh' style='width: 18%; height: 24px; font-size: 12px; font-weight: bold; color:#999; display: none;' disabled='disabled' title='예보 시간 선택'></select>";
			htmlCont += "\n<select id='pdMm' style='width: 18%; height: 24px; font-size: 12px; font-weight: bold; color:#999; display: none;' disabled='disabled' title='예보 시간 선택'></select>";
			htmlCont += "\n<a href='#' class='direction' onclick='fn_timeMoveBtn(\"2minus\",\"minus\","+code+","+turnPlaceStationId+");return false; '> < </a>";
			htmlCont += "\n<span class='noselect' id='prev_time' style='text-decoration:none;'></span>";
			htmlCont += "\n<span id='curr_time'></span>";
			htmlCont += "\n<span class='noselect' id='plus_time'></span>";
			htmlCont += "\n<a href='#' class='direction' onclick='fn_timeMoveBtn(\"2plus\",\"plus\","+code+","+turnPlaceStationId+");return false;' style='margin-right:7px;'> > </a>";
			htmlCont += "\n</div>";
			
			htmlCont += "\n<div id='" + turnPlaceStationId + "' class='content'> ";
			
			htmlCont += "\n	<ul class='tabs'> ";
			htmlCont += "\n		<li class='active'> ";
			htmlCont += "\n			<a id='busConTabs1' href='#layer_busContabs1' onclick='busTabs($(this));return false;'>" + stnLast + " 방면</a> ";
			htmlCont += "\n		</li> ";
			htmlCont += "\n		<li> ";
			htmlCont += "\n			<a id='busConTabs2'href='#layer_busContabs2' onclick='busTabs($(this));return false;'>" + stnFirst + " 방면</a> ";
			htmlCont += "\n		</li> ";
			htmlCont += "\n	</ul> ";
			
			htmlCont += "\n	<div id='refresh_contentCon'> ";
			htmlCont += "\n	<div id='layer_busContabs1' class='busInfor busloc' style='display:block'> ";
			htmlCont += "\n		<ul class='busloclist'> ";
			
			var contentHtml = "";
			for (var i=0; i<datas.length; i++) {
				contentHtml += "\n		<li id = '"+datas[i].arsId+"pop'> ";
				if(datas[i].stnName.length > 8) {
					contentHtml += "\n			<p><strong>" + datas[i].stnName.substring(0,10)+"ㆍㆍㆍ</strong></p> ";
				} else {
					contentHtml += "\n			<p><strong>" + datas[i].stnName + "</strong></p> ";
				}
				contentHtml += '<div style="display: inline-block; position:absolute; top:0; right:0%">';
				contentHtml += '<img src = "'+getSitRate(datas[i].prevTime)+'" class="conImg"></span>';
				contentHtml += '<img src = "'+getSitRate(datas[i].currTime)+'" class="conImg"></span>';
				contentHtml += '<img src = "'+getSitRate(datas[i].plusTime)+'" class="conImg"></span>';
				contentHtml += '</div>';
				contentHtml += "\n		</li> ";
				
				if (datas[i].tkcarSttnId == turnPlaceStationId && i>1) {
					htmlCont += contentHtml;
					contentHtml = "";
					
					htmlCont += "\n		</ul> ";
					htmlCont += "\n	</div> ";
					htmlCont += "\n	<div id='layer_busContabs2' class='busInfor busloc'> ";
					htmlCont += "\n		<ul class='busloclist'> ";
					htmlCont += "\n		<li  id = '"+datas[i].arsId+"pop'> ";				
					if(datas[i].stnName.length > 8) {
						contentHtml += "\n			<p><strong>" + datas[i].stnName.substring(0,10)+"ㆍㆍㆍ</strong></p> ";
					} else {
						contentHtml += "\n			<p><strong>" + datas[i].stnName + "</strong></p> ";
					}
					contentHtml += '<div style="display: inline-block; position:absolute; top:0; right:0%">';
					contentHtml += '<img src = "'+getSitRate(datas[i].prevTime)+'" class="conImg"></span>';
					contentHtml += '<img src = "'+getSitRate(datas[i].currTime)+'" class="conImg"></span>';
					contentHtml += '<img src = "'+getSitRate(datas[i].plusTime)+'" class="conImg"></span>';
					contentHtml += '</div>';
					contentHtml += "\n		</li> ";
				}
			}
			htmlCont += contentHtml;
			htmlCont += "\n		</ul> ";
			htmlCont += "\n	</div> ";
			htmlCont += "\n	</div> ";
			htmlCont += "\n</div> ";
			htmlCont += "\n</div> ";
		} else {
			htmlCont += '<li style="padding-left:10px; margin-top:10px; margin-bottom:10px;">버스정보없음</li>';
		}
		
		pop_content.innerHTML = htmlCont;
		
		var nowDate = new Date();
		for (var i=0; i<7; i++) {
			var year = nowDate.getFullYear();
		 	var mon = (""+(nowDate.getMonth()+1)).digits(2);
		 	var day = (""+nowDate.getDate()).digits(2);
			$("#pdDt").append("<option value='"+year+mon+day+"'>"+year+"년 "+mon+"월 "+day+"일</option>");
			
			if (i == 0) stndDtF = year+""+mon+""+day;
			else if (i == 6) stndDtT = year+""+mon+""+day;
			
			nowDate.setDate(nowDate.getDate()+1);
		}
		
		for (var i=6; i<=21; i++) {
			$("#pdHh").append("<option value='"+(""+i).digits(2)+"'>"+(""+i).digits(2)+" 시</option>");
		}
		for (var i=0; i<=55; i+=15) {
			$("#pdMm").append("<option value='"+(""+i).digits(2)+"'>"+(""+i).digits(2)+" 분</option>");
		}
		
		var todayDate = new Date();
		var tempHh = todayDate.getHours();
		var nowHh = todayDate.getHours();
		var nowMm = todayDate.getMinutes();
		stndHh = todayDate.getHours()+1;
		stndMm = todayDate.getMinutes();
		stndMm = (parseInt(stndMm / 15) + 1) * 15;
		if (stndMm == 60) {
			if (todayDate.getHours() < 22) {
				stndHh = stndHh + 1;
				stndMm = 0;
			} else {
				stndHh = 22;
				stndMm = 45;
			}
		} else {
			if (todayDate.getHours() < 7) {
				stndMm = 0;
			} else if (todayDate.getHours() > 22) {
				stndHh = 22;
			}
		}
		
		$("#pdHh").val((""+stndHh).digits(2));
		$("#pdMm").val((""+stndMm).digits(2));
		
		paramTime = fn_getTodayDateTime();
		timeRange = [moveTime('minus'), paramTime, moveTime('plus')];
		
		$('#prevTimeCd').val(timeRange[0].hhmm);
		$('#currTimeCd').val(timeRange[1].hhmm);
		$('#plusTimeCd').val(timeRange[2].hhmm);
		
		$('#prev_time').html(timeRange[0].hhmm.substring(0,2)+":"+timeRange[0].hhmm.substring(2));
		$('#curr_time').html(timeRange[1].hhmm.substring(0,2)+":"+timeRange[1].hhmm.substring(2));
		$('#plus_time').html(timeRange[2].hhmm.substring(0,2)+":"+timeRange[2].hhmm.substring(2));
		
	});
	
	$("#pop_busCon").show();
	$("#pop_busCon").focus();
}

function fn_updateCon(routeId,turnPlaceStationId) {
	var data = { routeId: routeId
			, prevTime : $("#prevTimeCd").val()
			, currTime : $("#currTimeCd").val()
			, plusTime : $("#plusTimeCd").val()
			, dayOfWeek : fn_getWeekNum()
			};
	
	var url = "/map/busMap/selectBusConList.do";
	var htmlCont = "";
	commonAjax(data, url, callback = function(returnData){
		var datas = returnData.rows;
		var htmlCont = "";
		if(datas.length > 0) {
			
			htmlCont += "\n	<div id='layer_busContabs1' class='busInfor busloc' style='display:block'> ";
			htmlCont += "\n		<ul class='busloclist'> ";
	
			var contentHtml = "";
			for (var i=0; i<datas.length; i++) {
				contentHtml += "\n		<li id = '"+datas[i].arsId+"pop'> ";
				if(datas[i].stnName.length > 8) {
					contentHtml += "\n			<p><strong>" + datas[i].stnName.substring(0,10)+"ㆍㆍㆍ</strong></p> ";
				} else {
					contentHtml += "\n			<p><strong>" + datas[i].stnName + "</strong></p> ";
				}
				contentHtml += '<div style="display: inline-block; position:absolute; top:0; right:0%">';
				contentHtml += '<img src = "'+getSitRate(datas[i].prevTime)+'" class="conImg"></span>';
				contentHtml += '<img src = "'+getSitRate(datas[i].currTime)+'" class="conImg"></span>';
				contentHtml += '<img src = "'+getSitRate(datas[i].plusTime)+'" class="conImg"></span>';
				contentHtml += '</div>';
				contentHtml += "\n		</li> ";
				
				if (datas[i].tkcarSttnId == turnPlaceStationId && i>1) {
					htmlCont += contentHtml;
					contentHtml = "";
					
					htmlCont += "\n		</ul> ";
					htmlCont += "\n	</div> ";
					htmlCont += "\n	<div id='layer_busContabs2' class='busInfor busloc'> ";
					htmlCont += "\n		<ul class='busloclist'> ";
					htmlCont += "\n		<li  id = '"+datas[i].arsId+"pop'> ";				
					if(datas[i].stnName.length > 8) {
						contentHtml += "\n			<p><strong>" + datas[i].stnName.substring(0,10)+"ㆍㆍㆍ</strong></p> ";
					} else {
						contentHtml += "\n			<p><strong>" + datas[i].stnName + "</strong></p> ";
					}
					contentHtml += '<div style="display: inline-block; position:absolute; top:0; right:0%">';
					contentHtml += '<img src = "'+getSitRate(datas[i].prevTime)+'" class="conImg"></span>';
					contentHtml += '<img src = "'+getSitRate(datas[i].currTime)+'" class="conImg"></span>';
					contentHtml += '<img src = "'+getSitRate(datas[i].plusTime)+'" class="conImg"></span>';
					contentHtml += '</div>';
					contentHtml += "\n		</li> ";
				}
			}
			htmlCont += contentHtml;
			htmlCont += "\n		</ul> ";
			htmlCont += "\n	</div> ";
			htmlCont += "\n	</div> ";
			htmlCont += "\n</div> ";
			htmlCont += "\n</div> ";
		} else {
			htmlCont += '<li style="padding-left:10px; margin-top:10px; margin-bottom:10px;">버스정보없음</li>';
		}
		
		$("#refresh_contentCon").html(htmlCont);
		busTabs($("#busConTabs1"));
	});
	
}

function moveTimeRange(dir,pm) {
	if(parseInt(paramTime.hhmm) > 2320 && pm == "plus") {
		paramTime.hhmm = '2340';
	} else if (parseInt(paramTime.hhmm) < 31 && pm == "minus") {
		paramTime.hhmm = '0010';
	} else {
		paramTime = moveTime(dir);
	}

	timeRange = [moveTime('minus'), paramTime, moveTime('plus'), moveTime('next')];

	$('#prevTimeCd').val(timeRange[0].hhmm);
	$('#currTimeCd').val(timeRange[1].hhmm);
	$('#plusTimeCd').val(timeRange[2].hhmm);
	//$('#nextTimeCd').val(timeRange[3].hhmm);
	
	$('#prev_time').html(timeRange[0].hhmm.substring(0,2)+":"+timeRange[0].hhmm.substring(2));
	$('#curr_time').html(timeRange[1].hhmm.substring(0,2)+":"+timeRange[1].hhmm.substring(2));
	$('#plus_time').html(timeRange[2].hhmm.substring(0,2)+":"+timeRange[2].hhmm.substring(2));
	//$('#next_time').html(timeRange[3].hhmm.substring(0,2)+":"+timeRange[3].hhmm.substring(2));
}


function moveTime(direction){
	if(direction == "plus") directionOper = 1;
	else if(direction == "minus") directionOper = -1;
	else if(direction == "2minus") directionOper = -3;
	else if(direction == "2plus") directionOper = 3;
	
	var cdt = new Date(Number(paramTime.ymd.substring(0,4)), Number(paramTime.ymd.substring(4,6))-1, Number(paramTime.ymd.substring(6,8)), Number(paramTime.hhmm.substring(0,2)), Number(paramTime.hhmm.substring(2,4)), 0);
	var ndt = new Date(cdt.valueOf() + ((10 * 60 * 1000)*directionOper));
	var year = String(ndt.getFullYear());
	var month = String(ndt.getMonth() + 1);
	var day = String(ndt.getDate());
	
	month = (month.length == 1) ? "0" + month : month;
	day = (day.length == 1) ? "0" + day : day;

	var hour = String(ndt.getHours());
	var min = String(ndt.getMinutes());	
	
	hour = (hour.length == 1) ? "0" + hour : hour;
	min = (min.length == 1) ? "0" + min : min;
	
	return {
		ymd : year+month+day,
		hhmm : hour + min
	}
}

function fn_getTodayDateTime(){
	var ndt = new Date();
	var year = String(ndt.getFullYear());
	var month = String(ndt.getMonth() + 1);
	var day = String(ndt.getDate());
	
	month = (month.length == 1) ? "0" + month : month;
	day = (day.length == 1) ? "0" + day : day;

	var hour = String(ndt.getHours());
	var min = String(Math.floor(ndt.getMinutes() / 10)*10); //10분 주기
	hour = (hour.length == 1) ? "0" + hour : hour;
	min = (min.length == 1) ? "0" + min : min;
	
	if(hour == "00" && min == "00") min = "10";
	
	return {
		islive : true,
		ymd : year+month+day,
		hhmm : hour + min
	}
}

function fn_getWeekNum(){
	var nowDate = new Date();
	var year = nowDate.getFullYear();
 	var mon = (""+(nowDate.getMonth()+1)).digits(2);
 	var day = (""+nowDate.getDate()).digits(2);
	var conDate = year + mon + day;
	if($("#pdDt").val != undefined ){
		conDate = $("#pdDt").val();
	}
	
	var dayofweek = new Date(Number(conDate.substring(0,4)),Number(conDate.substring(4,6))-1,Number(conDate.substring(6,8))).getDay();
	switch (dayofweek) {
		case 0 : return "PREDICT_AVRG_LOAD_SUN";
		case 1 : return "PREDICT_AVRG_LOAD_MON";
		case 2 : return "PREDICT_AVRG_LOAD_TUES";
		case 3 : return "PREDICT_AVRG_LOAD_WED";
		case 4 : return "PREDICT_AVRG_LOAD_THUR";
		case 5 : return "PREDICT_AVRG_LOAD_FRI";
		case 6 : return "PREDICT_AVRG_LOAD_SAT";
	}
}

function getSitRate(val) {
	if(val > 41 ){
		return '/common/img/map/busConfuse.png';
	}else if(val > 20 && val < 41){
		return '/common/img/map/busNormal.png';
	}else{
		return '/common/img/map/busSpare.png';
	}
}

function fn_timeMoveBtn(time,move,routeId,turnPlaceStationId) {
	moveTimeRange(time,move);
	fn_updateCon(routeId,turnPlaceStationId);
}
