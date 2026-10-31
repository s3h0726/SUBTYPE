function init_daum(){
	
	if(sMunuNum != '1')
	{
		daum.maps.disableBusSymbol();
	}

	
	map = new daum.maps.Map(document.getElementById('lyMap'), {
			center: new daum.maps.LatLng(35.18006310699948, 129.0745959544688),
			level: 8
		});	
		var zoomControl = new daum.maps.ZoomControl();
		map.addControl(zoomControl, daum.maps.ControlPosition.RIGHT);
		var mapTypeControl = new daum.maps.MapTypeControl();
		map.addControl(mapTypeControl, daum.maps.ControlPosition.TOPRIGHT);
		if(sMunuNum != '1'){
			daum.maps.disableBusSymbol();		
		}
		setIconImg_DM();
		daum.maps.event.addListener(map, "idle",  function() { 
	   var center = map.getCenter();
	   getAddress(center.getLat(), center.getLng(), "enterAddress");
		
	 	 if(sMunuNum != '1'){
	  	if(map.getLevel() <= "3"){
	  		
			  var coords = map.getBounds();				
				xy = coords.getSouthWest();
				xy1 = coords.getNorthEast();
				fnGetBusStop(coords.getSouthWest().getLat()+","+coords.getSouthWest().getLng(), coords.getNorthEast().getLat()+","+coords.getNorthEast().getLng(), busStopNum);
			}
			if(map.getLevel() > "3"){				
				if(busStopMarker.length!=0){			
					for(var i=0; i<busStopMarker.length; i++){				
						busStopMarker[i].setMap(null);	
					}
				}				
			}
		}
		});
		
		if(sMunuNum=="1"){ // 출발도착 검색에서만 오른쪽 왼쪽 마우스 이벤트 활성화
			daum.maps.event.addListener(map, "rightclick",  function(event) { 			
		  	fnActionLy(event.point.x, event.point.y, event.latLng);
			});
			daum.maps.event.addListener(map, "click",  function(event) { 			
		  	$("#dvPositionLy").attr("style", "display:none");
			});
		}
		init_daum2();
}
// 지도에 기본으로 정류장 뿌리기
function busStopImgDraw_DM(){
	
	//응답완료
	if(xhrSchOption.readyState == 4) 
	{		
		//상태:OK(200)
		
		if(xhrSchOption.status == 200)
		{
			//서버응답
			var oNewDoc = xhrSchOption.responseXML;		
			var oNewObj = xhrSchOption.responseXML.getElementsByTagName("busstop");		
			
			if(busStopMarker.length!=0){
			
				for(var i=0; i<busStopMarker.length; i++){				
					busStopMarker[i].setMap(null);	
				}
			}	
			
			if(typeof(oNewObj)=="object" || typeof(oNewObj)=="function")
			{																		
				for(var i=0; i < oNewObj.length; i++)
				{		
					
					//setBusStopMarker(oNewObj[i].attributes["value5"].value, oNewObj[i].attributes["value4"].value);					
					var point = new daum.maps.LatLng(oNewObj[i].attributes["value5"].value, oNewObj[i].attributes["value4"].value);	
					var bigo = oNewObj[i].attributes["value6"].value;
					
					var stopARSNO="";
					if(bigo=="1" && oNewObj[i].attributes["value1"].value==""){
						stopARSNO = "_";
					}else if(bigo=="0" && oNewObj[i].attributes["value1"].value==""){
						stopARSNO = "-";
					}else{
						stopARSNO = oNewObj[i].attributes["value1"].value;
					}
					if(oNewObj[i].attributes["value7"].value!=""){
						 bigo = Number(bigo) + 3;							  
					}				
					busStopMarker[i] = new daum.maps.Marker({position: point,	image: busIcon[bigo]});					
					busStopMarker[i].setTitle("["+stopARSNO+"] "+oNewObj[i].attributes["value3"].value+"{"+oNewObj[i].attributes["value2"].value+"}");
					busStopMarker[i].setMap(map);				
					daum.maps.event.addListener(busStopMarker[i], "click", function() {						
						var sTitle = this.getTitle();
						var sTitle2 = sTitle.split("]");
						var sArsNo = sTitle2[0].replace("[", "");
						var sTitle3 =  sTitle2[1].split("{");
						var sName =  sTitle3[0];
						var stopID = sTitle3[1].replace("}", "");
						busStopClickChk = false;
						stationARSInfo(this.getPosition().getLat(), this.getPosition().getLng(), sName, sArsNo, stopID);						
						//alert(this.getTitle());
						
					});
				}						
			}			
		}
	}  
}
//도착예정정보 폼 뿌려주는 함수
function setMarker_DM(sX, sY, joinNM){
	removeDrawLine();
	var point = new daum.maps.LatLng(sX, sY);	
	
	if (marker != null){
	  marker.setMap(null);
	  infowindow.close();
	}
		
	if(busStopClickChk){
		map.setLevel(4);
		map.setCenter(point);
	}	
		
		marker = new daum.maps.Marker({
		position: point,
		image: busIcon[3]
		});
		
		marker.setMap(map);	
		marker.setTitle(joinNM);		
	
		var contests = "<p style=\"margin:7px 22px 7px 12px;font:12px/1.5 sans-serif\"><strong>"+joinNM+"</strong></p>";
	
		infowindow = new daum.maps.InfoWindow({
			content: contests,
			removable : true
		});
		infowindow.open(map, marker);
		daum.maps.event.addListener(marker, "click", function() {
			infowindow.open(map, marker);
		});		
}	

