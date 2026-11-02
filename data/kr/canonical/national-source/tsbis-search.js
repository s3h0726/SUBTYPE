"use strict";

/**
 * 1. 메인화면에서 검색어 입력 후 통합화면 진입
 * 		- fnIntegratedSearch() 노선, 정류소 목록 각각 조회 후 검색결과 있는 탭 활성화
 * 
 * 2. 노선 현황 (1)노선 검색 fnRouteSearch()
 * 		(2)노선 목록 - 노선 선택 fnRouteLine()
 * 		(3)노선별 정류소 목록 - 정류소 선택 fnSelectedStation() -> 버스도착예정정보 모달창 오픈 fnBusArrive()
 *  
 * 3. 정류소 현황 (1)정류소 검색 fnStationSearch()
 * 		(2)정류소 목록 - 정류소 선택 fnPassRouteStation()
 * 		(3)정류소별 노선 목록 - 노선 선택 fnSelectedStBySt() -> fnRouteLine() 이후 노선현황 로직과 동일하게 진행
 */

let mainSearchKeyword = "";

var isRouteSection = true;
var isArrvModal = false;

var isSubSection = false;	// 정류소현황 서브화면 여부
var isSubRefresh = false;	// 정류소현황 서브화면에서 실시간 버스위치 새로고침 여부

$(function() {
	/**
	 * 메인화면에서 - 노선검색, 정류소검색 선택시 해당 TAB으로 이동
	 * 지자체 헤더에서 - 노선현황, 정류소현황, 이용안내 선택시 해당 TAB으로 이동
	 */
	var runScriptValue = localStorage.getItem('runScript');
	
	if (runScriptValue) {
        setTimeout(() => {	// 브라우저 호환 문제로 딜레이 추가
            if (runScriptValue === 'route') {
                togglePage('route');
                fnClickBtnRoute();
            } else if (runScriptValue === 'station') {
                togglePage('station');
                fnClickBtnStation();
            } else if (runScriptValue === 'info') {
                toggleTab($('#btnInfo'));
                togglePage('info');
            }
            localStorage.removeItem('runScript'); // 실행 후 삭제
        }, 100); 
    }

	// 메인화면에서 검색어 입력 후 통합검색 실행
	const urlParams = new URLSearchParams(window.location.search);
    mainSearchKeyword = urlParams.get('main_searchKeyword');	// 검색어

	if(mainSearchKeyword) {
		$("#route_searchKeyword").val(mainSearchKeyword);
		$("#station_searchKeyword").val(mainSearchKeyword);
		
		// 노선, 정류소 목록 각각 조회 후 검색결과 있는 탭 활성화
		fnIntegratedSearch();
	}
	
	// 노선 현황 TAB 선택
	$('#btnRoute').on('click', function () {
		togglePage('route');
		fnClickBtnRoute();
		if($("#route_searchKeyword").val() != "") {
			fnRouteSearch(1, "");
		}
		isRouteSection = true;
	});
	
	// 정류소 현황 TAB 선택
	$('#btnStation').on('click', function () {
		togglePage('station');
		fnClickBtnStation();
		if($("#station_searchKeyword").val() != "") {
			fnStationSearch(1, "");
		}
		isRouteSection = false;
	});
	
	// 이용 안내 TAB 선택
	$('#btnInfo').on('click', function () {
		fnClickBtnRoute();	// 좌측메뉴 비우기 용도
		toggleTab($('#btnInfo'));
		togglePage('info');	
	});
	
	// 지역별 지도 셋팅
	if($("#adminId").val() != "") {
		rxMap.route.set_region_extent($("#adminId").val());
		
		/**
		 * 2025-09-24 지자체별 접근시 전제 정류소 표출기능 추가
		 */
		fnAllStation($("#adminId").val());
	}
	
	// 노선별 정류장 목록 모달창 닫기 버튼 선택
	$('#btnCloseRouteModal').on('click', function () {
		fnCloseRouteModal();
	});
	
	// 노선별 정류장 목록 모달창 이전 버튼 선택
	$('#btnPrevRouteModal').on('click', function () {
		fnCloseRouteModal();
	});
	
	// 정류장별 노선 목록 모달창 닫기 버튼 선택
	$('#btnCloseStationModal').on('click', function () {
		fnCloseStationModal();
	});
	
	// 정류장별 노선 목록 모달창 이전 버튼 선택
	$('#btnPrevStationModal').on('click', function () {
		fnCloseStationModal();
	});
	
	// 버스도착예정정보 모달창 닫기 버튼 선택
	$('#btnCloseArriveModal').on('click', function () {
		$('#mdBusArrive').hide();
	});
	
	// 노선별 정류장 목록 실시간 버스 새로고침
	$('#refreshVehIcon').on('click', function (event) {
		event.preventDefault(); // 기본 동작 방지
		fnRefreshVehIcon();
	});
	
	// 도착예정정보 모달창 새로고침
	$('#refreshArrvIcon').on('click', function (event) {
		event.preventDefault(); // 기본 동작 방지
		updateRefreshTime('refreshArrvTime');
		
		// 버스 도착 예정 정보
		var arrvStationId = $('#stationId').val();
		fnBusArrive(arrvStationId);
	});
	
	// 노선 현황 > 버스유형 선택박스 선택
	$('#selectBusType').change(function(event){
		event.preventDefault(); // 기본 동작 방지
		fnRouteSearch(1, 'subSearch');
	});
	
	// 노선 현황 > 전체지역 선택박스 선택
	$('#selectRegion').change(function(event){
		event.preventDefault(); // 기본 동작 방지
		fnRouteSearch(1, 'subSearch');
	});
	
	// 정류소 현황 > 전체지역 선택박스 선택
	$('#stationRegion').change(function(event){
		event.preventDefault(); // 기본 동작 방지
		fnStationSearch(1, 'subSearch');
	});
});

// 노선별 정류장 목록 실시간 버스 새로고침
function fnRefreshVehIcon() {
	if(isSubSection) {
		$("#routeListByStationSec").show();
		isSubSection = false;
		isSubRefresh = true;
	}
	fnStListByRoute();
}

// 노선별 정류소 목록 새로고침
function fnRefreshTableVeh() {
	// 새로고침
	const route = JSON.parse(sessionStorage.getItem("selectedRouteInfo"));
	fnRefreshRouteLine(route.route_id);
}

