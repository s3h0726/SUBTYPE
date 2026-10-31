/* =========================================================
 * route.js v1.0
 * 경로탐색 관련 함수 
 * Copyright 2015 Seoul TOPIS
 * ========================================================== */

var v_keywork="";
var s_keyword="";
var v_flag = "";
var v_stepJson = {};	//step 정보 보관  
var v_summaryJson = {};	//summary 정보 보관
var v_linkInfo = "";	//link정보

var chkRanking = null;

var obj = {
	// 검색을 요청하는 함수 
 	pingSearch : function(pageIdx){ 
 
 		//검색어 특수문자 제외
 		if (fn_isSLetters(v_keywork)) return;
 		
 		if (v_keywork != ''){ 

 			var data = {"query":v_keywork,"page": pageIdx};
 			var headers = {};
 			headers["Authorization"] = "KakaoAK " + GL_KAKAO_KEY;		 //  /include/header.jsp  에서 정의함.

 	 		$.ajax({  
 	 			type : "GET",
 	 			url: GL_KAKAO_URL_LOCAL, 				//  /include/header.jsp  에서 정의함.
 	 			headers : headers,
 	 			data : data,    
 	 			dataType: 'json',
 	 			success: function(returnData) {
 	 				fn_setPoiData(returnData , pageIdx); 
 	 			},
 	 	        error : function(xhr, status, error) {
 	 	            alert("에러발생");
 	 	        }     
 	 		});
		}else{
			alert("검색 키워드를 입력해 주십시오.");
		}
 		
 		chkRanking = null;
 	},
	// 좌표를 검색어로 주소를 요청하는 함수 
 	// 좌표-> 주소 변환
 	addrSearch : function(X, Y, flag){
 		v_flag = flag;

		if (X != '' && Y != ''){
			
			$( "#resultList" ).empty();
			$( "#dtlTab" ).hide();
			
	 		document.getElementById('resultList').innerHTML = '';	
	 		document.getElementById('pagination').innerHTML = '';	
			
			var coordinates = ol.proj.transform([X, Y], epsgDaum, epsg4326);
			if(v_flag == 'start'){
				$("#startX").val(coordinates[0]);
				$("#startY").val(coordinates[1]);
			}else if(v_flag == 'end'){
				$("#endX").val(coordinates[0]);
				$("#endY").val(coordinates[1]);
			}else if(v_flag == 'via1'){
				$("#viaX1").val(coordinates[0]);
				$("#viaY1").val(coordinates[1]);
			}else if(v_flag == 'via2'){
				$("#viaX2").val(coordinates[0]);
				$("#viaY2").val(coordinates[1]);
			}
			
			fn_setPlace(coordinates[0], coordinates[1], "", v_flag);
			
	 		var data = {"x":X,"y":Y,"input_coord":"WTM"};
	 		var headers = {};
	 		headers["Authorization"] = "KakaoAK " + GL_KAKAO_KEY;		 //  /include/header.jsp  에서 정의함.
	 		$.ajax({  
	 			type : "GET",
	 			url: GL_KAKAO_URL_COORD2ADDR, 				//  /include/header.jsp  에서 정의함.
	 			headers : headers,
	 			data : data,    
	 			dataType: 'json',
	 			success: function(returnData) { 
	 				if(returnData != null){	
	 	                for(var i=0; i<returnData.documents.length; i++){
	 						var data = returnData.documents[i];

	 						if(v_flag == 'start'){
	 							$("#startPlace").val(data.address.address_name);
	 						}else if(v_flag == 'end'){
	 							$("#endPlace").val(data.address.address_name);
	 						}else if(v_flag == 'via1'){
	 							$("#viaPlace1").val(data.address.address_name);
	 						}else if(v_flag == 'via2'){ 
	 							$("#viaPlace2").val(data.address.address_name);
	 						}
	 					} 
	 				}	
	 			},
	 	        error : function(xhr, status, error) {
	 	            alert("에러발생");
	 	        }     
	 		});
		}else{
			alert("좌표를 입력해 주십시오.");
		}
 	},
 	// 검색 결과를 뿌리는 함수 
	pongSearch : function(z){
		fn_setPoiData(z.channel);
	},
 	// addr 검색 결과를 뿌리는 함수 
	addrReturn : function(z){
		if(v_flag == 'start'){
			$("#startPlace").val(z.fullName);
		}else if(v_flag == 'end'){
			$("#endPlace").val(z.fullName);
		}else if(v_flag == 'via1'){
			$("#viaPlace1").val(z.fullName);
		}else if(v_flag == 'via2'){
			$("#viaPlace2").val(z.fullName);
		}
	}
};