//도착예정정보 뿌려주는 함수
function setMarker_DM2(sX, sY, joinNM, arsNo, gubun){
	removeDrawLine();
	var point = new daum.maps.LatLng(sX, sY);			
	
	if (marker != null){
	  marker.setMap(null);
	  infowindow.close();
	}
	
	if(busStopClickChk){
		map.setLevel(4);
		map.setCenter(point);
	}	
	if(arsNo =="_"){	
		marker = new daum.maps.Marker({position: point,	image: busIcon[4]});	
	}else{
		marker = new daum.maps.Marker({position: point,	image: busIcon[3]});
	}
	if(gubun !=""){
		if(gubun =="1"){	
			marker = new daum.maps.Marker({position: point,	image: busIcon[4]});	
		}else{
			marker = new daum.maps.Marker({position: point,	image: busIcon[3]});
		}	
	}
		marker.setMap(map);				
	
	  var contests = joinNM;		
	
		infowindow = new daum.maps.InfoWindow({
			content: contests,
			removable : true
		});
		infowindow.open(map, marker);
		daum.maps.event.addListener(marker, "click", function() {
			infowindow.open(map, marker);
		});			
}	
// 라인 그리기
function setLine_DM(arr, idx){
	
	removeDrawLine();
	if(line !=null){		
		line.setMap(null);
	}
	if (infowindow != null){	  
	  infowindow.close();
	}
	
	if(lineColor=="") lineColor = "#0035F3";
	//alert(lineColor);
	line = new daum.maps.Polyline({ strokeWeight:idx, strokeColor:lineColor, fillColor: lineColor, strokeOpacity : 1});
	line.setPath(arr);
	line.setMap(map);
	if(sMunuNum!="3"){
		map.setLevel(7);
		map.setCenter(centerPoint);  
	}else{
		map.setCenter(map.getCenter());  
	}
	
	lineLength = line.getLength();
}
//start, end 이미지 
function setImage_DM(sX, sY, sType, sGubun){
	removeDrawLine();
	if(sType=="start"){
		if(markerStart!=null){
			markerStart.setMap(null);
		}		
	}else if(sType=="end"){
		if(markerEnd!=null){		
			markerEnd.setMap(null);
		}
	}
	
	var point = new daum.maps.LatLng(sX, sY);		
		
	var imgPath = "../images/map/ic_map_start.png";
	if(sGubun =="busLine"){
		imgPath = "../images/map/ic_map_start1.png";
	}
	if(sType=="end"){		
		if(sGubun =="busLine"){
			imgPath = "../images/map/ic_map_last.png";
		}else{	
			imgPath = "../images/map/ic_map_arrival.png";
		}
	}
	
	var icon = new daum.maps.MarkerImage(
		imgPath,
		new daum.maps.Size(26, 29),
		"",
		"poly",
		"1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
		);
		
		if(sType=="end"){
			
			markerEnd = new daum.maps.Marker({
			position: point,
			image: icon
			});	
			markerEnd.setMap(map);
		
		}else if(sType=="start"){
			markerStart = new daum.maps.Marker({
			position: point,
			image: icon
			});	
			markerStart.setMap(map);	
			
		}

}
// 기본으로 깔리는 정류장 아이콘
function setIconImg_DM(){
	
	 busIcon[0] = new daum.maps.MarkerImage(
		"../images/map/ic_busstop_off.png",
		new daum.maps.Size(16, 16),
		"",
		"poly",
		"1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
		);	
		busIcon[1] = new daum.maps.MarkerImage(
		"../images/map/ic_busstop01_off.png",
		new daum.maps.Size(16, 16),
		"",
		"poly",
		"1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
		);
		 busIcon[3] = new daum.maps.MarkerImage(
		"../images/map/ic_busstop.png",
		new daum.maps.Size(16, 16),
		"",
		"poly",
		"1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
		);	
		busIcon[4] = new daum.maps.MarkerImage(
		"../images/map/ic_busstop01.png",
		new daum.maps.Size(16, 16),
		"",
		"poly",
		"1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
		);
		busIcon[5] = new daum.maps.MarkerImage(
		"../images/map/bt_choice.gif",
		new daum.maps.Size(16, 16),
		"",
		"poly",
		"1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
		);
		busIcon[6] = new daum.maps.MarkerImage(
		"../images/map/btn_close.gif",
		new daum.maps.Size(10, 10),
		"",
		"poly",
		"1,20,1,9,5,2,10,0,21,0,27,3,30,9,30,20,17,33,14,33"
		);
}
function setCenter_arrival(coordx, coordY){
	
		var point = new daum.maps.LatLng(coordY, coordx);		
		map.setLevel(2);
		map.setCenter(point);  

}
var arrival_line=[];
//출도착 라인그리기
function getCoord_line(coordList){		
	removeDrawLine();
	if (marker != null){
	  marker.setMap(null);
	  infowindow.close();
	}
	if(line !=null){		
		line.setMap(null);
	}
	var coords = coordList.split("^");
	var busTypes="";
	var subTypes="";
	var coordInfo="";
	var arrival_lineColor = "";
	if(arrival_line.length!=0){
		for(var k=1; k<arrival_line.length; k++){
			arrival_line[k].setMap(null);	
		}
	}
	
	for(var i=1; i<coords.length; i++){
		busTypes = coords[i].split("_");
		coordInfo = busTypes[2].split("|");
		arrival_lineColor = getArrival_lineColor(busTypes[1]);
		var arr = [];
		for(var j=0; j<coordInfo.length; j++){
			arr.push(new daum.maps.LatLng(coordInfo[j+1], coordInfo[j]));
			if(i==1){			
				map.setLevel(7);
				var point = new daum.maps.LatLng(coordInfo[j+1], coordInfo[j]);		
				map.setCenter(point);
				setImage(coordInfo[j+1], coordInfo[j], "start", "busArrival");
			}else if(i==coords.length-2){
				setImage(coordInfo[j+1], coordInfo[j], "end", "busArrival");
			}
			j++;
		}
		arrival_line[i] =  new daum.maps.Polyline({ strokeWeight:5, strokeColor:arrival_lineColor, fillColor: arrival_lineColor, strokeOpacity : 1});
		arrival_line[i].setPath(arr);
		arrival_line[i].setMap(map);
	}
}

