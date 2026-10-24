var map;

/*var markerArray = [
    //['title', 22.254807, 114.160396, int(z-index), 'desc']
    ['國際金融中心商場 title', 22.254807, 114.160396, 1, '國際金融中心商場 desc']
];*/
var markersArray = new Array();
var markersEB = new Array();
var markersWB = new Array();
var idArray = new Array();
var idEB = new Array();
var idWB = new Array();
//var markerInfoWindow = new google.maps.InfoWindow({maxWidth:200,content:"堅尼地城總站"});

var stopsArrayEB = [
    // [0] => StopCode, [1] => EN, [2] => TC, [3] => SC, [4] => Lattitide, [5] => Longtitude, [6] => zIndex
    ["SKT", "Shau Kei Wan Terminus", "筲箕灣總站", "筲箕湾总站", 22.277781, 114.230257],
    ["101E", "Chai Wan Road", "柴灣道", "柴湾道", 22.276734, 114.229391],
    ["99E", "Nam Hong Street", "南康街", "南康街", 22.279239, 114.226055],
    ["97E", "Sai Wan Ho Depot", "西灣河電車廠", "西湾河电车厂", 22.280067, 114.225673],
    ["95E", "Hoi Foo Street", "海富街", "海富街", 22.280473, 114.224532],
    ["93E", "Tai On Street", "太安街", "太安街", 22.282201, 114.221901],
    ["91E", "Tai Hong Street", "太康街", "太康街", 22.283068, 114.221154],
    ["89E", "Tai Koo Shing Road", "太古城道", "太古城道", 22.284091, 114.220446],
    ["87E", "Kornhill", "康山", "康山", 22.284682, 114.216050],
    ["85E", "Shipyard Lane", "船塢里", "船坞里", 22.284698, 114.213725],
    ["83E", "Mount Parker Road", "柏架山道", "柏架山道", 22.285038, 114.211733],
    ["81E", "Finnie Street", "芬尼街", "芬尼街", 22.288313, 114.210017],
    ["79E", "Java Road", "渣華道", "渣华道", 22.290768, 114.209107],
    ["77E", "Healthy Street East", "健康東街", "健康东街", 22.291803, 114.207351],
    ["75E", "Healthy Street West", "健康西街", "健康西街", 22.292035, 114.204383],
    ["73E", "Tin Chiu Street", "電照街", "电照街", 22.291823, 114.203295],
    ["71E", "Shu Kuk Street", "書局街", "书局街", 22.291199, 114.200531],
    ["NPT", "North Point Terminus","北角總站","北角总站", 22.291040, 114.198940],
    ["69E", "North Point Road", "北角道", "北角道", 22.290510, 114.196940],
    ["67E", "Chun Yeung Street ", "春秧街", "春秧街", 22.291073, 114.196733],
    ["65E", "Fortress Hill ", "炮台山", "炮台山", 22.289433, 114.194526],
    ["63E", "Jupiter Street", "木星街", "木星街", 22.286690, 114.192950],
    ["61E", "Wing Hing Street", "永興街", "永兴街", 22.285105, 114.192887],
    ["59E", "Hing Fat Street", "興發街", "兴发街", 22.281702, 114.191062],
    ["57E", "Victoria Park", "維多利亞公園", "维多利亚公园", 22.280656, 114.189512],
    ["55E", "Shelter Street", "信德街", "信德街", 22.279784, 114.188110],
    // Added
    ["CBT", "Causeway Bay Terminus", "銅鑼灣總站", "铜锣湾总站", 22.279361, 114.187262],
    ["53E", "Paterson Street", "百德新街", "百德新街", 22.279693, 114.186260],
    ["51E", "Percival Street", "波斯富街", "波斯富街", 22.280043, 114.182952],
    ["105", "Foo Ming Street",  "富明街", "富明街", 22.278700, 114.183232],
    ["106", "Leighton Road", "禮頓道", "礼顿道", 22.277122, 114.182521],
    ["107", "Broadwood Road", "樂活道", "乐活道", 22.274055, 114.183667],
    ["108", "Wong Nai Chung Road", "黃泥涌道", "黄泥涌道", 22.271814, 114.184653],
    ["HVT_B", "Happy Valley Terminus", "跑馬地總站", "跑马地总站", 22.269832, 114.184178],
    ["109", "Hong Kong Cemetery", "香港墳場", "香港坟场", 22.271997, 114.180023],
    ["110", "Queen\'s Road East", "皇后大道東", "皇后大道东", 22.274362, 114.179358],
    ["111", "Morrison Hill Road ", "摩利臣山道", "摩利臣山道", 22.276207, 114.180439],
    ["112", "Tin Lok Lane", "天樂里", "天乐里", 22.278623, 114.179626],
    ["49E", "Canal Road West", "堅拿道西", "坚拿道西", 22.279297, 114.180941],
    ["47E", "Tonnochy Road", "杜老誌道", "杜老志道", 22.278345, 114.177972],
    ["45E", "Fleming Road", "菲林明道", "菲林明道", 22.276879, 114.175048],
    ["43E", "O\'Brien Road", "柯布連道", "柯布连道", 22.276627, 114.173127],
    ["41E", "Luard Road", "盧押道", "卢押道", 22.276476, 114.171625],
    ["39E", "Fenwick Street", "分域街", "分域街", 22.277301, 114.170056],
    ["37E", "Arsenal Street", "軍器廠街", "军器厂街", 22.277867, 114.168152],
    ["35E", "Admiralty MTR Station", "金鐘港鐵站", "金钟港铁站", 22.278206, 114.165356],
    ["33E", "Murray Road", "美利道", "美利道", 22.279936, 114.161212],
    ["31E", "Bank Street", "銀行街", "银行街", 22.280624, 114.159871],
    ["29E", "Ice House Street", "雪廠街", "雪厂街", 22.281066, 114.158565],
    ["27E", "Pedder Street", "畢打街", "毕打街", 22.282254, 114.157612],
    ["25E", "Jubilee Street", "租庇利街", "租庇利街", 22.284684, 114.155692],
    ["23E", "Gilman Street", "機利文街", "机利文街", 22.28549, 114.154679],
    ["21E", "Hillier Street", "禧利街", "禧利街", 22.286608, 114.151980],
    ["WMT", "Western Market Terminus", "上環 (西港城) 總站", "上环 (西港城) 总站", 22.286873, 114.150716],
    ["19E", "Macau Ferry Terminal", "港澳碼頭", "港澳码头", 22.287723, 114.150200],
    ["17E", "Queen Street", "皇后街", "皇后街", 22.287671, 114.147029],
    ["15E", "Eastern Street", "東邊街", "东边街", 22.287884, 114.143684],
    ["13E", "Western Street", "西邊街", "西边街", 22.287968, 114.140725],
    ["11E", "Water Street", "水街", "水街", 22.287431, 114.138690],
    ["09E", "Whitty Street", "屈地街", "屈地街", 22.286811, 114.136440],
    ["WST", "Shek Tong Tsui Terminus", "石塘咀總站", "石塘咀总站", 22.286932, 114.135105],
    ["07E", "Hill Road", "山道", "山道", 22.287034, 114.134573],
    // Added
    ["94W", "Whitty Street Depot", "屈地街電車廠", "屈地街电车厂", 22.287451, 114.135170],
    ["05E", "Queen\'s Road West", "皇后大道西", "皇后大道西", 22.286654, 114.132295],
    ["03E", "Holland Street", "荷蘭街", "荷兰街", 22.284599, 114.130609],
    ["01E", "North Street", "北街", "北街", 22.283444, 114.128887],
    ["KTT", "Kennedy Town Terminus", "堅尼地城總站", "坚尼地城总站", 22.282968, 114.126281]
    ];

    var stopsArrayWB = [
    // [0] => StopCode, [1] => EN, [2] => TC, [3] => SC, [4] => Lattitide, [5] => Longtitude, [6] => zIndex
    ["SKT", "Shau Kei Wan Terminus", "筲箕灣總站", "筲箕湾总站", 22.277781, 114.230257],
    ["02W", "Chai Wan Road", "柴灣道", "柴湾道", 22.276740, 114.229210],
    ["04W", "Sun Sing Street", "新成街", "新成街", 22.279557, 114.225772],
    // Added
    ["97E", "Sai Wan Ho Depot", "西灣河電車廠", "西湾河电车厂", 22.280067, 114.225673],
    ["06W", "Hoi Foo Street", "海富街", "海富街", 22.280473, 114.224532],
    ["08W", "Holy Cross Path", "聖十字徑", "圣十字径", 22.281347, 114.222507],
    ["10W", "Tai Hong Street", "太康街", "太康街", 22.283068, 114.221154],
    ["12W", "Tai Koo Shing Road", "太古城道", "太古城道", 22.284091, 114.220446],
    ["14W", "Kornhill", "康山", "康山", 22.284570, 114.216039],
    ["16W", "Shipyard Lane", "船塢里", "船坞里", 22.284698, 114.213725],
    ["18W", "Mount Parker Road", "柏架山道", "柏架山道", 22.284734, 114.212375],
    ["20W", "Finnie Street", "芬尼街", "芬尼街", 22.288313, 114.210017],
    ["22W", "Java Road", "渣華道", "渣华道", 22.290768, 114.209107],
    ["24W", "Healthy Street East", "健康東街", "健康东街", 22.291803, 114.207351],
    ["26W", "Healthy Street West", "健康西街", "健康西街", 22.292042, 114.204652],
    ["28W", "Tin Chiu Street", "電照街", "电照街", 22.291823, 114.203295],
    ["30W", "Shu Kuk Street", "書局街", "书局街", 22.291199, 114.200531],
    ["NPT", "North Point Terminus", "北角總站", "北角总站", 22.291040, 114.198940],
    ["32W", "North Point Road", "北角道", "北角道", 22.290510, 114.196940],
    ["34W", "Fortress Hill", "炮台山", "炮台山", 22.289332, 114.194523],
    ["36W", "Jupiter Street", "木星街", "木星街", 22.286690, 114.192950],
    ["38W", "Lau Li Street", "琉璃街", "琉璃街", 22.284292, 114.192751],
    ["40W", "Lau Sin Street", "留仙街", "留仙街", 22.283000, 114.192390],
    ["42W", "Victoria Park", "維多利亞公園", "维多利亚公园", 22.280686, 114.189642],
    ["44W", "Shelter Street", "信德街", "信德街", 22.279784, 114.188110],
    ["CBT", "Causeway Bay Terminus", "銅鑼灣總站", "铜锣湾总站", 22.279361, 114.187262],
    ["46W", "Pennington Street", "邊寧頓街", "边宁顿街", 22.279530, 114.186499],
    ["48W", "Paterson Street", "百德新街", "百德新街", 22.279818, 114.185590],
    ["105", "Foo Ming Street",  "富明街", "富明街", 22.278700, 114.183232],
    ["106", "Leighton Road", "禮頓道", "礼顿道", 22.277122, 114.182521],
    ["107", "Broadwood Road", "樂活道", "乐活道", 22.274055, 114.183667],
    ["108", "Wong Nai Chung Road", "黃泥涌道", "黄泥涌道", 22.271814, 114.184653],
    ["HVT_K", "Happy Valley Terminus", "跑馬地總站", "跑马地总站", 22.269832, 114.184178],
    ["109", "Hong Kong Cemetery", "香港墳場", "香港坟场", 22.271997, 114.180023],
    ["110", "Queen\'s Road East", "皇后大道東", "皇后大道东", 22.274362, 114.179358],
    ["111", "Morrison Hill Road ", "摩利臣山道", "摩利臣山道", 22.276207, 114.180439],
    ["112", "Tin Lok Lane", "天樂里", "天乐里", 22.278623, 114.179626],
    ["50W", "Canal Road West", "堅拿道西", "坚拿道西", 22.279394, 114.181430],
    ["52W", "Tonnochy Road", "杜老誌道", "杜老志道", 22.278111, 114.177446],
    ["54W", "Burrows Street", "巴路士街", "巴路士街", 22.277364, 114.176102],
    ["56W", "O\'Brien Road", "柯布連道", "柯布连道", 22.276513, 114.173208],
    ["58W", "Swatow Street", "汕頭街", "汕头街", 22.276383, 114.171946],
    ["60W", "Gresson Street", "機利臣街", "机利臣街", 22.277053, 114.170275],
    ["62W", "Arsenal Street", "軍器廠街", "军器厂街", 22.277768, 114.168467],
    ["64W", "Admiralty MTR Station", "金鐘港鐵站", "金钟港铁站", 22.278206, 114.165356],
    ["66W", "Cotton Tree Drive", "紅棉道", "红棉道", 22.279141, 114.163005],
    ["68W", "Bank Street", "銀行街", "银行街", 22.280708, 114.159428],
    ["70W", "Pedder Street", "畢打街", "毕打街", 22.281868, 114.157889],
    ["72W", "Pottinger Street", "砵甸乍街", "砵甸乍街", 22.283558, 114.156511],
    ["74W", "Gilman Street", "機利文街", "机利文街", 22.285293, 114.154852],
    ["76W", "Man Wah Lane", "文華里", "文华里", 22.286298, 114.152929],
    // changed
    ["WMT", "Western Market Terminus", "上環 (西港城) 總站", "上环 (西港城) 总站", 22.286873, 114.150716],
    ["78W", "Macau Ferry Terminal", "港澳碼頭", "港澳码头", 22.287723, 114.150200],
    ["80W", "Connaught Road West", "干諾道西", "干诺道西", 22.288130, 114.148460],
    ["82W", "Sutherland Street", "修打蘭街", "修打兰街", 22.287747, 114.145935],
    ["84W", "Eastern Street", "東邊街", "东边街", 22.287884, 114.143684],
    ["86W", "Western Street", "西邊街", "西边街", 22.287949, 114.140925],
    ["88W", "Water Street", "水街", "水街", 22.287461, 114.138898],
    ["90W", "Whitty Street", "屈地街", "屈地街", 22.286824, 114.136549],
    ["WST", "Shek Tong Tsui Terminus", "石塘咀總站", "石塘咀总站", 22.286932, 114.135105],
    ["92W", "Hill Road", "山道", "山道", 22.287034, 114.134573],
    ["94W", "Whitty Street Depot", "屈地街電車廠", "屈地街电车厂", 22.287451, 114.135170],
    ["96W", "Queen\'s Road West", "皇后大道西", "皇后大道西", 22.286808, 114.132421],
    ["98W", "Kennedy Town Praya", "堅尼地城海傍", "坚尼地城海傍", 22.284660, 114.130731],
    ["100W", "Sands Street", "山市街", "山市街", 22.283723, 114.129562],
    ["102W", "Smithfield", "士美菲路", "士美菲路", 22.283279, 114.128119],
    ["104W", "Davis Street", "爹核士街", "爹核士街", 22.283050, 114.126767],
    ["KTT", "Kennedy Town Terminus", "堅尼地城總站", "坚尼地城总站", 22.282968, 114.126281]
];


