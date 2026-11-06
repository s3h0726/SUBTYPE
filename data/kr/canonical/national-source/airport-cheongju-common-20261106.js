/** 메세지 팝업창 재정의 */
function error(msg){
	$.msgBox({
		title: "Error",
		content: msg,
		type: "error"
	});
}
function alert(msg){
	$.msgBox({
		title: "Message",
		content: msg,
		type: "info"
	});
}
function confirm(msg, yFunc, nFunc){
	$.msgBox({
		title: "Confirm",
		content: msg,
		type: "confirm",
		buttons:[{ value: "예" }, { value: "아니오" }, { value: "취소"}],
		success: function(result){
			if(result == "예"){
				yFunc();
			}else if(result == "아니오"){
				nFunc();
			}
		}
	});
}
Date.prototype.format = function(f) {
    if (!this.valueOf()) return " ";
 
    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var d = this;
     
    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
            case "ss": return d.getSeconds().zf(2);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
};
String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};
var func = {
		eventCheck:false,
		fn_ajax : function(url, params, func, async){
			
			$.ajax({
				type : 'post', 
				dataType : 'json',
				data :params,
				url : url,
				async : async,
				success : function(returnData){
					if(returnData.resultCode == 200){
						func(returnData);
					}else{
						alert(returnData.resultMsg);
					}
				},error : function(returnData){
					alert(returnData.resultMsg);
				}
			});
		},
		fn_file_ajax : function(url, params, func, async){
			$.ajax({
				url: url,
				type: 'POST',
				data: params,
				dataType : 'json',
				async : (async == null) ? true : async,
				cache: false,
				contentType: false,
				processData: false,
				success: function(returnData){
					if(returnData.resultCode >= 300){
						alert(returnData.resultMsg);
					}else{
						func(returnData);
					}
				},
				error: function(xhr,status,error){
					if (xhr.status == 401) {
						alert("세션이 만료 되었습니다. 로그인 페이지로 이동합니다.");
						location.href = xhr.getResponseHeader('Location');
			        } else if (xhr.status == 403) {
			            alert("세션이 만료 되었습니다. 로그인 페이지로 이동합니다.");
			            location.href = xhr.getResponseHeader('Location');
			        } else {
			        	console.log("Error!",xhr,status, error);
			        }
				}
			})
		},
		checkMobile : function(){
		    if($(window).width() < 1024) return true;
		    
		    var mobileArr = new Array("iPhone", "iPod", "BlackBerry", "Android", "Windows CE", "LG", "MOT", "SAMSUNG", "SonyEricsson");
		    for(var txt in mobileArr){
		        if(navigator.userAgent.match(mobileArr[txt]) != null){
		           return true;
		        }
		    }
		    return false;
		 },
		 /*::after 나  ::before 제어를 위한 함수*/
		 psuedoClick: function(tag) {
	         var xMin = $(tag).offset().left;
	         var xMax = $(tag).width();
	         var mouseX = event.clientX;

	         if(mouseX > xMin + xMax - 10){
	            return true;
	         }
	         else if(mouseX - 15 < xMin){
	        	 return true;
	         }
	         return false;
	      },
		openLayer : function(selector){
			var div = document.createElement('div');
			$(div).addClass('backLayer');
			
			$('html').css('overflow','hidden');
			
			var width = $(window).width();
			var height = ($('body').height() > $(window).height()) ? $('body').height() : $(window).height();
			
			//화면을 가리는 레이어의 사이즈 조정
			$(div).width(width);
			$(div).height(height);
			$(div).css("position","absolute");
			$(div).css("background-color","black");
			$(div).css("display","none");
			$(div).css({left: 0, top: 0});
			
			$('body').append(div);
			
			//화면을 가리는 레이어를 보여준다 (0.5초동안 30%의 농도의 투명도)
			$(div).fadeTo(300, 0.5);
			$(div).css('z-index',9998);
			
			$(div).click(function(){
				var that = this;
				$('div').each(function(){

					if($(that).css('z-index') < $(this).css('z-index') && $(this).css('z-index') != 'auto'){
						$(this).hide();
					}
				});
				func.closeLayer();
			});
			
			var left = $(window).scrollLeft()+($(window).width()-$(selector).width())/2;
			var top = $(window).scrollTop()+($(window).height()-$(selector).height())/2;
			$(selector).css({'left':left,'top':top});
			$(selector).css('z-index',9999);
			$(selector).show();
		},
		/**레이어팝업 닫기*/
		closeLayer : function(that){
			if(!that){ // 태그 값이 없으면
				$(".backLayer").fadeOut(300);
				$('html').css("overflow","");
			}else{
				var pNode = that.parentNode;
				if(pNode.tagName == 'DIV'){
					$(".backLayer").fadeOut(300);
					$(pNode).fadeOut(300);
					$('html').css("overflow","");
				}else{
					func.closeLayer(pNode);
				}
			}
		},
		fn_comboOption : function(url, params){
			var option = '';
			func.fn_ajax(url,params,function(returnData){
				var data = returnData.rows;
				if(data.length > 0){
					for(var i = 0; i < data.length; i++){
						option += '<option value="'+data[i].comboId+'">'+data[i].comboName+'</option>'
					}
				}
			},false);
			return option;
		},
		setSearchSelect : function(id, list, keyName, afFunc, keyFunc){
			var rowCheck = true;
			var rowIndex = 7;
			var minIndex = 0;
			var maxIndex = rowIndex;
			var html = '';
			var bytes = 20;
			
			html += '<ul>';
			/*태그 만들기*/
			if(list.length > 0){
				for(var i = 0; i < list.length; i++){
					if(!list[i].comboName) continue;
					html += '<li>';
					html += list[i].comboName;
					html += '<input type="hidden" value="'+list[i].comboId+'">';
					html += '</li>';
					
					/*div width 설정*/
					var tempBytes = this.fn_getBytes(list[i].comboName);
					bytes = bytes < tempBytes ? tempBytes : bytes;
				}
			}else{
				html += '<li>조회결과가 없습니다.</li>';
			}
			html += '</ul>';
			
			$(id).each(function(){
				
				var that = this;
				var divTag = document.createElement('div');
				
				if($(this).parent().children('.sBox').get(0) != null){ //sBox가 있다면 해당 박스에 붙임.
					divTag = $(this).parent().children('.sBox').get(0);
					$(divTag).html('');
					$(this).off('keydown');
				}else{ //sBox가 없다면..
					$(divTag).addClass('sBox');
				}
				
				$(this).after(divTag);
				$(divTag).parent().css('position','');
//				$(divTag).css('left',$(this).offset().left - $(this).parent().offset().left);
				$(divTag).width(bytes*6.4);
				$(divTag).css('z-index',1);

				if($(this).parent().children('input[name='+keyName+']').get(0) != null){
					inputTag = $(this).parent().children('input[name='+keyName+']').get(0);
				}else{
					inputTag = document.createElement('input');
					$(inputTag).prop('name',keyName);
					$(inputTag).hide();
					$(that).after(inputTag);
				}
//				$(inputTag).val('');
				
				$(divTag).append(html);
				
				$(divTag).find('li').click(function(){
					var comboKey = $(this).find('input:first').val();
					var comboValue = $(this).text();
					$(inputTag).val(comboKey);
					$(divTag).hide();
					$(that).val(comboValue);
					
					minIndex = 0;
					maxIndex = rowIndex;
					$(divTag).scrollTop(0);
					
					if(afFunc) afFunc(divTag);
				});
				
				$(divTag).find('li').mouseenter(function(){
					$(this).addClass('bgcg');
				});
				
				$(divTag).find('li').mouseleave(function(){
					$(this).removeClass('bgcg');
				});
				
				$(this).keydown(function(e){
					
					if(e.keyCode == 38){ //위쪽
						
						var index = $(divTag).find('.bgcg').index();
						
						if(index <= -1) index = -1
						index = (index <= 0) ? 0 : index-1;
						
						$(divTag).find('li').removeClass('bgcg');
						$(divTag).find('li').eq(index).addClass('bgcg');
						
						var ulTop = $(divTag).find('ul').eq(0).offset().top;
						
						if(index < minIndex){
							minIndex = index;
							maxIndex = minIndex + rowIndex;
							var liTop = $(divTag).find('li').eq(minIndex).offset().top;
							$(divTag).scrollTop(liTop - ulTop);
						}
						
					}else if(e.keyCode == 40){ //아래쪽
						
						var totIndex = $(divTag).find('li').length-1;
						var index = $(divTag).find('.bgcg').index();
						
						index = (index >= totIndex) ? totIndex : index+1;

						$(divTag).find('li').removeClass('bgcg');
						$(divTag).find('li').eq(index).addClass('bgcg');
						
						var ulTop = $(divTag).find('ul').eq(0).offset().top;
						
						if(index > maxIndex){
							maxIndex = index;
							minIndex = maxIndex - rowIndex;
							var liTop = $(divTag).find('li').eq(minIndex).offset().top;
							$(divTag).scrollTop(liTop - ulTop);
						}
						
					}else if(e.keyCode == 13){
						var comboKey = $(divTag).find('.bgcg').find('input:first').val();
						var comboValue = $(divTag).find('.bgcg').text();
						if(comboKey) $(inputTag).val(comboKey);
						if(comboValue) $(that).val(comboValue);
						
						$(divTag).blur();
						minIndex = 0;
						maxIndex = rowIndex;
						$(divTag).scrollTop(0);
						
						$(divTag).hide();
						$(document).off('click');
						func.eventCheck = false;
						
						if(afFunc) afFunc(divTag);
						
					}else if(e.keyCode == 9){
						$(divTag).hide();
						
						if(afFunc) afFunc(divTag);
					}
				});
				
				$(divTag).show(0,function(){
					if(keyFunc) keyFunc();
					
					if($(divTag).find('li').length-1 < rowIndex){
						$(this).css('height','');
					}else{
						$(this).height($(divTag).find('li').eq(rowIndex).offset().top + $(divTag).find('li').eq(rowIndex).height() - $(divTag).find('ul').eq(0).offset().top);
					}
					
					if(!func.eventCheck){
						func.eventCheck = true;
						$(document).click(function(){
							minIndex = 0;
							maxIndex = rowIndex;
							$('.sBox').scrollTop(0);
							$('.sBox').hide();
							$(document).off('click');
							func.eventCheck = false;
							
//							if(afFunc) afFunc('.sBox');
						});
					}
				});
			});
		},
		fn_getBytes : function(el){
		    var codeByte = 0;
		    for (var idx = 0; idx < el.length; idx++) {
		        var oneChar = escape(el.charAt(idx));
		        if ( oneChar.length == 1 ) {
		            codeByte ++;
		        } else if (oneChar.indexOf("%u") != -1) {
		            codeByte += 2;
		        } else if (oneChar.indexOf("%") != -1) {
		            codeByte ++;
		        }
		    }
		    return codeByte;
		}
}


