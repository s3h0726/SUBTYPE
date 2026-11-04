/**
 * 공통 기능 스크립트
 *
 * @author kms
 * @since 2019.10.29
 *
 */


$(function () {

    /**
     * 시작일자/종료일자 validataion
     * param : objNm1 - 시작일자 inputbox명
     * param : objNm2 - 종료일자 inputbox명
     * */

    fn_dateCheck = function (objNm1, objNm2) {

        if (!fn_empty(objNm1) && !fn_empty(objNm2)) {

            if ($("#" + objNm1).length <= 0) {
                alert("시작일자 inputbox id가 잘못입력되었습니다.");
                return false;
            }

            if ($("#" + objNm2).length <= 0) {
                alert("종료일자 inputbox id가 잘못입력되었습니다.");
                return false;
            }

            var stdt = $("#" + objNm1).val();
            stdt = stdt.replace(/\-/gi, '');

            var endt = $("#" + objNm2).val();
            endt = endt.replace(/\-/gi, '');


            if (fn_empty(stdt) && fn_empty(endt)) {
                return true;
            }

            if (!fn_empty(stdt) && !fn_empty(endt)) {
                if (stdt > endt) {
                    alert("시작일자는 종료일자보다 클 수 없습니다.");
                    return false;
                } else {
                    return true;
                }
            } else {
                alert("시작일자 또는 종료일자를 입력해주세요.");
                return false;
            }

        } else {

            alert("시작일자/종료일자 inputbox id 입력이 필요합니다.");
            return false;
        }

    }

    $(".date-from, .date-to").change(function () {
        var min, max, target;
        if ($(this).attr("class").indexOf("from") > -1) {
            target = "from"
            min = $(this).val();
            max = $(".date-to").val();
        } else {
            target = "to";
            min = $(".date-from").val();
            max = $(this).val();
        }

        if (min == "" || max == "") {
            return;
        }

        var minDate = min.split("-");
        var maxDate = max.split("-");
        var startDt = new Date(minDate[0], Number(minDate[1]) - 1, minDate[2]);
        var endDt = new Date(maxDate[0], Number(maxDate[1]) - 1, maxDate[2]);

        if (target == "from" && startDt.getTime() > endDt.getTime()) {
            alert("시작일이 종료일보다 이 후 일 수 없습니다.");
            $(this).val("");
        } else if (target == "to" && startDt.getTime() > endDt.getTime()) {
            alert("종료일이 시작일보다 이 전 일 수 없습니다.");
            $(this).val("");
        }
    })

    /**
     * tinymce 웹 편집기 - img 첨부 함수
     * param : fileName - 파일명
     * param : callName - 이미지명
     * */
    fn_tinymceUploadImage = function (fileName, callName) {
        var sHTML = '<img alt="' + callName + '" src="/comm/file/imgDownload.do?name=' + fileName + '" />';

        tinymce.activeEditor.execCommand("mceInsertContent", 'true', sHTML);

    };

    /**
     * 파일 다운로드 공통 헬퍼 함수
     * - HEAD 요청으로 파일 상태 확인 (1번만)
     * - Content-Length가 0이면 alert 표시 (GET 요청 없음)
     * - Content-Length가 0보다 크면 download_file()로 다운로드
     *
     * @param url - 다운로드 URL
     * @private
     */
    function _commonFileDownload(url) {
        // HEAD 요청으로 파일 상태만 확인
        fetch(url, { method: 'HEAD' })
            .then(function(response) {
                // Content-Length 헤더로 파일 존재 여부 판단
                var contentLength = parseInt(response.headers.get('Content-Length') || '0');

                // ========== 케이스 1: 소실 파일 (Content-Length: 0) ==========
                if (contentLength === 0) {
                    // JS에서 직접 에러 메시지 표시
                    alert('죄송합니다. 선택하신 파일은 복구 진행 중인 파일로 현재는 제공될 수 없습니다.');
                    return;  // ← GET 요청 없이 종료!
                }

                // ========== 케이스 2: 정상 파일 (Content-Length > 0) ==========
                // download_file()로 GET 요청 시작
                // (만약 이 시점에 파일이 소실되면 서버에서 HTML alert 처리)
                download_file(url);
            })
            .catch(function(error) {
                // 네트워크 오류 또는 예외 발생
                console.error('파일 다운로드 오류:', error);
                alert('파일 다운로드 중 오류가 발생했습니다.');
            });
    }

    /**
     * 파일 다운로드
     * param : atchFileId - 파일첨부ID
     * param : fileDetailSn - 파일첨부SN
     * */
    fn_fileDownload = function (atchFileId, fileDetailSn) {

        if (atchFileId == "" || fileDetailSn == "") {
            alert("파일 다운로드에 필요한 데이터가 부족합니다.");
            return;
        }
        
        $.ajax({
            url: '/cmm/cmm/check-limit.json',
            type: 'POST',
            dataType: 'json',
            data: {
                atchFileId: atchFileId,
                fileDetailSn: fileDetailSn
            },
            success: function(res) {
                if (res.needCaptcha) {
					showLimitCaptcha(atchFileId, fileDetailSn);
                } else {
                    // download_file("/cmm/cmm/fileDownload.do?atchFileId=" + atchFileId + "&fileDetailSn=" + fileDetailSn); //call function
                    var url = '/cmm/cmm/fileDownload.do?atchFileId=' + atchFileId + '&fileDetailSn=' + fileDetailSn;
                    _commonFileDownload(url); // 공통 헬퍼 함수 호출
                    // window.open("/cmm/cmm/fileDownload.do?atchFileId="+atchFileId+"&fileDetailSn="+fileDetailSn);
                }
            },
            error: function(xhr) {
                if (xhr.status === 403) {
					showLimitCaptcha(atchFileId, fileDetailSn);
                }
            }
            
        });
    };


    /**
     * 파일데이터 데이터명으로 파일명 변경 후 다운로드
     * @param atchFileId
     * @param fileDetailSn
     * @param dataNm
     * @param atchFileExtsn
     */
    fn_fileDataDownload = function (atchFileId, fileDetailSn, dataNm) {

        if (atchFileId == "" || fileDetailSn == "" || dataNm == "") {
            alert("파일 다운로드에 필요한 데이터가 부족합니다.");
            return;
        }
        $.ajax({
            url: '/cmm/cmm/check-limit.json',
            type: 'POST',
            dataType: 'json',
            data: {
                atchFileId: atchFileId,
                fileDetailSn: fileDetailSn
            },
            success: function(res) {
                if (res.needCaptcha) {
                    showLimitCaptcha(atchFileId, fileDetailSn);
                } else {
                // window.open("/cmm/cmm/fileDownload.do?atchFileId="+atchFileId+"&fileDetailSn="+fileDetailSn + "&dataNm=" + encodeURI(dataNm));
                download_file("/cmm/cmm/fileDownload.do?atchFileId=" + atchFileId + "&fileDetailSn=" + fileDetailSn + "&dataNm=" + encodeURI(dataNm)); //call function
                }
            },
            error: function(xhr) {
                if (xhr.status === 403) {
                    showLimitCaptcha(atchFileId, fileDetailSn);
                }
            }
            
        });
    };

    /**
     * 엑셀 다운로드
     * param : url - 엑셀다운로드를 위해 데이터 조회를 할 url (list 형태)
     * param : searchParamList - 데이터 조회시 필요한 검색조건
     * */
    fn_excelDown = function (url, searchParamList, excelFileNm, excelSheetNm) {

        if (excelFileNm == "") {
            var titleTag = $(document).find("title").text();
            excelFileNm = titleTag;
        }

        if (excelSheetNm == "") {
            var titleTag = $(document).find("title").text();
            excelSheetNm = titleTag;
        }

        var $excelform = $('<form></form>');

        for (var i = 0; i < searchParamList.length; i++) {
            var param = searchParamList[i];

            var paramTag = $("<input type='hidden' name='" + param + "' id='" + param + "' value='" + $('#' + param + '').val() + "' />");
            $excelform.append(paramTag);
        }

        var fileNmTag = $("<input type='hidden' name='excelFileNm' value='" + excelFileNm + "' />");
        $excelform.append(fileNmTag);
        var sheetNmTag = $("<input type='hidden' name='excelSheetNm' value='" + excelSheetNm + "' />");
        $excelform.append(sheetNmTag);

        $excelform.attr('action', url);
        $excelform.attr('method', 'post');

        $("body").append($excelform);
        $excelform.submit();
        $excelform.remove();

    }

    /**
     * 검색조건용 연도 세팅
     * param  : objNm - 오브젝트명
     * param  : endYear - 종료연도
     * param  : selectAll - 전체 추가여부
     * param  : selectYear - 연도 기본 선택값
     */
    fn_searchYear = function (objNm, startYear, endYear, selectAll, selectYear) {

        var d = new Date();
        var eYear = d.getFullYear();
        var sYear = d.getFullYear();

        if (fn_empty(startYear)) {
            sYear = 2008;
        } else {
            sYear = startYear;
        }

        if (fn_empty(endYear)) {
            eYear = 9999;
        } else {
            eYear = endYear;
        }

        if (startYear > endYear) {
            sYear = 2008;
            eYear = d.getFullYear();
        }

        if (selectAll) {
            $("#" + objNm).append("<option value=\"\">전체</option>");
        }

        for (var i = eYear; i > sYear; i--) {
            if (i == selectYear) {
                $("#" + objNm).append("<option value='" + i + "' selected>" + i + "</option>");
            } else {
                $("#" + objNm).append("<option value='" + i + "'>" + i + "</option>");
            }
        }
    }


    /**
     * 전화번호 -포함해서 출력하기
     * @param  : num - 전화번호
     * @return : 전화번호 -포함된 값
     */
    fn_phoneFormat = function (num) {
        return num.replace(/(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/, "$1-$2-$3");
    }

    /**
     * 입력된 텍스트의 길이를 확인하여 글자 세팅 및 색 적용
     */
    fn_setTextLength = function (limit_length, msg_length, objId) {
        if (msg_length <= limit_length) {
            $("#" + objId).css("color", "#646464");
            $("#" + objId).html(msg_length);
        } else {
            $("#" + objId).css("color", "#E55451");
            $("#" + objId).html(msg_length);
        }
    }

    /**
     * 입력된 텍스트의 길이를 확인하여 글자 세팅 및 색 적용(포털)
     */
    fn_setTextLength_p = function (limit_length, msg_length, objId) {
        if (msg_length <= limit_length) {
            $("." + objId).css("color", "#646464");
            $("." + objId).html(msg_length);
        } else {
            $("." + objId).css("color", "#E55451");
            $("." + objId).html(msg_length);
        }
    }

    // 1. 초기 세팅 (화면에 있는 모든 .lengChkPortal 처리)
    $(".lengChkPortal").each(function () {
        updateByteCount($(this));
    });

    // 2. 실시간 입력 세팅 (이벤트 위임)
    $(document).on('input', '.lengChkPortal', function () {
        updateByteCount($(this));
    });

    // 문자수(char) 기준 카운터 (.lengChkChar) — maxlength·저장검증(.length)과 동일 기준.
    // byte 카운터(.lengChkPortal)와 별개이며, DB 컬럼이 문자 기준(VARCHAR n자)인 필드에 사용.
    $(".lengChkChar").each(function () {
        updateCharCount($(this));
    });
    $(document).on('input', '.lengChkChar', function () {
        updateCharCount($(this));
    });

    initLengthCheck = function () {
        $(".lengChkPortal").each(function () {

            const $textarea = $(this);

            const $wrap = $textarea.closest('.textarea-wrap');
            const $counter = $wrap.find('.count-now')
            const $total = $wrap.find('.count-total')
            const max = Number($textarea.attr('maxlength'));

            if (!max) return;

            $total.text(`/ ${max} bytes`);
            $counter.text($textarea.val().bytes());

            $textarea.on('input', function () {
                const len = $(this).val().bytes();
                $counter.text(len)
                    .css('color', len <= max ? '#646464' : '#E55451')
            })
        })
    }

    /**
     * textarea1 글자수 화면 표출
     *
     * */
    if ($(".lengthCheck1").length) {

        if ($(".lengthCheck1").prop("maxlength") == undefined) return;

        $(".lengthCheck1").after("<span class='a-r'><span id='textareaLength1'></span>&#47;<span id='textareaMaxlength1'></span></span>");

        $("#textareaMaxlength1").html($(".lengthCheck1").prop("maxlength"));
        $("#textareaLength1").html($(".lengthCheck1").val().bytes());

        $(".lengthCheck1").keyup(function (e) {
            fn_setTextLength($(this).prop("maxlength"), $(this).val().length, "textareaLength1");
        });
    }

    /**
     * textarea2 글자수 화면 표출
     *
     * */
    if ($(".lengthCheck2").length) {

        if ($(".lengthCheck2").prop("maxlength") == undefined) return;

        $(".lengthCheck2").after("<span class='a-r'><span id='textareaLength2'></span>&#47;<span id='textareaMaxlength2'></span></span>");

        $("#textareaMaxlength2").html($(".lengthCheck2").prop("maxlength"));
        $("#textareaLength2").html($(".lengthCheck2").val().bytes());

        $(".lengthCheck2").keyup(function (e) {
            fn_setTextLength($(this).prop("maxlength"), $(this).val().length, "textareaLength2");
        });
    }

    /**
     * textarea3 글자수 화면 표출
     *
     * */
    if ($(".lengthCheck3").length) {

        if ($(".lengthCheck3").prop("maxlength") == undefined) return;

        $(".lengthCheck3").after("<span class='a-r'><span id='textareaLength3'></span>&#47;<span id='textareaMaxlength3'></span></span>");

        $("#textareaMaxlength3").html($(".lengthCheck3").prop("maxlength"));
        $("#textareaLength3").html($(".lengthCheck3").val().bytes());

        $(".lengthCheck3").keyup(function (e) {
            fn_setTextLength($(this).prop("maxlength"), $(this).val().length, "textareaLength3");
        });
    }

    /**
     * 포털 textarea 글자수 화면 표출
     *
     * */
    if ($(".lengChkPortal").length) {
        if ($(".lengChkPortal").prop("maxlength") == undefined) return;

        $(".lengChkPortal").siblings(".input-util").find(".limit").empty();
        $(".lengChkPortal").siblings(".input-util").find(".limit").append("<em class='psntLeng'></em><span class='maxLeng'></span>");

        $(".maxLeng").html("/ " + $(".lengChkPortal").prop("maxlength") + " bytes");
        $(".psntLeng").html($(".lengChkPortal").val().bytes());

        $(".lengChkPortal").keyup(function (e) {
            fn_setTextLength_p($(this).prop("maxlength"), $(this).val().length, "psntLeng");
        });
    }

    // 기간 설정 -전체 버튼
    $(document).on('click', '.date-period .btn-date', function () {
        if ($(this).data("period") == "all") {

            var curretDate = dayjs(new Date());

            $(this).closest('.date-period').find('.date-to').val("");
            $(this).closest('.date-period').find('.date-from').val("");
        }
    });

    // 포탈 팝업 inert 속성 제어
    $(document).on("click", ".open-modal[data-target]", function () {
        setTimeout(function () {
            $("#wrap").removeAttr("inert")
            $("#wrap > *:not(.wrap)").attr("inert", "")
            $("#wrap > .wrap > .inner > *:not(#contents)").attr("inert", "")
        }, 0)
    })

});

// 현재 날짜에서 days 만큼 뺀 날자 반환
// ex) 오늘날짜 :  getDate(0)
// ex) 오늘부터 일주일 전 날짜 : getDate(-7)
function fn_getDate(_days) {
    var _date = new Date();
    if (_days != undefined) {
        var _dayOfMonth = _date.getDate();
        _date.setDate(_dayOfMonth + _days);
    }

    var _year = _date.getFullYear();
    var _month = "" + (_date.getMonth() + 1);
    var _day = "" + _date.getDate();

    if (_month.length == 1) _month = "0" + _month;
    if ((_day.length) == 1) _day = "0" + _day;

    var tmp = "" + _year + "-" + _month + "-" + _day;
    return tmp;
}

//현재 월의 1일 반환
function fn_getFirstDate() {
    var _date = new Date();
    var _year = _date.getFullYear();
    var _month = "" + (_date.getMonth() + 1);

    if (_month.length == 1) _month = "0" + _month;

    var tmp = "" + _year + "-" + _month + "-" + "01";
    return tmp;
}

/**
 * 현재 연도
 * @param  : 없음
 * @return : 현재 연도 숫자 4자리
 */
function fn_getNowYear() {
    var _date = new Date();
    var _year = _date.getFullYear();

    return _year;
}


/**
 * 체크박스 전체선택
 * @param  : 없음
 * @return : 없음
 */
function fn_CheckAll() {

    var chkAll = $("input:checkbox[name='checkAll']").is(":checked");

    $("input:checkbox[name='checkbox']").each(function () {
        this.checked = chkAll;
    });
}

/**
 * 개별선택
 * @param  : chkboxObjId (체크박스ID)
 * @return : 없음
 */
function fn_check(chkboxObjId) {

    var chkYn = $("#" + chkboxObjId).is(":checked");

    if (chkYn) {
        $("#" + chkboxObjId).attr("checked", false);
    } else {
        $("#" + chkboxObjId).attr("checked", true);
    }
}

/**
 * 공통코드체크박스 전체선택
 * @param  : 없음
 * @return : 없음
 */
function fn_cmmnCodeCheckAll(checkAllObjNm, checkObjNm) {

    var chkAll = $("input:checkbox[name='" + checkAllObjNm + "']").is(":checked");

    $("input:checkbox[name='" + checkObjNm + "']").each(function () {
        this.disabled = chkAll;
        this.checked = chkAll;
    });
}

/**
 * 쿠키값 설정
 * @param  : name (쿠키명)
 */
function fn_getCookie(name) {

    var Found = false;
    var start = 0, end = 0;
    var i = 0;

    while (i <= document.cookie.length) {
        start = i;
        end = start + name.length;
        if (document.cookie.substring(start, end) == name) {
            Found = true;
            break;
        }
        i++;
    }

    if (Found == true) {
        start = end + 1;
        end = document.cookie.indexOf(';', start);
        if (end < start) end = document.cookie.length;
        return document.cookie.substring(start, end);
    }
}

/**
 * 쿠키값 설정
 * @param  : name - 쿠키명
 * @param  : value - 쿠키값
 * @param  : expiredays -쿠키 만료일
 */
function fn_setCookie(name, value, expiredays) {

    var todayDate = new Date();

    if (expiredays) {
        todayDate.setDate(todayDate.getDate() + expiredays);
    } else {
        todayDate.setDate(todayDate.getDate());
    }

    document.cookie = name + "=" + escape(value) + "; path=/; expires=" + todayDate.toGMTString() + ";";

}

/**
 * 쿠키값 삭제
 * @param  : name - 쿠키명
 */
function fn_deleteCookie(name) {

    var todayDate = new Date();

    todayDate.setDate(todayDate.getDate() - 7);

    document.cookie = name + "=; path=/; expires=" + todayDate.toGMTString() + ";";
}

/**
 * 필수항목 입력 여부/최대길이 체크
 */
function fn_commonValidation(_target) {

    var retVal = true;

    var targetList = (_target == undefined ? $(".req").not(".notChk") : $("#" + _target).find(".req").not(".notChk"));
    //필수값 체크
    targetList.each(function (index, item) {

        // 화면에 안보이면 continue
        if (!$(this).is(":visible")) return true;

        var obj = $(this).parent().next().find(":input");
        if (obj == undefined || obj.length < 1) return true;

        for (var idx = 0; idx < obj.length; idx++) {

            var id = obj[idx].id;
            var val = obj[idx].value;
            var title = obj[idx].title;

            //타이틀 요소 없을 경우 continue
            if (fn_empty(title)) return true;

            //첨부파일 업로드인 경우 continue;
            if (title == "file input") return true;

            if (val == "") {

                alert(title + " 항목은 필수로 입력하셔야합니다.");
                $("#" + id).focus();
                retVal = false;

                return false;
            }
        }

    });

    if (!retVal) return retVal;

    //입력 최대길이 확인
    // class에 notChk 입력되어있는 요소는 체크항목에서 제외
    var checkList = (_target == undefined ? $(":input").not(".notChk") : $("#" + _target).find("input").not(".notChk"));

    checkList.each(function (index, item) {

        // 화면에 안보이면 continue;
        if (!$(this).is(":visible")) return true;

        var maxlength = $(this).prop("maxlength");

        if (fn_empty(maxlength) || maxlength <= 0) return true;

        var title = $(this).prop("title");
        var id = $(this).prop("id");
        var value = $(this).prop("value");

        if (fn_empty(title)) return true;

        //maxlength 길이 체크
        if (value.length > maxlength) {

            alert(title + " 항목은 " + maxlength + "자 이상 입력할 수 없습니다.");
            $("#" + id).focus();
            retVal = false;

            return false;	// braek;
        }

    });

    return retVal;
}

/**
 * 포털 필수항목 입력 여부/최대길이 체크
 */
function fn_commonTcsValidation(_target) {

    var retVal = true;

    var targetList = (_target == undefined ? $(".req").not(".notChk") : $("#" + _target).find(".req").not(".notChk"));
    //필수값 체크
    targetList.each(function (index, item) {

        // 화면에 안보이면 continue
        if (!$(this).is(":visible")) return true;

        var obj = $(this).siblings(":input");
        if (obj == undefined || obj.length < 1) return true;

        for (var idx = 0; idx < obj.length; idx++) {

            var id = obj[idx].id;
            var val = obj[idx].value;
            var title = obj[idx].title;

            //타이틀 요소 없을 경우 continue
            if (fn_empty(title)) return true;

            //첨부파일 업로드인 경우 continue;
            if (title == "file input") return true;

            if (val == "") {
                $("#" + id).siblings(".input-util").find(".input-warning").show();
                $("#" + id).focus();
                retVal = false;

                return false;
            } else {
                $("#" + id).siblings(".input-util").find(".input-warning").hide();
            }
        }

    });

    if (!retVal) return retVal;

    //입력 최대길이 확인
    // class에 notChk 입력되어있는 요소는 체크항목에서 제외
    var checkList = (_target == undefined ? $(":input").not(".notChk") : $("#" + _target).find("input").not(".notChk"));

    checkList.each(function (index, item) {

        // 화면에 안보이면 continue;
        if (!$(this).is(":visible")) return true;

        var maxlength = $(this).prop("maxlength");

        if (fn_empty(maxlength) || maxlength <= 0) return true;

        var title = $(this).prop("title");
        var id = $(this).prop("id");
        var value = $(this).prop("value");

        if (fn_empty(title)) return true;

        var msg = title + " 항목은 " + maxlength + "자 이상 입력할 수 없습니다.";

        //maxlength 길이 체크
        if (value.length > maxlength) {

            $("#" + id).focus();
            $("#" + id).siblings(".input-util").prepend("<p class='input-warning-textlength'>" + msg + "</p>");
            retVal = false;

            return false;	// braek;
        } else {
            $("#" + id).siblings(".input-util").find(".input-warning-textlength").remove();
        }

    });

    return retVal;
}


/**
 * 로딩화면 생성
 * @param : objId - 로딩화면이 보여질 div ID
 */
function loadingStart(objId) {

    if (fn_empty(objId)) return;

    $('#' + objId).loading({
        zIndex: 9999
        , start: true
        , theme: "dark"
        , message: "데이터 처리중입니다. 잠시만 기다려주세요."
    });

}

/**
 * 로딩화면 삭제
 * @param : objId - 로딩화면이 삭제될 div ID
 */
function loadingStop(objId) {

    if (fn_empty(objId)) return;

    $('#' + objId).loading('stop');
}

/**
 * 정상 URL인지 확인
 * @param : objId - URL 정보가 담긴 INPUTBOX ID
 */
function fn_urlCheck(objId) {

    var returnTf;

    if (fn_empty(objId)) return;

    if ($('#' + objId).length <= 0) return;

    $.ajax({
        type: "POST",
        url: "/cmm/cmm/normalityUrlCheck.json",
        data: {url: $('#' + objId).val()},
        dataType: "json",
        async: false,
        success: function (result) {
            if (result.status) returnTf = true;
            else returnTf = false;
        },
        error: function (xhr, status, error) {
            returnTf = false;
        }
    });

    return returnTf;
}

/**
 * String에 bytes() 함수 만들기
 * 한글이면 2bytes, 한글 외 1byte를 count
 * @return : byte수
 */
String.prototype.bytes = function () {

    var msg = this;
    var cnt = 0;

    //한글이면 2, 아니면 1 count 증가
    for (var i = 0; i < msg.length; i++)
        cnt += (msg.charCodeAt(i) > 128) ? 2 : 1;
    return cnt;
}


/*
 * 객체 create
 * 생성할 객체의   eleemnt의 타입과 해당 객체에 지정할 attribute를 넘긴다
 * ex1 ) var tr =  fn_create("tr");
 * ex2 ) var td =  fn_create("td", {innerText : "text"});
 * ex3 ) var input = fn_create('input', {name: 'oprtinSeqNo', value:'0', type:'hidden'});
 * ex4 ) vat btn = fn_create('button', {value : item.code , html : '선택' , event: { "click": clickBrm }});
 * */
function fn_create(elType, attr) {
    var ele = document.createElement(elType);
    for (var k in attr) {
        var v = attr[k];
        switch (k) {
            case 'html' :
                ele.innerHTML = v;
                break;
            case 'class' :
                ele.className = v;
                break;
            case 'event' : // 이벤트 추가
                for (var e in v) {
                    ele.addEventListener(e, v[e]);
                }
                break;
            default :
                ele.setAttribute(k, v);
                break;
        }
    }
    return ele;
}


/*
 *  fn_setCheckboxCmmnCode 실행 후 callback
 *  선택된 체크박스의 갯수를 확인 후 전체체크박스를 선택한다.
 * */
function fn_callbackcheckboxCmmnCode(el) {
    _this = el.find('input[type="checkbox"]');

    $leng1 = _this.closest('.chk-util').find('.one-chk input[type="checkbox"]').not(':disabled').length;
    $leng2 = _this.closest('.chk-util').find('.one-chk input[type="checkbox"]:checked').not(':disabled').length;

    if ($leng1 == 0 && $leng2 == 0) return false;

    if ($leng1 == $leng2) {
        _this.closest('.chk-util').find('.all-chk input[type="checkbox"]').prop('checked', true);
    } else {
        _this.closest('.chk-util').find('.all-chk input[type="checkbox"]').prop('checked', false);
    }
}

/*
 * 수치형을 입력받는 input box에서 최대값을 설정
 *
 * ex ) onkeyup="fn_setMaxNum(this, 100)"
 * -> 해당 input에는 100 이상의 값이 쓰이면 100으로 값 지정
 *  */
function fn_setMaxNum(obj, max) {
    var num = obj.value * 1;
    if (num > max) {
        obj.value = max;
    }
}

/*
 * targetId의 text 값을 el의  value로 복사
 * */
function fn_copyVal(el, targetId) {
    $("#" + targetId).text(el.value + "/");
}

/*
 * SNS 공유 공통 함수
 */
function fn_ShareSns(key, value, ty) {
    //URL PARAMETER
    /*로컬테스트시*/
    // var link = 'https://www.data.go.kr/data/3059726/fileData.do';

    /*운영서버테스트시*/
    var link = document.location.href;

    //설명
    var content = '국가에서 보유하고 있는 다양한 데이터를『공공데이터의 제공 및 이용 활성화에 관한 법률(제11956호)』에 따라 개방하여 국민들이 보다 쉽고 용이하게 공유•활용할 수 있도록 공공데이터(Dataset)와 Open API로 제공하는 사이트입니다.';
    //key,value값에 따라 url값 설정
    if(!fn_empty(key) && !fn_empty(value)) {
        if (!/\.do\?/.test(link) && !link.includes('?')) {
            link += "?";
        }

        for(var i= 0; i<key.length;i++){
            if (!link.includes(key[i])) {
                // URL 끝자리가 '?' 나 '&'가 아니라면(즉, 이미 기존 파라미터가 붙어있다면) 앞에 '&'를 먼저 연결
                var lastChar = link.charAt(link.length - 1);
                if (lastChar !== '?' && lastChar !== '&') {
                    link += "&";
                }

                // key=value 형태로 추가
                link += key[i] + "=" + value[i];
            }
        }
    }

    //facebook popup 호출
    switch (ty) {
        case 'facebook' : {
            var popOption = 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600';
            var sharelink = 'https://www.facebook.com/sharer/sharer.php?u=' + link + '&t=' + encodeURIComponent(document.title);
            window.open(sharelink, 'Share on Facebook', popOption);
            break;
        }

        //twitter팝업호출
        case 'twitter' : {
            content = encodeURI(content);
            var popOption = "width=370, height=360, resizable=no, scrollbars=no, status=no;";
            var wp = window.open("http://twitter.com/intent/tweet?url=" + link + "&text=" + content, 'twitter', popOption);
            if (wp) {
                wp.focus();
            }
            break;
        }
        //kakao팝업호출
        case 'kakao' : {
            Kakao.init('ba43edc443b918ffe489254451482ab4');
            Kakao.Story.share({
                url: link,
                text: content
            });
            break;
        }
        //url복사
        /*case 'copy' : {
            $('.url').attr('data-clipboard-text', link);
            //클립보드 생성
            var clipboard = new ClipboardJS('.url');
            clipboard.on('success', function (e) {
                console.info('Action:', e.action);
                console.info('Text:', e.text);
                console.info('Trigger:', e.trigger);
                alert("URL이 클립보드에 복사되었습니다.");
            });
            break;
        }*/
        case 'copy': {
            // ClipboardJS 없이 navigator.clipboard 사용
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(link).then(function () {
                    alert("URL이 클립보드에 복사되었습니다.");
                }).catch(function () {
                    alert("복사에 실패했습니다.");
                });
            } else {
                // HTTP 환경 등 fallback
                var tempInput = document.createElement('input');
                tempInput.value = link;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                alert("URL이 클립보드에 복사되었습니다.");
            }
            break;
        }

    }
}

