// DaumMap API 요청 : api키를 받아야함.
//document.write("<script type='text/javascript' src='//dapi.kakao.com/v2/maps/sdk.js?appkey=9a39cdbbfb03044f78fee1d1f687b0cb' charset='utf-8'></script>");

//배포시 사용키
document.write("<script type='text/javascript' src='//dapi.kakao.com/v2/maps/sdk.js?appkey=78e4393942afa8395efcdd1c46560697' charset='utf-8'></script>");
//document.write("<script type='text/javascript' src='//dapi.kakao.com/v2/maps/sdk.js?appkey=cb238726020acf2a6a54d83f8c8ab728' charset='utf-8'></script>");
//고세환 전용
//document.write("<script type='text/javascript' src='//dapi.kakao.com/v2/maps/sdk.js?appkey=9fe938ee539f6fde84372857dfbce417' charset='utf-8'></script>");

//=========================================
// 초기 생성
//=========================================
function daumMapControl(){
	this.map = null;
	this.infowindowList = new ArrayList();
	this.markerList = new ArrayList();
	
	// 경로선 색 설정 - 외각선(black)
	this.line_black = new daum.maps.Polyline({
		strokeWeight : 6, 
		strokeColor : "#000000", 
		strokeOpacity : 1
	});
	
	// 경로선 색 설정 - 가운데선(blue)
	this.line_blue = new daum.maps.Polyline({
		strokeWeight : 5, 
		strokeColor : "#3388FF", 
		strokeOpacity : 1
	});
	
	
	// 경로선 색 설정 - 중심선(white, longdash) 
	this.line_white = new daum.maps.Polyline({
		strokeWeight : 1, 
		strokeColor : "#FFFFFF", 
		strokeOpacity : 1,
		strokeStyle : "longdash"
	});
	
	
}

//=========================================
// 다음 Map 생성 및 화면출력 
//=========================================
daumMapControl.prototype.createMap = function(mapId){
	
	// 버스정류장 심볼 삭제  
	daum.maps.disableBusSymbol();
	
	// 맵생성  
	var mapOptions = { 
			center: new daum.maps.LatLng(33.49947, 126.53120), 
		    level: 3 
	};
	
	// 화면에 띄우기 
	this.map = new daum.maps.Map(document.getElementById(mapId), mapOptions);
	
	// 줌컨트롤 생성 
	var zoomControl = new daum.maps.ZoomControl();
	this.map.addControl(zoomControl, daum.maps.ControlPosition.RIGHT);
		
	// 맵타입 컨트롤 생성 
	var mapTypeControl = new daum.maps.MapTypeControl();
	this.map.addControl(mapTypeControl, daum.maps.ControlPosition.TOPRIGHT);
	   
}

//=========================================
// 다음 Map 이벤트 등록 
//=========================================
daumMapControl.prototype.regMapEvent = function(tar,type,handler){
	daum.maps.event.addListener(tar,type,handler);
}

//=========================================
//다음 Map 마커이미지 생성 
//=========================================
daumMapControl.prototype.createMarkerImage = function(parameter,width, height){
	
	var icon = new daum.maps.MarkerImage(
			
			//아이콘 경로
			parameter.src,
			
			//아이콘 사이즈 
			new daum.maps.Size(width, height),
			
			//아이콘 옵션 
			{
				// 마커의 좌표에 일치시킬 이미지 안의 좌표
				offset: parameter.offset ? parameter.offset : "",
				// 마커의 클릭 또는 마우스오버 가능한 영역의 모양 
				shape: parameter.shape ? parameter.shape : "",
				// 마커의 클릭 또는 마우스오버 가능한 영역을 표현하는 좌표값
				coords: parameter.coords ? parameter.coords : ""
			}
	);
			
	return icon;
	
}

//=========================================
//다음 Map 마커이미지 생성 
//=========================================
daumMapControl.prototype.showMarker = function(title, position, iconImg){
	
	//console.log("show marker!!");
	
	var titleArry = title.split(",");
	var zIndex = 1;
	
	if(titleArry[0] != "start" && titleArry[0] != "end"){
		
		for (var i = 0; i < this.markerList.size(); ++i) {
			
			var markerTitle = (this.markerList.get(i).getTitle()).split(",");
			
			if(markerTitle[0] == titleArry[0]){
				
				this.markerList.get(i).setImage(iconImg);
				this.markerList.get(i).setMap(this.map);
				
				return this.markerList.get(i);
			}
		}
		
	}else{
		zIndex = 8;
	}
	
	
	var marker = new daum.maps.Marker({
		title: title,
		position: position,
		zIndex:zIndex,
		image: iconImg
	});
	
	//console.log("showMarker title : " + title + " position : " + position  + " zIndex : " + zIndex + " image : " + iconImg);
	
	this.markerList.add(marker);
	marker.setMap(this.map);
	
	return marker;
}

