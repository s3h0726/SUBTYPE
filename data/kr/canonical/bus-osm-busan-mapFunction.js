var xhrSchOption;
var xhrSchOption2;
var xhrSchType = "";

function fnXHRSchOption(sBusNum, gubun)
{	
	if(gubun == "line"){
		var sURL = "../Ajax/busLineList.asp?optBusNum=" +sBusNum;
	}else if(gubun == "line2"){
		var sURL = "../Ajax/busLineList.asp?optBusNum=" +sBusNum;
	}else if(gubun == "BRTLine"){
		var sURL = "../Ajax/BRTLineList.asp?optBusNum=" +sBusNum;
	}else if(gubun == "BRTLine2"){
		var sURL = "../Ajax/BRTLineList.asp?optBusNum=" +sBusNum;
	}else if(gubun == "BRTStop"){
		var sURL = "../Ajax/BRTBusStopList.asp?optBusNum=" +sBusNum;
	}else if(gubun == "co"){
		var sURL = "../Ajax/busCoInfo.asp?optCoID=" +sBusNum;		
	}else if(gubun == "co2"){
		var sURL = "../Ajax/busCoInfo2.asp?optCoID=" +sBusNum;		
	}else if(gubun == "gun"){
		var sURL = "../Ajax/gugunList.asp?gu=" +sBusNum;
	}else if(gubun == "coord"){
		var sURL = "../Ajax/nodeList.asp?busLineid=" +sBusNum;
	}else if(gubun == "coord2"){		
		var sURL = "../Ajax/busLineCoordList.asp?busLineid="+sBusNum;
	}else if(gubun == "bustimetable"){		
		var sURL = "../Ajax/busRuntimeList.asp?busLineid="+sBusNum;
	}else if(gubun == "start_end_time"){		
		var sURL = "../Ajax/busStartEndTimeList.asp?busLineid="+sBusNum;
	}else{
		var sURL = "../Ajax/busStopList.asp?optBusNum=" +sBusNum;
	}	
	
	//XHR 객체 얻기
	if (window.XMLHttpRequest) 
	{ 
		xhrSchOption = new XMLHttpRequest();
		
	} 	
	else
	{ 	
		 xhrSchOption = new ActiveXObject('Microsoft.XMLHTTP'); 	   	  
	} 
	
	//콜백함수지정(readyState값이 변할때마다 호출)
	if(gubun == "co"){
		xhrSchOption.onreadystatechange = cbXHRSchOption2;	
	}else if(gubun == "co2"){
		xhrSchOption.onreadystatechange = cbXHRSchOption2;	
	}else if(gubun == "gun"){
		xhrSchOption.onreadystatechange = gugunList;	
	}else if(gubun == "coord"){
		xhrSchOption.onreadystatechange = getCoord;	
	}else if(gubun == "coord2"){
		xhrSchOption.onreadystatechange = getCoord2;	
	}else if(gubun == "line2"){
		xhrSchOption.onreadystatechange = getlyLineInfo;	
	}else if(gubun == "bustimetable"){
		xhrSchOption.onreadystatechange = getBusTime;	
	}else if(gubun == "start_end_time"){
		xhrSchOption.onreadystatechange = getStartEndTime;	
	}else if(gubun == "BRTLine"){
		xhrSchOption.onreadystatechange = cbXHRSchOption;	
	}else if(gubun == "BRTLine2"){
		xhrSchOption.onreadystatechange = getlyLineInfo;	
	}else if(gubun == "BRTStop"){
		xhrSchOption.onreadystatechange = cbXHRSchOption;	
	}
	 else{
		xhrSchOption.onreadystatechange = cbXHRSchOption;
	} 
	
	//요청초기화
	xhrSchOption.open("GET", sURL, true);

	//서버에 요청
	xhrSchOption.send(null);
}


function fnResize()
{
	/*var nBodyHeight = $('#body1').attr("offsetHeight");
	var nHeader= $('#am_topm0').attr("offsetHeight");
	var nFooter = $('#am_footer').attr("offsetHeight");
	var nLeftTitle = $('#nwTtImg').attr("offsetHeight");*/
	var nBodyHeight = $('#body1').attr("clientHeight");
	var nHeader= $('#am_topm0').attr("clientHeight");
	var nFooter = $('#am_footer').attr("clientHeight");
	var nLeftTitle = $('#nwTtImg').attr("clientHeight");
	var nHeight = nBodyHeight-(nHeader+nFooter);

	var nBodyWidth = $('#body1').attr("offsetWidth");
	var nLeftWidth = $('#am_left').attr("offsetWidth");
	//alert(nLeftWidth);

	//$('#bline_search').css("height",nHeight-nLeftTitle+"px");
	$('#bline_search').css("height",nHeight-20+"px");	
	$('#ifResult2').css("height",nHeight-180+"px");
	$('#ifResult').css("height",nHeight-169+"px");
	$('#lyMap').css("height",nHeight-5+"px");	
	if(sMapBubun=="naver"){
		map_resize_nv(nBodyWidth-nLeftWidth,nHeight-5);
	}
	$('#ifrmBus').css("height",nHeight-5+"px");
	//$('#lyMap').css("width",nBodyWidth-nLeftWidth-3+"px");
		
	/* 결과레이어 리사이즈 */
	//fnResultResize(nHeight-nLeftTitle);
}

function fnMobileResize()
{
	
	var nBodyHeight = $('#body1').attr("clientHeight");
	alert(nBodyHeight);
	var nHeader= $('#mheader').attr("clientHeight");
	var nHeight = nBodyHeight-(nHeader);
		alert(nHeight);
	//$('#lymap').attr("style","height:300px");	
	$('#lymap').css("height",nHeight-5+"px");	
	
}

function fnBusIcon(bustype, busId){
	
	var busIcon = "";
	
	if(bustype == "일반버스"){
		busIcon = "ic_gnrbs.gif";
	}else if(bustype == "심야버스"){
		if(busId.substring(5,6)=="6"){
			busIcon = "ic_gnrbs.gif";
		}else{
			busIcon = "ic_stbs.gif";
		}
	}else if(bustype == "심야버스(급행)"){		
		busIcon = "ic_hrbs.gif";
	}else if(bustype == "심야버스(일반)"){		
		busIcon = "ic_gnrbs.gif";
	}else if(bustype == "급행버스"){		
		busIcon = "ic_hrbs.gif";
	}else if(bustype == "좌석버스(장유)"){		
		busIcon = "ic_stbs.gif";
	}else if(bustype == "좌석버스(산성)"){
		busIcon = "ic_stbs.gif";
	}else if(bustype == "좌석버스(공항)"){
		busIcon = "ic_stbs.gif";
	}else if(bustype == "좌석버스(용원)"){
		busIcon = "ic_stbs.gif";
	}else if(bustype == "마을버스"){
		busIcon = "ic_vlgbs.gif";
	}else if(bustype == "BRT"){
		busIcon = "ic_cbs.gif";
	}else{
		busIcon = "ic_gnrbs.gif";
	}
	return busIcon;
}

