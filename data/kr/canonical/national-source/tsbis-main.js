"use strict";

$(function() {
	
	// 2025.04.15 기간의 정함 없이 팝업 표출(내려달라고 요청 들어올 때까지 적용)
	// 2025.05.13 공지팝업 제거 요청 적용
	// 하루동안 열지 않기 체크했는지 확인
    /*var today = new Date().toLocaleDateString();
    var hiddenDate = localStorage.getItem('noti_pop_hidden');
    if (hiddenDate !== today) {
		$("#noti_pop").show();
	}*/

	// 지자체 스와이퍼 기능
	var swiper = new Swiper('.swiper-container', {
        slidesPerView: 7, // 한 번에 보이는 이미지 개수
        spaceBetween: 20, // 이미지 간격
        loop: true,
        autoplay: {
            delay: 1000,
            disableOnInteraction: false
        }
    });
	document.querySelector('.swiper-container').addEventListener('mouseenter', function () {
    	swiper.autoplay.stop();		// 마우스 올리면 멈춤
	});
	document.querySelector('.swiper-container').addEventListener('mouseleave', function () {
	    swiper.autoplay.start();	// 마우스 내리면 다시 재생
	});

	// 통합 검색
	$('#imgIntegratedSearch').on('click', function (event) {
		event.preventDefault(); // 기본 동작 방지
		fnSearch();
	});

	$('#btnIntegratedSearch').on('click', function (event) {
		event.preventDefault(); // 기본 동작 방지
		fnSearch();
	});
	
	// 팝업 닫기
	$('#closePop').on('click', function (event) {
		event.preventDefault(); // 기본 동작 방지
		
		var hideCheckbox = document.getElementById('hide_today');
		
		if (hideCheckbox.checked) {
            const todayStr = new Date().toLocaleDateString();
            localStorage.setItem('noti_pop_hidden', todayStr);
        }
		$("#noti_pop").hide();
	});
});

// 노선 검색, 정류소 검색, 이용 안내 선택시 통합 화면 해당 탭으로 이동
function fnPage(tp) {
	if(tp == "route") {
		localStorage.setItem('runScript', 'route');
	} else if(tp == "station") {
		localStorage.setItem('runScript', 'station');
	} else if(tp == "info") {
		localStorage.setItem('runScript', 'info');
	}
	window.location.href = 'main_search.do';
}

function fnSearch() {
	const keyword = $('#main_searchKeyword').val();
	
	window.location.href = 'main_search.do?main_searchKeyword=' + encodeURIComponent(keyword);
}

/* ============================================================
 * 홈페이지 이용자 만족도 조사 팝업 (2026.10 추가)
 * 2026년 BIS 운영 및 유지관리 용역 - 이용자 만족도 조사 시행계획(안)
 * by o3i8c
 *  - 노출 여부·회차·종료일은 서버(survey/status.do → TS_BIS.HP_SURVEY_CFG)가 결정
 *  - PC 우측 하단 레이어 / 모바일 하단 배너 (css/survey/survey.css)
 *  - 오늘 하루 보지 않기, 참여 완료 시 미노출, 단말당 최대 3회(방문 단위)
 *  - 쿠키는 tsbis.kr 도메인으로 저장 → www / mobile 공유
 *  - ESC / 닫기(44px) / 레이어 바깥 클릭 시 닫힘
 *  - 시험: 메인 주소 뒤에 ?svytest=Y → 조건 무시하고 팝업 표시, 시험 설문(survey.do?test=Y)으로 이동
 * ============================================================ */
