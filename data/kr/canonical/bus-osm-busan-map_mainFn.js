var map;	
var marker;
var infowindow;
var sMunuNum;
var busStopClickChk = true;
var xy, xy1;
var busStopNum="";
var busStopMarker = [];
var busIcon=[];
var sMapBubun = "";
var marker_line=[];
var poly_line=[];

//지도 생성
function init(menuNum, mapBubun) {
	sMunuNum = menuNum;
	sMapBubun = mapBubun;
	if(menuNum == '1') sMapBubun ="daum";
	if(menuNum != '4'){		
		
		if(sMapBubun=="daum"){
			init_daum();		
		}else{
			init_naver();
		}
	}		
}	
//기본적으로 그려지는 정류장 아이콘 정보 가져오는 함수
function fnGetBusStop(coord1, coord2, busNum)
{	
	var sURL = "../Ajax/map_stop_coord.asp?coord1=" +coord1+"&coord2="+coord2+"&busNum="+busNum;
	
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
	if(sMapBubun=="naver"){
		xhrSchOption.onreadystatechange = busStopImgDraw_NV;	
	}else{
		xhrSchOption.onreadystatechange = busStopImgDraw_DM;	
	}
	//요청초기화
	xhrSchOption.open("GET", sURL, true);

	//서버에 요청
	xhrSchOption.send(null);
}

// 좌표 이용해서 주소 가져오는 함수
function getAddress(lat, lng, callBackfn){	
	
	searchAddrFromCoords(map.getCenter(), displayCenterInfo);
	/*
	if (lat && lng)
  {
    var s = document.createElement('script');
    s.type ='text/javascript';
    s.charset ='utf-8';
    //s.src = 'http://apis.daum.net/maps/coord2addr?apikey=2236f340093839afb8ebd034d35f1d33270128b6&output=json&format=simple&callback='+callBackfn+'&inputCoordSystem=WGS84&latitude=' + lat + '&longitude=' + lng;
    s.src = 'https://apis.daum.net/local/geo/coord2addr?apikey=2dd09e3a56f578c472ce5185f0bbfbe471f6a7bd&output=json&format=simple&callback='+callBackfn+'&inputCoordSystem=WGS84&latitude=' + lat + '&longitude=' + lng;	
    document.getElementsByTagName('head')[0].appendChild(s);
  }
  */
}
// 좌표 이용해서 주소 가져오는 콜백 함수
function enterAddress(z){
	$("#am_topm2_2").html(z.name1+" > "+z.name2+" > "+z.name3);	
}

// 좌표로 행정동 주소 정보를 요청
function searchAddrFromCoords(coords, callback) {
	var geocoder = new daum.maps.services.Geocoder();   // 20181106
        geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);         
}

function displayCenterInfo(result, status) {
    if (status === daum.maps.services.Status.OK) {
        for(var i = 0; i < result.length; i++) {
            if (result[i].region_type == 'H') {
                //document.getElementsByTagName('head')[0].appendChild = result[i].address_name;
                $("#am_topm2_2").html( result[i].address_name );
                break;
            }
        }
    }    
}



