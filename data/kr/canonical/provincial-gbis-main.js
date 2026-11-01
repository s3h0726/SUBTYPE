//경기도뉴스조회
function fnNewsSearch(){
	var url = "/gbis2014/main.action";
	var data = 'cmd=mainNewsJson';
	
	$.ajax({
		type: "post",
		contentType: "application/x-www-form-urlencoded;charset=UTF-8",
		dataType: "json",
		url: url,
		data: data,
		success: resultNewsSuccess,
		error: ajaxError
	});
}

//뉴스결과값
function resultNewsSuccess(data){
	
	var list = "";
	
	if(data.success == true) {
		var iRow = data.result.length;
		if(iRow > 0) {
			for(var i=0; i<iRow; i++) {
				list +='<div class="ct_wrap">';
				list +='<h3><a href="'+data.result[i].link+'" target="blank" title="경기도뉴스포털 새창열림">'+data.result[i].title+'</a></h3>';
				list +='<p>';
				list +='<img src="'+data.result[i].image+'" style="width:100%" alt="경기도주요뉴스 썸네일" />';
				list +=data.result[i].title;
				list +='</p>';
				list +='<p class="dh"><span class="date">'+data.result[i].rgNewsDate+'</span></p>';
				list +='<a href="http://gnews.gg.go.kr" target="blank" class="bt"><p class="ally-hidden">경기도뉴스포털 새창열림</p><i class="fa fa-plus"></i></a>';
				list +='</div>';
			}
		}
		
		$("#gNews").html(list);
		
	} else {
		alert("조회 실패!!!");
	}
}

//이미지 리사이징
function resizeImg(imgObj, width, height) {
	 
	if(imgObj.width > width) {
	 
		imgObj.width = width;
	 
	}
	
	if(height != "") {
	 
		if(imgObj.height > height) {
		 
			imgObj.height = height;
		 
		}
	}
}

function ajaxError(data){
	console.log(data.msg);
}

//메인공지사항
function fnMainNotice() {
	var url = "/gbis2014/main.action";
	var data = 'cmd=getMainNotice';
	
	$.ajax({
		type: "post",
		contentType: "application/x-www-form-urlencoded;charset=UTF-8",
		dataType: "json",
		url: url,
		data: data,
		success: resultMainNotice,
		error: ajaxError
	});
	
}


function resultMainNotice(data) {
	
	var list = "";
	
	if(data.success == true) {
		var targetNm = "";
		var iRow = data.result.length;
		for(var i = 0; i < iRow; i++){

			if(data.result[i].targetCd == 1){
				targetNm = '전체';
			} else if(data.result[i].targetCd == 2){
				targetNm = '시내';
			} else  if(data.result[i].targetCd == 3){ 
				targetNm= '시외';
			}
			
			list +=	'<div class="ct_wrap">';
			list +=	'<h3><a href="javascript:noticeView(\''+data.result[i].noticeIdx+'\',\''+data.result[i].gubun+'\',\''+data.result[i].rn+'\');">';
			list +=	'['+targetNm+'] '+data.result[i].title;
			list +=	'</a></h3>';
			list +=	'<p>'+data.result[i].title+'</p>';
			list +=	'<p class="dh"><span class="date">'+data.result[i].regDt+'</span></p>';
			list +=	'<a href="/service/bbs/notice/notice.action" class="bt"><p class="ally-hidden">공지사항 더보기</p><i class="fa fa-plus"></i></a>';
			list +=	'</div>';
		}
		
		
	} else {
		
		alert("조회 실패!!!");
	}
	
	$("#noticeList").html(list);
	
	
}

function fnMainPopup(){
	var url = "/gbis2014/main.action";
	var data = "cmd=getMainPopup";
	$.ajax({
		type: "post",
		contentType: "application/x-www-form-urlencoded;charset=UTF-8",
		dataType: "json",
		url: url,
		data: data,
		success:openPop
	});
}

function pop_getcookie( name ){
    var nameOfcookie = "mPop" + name + "=";
    var x = 0;
    while ( x <= document.cookie.length )
    {
            var y = (x+nameOfcookie.length);
            if ( document.cookie.substring( x, y ) == nameOfcookie ) {
                    if ( (endOfcookie=document.cookie.indexOf( ";", y )) == -1 )
                            endOfcookie = document.cookie.length;
                    return unescape( document.cookie.substring( y, endOfcookie ) );
            }
            x = document.cookie.indexOf( " ", x ) + 1;
            if ( x == 0 ) break;
    }
    return "";
}

function openPop(data){
	if(data.success){
		var list = data.list;
		var todayDate = new Date();
		var date = todayDate.getDate();
		var month = todayDate.getMonth()+1;
		var year = todayDate.getFullYear();
		var full = year + "." + month + "." + date;
		
		if(list.length > 0){
			$.each(list,function(i){
				var title = list[i].TITLE;
				var content_c = list[i].CONTENT;
				var width = list[i].WIDTH;
				var height = list[i].HEIGHT;
				var top = list[i].TOP;
				var left = list[i].LEFT;
				var idx = list[i].POPUP_IDX;
				var imgurl = list[i].IMGFILE_PATH;
				var imgnm = list[i].IMGFILE_NAME;
				var content = content_c.replace(/gbis_admin/gi, "gbis2014");
				//content = content.replace(/\n/gi, "");
//				var contextpath = "<%=com.gbis2014.common.base.BaseVar._CONTEXT_PATH%>"; 
				
				if(width == null){
					width = 420;
				}
				width = Number(width) + parseInt(height/20)*2+10;
				if(height == null){
					height = 500;
				}
				height = Number(height) + parseInt(height/20)*2+10;
				var winName = idx;
				var feature = "width="+width+",height="+height+",top="+top+",left="+left+", status=no, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, copyhistory=no, resizable=no";
				var pageUrl = "/gbis2014/jsp/service/mainPopup.jsp";
//				var data = "?title=" + title + "&content=" + content + "&idx=" + idx + "&imgurl=" + imgurl + "&imgnm=" + imgnm + "&width=" + width + "&height=" + height + "&contextpath=" + contextpath;
				var data = "?title=" + title + "&content=" + content + "&idx=" + idx + "&imgurl=" + imgurl + "&imgnm=" + imgnm + "&width=" + width + "&height=" + height;
				//var data = "?title=" + title + "&idx=" + idx + "&imgurl=" + imgurl + "&imgnm=" + imgnm + "&width=" + width + "&height=" + height;

				if ( pop_getcookie( idx ) != full){
					window.open(pageUrl+data, winName, feature);
				}
			});
		}
	}
}



/** 상세뷰 이동 */
function noticeView( idx, gb, rnNum ){
	var url = "/gbis2014/bbs.action?cmd=getNoticeView";
	var data = "noticeIdx=" + idx;
	data += "&gubun=" + gb;
	data += "&pageNum=" + $("#pageNum").val();
	data += "&rnNum=" + rnNum;
	
	$.moveForm(url,data , 'post');
	

}