function fnBusIconClass(bustype, busId){
	
	var busIcon = "";
	
	if(bustype == "일반버스"){
		busIcon = "bus_blue1";
	}else if(bustype == "심야버스"){
		if(busId.substring(5,6)=="6"){
			busIcon = "bus_red1";
		}else{
			busIcon = "ic_stbs.gif";
		}
	}else if(bustype == "심야버스(급행)"){		
		busIcon = "bus_red1";
	}else if(bustype == "심야버스(일반)"){		
		busIcon = "bus_blue1";
	}else if(bustype == "급행버스"){		
		busIcon = "bus_red1";
	}else if(bustype == "좌석버스(장유)"){		
		busIcon = "bus_org1";
	}else if(bustype == "좌석버스(산성)"){
		busIcon = "bus_org1";
	}else if(bustype == "좌석버스(공항)"){
		busIcon = "bus_org1";
	}else if(bustype == "좌석버스(용원)"){
		busIcon = "bus_org1";
	}else if(bustype == "마을버스"){
		busIcon = "bus_green1";
	}else{
		busIcon = "bus_blue1";
	}
	return busIcon;
}

function cbXHRSchOption2(){

	//응답완료
		if(xhrSchOption.readyState == 4) 
		{		
			//상태:OK(200)			
			if(xhrSchOption.status == 200)
			{
				//서버응답
				var oNewDoc = xhrSchOption.responseXML;
				
				var newTel = "";
				var newAddr = "";
				var newEmail = "";	
				var newFax = "";			
								
				var oNewObj = xhrSchOption.responseXML.getElementsByTagName("bus");
				
				if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
				{
					$(".bline_info1_1").prepend("<p class=\"busno2\">운수사 정보</p>");
					for(var i=0; i < oNewObj.length; i++)
					{	
						newTel = oNewObj[i].attributes["text1"].value;
						newAddr = oNewObj[i].attributes["value1"].value;
						newEmail = "";
						newFax = oNewObj[i].attributes["text2"].value;
						if(newTel=="") newTel = "-";
						if(newAddr=="") newAddr = "-";
						if(newEmail=="") newEmail = "-";
						if(newFax=="") newFax = "-";				
						
						$(".bline_info3").append("<p class=\"th1\">회사명</p> <p class=\"td1\">"+oNewObj[i].attributes["text3"].value+"</p><p class=\"th1\">전화번호</p> <p class=\"td1\">"+newTel+"</p><p class=\"th1\">주소</p><p class=\"td1\">"+newAddr+"</p><p class=\"line\">.</p>");
	       
					}				
				}			
			}
		}
}


function co_lay(company, gubun, busType, lineID){
	$(".bline_info3").children().remove();
	$(".bline_info1_1").children(".busno2").remove();
	
	if(busType=="마을버스"){
		fnXHRSchOption(lineID, "co2");
	}else{
		fnXHRSchOption(company, "co");
	}
	if(gubun == "2"){
		$("#co_detail_onMap").attr("style", "display:black;position:absolute;left:310px;top:100px;");
	}else{
		$("#co_detail_onMap").attr("style", "display:black;position:absolute;left:550px;top:100px;");
	}
}
function co_close(){
	 $("#co_detail_onMap").attr("style", "display:none;");		
	 $(".bline_info3").children().remove();
}
function lyClose(){
	$("#bline_detail_onMap").attr("style", "display:none;");		
}

function fnBusIcon2(bustype){
	
	var busIcon = "";
	
	if(bustype == "0106"){			//일반
		busIcon = "ic_gnrbs.gif";
	}else if(bustype == "0108"){		// 급행
		busIcon = "ic_hrbs.gif";
	}else if(bustype == "0107"){		// 좌석
		busIcon = "ic_stbs.gif";
	}else if(bustype == "0109"){		//마을
		busIcon = "ic_vlgbs.gif";
	}else if(bustype == "062101"){		//1호선
		busIcon = "ic_sbw1.png";
	}else if(bustype == "062102"){		//2호선
		busIcon = "ic_sbw2.png";
	}else if(bustype == "062103"){		//3호선
		busIcon = "ic_sbw3.png";
	}else if(bustype == "062104"){		//4호선
		busIcon = "ic_sbw4.png";
	}else if(bustype == "062110"){		//5호선
		busIcon = "ic_sbw5.png";
	}else{
		busIcon = "ic_gnrbs.gif";
	}
	return busIcon;
}

function fnBusClass(bustype){
	
	var busClass = "";
	
	if(bustype == "0106"){			//일반
		busClass = "bus_blue";
	}else if(bustype == "0108"){		// 급행
		busClass = "bus_red";
	}else if(bustype == "0107"){		// 좌석
		busClass = "bus_org";
	}else if(bustype == "0109"){		//마을
		busClass = "bus_green";
	}else{
		busClass = "";
	}
	return busClass;
}

function fnGotype(sType){

	var imgType="";
	
	if (sType=="99"){
		imgType="ic_walk.gif";
	}else if(sType=="06"){
		imgType="ic_transfer.gif ";
	}else if(sType=="0"){
		imgType="ic_geton.gif ";
	}else if(sType=="100"){
		imgType="ic_getoff.gif ";
	}	
	return imgType;
}

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");   
}   



var aX;
var aY;
var aARSNO;
var aName;