function initialize() {
    var _clientH = $(window).height();
    var _clientW = $(window).width();
    var zoomLevel = 14;
    if(_clientW < 1440){
        zoomLevel = 13;
    }

    var mapOptions = {
        center: new google.maps.LatLng(22.274760, 114.179284),  //22.39643, 114.10950
        //disableDefaultUI: true,
        panControlOptions: {
            //position: google.maps.ControlPosition.RIGHT_TOP
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        zoomControlOptions: {
            //style: google.maps.ZoomControlStyle.SMALL,
            //position: google.maps.ControlPosition.RIGHT_TOP
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        zoom: zoomLevel
    };
    //testing use
    //map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    //setMarkers(map, shopArray);

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    /*var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);*/

    mapSetMarkers(map, stopsArrayEB, markersEB, idEB);
    mapSetMarkers(map, stopsArrayWB, markersWB, idWB);
    //mapWB();

    mapSetSearchBox();

    zoomChanged();
    google.maps.event.addListener(map, 'zoom_changed', zoomChanged);
}

function mapMoveTo(){
    //map.setCenter(x, y);
}

function mapGoto(el) {
    var data = $(el).attr("id");
    var stopsAry = [];
    if (data.substring(0,2) == "EB") {
        markersArray = markersEB;
        stopsAry = stopsArrayEB;
    } else {
        markersArray = markersWB;
        stopsAry = stopsArrayWB;
    }
    /*var index = idArray.indexOf(data.substring(3));
    //console.log(idArray.length + " " + markersArray.length + " " + markersArray[index].getTitle());
    mapGotoMarker(markersArray[index]);
    
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);*/
    var temp;
    for(var i=0;i<stopsAry.length;i++){
        if(stopsAry[i][0] == data.substring(3)){
            temp = stopsAry[i];
            break;
        }
    }
    $('#map-canvas').attr('src', 'https://maps.google.com/maps?q='+temp[4]+',%20'+temp[5]+'&t=&z=19&ie=UTF8&iwloc=&output=embed');
}

function mapGotoMarker(marker) {
    //mapShowMarkerInfoWindow(marker);
    //console.log(marker);
    //console.log(marker.getPosition());
    map.setCenter(marker.getPosition());
    map.panTo(map.getCenter());
    map.setZoom(18);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
        if(marker.getAnimation() !== null) {
            marker.setAnimation(null);
        }
    }, 2000);
}