// 노선 현황 탭 활성화 function
function fnClickBtnRoute() {
	toggleTab($('#btnRoute'));
	toggleSection("infoUse");
	
	$("#routeSearchSec").show();
	$("#stationSearchSec").hide();
	
	fnLayerClear();
}

// 정류소 현황 탭 활성화 function
function fnClickBtnStation() {
	toggleTab($('#btnStation'));
	toggleSection("infoUse");
	
	$("#routeSearchSec").hide();
	$("#stationSearchSec").show();
	
	fnLayerClear();
}

// 노선별 정류소 목록
/** 1. 노선별 정류소 목록 실시간 버스위치 새로고침 버튼 선택
 *  2. 버스도착예정정보 노선번호 선택 */
function fnStListByRoute() {

	updateRefreshTime('refreshVehTime');
		
	// 버스 도착 예정 정보 모달창 닫기
	$("#mdBusArrive").hide();
	
	const route = JSON.parse(sessionStorage.getItem("selectedRouteInfo"));
	fnRouteLine(route.route_id);
	
	// 실시간 버스 위치 조회
	rxMap.route.search_route_line(route.route_id);
}

// 노선 검색
function fnRouteSearch(pageNo, type) {
	
	if(fnRouteVaildateInput()) {
		fnLayerClear();
		
		toggleSection("routeSec");
		
		var select_type = $("#selectBusType").val();
		var select_region = $("#selectRegion").val();
		
		if(type != "subSearch" && type != "page") {
			select_type = "";
			select_region = "";
		}
		
		var adminId = "";
		if(select_region != "") {
			adminId = select_region;
		}else {
			adminId = $("#adminId").val();
		}
		var data = { 
			pageIndex : pageNo,
			main_searchKeyword : $("#route_searchKeyword").val(),
			sub_searchKeyword : select_type,
			admin_id : adminId 
		};
		
		AjaxJson(contextPath + "/route/getRouteList.do", data, function(response) {
			const routeList = response.list;
    		const paginationInfo = response.paginationInfo;
			
		    updateRouteTable(routeList);	// 노선목록 업데이트
		    updatePagination(paginationInfo, "#divPaginationRoute", "fn_route_select_linkPage");	// 페이징 업데이트	
			
			const routeTYList = response.routeTYList;
			const routeAdminCodeList = response.routeAdminCodeList;
			
			if(type != "subSearch" && type != "page") {
				updateSelectRouteTy(routeTYList);			// 버스유형 선택박스 업데이트
				updateSelectAdminCd(routeAdminCodeList, "selectRegion");	// 전체지역 선택박스 업데이트
			}
			
		}, function() {
		    console.log("getRouteList 호출 실패!");
		});
	}
}

// 노선 검색 > 버스유형 선택박스 업데이트
function updateSelectRouteTy(routeTYList) {
	const busTypeSelect = document.querySelector("#selectBusType");
	
	busTypeSelect.innerHTML = '<option value="">버스유형</option>';
	routeTYList.forEach(routeType => {
        const option = document.createElement("option");
        option.value = routeType.route_ty;
		option.textContent = routeType.route_ty_nm; 
        busTypeSelect.appendChild(option);
	});
}

// 노선 검색, 정류소 검색 > 전체지역 선택박스 업데이트
function updateSelectAdminCd(routeAdminCodeList, type) {
	const regionSelect = document.querySelector(`#${type}`);
	
	regionSelect.innerHTML = '<option value="">전체지역</option>';
    routeAdminCodeList.forEach(region => {
        const option = document.createElement("option");
        option.value = region.admin_id; 
        option.textContent = region.admin_nm2; 
        regionSelect.appendChild(option);
    });
}

// 노선 검색 > 노선목록 업데이트
function updateRouteTable(routeList) {
    const busList = document.querySelector("#ulRouteList"); 
    
	busList.innerHTML = "";
	
    const busItem = document.createElement("li");
    busItem.classList.add("bus-item");
    
	if(routeList.length > 0) {
		routeList.forEach(route => {
	        const busLink = document.createElement("a");
	        busLink.href = `javascript:fnRouteLine('${route.route_id}');`;
	        busLink.classList.add("link-bus");
	        
	        busLink.addEventListener("click", function () {
				// 선택한 노선정보 저장
				sessionStorage.setItem("selectedRouteInfo", JSON.stringify(route));
			});
			
	        const numberArea = document.createElement("div");
	        numberArea.classList.add("number-area");
	
	        const busType = document.createElement("i");
	        setBusType(route.route_ty, busType);
	        
	        const busNumber = document.createElement("span");
	        busNumber.classList.add("number");
	        busNumber.textContent = route.route_nm;
	
	        const busLocation = document.createElement("span");
	        busLocation.classList.add("location");
	        busLocation.textContent = route.admin_nm2;
	
	        numberArea.appendChild(busType);
	        numberArea.appendChild(busNumber);
	        numberArea.appendChild(busLocation);
	
	        const destinationArea = document.createElement("div");
	        destinationArea.classList.add("destination-area");
			
			const route_ex = document.createElement("span");
			route_ex.classList.add("destination");
			route_ex.textContent = route.route_ex;
			destinationArea.appendChild(route_ex);
			
			/*
	        const origin = document.createElement("span");
	        origin.classList.add("destination");
	        origin.textContent = route.st_sta_knm;
	
	        const arrowIcon = document.createElement("i");
	        arrowIcon.classList.add("ic-arrow_double");
	
	        const destination = document.createElement("span");
	        destination.classList.add("destination");
	        destination.textContent = route.ed_sta_knm;
	
	        destinationArea.appendChild(origin);
	        destinationArea.appendChild(arrowIcon);
	        destinationArea.appendChild(destination);
			*/
			
	        busLink.appendChild(numberArea);
	        busLink.appendChild(destinationArea);
	        
	        busItem.appendChild(busLink);
	        
	        busList.appendChild(busItem);
	        
	        //busList.scrollTop = 0;	// 스크롤바 초기화
		});
		
	}else {
		const noDataArea = document.createElement("div");
	    noDataArea.classList.add("group-none");
		
		const noData = document.createElement("p");
	    noData.classList.add("desc");
	    noData.style.cssText = "margin-top:20px;";
		noData.textContent = "검색 결과가 없습니다.";
		
		const nonIcon = document.createElement("i");
	    nonIcon.classList.add("ic-none");
		
		noDataArea.appendChild(noData);
		noDataArea.appendChild(nonIcon);
		busList.appendChild(noDataArea);
	}
}