//출발 경유 도착 아이콘 표시
function fn_setPlace(X, Y, title, flag){
	var coordinates = ol.proj.transform([X, Y], epsg4326, epsgDaum);
	
	if(flag == undefined) flag = v_flag;
	
	var id = "";
	if(flag == 'start'){
		fn_removeRoute('NAME', 'Icon_StartFlag');
		
		$("#startX").val(X);
		$("#startY").val(Y);
		$("#startPlace").val(title);
		$("#hiddenStartPlace").val(title);
		id="_StartFlag";
	}else if(flag == 'end'){
		fn_removeRoute('NAME', 'Icon_EndFlag');

		$("#endX").val(X);
		$("#endY").val(Y);
		$("#endPlace").val(title);
		$("#hiddenEndPlace").val(title);
		id="_EndFlag";
	}else if(flag == 'via1'){
		fn_removeRoute('NAME', 'Icon_Via1Flag');

		$("#viaX1").val(X);
		$("#viaY1").val(Y);
		$("#viaPlace1").val(title);
		$("#hiddenViaPlace1").val(title);
		id="_Via1Flag";
	}else if(flag == 'via2'){
		fn_removeRoute('NAME', 'Icon_Via2Flag');

		$("#viaX2").val(X);
		$("#viaY2").val(Y);
		$("#viaPlace2").val(title);
		$("#hiddenViaPlace2").val(title);
		id="_Via2Flag";
	}
	
	var icon = "/common/img/icon/map_icon_"+flag+".png";
	makeIconLayer(coordinates, id, icon, title);
	
	if (flag == v_flag) {
		map.getView().setCenter(coordinates);
		if (map.getView().getZoom() < 11) map.getView().setZoom(11);
	}
}

//출발 경유 도착 아이콘 표시(버스, 지하철)
function fn_setPlace2(X, Y, title, vTrans, flag){
	var coordinates = [parseFloat(X), parseFloat(Y)];
	var coordinateTrans;
	
	if(vTrans == undefined) vTrans = true;

	if (vTrans) {
		coordinateTrans = ol.proj.transform([X, Y], epsgDaum, epsg4326);
	} else {
		coordinateTrans = coordinates;
		coordinates = ol.proj.transform([X, Y], epsg4326, epsgDaum);
	}
	
	if(flag == undefined) flag = v_flag;

	var id = "";
	if(flag == 'start'){
		fn_removeRoute('NAME', 'Icon_StartFlag');
		
		$("#startX").val(coordinateTrans[0]);
		$("#startY").val(coordinateTrans[1]);
		$("#startPlace").val(title);
		$("#hiddenStartPlace").val(title);
		id="_StartFlag";
	}else if(flag == 'end'){
		fn_removeRoute('NAME', 'Icon_EndFlag');

		$("#endX").val(coordinateTrans[0]);
		$("#endY").val(coordinateTrans[1]);
		$("#endPlace").val(title);
		$("#hiddenEndPlace").val(title);
		id="_EndFlag";
	}else if(flag == 'via1'){
		fn_removeRoute('NAME', 'Icon_Via1Flag');

		$("#viaX1").val(coordinateTrans[0]);
		$("#viaY1").val(coordinateTrans[1]);
		$("#viaPlace1").val(title);
		$("#hiddenViaPlace1").val(title);
		id="_Via1Flag";
	}else if(flag == 'via2'){
		fn_removeRoute('NAME', 'Icon_Via2Flag');

		$("#viaX2").val(coordinateTrans[0]);
		$("#viaY2").val(coordinateTrans[1]);
		$("#viaPlace2").val(title);
		$("#hiddenViaPlace2").val(title);
		id="_Via2Flag";
	}
	
	var icon = "/common/img/icon/map_icon_"+flag+".png";
	makeIconLayer(coordinates, id, icon, title);
	
	if(flag == v_flag) map.getView().setCenter(coordinates);
}