function mapSetMarkers(map, locations, storedArray, idArray){
    var image = {
        url: 'images/googleMap/Map_indication2x.png',
        size: new google.maps.Size(156, 182),
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(35, 83),
        scaledSize: new google.maps.Size(78, 91)
    };
    // Shapes define the clickable region of the icon. The type defines an HTML <area> element 'poly' which traces out a polygon as a series of X,Y points. The final coordinate closes the poly by connecting to the first coordinate.
    var shape = {
        coords: [1, 1, 1, 35, 30, 35, 30 , 1],
        type: 'poly'
    };
    for (var i = 0; i < locations.length; i++) {
        var data = locations[i];
        var myLatLng = new google.maps.LatLng(data[4], data[5]);
        var titleTxt = '';
        
        switch(lang){
            case 'en': titleTxt = data[0] + " " + data[1]; break;
            case 'tc': titleTxt = data[0] + " " + data[2]; break;
            case 'sc': titleTxt = data[0] + " " + data[3]; break;
            default: titleTxt = data[0] + " " + data[1];
        }
        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            icon: image,
            //shape: shape,
            title: titleTxt,
            zIndex: data[6], 
            optimized: false
            //animation: google.maps.Animation.DROP
        });

        google.maps.event.addListener(marker, 'click', function() {
          mapGotoMarker(this);
        });

        //對位用
        /*var marker2 = new google.maps.Marker({
            position: myLatLng,
            map: map
        });*/
        //mapSetMarkersInfoWindow(marker, data[4]);

        storedArray.push(marker);
        idArray.push(data[0]);
    }
}