function fnSurveyPopup() {
	var MAX_SHOW = 3;
	var ctx = (typeof contextPath === 'string') ? contextPath : '';
	var isTest = /[?&]svytest=Y(&|$)/.test(location.search);

	function getC(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : null; }
	function setC(n, v, d) {
		var h = location.hostname, dom = (h === 'tsbis.kr' || /\.tsbis\.kr$/.test(h)) ? '; domain=tsbis.kr' : '';
		document.cookie = n + '=' + encodeURIComponent(v) + '; expires=' + d.toUTCString() + '; path=/' + dom + '; SameSite=Lax';
	}
	function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
	function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
	function endDt(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59); }

	function loadCss() {
		if (document.getElementById('svyCss')) return;
		var l = document.createElement('link');
		l.id = 'svyCss'; l.rel = 'stylesheet'; l.type = 'text/css';
		l.href = ctx + '/resources/css/survey/survey.css?v=2026101502';
		document.getElementsByTagName('head')[0].appendChild(l);
	}

	function render(R, endDate) {
		var K = { done: 'svy_done_r' + R, today: 'svy_today_r' + R, cnt: 'svy_cnt_r' + R };
		var SS = { counted: 'svy_counted_r' + R, closed: 'svy_closed_r' + R };

		if (!isTest) {
			if (getC(K.done) || getC(K.today) || ssGet(SS.closed)) return;
			if (!ssGet(SS.counted) && parseInt(getC(K.cnt) || '0', 10) >= MAX_SHOW) return;
			if (!ssGet(SS.counted)) {
				setC(K.cnt, parseInt(getC(K.cnt) || '0', 10) + 1, endDt(endDate));
				ssSet(SS.counted, '1');
			}
		}
		loadCss();

		var url = ctx + '/survey.do' + (isTest ? '?test=Y' : '');
		var $pop = $(
			'<div id="svyPop" role="dialog" aria-labelledby="svyPopTitle" aria-describedby="svyPopDesc">' +
				'<button type="button" class="svy-x" aria-label="설문 안내 닫기">&times;</button>' +
				'<h2 id="svyPopTitle">홈페이지 이용 만족도 조사' + (isTest ? ' (시험)' : '') + '</h2>' +
				'<p id="svyPopDesc">더 편리한 버스정보 서비스를 위해 의견을 들려주세요.' +
				'<span class="svy-meta">10문항 · 약 1분 20초 · 개인정보를 수집하지 않습니다</span></p>' +
				'<a class="svy-go" href="' + url + '">설문 참여하기</a>' +
				'<button type="button" class="svy-today">오늘 하루 보지 않기</button>' +
			'</div>'
		).appendTo('body');

		// 모바일: 하단 고정 메뉴 바(footer.footer 등)가 있으면 그 위에 배너 표시
		function findBottomBar() {
			var list = [].slice.call(document.querySelectorAll('footer.footer'));
			if (!list.length) list = [].slice.call(document.querySelectorAll('body > *, .wrapper > *, footer, nav'));
			for (var i = 0; i < list.length; i++) {
				var el = list[i];
				if (el.id === 'svyPop') continue;
				var s = window.getComputedStyle(el), r = el.getBoundingClientRect();
				if (s.position === 'fixed' && s.display !== 'none' && r.height > 0 &&
					r.bottom >= window.innerHeight - 1 && r.width >= window.innerWidth * 0.9) return el;
			}
			return null;
		}
		function place() {
			if (!$pop || !$pop[0].parentNode) return;
			if (window.innerWidth > 768) { $pop[0].style.bottom = ''; return; }
			var bar = findBottomBar();
			$pop[0].style.bottom = bar ? Math.round(bar.getBoundingClientRect().height) + 'px' : '';
		}
		place();
		setTimeout(place, 300);
		$(window).on('resize.svy orientationchange.svy', place);

		function close() {
			ssSet(SS.closed, '1');
			$pop.remove();
			$(document).off('.svy');
			$(window).off('.svy');
			document.removeEventListener('click', onOutside, true);
		}
		function onOutside(e) { if (!$pop[0].contains(e.target)) close(); }

		$pop.on('click', '.svy-x', close);
		$pop.on('click', '.svy-today', function () {
			var d = new Date(); d.setHours(23, 59, 59, 999);
			setC(K.today, '1', d);
			close();
		});
		$pop.on('click', '.svy-go', function () { ssSet(SS.closed, '1'); });
		$(document).on('keydown.svy', function (e) { if (e.key === 'Escape' || e.keyCode === 27) close(); });
		setTimeout(function () { document.addEventListener('click', onOutside, true); }, 0);
	}

	if (isTest) { render(0, '2099-12-31'); return; }

	$.ajax({ url: ctx + '/survey/status.do', dataType: 'json', cache: false, timeout: 5000 })
	.done(function (st) {
		if (st && st.active && st.round && st.endDate) render(st.round, st.endDate);
	});
}

$(function () {
	try { fnSurveyPopup(); } catch (e) { if (window.console) console.log('[SVY]', e); }
});