function getArrival_lineColor(bustype){
	
	if(bustype == "0106"){		//일반
		lineColor = "#009ce2";
	}else if(bustype == "0107"){		//좌석
		lineColor = "#ff4500,";		
	}else if(bustype == "0108"){		//급행
		lineColor = "#ff4500,";
	}else if(bustype == "0110"){		//직행
		lineColor = "#ff4500,";
	}else if(bustype == "062101"){	//1호선
		lineColor = "#ff5f00";
	}else if(bustype == "062102"){	//2호선
		lineColor = "#4cbc01";
	}else if(bustype == "062103"){	//3호선
		lineColor = "#cf9701";
	}else if(bustype == "062104"){	//4호선
		lineColor = "#1583ce";
	}else if(bustype == "062110"){	//부산김해경전철
		lineColor = "#a570d8";
	}else{
		lineColor = "#939393";
	}	
	return lineColor;
}
var iDootCnt=0;
var fLineLngChk = false;
var infowindow_line;
var lineLng_marker;
var marker_close;
function fnDraw_DM(){
	var prePoint;
	
	if(iDootCnt>0){
		daum.maps.event.removeListener(map, "click",  addDrawLine);
	}
	iDootCnt=0;	
	removeDrawLine();
	daum.maps.event.addListener(map, "click",  addDrawLine);
	
}
function addDrawLine(event){
	if(iDootCnt==0) removeDrawLine();
		iDootCnt++;
		var point = new daum.maps.LatLng(event.latLng.getLat(), event.latLng.getLng());			
		//var point2 = new daum.maps.LatLng(event.latLng.getLat(), event.latLng.getLng()-0.002);			
		//alert(event.latLng.getLat());
		//alert(event.latLng.getLat()-0.0000002);
		marker_line[iDootCnt] = new daum.maps.Marker({
		position: point,
		image: busIcon[5]
		});	
		marker_line[iDootCnt].setMap(map);	
		
		if(iDootCnt==2){
			prePoint = marker_line[iDootCnt-1].getPosition();
			poly_line[iDootCnt] =  new daum.maps.Polyline({ strokeWeight:5, strokeColor:"#ff4500", fillColor: "#ff4500", strokeOpacity : 1});
			poly_line[iDootCnt].setPath([prePoint, point]);
			poly_line[iDootCnt].setMap(map);			
			lineLng_marker = new SimpleTextMarker(point, Math.round(poly_line[iDootCnt].getLength())+"m");
			lineLng_marker.setMap(map);	
			marker_close = new daum.maps.Marker({
			position: point,
			image: busIcon[6]
			});	
			marker_close.setMap(map);	
			daum.maps.event.addListener(marker_close, "click",  removeDrawLine);	
			iDootCnt=0;
			daum.maps.event.removeListener(map, "click",  addDrawLine);	
							
		}	
	
}
function removeDrawLine(){
	
	for(var k=1; k<marker_line.length; k++){
			marker_line[k].setMap(null);	
			if(k>=2){ 
				poly_line[k].setMap(null);
				lineLng_marker.setMap(null);
				daum.maps.event.removeListener(marker_close, "click",  removeDrawLine);
				marker_close.setMap(null);				
				//infowindow_line.setMap(null);	
			}

	}
	
}
function SimpleTextMarker(position, text) {
    this.position_ = position;
    this.node_ = document.createElement('div');
    this.node_.appendChild(document.createTextNode(text));
	}
function init_daum2(){

	SimpleTextMarker.prototype = new daum.maps.AbstractOverlay;
	
	SimpleTextMarker.prototype.onAdd = function() {
	    var panel = this.getPanels().overlayLayer;
	    panel.appendChild(this.node_);
	};
	
	SimpleTextMarker.prototype.onRemove = function() {
	    this.node_.parentNode.removeChild(this.node_);
	};
	
	SimpleTextMarker.prototype.draw = function() {
	    var projection = this.getProjection();
	    var point = projection.pointFromCoords(this.position_);
	    var width = this.node_.offsetWidth;
	    var height = this.node_.offsetHeight;
	    this.node_.style.cssText = 'position: absolute; padding:5px 2px;background-color:#ffffff;border-left:1px solid #e52200; border-right:1px solid #e52200; border-top:1px solid #e52200;border-bottom:1px solid #e52200; white-space: nowrap; left: ' +
	            ((point.x - width / 2)+5) + 'px; top: ' +
	            (point.y - height / 2) + 'px';
	};
}