//출발지, 도착지, 경유지 조회
function fn_searchPlace(keywork, flag){
	
	if (keywork == "") {
		alert("검색 키워드를 입력해 주십시오.");
		return;
	}
	
	//소통레이어 숨김
	/*if(MapLayer_Traffic_Level_1.getVisible() == true || MapLayer_Traffic_Level_2.getVisible() == true || MapLayer_Traffic_Level_3_1.getVisible() == true || MapLayer_Traffic_Level_3_2.getVisible() == true || MapLayer_Traffic_Level_4.getVisible() == true){
		setLayerVisible('traffic', '', 4);
	}*/

	v_flag = flag;
	v_keywork = "서울 " + keywork;	//서울 이외의 지역은 검색이 안되도록 수정. 2015.09.23 이성원
	s_keyword = keywork;	//정류소, 지하철 검색용 "서울" 제외 키워드
	obj.pingSearch(1);
}
 

/* ********************************************************
 * 경로 지도표시
 ******************************************************** */
function fn_goMakeLineLayer(idx) {
	window.oriScroll = $(window).scrollTop();
	
	/*20231222 삭제 fn_loadPrData(idx, function(){
		//$('#pr_container').show(); 
	});*/
	
	if ($(".step_" + idx).css("display") == "none") {
		fn_viewStep(idx);
	}
	
	chkRanking = idx;
	
	var v_step = v_stepJson[idx];
	var v_summary = v_summaryJson[idx];
		
	var colorList = { 
		"DEPT":"/images/map/icon_construction.gif", 	//도보이동(승차,출발)
//		"SUB":"#0000FF", 								//지하철이동
		"SUB":"#00B3FD", 								//지하철이동
		"TRNS":"/images/map/icon_event.gif", 			//환승이동
//		"BUS":"#FF0000",								//버스이동
		"BUS":"#00B3FD",								//버스이동
		"ARVL":"/images/map/icon_construction.gif" ,	//도보이동(하차,도착)
//		undefined:"#FF0000"
		undefined:"#00B3FD"
	};
	
	var summaryIdx = 0;
	
	//layer 삭제
	fn_removeRoute('LINE');
	fn_removeRoute('AREA');
	
	var minX = 999999999, minY = 999999999, maxX = 0, maxY = 0;
	
	var startName = "", startArsId = "", endName = "", endArsId = "";
	var trnsName = [], trnsArsId = [], trnsSeq = 0;
	if (v_summary != undefined && v_summary.length > 0) {
		if (v_summary[0].startArsId == "" || v_summary[0].startArsId == "-") {
			startName  = v_summary[0].startName;
			startArsId = v_summary[0].routeName;
		} else {
			startName  = v_summary[0].startName;
			startArsId = v_summary[0].startArsId;
		}
		
		if (v_summary[v_summary.length-1].endArsId == "" || v_summary[v_summary.length-1].endArsId == "-") {
			endName    = v_summary[v_summary.length-1].endName;
			endArsId = v_summary[v_summary.length-1].routeName;
		} else {
			endName    = v_summary[v_summary.length-1].endName;
			endArsId   = v_summary[v_summary.length-1].endArsId;
		}
		
		if (v_summary.length > 1) {
			for (var i=0; i<=v_summary.length-2; i++) {
				trnsName.push(v_summary[i].endName);
				trnsArsId.push(v_summary[i].endArsId == "" || v_summary[i].endArsId == "-" ? v_summary[i].routeName : v_summary[i].endArsId);
				
				trnsName.push(v_summary[i+1].startName);
				trnsArsId.push(v_summary[i+1].startArsId == "" || v_summary[i+1].startArsId == "-" ? v_summary[i+1].routeName : v_summary[i+1].startArsId);
			}
		}
	}
	
	for (var j=0; j<v_step.length; j++) {
		for (var k=0; k<v_step.length; k++) {	//seq 순서대로 표출하기 위함
			if (j+1 == v_step[k].seq) {
				var step = v_step[j];
//				var summary = v_summary[summaryIdx];
				
				var color = colorList[step.type];
				var info = "";
				if (v_step[k].seq == v_step.length) {	//마지막 스텝인경우
					pointX = step.endX;
					pointY = step.endY;
				}
				
				if (step.polyline != undefined && step.polyline != "\"null\"") {
					
					var coordinates = [];
					var temp = step.polyline.split("|");
				
					for (var n=0; n<temp.length/2; n++) {
						var x = parseFloat(temp[n*2]);
						var y = parseFloat(temp[n*2+1]);
						if (x < 300000 && y < 500000) {
							coordinates.push([ x, y ]);
							
							if (minX > x && x > 0) minX = x;
					        if (minY > y && y > 0) minY = y;
					        if (maxX < x && x > 0) maxX = x;
					        if (maxY < y && y > 0) maxY = y;
						}
					}
					
					if (step.info != undefined) {
						var summary = v_summary[summaryIdx];
						
						if (step.type == "SUB") {			//지하철은 정류소 arsId가 없으므로 summaryIdx만 1증가.
							info = step.info;
							summaryIdx++;
						} else if (step.type == "BUS") {	//버스의 경우 info에 arsId 가공 삽입 필요. (예: "1005-1광주(서울역버스환승센터->신사역.푸른저축은행)" ==> "1005-1광주(서울역버스환승센터(02005)->신사역.푸른저축은행(22015))")
							info = summary.routeName + "(" + summary.startName + "(" + summary.startArsId + ")" + "->" + summary.endName + "(" + summary.endArsId + "))";
							summaryIdx++;
						} else {
							info = step.info;
						}
					}
					//console.log(coordinates);
					makeRouteLineLayer(coordinates, info, 'N', color);
				}
				
				/**
				*	DESC : 지도에 아이콘 표시 (승차, 하차, 환승)
				*	1.DEPT 다음 첫 좌표에 "승차" 아이콘 표시
				*	2.TRNS 전 마지막 좌표, 다음 첫 좌표에 "환승" 아이콘 표시 
				*	3.ARVL 전 마지막 좌표에 "하차" 아이콘 표시 
				**/
				//도보(출발)
				if (step.type == "DEPT") {
					var tempNext = v_step[j+1].polyline.split("|");
					var x = parseFloat(tempNext[0]);
					var y = parseFloat(tempNext[1]);
					var coordinate = [ x, y ];
					var icon = "/common/img/icon/total_icon_geton.png";
					
					//map.getView().setCenter(coordinate); //출발지로 이동
					
					var tipText = "승차";
					if (startName != "" && startName != "-") tipText += " - "+startName;
					if (startArsId != "" && startArsId != "-") tipText += " ("+startArsId+")";
					if(hpMapDivCd == "N" || hpMapDivCd == "S"){
						coordinate = ol.proj.transform(coordinate,"EPSG:5181",epsgDaum);
					}			
					makeIconLayer(coordinate, "_GetOn", icon, tipText);
					
					if (minX > x && x > 0) minX = x;
			        if (minY > y && y > 0) minY = y;
			        if (maxX < x && x > 0) maxX = x;
			        if (maxY < y && y > 0) maxY = y;
				}
				//환승
				if (step.type == "TRNS") {
					var tempNext = v_step[j+1].polyline.split("|");
					var tempPre = v_step[j-1].polyline.split("|");
					var x, y, coordinate;
					var tipText;
					var icon = "/common/img/icon/total_icon_trans.png";
					
					//환승(하차)
					x = parseFloat(tempPre[tempPre.length - 2]);
					y = parseFloat(tempPre[tempPre.length - 1]);
					coordinate = [ x, y ];
					
					tipText = "환승(하차)";
					if (trnsName.length > 0) {
						if (trnsName[trnsSeq] != "" && trnsName[trnsSeq] != "-") tipText += " - "+trnsName[trnsSeq];
						if (trnsArsId[trnsSeq] != "" && trnsArsId[trnsSeq] != "-") tipText += " ("+trnsArsId[trnsSeq]+")";
						trnsSeq++;
					}
					if(hpMapDivCd == "N" || hpMapDivCd == "S"){
						coordinate = ol.proj.transform(coordinate,"EPSG:5181",epsgDaum);
					}
					makeIconLayer(coordinate, step.idx, icon, tipText);
					
					if (minX > x && x > 0) minX = x;
			        if (minY > y && y > 0) minY = y;
			        if (maxX < x && x > 0) maxX = x;
			        if (maxY < y && y > 0) maxY = y;
					
			        //환승(승차)
					x = parseFloat(tempNext[0]);
					y = parseFloat(tempNext[1]);
					coordinate = [ x, y ];
										
					tipText = "환승(승차)";
					if (trnsName.length > 0) {
						if (trnsName[trnsSeq] != "" && trnsName[trnsSeq] != "-") tipText += " - "+trnsName[trnsSeq];
						if (trnsArsId[trnsSeq] != "" && trnsArsId[trnsSeq] != "-") tipText += " ("+trnsArsId[trnsSeq]+")";
						trnsSeq++;
					}
					if(hpMapDivCd == "N" || hpMapDivCd == "S"){
						coordinate = ol.proj.transform(coordinate,"EPSG:5181",epsgDaum);
					}
					makeIconLayer(coordinate, step.idx, icon, tipText);
					
					if (minX > x && x > 0) minX = x;
			        if (minY > y && y > 0) minY = y;
			        if (maxX < x && x > 0) maxX = x;
			        if (maxY < y && y > 0) maxY = y;
				}
				//도보(도착)
				if (step.type == "ARVL") {
					var tempPre = v_step[j-1].polyline.split("|");
					var x = parseFloat(tempPre[tempPre.length - 2]);
					var y = parseFloat(tempPre[tempPre.length - 1]);
					var coordinate = [ x, y ];
					var icon = "/common/img/icon/total_icon_getoff.png";
					
					var tipText = "하차";
					if (endName != "" && endName != "-") tipText += " - "+endName;
					if (endArsId != "" && endArsId != "-") tipText += " ("+endArsId+")";
					if(hpMapDivCd == "N" || hpMapDivCd == "S"){
						coordinate = ol.proj.transform(coordinate,"EPSG:5181",epsgDaum);
					}
					makeIconLayer(coordinate, "_GetOff", icon, tipText);
					
					if (minX > x && x > 0) minX = x;
			        if (minY > y && y > 0) minY = y;
			        if (maxX < x && x > 0) maxX = x;
			        if (maxY < y && y > 0) maxY = y;
				}
				
				break;
			}	
		}	
	}
	
	if (minX != null && minY != null && maxX != null && maxY != null) {
		var bottomLeft = [minX, minY];
        var topRight = [maxX, maxY];
        bottomLeft = ol.proj.transform(bottomLeft,'EPSG:5181',epsgDaum);
        topRight = ol.proj.transform(topRight,'EPSG:5181',epsgDaum);
        var extent = new ol.extent.boundingExtent([bottomLeft, topRight]);
        
        map.getView().fit(extent, map.getSize());
    }
	
//	fn_drawDestArea($("#endX").val(), $("#endY").val());
	
	$(window).scrollTop(window.oriScroll);
}