function fnARSList(sX, sY, sARSNO, sName, stopID)
{

	aX = sX;
	aY = sY;
	aName =sName;
	aARSNO = sARSNO;

	var sURL = "../Ajax/map_Arrival.asp?optARSNO=" +stopID;

	
	//XHR 객체 얻기
	if (window.XMLHttpRequest) 
	{ 
		xhrSchOption = new XMLHttpRequest();
	} 	
	else
	{ 	
		 xhrSchOption = new ActiveXObject('Microsoft.XMLHTTP'); 	   	  
	} 	
	//콜백함수지정(readyState값이 변할때마다 호출)
	

	if(parent.sMapBubun=="naver"){
			xhrSchOption.onreadystatechange = cbXHRSchARSNO_naver;

		
	}else{
			xhrSchOption.onreadystatechange = cbXHRSchARSNO;
	}
	//요청초기화
	xhrSchOption.open("GET", sURL, true);

	//서버에 요청
	xhrSchOption.send(null);
}

                                                                            
// 정류서 검색시 지도 위 도착예정 올라가는 폼(리스트 뿌릴때)
function cbXHRSchARSNO(){
	
	//응답완료
	if(xhrSchOption.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOption.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOption.responseXML;		
			var oNewObj = xhrSchOption.responseXML.getElementsByTagName("bus");	
		
			var busInfo="";
			var stopBigo="";
			var functionType="";
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{		
				busInfo = busInfo +"<div id=\"bus_arrive3_onMap\">";	
				busInfo = busInfo +"<p class=\"title1\">["+aARSNO+"]  "+aName+"</p>";	
				busInfo = busInfo +" <div id=\"av_table1\">"			
				busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"
				busInfo = busInfo +"  <tr>"
				busInfo = busInfo +"  <th width=\"68\" scope=\"col\">노선번호</th> "
				busInfo = busInfo +"  <th width=\"58\" scope=\"col\">도착예정</th> "
				busInfo = busInfo +"  <th width=\"67\" scope=\"col\">현재위치</th> "
				busInfo = busInfo +"  <th width=\"87\" scope=\"col\">방 향</th> "
				busInfo = busInfo +"  </tr></table></div> "
				busInfo = busInfo +"<div class=\"bline_info4\">"
				busInfo = busInfo +" <div id=\"av_table1\">"		
				busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"							
				if(parent.sMunuNum == '1'){
					functionType = "_arri";
				}
				for(var i=0; i < oNewObj.length; i++)
				{	

					if(i==0){
							stopBigo = oNewObj[i].attributes["value7"].value;
						}
						if(oNewObj[i].attributes["value2"].value==""){
							busInfo = busInfo +"<tr><td width=\"68\"><span class=\"st\" style=\"cursor:hand\" onclick=\"lyOpen"+functionType+"('"+oNewObj[i].attributes["value6"].value+"', '"+oNewObj[i].attributes["value0"].value+"')\">"+oNewObj[i].attributes["value0"].value+"</span></td>";
							busInfo = busInfo +" <td class=\"red1 st\" width=\"58\"></td>";
							busInfo = busInfo + "<td width=\"77\">"+oNewObj[i].attributes["value4"].value+"</td>";
							busInfo = busInfo + " <td width=\"77\">"+oNewObj[i].attributes["value3"].value+"</td></tr>"		
						}else{		
							busInfo = busInfo +"<tr><td width=\"58\"><span class=\"st\" style=\"cursor:hand\" onclick=\"lyOpen"+functionType+"('"+oNewObj[i].attributes["value6"].value+"', '"+oNewObj[i].attributes["value0"].value+"')\">"+oNewObj[i].attributes["value0"].value+"</span></td>";
							busInfo = busInfo +" <td class=\"red1 st\" width=\"58\">"+oNewObj[i].attributes["value5"].value+"분</td>";
							busInfo = busInfo + "<td width=\"77\">"+oNewObj[i].attributes["value4"].value+"구간전</td>";
							busInfo = busInfo + " <td width=\"77\">"+oNewObj[i].attributes["value3"].value+"</td></tr>"								
						}
				}				
				if(oNewObj.length == 0){
					busInfo = busInfo + "<ul><li class=\"a\">버스가 없습니다.</li></ul>";
				}
				busInfo = busInfo +"</table> </div> </div></div>";
				parent.setMarker2(aX, aY, busInfo, aARSNO, stopBigo);
			}			
		}
	}  
}


// 정류서 검색시 지도 위 도착예정 올라가는 폼(리스트 뿌릴때)
function cbXHRSchARSNO_naver(){
	
	//응답완료
	if(xhrSchOption.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOption.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOption.responseXML;		
			var oNewObj = xhrSchOption.responseXML.getElementsByTagName("bus");			
			var busInfo="";
			var stopBigo="";
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{		
				busInfo = busInfo +"<div id=\"bus_arrive3_onMap_naver\">";	
				busInfo = busInfo +"<p class=\"title1\">["+aARSNO+"]  "+aName+"</p>";
				busInfo = busInfo +"<p class=\"xbtn\"><img src=\"../images/map/bt_close2.gif\" width=\"14\" height=\"13\" onclick=\"fnMapLayColse();\" style=\"cursor:pointer;\"/></p>";
				busInfo = busInfo +" <div id=\"av_table1\">";			
				busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
				busInfo = busInfo +"  <tr>";
				busInfo = busInfo +"  <th width=\"68\" scope=\"col\">노선번호</th> ";
				busInfo = busInfo +"  <th width=\"58\" scope=\"col\">도착예정</th> ";
				busInfo = busInfo +"  <th width=\"67\" scope=\"col\">현재위치</th> ";
				busInfo = busInfo +"  <th width=\"87\" scope=\"col\">방 향</th> ";
				busInfo = busInfo +"  </tr></table></div> ";
				busInfo = busInfo +"<div class=\"bline_info4\">";
				busInfo = busInfo +" <div id=\"av_table1\">";		
				busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"							
				
				for(var i=0; i < oNewObj.length; i++)
				{	
						if(i==0){
							stopBigo = oNewObj[i].attributes["value7"].value;
						}
						if(oNewObj[i].attributes["value5"].value==""){
							busInfo = busInfo +"<tr><td width=\"68\"><span class=\"st\" style=\"cursor:hand\" onclick=\"lyOpen('"+oNewObj[i].attributes["value6"].value+"', '"+oNewObj[i].attributes["value0"].value+"')\">"+oNewObj[i].attributes["value0"].value+"</span></td>";
							busInfo = busInfo +" <td class=\"red1 st\" width=\"58\"></td>";
							busInfo = busInfo + "<td width=\"77\">"+oNewObj[i].attributes["value4"].value+"</td>";
							busInfo = busInfo + " <td width=\"77\">"+oNewObj[i].attributes["value3"].value+"</td></tr>"		
						}else{		
							busInfo = busInfo +"<tr><td width=\"58\"><span class=\"st\" style=\"cursor:hand\" onclick=\"lyOpen('"+oNewObj[i].attributes["value6"].value+"', '"+oNewObj[i].attributes["value0"].value+"')\">"+oNewObj[i].attributes["value0"].value+"</span></td>";
							busInfo = busInfo +" <td class=\"red1 st\" width=\"58\">"+oNewObj[i].attributes["value5"].value+"분</td>";
							busInfo = busInfo + "<td width=\"77\">"+oNewObj[i].attributes["value4"].value+"구간전</td>";
							busInfo = busInfo + " <td width=\"77\">"+oNewObj[i].attributes["value3"].value+"</td></tr>"								
						}
				}				
				if(oNewObj.length == 0){
					busInfo = busInfo + "<ul><li class=\"a\">버스가 없습니다.</li></ul>";
				}
				busInfo = busInfo +"</table> </div> </div></div>";
				busInfo = busInfo +"<p class=\"arrow\"><img src=\"../images/map/arrow_point.png\" width=\"13\" height=\"9\" /></p>";
				parent.setMarker2(aX, aY, busInfo, aARSNO, stopBigo);
			}			
		}
	}  
}



// 정류서 검색시 지도 위 도착예정 올라가는 폼(리스트 뿌리기 전)
function getARSFrom(arsNo, stopName){
	
	var busInfo="";
	busInfo = busInfo +"<div id=\"bus_arrive3_onMap\">";
	busInfo = busInfo +"<p class=\"title1\">["+arsNo+"]  "+stopName+"</p>";		
	busInfo = busInfo +" <div id=\"av_table1\">"			
	busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"
	busInfo = busInfo +"  <tr>"
	busInfo = busInfo +"  <th width=\"48\" scope=\"col\">노선번호</th> "
	busInfo = busInfo +"  <th width=\"58\" scope=\"col\">도착예정</th> "
	busInfo = busInfo +"  <th width=\"67\" scope=\"col\">현재위치</th> "
	busInfo = busInfo +"  <th width=\"107\" scope=\"col\">종점</th> "
	busInfo = busInfo +"  </tr></table></div> "
	busInfo = busInfo +"<div class=\"bline_info3\">"
	busInfo = busInfo +" <div id=\"av_table1\">"		
	busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>"
	busInfo = busInfo +" <td style=\"width:100%; height:111px; padding:0px 0px 0 28px;border-bottom:none;\"><img src=\"../images/map/loading2.gif\"/></td></tr>";	 	
	busInfo = busInfo +"</table> </div> </div> </div>";
	
	return busInfo;
}