function mapShowMarkerInfoWindow(marker) {
    if (markersEB.indexOf(marker) != -1) {
        //console.log(markersEB.indexOf(marker));
        markerInfoWindow.setContent('<div class="mapInfoWindow">'+stopsArrayEB[markersEB.indexOf(marker)][1]+'</div>');
    }
    if (markersWB.indexOf(marker) != -1) {
        //console.log(markersWB.indexOf(marker));
        markerInfoWindow.setContent('<div class="mapInfoWindow">'+stopsArrayWB[markersWB.indexOf(marker)][1]+'</div>');
    }
    markerInfoWindow.open(map, marker);
}

function mapSetMarkersInfoWindow(marker, message) {
    var info = message;
    var infoWindow = new google.maps.InfoWindow({
        content: message
    });
    google.maps.event.addListener(marker, 'click', function () {
        infoWindow.open(map, marker);
    });
}

var markersSearch;
function mapSetSearchBox(){
    //https://developers.google.com/maps/documentation/javascript/examples/places-searchbox?hl=zh-tw
    var input = (document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

    var searchBox = new google.maps.places.SearchBox((input));
    //var markers = [];
    markersSearch = [];
    google.maps.event.addListener(searchBox, 'places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length == 0) return;
        /*for (var i = 0, marker; marker = markers[i]; i++) {
            marker.setMap(null);
        }*/
        setAllMap(null, markersSearch);

        // For each place, get the icon, place name, and location.
        markersSearch = [];
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0, place; place = places[i]; i++) {
            var image = {
                //url: place.icon,
                url: 'images/googleMap/googleMapIcon2.png',
                size: new google.maps.Size(51, 57),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(11, 31),
                scaledSize: new google.maps.Size(51, 57)
            };

            // Create a marker for each place.
            var marker = new google.maps.Marker({
                map: map,
                icon: image,
                title: place.name,
                position: place.geometry.location
            });

            //markers.push(marker);
            markersSearch.push(marker);
            bounds.extend(place.geometry.location);
        }

        map.fitBounds(bounds);
        map.setZoom(17);
    });
    // Bias the SearchBox results towards places that are within the bounds of the
    // current map's viewport.
    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        searchBox.setBounds(bounds);
    });
}