function fn_goMakeLineLayer2(idx) {
	if (chkRanking == idx) return;
	
	var v_step = v_stepJson[idx];
	var v_summary = v_summaryJson[idx];
	
	var colorList = { 
		"DEPT":"/images/map/icon_construction.gif", 	//도보이동(승차,출발)
		"SUB":"rgba(0,179,253,0.5)", 								//지하철이동
		"TRNS":"/images/map/icon_event.gif", 			//환승이동
		"BUS":"rgba(0,179,253,0.5)",								//버스이동
		"ARVL":"/images/map/icon_construction.gif" ,	//도보이동(하차,도착)
		undefined:"rgba(0,179,253,0.5)"
	};
	
	var summaryIdx = 0;
	
	fn_removeRouteLine();
	
	for (var j=0; j<v_step.length; j++) {
		for(var k=0; k<v_step.length; k++){	//seq 순서대로 표출하기 위함
			if(j+1 == v_step[k].seq){
				var step = v_step[j];
				
				var color = colorList[step.type];
				var info = "";
				
				if (step.polyline != undefined && step.polyline != "\"null\"") {
					var coordinates = [];
					var temp = step.polyline.split("|");
				
					for (var n=0; n<temp.length/2; n++) {
						coordinates.push([ parseFloat(temp[n*2]), parseFloat(temp[n*2+1]) ]);
					}
					
					if (step.info != undefined) {
						var summary = v_summary[summaryIdx];
						
						if (step.type == "SUB") {			//지하철은 정류소 arsId가 없으므로 summaryIdx만 1증가.
							info = step.info;
							summaryIdx++;
						} else if (step.type == "BUS") {	//버스의 경우 info에 arsId 가공 삽입 필요. (예: "1005-1광주(서울역버스환승센터->신사역.푸른저축은행)" ==> "1005-1광주(서울역버스환승센터(02005)->신사역.푸른저축은행(22015))")
							info = summary.routeName + "(" + summary.startName + "(" + summary.startArsId + ")" + "->" + summary.endName + "(" + summary.endArsId + "))";
							summaryIdx++;
						} else {
							info = step.info;
						}
					}
					
					makeRouteLineLayer2(coordinates, "Temp"+info, 'N', color);
				}
				
				break;
			}	
		}	
	}
}


