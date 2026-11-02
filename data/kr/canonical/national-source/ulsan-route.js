var $Class = function (oClassMember) {
	function ClassOrigin() {
		if (this.$init) this.$init.apply(this, arguments);
	}
	ClassOrigin.prototype = oClassMember;
	ClassOrigin.prototype.constructor = ClassOrigin;
	return ClassOrigin;
};
const route = new ($Class({
	speedClr: ['delay', 'tight', 'slow', 'fast'],
	speedBusClr: ['delayBus', 'tightBus', 'slowBus', 'fastBus'],
	popupOptObj: { direction: '', dayWk: '' },
	routeObj: {},
	stationObj: {},
	routeStationObj: {},
	searchedStationArr: [],
	searchKeyword: null,
	stationArr: null,
	routeStationArr: null,

	searchInterval: null,
	searchIntervalTime: 1000 * 10,

	routeInterval: null,
	routeIntervalTime: 1000 * 5,
//	routeIntervalTime: 1000 * 30000,

	operatingBusInterval: null,
//	operatingBusIntervalTime: 1000 * 2,
	operatingBusIntervalTime: 1000 * 5,

	operatingBusCntInterval: null,
	operatingBusCntIntervalTime: 1000 * 20,

	arrivalInnerFnc: null,
	arrivalRequestSeq: 0,
	
	curTab: "routeType",
	tempBrsSeqno : null,
	
	aniBusFlg : 0,

	$init: function () {
		let that = this;
		AF.onload(function () {
//			that.getOperatingBusCnt();
			that.setEvent();
			that.init();
		});
	},
	/** 초기화*/
	init: function () {
		/* 노선검색 */
		var searchCondition = document.querySelector('#searchCondition li');
		searchCondition.click();
		// 지도에 버스올림으로 인한 지도 확대
		mainApp.map.setZoom(11);
		
		document.title = "버스정보";
	},
	setZoomLevel: function () {
		mainApp.map.map.on("moveend", function () {
			let zoomLv = Math.ceil(mainApp.map.map.getView().getZoom());
			if (zoomLv > 10) {
				mainApp.setStation(route.stationArr);
			} else {
				mainApp.map.removeFeatures("STATION");
			}
		})
	},
	/** 총 운행중인 버스 수*/
	getOperatingBusCnt: function () {
		var that = this;
		if (that.operatingBusCntInterval) clearInterval(that.operatingBusCntInterval);
		var func = (function () {
			var params = {
				postData: { serviceName: 'busCountService', methodName: 'getGridList', paging: false },
				record: {},
				sorting: []
			}
			AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
				var rows = returnData.rows;
				renderTotOperatingBus(rows[0].cnt);
			}, 'json');
			return function () {
				AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
					var rows = returnData.rows;
					renderTotOperatingBus(rows[0].cnt);
				}, 'json');
			}
		})();
		that.operatingBusCntInterval = setInterval(func, that.operatingBusCntIntervalTime);
	},
	/** 이벤트 추가*/
	setEvent: function () {
		let that = this;
		/*노선검색 정류장검색 조회*/
		let searchBtn = document.querySelector('#searchBtn');
		if (searchBtn) {
			let searchKeyword = document.querySelector('#searchKeyword');
			searchKeyword.addEventListener('keypress', function (e) {
				if (e.keyCode == '13') {
					searchBtn.click();
				}
			});
			searchBtn.addEventListener('click', function () {
				that.searchKeyword = searchKeyword.id;
				that.searchAc();
			});
		}
		
		let showBus = document.getElementById("slcBusBox");
		showBus.checked = true;
		this.showAnimateBus(that);
		
		showBus.addEventListener("change", (e)=> {
			if(e.target.checked){
				if(this.aniBusFlg<1)  that.showAnimateBus(that);
				mainPg.toggleBus("on");
			}else{
				mainPg.toggleBus("off");
			}
		})
	},
	showAnimateBus: function (that) {
		this.aniBusFlg = 1;
		var func = (function (that) {
			var params = {
				postData: { serviceName: 'busService', methodName: 'getGridList', paging: false},
				record: {},
				sorting: []
			}
			AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
				var rows = returnData.rows;
				// 노선상세에서 전체버스세팅을 막기위함
				if(document.querySelectorAll(".mapDetail")[1].style.zIndex !== "4") mainApp.setOperatingBus(rows);
			}, 'json');
			return function(){
				AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
					var rows = returnData.rows;
					mainApp.animateOperatingBus(rows);
				}, 'json');
			}
		})();
		that.operatingBusInterval = setInterval(func, that.operatingBusIntervalTime);
	},
	/** 조회 버튼*/
	searchAc: function () {
		var that = this;
		if (that.searchInterval) clearInterval(that.searchInterval);

		var searchKeyword = document.querySelector('#searchKeyword').value;
		var searchCondition = document.querySelectorAll('#searchCondition li.on');
		var params = {
			postData: { serviceName: 'guganService', methodName: 'getGridList', paging: false },
			record: {/* gg4Direction:[{value:'1'}] */ },
			sorting: []
		}
		searchCondition = (searchCondition.length > 1) ? document.querySelectorAll('#searchCondition li.on')[1]
			: document.querySelectorAll('#searchCondition li.on')[0]
		switch (searchCondition.id) {
			case 'routeType': //노선
				mainApp.map.removeFeatures("STATION");
				params.postData.serviceName = 'routeService';
				params.record['routeNm'] = [{ value: searchKeyword }];
				params.sorting.push({ column: 'routeNm', order: 'asc' });
				curTab = "routeType"
				break;
			case 'stationType': //정류장
				params.postData.serviceName = 'stationService';
				let isSrvId = isNaN(parseInt(searchKeyword));
				params.record[isSrvId ? "bstaKorNm" : "stopServiceid"] = [{ value: searchKeyword }]; 
				params.sorting.push({ column: 'bstaKorNm', order: 'asc' });

				curTab = "stationType"
				break;
			case 'bookmarkBtn':
				let bookMrkInfo = route.renderBmrkList();
				//현재 탭 on처리
				document.getElementById(curTab).classList.add("on");

				if (bookMrkInfo[bookMrkInfo.length - 1] == "routeType") {
					bookMrkInfo.pop();

					params.postData.serviceName = 'routeService';
					params.record['routeNm'] = [{ value: searchKeyword }];
					params.record['routeList'] = [{ value: bookMrkInfo }];
					params.record['bmrkFlg'] = [{value: 'true'}];
					params.sorting.push({ column: 'routeNm', order: 'asc' });
				} else {
					bookMrkInfo.pop();
					params.postData.serviceName = 'stationService';
					params.record['bstaKorNm'] = [{ value: searchKeyword }];
					params.record['stationList'] = [{ value: bookMrkInfo }];
					params.record['bmrkFlg'] = [{value: 'true'}];
					params.sorting.push({ column: 'bstaKorNm', order: 'asc' });
				}
			default:
				console.log(searchCondition.id);
		}
		NS.loading('#searchList', true); //해당 DIV에 로딩
		
		AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
			if (returnData.resultCode == 300) return;
			var rows = returnData.rows;
			let lyrNm = "";
			var guganLayer = mainApp.map.getLayer('gg4info');
			if (guganLayer) mainApp.map.removeLayer(guganLayer);
			switch (searchCondition.id) {
				case 'routeType': //노선
					NS.dataToHtml(rows, '#searchList', renderRouteList, renderNoData);
					for (r in rows) {
						that.routeObj[rows[r].brtid] = rows[r];
					}
					that.renderBmrk(rows, searchCondition.id);
					break;
				case 'stationType': //정류장
					route.stationArr = rows;
					if (AF.mobileChk()) {
						NS.dataToHtml(rows, '#searchList', renderMblStationList, renderNoData);
					} else {
						NS.dataToHtml(rows, '#searchList', renderStationList, renderNoData);
					}
					document.querySelectorAll('#searchList>article').forEach((li) => {
						li.addEventListener('click', function () {
							var gridOn = document.querySelector('.grid_on');
							if (gridOn) gridOn.classList.remove('grid_on');

							this.classList.add('grid_on');
						});
					});
					for (r in rows) {
						that.stationObj[rows[r].stopserviceid] = rows[r];
					}
					if (searchKeyword == '') {
						that.drawStation(rows);
					} else {
						that.searchedStation(rows);
					}
					that.renderBmrk(rows, searchCondition.id);
					route.setZoomLevel();

					break;
				case 'bookmarkBtn':
					if (curTab == "routeType") {
						NS.dataToHtml(rows, '#searchList', renderRouteList, renderNoData); // renderStationList
						for (r in rows) {
							that.routeObj[rows[r].brtid] = rows[r];
						}
					} else {
						if (AF.mobileChk()) {
							NS.dataToHtml(rows, '#searchList', renderMblStationList, renderNoData);
						} else {
							NS.dataToHtml(rows, '#searchList', renderStationList, renderNoData);
						}
						for (r in rows) {
							that.stationObj[rows[r].bstaSrvcId] = rows[r];
						}
						if (searchKeyword == '') {
							that.drawStation(rows);
						} else {
							that.searchedStation(rows);
						}
					}
					that.renderBmrk(rows, curTab);
				default:
					console.log(searchCondition.id);
			}
		}, 'json');
	},
	/** 지도에 정류장 그리기*/
	drawStation: function (rows) {
		mainApp.setStation(rows);
	},
	/** 선택된 정류소*/
	searchedStation: function (rows) {
		var stationLayer = mainApp.map.getLayer('STATION');
		var ftrs = stationLayer.getSource().getFeatures();
		for (var i in this.searchedStationArr) {
			var ftr = mainApp.map.getFeature(ftrs, this.searchedStationArr[i].bstaId);
			ftr.setStyle(stationLayer.istyle[0]);
		}
		for (var j in rows) {
			var ftr = mainApp.map.getFeature(ftrs, rows[j].bstaId);
			ftr.setStyle(stationLayer.istyle[1]);
		}
		this.searchedStationArr = rows;
	},
	/** 노선 목록에서 선택*/
	clickRoute: function (routeId) {
		/* 상하행 클릭 시 */
		if (this.routeInterval) {
			clearInterval(this.routeInterval);
			this.routeInterval = null;
		}
		/*노선 디테일 표출*/		
		this.viewRouteDetail(routeId);
		/*링크 그리기*/
		this.setRouteLink(routeId);
		/*운행중인 버스 조회*/
		this.getOperatingBus(routeId);
	},
	/* 웹접근성 관련 추가함수*/
	clickRouteKeydown: function(routeId, event){
		if (event.key === "Enter") {
			route.clickRoute(routeId);
	    }
	},
	/** 노선 경로 조회*/
	setRouteLink: function (routeId, callback, option) {
		var that = this;
		var params = [{
			postData: { serviceName: 'routeLinkService', methodName: 'getGridList', sorting: false },
			record: { routeId: routeId },
		}]
		AF.ajax(NS.ctx + "/mpng/getMultiList.json", params, function (returnData) {
			if (returnData.resultCode == 300) return;
			var rows = returnData.list[0];
			var coord = [];
			var x = 0;
			var y = 0;
			var lyrNm = 'ROUTE';

			mainApp.map.removeFeatures(lyrNm);
			for (var i = 0; i < rows.length; i++) {
				x += rows[i].x2;
				y += rows[i].y2;
				coord.push(mainApp.map.transform([rows[i].x2, rows[i].y2]));
			}
			var route = new ol.geom.LineString(coord);
			var routeFeature = new ol.Feature({
				type: 'route',
				geometry: route,
			});

			mainApp.map.addFeatureCst(lyrNm, routeFeature, 0);
			if(!(typeof callback === "string")){
				mainApp.map.setCenter([x / rows.length, y / rows.length]);
				mainApp.map.setZoom(8);
			}
			
			/* 배차시간표보기 클릭 시 callback 받음*/ 
			if (callback && typeof callback !== "string") {
				if (AF.mobileChk()) {
					let toggleMapThis = document.querySelectorAll('.vsbhd')[0].firstChild;
					mainPg.toggleMap(toggleMapThis);
				}
				callback(routeId, that.routeObj[routeId], option);
			}
		}, 'json');
	},
	/** 노선검색_정류소 클릭*/
	clickStation: function (bstaSrvcId) {
		/* 1.이동
		 * 2.도착정보 조회 
		 * 3.팝업 열기 */
		var data = this.stationObj[bstaSrvcId];
				
		mainApp.map.setCenter([data.stopx2, data.stopy2]);
		mainApp.map.setZoom(15);

        if (route.arrivalInnerFnc !== null){
            clearInterval(route.arrivalInnerFnc);
        } 
		this.getArrivalInfo(bstaSrvcId, null, true);
		
		NS.loading('#arrivalList', true);
		
		if(AF.mobileChk()){
//			mainPg.openPopup('busPop', data.xCrdn, data.yCrdn);
			NS.dataToHtml(data, '#detailView2', renderStationDetailMblList, renderNoData);
			document.getElementById("arrivalMblPop").style.display = "none";
			document.getElementById("arrivalMblRouteInfo").style.display  = "none";
			document.getElementById("arrivalMblOtherRoute").style.display = "none";
			document.getElementById("arrivalMblListRoute").style.display  = "none";
			document.getElementById("arrivalMblList").style.display  = "block";
		}else{
			mainPg.openPopup('busPop', data.stopx2, data.stopy2);
		}

		document.getElementById("arrivalList").style.display = "block";
		document.getElementById("arrivalMblList").style.display = "block";
		document.getElementById("arrivalList").style.overflowY = "scroll";
		document.querySelector("#arrivalRouteInfo").style.display = 'none';
		document.querySelector("#arrivalOtherRoute").style.display = 'none';
		document.querySelector("#arrivalListRoute").style.display = 'none';
		
		document.getElementById("arrivalMblRouteInfo").style.display = "none";
		document.getElementById("arrivalMblListRoute").style.display  = "none";
		
		document.querySelector("#busPop ul").style.overflowY = "scroll";
	},
	stopByList: function (bstaSrvcId, routeId, flag, requestSeq) {
		let that = this;
		
		var params = {
			postData: { serviceName: 'routeStationService', methodName: 'getRouteStationList', paging: false },
			record: { bnodeId: bstaSrvcId },
			sorting: []
		}
        
        if (route.arrivalInnerFnc !== null){
            clearInterval(route.arrivalInnerFnc);
			route.arrivalInnerFnc = null;
        } 
		var func = function(){
            AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
                if (requestSeq !== route.arrivalRequestSeq) return;
                if (returnData.resultCode == 300) return;
                var rows = returnData.rows;
                if (rows.length > 0) {
                    if(AF.mobileChk()){
                        document.querySelectorAll('.mapDetail')[1].style.visibility = 'hidden';
                        document.querySelectorAll('.mapDetail')[2].style.zIndex = 5;
                        document.querySelectorAll('.mapDetail')[2].style.visibility = 'visible';
    
                        //document.querySelector("#busPop ul").style.overflowY = "scroll";
                    }else{
                        document.getElementById('stationNmPop').innerHTML = rows[0].bnodename + '<i>' + rows[0].bnodeId2 + '</i>';
                        document.getElementById('directionPop').innerHTML = rows[0].stopRemark; 
                        
                        if(routeId !== null){
                            let routeTitle = route.routeObj[routeId].brtname.split('(')[0];
                            if (route.routeObj[routeId].brtclass > 0) routeTitle += ' 지원' + route.routeObj[routeId].brtclass;
                            document.getElementById('arrivalPop').innerHTML = routeTitle  + '번 도착정보';	
                        }
                        //document.querySelector("#busPop ul").style.overflowY = "scroll";
                    }
                }
                if(routeId !== null){
                    /* 현재 노선 버스 */		
                    let currows = rows.filter(currows=>{
//                        return (currows.brtId == route.routeObj[routeId].brtid || currows.brtno == route.routeObj[routeId].brtno); // 1221
                        return (currows.brtId == route.routeObj[routeId].brtid || currows.brtname == route.routeObj[routeId].brtname); // 1221
                    });
                    /* 그외 버스 도착 예정정보 */
                    let ncurrows = rows.filter(d=>{
                        return d.brtname !== route.routeObj[routeId].brtname;
                    });
                    document.getElementById("arrivalListRoute").style.overflowY = "auto";
                    document.getElementById("arrivalList").style.display = "none";
                    
                    document.getElementById("arrivalRouteInfo").style.display = "block";
                    document.getElementById("arrivalOtherRoute").style.display = "block";
                    document.getElementById("arrivalListRoute").style.display  = "block";
                    
                    document.getElementById("arrivalMblRouteInfo").style.display = "block";
                    document.getElementById("arrivalMblListRoute").style.display  = "block";
                    document.getElementById("arrivalMblList").style.display  = "none";
					// 선택한 노선의 도착 정보
                    NS.dataToHtml(currows, '#arrivalRouteInfo', renderArrivalTimeList, renderNoArrivalData);
                        if (ncurrows.length == 0) {
                            document.getElementById("arrivalListRoute").style.display  = "none";
                            document.getElementById("arrivalOtherRoute").style.display  = "none";
                        }else {
                            // 그외 노선들
                            NS.dataToHtml(ncurrows, '#arrivalListRoute', renderArrivalTimeList, renderNoArrivalData);						
                        }
                } else {
                	document.getElementById("arrivalRouteInfo").style.display = "none";
                    document.getElementById("arrivalOtherRoute").style.display = "none";
                    document.getElementById("arrivalListRoute").style.display  = "none";
                    
                    document.getElementById("arrivalList").style.display  = "block";
                    // http://solwbs.neighbor21.co.kr:1177/redmine/issues/16241 위 일감으로 인해 수정한 코드(정류장 클릭 시, 정류장 스크롤바 미발생)
                    document.getElementById("arrivalList").style.overflowY = "scroll";
                    
                    NS.dataToHtml(rows, '#arrivalList', renderArrivalTimeList, renderNoArrivalData);
                    NS.dataToHtml(rows, '#arrivalMblList', renderArrivalTimeMblList, renderNoArrivalData);
                }
				if(AF.mobileChk()){
					if (route.arrivalInnerFnc !== null){
						clearInterval(route.arrivalInnerFnc);
					} 
					if (flag === true) {
						var innerFnc = that.getArrivalTimeList(bstaSrvcId, rows, routeId);
						innerFnc();
		//				route.arrivalInnerFnc = setInterval(innerFnc, 1000 * 10);
		//				route.arrivalInnerFnc = setInterval(innerFnc, 1000 * 60);
       					route.arrivalInnerFnc = setInterval(func.bind(this,"n"), 1000 * 5);
						NS.loading('.routeInfo', false);
					}
				}

            }, 'json');
        };
        func();
        // that.routeInterval = setInterval(func.bind(this,"n"), that.routeIntervalTime);
        route.arrivalInnerFnc = setInterval(func.bind(this,"n"), 1000 * 5);
	},
	
	getArrivalTimeList: function (bnodeId, rows, routeId) {
		return function () {	
			// console.log("getArrivalTimeList");
			if (rows.length > 0 ) {
				document.getElementById('stationNmPop').innerHTML = rows[0].bnodename + '<i>' + rows[0].bnodeId2 + '</i>';
				document.getElementById('directionPop').innerHTML = rows[0].stopRemark;
				if(routeId !== null){
					let routeTitle = route.routeObj[routeId].brtname.split('(')[0];
					if (route.routeObj[routeId].brtclass > 0) routeTitle += ' 지원' + route.routeObj[routeId].brtclass;
					document.getElementById('arrivalPop').innerHTML = routeTitle  + '번 도착정보';
					if (AF.mobileChk()){
						document.getElementById('arrivalMblPop').innerHTML = routeTitle  + '번 도착정보';
					}	
				}
				 //document.querySelector("#busPop ul").style.overflowY = "scroll";
			}
			if(routeId !== null){
				/* 현재 노선 버스 */		
				let currows = rows.filter(currows=>{
					return (currows.brtId == route.routeObj[routeId].brtid || currows.brtno == route.routeObj[routeId].brtno);
				});
				/* 그외 버스 도착 예정정보 */
				let ncurrows = rows.filter(d=>{
					return d.brtno !== route.routeObj[routeId].brtno;
				});
				if (AF.mobileChk()){
					/* 모바일 도착 정보 */
					NS.dataToHtml(currows, '#arrivalMblRouteInfo', renderArrivalTimeMblList, renderNoArrivalData);
					if (ncurrows.length == 0) {
						document.getElementById("arrivalMblListRoute").style.display  = "none";
						document.getElementById("arrivalMblOtherRoute").style.display  = "none";
					}else {
						NS.dataToHtml(ncurrows, '#arrivalMblListRoute', renderArrivalTimeMblList, renderNoArrivalData);						
					}
				} else {
					NS.dataToHtml(currows, '#arrivalRouteInfo', renderArrivalTimeList, renderNoArrivalData); // 1221
					if (ncurrows.length == 0) {
						document.getElementById("arrivalListRoute").style.display  = "none";
						document.getElementById("arrivalOtherRoute").style.display  = "none";
					}else {
						NS.dataToHtml(ncurrows, '#arrivalListRoute', renderArrivalTimeList, renderNoArrivalData);						
					}
				}
			}
		    NS.dataToHtml(rows, '#arrivalList', renderArrivalTimeList, renderNoArrivalData);
			NS.dataToHtml(rows, '#arrivalMblList', renderArrivalTimeMblList, renderNoArrivalData);
			//NS.dataToHtml(rows, '#arrivalMblList', renderArrivalTimeMblList, renderNoArrivalData);
		};
	},
	/** 도착 정보 조회*/
	getArrivalInfo: function (bstaSrvcId, routeId, flag) {		
		var that = this;
		var requestSeq = ++that.arrivalRequestSeq;
		document.getElementById('stationNmPop').innerHTML = '-<i></i>';
		document.getElementById('directionPop').innerHTML = '-';
		document.getElementById('arrivalPop').innerHTML = ' '; 
		
		that.stopByList(bstaSrvcId, routeId, flag, requestSeq);
	},
	/*노선 상세 표출*/
	viewRouteDetail: function (routeId) {
		var that = this;
		NS.dataToHtml(this.routeObj[routeId], '#detailView', renderRouteDetailList, renderNoData);
		
		if(!AF.mobileChk()) document.querySelectorAll(".routeInfo")[0].parentNode.style.height = "75%";
		
		var params = {
			postData: { serviceName: 'routeStationService', methodName: 'getGridList', paging: false },
			record: { routeId: routeId },
			sorting: [{ column: 'pntSqno', order: 'asc' }]
		}
		var func = function(flag){
			// 노선
			if(typeof flag === "undefined") NS.loading('#routeStationList', true); //해당 DIV에 로딩
			AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
				// 여기에 노선정류장리스트 쫙 뿌리기
				if (returnData.resultCode == 300) return;
				var rows = returnData.rows;
				// 위의 rows값을 승차알람쪽에서도 사용해야함.
				document.querySelectorAll('.mapDetail')[0].style.visibility = 'hidden';
				document.querySelectorAll('.mapDetail')[1].style.zIndex = 4;
				document.querySelectorAll('.mapDetail')[1].style.visibility = 'visible';

				NS.dataToHtml(rows, '#routeStationList', renderRouteStationList, renderNoData);
				
				setStationCnt(rows.length);
				
				route.routeStationArr = rows;
				
				mainApp.map.map.on("moveend", function () {
					let zoomLv = Math.ceil(mainApp.map.map.getView().getZoom());
					if (zoomLv > 8) {
						mainApp.setRouteStation(route.routeStationArr);
					} else {
						mainApp.map.removeFeatures("STATION");
					}
				})
			}, 'json');
			return function () {
				AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
					if (returnData.resultCode == 300) return;
					var data = returnData.rows;
					for (var i = 0; i < data.length; i++) {
						var id = data[i].routeId + '_' + data[i].bstaId;
						var li = document.getElementById(id);
					}
				}, 'json');
			}
		};
		func();
		that.routeInterval = setInterval(func.bind(this,"n"), that.routeIntervalTime);
	},
	/** 노선상세 뒤로가기*/
	routeBack: function () {
		/* 팝업창 종료*/
		mainPg.removeTooltip('busPop');
		/*배차시간표 팝업 종료*/
		this.removeTimetblPop();
		if (this.routeInterval) {
			clearInterval(this.routeInterval);
			this.routeInterval = null;
		}
//		mainApp.clearFeatures(['ROUTE', 'ROUTE_STATION', 'OPERATING_BUS', 'LIMOUSINE_BUS', 'TOWN_BUS', 'LOCAL_BUS']);
		mainApp.clearFeatures(['ROUTE', 'ROUTE_STATION', 'OPERATING_BUS', 'LIMOUSINE_BUS', 'TOWN_BUS', 'SEAT_BUS', 'CITY_BUS', 'ZISUN_BUS']);
		this.showAnimateBus(this);
		mainPg.detailBack();
		
		route.tempBrsSeqno = null; 
		
	},
	mblArrivalListBack : function () {
		if (route.arrivalInnerFnc !== null){
			clearInterval(route.arrivalInnerFnc);
		}
		document.querySelectorAll('.mapDetail')[1].style.visibility = 'visible';
		document.querySelectorAll('.mapDetail')[2].style.zIndex = 2;
		document.querySelectorAll('.mapDetail')[2].style.visibility = 'hidden';
	},
	mblArrivalListSttBack : function () {
		if (route.arrivalInnerFnc !== null){
			clearInterval(route.arrivalInnerFnc);
		}
		document.querySelectorAll('.mapDetail')[0].style.visibility = 'visible';
		document.querySelectorAll('.mapDetail')[2].style.zIndex = 2;
		document.querySelectorAll('.mapDetail')[2].style.visibility = 'hidden';
		mainPg.openNav(this);
	},
	// 운행중인 버스
	getOperatingBus: function (routeId) {
		var that = this;
		if (that.operatingBusInterval) clearInterval(that.operatingBusInterval);
		/*지도상 버스이미지 제거 */
//		mainApp.clearFeatures(['ROUTE', 'ROUTE_STATION', 'OPERATING_BUS', 'LIMOUSINE_BUS', 'TOWN_BUS', 'LOCAL_BUS']);
		mainApp.clearFeatures(['ROUTE', 'ROUTE_STATION', 'OPERATING_BUS', 'LIMOUSINE_BUS', 'TOWN_BUS', 'SEAT_BUS', 'CITY_BUS', 'ZISUN_BUS']);
		var func = (function () {
			var params = {
				postData: { serviceName: 'busService', methodName: 'getGridList', paging: false },
				record: { routeId: [{ value: routeId }], rungStat: [{value: '1'}] },
				sorting: []
			}
			AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
				var rows = returnData.rows;
				mainApp.setOperatingBus(rows);
			}, 'json');
			return function () {
				AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
					var rows = returnData.rows;
					mainApp.animateOperatingBus(rows);
				}, 'json');
			}
		})();
		/* 2초간격으로 현재버스정보 가져와서 지도에 뿌림*/
		that.operatingBusInterval = setInterval(func, that.operatingBusIntervalTime);
	},
	/** 정류장검색_정류소 클릭*/
	clickRouteStation: function (routeId, bstaSrvcId) { 
		/* 1.이동
		 * 2.도착정보 조회 
		 * 3.팝업 열기 */
		var data = this.routeStationObj[routeId + '_' + bstaSrvcId];
		
		mainApp.map.setCenter([data.stopx2, data.stopy2-0.0004]);
		mainApp.map.setZoom(15);
		// 2. 도착정보
        if (route.arrivalInnerFnc !== null){
            clearInterval(route.arrivalInnerFnc);
        } 
		this.getArrivalInfo(data.stopserviceid, routeId,  true);
		
		NS.loading('#arrivalListRoute', true);
		if(AF.mobileChk()) {
			NS.loading('.routeInfo', true);
			//mainPg.removeTooltip('busPop');
			document.querySelectorAll('.mapDetail')[1].style.visibility = 'hidden';
			document.querySelectorAll('.mapDetail')[1].style.zIndex = 0;
			NS.dataToHtml(data, '#detailView2', renderRouteDetailMblList, renderNoData);
		}else{
			mainPg.openPopup('busPop', data.stopx2, data.stopy2);
			document.getElementById("busPop").focus();
			
		}
		//document.querySelector("#busPop ul").style.overflowY = "scroll";
	},
	/** 버스 마커 on/off*/
	toggleStation: function (that) {
		let layer = mainApp.map.getLayer('STATION');
		if (that.classList.contains('on')) {
			layer.setVisible(false);
			that.classList.remove('on');
		} else {
			layer.setVisible(true);
			that.classList.add('on');
		}
	},
	/** 쿠키에 저장된 데이터 배열저장 */
	renderBmrkList: function () {
		let cookie = AF.getCookie('bookmark');
		if (cookie == "") cookie = "{}";
		let cookieArr = JSON.parse(cookie);
		let renderArr = [];
		for (let i in cookieArr) {
			/*  정류장검색-버스팝업의 북마크 누른 케이스도 포함(busPopType) */
			if (cookieArr[i] == curTab || cookieArr[i] == "busPopType") {
				renderArr.push(i);
			}
		}
		renderArr.push(curTab);
		return renderArr;
	},
	renderBmrk: function (rows, type) {
		let bmrk = AF.getCookie('bookmark');
		if (bmrk == "") bmrk = "{}";
		let bmrkArr = JSON.parse(bmrk);
		for (let i in bmrkArr) {
			const bmrkList = document.querySelectorAll('#trf_' + i);
			if (type == bmrkArr[i] || "busPopType" == bmrkArr[i]) {
				for (let j = 0; j < bmrkList.length; j++) {
					let test = bmrkList[j].childNodes.length;
					if (test > 1) bmrkList[j].childNodes[bmrkList[j].childNodes.length - 1].classList.toggle('on');
				}
			}
		}
	},
	getBmrkRoad: function (data, key) {
		this.bmrk = AF.getCookie(key);
		if (this.bmrk == "") this.bmrk = "{}";
		this.bmrkArr = JSON.parse(this.bmrk);
		let flag = "";
		for (var i in this.bmrkArr) {
			if (i == data) {
				flag = "on";
				break;
			}
		}
		return flag;
	},
	getAlrmBmrk : function(data) {
		this.bmrk = AF.getCookie("session");
		if (this.bmrk == "") this.bmrk = "{}";
		this.bmrkArr = JSON.parse(this.bmrk);
		let flag = "";
		for (var i in this.bmrkArr) {
			if (i == data) {
				flag = "on";
				break;
			}
		}
		return flag;
	},
	getTimeTable: function (id, routeObj, opt) {
		if(typeof routeObj === "undefined"){
			routeObj = this.routeObj[id];
			routeObj.flag = true;
		}else{
			routeObj.flag = false;
		}
		let dywkVal= (typeof opt !== "undefined") ? ((opt.dayWk == "평일") ? 0 : ((opt.dayWk == "토요일") ? 7 : ((opt.dayWk == "일요일(공휴일)") ? 1 : 0))) : 0;
//		/* termVal(기간구분) 평시기준 고정*/
		let params = {
			postData: {
				serviceName: 'routeBusService',
		 		methodName: 'getBusTimeInfo', 
		 		brtNo : routeObj.brtno,
		 		bttDirection : routeObj.brtdirection, // 정방향 역방향 구분값
		 		brtId : routeObj.brtid,
		 		brtClass : routeObj.brtclass,
		 		dywkVal : dywkVal, // 평일/ 토요일/ 일요일 구분값
//		 		brtType : routeObj.brttype
			}
		};
		AF.ajax(NS.ctx + "/mpng/getList.json", params, function (returnData) {
			if (returnData.resultCode == 300) return;
			let rows = returnData.rows;
			let timetablePop = document.querySelector('.timetablePop');
			/* 배차시간표 팝업창 기능*/
			if (routeObj.flag == false) {
				/* 배차시간표 팝업*/
				timetablePop.style.visibility = "visible";
				
//				timetablePop.getElementsByTagName('strong')[0].childNodes[0].textContent = routeObj.brtno + '번';
				timetablePop.getElementsByTagName('strong')[0].childNodes[0].textContent = routeObj.brtname;
				
				document.getElementById('startPt').innerText = routeObj.stopstname;
				document.getElementById('endPt').innerText = routeObj.stopedname;

				if(String(routeObj.brttype) === "40") {
					document.getElementById("dayTimeTable").innerText = "평일(매주 월, 화요일, 설, 추석 명절 연휴 미운영)";
				}else{
					document.getElementById("dayTimeTable").innerText = "평일";
				}

				/* 시간표 데이터가 12개 이상일 경우 추가ol영역에 append */
				if(rows.length > 12) {
					let tempArr1 = new Array();
					let tempArr2 = new Array();
					let lengthAvg = Math.round(rows.length / 2);
					for (let i = 0, n = rows.length; i < n; i++) {
						let pushArr = (i < lengthAvg) ? tempArr1 : tempArr2;
						pushArr.push(rows[i])
					}
					NS.dataToHtml(tempArr1, '#timetableList', renderBusPop, renderNoBusPop);
					NS.dataToHtml(tempArr2, '#timetableList2', renderBusPop, renderNoTimetbl2);

					document.getElementById("timetableList2").style.display = "";
				} else {
					NS.dataToHtml(rows, '#timetableList', renderBusPop, renderNoBusPop);
					NS.dataToHtml([], '#timetableList2', renderNoTimetbl2, renderNoTimetbl2);
					document.getElementById("timetableList2").style.display = "none";
				}
				// 포커스 주자
				document.getElementById("timetablePop").focus();
			}
			// 첫차, 막차시간
			let fdcData = (rows.length > 0) ? rows[0].bttStarttime : "미정";
			let terData = (rows.length > 0) ? rows[rows.length-1].bttStarttime : "미정";
			setArrivalTime(fdcData, terData);
		}, 'json');
	},
	setPopupToggle: function (params, tabKind) {
		// 버스아이콘 위치를 변경함에 따른 childNodes의 순서에 변화가 발생 -> 순서 변경
		let routeId = document.getElementById('routeStationList').childNodes[1].id.split('_')[0];
		let tabs = params.parentNode.parentNode.childNodes;
		for (let i = 0, n = tabs.length; i < n; i++) {
			tabs[i].className = "";
		}
		params.parentNode.classList.toggle("on");
		let paramThird = params.parentNode.childNodes[0].innerText;
		this.popupOptObj[tabKind] = paramThird;
		this.getTimeTable(routeId, this.routeObj[routeId], this.popupOptObj);
	},
	removeTimetblPop: function () {
		/* 조건탭 초기화*/
		let lis = document.querySelectorAll('.timetablePop ul li');
		for (let i = 0, n = lis.length; i < n; i++) {
			if (lis[i].className.indexOf("on") !== -1) {
				lis[i].className = "";
			}
		}
		lis[0].className = "on";
		this.popupOptObj["dayWk"] = "평일";

		/* 팝업 hidden*/
		let timetable = document.querySelector('.timetablePop');
		timetable.style.visibility = "hidden";
		
		// 웹접근성 관련 추가코드
		let routeLists = document.getElementById("routeStationList").childNodes;
		if(routeLists[0] != undefined && typeof routeLists[0].childNodes[0] !== "undefined"){
			routeLists[0].childNodes[0].focus();
		} 
	},
}))();