function getBRTFrom(arsNo, stopName){
	
	var busInfo="";
	busInfo = busInfo +"<div id=\"bus_arrive3_onMap\">";
	busInfo = busInfo +"<p class=\"title1\">["+arsNo+"]  "+stopName+"</p>";		
	busInfo = busInfo +" <div id=\"av_table1\">"			
	busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"
	busInfo = busInfo +"  <tr>"
	busInfo = busInfo +"  <th width=\"100%\" scope=\"col\">통과노선</th> "
	//busInfo = busInfo +"  <th width=\"58\" scope=\"col\">도착예정</th> "
	//busInfo = busInfo +"  <th width=\"67\" scope=\"col\">현재위치</th> "
	//busInfo = busInfo +"  <th width=\"107\" scope=\"col\">종점</th> "
	busInfo = busInfo +"  </tr></table></div> "
	busInfo = busInfo +"<div class=\"bline_info3\">"
	busInfo = busInfo +" <div id=\"av_table1\">"		
	busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>"
	busInfo = busInfo +" <td style=\"width:100%; height:111px; padding:0px 0px 0 28px;border-bottom:none;\"><img src=\"../images/map/loading2.gif\"/></td></tr>";	 	
	busInfo = busInfo +"</table> </div> </div> </div>";
	
	return busInfo;
}

function stationARSInfo(coordX, coordY, stopName, arsNo, stopID){

	var busInfo = getARSFrom(arsNo, stopName);
	parent.setMarker2(coordX, coordY, busInfo, arsNo, "");				
	fnARSList(coordX, coordY, arsNo, stopName, stopID);	
} 

function stationBRTInfo(coordX, coordY, stopName, arsNo, stopID){

	var busInfo = getBRTFrom(arsNo, stopName);
	parent.setMarker2(coordX, coordY, busInfo, arsNo, "");				
	fnBRTList2(coordX, coordY, arsNo, stopName, stopID);	
} 

var oCurObj="";
	
function lyOpen(busID, busNum){
	
	busStopNum = busNum;
	$(".bline_list").children().remove();
	$(".bline_info1").children().remove();
	$(".bline_info_2").children().remove();
	
	fnXHRSchOption(busID, "line2"); 	
	parent.sMunuNum = "3";	// 지도 레벨 3으로 만들기 위해서
 	oCurObj = $("#bline_detail_onMap").children();
	$("#bline_detail_onMap").attr("style", "display:black;position:absolute;left:310px;top:100px;");
}

function lyOpenBRT(busID, busNum){
	
	busStopNum = busNum;
	$(".bline_list").children().remove();
	$(".bline_info1").children().remove();
	$(".bline_info_2").children().remove();
	
	fnXHRSchOption(busID, "BRTLine2"); 	
		
	parent.sMunuNum = "3";	// 지도 레벨 3으로 만들기 위해서
 	oCurObj = $("#bline_detail_onMap").children();
	$("#bline_detail_onMap").attr("style", "display:black;position:absolute;left:310px;top:100px;");
}

function lyOpen_arri(busID, busNum){
	
	busStopNum = busNum;
	$(".bline_list").children().remove();
	$(".bline_info1").children().remove();
	$(".bline_info_2").children().remove();
	
	fnXHRSchOption(busID, "line2"); 	

 	oCurObj = $("#bline_detail_onMap").children();
	$("#bline_detail_onMap").attr("style", "display:black;position:absolute;left:310px;top:100px;");
}
//지도 위에 버스 노선 리스트 표시 
function getlyLineInfo() 
{
	//응답완료
	if(xhrSchOption.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOption.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOption.responseXML;
			
			var newText = "";
			var newID = "";
			var newValue = "";
			var newX ="";
			var newY ="";
			var newIcon="";
			var newIconClass ="";
			var newCo = "";
			var busTime = "";
			var busStop = "";		
			var busNum = "";		
			var busType = "";
			var remark2="";

			
			var oNewObj = xhrSchOption.responseXML.getElementsByTagName("line");
			
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{						
				for(var i=0; i < oNewObj.length; i++)
				{			
					newValue = oNewObj[i].attributes["text4"].value;
					newText = oNewObj[i].attributes["value1"].value;	
					newX = oNewObj[i].attributes["text3"].value;	
					newY 	= oNewObj[i].attributes["text2"].value;	
					newID = oNewObj[i].attributes["text1"].value;
					remark = oNewObj[i].attributes["value1"].value;

					if(newID==""){ 
						if(oNewObj[i].attributes["value1"].value=="1")
							newID = "_";	     
						else
							newID = "-";					
					}
					if(i==0){
						newIcon = oNewObj[i].attributes["text5"].value;		
						newCo = oNewObj[i].attributes["text6"].value;	
						newIconClass = 	oNewObj[i].attributes["text7"].value;
						busNum = newID;
						busType= newY;
						$(".bline_info1").append("<p class=\"busno2\"><img src=\"../images/map/"+newIcon+"\" alt=\""+newX+"\" width=\"15\" height=\"15\" /><span class=\""+newIconClass+"\">"+newID+"</span></p><p class=\"btmore2\"><a href=\"javascript:co_lay('"+newCo+"', 3, '"+busType+"', '"+remark+"') \"><img src=\"../images/map/bt_buscpn.gif\" alt=\"운수사정보 버튼\" width=\"58\" height=\"18\" class=\"bt1\" /></a><a href=\"javascript:lyClose();\"><img src=\"../images/map/bt_close.gif\" width=\"18\" height=\"18\" /></a></p><p class=\"busstop2\">"+newX+"<img src=\"../images/map/ic_shuttle.gif\" alt=\"양방향 화살표\" width=\"17\" height=\"8\" />"+newValue+"</p>");							
					}else if(i==1){
						
						remark2 = oNewObj[i].attributes["text1"].value;
						busTime = busTime + " <div id=\"bustime\">";
            busTime = busTime + "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
            busTime = busTime + " <tr>";
            busTime = busTime + "  <th width=\"22%\" scope=\"col\">첫차</th>";
            busTime = busTime + "  <td colspan=\"2\" scope=\"col\"> "+remark+"</td>";
            busTime = busTime + "  <th width=\"22%\" scope=\"col\">막차</th>";
            busTime = busTime + "  <td width=\"31%\" colspan=\"2\" scope=\"col\" class=\"brno\">"+remark2+"</td>";
            busTime = busTime + " </tr>";
            busTime = busTime + " <tr>";
            busTime = busTime + "   <th colspan=\"6\" class=\"brno\">배차시간</th>";
            busTime = busTime + " </tr>";
            busTime = busTime + " <tr>";
            busTime = busTime + "   <th colspan=\"2\" class=\"thead2\">출.퇴근시</th>";
            busTime = busTime + "   <th colspan=\"2\" class=\"thead2\">평상시</th>";
            busTime = busTime + "   <th colspan=\"2\" class=\"thead2 brno\">공휴일</th>";
            busTime = busTime + "  </tr>";
            busTime = busTime + "  <tr>";
            busTime = busTime + "   <td colspan=\"2\">"+newY+"</td>";
            busTime = busTime + "  <td colspan=\"2\">"+newX+"</td>";
            busTime = busTime + "   <td colspan=\"2\" class=\"brno\">"+newValue+"</td>";
            busTime = busTime + " </tr>";
            busTime = busTime + "</table>";
            busTime = busTime + " <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
           	busTime = busTime + " <tr>";
            busTime = busTime + "  <th width=\"22%\">ARS</th>";
            busTime = busTime + "  <th width=\"78%\" class=\"brno\">정류소명</th></tr>";
           	busTime = busTime + " </table>";
          	busTime = busTime + " </div>";          									
						$(".bline_info_2").append(busTime);							
					}else{
						if (i==2){	
					
              busStop = busStop +  "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
							busStop = busStop +  " <tr>";
              busStop = busStop +  " <td width=\"19%\" class=\"al\">"+newValue+"</td>";
              busStop = busStop +  "  <td width=\"81%\" class=\"al\"><a href=\"javascript:stationARSInfo("+newX+","+newY+",'"+newID+"', '"+newValue+"', '"+newText+"')\"> "+newID+"</a><br/></td>";
              busStop = busStop +  "  </tr>";
						}				
						else if(i == oNewObj.length-1){

							busStop = busStop + " <tr>";
              busStop = busStop +  " <td width=\"19%\" class=\"al\">"+newValue+"</td>";
              busStop = busStop +  "  <td width=\"81%\" class=\"al\"><a href=\"javascript:stationARSInfo("+newX+","+newY+",'"+newID+"', '"+newValue+"', '"+newText+"')\"> "+newID+"</a><br/></td>";
              busStop = busStop +  "  </tr>";
              busStop = busStop +  " </table>";   
								
						}else{

							busStop = busStop + " <tr>";
              busStop = busStop +  " <td width=\"19%\" class=\"al\">"+newValue+"</td>";
              busStop = busStop +  "  <td width=\"81%\" class=\"al\"><a href=\"javascript:stationARSInfo("+newX+","+newY+",'"+newID+"', '"+newValue+"', '"+newText+"')\"> "+newID+"</a><br/></td>";
              busStop = busStop +  "  </tr>";
           										
						}		
					}
				}
				$(".bline_list").append(busStop);
				setLineColor(busType);
				fnXHRSchOption(busNum, 'coord2'); //라인그리기

			}			
		}
	}
}
//버스별 첫차,막차 정보
function getStartEndTime(){

	
	//응답완료
	if(xhrSchOption.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOption.status == 200)
		{
			//서버응답
			
			var oNewDoc = xhrSchOption.responseXML;		
			var oNewObj = xhrSchOption.responseXML.getElementsByTagName("bus");			
			var table="";
			var table2="";
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{				
				$("#start_end_table").children().remove();
			
				table = "<tr>";
       	table = table + "<th width=\"42\" scope=\"col\">번호</th>";
       	table = table + "<th width=\"152\" scope=\"col\">정류소명</th>";
       	table = table + " <th width=\"64\" scope=\"col\">첫차</th>";
       	table = table + "<th width=\"71\" scope=\"col\">막차</th>";
      	table = table + "</tr>";
				//$("#start_end_table").append(table);


				for(var k=0; k < oNewObj.length; k++)
				{		
					table2 = table2 + " <tr> ";
       					table2 = table2 + " <td>"+oNewObj[k].attributes["value1"].value+"</td>";
       					table2 = table2 + " <td class=\"al pdl10\">"+oNewObj[k].attributes["text1"].value+"</td>";
       					table2 = table2 + " <td>"+oNewObj[k].attributes["text2"].value+"</td>";
       					table2 = table2 + " <td>"+oNewObj[k].attributes["text3"].value+"</td>";
      					table2 = table2 + " </tr>";
										
				}
	
				$(".start_end_table").append(table+table2);				
			}			
		}
	}
}