/*
 * 업로드파일 신규 웹필터 체크
 * @param : formObjId - 파일 업로드가 포함된 FORM의 ID
 * @param : uploaderObjId - 파일 업로드가 표출되는 DIV의 ID
 * */
function fn_checkNewWebFilterUploadFile(formObjId, uploaderObjId, board) {
    var webfilterResult = Handlebars.getTemplate("webfilter/file-webfilter-result");

    var returnTf = true;

    if (fn_empty(formObjId)) return returnTf;
    if (fn_empty(uploaderObjId)) return returnTf;
    if ($('#' + formObjId).length <= 0) return returnTf;
    if ($('#' + uploaderObjId).length <= 0) return returnTf;

    var form = $("#" + formObjId)[0];
    var data = new FormData(form);
    data.append("hostUrl", location.href)
    data.append("referer", document.referrer)
    data.append("board", board)
    var uploaderFile = document.getElementsByName($('#' + uploaderObjId).find(":file").prop("name"));
    var uploaderLeng = uploaderFile.length;
    var fileSize = 0;
    for (var i = 0; i < uploaderLeng; i++) {
        if (uploaderFile[i].files.length > 0) {
            fileSize = uploaderFile[i].files[0].size;
        }
    }

    if (fileSize == 0) return false;

    //10MB 이상일 경우에 웹필터 패스
    if (fileSize > 10240000) {
        alert("10MB 이상의 파일은 첨부할 수 없습니다.");
        return false;
    }
    loadingStart(uploaderObjId);

    $.ajax({
        type: "POST",
        enctype: 'multipart/form-data',
        url: "/cmm/wbf/checkFileNewWebfilter.json",
        data: data,
        processData: false,
        contentType: false,
        cache: false,
        timeout: 600000,
        async: false,
        success: function (result) {

            resultData = JSON.parse(result);
            loadingStop(uploaderObjId);

            if (resultData.status) {

                //파일 웹필터 결과
                if (resultData.isWebfilterCheckResult) {
                    extensionList = resultData.extensionList;
                    excelRowCount = resultData.excelFileRowCount;
                    fileExt = resultData.fileExt;

                    // 파일 데이터 건수 setting
                    if ($("#atchFileCo").length >= 1) {
                        if (fileExt.toLowerCase() == 'csv' || fileExt.toLowerCase() == 'xls' || fileExt.toLowerCase() == 'xlsx' || excelRowCount != undefined) {
                            $("#atchFileCo").val(excelRowCount);
                        } else {
                            $("#atchFileCo").val("1");
                        }
                        $('#atchFileCo').attr('readonly', true);
                    }
                    if (formObjId == "standardDataRegistVO") {
                        $("#recordCnt").val(excelRowCount);
                        $(".record-cnt").text(excelRowCount);
                    }

                    alert("웹필터 검사결과 업로드 가능한 파일입니다.");
                    returnTf = true;
                } else {
                    alert("웹필터 검사결과 업로드가 불가능한 파일입니다. 다른 파일을 업로드해주세요.");
                    returnTf = false;

                    // 이전에는 모달안에 웹필터 이미지를 띄우기 위해 필요했지만, 현재는 미사용으로 조건 처리, 추후 사용할수도 있어서 삭제처리는 하지 않음.
                    if ($.fn.modal && $('#layer_webfilter').length > 0) {
                        var webfilterResultTemplate = webfilterResult({
                            pattern: resultData.pattern,
                            matchStr: resultData.matchStr,
                            type: 'FILE'
                        });
                        //let html = window.open("about:blank",'error','toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=520, height=470');
                        //html.append(webfilterResultTemplate);
                        $('#layer_webfilter').empty();
                        $('#layer_webfilter').append(webfilterResultTemplate);
                        $("#layer_webfilter").modal("open");
                    }
                }

            } else {
                alert("웹필터 검사 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.");
                returnTf = false;
            }
        },
        error: function (e) {
            loadingStop(uploaderObjId);
            //console.log("ERROR : ", e);
            alert("웹필터 검사 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.");
            returnTf = false;
        }
    });
    return returnTf;
}