// 노선별 정류소 목록만 업데이트
function fnRefreshRouteLine(routeId) {
	var data = { route_id : routeId };
	AjaxJson(contextPath + "/station/getRouteStation.do", data, function(response) {
	
		const stopList = document.querySelector("#mdStopList");
        stopList.innerHTML = ''; 
        
		if(response.length > 0) {
			response.forEach((station) => {
				const li = document.createElement("li");
            	li.classList.add("stop-item");
            	
            	const arrowBoxDiv = document.createElement("div");
	            arrowBoxDiv.classList.add("arrow-box");
	            arrowBoxDiv.id = `arrowBox-${station.station_id}`;
	            
	            const arrowIcon = document.createElement("i");
	            arrowIcon.classList.add("ic-arrow_open_down");
	            arrowBoxDiv.appendChild(arrowIcon);
            	
            	const busLink = document.createElement("a");
		        busLink.href = `javascript:fnSelectedStation('${station.station_id}');`;
		        busLink.classList.add("link-bus");
		        
		        busLink.addEventListener("click", function () {
					// 선택한 정류소정보 저장
					sessionStorage.setItem("selectedStataionInfo", JSON.stringify(station));
					$("#stationId").val(station.station_id);
				});
		        
            	const stopBoxDiv = document.createElement("div");
	            stopBoxDiv.classList.add("stop-box");
	
	            const titleSpan = document.createElement("span");
	            titleSpan.classList.add("title");
	
	            const stopNameSpan = document.createElement("span");
	            stopNameSpan.textContent = station.station_knm;
	            titleSpan.appendChild(stopNameSpan);

	            const numberSpan = document.createElement("span");
	            numberSpan.classList.add("number");
	            numberSpan.textContent = station.mobile_no;
	
	            stopBoxDiv.appendChild(titleSpan);
	            stopBoxDiv.appendChild(numberSpan);
	
				busLink.appendChild(stopBoxDiv);
	
	            li.appendChild(arrowBoxDiv);
	            li.appendChild(busLink);
	
	            stopList.appendChild(li);
	            
	            updateRefreshTime('refreshVehTime');
			});
		} else {
			const li = document.createElement("li");
            li.classList.add("stop-item");
			
			const noDataArea = document.createElement("div");
		    noDataArea.classList.add("group-none");
			
			const noData = document.createElement("p");
		    noData.classList.add("desc");
		    noData.style.cssText = "margin-top:20px;";
			noData.textContent = "검색 결과가 없습니다.";
			
			const nonIcon = document.createElement("i");
		    nonIcon.classList.add("ic-none");
			
			noDataArea.appendChild(noData);
			noDataArea.appendChild(nonIcon);
			li.appendChild(noDataArea);
			stopList.appendChild(li);
		}
		getRouteVehList(routeId, response);
		
	}, function() {
	    console.log("getRouteStation 호출 실패!");
	});
}

// 노선 선택
function fnRouteLine(routeId) {
	
	// 노선별 정류장 목록
	toggleSection("stationListByRouteSec");
	
	var data = { route_id : routeId };
	AjaxJson(contextPath + "/station/getRouteStation.do", data, function(response) {
	
		// 선택한 노선 정보
		const route = JSON.parse(sessionStorage.getItem("selectedRouteInfo"));
		$("#mdRouteNm").html(route.route_nm);
		
		const mdBusTp = document.getElementById("mdBusTp");
		setBusType(route.route_ty, mdBusTp)
		
		$("#mdStStaKnm").html(route.st_sta_knm);
		$("#mdEdStaKnm").html(route.ed_sta_knm);
		$("#mdTotalCnt").html("총 " + response.length + "개 정류소");
		
		// 노선 운행 시간표
		AjaxJson(contextPath + "/route/getRouteTimetable.do", data, function(response) {
			$("#divRouteTimetable").hide();
			fnSetTimetable(response);
		}, function() {
		    console.log("getRouteTimetable 호출 실패!");
		});
		
		const stopList = document.querySelector("#mdStopList");
        stopList.innerHTML = ''; 
        
		if(response.length > 0) {
			response.forEach((station) => {
				const li = document.createElement("li");
            	li.classList.add("stop-item");
            	
            	const arrowBoxDiv = document.createElement("div");
	            arrowBoxDiv.classList.add("arrow-box");
	            arrowBoxDiv.id = `arrowBox-${station.station_id}`;
	            
	            const arrowIcon = document.createElement("i");
	            arrowIcon.classList.add("ic-arrow_open_down");
	            arrowBoxDiv.appendChild(arrowIcon);
            	
            	const busLink = document.createElement("a");
		        busLink.href = `javascript:fnSelectedStation('${station.station_id}');`;
		        busLink.classList.add("link-bus");
		        
		        busLink.addEventListener("click", function () {
					// 선택한 정류소정보 저장
					sessionStorage.setItem("selectedStataionInfo", JSON.stringify(station));
					$("#stationId").val(station.station_id);
				});
		        
            	const stopBoxDiv = document.createElement("div");
	            stopBoxDiv.classList.add("stop-box");
	
	            const titleSpan = document.createElement("span");
	            titleSpan.classList.add("title");
	
	            const stopNameSpan = document.createElement("span");
	            stopNameSpan.textContent = station.station_knm;
	            titleSpan.appendChild(stopNameSpan);

	            const numberSpan = document.createElement("span");
	            numberSpan.classList.add("number");
	            numberSpan.textContent = station.mobile_no;
	
	            stopBoxDiv.appendChild(titleSpan);
	            stopBoxDiv.appendChild(numberSpan);
	
				busLink.appendChild(stopBoxDiv);
	
	            li.appendChild(arrowBoxDiv);
	            li.appendChild(busLink);
	
	            stopList.appendChild(li);
	            
	            updateRefreshTime('refreshVehTime');
	       	 	stopList.scrollTop = 0;	// 스크롤바 초기화
			});
		} else {
			const li = document.createElement("li");
            li.classList.add("stop-item");
			
			const noDataArea = document.createElement("div");
		    noDataArea.classList.add("group-none");
			
			const noData = document.createElement("p");
		    noData.classList.add("desc");
		    noData.style.cssText = "margin-top:20px;";
			noData.textContent = "검색 결과가 없습니다.";
			
			const nonIcon = document.createElement("i");
		    nonIcon.classList.add("ic-none");
			
			noDataArea.appendChild(noData);
			noDataArea.appendChild(nonIcon);
			li.appendChild(noDataArea);
			stopList.appendChild(li);
		}
		getRouteVehList(routeId, response);
		
	}, function() {
	    console.log("getRouteStation 호출 실패!");
	});
	
	// 노선 지도 표출
	rxMap.route.search_route_line(routeId);
	
	// 실시간 버스 위치 표출
	rxMap.veh.search_route_veh(routeId);
	//rxMap.veh.fnSetIntervalSelectRouteVeh(routeId);	// 노선별 차량 실시간 위치
}

