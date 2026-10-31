var nextTramCaption = '';
var nextTramLang = lang;

//$(function(){
$(window).load(function(){
    $.each(nextTramStopsW, function(index, item) {
        var name = '';
        var optionObj = null;
        if(nextTramLang == 'en'){
            name = item[1];
        }else if(nextTramLang == 'tc'){
            name = item[2];
        }else{
            name = item[3];
        }
        optionObj = new Option(item[0]+' - '+name, item[0]);
        $(optionObj).html(item[0]+' - '+name);
        $('#select_west_code').append(optionObj);
    });
    nextTramStopsE.reverse();
    $.each(nextTramStopsE, function(index, item) {
        var name = '';
        var optionObj = null;
        if(nextTramLang == 'en'){
            name = item[1];
        }else if(nextTramLang == 'tc'){
            name = item[2];
        }else{
            name = item[3];
        }
        optionObj = new Option(item[0]+' - '+name, item[0]);
        $(optionObj).html(item[0]+' - '+name);
        $('#select_east_code').append(optionObj);
    });
});

function doRefreshTimetable(){
    //$('#timetable').html('<caption>'+nextTramCaption+'</caption><tr><td>Bound for</td><td>Arrival time</td></tr>');
    if($('#select_west_code').val() != ''){
        onUpdateWestCode();
    }else if($('#select_east_code').val() != ''){
        onUpdateEastCode();
    }
    
}

function onUpdateWestCode(){
    var stop = $('#select_west_code').val();
    if(stop == '') return;
    //$('#timetable').html('<caption>'+nextTramCaption+'</caption><tr><td>Bound for</td><td>Arrival time</td></tr>');
    $('#timetable').html('');
    nextTramCaption = $("#select_west_code :selected").text();
    ajaxGet('msg', stop);
    //ajaxGet('tram', stop);
}

function onUpdateEastCode(){
    var stop = $('#select_east_code').val();
    if(stop == '') return;
    //$('#timetable').html('<caption>'+nextTramCaption+'</caption><tr><td>Bound for</td><td>Arrival time</td></tr>');
    $('#timetable').html('');
    nextTramCaption = $("#select_east_code :selected").text();
    ajaxGet('msg', stop);
    //ajaxGet('tram', stop);
}

function resetSelect(){
    $('#select_west_code option:eq(0)').prop('selected', true); $('#select_west_code').prev().html($("#select_west_code option:selected").text());
    $('#select_east_code option:eq(0)').prop('selected', true); $('#select_east_code').prev().html($("#select_east_code option:selected").text());
    //$('#timetable').html('<caption>Next Trams</caption><tr><td>Bound for</td><td>Arrival time</td></tr>');
    $('#timetable').html('');
    nextTramClose();
}

function ajaxGet(action, stop){
    var link = '';
    switch(action){
        case 'tram': link = 'nextTram/geteat.php'; break;
        case 'msg': link = 'nextTram/getmessage.php'; break;
    }
    TweenLite.to($('#nextTramPanel .detail'), 0.1, {'height':'0px', onComplete:function(){
        $('#nextTramPanel .detail').css('overflow', 'hidden');
    }});
    $.ajax({
        type: "GET",
        url: link,
        data: {stop_code:stop},
        success: function(data){
            //console.log(data);
            if(action == 'tram'){
                //$('#timetable').html('<caption>'+nextTramCaption+'</caption><tr><td>Bound for</td><td>Arrival time</td></tr>');
                var i = 0;
                var h = 0;
                $(data).find('metadata').each(function(index, item){
                    item = $(item);
                    i++;
                    var arrive_in_minute = item.attr('arrive_in_minute');
                    var arrive_in_second = parseInt(item.attr('arrive_in_second')/60);
                    var is_arrived = item.attr('is_arrived');
                    var dest_stop_code = item.attr('dest_stop_code');
                    var tram_status = '';
                    var tram_dest = (nextTramLang == 'en')?item.attr('tram_dest_en'):item.attr('tram_dest_tc');
                    if(tram_dest == "Happy Valley Terminus K") {
                        tram_dest = "Happy Valley Terminus (West Bound Stop)";
                    }else if(tram_dest == "Happy Valley Terminus B") {
                        tram_dest = "Happy Valley Terminus (East Bound Stop)";
                    }
                    if(nextTramLang == 'sc'){
                        $.each(nextTramStopsW, function(index, item) {
                            var code = item[0];
                            if(code == dest_stop_code){
                                tram_dest = item[3];
                            }
                        });
                        $.each(nextTramStopsE, function(index, item) {
                            var code = item[0];
                            if(code == dest_stop_code){
                                tram_dest = item[3];
                            }
                        });
                    }
                    if(is_arrived == 1){
                        if(nextTramLang == 'en'){
                            tram_status = 'Arrived';
                        }else{
                            tram_status = '已到站';
                        }
                    }else{
                        arrive_in_second = (arrive_in_second <= 1)?1:arrive_in_second;
                        if(nextTramLang == 'en'){
                            if(arrive_in_second > 1){
                                tram_status = arrive_in_second+' minutes';
                            }else{
                                tram_status = arrive_in_second+' minute';
                            }
                        }else if(nextTramLang == 'tc'){
                            tram_status = arrive_in_second+' 分鐘';
                        }else{
                            tram_status = arrive_in_second+' 分钟';
                        }
                    }
                    $('#timetable').append('<tr><td><img src="images/nextTram/bullet-0'+i+'.png" alt="" />'+tram_dest+'</td><td>'+tram_status+'</td></tr>');
                });
                //$('#timetable').append('<tr><td>&nbsp;</td><td>&nbsp;</td></tr>');
                TweenLite.fromTo($('#nextTramPanel .detail .buttomBtn'), 0.3, {'autoAlpha':0, 'bottom':'5px'}, {'autoAlpha':1, 'bottom':'-15px'});
                if($('#emgerencyMsg').css('display') != 'none'){
                    h += $('#emgerencyMsg').height()+20;
                }
                //h += $('#nextTramPanel .detail .timetableWrapper').height() + 22 + 33 + 5;  //22 is table padding border, 33 is timetablecaption height
                h += i*36 + 22 + 33 + 5;
                TweenLite.to($('#nextTramPanel .detail'), 0.3, {'height':h+'px', onComplete:function(){
                    $('#nextTramPanel .detail').css('overflow', 'visible');
                }});
                $('#nextTramPanel .btnClose').show();
            }else{
                //$('#timetable').html('<caption>'+nextTramCaption+'</caption><tr><td>Bound for</td><td>Arrival time</td></tr>');
                $('#emgerencyMsg dl dt').html('');
                $('#emgerencyMsg').hide();
                $(data).find('metadata').each(function(index, item){
                    item = $(item);
                    var msg = (nextTramLang == 'en')?item.attr('msg_en'):item.attr('msg_tc');
                    //$('#timetable').append('<tr><td></td><td>'+msg+'</td></tr>');
                    $('#emgerencyMsg dd').html(msg);
                    $('#emgerencyMsg').show();
                });
                ajaxGet('tram', stop);
            }
        },
        error: function(data){
            //console.log('error'+data);
        },
        dataType: 'xml'  //xml, json, script, or html
    });
}