//버스별 배차 시간표
function getBusTime(){
	
	//응답완료
	if(xhrSchOption.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOption.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOption.responseXML;		
			var oNewObj = xhrSchOption.responseXML.getElementsByTagName("bus");			
			var table="";
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{				
				$("#bustimetable").children().remove();						
				table = "<tr>";
       	table = table + "<th width=\"36\" rowspan=\"2\" scope=\"col\">운행";
       	table = table + "<br/>횟수</th>";
       	table = table + "<th colspan=\"2\" scope=\"col\" class=\"btl\">평일</th>";
       	table = table + "<th colspan=\"2\" scope=\"col\" class=\"btl\">휴일</th>";      
      	table = table + "</tr>";
				
				for(var i=0; i < oNewObj.length; i++)
				{		
					if(i==0){					
					 table = table +" <tr>";
			     table = table + " <th width=\"100\" scope=\"col\" class=\"ftgray\">"+oNewObj[i].attributes[1].value+"</th>";
			     table = table + " <th width=\"98\" scope=\"col\" class=\"ftgray\">"+oNewObj[i].attributes[2].value+"</th>";
			     table = table + " <th width=\"98\" scope=\"col\" class=\"ftgray\">"+oNewObj[i].attributes[3].value+"</th>";
			     table = table + "  <th width=\"97\" scope=\"col\" class=\"ftgray\">"+oNewObj[i].attributes[4].value+"</th>";
			     table = table + " </tr>";			     
					}			
					table = table + " <tr> ";
					table = table + " <td>"+(i+1)+"</td>";
       		table = table + " <td>"+oNewObj[i].attributes[5].value+"</td>";    
       		table = table + " <td>"+oNewObj[i].attributes[6].value+"</td>";      
       		table = table + " <td>"+oNewObj[i].attributes[7].value+"</td>";
       		table = table + " <td>"+oNewObj[i].attributes[8].value+"</td>";
      		table = table + " </tr>";								
				}
				$("#bustimetable").append(table);						
			}			
		}
	}
}
function replaceSpecialChar_map(expression)
{ 
	expression = expression.split("<").join("");
	expression = expression.split(">").join("");
	expression = expression.split("(").join("");
	expression = expression.split(")").join("");
	expression = expression.split("#").join("");
	expression = expression.split("&").join("");
	expression = expression.split("\'").join("");
	expression = expression.split("\"").join("");
	expression = expression.split("/").join("");
	expression = expression.split("\\").join("");
	expression = expression.split(":").join("");
	expression = expression.split("\n").join("");
	expression = expression.split("\r").join("");
	
	return expression;
   
}