// 노선 운행 시간표 설정
function fnSetTimetable(response) {
	
	if(response != null && response != "") {
		if(response.length > 1) {
			$("#liRouteTime").hide();
			$("#divRouteTimetable").show();
			
			const timetableInfo = document.querySelector("#divRouteTimetable");
	        timetableInfo.innerHTML = ''; 
	        
	        const table = document.createElement("table"); 
	        
	        const headerRow = document.createElement("tr");
			const headerWeek = document.createElement("th");
			headerWeek.textContent = "운행 요일";
			const headerTime = document.createElement("th");
			headerTime.textContent = "운행 시간";
			headerRow.appendChild(headerWeek);
			headerRow.appendChild(headerTime);
			table.appendChild(headerRow);
			
			for (const item of response) {
				const row = document.createElement("tr");
			
			  	const cellWeek = document.createElement("td");
			  	cellWeek.textContent = item.oper_week;
			
			  	const cellTime = document.createElement("td");
			  	cellTime.textContent = item.st_tm;
			
			  	row.appendChild(cellWeek);
			  	row.appendChild(cellTime);
			  	table.appendChild(row);
			}
			timetableInfo.appendChild(table);
			
		}else {
			$("#liRouteTime").show();
			$("#divRouteTimetable").hide();
			
			const routeTimeInfo = document.querySelector("#liRouteTime");
	        routeTimeInfo.innerHTML = ''; 
	
			const firstSpan = document.createElement("span");
		    firstSpan.classList.add("first");
			
			const stTime = response[0].st_tm.split('~'); 
			        
			const stSpan = document.createElement("span");
		    stSpan.textContent = "첫 차 " + stTime[0];
		    firstSpan.appendChild(stSpan);
		    
		    const arrowIcon = document.createElement("i");
	        arrowIcon.classList.add("ic-arrow_both");
		    
			const lastSpan = document.createElement("span");
		    lastSpan.classList.add("last");
		    
		    const edSpan = document.createElement("span");
		    edSpan.textContent = "막 차 " + stTime[1];
		    lastSpan.appendChild(edSpan);
		    
		    routeTimeInfo.appendChild(firstSpan);
		    routeTimeInfo.appendChild(arrowIcon);
		    routeTimeInfo.appendChild(lastSpan);
		}
		$("#spRouteTime").html(response[0].st_tm);
	} else {
		console.log("운행 시간표가 없습니다.");
	}
}

/**
 * 좌측 노선별 정류소 목록에 버스 실시간 위치 표출
 * - 차량의 위치를 두 정류장 사이에 배치
 * - 차량과 정류장 사이의 거리의 비율을 계산하여 margin-top 픽셀값 입력
 */
function getRouteVehList(routeId, stationInfo) {
	
	// 정류소 정보
	var data = { route_id : routeId };
	AjaxJson(contextPath + "/veh/getRouteVehList.do", data, function(response) {
		// 현재 운행 중인 버스 대수 추가하기
		var vehCntSpan  = "현재 " + response.length + "대 운행중";
		$("#spVehCnt").html(vehCntSpan);
	
		// 운행중인 버스가 위치한 현재 정류소 아이디(CUR_STATION_ID)와 다음 정류소 아이디(NEXT_STATION_ID)를 받아서 처리
		response.forEach(vehicle => {  // 차량 목록을 순회하면서
		    
			const curStationId = vehicle.cur_station_id;	// 현재 정류소
			const nextStationId = vehicle.next_station_id;	// 다음 정류소
			
			let stationLat1 = 0, stationLon1 = 0, stationLat2 = 0, stationLon2 = 0;
			let distance1 = 0, distance2 = 0;
		    
			const busIcon = document.createElement('img');  // 차량 아이콘을 나타낼 이미지 태그 생성
	        busIcon.src = contextPath + '/resources/images/search/bus2.png';  // 차량 아이콘의 경로 설정
		    
		    for (let j = 0; j < stationInfo.length - 1; j++) {
		    	if(stationInfo[j].station_id == curStationId) {
					stationLat1 = parseFloat(stationInfo[j].coords_y);  	// 현재 정류소의 위도
			        stationLon1 = parseFloat(stationInfo[j].coords_x);  	// 현재 정류소의 경도
			        stationLat2 = parseFloat(stationInfo[j + 1].coords_y);  // 다음 정류소의 위도
			        stationLon2 = parseFloat(stationInfo[j + 1].coords_x);  // 다음 정류소의 경도
				}
		    }
			// 차량과 두 정류소 간의 거리 계산
	        distance1 = getDistance(vehicle.coords_y, vehicle.coords_x, stationLat1, stationLon1);  // 차량과 현재 정류소의 거리
	        distance2 = getDistance(vehicle.coords_y, vehicle.coords_x, stationLat2, stationLon2);  // 차량과 다음 정류소의 거리
	        
		    // DOM 요소 가져오기
			const curArrowBox = document.querySelector(`#arrowBox-${curStationId}`);
			const nextArrowBox = document.querySelector(`#arrowBox-${nextStationId}`);
		    
		    if (curArrowBox && nextArrowBox && (distance1 + distance2) > 0) {
			    // 현재 정류소와 차량 사이 거리 비율 계산
			    const busPositionRatio = distance1 / (distance1 + distance2);
				//  offsetTop : Y좌표(상단 위치) ,  두 정류장의 위치 차이를 비율만큼 곱해 차량의 위치를 결정
			    const busPosY = curArrowBox.offsetTop + (nextArrowBox.offsetTop - curArrowBox.offsetTop) * busPositionRatio;
			
		        busIcon.style.cssText = `width:40px; height:40px; position:absolute; top:${busPosY}px;`;  // 아이콘의 스타일 설정
			    curArrowBox.appendChild(busIcon);
			}
		});
	}, function(request, status, error) {
	    console.log("getRouteVehList get error : " + request.responseText);
	});
}