/*
 * 업로드파일 웹필터 체크
 * @param : formObjId - 파일 업로드가 포함된 FORM의 ID
 * @param : uploaderObjId - 파일 업로드가 표출되는 DIV의 ID
 * */
function fn_checkWebFilterUploadFile(formObjId, uploaderObjId) {

    var returnTf = true;

    if (fn_empty(formObjId)) return returnTf;
    if (fn_empty(uploaderObjId)) return returnTf;
    if ($('#' + formObjId).length <= 0) return returnTf;
    if ($('#' + uploaderObjId).length <= 0) return returnTf;

    var form = $("#" + formObjId)[0];
    var data = new FormData(form);

    var uploaderFile = document.getElementsByName($('#' + uploaderObjId).find(":file").prop("name"));
    var uploaderLeng = uploaderFile.length;
    var fileSize = 0;
    for (var i = 0; i < uploaderLeng; i++) {
        if (uploaderFile[i].files.length > 0) {
            fileSize = uploaderFile[i].files[0].size;
        }
    }

    if (fileSize == 0) return;

    //10MB 이상일 경우에 웹필터 패스
    if (fileSize > 10240000) {
        alert("10MB 이상의 파일은 첨부할 수 없습니다.");
        return false;
    }

    loadingStart(uploaderObjId);

    $.ajax({
        type: "POST",
        enctype: 'multipart/form-data',
        url: "/cmm/wbf/checkFileWebfilter.json",
        data: data,
        processData: false,
        contentType: false,
        cache: false,
        timeout: 600000,
        async: false,
        success: function (result) {

            resultData = JSON.parse(result);
            loadingStop(uploaderObjId);

            if (resultData.status) {
                //파일 웹필터 결과
                if (resultData.isWebfilterCheckResult) {
                    alert("웹필터 검사결과 업로드 가능한 파일입니다.");
                } else {

                    alert("웹필터 검사결과 업로드가 불가능한 파일입니다. 다른 파일을 업로드해주세요.");
                    window.open(result.webfilterErrorPage, 'error', 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=520, height=470');
                }
            } else {
                alert("웹필터 검사 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.");
            }
            returnTf = resultData.status;
        },
        error: function (e) {
            loadingStop(uploaderObjId);
            //console.log("ERROR : ", e);
            alert("웹필터 검사 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.");
            returnTf = false;
        }
    });

    return returnTf;
}

/*
 * 파일업로더에 업로드 대상 파일이 있는지 여부를 리턴 (취소한 파일은 제외)
 * */
function fn_checkFile(targetUploader) {
    var uploadFiles = false;
    if (targetUploader.getUploads().length > 0) {
        
        var files = targetUploader.getUploads();
        for (var i = 0; i < files.length; i++) {
            
            if (files[i].status == "submitted") {
                
                uploadFiles = true;
                return uploadFiles;
            }
        }
    }

    return uploadFiles;
}

function fn_checkFileCnt(targetUploader) {
    var fileCnt = 0;

    if (fn_checkFile(targetUploader)) {
        var files = targetUploader.getUploads();
        for (var i = 0; i < files.length; i++) {
            if (files[i].status == "submitted") {
                fileCnt++;
            }
        }
    }

    return fileCnt;
}


/**
 * 메뉴 선택 표시 스타일 초기화
 *
 * @param gubun : main - 헤더 메인메뉴만 초기화, myMenu - 마이페이지 왼쪽메뉴만 초기화, 그 외 - 둘다 초기화
 * */
function fn_refreshMenuSelectStyle(gubun) {

    if (gubun == "main") {

        fn_deleteCookie("currentMainMenuId");

        $("#gnb").find(".active").each(function (idx, entry) {
            $(this).removeClass("active");
        });

    } else if (gubun == "myMenu") {

        fn_deleteCookie("currentMyMenuId");

        $("#lnb").find(".active").each(function (idx, entry) {
            $(this).removeClass("active");
        });

    } else {

        fn_deleteCookie("currentMainMenuId");
        fn_deleteCookie("currentMyMenuId");

        $("#gnb").find(".active").each(function (idx, entry) {
            $(this).removeClass("active");
        });
        $("#lnb").find(".active").each(function (idx, entry) {
            $(this).removeClass("active");
        });
    }

}

/**
 * 자동등록 방지 문자 조회하여 비교
 *
 * @param inputObj : 자동등록 방지 문자 입력하는 input  object ID
 * */
function fn_compareCaptCha(inputObj) {


    var returnTf = false;

    if ($("#" + inputObj).length <= 0) return;

    if (fn_empty($("#" + inputObj).val())) {
        alert("자동등록 방지 문자를 입력해주세요.");
        $("#" + inputObj).focus();
        return returnTf;
    }

    var captChaAnswer = "";

    $.ajax({
        url: '/cmm/cmm/selectCaptCha.do',
        type: 'POST',
        dataType: 'json',
        async: false,
        success: function (reulst) {


            captChaAnswer = reulst.captCha;
            captChaAnswer = captChaAnswer.replace(/\r\n/g, '');
            captChaAnswer = captChaAnswer.trim();

            if ($("#" + inputObj).val() != captChaAnswer) {
                alert("자동등록 방지 입력값이 일치하지 않습니다.");
                $("#" + inputObj).val('');
                $("#" + inputObj).focus();
            } else {
                returnTf = true;
            }
        }
    });

    return returnTf;

}

    
function showLimitCaptcha(atchFileId, fileDetailSn) {
	fn_captchaImgRefresh('captchaImg');
    alert("과도한 요청이 감지되었습니다. 캡차 인증이 필요합니다.");
	$('#limitAtchFileId').val(atchFileId);
	$('#limitFileDetailSn').val(fileDetailSn);
    $('#fileLimitCheck').addClass('show in');
    $('#captcha').val('');
    $('#captcha').focus();
}

/**
 * 자동등록 방지 문자 새로고침
 * */
function fn_captchaImgRefresh(imgObj) {

    if ($("#" + imgObj).length <= 0) return;

    $("#" + imgObj).attr("src", "/captcha?id=" + window.crypto.getRandomValues(new Uint32Array(1)));
}


/*
 * 파일업로더에 중복된 파일명을 선택했는지 확인
 * */
function fn_checkFileList(targetUploader, selectedFileNm) {
    var duplTf = false;

    if (targetUploader.getUploads().length > 0) {
        var files = targetUploader.getUploads();
        for (var i = 0; i < files.length; i++) {
            if (files[i].status == "submitted" && files[i].name == selectedFileNm) {
                alert("동일한 파일은 업로드할 수 없습니다.");
                return true;
            }
        }
    }
    return duplTf;

}

function fn_checkFileListMulti(targetUploaderList, selectedFileNm) {
    var duplTf = false;
    for (var j = 0; j < targetUploaderList.length; j++) {
        var targetUploader = targetUploaderList[j];
        if (targetUploader.getUploads().length > 0) {
            var files = targetUploader.getUploads();
            for (var i = 0; i < files.length; i++) {
                if (files[i].status == "submitted" && files[i].name == selectedFileNm) {
                    targetUploader.cancel(files[i].id);
                    alert("동일한 파일은 업로드할 수 없습니다.");
                    return true;
                }
            }
        }
    }

    return duplTf;

}

// 파일 다운로드 script - ydj (기존 파일 다운로드의 window.open 로직은 safari에서 기능 차단이 되어서 따로 추가
function download_file(fileURL) {

    // for non-IE
    if (!window.ActiveXObject) {

        var save = document.createElement('a');
        save.href = fileURL;
        save.target = '_blank';
        var filename = fileURL.substring(fileURL.lastIndexOf('/') + 1);
        save.download = filename;
        if (navigator.userAgent.toLowerCase().match(/(ipad|iphone|safari)/) && navigator.userAgent.search("Chrome") < 0) {
            document.location = save.href;
        } else { // window event not working here
            var evt = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': false
            });
            save.dispatchEvent(evt);
            (window.URL || window.webkitURL).revokeObjectURL(save.href);
        }
    } else if (!!window.ActiveXObject && document.execCommand) { // for IE < 11
        var _window = window.open(fileURL, '_blank');
        _window.document.close();
        _window.document.execCommand('SaveAs', true, fileURL)
        _window.close();
    }
}