function getBusTypeList(btype)
	{
		$("#ctlList").html("<option value=''>노선 선택</option>");
		var sURL = "../bus_map/BLineTypeList.asp?btype="+btype;
		
		

			
				
				if (window.XMLHttpRequest) //XHR 객체 얻기
				{
					xhrSchOption7 = new XMLHttpRequest();
				}
				else
				{
			 		xhrSchOption7 = new ActiveXObject('Microsoft.XMLHTTP'); 	   	  
				}		
				xhrSchOption7.onreadystatechange = cbXHRSchOption7;	//콜백함수지정(readyState값이 변할때마다 호출)
				xhrSchOption7.open("GET", sURL, true); //요청초기화
				xhrSchOption7.send(null); //서버에 요청
			

		
	}
	
	
	// 노선번호리스트
	function cbXHRSchOption7()
	{
		if(xhrSchOption7.readyState == 4)  //응답완료
		{		
			if(xhrSchOption7.status == 200) //상태:OK(200)			
			{
				var oNewDoc = xhrSchOption7.responseXML; //서버응답
				var busLineID = "";
				var busLineNO = "";
				var str="";
				
				var iev = get_version_of_IE();

				var oNewObj = xhrSchOption7.responseXML.getElementsByTagName("lineno");
				$("#routeList").children().remove();

				
				if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
				{					
					for(var i = 0; i < oNewObj.length ; i++)
					{
						busLineID = oNewObj[i].attributes[0].value;
						busLineNO = oNewObj[i].attributes[1].value;
						if(iev > 7.0){
							str = "<option value='"+busLineNO+"'>"+busLineID+"</option>";
						}else{
							str = "<option value='"+busLineID+"'>"+busLineNO+"</option>";
						}
						//DRAW LINK
						
						
		

						
						$("#ctlList").append(str);
					}
				}			
			}
		}
	}


	function get_version_of_IE(){
		var word;
				var version = "N/A";

		var agent = navigator.userAgent.toLowerCase();
		var name = navigator.appName;

		//IE old version(IE 10 or Lower)
		if(name == "Microsoft InternetExplorer") word = "msie";
		else{
		//IE 11
		if(agent.search("trident") > -1) word = "trident/.*rv:";

		//IE 12 (Microsoft Edge)
		else if (agent.search("edge/") > -1 ) word = "edge/";
		}

		var reg = new RegExp( word + "([0-9]{1,})(\\.{0,}[0-9]{0,1})");

		if(reg.exec(agent) != null ) version = RegExp.$1 + RegExp.$2;

		return version;
	}

	// 노선번호리스트
	function cbXHRSchOption8()
	{
		if(xhrSchOption8.readyState == 4)  //응답완료
		{		
			if(xhrSchOption8.status == 200) //상태:OK(200)			
			{
				var oNewDoc = xhrSchOption8.responseXML; //서버응답
				var busLineID = "";
				var busLineNO = "";
				var str="";
				var oNewObj = xhrSchOption8.responseXML.getElementsByTagName("lineno");
				$("#routeList").children().remove();
				if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
				{					
					for(var i = 0; i < oNewObj.length ; i++)
					{
						busLineID = oNewObj[i].attributes[0].value;
						busLineNO = oNewObj[i].attributes[1].value;
						str = "<option value='"+busLineID+"'>"+busLineNO+"</option>";
						//DRAW LINK
						
						$("#ctlList").append(str);
					}
				}			
			}
		}
	}
	
/*S:사용하지 않음 */
function fnBRTList(sX, sY, sARSNO, sName, stopID)
{

	aX = sX;
	aY = sY;
	aName =sName;
	aARSNO = sARSNO;

	var sURL = "../Ajax/BRT_Arrival.asp?optARSNO=" +stopID;
	
	//XHR 객체 얻기
	if (window.XMLHttpRequest) 
	{ 
		xhrSchOptionBRT = new XMLHttpRequest();
	} 	
	else
	{ 	
		 xhrSchOptionBRT = new ActiveXObject('Microsoft.XMLHTTP'); 	   	  
	} 	
	//콜백함수지정(readyState값이 변할때마다 호출)
	

	if(parent.sMapBubun=="naver"){
			xhrSchOptionBRT.onreadystatechange = cbXHRSchBRTNO_naver;

		
	}else{
			xhrSchOptionBRT.onreadystatechange = cbXHRSchBRTNO;
	}
	//요청초기화
	xhrSchOptionBRT.open("GET", sURL, true);

	//서버에 요청
	xhrSchOptionBRT.send(null);
}

function cbXHRSchBRTNO(){
	
	//응답완료
	if(xhrSchOptionBRT.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOptionBRT.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOptionBRT.responseXML;		
			var oNewObj = xhrSchOptionBRT.responseXML.getElementsByTagName("bus");	
		
			var busInfo="";
			var stopBigo="";
			var functionType="";
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{		
				busInfo = busInfo +"<div id=\"bus_arrive3_onMap\">";	
				busInfo = busInfo +"<p class=\"title1\">["+aARSNO+"]  "+aName+"</p>";	
				busInfo = busInfo +" <div id=\"av_table1\">"			
				busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"
				busInfo = busInfo +"  <tr>"
				busInfo = busInfo +"  <th width=\"100%\" scope=\"col\">통과노선</th> "
				busInfo = busInfo +"  </tr></table></div> "
				busInfo = busInfo +"<div class=\"bline_info4\">"
				busInfo = busInfo +" <div id=\"av_table1\">"		
				busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"							
				if(parent.sMunuNum == '1'){
					functionType = "_arri";
				}
		
				for(var i=0; i < oNewObj.length; i++)
				{	

					if(i==0){
							//stopBigo = oNewObj[i].attributes["value7"].value;
						}
						if(oNewObj[i].attributes["value0"].value==""){
							busInfo = busInfo +"<tr><td width=\"100%\"><span class=\"st\" style=\"cursor:hand\" onclick=\"lyOpen"+functionType+"('"+oNewObj[i].attributes["value6"].value+"', '"+oNewObj[i].attributes["value0"].value+"')\">"+oNewObj[i].attributes["value0"].value+"</span></td>";
						}else{		
							busInfo = busInfo +"<tr><td width=\"100%\"><span class=\"st\" style=\"cursor:hand\" onclick=\"lyOpen"+functionType+"('"+oNewObj[i].attributes["value6"].value+"', '"+oNewObj[i].attributes["value0"].value+"')\">"+oNewObj[i].attributes["value0"].value+"</span></td>";
						}
				}				
				if(oNewObj.length == 0){
					busInfo = busInfo + "<ul><li class=\"a\">운행노선이 없습니다.</li></ul>";
				}
				busInfo = busInfo +"</table> </div> </div></div>";
				parent.setMarker2(aX, aY, busInfo, aARSNO, stopBigo);
			}			
		}
	}  
}
/*E:사용하지 않음 */


function fnBRTList2(sX, sY, sARSNO, sName, stopID)
{

	aX = sX;
	aY = sY;
	aName =sName;
	aARSNO = sARSNO;

	var sURL = "../Ajax/BRTBusStopList.asp?optBusNum=" +stopID;
	
	//XHR 객체 얻기
	if (window.XMLHttpRequest) 
	{ 
		xhrSchOptionBRT2 = new XMLHttpRequest();
	} 	
	else
	{ 	
		 xhrSchOptionBRT2 = new ActiveXObject('Microsoft.XMLHTTP'); 	   	  
	} 	
	//콜백함수지정(readyState값이 변할때마다 호출)
	

	if(parent.sMapBubun=="naver"){
			xhrSchOptionBRT2.onreadystatechange = cbXHRSchBRTNO_naver;

		
	}else{
			xhrSchOptionBRT2.onreadystatechange = cbXHRSchBRTNO2;
	}
	//요청초기화
	xhrSchOptionBRT2.open("GET", sURL, true);

	//서버에 요청
	xhrSchOptionBRT2.send(null);
}