// Haversine 공식을 이용해 두 지점 간의 거리 계산 (단위: km)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름 (단위: km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km 단위로 거리 반환
}

// 정류소 검색
function fnStationSearch(pageNo, type) {
	$("#mdBusArrive").hide();
	
	if(fnStationVaildateInput()) {
		fnLayerClear();
		
		toggleSection("stationSec");
	
		var select_region = $("#stationRegion").val();
		if(type != "subSearch" && type != "page") select_region = "";
		
		var adminId = "";
		if(select_region != "") {
			adminId = select_region;
		}else {
			adminId = $("#adminId").val();
		}
		
		var data = { 
			pageIndex : pageNo,
			main_searchKeyword : $("#station_searchKeyword").val(),
			admin_id : adminId 
		};
		
		AjaxJson(contextPath + "/station/getStationList.do", data, function(response) {
			
			const stationList = response.list;
    		const paginationInfo = response.paginationInfo;
			
		    updateStationTable(stationList);			// 노선목록 업데이트
		    updatePagination(paginationInfo, "#divPaginationStation", "fn_station_select_linkPage");	// 페이징 업데이트	
			
			const stationAdminCodeList = response.stationAdminCodeList;
			if(type != "subSearch" && type != "page") {
				updateSelectAdminCd(stationAdminCodeList, "stationRegion");	// 전체지역 선택박스 업데이트
			}
			
    		rxMap.station.view_all_station(data);
    		
		}, function(request, status, error) {
		    console.log("getStationList get error : " + request.responseText);
		});
	}
}

// 정류소 검색 > 노선목록 업데이트
function updateStationTable(stationList) {
	
	const stopList = document.querySelector("#ulStationList");    	
	stopList.innerHTML = '';
	
	if(stationList.length > 0) {
		
		stationList.forEach(function(station) {
	        const li = document.createElement("li");
	        li.classList.add("stop-item");
	
	        const a = document.createElement("a");
	        a.href = `javascript:fnPassRouteStation('${station.station_id}');`;
	        a.classList.add("link-stop");
	
			a.addEventListener("click", function () {
				// 선택한 정류소정보 저장
				sessionStorage.setItem("selectedStataionInfo", JSON.stringify(station));
				$("#stationId").val(station.station_id);
			});
	
	        const orderDiv = document.createElement("div");
	        orderDiv.classList.add("order");
	        orderDiv.textContent = station.rnum;
	
	        const stopAreaDiv = document.createElement("div");
	        stopAreaDiv.classList.add("stop-area");
	
	        const stopWrapDiv = document.createElement("div");
	        stopWrapDiv.classList.add("stop-wrap");
	
	        const stopSpan = document.createElement("span");
	        stopSpan.classList.add("stop");
	        stopSpan.textContent = station.station_knm;
	
	        const locationSpan = document.createElement("span");
	        locationSpan.classList.add("location");
	        locationSpan.textContent = station.admin_nm2;
	
	        const numberSpan = document.createElement("span");
	        numberSpan.classList.add("number");
	        numberSpan.textContent = station.mobile_no;
	
	        stopWrapDiv.appendChild(stopSpan);
	        stopWrapDiv.appendChild(locationSpan);
	        stopAreaDiv.appendChild(stopWrapDiv);
	        stopAreaDiv.appendChild(numberSpan);
	        a.appendChild(orderDiv);
	        a.appendChild(stopAreaDiv);
	        li.appendChild(a);
	
	        stopList.appendChild(li);
	        
	        stopList.scrollTop = 0;	// 스크롤바 초기화
	    });
	} else {
		const noDataArea = document.createElement("div");
	    noDataArea.classList.add("group-none");
		
		const noData = document.createElement("p");
	    noData.classList.add("desc");
		noData.textContent = "검색 결과가 없습니다.";
		
		const nonIcon = document.createElement("i");
	    nonIcon.classList.add("ic-none");
		
		noDataArea.appendChild(noData);
		noDataArea.appendChild(nonIcon);
		stopList.appendChild(noDataArea);
	}
}

// 노선 목록 > 노선별 정류장 목록 > 정류장 선택
function fnSelectedStation(stationId) {
	
	const station = JSON.parse(sessionStorage.getItem("selectedStataionInfo"));
	rxMap.ZoomInBase(station.coords_x, station.coords_y);	// 중심이동 + 줌인기능
	
	selectedStationId = stationId;
	rxMap.station.StationLayerSetStyle(rxMap.getZoom());
	
	// 버스 도착 예정 정보
	isArrvModal = false;
	fnBusArrive(stationId);
}