//=========================================
//다음 Map 마커이미지 삭제  
//=========================================
daumMapControl.prototype.hiddenMarker = function(type){
	
	
	
	for (var i = 0; i < this.markerList.size(); ++i) {
		
		
		if(type == "station"){
			
			var markerTitle = (this.markerList.get(i).getTitle()).split(",");
			
			
			if(markerTitle[0].indexOf("제주") == -1 ){
				
				if(markerTitle[0] != "start" && markerTitle[0] != "end"){
					var marker = this.markerList.get(i);
					
					this.markerList.get(i).setMap(null);
				}
				
				
			}
			
		}
		else if(type == "bus"){
//			if(this.markerList.get(i).getTitle().indexOf("제주") > -1){
			//타이틀이 제주로 시작하는 마커가 버스이므로 아래로 변경
			if(this.markerList.get(i).getTitle().indexOf("제주") == 0){
				this.markerList.get(i).setMap(null);
			}
		}
		else if(type == "start"){
			
			
			if(this.markerList.get(i).getTitle().indexOf("start") > -1){
				this.markerList.get(i).setMap(null);
			}
			
		}else if(type == "end"){
			
			
			if(this.markerList.get(i).getTitle().indexOf("end") > -1){
				this.markerList.get(i).setMap(null);
			}
			
		}
		
	}
	
}

//=========================================
//다음 Map 버스 마커 삭제  
//=========================================
daumMapControl.prototype.removeBusMarker = function(){
	//삭제할 아이템들
	var removeItems = [];
	for (var i = 0; i < this.markerList.size(); ++i) {
		//버스 마커만 
		if(this.markerList.get(i).getTitle().trim().indexOf("제주") == 0){
			var m = this.markerList.get(i);
			//console.log("remove marker : " + m.getTitle());
			removeItems.push(m);
		}
	}
	for(var i = 0; i < removeItems.length; i ++) {
		var item = removeItems[i];
		//실제 지도에서도 제거
		item.setMap(null);
		//해당 리스트에서도 제거
		this.markerList.removeTemp(item);
	}
	/*for (var i = 0; i < this.markerList.size(); ++i) {
		if(this.markerList.get(i).getTitle().trim().indexOf("제주") > -1){
			var m = this.markerList.get(i);
			console.log("retain marker : " + m.getTitle());
		}
	}*/
}

//=========================================
//다음 Map InfoWindow 생성 
//=========================================
daumMapControl.prototype.createInfoWindow = function(content,marker){
	
	var infowindow = new daum.maps.InfoWindow({
		content: content,
		map: this.map,
		position: marker.getPosition(),
		zIndex: 8
		//removable: true
	});
	
	this.map.panTo(marker.getPosition());
	
	infowindow.open(this.map,marker);
	
	this.infowindowList.add(infowindow);
}

//=========================================
//다음 Map InfoWindow 생성 
//=========================================
daumMapControl.prototype.createStationInfoWindow = function(content,marker){
	
	var infowindow = new daum.maps.InfoWindow({
		content: content,
		map: this.map,
		position: marker.getPosition(),
		zIndex: 8
		//removable: true
	});
	
	//전체 크기의 절반 만큼만 이동
	var infowindw_height = 400 / 2;  
    //변환 객체 구함
	var mapProjection = this.map.getProjection();
	//실제 마커의 좌표
    var latlng = marker.getPosition();
    //좌표 -> 포인트 변환
    var point = mapProjection.pointFromCoords(latlng);
    //포인트 -> 계산된 포인트 변경 
    var adjust_point = new daum.maps.Point(point.x, (point.y-infowindw_height));
    
    //실제 포인트 -> 좌표 변환
    var calc_latlng = mapProjection.coordsFromPoint(adjust_point); ;
	
    this.map.panTo(calc_latlng);
    
	infowindow.open(this.map,marker);
	this.infowindowList.add(infowindow);
}

//=========================================
//다음 Map InfoWindow 삭제 
//=========================================
daumMapControl.prototype.deleteInfoWindow = function(){
	
	for (var i = 0; i < this.infowindowList.size(); ++i) {
		this.infowindowList.get(i).close();
	}
	
}

//=========================================
//다음 Map 경로 그리기 
//=========================================
daumMapControl.prototype.drawLine = function(latLngArr){
	
	this.line_black.setPath(latLngArr);
	this.line_black.setMap(this.map);
	
	this.line_blue.setPath(latLngArr);
	this.line_blue.setMap(this.map);	
	
	this.line_white.setPath(latLngArr);
	this.line_white.setMap(this.map);
	
	
}

//=========================================
//다음 Map 경로 지우기 
//=========================================
daumMapControl.prototype.dropLine = function(){
	
	if(this.line_black.getMap()) {
		this.line_black.setMap(null);
	}
	if(this.line_blue.getMap()) {
		this.line_blue.setMap(null);
	}
	if(this.line_white.getMap()) {
		this.line_white.setMap(null);
	}
}