/* ********************************************************
 * 목적지 주변 주차장, 나눔카, 자전거 보관소 표시
 * 반경정보(200m)는 파라미터 테이블에 저장되어 있음 [param_id:dest_near_boundary]
 ******************************************************** */
function fn_drawDestArea(pointX, pointY){
	//기존 아이콘 삭제
	fn_removeRoute('AREA');
	
	//주차장
	var data = {"pointX":pointX, "pointY":pointY};
	
	commonAjax(data, "/map/parkMap/selectParkList.do", callback = function(returnData){

		//지도 iconLayer		
		var coordinates, linkId, icon, desc;
		
		if(returnData != null){		
			for(var i=0; i<returnData.rows.length; i++){
				
				var data = returnData.rows[i];
				
				coordinates = [data.posX, data.posY];
				linkId = data.parkCd;
				icon = "/common/img/map/map_icon_24.png";
				desc = data.parkNm;
				
				makeIconLayer(coordinates, linkId, icon, desc, data, true);
			}
		}
	}, false);

	//나눔카
	commonAjax(data, "/map/carShareMap/selectCarshareList.do", callback = function(returnData){
		//지도 iconLayer		
		var coordinates, linkId, icon, desc;
		
		if(returnData != null){		
			for(var i=0; i<returnData.rows.length; i++){
				
				var data = returnData.rows[i];
				coordinates = [data.lon, data.lat];
				linkId = data.spotId;
				icon = "/common/img/map/map_icon_22.png";
				desc = data.agent;
				
				makeIconLayer(coordinates, linkId, icon, desc, data, true);
			}
		}
	}, false);
	
	//자전거
	var data5181 = new ol.proj.transform([pointX, pointY], epsg4326, epsgDaum);
	var data = {"pointX":data5181[0], "pointY":data5181[1]};
	commonAjax(data, "/map/bicMap/selectBicList.do", callback = function(returnData){

		//지도 iconLayer		
		var coordinates, linkId, icon, desc;
		
		if(returnData != null){		
			for(var i=0; i<returnData.rows.length; i++){
				var data = returnData.rows[i];
				
				coordinates = [parseFloat(data.posX), parseFloat(data.posY)];
				linkId = data.bicRackId;
				icon = "/common/img/map/map_icon_18.png";
				desc = data.bicRackNm;
				
				makeIconLayer(coordinates, linkId, icon, desc, data);
			}
		}
	}, false);

	//CCTV
	if(v_linkInfo != ""){
		var data = {"linkId":v_linkInfo.replace(/,/gi, "!")};
		commonAjax(data, "/map/selectCctvInfoList.do", callback = function(returnData){
			//지도 iconLayer		
			var coordinates, linkId, icon, desc;
			
			if(returnData != null){		
				for(var i=0; i<returnData.rows.length; i++){
					
					var data = returnData.rows[i];
					data['layerGubn'] = 'CCTV';
					
					coordinates = [parseFloat(data.axX), parseFloat(data.axY)];
					linkId = data.cctvId;
					icon = "/common/img/map/map_icon_12.png";
					desc = data.cctvName;
					
					makeIconLayer(coordinates, linkId, icon, desc, data, true);
				}
			}
		}, false);
	}
}