function cbXHRSchBRTNO2(){
	
	//응답완료
	if(xhrSchOptionBRT2.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOptionBRT2.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOptionBRT2.responseXML;		
			var oNewObj = xhrSchOptionBRT2.responseXML.getElementsByTagName("bus");	
			var busId = "";
			var busNum = "";
			var busType = "";			
			var busIc = "";
			var busInfo = "";
			var busInfo2 = "";
			
			var busInfo="";
			var stopBigo="";
			var functionType="";
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{		
				busInfo = busInfo +"<div id=\"bus_arrive3_onMap\">";	
				busInfo = busInfo +"<p class=\"title1\">["+aARSNO+"]  "+aName+"</p>";	
				busInfo = busInfo +" <div id=\"av_table1\">"			
				busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">"
				busInfo = busInfo +"  <tr>"
				busInfo = busInfo +"  <th width=\"100%\" scope=\"col\">통과노선</th> "
				busInfo = busInfo +"  </tr></table></div> "
				busInfo = busInfo +"<div class=\"bline_info4\">"
				busInfo = busInfo +" <div id=\"av_table1\">"		
				busInfo = busInfo +"<table width=\"222\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"text-align:left;\">"							
				if(parent.sMunuNum == '1'){
					functionType = "_arri";
				}
				
				busInfo = busInfo + "<tr>"
				
				for(var i=0; i < oNewObj.length; i++)
				{	
					busId = oNewObj[i].attributes["value1"].value;									
					busNum = oNewObj[i].attributes["text1"].value;	
					busType = oNewObj[i].attributes["text2"].value;	
					busIc = fnBusIcon(busType, busId);
					
					if (i % 3 == 0 && i > 0)
						busInfo = busInfo + "</tr><tr>"
					
					busInfo = busInfo + "<td style=\"text-align:left;\"><a href=\"javascript:parent.lyOpenBRT('"+busId+"', '"+busNum+"');\"><img src=\"../images/map/"+busIc+"\" alt=\""+busType+"\" width=\"15\" height=\"15\" />"+busNum+"</a></td>";	
				}	
				busInfo = busInfo + "</tr>"
				if(oNewObj.length == 0){
					busInfo = busInfo + "<ul><li class=\"a\">운행노선이 없습니다.</li></ul>";
				}
				busInfo = busInfo +"</table> </div> </div></div>";
				
				//alert(busInfo);
				parent.setMarker2(aX, aY, busInfo, aARSNO, stopBigo);
			}			
		}
	}  
}


function getlyLineInfoBRT() 
{
	//응답완료
	if(xhrSchOption.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOption.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOption.responseXML;
			
			var newText = "";
			var newID = "";
			var newValue = "";
			var newX ="";
			var newY ="";
			var newIcon="";
			var newIconClass ="";
			var newCo = "";
			var busTime = "";
			var busStop = "";		
			var busNum = "";		
			var busType = "";
			var remark2="";

			
			var oNewObj = xhrSchOption.responseXML.getElementsByTagName("line");
			
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{						
				$("#routeList").children().remove();
				
				for(var i=0; i < oNewObj.length; i++)
				{			
					newValue = oNewObj[i].attributes["text4"].value;
					newText = oNewObj[i].attributes["value1"].value;	
					newX = oNewObj[i].attributes["text3"].value;	
					newY 	= oNewObj[i].attributes["text2"].value;	
					newID = oNewObj[i].attributes["text1"].value;
					remark = oNewObj[i].attributes["value1"].value;

					if(newID==""){ 
						if(oNewObj[i].attributes["value1"].value=="1")
							newID = "_";	     
						else
							newID = "-";					
					}
					if(i==0){
						newIcon = oNewObj[i].attributes["text5"].value;		
						newCo = oNewObj[i].attributes["text6"].value;	
						newIconClass = 	oNewObj[i].attributes["text7"].value;
						busNum = newID;
						busType= newY;
						$(".bline_info1").append("<p class=\"busno2\"><img src=\"../images/map/"+newIcon+"\" alt=\""+newX+"\" width=\"15\" height=\"15\" /><span class=\""+newIconClass+"\">"+newID+"</span></p><p class=\"btmore2\"><a href=\"javascript:co_lay('"+newCo+"', 3, '"+busType+"', '"+remark+"') \"><img src=\"../images/map/bt_buscpn.gif\" alt=\"운수사정보 버튼\" width=\"58\" height=\"18\" class=\"bt1\" /></a><a href=\"javascript:lyClose();\"><img src=\"../images/map/bt_close.gif\" width=\"18\" height=\"18\" /></a></p><p class=\"busstop2\">"+newX+"<img src=\"../images/map/ic_shuttle.gif\" alt=\"양방향 화살표\" width=\"17\" height=\"8\" />"+newValue+"</p>");							
					}else if(i==1){
						
						remark2 = oNewObj[i].attributes["text1"].value;
						busTime = busTime + " <div id=\"bustime\">";
            busTime = busTime + "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
            busTime = busTime + " <tr>";
            busTime = busTime + "  <th width=\"22%\" scope=\"col\">첫차</th>";
            busTime = busTime + "  <td colspan=\"2\" scope=\"col\"> "+remark+"</td>";
            busTime = busTime + "  <th width=\"22%\" scope=\"col\">막차</th>";
            busTime = busTime + "  <td width=\"31%\" colspan=\"2\" scope=\"col\" class=\"brno\">"+remark2+"</td>";
            busTime = busTime + " </tr>";
            busTime = busTime + " <tr>";
            busTime = busTime + "   <th colspan=\"6\" class=\"brno\">배차시간</th>";
            busTime = busTime + " </tr>";
            busTime = busTime + " <tr>";
            busTime = busTime + "   <th colspan=\"2\" class=\"thead2\">출.퇴근시</th>";
            busTime = busTime + "   <th colspan=\"2\" class=\"thead2\">평상시</th>";
            busTime = busTime + "   <th colspan=\"2\" class=\"thead2 brno\">공휴일</th>";
            busTime = busTime + "  </tr>";
            busTime = busTime + "  <tr>";
            busTime = busTime + "   <td colspan=\"2\">"+newY+"</td>";
            busTime = busTime + "  <td colspan=\"2\">"+newX+"</td>";
            busTime = busTime + "   <td colspan=\"2\" class=\"brno\">"+newValue+"</td>";
            busTime = busTime + " </tr>";
            busTime = busTime + "</table>";
            busTime = busTime + " <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\">";
           	busTime = busTime + " <tr>";
            busTime = busTime + "  <th width=\"22%\">ARS</th>";
            busTime = busTime + "  <th width=\"78%\" class=\"brno\">정류소명</th></tr>";
           	busTime = busTime + " </table>";
          	busTime = busTime + " </div>";          									
						$(".bline_info_2").append(busTime);							
					}else{
						if (i==2){	
					
              busStop = busStop +  "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
							busStop = busStop +  " <tr>";
              busStop = busStop +  " <td width=\"19%\" class=\"al\">"+newValue+"</td>";
              busStop = busStop +  "  <td width=\"81%\" class=\"al\"><a href=\"javascript:stationARSInfo("+newX+","+newY+",'"+newID+"', '"+newValue+"', '"+newText+"')\"> "+newID+"</a><br/></td>";
              busStop = busStop +  "  </tr>";
						}				
						else if(i == oNewObj.length-1){

							busStop = busStop + " <tr>";
              busStop = busStop +  " <td width=\"19%\" class=\"al\">"+newValue+"</td>";
              busStop = busStop +  "  <td width=\"81%\" class=\"al\"><a href=\"javascript:stationARSInfo("+newX+","+newY+",'"+newID+"', '"+newValue+"', '"+newText+"')\"> "+newID+"</a><br/></td>";
              busStop = busStop +  "  </tr>";
              busStop = busStop +  " </table>";   
								
						}else{

							busStop = busStop + " <tr>";
              busStop = busStop +  " <td width=\"19%\" class=\"al\">"+newValue+"</td>";
              busStop = busStop +  "  <td width=\"81%\" class=\"al\"><a href=\"javascript:stationARSInfo("+newX+","+newY+",'"+newID+"', '"+newValue+"', '"+newText+"')\"> "+newID+"</a><br/></td>";
              busStop = busStop +  "  </tr>";
           										
						}		
					}
				}
				$(".bline_list").append(busStop);
				setLineColor(busType);
				fnXHRSchOption(busNum, 'coord2'); //라인그리기

			}			
		}
	}
}