// 정류장별 노선 목록 조회 
function fnPassRouteStation(stationId) {

	$("#mdBusArrive").hide();
	
	// 버스 도착 예정 정보
	isArrvModal = false;
	fnBusArrive(stationId);
	
	var data = { station_id : stationId };
	
	AjaxJson(contextPath + "/station/getStationPassRoute.do", data, function(response) {
		
		// 정류장별 노선 목록
		toggleSection("routeListByStationSec");
		
		const busList = document.querySelector("#mdRouteList"); 
		busList.innerHTML = "";
	    
    	if(response.length > 0) {
		    response.forEach(function(route) {
		        const busItem = document.createElement("li");
		        busItem.classList.add("bus-item");
		
		        const busLink = document.createElement("a");
		        busLink.href = `javascript:fnSelectedStBySt('${route.route_id}');`;
		        busLink.classList.add("link-bus");
		        
		        busLink.addEventListener("click", function () {
					// 선택한 노선정보 저장
					sessionStorage.setItem("selectedRouteInfo", JSON.stringify(route));
				});
		        
		        const busWrap = document.createElement("div");
		        busWrap.classList.add("bus-wrap");
		        
		        const busType = document.createElement("i");
		        setBusType(route.route_ty, busType);
		      
		        const busNumber = document.createElement("span");
		        busNumber.classList.add("number");
		        busNumber.textContent = route.route_nm;
		
		        const busLocation = document.createElement("span");
		        busLocation.classList.add("location");
		        busLocation.textContent = route.admin_nm2;
		
		        busWrap.appendChild(busType);
		        busWrap.appendChild(busNumber);
		        busWrap.appendChild(busLocation);
		
		        const destinationWrap = document.createElement("div");
		        destinationWrap.classList.add("destination-wrap");
		
		        const origin = document.createElement("span");
		        origin.classList.add("destination");
		        origin.textContent = route.st_sta_knm;	// 쿼리문 항목 추가되면 나옴
		
		        const arrowIcon = document.createElement("i");
		        arrowIcon.classList.add("ic-arrow_double");
		
		        const destination = document.createElement("span");
		        destination.classList.add("destination");
		        destination.textContent = route.ed_sta_knm;	// 쿼리문 항목 추가되면 나옴
		
		        destinationWrap.appendChild(origin);
		        destinationWrap.appendChild(arrowIcon);
		        destinationWrap.appendChild(destination);
		
		        busLink.appendChild(busWrap);
		        busLink.appendChild(destinationWrap);
		
		        busItem.appendChild(busLink);
		        busList.appendChild(busItem);
		    });
		}else {
	        const busItem = document.createElement("li");
	        busItem.classList.add("bus-item");
		        
			const noDataArea = document.createElement("div");
		    noDataArea.classList.add("group-none");
			
			const noData = document.createElement("p");
		    noData.classList.add("desc");
			noData.textContent = "검색 결과가 없습니다.";
			
			const nonIcon = document.createElement("i");
		    nonIcon.classList.add("ic-none");
			
			noDataArea.appendChild(noData);
			noDataArea.appendChild(nonIcon);
			busItem.appendChild(noDataArea);
			busList.appendChild(busItem);
		}
		
		// 선택한 정류소 아이콘 줌인
		const stInfo = JSON.parse(sessionStorage.getItem("selectedStataionInfo"));
		
		$("#mdStMobileNoBySr").html(stInfo.mobile_no);
		$("#mdStKnmBySr").html(stInfo.station_knm);
		$("#mdStAdminNm").html(stInfo.admin_nm2);
		
		rxMap.ZoomInBase(stInfo.coords_x, stInfo.coords_y);
		
	}, function(request, status, error) {
	    console.log("getStationPassRoute get error : " + request.responseText);
	});
}

function fnSelectedStBySt(routeId) {
	
	/* 정류소 현황 탭
		1. 정류소 목록 표출 + 지도에 정류소 아이콘 표출
		2. 정류소 선택
		3. 해당 정류소 경유 노선 목록 표출 + 선택 정류소 지도 줌인 + 도착예정정보 모달창 오픈 
		4. 노선 목록에서 노선 선택시 -> 노선별 정류소 목록 섹션 재사용 */
	
	$("#mdBusArrive").hide();
		
	fnRouteLine(routeId);
	isRouteSection = false;
	isSubSection = true;
}