/* ********************************************************
 * 경로 layer삭제
 ******************************************************** */
function fn_removeRoute(flag, name){
	if(name == undefined) name = '';
	
	for(var n=0; n<3; n++){
		var layers = map.getLayers();
		for(var i=0; i<layers.getLength(); i++) {
			var layer = layers.item(i);
			
			if(layer.get('name') == undefined) continue;
			
			if(flag == 'ALL'){
				if (layer.get('name').indexOf("Link") > -1 || layer.get('name').indexOf("Icon") > -1) {
					map.removeLayer(layer);
				}
			}else if(flag == 'NAME'){
				if (layer.get('name') == name) {
					map.removeLayer(layer);
				}
			}else if(flag == 'AREA'){	//목적지 주변 아이콘 삭제
				if (layer.get('name').indexOf("Icon") > -1 && layer.get('name') != "Icon_StartFlag" && layer.get('name') != "Icon_EndFlag" && layer.get('name') != "Icon_Via1Flag" && layer.get('name') != "Icon_Via2Flag"){ //출/도착/경유 표시 아이콘 제외
					map.removeLayer(layer);
				}
			}else{
				if (layer.get('name').indexOf("Link") > -1) {
					map.removeLayer(layer);
				}
			}
		}
	}
}

function fn_removeRouteLine() {
	for (var n=0; n<3; n++) {
		var layers = map.getLayers();
		for (var i=0; i<layers.getLength(); i++) {
			var layer = layers.item(i);
			
			if (layer.get('name') == undefined) continue;
			
			if (layer.get('name').indexOf("Temp") > -1) {
				map.removeLayer(layer);
			}
		}
	}
}