/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
function fnGetTimeTable(lineID, stationID, busNum, stationName)
{
	var sURL = "../Ajax/get_timetable.asp?lineID=" +lineID+"&stationID="+stationID+"&busNum="+busNum+"&stationName="+stationName; 
	
	//var sURL = "../Ajax/get_timetable.asp?lineID=5200184000&stationID=174680301&busNum="+busNum+"&stationName="+stationName; 


	//XHR 객체 얻기
	if (window.XMLHttpRequest) 
	{ 
		xhrSchOption2 = new XMLHttpRequest();
	} 	
	else
	{ 	
		 xhrSchOption2 = new ActiveXObject('Microsoft.XMLHTTP'); 	   	  
	} 	
	//콜백함수지정(readyState값이 변할때마다 호출)

	xhrSchOption2.onreadystatechange = cbXHRSchTimeTable;
	
	//요청초기화
	xhrSchOption2.open("GET", sURL, true);

	//서버에 요청
	xhrSchOption2.send(null);
}
// 정류서 검색시 지도 위 도착예정 올라가는 폼(리스트 뿌릴때)
function cbXHRSchTimeTable(){
	
	//응답완료
	if(xhrSchOption2.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOption2.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOption2.responseXML;		
			var oNewObj = xhrSchOption2.responseXML.getElementsByTagName("timetable");	
		
			var timeInfo="";
			var hhtime="";
			var mmtime="";
			var rtype="0";
			var stdtime="";
			var stdtype="";
			var typecnt = 0;
			
			var busNum="";
			var stationName="";
			
			
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{	
				$("#timetable3").children().remove();
				
				//alert (oNewObj.length);
			
				for(var i=0; i < oNewObj.length; i++)
				{	
					if (i==0)
					{
						busNum = oNewObj[i].attributes["hhtime"].value;
						stationName = oNewObj[i].attributes["mmtime"].value;
						
						timeInfo = timeInfo +"<div class='tmtitle1'>";
						timeInfo = timeInfo +"<p class='busno2' id='timetableNum2'>"+busNum+"번 "+stationName+"정류소 운행시간표</p>";
						timeInfo = timeInfo +"<p class='btmore2'>";
						timeInfo = timeInfo +"<p class='btmore2'><a href='javascript:'>";
						timeInfo = timeInfo +"<img src='../images/map/bt_close.gif' width='18' height='18' alt='close' onclick='TimeLyClose(\"timeTable3\")'/></a></p>";
						timeInfo = timeInfo +"</p>";
						timeInfo = timeInfo +"</div>";
						timeInfo = timeInfo +"<div class='tmtitle1_1' style='float:left;'>";
					}
					else
					{
					
						rtype = oNewObj[i].attributes["rtype"].value;
						hhtime = oNewObj[i].attributes["hhtime"].value;
						mmtime = oNewObj[i].attributes["mmtime"].value;
						

						if (rtype == "1")
						{
							if (stdtype != rtype)
							{
								timeInfo = timeInfo +"<div id='' class='week_table'>";
								timeInfo = timeInfo +"<h4 style='background:#ececec;'>평일</h4>";
								timeInfo = timeInfo +"<table border='0' cellspacing='0' cellpadding='0' id=''>";
								timeInfo = timeInfo +"<tr>";
								stdtype = rtype;
							}
							if (stdtime != hhtime)
							{
								if (typecnt != 0)
								{
									timeInfo = timeInfo +"</td><tr>";
								}
								timeInfo = timeInfo +"<th>"+hhtime+"</th><td>";		
								stdtime = hhtime;
								typecnt = typecnt +1;
							}
							
							
								timeInfo = timeInfo +"<span>"+mmtime+"</span>";
							
						}
						
						if (rtype == "2")
						{
							if (stdtype != rtype)
							{
								timeInfo = timeInfo +"</tr>";
								timeInfo = timeInfo +"</table>";
								timeInfo = timeInfo +"</div>";
				
								typecnt = 0;
								timeInfo = timeInfo +"<div id='' class='week_table'>";
								timeInfo = timeInfo +"<h4 style='background:#a2cee8;'>토요일</h4>";
								timeInfo = timeInfo +"<table border='0' cellspacing='0' cellpadding='0' id=''>";
								timeInfo = timeInfo +"<tr>";
								stdtype = rtype;
							}
							if (stdtime != hhtime)
							{
								if (typecnt != 0)
								{
									timeInfo = timeInfo +"</td><tr>";
								}
								timeInfo = timeInfo +"<th>"+hhtime+"</th><td>";		
								stdtime = hhtime;
								typecnt = typecnt +1;
							}
							//else
							//{
								timeInfo = timeInfo +"<span>"+mmtime+"</span>";
							//}
						}
						
						
						if (rtype == "3")
						{
							if (stdtype != rtype)
							{
								timeInfo = timeInfo +"</tr>";
								timeInfo = timeInfo +"</table>";
								timeInfo = timeInfo +"</div>";
				
								typecnt = 0;
								timeInfo = timeInfo +"<div id='' class='week_table'>";
								timeInfo = timeInfo +"<h4 style='background:#dca9af;'>일/공휴일</h4>";
								timeInfo = timeInfo +"<table border='0' cellspacing='0' cellpadding='0' id=''>";
								timeInfo = timeInfo +"<tr>";
								stdtype = rtype;
							}
							if (stdtime != hhtime)
							{
								if (typecnt != 0)
								{
									timeInfo = timeInfo +"</td><tr>";
								}
								timeInfo = timeInfo +"<th>"+hhtime+"</th><td>";		
								stdtime = hhtime;
								typecnt = typecnt +1;
							}
							//else
							//{
								timeInfo = timeInfo +"<span>"+mmtime+"</span>";
							//}
						}
					}
				}				
				if(oNewObj.length == 0){
					timeInfo = timeInfo + "<ul><li class=\"a\">시간표가 없습니다.</li></ul>";
				}
				else
				{
					timeInfo = timeInfo +"</td></tr></table> </div></div></div>";
				}

				$("#timetable3").append(timeInfo);

			}			
		}
	}  
}
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/