// 버스도착예정정보 모달창
function fnBusArrive(stationId) {
	
    $("#mdBusArrive").hide();
	const stationInfo = JSON.parse(sessionStorage.getItem("selectedStataionInfo"));
    
    if(!isArrvModal) {
		$("#arrvStationKnm").html(stationInfo.station_knm);
		$("#arrvMobileNo").html(stationInfo.mobile_no);
	} else {
		$("#arrvStationKnm").html($("#stationKnm").val());
		$("#arrvMobileNo").html($("#mobileNo").val());
	}
	
	var data = { station_id : stationId };
	
	AjaxJson(contextPath + "/station/getVehArriveList.do", data, function(response) {
		
    	$("#mdBusArrive").show();
    
		const mdBusArriveList = document.getElementById("ulBusArrive");
    	mdBusArriveList.innerHTML = ""; 
		
		if(response.length > 0) {
			
			response.forEach(bus => {
		        const modalItem = document.createElement("li");
		        modalItem.className = "modal-item";
		
		        const leftWrap = document.createElement("div");
		        leftWrap.className = "left-wrap";
		
				const busLink = document.createElement("a");
			    busLink.href = `javascript:fnStListByRoute();`;
			    busLink.classList.add("link-bus");
				
				busLink.addEventListener("click", function () {
					// 선택한 노선정보 저장
					sessionStorage.setItem("selectedRouteInfo", JSON.stringify(bus));
				});
				
		        const routeTypeIcon = document.createElement("i");
		        setBusType(bus.route_ty, routeTypeIcon);
		        
		        const numberBox = document.createElement("div");
		        numberBox.className = "number-box";
		
		        const routeNumber = document.createElement("span");
		        routeNumber.className = "number";
		        routeNumber.textContent = bus.route_nm;
		
		        const destination = document.createElement("span");
		        destination.className = "destination";
		
				var besDestination = bus.destination;
		
				if (besDestination.length > 12) {
				    destination.innerHTML = besDestination.slice(0, 12) + "<br>" + besDestination.slice(12) + " 방향";
				} else {
				    destination.textContent = besDestination + " 방향";
				}
						
		        numberBox.appendChild(routeNumber);
		        numberBox.appendChild(destination);
		        leftWrap.appendChild(routeTypeIcon);
		        leftWrap.appendChild(numberBox);
		
				busLink.appendChild(leftWrap);
		
		        const rightWrap = document.createElement("div");
		        rightWrap.className = "right-wrap";
			
		        const descBox1 = document.createElement("div");
		        descBox1.className = "desc-box";
		        const descBox2 = document.createElement("div");
		        descBox2.className = "desc-box";
			
				// 남은 정류장 두 건만 표출
		        const remainStaArr = bus.remain_sta_cnt.split(','); 
		        
				// 도착 예정 시간 두 건만 표출
		        const arrInfo = bus.arr_info.split(','); 
		        
		        const remainStationsFirst = document.createElement("p");
		        remainStationsFirst.className = "desc";
		        
		        const remainStationsSecond = document.createElement("p");
		        remainStationsSecond.className = "desc";
		        
		        /**
				 * 20250326 수정
				 * remainStaArr item을 삭제할 때 같은 행인 arrInfo도 함께 삭제해줘야 함.
				 */
		        // remainStaArr에서 remainStaArr[0] 값이 0인 항목 제거				
				// remainStaArr에서 '0'이 아닌 값만 남기면서, arrInfo도 같은 인덱스의 값을 유지
				const filteredData = remainStaArr
				  .map((value, index) => ({ value, info: arrInfo[index] })) // remainStaArr와 arrInfo를 객체로 묶음
				  .filter(item => item.value.trim() !== '0'); // '0'이 아닌 값만 필터링
				
				// 필터링된 remainStaArr와 arrInfo를 다시 배열로 변환
				var filteredStaArr = filteredData.map(item => item.value);
				var filteredArrInfo = filteredData.map(item => item.info);
		
		        const filteredData1 = filteredArrInfo
					.map((value, index) => ({ value, info: filteredStaArr[index] })) // remainStaArr와 arrInfo를 객체로 묶음
				  	.filter(item => {
				    	const minutes = parseInt(item.value.replace('분', '').trim(), 10);
				    	return minutes > 0 && minutes <= 30; // '0분' 또는 30분 초과 제거
				  	});

		        filteredStaArr = filteredData1.map(item => item.info);
				filteredArrInfo = filteredData1.map(item => item.value);
		        
		        if(filteredStaArr.length > 1 && filteredArrInfo.length > 1) {
					if(filteredStaArr[0] < filteredStaArr[1]) {
						remainStationsFirst.innerHTML = `<span>${filteredStaArr[0]}</span> 정류장 전  <span>${filteredArrInfo[0]}</span> 후 도착예정`;
			        	remainStationsSecond.innerHTML = `<span>${filteredStaArr[1]}</span> 정류장 전  <span>${filteredArrInfo[1]}</span> 후 도착예정`;
					} else {
			        	remainStationsSecond.innerHTML = `<span>${filteredStaArr[1]}</span> 정류장 전  <span>${filteredArrInfo[1]}</span> 후 도착예정`;
						remainStationsFirst.innerHTML = `<span>${filteredStaArr[0]}</span> 정류장 전  <span>${filteredArrInfo[0]}</span> 후 도착예정`;
					}
				} else {
					if(filteredStaArr.length > 0) {
						remainStationsFirst.innerHTML = `<span>${filteredStaArr[0]}</span> 정류장 전  <span>${filteredArrInfo[0]}</span> 후 도착예정`;
			        	remainStationsSecond.innerHTML = `<span>0</span> 정류장 전  <span>0분 후 도착예정`;
					} else {
			        	remainStationsFirst.innerHTML = `<span>0</span> 정류장 전  <span>0분 후 도착예정`;
			        	remainStationsSecond.innerHTML = `<span>0</span> 정류장 전  <span>0분 후 도착예정`;
					}
				}
	
				const noDataInfo = document.createElement("p");
				noDataInfo.className = "desc";
				noDataInfo.innerHTML = "도착 예정 정보가 없습니다.";

				if(remainStaArr.length < 1 && arrInfo.length < 1) {
					descBox1.appendChild(noDataInfo);
		        	rightWrap.appendChild(descBox1);
				}else {
					descBox1.appendChild(remainStationsFirst);
					descBox2.appendChild(remainStationsSecond);
		        	rightWrap.appendChild(descBox1);
		        	rightWrap.appendChild(descBox2);
				}
		        modalItem.appendChild(busLink);
		        modalItem.appendChild(rightWrap);
		
		        mdBusArriveList.appendChild(modalItem);
		    });
		    
			updateRefreshTime('refreshArrvTime');
			
		}else {
			const noDataArea = document.createElement("div");
	        noDataArea.className = "none-area";
			const noDataInfo = document.createElement("p");
			noDataInfo.className = "desc";
			noDataInfo.innerHTML = "도착 예정 정보가 없습니다.";
			const nonIcon = document.createElement("i");
		    nonIcon.classList.add("ic-none");
		    noDataInfo.appendChild(nonIcon);
		    noDataArea.appendChild(noDataInfo);
			    
		    mdBusArriveList.appendChild(noDataArea);
		}
		
	}, function(request, status, error) {
	    console.log("getVehArriveList get error : " + request.responseText);
	});	
}

function toggleSection(showSection) {
	
	// 모든 섹션 숨기기
    $("#infoSec").hide();
    $("#useSec").hide();
    $("#routeSec").hide();
    $("#stationSec").hide();

    $("#routeSearchSec").hide();
    $("#stationSearchSec").hide();
	
    $("#stationListByRouteSec").hide();
    $("#routeListByStationSec").hide();
    
    if(isSubSection) {
		$("#routeListByStationSec").show();
		isSubSection = false;
		
	}else {
		// 표시할 섹션만 보여주기
		if(showSection == "infoUse") {
			$("#infoSec").show();
			$("#useSec").show();
			
		}else if(showSection == "routeSec") {
	    	$("#routeSearchSec").show();
	   	 	$("#routeSec").show();
			
		}else if(showSection == "stationSec") {
	    	$("#stationSearchSec").show();
	   	 	$("#stationSec").show();
	    
		} else {
		    $(`#${showSection}`).show();
		}
	}
}

function toggleTab(activeTab) {
	$('.tab-item').removeClass('active');
	$(activeTab).closest('.tab-item').addClass('active');
} 
		
function togglePage(item) {
	if(item == 'route') {
		$("#mapRightSec").show();
		$("#infoRightSec").hide();
		$("#searchLeftSec").show();
		$("#InformationSec").hide();
		
	} else if(item == 'station') {
		$("#mapRightSec").show();
		$("#infoRightSec").hide();
		$("#searchLeftSec").show();
		$("#InformationSec").hide();
		
	} else if(item == 'info') {
		$("#mapRightSec").hide();
		$("#infoRightSec").show();
		$("#searchLeftSec").hide();
		$("#InformationSec").show();
	} 
}	

/* 노선별 정류장 목록 실시간 버스 새로고침 - 현재 시간 가져오기
   도착 예정정보 모달창 새로고침 - 현재 시간 가져오기 */
function updateRefreshTime(type) {
    const timeDiv = document.querySelector(`#${type}`);
    const now = new Date();

    // 날짜와 시간을 포맷팅
    const formattedDate = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    timeDiv.textContent = formattedDate;
}

// 노선 검색 유효성 체크
function fnRouteVaildateInput() {
	if($("#route_searchKeyword").val() == "") {
		alert("검색어를 입력해 주세요.");
		$("#route_searchKeyword").focus();
		return false;
	}
	return true;
}

// 정류소 검색 유효성 체크
function fnStationVaildateInput() {
	if($("#station_searchKeyword").val() == "") {
		alert("검색어를 입력해 주세요.");
		$("#station_searchKeyword").focus();
		return false;
	}
	return true;
}