//경로탐색 상세 버스, 지하철 아이콘 클릭시 지도 이동
function fn_goIconCenter(posX, posY) {
	map.getView().setCenter([parseFloat(posX), parseFloat(posY)]);
}


//초기화 버튼 클릭 이벤트
function fn_routeClear() {
	$("#startPlace").val('');
	$("#viaPlace1").val('');
	$("#viaPlace2").val('');
	$("#endPlace").val('');
	$("#startX").val("");
	$("#startY").val("");
	$("#endX").val("");
	$("#endY").val("");
	$("#viaX1").val("");
	$("#viaY1").val("");
	$("#viaX2").val("");
	$("#viaY2").val("");
	
	$("#"+$("#mapSelectOption").val()+"Btn").css("background-color","#fff");
	$("#mapSelectOption").val("");

	fn_removeRoute('ALL');
	fn_removeRoute('LINE');
	fn_removeRoute('AREA');
	$( "#resultList" ).empty();
	$( "#dtlTab" ).hide();
	$("#pagination").empty();
	
	$("#pr-date").val("");
	$(".prmenuTabs").children("li").removeClass("active").addClass("death");
	$(".weatherContainer").hide();
	$("#gp_container").hide();
	$("#warningMsg").hide();
	$(".pr_container").hide();
	
	map.getView().setCenter(center);
	map.getView().setZoom(6);
}