function setMarker(sX, sY, joinNM){
	alert("1");
	if(sMapBubun=="daum"){
		setMarker_DM(sX, sY, joinNM);
	}else{
		setMarker_NV(sX, sY, joinNM);
	}
	
}
function removeMark(){
	if(sMapBubun=="daum"){
		if (marker != null){
	  		marker.setMap(null);
	  		infowindow.close();
		}
	}else{
		if (marker != null){
			map.removeOverlay(marker); 		
	  
		}
	
		if(infowindow!=null){						
		 	map.removeOverlay(infowindow);	 
		}
	}
}
function setMarker2(sX, sY, joinNM, arsNo, gubun){
	
	if(sMapBubun=="daum"){
		setMarker_DM2(sX, sY, joinNM, arsNo, gubun);	
	}else{
		setMarker_NV2(sX, sY, joinNM, arsNo, gubun);
	}
}	
//출도착 라인그리기
function getCoord(coordList){	
	
	var arr = [];
	var coordInfo = coordList.split("|");
	for(var i=1; i<coordInfo.length; i++){
		arr.push(new daum.maps.LatLng(coordInfo[i+1], coordInfo[i]));
		if(i==1){			
			setCenter(coordInfo[i+1], coordInfo[i]);
			setImage(coordInfo[i+1], coordInfo[i], "start", "busArrival");
		}else if(i==coordInfo.length-2){
			setImage(coordInfo[i+1], coordInfo[i], "end", "busArrival");
		}
		i++;
	}
	setLine(arr, 5);
}
//버스 노선 그리기
function getCoord2(){
	
	//응답완료
	if(xhrSchOption.readyState == 4) 
	{		
		//상태:OK(200)			
		if(xhrSchOption.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOption.responseXML;
			
			var newPath = "";
			var newAddr = "";
			var newEmail = "";				
							
			var oNewObj = xhrSchOption.responseXML.getElementsByTagName("coord");
			var arr = [];
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{
				for(var i=0; i < oNewObj.length; i++)
				{						
					if(i==0){
						//setCenter(oNewObj[i].attributes[2].value, oNewObj[i].attributes[1].value);
						setCenter(oNewObj[i].getAttribute("value3"), oNewObj[i].getAttribute("value2"));
					}else{
						if(i==1) setImage(oNewObj[i].getAttribute("value3"), oNewObj[i].getAttribute("value2"), "start", "busLine");
						//if(i==1) setImage(oNewObj[i].attributes[2].value, oNewObj[i].attributes[1].value, "start", "busLine");
						//if(i==oNewObj.length-1) setImage(oNewObj[i].attributes[2].value, oNewObj[i].attributes[1].value, "end", "busLine");
						if(sMapBubun=="daum"){
							arr.push(new daum.maps.LatLng(oNewObj[i].getAttribute("value3"), oNewObj[i].getAttribute("value2")));
							//arr.push(new daum.maps.LatLng(oNewObj[i].attributes[2].value, oNewObj[i].attributes[1].value));
						}else{
							arr.push(new nhn.api.map.LatLng(oNewObj[i].getAttribute("value3"), oNewObj[i].getAttribute("value2")));
							//arr.push(new nhn.api.map.LatLng(oNewObj[i].attributes[2].value, oNewObj[i].attributes[1].value));
						}
					}
				}					
			}
			setLine(arr, 3);
		}
	}
}

var line;
var centerPoint;
var lineColor;
function setLine(arr, idx){
	
	if(sMapBubun=="daum"){
		lineLength = setLine_DM(arr, idx);
	}else{
		setLine_NV(arr, idx);
	}
}	

function setCenter(sX, sY){	
	
	if(sMapBubun=="daum"){
		centerPoint = new daum.maps.LatLng(sX, sY);	
	}else{
		centerPoint = new nhn.api.map.LatLng(sX, sY);		
	}		
}

function setLineColor(bustype){
	//alert(busType);
	if(bustype == "일반버스"){
		lineColor = "#0035F3";
	}else if(bustype == "심야버스"){		
		lineColor = "#F10000";		
	}else if(bustype == "심야버스(급행)"){		
		lineColor = "#F10000";
	}else if(bustype == "심야버스(일반)"){		
		lineColor = "#0035F3";
	}else if(bustype == "급행버스"){		
		lineColor = "#F10000";
	}else if(bustype == "좌석버스(장유)"){		
		lineColor = "#F10000";
	}else if(bustype == "좌석버스(산성)"){
		lineColor = "#F10000";
	}else if(bustype == "좌석버스(공항)"){
		lineColor = "#F10000";
	}else if(bustype == "좌석버스(용원)"){
		lineColor = "#F10000";
	}else if(bustype == "마을버스"){
		lineColor = "#01DF01";
	}else{
		lineColor = "#0035F3";
	}	
}

var markerStart;
var markerEnd;
function setImage(sX, sY, sType, sGubun){
	if(sMapBubun=="daum"){
		setImage_DM(sX, sY, sType, sGubun);
	}else{
		setImage_NV(sX, sY, sType, sGubun);
	}
	
}
/*
function setLine2(sX, sY){		
	if(preX !=""){
		var line = new daum.maps.Polyline();
		line.setPath([new daum.maps.LatLng(preX2, preY2), new daum.maps.LatLng(sX, sY)]);
		line.setMap(map);
	}
	preX2 = sX;
	preY2 = sY;	
}	*/

function fnChk(thisNode, msg){
	
	var val = $('#key').val();	
	val = replaceSpecialChar_map(val);		
	$('#key').val(val);

	if(val == ""){
		alert(msg+"를 입력해주세요");
		$('#key').focus();
		return false;
	}else{
		return true;
	} 
}
function fnChLine(){
	var lineNum = $("#ctlList").attr("value");
	
	$("#txtLineNum").attr("value", lineNum);
	fnLine();
}