/**
 * 특정 textarea의 바이트수를 계산하여 화면에 반영하는 공통 내부 함수
 */
function updateByteCount($textarea) {
    const $wrap = $textarea.closest('.textarea-wrap');
    if ($wrap.length === 0) return; // 부모 래퍼가 없으면 중단

    const $counter = $wrap.find('.count-now');
    const $total = $wrap.find('.count-total');
    const max = Number($textarea.attr('maxlength'));

    if (!max) return;

    // 바이트 계산 (String.prototype.bytes 함수가 있어야 함)
    const currentLen = $textarea.val().bytes();

    // 초기 로드 시에만 total 텍스트 세팅 (선택 사항)
    if ($total.text().indexOf('/') === -1) {
        $total.text(`/ ${max} bytes`);
    }

    $counter.text(currentLen)
        .css('color', currentLen <= max ? '#646464' : '#E55451');
}

function updateCharCount($textarea) {
    const $wrap = $textarea.closest('.textarea-wrap');
    if ($wrap.length === 0) return; // 부모 래퍼가 없으면 중단

    const $counter = $wrap.find('.count-now');
    const $total = $wrap.find('.count-total');
    const max = Number($textarea.attr('maxlength'));

    if (!max) return;

    // 문자 수 계산 (maxlength·저장검증과 동일)
    const currentLen = $textarea.val().length;

    // 초기 로드 시에만 total 텍스트 세팅
    if ($total.text().indexOf('/') === -1) {
        $total.text(`/ ${max} bytes`);
    }

    $counter.text(currentLen)
        .css('color', currentLen <= max ? '#646464' : '#E55451');
}