//경로탐색
function fn_makeRouteLayer() {
	$("#lodingBar").show();
	
	var routeType = $("#routeType").val();
	
	if (routeType == 'pub') {
		alert("서울 지역 외 대중교통 정보제공은 제한이 있을수 있습니다.");
	} else {
		alert("서울 지역 외 출발/도착지 선택 시 경로정보가 제공되지 않습니다.");
	}
	
	//대중교통검색은 경유지 없음
	if (routeType == 'pub') {
		$("#viaPlace1").val("");
		$("#viaPlace2").val("");
	}

	var startName = $("#startPlace").val();
	var hiddenStartPlace = $("#hiddenStartPlace").val();
	
	startName = $.trim(startName);
	hiddenStartPlace = $.trim(hiddenStartPlace);
	
	if (hiddenStartPlace != '') {
		if (startName !=hiddenStartPlace) {
			alert("출발지를 검색 선택 후 이용해주세요.");
			$("#lodingBar").hide();
			return;
		}
	}
	
	if (startName == '') {
		$("#startX").val("");
		$("#startY").val("");
	}
	var startX = $("#startX").val();
	var startY = $("#startY").val();
	var endName = $("#endPlace").val();
	var hiddenEndPlace = $("#hiddenEndPlace").val();

	endName = $.trim(endName);
	hiddenEndPlace = $.trim(hiddenEndPlace);
	if (hiddenEndPlace != '') {
		if (endName != hiddenEndPlace) {
			alert("도착지를 검색 선택 후 이용해주세요.");
			$("#lodingBar").hide();
			return;
		}
	} 
	
	if (endName == '') {
		$("#endX").val("");
		$("#endY").val("");
	}
	var endX = $("#endX").val();
	var endY = $("#endY").val();
	var viaName1 = $("#viaPlace1").val();
	var hiddenViaPlace1 = $("#hiddenViaPlace1").val();
	viaName1 = $.trim(viaName1);
	hiddenViaPlace1 = $.trim(hiddenViaPlace1);
	if (viaName1 != hiddenViaPlace1) {
		alert("경유지1을 검색 선택 후 이용해주세요.");
		return;
	}
	
	if (viaName1 == '') {
		$("#viaX1").val("");
		$("#viaY1").val("");
	}
	var viaX1 = $("#viaX1").val();
	var viaY1 = $("#viaY1").val();
	var viaName2 = $("#viaPlace2").val();
	var hiddenViaPlace2 = $("#hiddenViaPlace2").val();
	viaName2 = $.trim(viaName2);
	hiddenViaPlace2 = $.trim(hiddenViaPlace2);
	if (viaName2 !=hiddenViaPlace2) {
		alert("경유지2을 검색 선택 후 이용해주세요.");
		return;
	}

	viaName2 = $.trim(viaName2);
	hiddenViaPlace2 = $.trim(hiddenViaPlace2);
	
	if (viaName2 == '') {
		$("#viaX2").val("");
		$("#viaY2").val("");
	}
	var viaX2 = $("#viaX2").val();
	var viaY2 = $("#viaY2").val();
	var viaCount = 0;
	if (viaX1 != '')	viaCount++;
	if (viaX2 != '')	viaCount++;
	
	if (startName == '') {
		alert("출발지를 입력해 주십시오..");
		$("#lodingBar").hide();
		return;
	}
	if (endName == '') {
		alert("도착지를 입력해 주십시오.");
		$("#lodingBar").hide();
		return;
	}
	if (startX == '' || startY == '') {
		alert("출발지를 선택해 주십시오.");
		$("#lodingBar").hide();
		return;
	}
	if (endX == '' || endY == '') {
		alert("도착지를 선택해 주십시오.");
		$("#lodingBar").hide();
		return;
	}

	var idx = 0;
	var routeOption = $("#routeOption").val();
	var walkDistance = $("#walkDistance").val();
	var param = "route";
	//승용차, 자전거 보행범위 제외
	if (routeType == "car" || routeType == "bike") walkDistance = "";
	
	$.ajax({  
		url: "/map/getRoute.do", 
		type: 'post',
		data: {"param":param,"prcsType": "web", "routeType": routeType, "routeOption": routeOption, "walkDistance": walkDistance, "startName": startName, "startX": startX, "startY": startY, "endName": endName, "endX": endX, "endY": endY, "viaName1": viaName1, "viaX1": viaX1, "viaY1": viaY1, "viaName2": viaName2, "viaX2": viaX2, "viaY2": viaY2, "viaCount": viaCount},
		dataType: 'json',
		success: function(json) {
			if (json.rows.error != undefined && json.rows.error != "") {
				alert(json.rows.error);
				return;
			}
			fn_setRouteData(json.rows);
		},
		error: function(xhr, status, error) {
			alert(error);
			$("#lodingBar").hide();
		}
	});  
}