function fnLine(){
 var lineNum = $("#txtLineNum").attr("value");
	lineNum = replaceSpecialChar_map(lineNum);	
	$("#txtLineNum").attr("value", lineNum);

	if(lineNum==""){
		alert("노선을 입력해주세요");
		$("#txtLineNum").focus();
		return false;
	}else{	
		//$('#ifrmBus').attr("src", "http://121.174.75.12/bims/Menu03/code04_02.aspx?bno="+lineNum);
		$('#ifrmBus').attr("src", "http://121.174.75.24/bims_web/popup2/RealTimeBus.aspx?BNUM="+lineNum);	
		getTimeStamp();
	}
	lineNum = lineNum.replace("1008-F", "1008(오전)"); 
	//lineNum = lineNum.replace("-F", "(심야)"); 
	lineNum = lineNum.replace("1411-A", "강서11(마을)"); 
	lineNum = lineNum.replace("1413-A", "강서13(마을)"); 
	$("#txtLineNum").attr("value", lineNum);
}
function openInfo(){
	$("#bus_arrive2_onMap").attr("style", "display:black;");	
}
function closeInfo(){
	$("#bus_arrive2_onMap").attr("style", "display:none;");	
}
/*

//[1] Ajax를 사용하기 위한 기본 설정값
$.ajaxSetup({
    type: 'post',
    dataType: 'json',
    contentType: "application/json; charset=utf-8"
});
//[2] 페이지 로드시 데이터 출력 또는 이벤트 처리기 등록
$(document).ready(function () {
    DisplayData(); // 데이터 출력함수 호출
});
//[3] 데이터로드
function DisplayData() {
    $.ajax({
    url: "https://bus.busan.go.kr/busanBIMS/BIMS_WEBSITE/menu03/linenolist.asmx/Get_BusnoList",
        cache: false,
        data: "{}", // "{page:0}"
        success: handleHtml,
        error: ajaxFailed
    });
}
//[3-1] 웹 서비스로부터 데이터가 정상적으로 로드시 테이블 만들어서 레이어에 출력
function handleHtml(data, status) {
    $('#ctlList').empty();
    var table = "<option>직접입력</option>";
    // Microsoft Ajax에서는 보안목적으로 data.d로 실제 데이터를 감싸놓음.
    $.each(data.d, function (index, entry) {
        table += '<option value=\"' + entry["busno"] +'\">' + entry["busno"] + '</option>';
       
    });
    $('#ctlList').append(table);              
}
//[3-2] Ajax 로드 실패시 에러 메시지 출력
function ajaxFailed(xmlRequest) {
    alert(
        xmlRequest.status + '\r\n' + xmlRequest.statusText + '\r\n' + xmlRequest.responseText);
}
    */
function getTimeStamp() {
  var d = new Date();

  var s =
    leadingZeros(d.getHours(), 2) + ':' +
    leadingZeros(d.getMinutes(), 2) + ':' +
    leadingZeros(d.getSeconds(), 2);

 		$(".time1").html("최종검색시간 : " + s);
}

function leadingZeros(n, digits) {
  var zero = '';
  n = n.toString();

  if (n.length < digits) {
    for (i = 0; i < digits - n.length; i++)
      zero += '0';
  }
  return zero + n;
}
var positionX, positionY, positionGubun
function fnActionLy(aLeft,aTop, coord){
	//alert(aTop+","+aLeft);
	$("#dvPositionLy").attr("style", "position:absolute; top:"+(aTop+95)+"px; left:"+(aLeft+298)+"px; width:120px;border-top:1px solid #b1c8e0; border-left:1px solid #b1c8e0;border-right:2px solid #7e9bb1;border-bottom:2px solid #7e9bb1;_width:250px; background:#fff;z-index:31; display:black");
	positionX = coord.getLat();
	positionY = coord.getLng();
}

function fnSetMapPosition(gubun){
	positionGubun = gubun;
	setImage(positionX, positionY, gubun, "busArrival");
	$("#dvPositionLy").attr("style", "display:none");
	getAddress(positionX, positionY, "arrivalPosition");	
	
}
function arrivalPosition(z){	
	
	if(positionGubun=="start"){ 			
		selectS(z.name2+" "+z.name3); 		
		$('#start_x').attr("value", positionY);
		$('#start_y').attr("value", positionX);
	}else if(positionGubun=="end"){
		selectE(z.name2+" "+z.name3); 
		$('#arrival_x').attr("value", positionY);
		$('#arrival_y').attr("value", positionX);		
	}	
	if($('#start_x').attr("value")!="" && $('#arrival_x').attr("value")!=""){
		pathSearch();
	}
}
function fnDraw(){
	
	if(sMapBubun=="daum"){
		fnDraw_DM();		
	}else{
		fnDraw_NV();
	}
}
	