function mapResize() {
    //disable google map@2021-02-25
    /*var center = map.getCenter();
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);*/
}

function zoomChanged() {
    //console.log(map.getZoom());

    for (j=0;j<2;j++) {
        if (j==0) {
          markersArray = markersEB;
        } else {
          markersArray = markersWB;
        }
        for (i=0;i<markersArray.length;i++) {
            var image = markersArray[i].getIcon();
            if (map.getZoom() < 16) {
              /*if (map.getZoom() < 14) {
                image.url = 'images/googleMap/measle.png';
                image.size = new google.maps.Size(7, 7);
                image.scaledSize = new google.maps.Size(7, 7);
                image.anchor = new google.maps.Point(3.5, 3.5);
              } else {*/
                image.url = 'images/googleMap/Map_indication2x.png';
                image.size = new google.maps.Size(156, 182);
                image.scaledSize = new google.maps.Size(39, 46);
                image.anchor = new google.maps.Point(18, 42);
              //}
            } else {
              image.url = 'images/googleMap/Map_indication2x.png';
              image.size = new google.maps.Size(156, 182);
              image.scaledSize = new google.maps.Size(78, 91);
              image.anchor = new google.maps.Point(35, 83);
            }

            markersArray[i].setIcon(image);
        }
    }
}

function setAllMap(map,markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function expandFlap(e){
    if ($('#overlay').hasClass("expand")) {
        $('#overlay').removeClass("expand");
        $('#collapseTip').show();
        $('#extendTip').hide();
        TweenMax.to($('#overlay'),0.3,{'left':'-455px'});
        TweenMax.to($('#leftContent'),0.3,{'width':'51px',onUpdate:mapResize});
        TweenMax.to($('#flap'),0.3,{'marginLeft':'15px'});
        TweenMax.to($('#flapHit'),0.3,{'marginLeft':'0px','width':'55px',});
    } else {
        $('#overlay').addClass("expand");
        $('#collapseTip').hide();
        $('#extendTip').show();
        TweenMax.to($('#overlay'),0.3,{'left':'30px'});
        TweenMax.to($('#leftContent'),0.3,{'width':'503px',onUpdate:mapResize});
        TweenMax.to($('#flap'),0.3,{'marginLeft':'0px'});
        TweenMax.to($('#flapHit'),0.3,{'marginLeft':'18px','width':'37px',});
    }
}

function mapEB() {
    //$("#routeMapImageWB").css("display","none");
    //$("#routeMapImageEB").css("display","inline-block");
    $("#scroll-paneWB").css("display","none");
    $("#scroll-paneEB").css("display","inline-block");
    $("#btnArrow").css("left","235px");
    $("#routeMapBtn .btn").removeClass("selected").eq(1).addClass("selected");
    setAllMap(null,markersWB);
    setAllMap(map,markersEB);
    idArray = idEB;
    resetScroll();
}

function mapWB() {
    //$("#routeMapImageEB").css("display","none");
    //$("#routeMapImageWB").css("display","inline-block");
    $("#scroll-paneEB").css("display","none");
    $("#scroll-paneWB").css("display","inline-block");
    $("#btnArrow").css("left","0px");
    $("#routeMapBtn .btn").removeClass("selected").eq(0).addClass("selected");
    setAllMap(null,markersEB);
    setAllMap(map,markersWB);
    idArray = idWB;
    resetScroll();
}

//google.maps.event.addDomListener(window, 'load', initialize);
//google.maps.event.addDomListener(window, "resize", mapResize);  //disable google map@2021-02-25
