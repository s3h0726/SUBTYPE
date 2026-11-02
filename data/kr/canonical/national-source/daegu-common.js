$Zdata.add('code', {
    url: function(id, param) {
        return '/code/' + param.key;
    },
    idField: 'gCd',
    textField: 'gCdNm'
});

$Zdata.add('routeNo', {
    url: '/route',
    idField: 'routeNo',
    textField: 'routeNo'
});

$Zdata.add('lowRouteNo', {
    url: '/lowRoute',
    idField: 'routeNo',
    textField: 'routeNo'
});

$Zdata.add('routeId', {
    url: '/route?search[key]=id',
    idField: 'routeId',
    textField: 'routeNm'
});

$Zdata.add('buscom', {
    url: '/buscom',
    idField: 'comId',
    textField: 'buscomNm'
});

if (typeof BASIC_DATA !== 'undefined') {
    for (var key in BASIC_DATA) {
        $Zdata.addItems('code', key, BASIC_DATA[key]);
    }
}

$(function() {
});

function checkBrowser(){

    var agent = navigator.userAgent.toLowerCase(),
        name = navigator.appName,
        browser = '';
 
    // MS 계열 브라우저를 구분
    if(name === 'Microsoft Internet Explorer' || agent.indexOf('trident') > -1 || agent.indexOf('edge/') > -1) {
        browser = 'ie';
        if(name === 'Microsoft Internet Explorer') { // IE old version (IE 10 or Lower)
            agent = /msie ([0-9]{1,}[\.0-9]{0,})/.exec(agent);
            browser += parseInt(agent[1]);
        } else { // IE 11+
            if(agent.indexOf('trident') > -1) { // IE 11
                browser += 11;
            } else if(agent.indexOf('edge/') > -1) { // Edge
                browser = 'edge';
            }
        }
    } else if(agent.indexOf('safari') > -1) { // Chrome or Safari
        if(agent.indexOf('opr') > -1) { // Opera
            browser = 'opera';
        } else if(agent.indexOf('chrome') > -1) { // Chrome
            browser = 'chrome';
        } else { // Safari
            browser = 'safari';
        }
    } else if(agent.indexOf('firefox') > -1) { // Firefox
        browser = 'firefox';
    }

    return browser;
}

$('a[href="#"], a[href=""]').click(function(e) {
	e.preventDefault();
});

function isMobileView(){
    //mobile일때, 데스크탑 설정시 pc로 나타나게 처리
    //pc일때, mobile View가 아닐경우에만 pc화면으로 인식
    if(window.innerWidth > 767){ //반응형 웹으로 768부터 지도가 나타남. 지도가 나타나지 않은 경우에만 mobileview로 인식
        return false;
    }else{ // mobile 
        return true;
    }
}

function setCountAccess(menuCd) {
    if (menuCd != '01-05') {
        return;
    }

    var type = ''
    if (navigator.platform) { 
        var filter = 'win16|win32|win64|mac|macintel';
        if ( filter.indexOf( navigator.platform.toLowerCase() ) > -1 ) { // pc
            type = 'pc'
        } else { // mobile 
            type = 'mobile'
        } 
    }

    var url = '/access';
    if (menuCd.indexOf('WV') > -1) {
        url = CONFIG.apiPrefix + url;
    }

    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        //request.term = $('#autocomplete').val()
        data: {
            type : type,
            menuCd : menuCd
        },
        loadingTarget: false,
        success: function(data) {
        }
    });
}

var _AceGID = (function() {
    var Inf = ['gtp12.acecounter.com', '8080', 'AH6A44160280251', 'AW', '0', 'NaPm,Ncisy', 'ALL', '0'];
    var _CI = (!_AceGID) ? [] : _AceGID.val;
    var _N = 0;
    var _T = new Image(0, 0);
    if (_CI.join('.').indexOf(Inf[3]) < 0) {
        _T.src = "https://" + Inf[0] + '/?cookie';
        _CI.push(Inf);
        _N = _CI.length;
    }
    return {
        o: _N,
        val: _CI
    };
})();
var _AceCounter = (function() {
    var G = _AceGID;
    var _sc = document.createElement('script');
    var _sm = document.getElementsByTagName('script')[0];
    if (G.o != 0) {
        var _A = G.val[G.o - 1];
        var _G = (_A[0]).substr(0, _A[0].indexOf('.'));
        var _C = (_A[7] != '0') ? (_A[2]) : _A[3];
        var _U = (_A[5]).replace(/\,/g, '_');
        _sc.src = 'https:' + '//cr.acecounter.com/Web/AceCounter_' + _C + '.js?gc=' + _A[2] + '&py=' + _A[4] + '&gd=' + _G + '&gp=' + _A[1] + '&up=' + _U + '&rd=' + (new Date().getTime());
        _sm.parentNode.insertBefore(_sc, _sm);
        return _sc.src;
    }
})();