// 노선 목록 페이징 처리 함수
function fn_route_select_linkPage(pageNo){
   	fnRouteSearch(pageNo, "page");
}

// 정류소 목록 페이징 처리 함수
function fn_station_select_linkPage(pageNo){
	fnStationSearch(pageNo, "page");
}

// 노선별 정류장 목록 모달창 닫기 버튼, 이전 버튼 선택
function fnCloseRouteModal() {
	
	if(isRouteSection) {
		toggleSection("routeSec");		// 노선 현황
	}else {
		toggleSection("stationSec");	// 정류소 현황
		fnStationSearch(1, $("#station_searchKeyword").val());
	}
	
	if(isSubSection) {
		$("#routeListByStationSec").show();
		isSubSection = false;
	}else if(isSubRefresh) {
		$("#routeListByStationSec").show();
		isSubRefresh = false;
	}
	
	$("#mdBusArrive").hide();
	
	fnLayerClear();
}

// 정류장별 노선 목록 모달창 닫기 버튼, 이전 버튼 선택
function fnCloseStationModal() {
	
	toggleSection("stationSec");
	$("#mdBusArrive").hide();
	fnLayerClear();
	
	// 검색한 정류소 아이콘 전체 표출
	var data = { 
		main_searchKeyword : $("#station_searchKeyword").val(),
		admin_id : $("#adminId").val()
	};
	rxMap.station.view_all_station(data);
}

// 노선 타입 설정
function setBusType(route_ty, busType) {
    let busClass, busText;

	switch (route_ty) {
	    case "10":
	        busClass = "ic-wide";  // 광역급행형시내버스 – 빨강
	        busText = "광역";
	        break;
	    case "11":
	        busClass = "ic-seats";  // 직행좌석형시내버스 – 파랑
	        busText = "직좌";
	        break;
	    case "12":
	        busClass = "ic-seats";  // 좌석형시내버스 – 파랑
	        busText = "좌석";
	        break;
	    case "13":
	        busClass = "ic-normal";  // 일반형시내버스 – 녹색
	        busText = "일반";
	        break;
	    case "21":
	        busClass = "ic-seats";  // 직행좌석형농어촌버스 – 파랑
	        busText = "직좌";
	        break;
	    case "22":
	        busClass = "ic-seats";  // 좌석형농어촌버스 – 파랑
	        busText = "좌석";
	        break;
	    case "23":
	        busClass = "ic-normal";  // 일반형시내버스 – 녹색
	        busText = "일반";
	        break;
	    case "30":
	        busClass = "ic-town";  // 마을버스 – 노랑
	        busText = "마을";
	        break;
	    case "41":
	        busClass = "ic-wide";  // 고속형시외버스 – 빨강
	        busText = "고속";
	        break;
	    case "42":
	        busClass = "ic-wide";  // 직행형시외버스 – 빨강
	        busText = "직행";
	        break;
	    case "43":
	        busClass = "ic-normal";  // 일반형시외버스 – 녹색
	        busText = "일반";
	        break;
	    default:
	        busClass = "ic-lowfloor";
	        busText = "저상";
	        break;
	}
    busType.classList.add(busClass);
    busType.textContent = busText;
}

// 메인화면에서 통합검색 실행
function fnIntegratedSearch() {
	
	// 검색어로 노선목록, 정류소 목록 통합 검색
	var data = { 
		pageIndex : 1,
		main_searchKeyword : $("#route_searchKeyword").val(),
		sub_searchKeyword : "",
		admin_id : $("#adminId").val() 
	};
	
	// 노선목록 조회
	let routePromise = new Promise((resolve, reject) => {
		AjaxJson(contextPath + "/route/getRouteList.do", data, function(response) {
			const routeList = response.list;
			const paginationInfo = response.paginationInfo;
			
		    updateRouteTable(routeList);	// 노선목록 업데이트
		    updatePagination(paginationInfo, "#divPaginationRoute", "fn_route_select_linkPage");	// 페이징 업데이트	
			
			const routeTYList = response.routeTYList;
			const routeAdminCodeList = response.routeAdminCodeList;
			
			updateSelectRouteTy(routeTYList);			// 버스유형 선택박스 업데이트
			updateSelectAdminCd(routeAdminCodeList, "selectRegion");	// 전체지역 선택박스 업데이트
			
			resolve(routeList && routeList.length > 0);
			
		}, function() {
		    console.log("getRouteList 호출 실패!");
		    resolve(false);
		});
    });
	
	// 정류소 목록 조회
	let stationPromise = new Promise((resolve, reject) => {
		AjaxJson(contextPath + "/station/getStationList.do", data, function(response) {
			const stationList = response.list;
			const paginationInfo = response.paginationInfo;
			
		    updateStationTable(stationList);			// 노선목록 업데이트
		    updatePagination(paginationInfo, "#divPaginationStation", "fn_station_select_linkPage");	// 페이징 업데이트	
			
			const stationAdminCodeList = response.stationAdminCodeList;
			updateSelectAdminCd(stationAdminCodeList, "stationRegion");	// 전체지역 선택박스 업데이트
			
			resolve(stationList && stationList.length > 0);
		}, function() {
		    console.log("getStationList 호출 실패!");
		    resolve(false);
		});
    });
	
	// 검색 완료 후 실행
	Promise.all([routePromise, stationPromise]).then(results => {
        let routeData = results[0];
        let stationData = results[1];

        if (routeData) {
            toggleSection("routeSec");
			toggleTab($('#btnRoute'));
            
        } else if (stationData) {
            toggleSection("stationSec");
			toggleTab($('#btnStation'));
			isRouteSection = false;
			rxMap.station.view_all_station(data);
            
        } else {
			// 둘다 검색 결과 없으면 노선목록 표출
            toggleSection("routeSec");
			toggleTab($('#btnRoute'));
        }
    });
}

function fnLayerClear() {
	rxMap.layerClear();
	rxMap.veh.fnClearIntervalSelectRouteVeh();
}

// 이용안내 좌측 메뉴목록 선택시 해당 이미지로 스크롤 이동
function scrollToPart(part) {
	const target = document.getElementById(part);
  	if (target) {
    	target.scrollIntoView({ behavior: 'smooth' });
  	}
}

// 지자체별 접근시 전제 정류소 표출
function fnAllStation(adminId) {
	var data = {admin_id : adminId};
	rxMap.station.view_all_station(data);
}