var all_station_row_count = 141;	// All station + 1;
var hk_station_row_count = 139;		// Last Hong Kong station + 1
var hk_station_wo_AEL_row_count = 129;
//Updated by kailey 2014/7/29
disableStationIds = "";

myValue0 = ""; caption0 = "-- Island Line --"; style0 = "background-color:#999999;color:#FFFFFF";
myValue1 = "83"; caption1 = "Kennedy Town"; lineValue1 = "isline";
myValue2 = "82"; caption2 = "HKU"; lineValue2 = "isline";
myValue3 = "81"; caption3 = "Sai Ying Pun"; lineValue3 = "isline";
myValue4 = "26"; caption4 = "Sheung Wan"; lineValue4 = "isline";
myValue5 = "1"; caption5 = "Central"; lineValue5 = "isline";
myValue6 = "2"; caption6 = "Admiralty"; lineValue6 = "isline";
myValue7 = "27"; caption7 = "Wan Chai"; lineValue7 = "isline";
myValue8 = "28"; caption8 = "Causeway Bay"; lineValue8 = "isline";
myValue9 = "29"; caption9 = "Tin Hau"; lineValue9 = "isline";
myValue10 = "30"; caption10 = "Fortress Hill"; lineValue10 = "isline";
myValue11 = "31"; caption11 = "North Point"; lineValue11 = "isline";
myValue12 = "32"; caption12 = "Quarry Bay"; lineValue12 = "isline";
myValue13 = "33"; caption13 = "Tai Koo"; lineValue13 = "isline";
myValue14 = "34"; caption14 = "Sai Wan Ho"; lineValue14 = "isline";
myValue15 = "35"; caption15 = "Shau Kei Wan"; lineValue15 = "isline";
myValue16 = "36"; caption16 = "Heng Fa Chuen"; lineValue16 = "isline";
myValue17 = "37"; caption17 = "Chai Wan"; lineValue17 = "isline";
myValue18 = ""; caption18 = "";

myValue19 = ""; caption19 = "-- South Island Line --"; style19 = "background-color:#999999;color:#FFFFFF";
myValue20 = "2"; caption20 = "Admiralty"; lineValue20 = "siline";
myValue21 = "86"; caption21 = "Ocean Park"; lineValue21 = "siline";
myValue22 = "87"; caption22 = "Wong Chuk Hang"; lineValue22 = "siline";
myValue23 = "88"; caption23 = "Lei Tung"; lineValue23 = "siline";
myValue24 = "89"; caption24 = "South Horizons"; lineValue24 = "siline";
myValue25 = ""; caption25 = "";

myValue26 = ""; caption26 = "-- Kwun Tong Line --"; style26 = "background-color:#999999;color:#FFFFFF";
myValue27 = "85"; caption27 = "Whampoa"; lineValue27 = "ktline";
myValue28 = "84"; caption28 = "Ho Man Tin"; lineValue28 = "ktline";
myValue29 = "5"; caption29 = "Yau Ma Tei"; lineValue29 = "ktline";
myValue30 = "6"; caption30 = "Mong Kok"; lineValue30 = "ktline";
myValue31 = "16"; caption31 = "Prince Edward"; lineValue31 = "ktline";
myValue32 = "7"; caption32 = "Shek Kip Mei"; lineValue32 = "ktline";
myValue33 = "8"; caption33 = "Kowloon Tong"; lineValue33 = "ktline";
myValue34 = "9"; caption34 = "Lok Fu"; lineValue34 = "ktline";
myValue35 = "10"; caption35 = "Wong Tai Sin"; lineValue35 = "ktline";
myValue36 = "11"; caption36 = "Diamond Hill"; lineValue36 = "ktline";
myValue37 = "12"; caption37 = "Choi Hung"; lineValue37 = "ktline";
myValue38 = "13"; caption38 = "Kowloon Bay"; lineValue38 = "ktline";
myValue39 = "14"; caption39 = "Ngau Tau Kok"; lineValue39 = "ktline";
myValue40 = "15"; caption40 = "Kwun Tong"; lineValue40 = "ktline";
myValue41 = "38"; caption41 = "Lam Tin"; lineValue41 = "ktline";
myValue42 = "48"; caption42 = "Yau Tong"; lineValue42 = "ktline";
myValue43 = "49"; caption43 = "Tiu Keng Leng"; lineValue43 = "ktline";
myValue44 = ""; caption44 = "";

myValue45 = ""; caption45 = "-- Tsuen Wan Line --"; style45 = "background-color:#999999;color:#FFFFFF";
myValue46 = "1"; caption46 = "Central"; lineValue46 = "twline";
myValue47 = "2"; caption47 = "Admiralty"; lineValue47 = "twline";
myValue48 = "3"; caption48 = "Tsim Sha Tsui"; lineValue48 = "twline";
myValue49 = "4"; caption49 = "Jordan"; lineValue49 = "twline";
myValue50 = "5"; caption50 = "Yau Ma Tei"; lineValue50 = "twline";
myValue51 = "6"; caption51 = "Mong Kok"; lineValue51 = "twline";
myValue52 = "16"; caption52 = "Prince Edward"; lineValue52 = "twline";
myValue53 = "17"; caption53 = "Sham Shui Po"; lineValue53 = "twline";
myValue54 = "18"; caption54 = "Cheung Sha Wan"; lineValue54 = "twline";
myValue55 = "19"; caption55 = "Lai Chi Kok"; lineValue55 = "twline";
myValue56 = "20"; caption56 = "Mei Foo"; lineValue56 = "twline";
myValue57 = "21"; caption57 = "Lai King"; lineValue57 = "twline";

myValue58 = "22"; caption58 = "Kwai Fong"; lineValue58 = "twline";
myValue59 = "23"; caption59 = "Kwai Hing"; lineValue59 = "twline";
myValue60 = "24"; caption60 = "Tai Wo Hau"; lineValue60 = "twline";
myValue61 = "25"; caption61 = "Tsuen Wan"; lineValue61 = "twline";
myValue62 = ""; caption62 = "";

myValue63 = ""; caption63 = "-- Tseung Kwan O Line --"; style63 = "background-color:#999999;color:#FFFFFF";
myValue64 = "31"; caption64 = "North Point"; lineValue64 = "tkline";
myValue65 = "32"; caption65 = "Quarry Bay"; lineValue65 = "tkline";
myValue66 = "48"; caption66 = "Yau Tong"; lineValue66 = "tkline";
myValue67 = "49"; caption67 = "Tiu Keng Leng"; lineValue67 = "tkline";
myValue68 = "50"; caption68 = "Tseung Kwan O"; lineValue68 = "tkline";
myValue69 = "51"; caption69 = "Hang Hau"; lineValue69 = "tkline";
myValue70 = "52"; caption70 = "Po Lam"; lineValue70 = "tkline";
myValue71 = "57"; caption71 = "LOHAS Park"; lineValue71 = "tkline";
myValue72 = ""; caption72 = "";

myValue73 = ""; caption73 = "-- Tung Chung Line & Disneyland Resort Line --"; style73 = "background-color:#999999;color:#FFFFFF";
myValue74 = ""; caption74 = "";
myValue75 = "39"; caption75 = "Hong Kong"; lineValue75 = "tcline";
myValue76 = "40"; caption76 = "Kowloon"; lineValue76 = "tcline";
myValue77 = "41"; caption77 = "Olympic"; lineValue77 = "tcline";
myValue78 = "53"; caption78 = "Nam Cheong"; lineValue78 = "tcline";
myValue79 = "21"; caption79 = "Lai King"; lineValue79 = "tcline";
myValue80 = "42"; caption80 = "Tsing Yi"; lineValue80 = "tcline";
myValue81 = "43"; caption81 = "Tung Chung"; lineValue81 = "tcline";
myValue82 = "54"; caption82 = "Sunny Bay"; lineValue82 = "tcline,drline";
myValue83 = "55"; caption83 = "Disneyland Resort"; lineValue83 = "drline";
myValue84 = ""; caption84 = "";
myValue85 = ""; caption85 = ""; style85 = "display: none";

myValue86 = ""; caption86 = "-- East Rail Line --"; style86 = "background-color:#999999;color:#FFFFFF";
myValue87 = "2"; caption87 = "Admiralty"; lineValue87 = "erline";
myValue88 = "94"; caption88 = "Exhibition Centre"; lineValue88 = "erline";
myValue89 = "64"; caption89 = "Hung Hom"; lineValue89 = "erline";
myValue90 = "65"; caption90 = "Mong Kok East"; lineValue90 = "erline";
myValue91 = "8"; caption91 = "Kowloon Tong"; lineValue91 = "erline";
myValue92 = "67"; caption92 = "Tai Wai"; lineValue92 = "erline";
myValue93 = "68"; caption93 = "Sha Tin"; lineValue93 = "erline";
myValue94 = "69"; caption94 = "Fo Tan"; lineValue94 = "erline";
myValue95 = "70"; caption95 = "Racecourse"; lineValue95 = "erline";
myValue96 = "71"; caption96 = "University"; lineValue96 = "erline";
myValue97 = "72"; caption97 = "Tai Po Market"; lineValue97 = "erline";
myValue98 = "73"; caption98 = "Tai Wo"; lineValue98 = "erline";
myValue99 = "74"; caption99 = "Fanling"; lineValue99 = "erline";
myValue100 = "75"; caption100 = "Sheung Shui"; lineValue100 = "erline";
myValue101 = "78"; caption101 = "Lok Ma Chau"; lineValue101 = "erline";
myValue102 = "76"; caption102 = "Lo Wu"; lineValue102 = "erline";
myValue103 = ""; caption103 = "";

//myValue102 = ""; caption102 = "-- Tuen Ma Line Phase 1 --"; style102 = "background-color:#999999;color:#FFFFFF";
myValue104 = ""; caption104 = "-- Tuen Ma Line --"; style104 = "background-color:#999999;color:#FFFFFF";
myValue105 = "103"; caption105 = "Wu Kai Sha"; lineValue105 = "tmline";
myValue106 = "102"; caption106 = "Ma On Shan"; lineValue106 = "tmline";
myValue107 = "101"; caption107 = "Heng On"; lineValue107 = "tmline";
myValue108 = "100"; caption108 = "Tai Shui Hang"; lineValue108 = "tmline";
myValue109 = "99"; caption109 = "Shek Mun"; lineValue109 = "tmline";
myValue110 = "98"; caption110 = "City One"; lineValue110 = "tmline";
myValue111 = "97"; caption111 = "Sha Tin Wai"; lineValue111 = "tmline";
myValue112 = "96"; caption112 = "Che Kung Temple"; lineValue112 = "tmline";
myValue113 = "67"; caption113 = "Tai Wai"; lineValue113 = "tmline";
myValue114 = "90"; caption114 = "Hin Keng"; lineValue114 = "tmline";
myValue115 = "11"; caption115 = "Diamond Hill"; lineValue115 = "tmline";
myValue116 = "91"; caption116 = "Kai Tak"; lineValue116 = "tmline";
myValue117 = "92"; caption117 = "Sung Wong Toi"; lineValue117 = "tmline";
myValue118 = "93"; caption118 = "To Kwa Wan"; lineValue118 = "tmline";
myValue119 = "84"; caption119 = "Ho Man Tin"; lineValue119 = "tmline";
//myValue115 = ""; caption115 = "";

//myValue116 = ""; caption116 = "-- West Rail Line --"; style116 = "background-color:#999999;color:#FFFFFF";
myValue120 = "64"; caption120 = "Hung Hom"; lineValue120 = "tmline";
myValue121 = "80"; caption121 = "East Tsim Sha Tsui"; lineValue121 = "tmline";
myValue122 = "111"; caption122 = "Austin"; lineValue122 = "tmline";
myValue123 = "53"; caption123 = "Nam Cheong"; lineValue123 = "tmline";
myValue124 = "20"; caption124 = "Mei Foo"; lineValue124 = "tmline";
myValue125 = "114"; caption125 = "Tsuen Wan West"; lineValue125 = "tmline";
myValue126 = "115"; caption126 = "Kam Sheung Road"; lineValue126 = "tmline";
myValue127 = "116"; caption127 = "Yuen Long"; lineValue127 = "tmline";
myValue128 = "117"; caption128 = "Long Ping"; lineValue128 = "tmline";
myValue129 = "118"; caption129 = "Tin Shui Wai"; lineValue129 = "tmline";
myValue130 = "119"; caption130 = "Siu Hong"; lineValue130 = "tmline";
myValue131 = "120"; caption131 = "Tuen Mun"; lineValue131 = "tmline";
myValue132 = ""; caption132 = "";

myValue133 = ""; caption133 = "-- Airport Express --"; style133 = "background-color:#999999;color:#FFFFFF";
myValue134 = "44"; caption134 = "Hong Kong"; lineValue134 = "aeline";
myValue135 = "45"; caption135 = "Kowloon"; lineValue135 = "aeline";
myValue136 = "46"; caption136 = "Tsing Yi"; lineValue136 = "aeline";
myValue137 = "47"; caption137 = "Airport"; lineValue137 = "aeline";
myValue138 = "56"; caption138 = "AsiaWorld-Expo"; lineValue138 = "aeline";
myValue139 = ""; caption139 = "";

myValue140 = ""; caption140 = "-- High Speed Rail --"; style140 = "background-color:#999999;color:#FFFFFF";
myValue141 = "888"; caption141 = "Hong Kong West Kowloon"; lineValue141 = "hsrline";
// myValue136 = ""; caption136 = "";

// myValue137 = ""; caption137 = "-- Shenzhen Line 1 --"; style137 = "background-color:#999999;color:#FFFFFF";
// myValue138 = "516"; caption138 = "Luohu"; lineValue138 = "line1";
// myValue139 = "517"; caption139 = "Guomao"; lineValue139 = "line1";
// myValue140 = "518"; caption140 = "Laojie"; lineValue140 = "line1";
// myValue141 = "519"; caption141 = "Grand Theater"; lineValue141 = "line1";
// myValue142 = "520"; caption142 = "Science Museum"; lineValue142 = "line1";
// myValue143 = "521"; caption143 = "Huaqiang Rd"; lineValue143 = "line1";
// myValue144 = "522"; caption144 = "Gangxia"; lineValue144 = "line1";
// myValue145 = "503"; caption145 = "Convention & Exhibition Center"; lineValue145 = "line1";

// myValue146 = "523"; caption146 = "Shopping Park"; lineValue146 = "line1";
// myValue147 = "524"; caption147 = "Xiangmihu"; lineValue147 = "line1";
// myValue148 = "525"; caption148 = "Chegongmiao"; lineValue148 = "line1";
// myValue149 = "526"; caption149 = "Zhuzilin"; lineValue149 = "line1";
// myValue150 = "527"; caption150 = "Qiaocheng East"; lineValue150 = "line1";
// myValue151 = "528"; caption151 = "OCT"; lineValue151 = "line1";
// myValue152 = "529"; caption152 = "Window of the World"; lineValue152 = "line1";
// myValue153 = "530"; caption153 = "Baishizhou"; lineValue153 = "line1";
// myValue154 = "531"; caption154 = "Hi-Tech Park"; lineValue154 = "line1";
// myValue155 = "532"; caption155 = "Shenzhen University"; lineValue155 = "line1";
// myValue156 = "533"; caption156 = "Taoyuan"; lineValue156 = "line1";
// myValue157 = "534"; caption157 = "Daxin"; lineValue157 = "line1";
// myValue158 = "535"; caption158 = "Liyumen"; lineValue158 = "line1";
// myValue159 = "536"; caption159 = "Qianhaiwan"; lineValue159 = "line1";
// myValue160 = "537"; caption160 = "Xinan"; lineValue160 = "line1";
// myValue161 = "538"; caption161 = "Bao'an Center"; lineValue161 = "line1";
// myValue162 = "539"; caption162 = "Bao'an Stadium"; lineValue162 = "line1";
// myValue163 = "540"; caption163 = "Pingzhou"; lineValue163 = "line1";
// myValue164 = "541"; caption164 = "Xixiang"; lineValue164 = "line1";
// myValue165 = "542"; caption165 = "Gushu"; lineValue165 = "line1";
// myValue166 = "543"; caption166 = "Hourui"; lineValue166 = "line1";
// myValue167 = "544"; caption167 = "Airport East"; lineValue167 = "line1";
// myValue168 = ""; caption168 = "";

// myValue169 = ""; caption169 = "-- Shenzhen Line 2 --"; style169 = "background-color:#999999;color:#FFFFFF";
// myValue170 = "545"; caption170 = "Chiwan"; lineValue170 = "line2";
// myValue171 = "546"; caption171 = "Shekou Port"; lineValue171 = "line2";
// myValue172 = "547"; caption172 = "Sea World"; lineValue172 = "line2";
// myValue173 = "548"; caption173 = "Shuiwan"; lineValue173 = "line2";
// myValue174 = "549"; caption174 = "Dongjiaotou"; lineValue174 = "line2";
// myValue175 = "550"; caption175 = "Wanxia"; lineValue175 = "line2";
// myValue176 = "551"; caption176 = "Haiyue"; lineValue176 = "line2";
// myValue177 = "552"; caption177 = "Dengliang"; lineValue177 = "line2";
// myValue178 = "553"; caption178 = "Houhai"; lineValue178 = "line2";
// myValue179 = "554"; caption179 = "Keyuan"; lineValue179 = "line2";
// myValue180 = "555"; caption180 = "Hongshuwan"; lineValue180 = "line2";
// myValue181 = "529"; caption181 = "Window of the World"; lineValue181 = "line2";
// myValue182 = "556"; caption182 = "Qiaocheng North"; lineValue182 = "line2";
// myValue183 = "557"; caption183 = "Shenkang"; lineValue183 = "line2";
// myValue184 = "558"; caption184 = "Antuo Hill"; lineValue184 = "line2";
// myValue185 = "559"; caption185 = "Qiaoxiang"; lineValue185 = "line2";
// myValue186 = "560"; caption186 = "Xiangmi"; lineValue186 = "line2";
// myValue187 = "561"; caption187 = "Xiangmei North"; lineValue187 = "line2";
// myValue188 = "562"; caption188 = "Jingtian"; lineValue188 = "line2";
// myValue189 = "563"; caption189 = "Lianhua West"; lineValue189 = "line2";
// myValue190 = "564"; caption190 = "Futian"; lineValue190 = "line2";
// myValue191 = "504"; caption191 = "Civic Center"; lineValue191 = "line2";
// myValue192 = "565"; caption192 = "Gangxia North"; lineValue192 = "line2";
// myValue193 = "566"; caption193 = "Huaqiang North"; lineValue193 = "line2";
// myValue194 = "567"; caption194 = "Yannan"; lineValue194 = "line2";
// myValue195 = "519"; caption195 = "Grand Theater"; lineValue195 = "line2";
// myValue196 = "568"; caption196 = "Hubei"; lineValue196 = "line2";
// myValue197 = "569"; caption197 = "Huangbeiling"; lineValue197 = "line2";
// myValue198 = "570"; caption198 = "Xinxiu"; lineValue198 = "line2";
// myValue199 = ""; caption199 = "";

// myValue200 = ""; caption200 = "-- Shenzhen Line 3 --"; style200 = "background-color:#999999;color:#FFFFFF";
// myValue201 = "571"; caption201 = "Yitian"; lineValue201 = "line3";
// myValue202 = "572"; caption202 = "Shixia"; lineValue202 = "line3";
// myValue203 = "523"; caption203 = "Shopping Park"; lineValue203 = "line3";
// myValue204 = "564"; caption204 = "Futian"; lineValue204 = "line3";
// myValue205 = "505"; caption205 = "Children's Palace"; lineValue205= "line3";
// myValue206 = "573"; caption206 = "Lianhuacun"; lineValue206 = "line3";
// myValue207 = "574"; caption207 = "Huaxin"; lineValue207 = "line3";
// myValue208 = "575"; caption208 = "Tongxinling"; lineValue208 = "line3";
// myValue209 = "576"; caption209 = "Hongling"; lineValue209 = "line3";
// myValue210 = "518"; caption210 = "Laojie"; lineValue210 = "line3";
// myValue211 = "577"; caption211 = "Shaibu"; lineValue211 = "line3";
// myValue212 = "578"; caption212 = "Cuizhu"; lineValue212 = "line3";
// myValue213 = "579"; caption213 = "Tianbei"; lineValue213 = "line3";
// myValue214 = "580"; caption214 = "Shuibei"; lineValue214 = "line3";
// myValue215 = "581"; caption215 = "Caopu"; lineValue215 = "line3";
// myValue216 = "582"; caption216 = "Buji"; lineValue216 = "line3";
// myValue217 = "583"; caption217 = "Mumianwan"; lineValue217 = "line3";
// myValue218 = "584"; caption218 = "Dafen"; lineValue218 = "line3";
// myValue219 = "585"; caption219 = "Danzhutou"; lineValue219 = "line3";
// myValue220 = "586"; caption220 = "Liuyue"; lineValue220 = "line3";
// myValue221 = "587"; caption221 = "Tangkeng"; lineValue221 = "line3";
// myValue222 = "588"; caption222 = "Henggang"; lineValue222 = "line3";
// myValue223 = "589"; caption223 = "Yonghu"; lineValue223 = "line3";
// myValue224 = "590"; caption224 = "He'ao"; lineValue224 = "line3";
// myValue225 = "591"; caption225 = "Universiade"; lineValue225 = "line3";
// myValue226 = "592"; caption226 = "Ailian"; lineValue226 = "line3";
// myValue227 = "593"; caption227 = "Jixiang"; lineValue227 = "line3";
// myValue228 = "594"; caption228 = "Longcheng Square"; lineValue228 = "line3";
// myValue229 = "595"; caption229 = "Nanlian"; lineValue229 = "line3";
// myValue230 = "596"; caption230 = "Shuanglong"; lineValue230 = "line3";
// myValue231 = ""; caption231 = "";

// myValue232 = ""; caption232 = "-- Shenzhen Line 4 --"; style232 = "background-color:#999999;color:#FFFFFF";
// myValue233 = "501"; caption233 = "Futian Checkpoint"; lineValue233 = "line4";
// myValue234 = "502"; caption234 = "Fumin"; lineValue234 = "line4";
// myValue235 = "503"; caption235 = "Convention & Exhibition Center"; lineValue235 = "line4";
// myValue236 = "504"; caption236 = "Civic Center"; lineValue236 = "line4";
// myValue237 = "505"; caption237 = "Children's Palace"; lineValue237 = "line4";
// myValue238 = "506"; caption238 = "Lianhua North"; lineValue238 = "line4";
// myValue239 = "507"; caption239 = "Shangmeilin"; lineValue239 = "line4";
// myValue240 = "508"; caption240 = "Minle"; lineValue240 = "line4";
// myValue241 = "509"; caption241 = "Baishilong"; lineValue241 = "line4";
// myValue242 = "510"; caption242 = "Shenzhen North Station"; lineValue242 = "line4";
// myValue243 = "511"; caption243 = "Hongshan"; lineValue243 = "line4";
// myValue244 = "512"; caption244 = "Shangtang"; lineValue244 = "line4";
// myValue245 = "513"; caption245 = "Longsheng"; lineValue245 = "line4";
// myValue246 = "514"; caption246 = "Longhua"; lineValue246 = "line4";
// myValue247 = "515"; caption247 = "Qinghu"; lineValue247 = "line4";
// myValue248 = ""; caption248 = "";

// myValue249 = ""; caption249 = "-- Shenzhen Line 5 --"; style249 = "background-color:#999999;color:#FFFFFF";
// myValue250 = "597"; caption250 = "Linhai"; lineValue250 = "line5";
// myValue251 = "598"; caption251 = "Baohua"; lineValue251 = "line5";
// myValue252 = "538"; caption252 = "Bao'an Center"; lineValue252 = "line5";
// myValue253 = "599"; caption253 = "Fanshen"; lineValue253 = "line5";
// myValue254 = "600"; caption254 = "Lingzhi"; lineValue254 = "line5";
// myValue255 = "601"; caption255 = "Honglang North"; lineValue255 = "line5";
// myValue256 = "602"; caption256 = "Xingdong"; lineValue256 = "line5";
// myValue257 = "603"; caption257 = "Liuxiandong"; lineValue257 = "line5";
// myValue258 = "604"; caption258 = "Xili"; lineValue258 = "line5";
// myValue259 = "605"; caption259 = "University Town"; lineValue259 = "line5";
// myValue260 = "606"; caption260 = "Tanglang"; lineValue260 = "line5";
// myValue261 = "607"; caption261 = "Changlingpi"; lineValue261 = "line5";
// myValue262 = "510"; caption262 = "Shenzhen North Station"; lineValue262 = "line5";
// myValue263 = "608"; caption263 = "Minzhi"; lineValue263 = "line5";
// myValue264 = "609"; caption264 = "Wuhe"; lineValue264 = "line5";
// myValue265 = "610"; caption265 = "Bantian"; lineValue265 = "line5";
// myValue266 = "611"; caption266 = "Yangmei"; lineValue266 = "line5";
// myValue267 = "612"; caption267 = "Shangshuijing"; lineValue267 = "line5";
// myValue268 = "613"; caption268 = "Xiashuijing"; lineValue268 = "line5";
// myValue269 = "614"; caption269 = "Changlong"; lineValue269 = "line5";
// myValue270 = "582"; caption270 = "Buji"; lineValue270 = "line5";
// myValue271 = "615"; caption271 = "Baigelong"; lineValue271 = "line5";
// myValue272 = "616"; caption272 = "Buxin"; lineValue272 = "line5";
// myValue273 = "617"; caption273 = "Tai'an"; lineValue273 = "line5";
// myValue274 = "618"; caption274 = "Yijing"; lineValue274 = "line5";
// myValue275 = "569"; caption275 = "Huangbeiling"; lineValue275 = "line5";

var myValueArr = new Array();
var captionArr = new Array();
var lineValueArr = new Array();
//Old Station
//var styleArr = new Array("style0","style19","style36","style54","style64","style77","style93","style104","style118","style125","style157","style188","style220","style237");
//var styleArr = new Array("style0","style19","style26","style45","style63","style73","style86","style102","style113","style127","style134","style166","style197","style229","style246");
//var styleArr = new Array("style0","style19","style26","style45","style63","style73","style86","style102","style113","style127","style134","style137","style169","style200","style232","style249");
//var styleArr = new Array("style0","style19","style26","style45","style63","style73","style86","style102","style116","style130","style137");
var styleArr = new Array("style0","style19","style26","style45","style63","style73","style86","style104","style133","style140");
//var hr_byStationMyValueArr = new Array('2','592','47','544','558','56','111','615','509','530','610','538','539','598','582','616','581','28','1','37','607','614','96','525','18','505','545','12','98','504','503','578','584','585','534','552','11','55','549','80','74','599','69','30','502','501','564','522','565','519','517','542','551','51','590','36','101','588','531','82','84','39','601','576','511','555','553','543','569','566','521','574','568','64','888','562','593','4','115','81','554','40','13','8','22','23','15','19','21','38','518','88','506','563','573','600','597','603','586','535','76','57','9','78','117','594','514','513','516','102','20','508','608','65','6','583','53','595','14','31','86','528','41','540','52','16','536','527','556','559','515','32','70','34','83','520','547','68','97','577','17','507','612','512','35','7','99','546','557','510','532','75','26','572','523','596','580','548','119','89','54','72','100','67','73','24','617','33','587','606','533','579','29','118','49','575','50','3','42','25','114','120','43','591','71','605','27','550','85','529','87','10','103','609','561','560','524','613','604','537','602','570','541','611','567','5','48','618','571','589','116','526');var hr_byStationMyValueArr = new Array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,47,48,49,50,51,52,53,54,55,56,57,64,65,67,68,69,70,71,72,73,74,75,76,78,80,81,82,83,84,85,86,87,88,89,96,97,98,99,100,101,102,103,111,114,115,116,117,118,119,120);
var hr_byStationMyValueArr = new Array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,47,48,49,50,51,52,53,54,55,56,57,64,65,67,68,69,70,71,72,73,74,75,76,78,80,81,82,83,84,85,86,87,88,89,90,91,92,93,95,96,97,98,99,100,101,102,103,111,114,115,116,117,118,119,120,888);
// var filterValueArr = [0,19,36,37,38,41,42,43,54,55,56,57,58,64,65,70,77,80,93,94,104,105,108,109,118,119,121,120,125,157,183,188,191,192,198,220,224,237,258,263];
//var filterValueArr = [0,19,20,26,45,46,47,50,51,52,63,64,65,66,67,73,74,79,86,89,102,103,113,114,117,118,127,128,129,130,134,166,192,197,200,201,207,229,233,246,267,272];
// var filterValueArr = [0,19,20,26,45,46,47,50,51,52,63,64,65,66,67,73,74,79,86,89,102,103,113,114,117,118,127,128,129,130,134,137,166,192,197,200,201,207,229,233,246,267,272];
//var filterValueArr = [0,19,20,26,45,46,47,50,51,52,63,64,65,66,67,73,74,79,86,89,102,111,113,116,117,120,121,130,131,132,133,137];
var filterValueArr = [0,19,20,26,45,46,47,50,51,52,63,64,65,66,67,73,74,79,86,89,102,111,113,116,117,121,130,131,132,133,137];

//------ For Service Hours (service_hours_search.php) - 20 June, 2016 -----
var lineMapping = {
	"EAL" : "East Rail Line",
	"KTL" : "Kwun Tong Line",
	"TWL" : "Tsuen Wan Line",
	"ISL" : "Island Line",
	"TCL" : "Tung Chung Line",
	"AEL" : "Airport Express",
	"TKL" : "Tseung Kwan O Line",
	//"TML" : "Tuen Ma Line Phase 1",
	"TML" : "Tuen Ma Line",
	"WRL" : "West Rail Line",
	"DRL" : "Disneyland Resort Line",
	"SIL" : "South Island Line",
	"HSR" : "High Speed Rail"
};
//------ For Service Hours (service_hours_search.php) - 20 June, 2016 (End) -----

$lang = detect_lang();

for (var i = 0; i < all_station_row_count; i++) {
	var myValue = eval('myValue' + i);
	var caption = eval('caption' + i);
	if(myValue!=""){
		myValueArr.push(myValue);
		captionArr.push(caption);
		lineValueArr.push(eval('lineValue' + i));
	}else {
		myValueArr.push(myValue);
		captionArr.push(caption);
		lineValueArr.push("");
	}
}

function searchByInterchange(interId){
	var interName="";
	for (var i = 0; i < all_station_row_count; i++) {
		var caption = captionArr[i];
		if (caption != "" ){
			var myValue = myValueArr[i];
			if ($.inArray(myValue, interId)>=0 && (myValue == "42" || myValue == "46" || myValue == "39" || myValue == "1" || myValue == "44")){
				interName = caption;
				break;
			}
		}
	}
	return interName;
}
function mapStationLine(stationId){
	var lineName="";
	for (var i = 0; i < all_station_row_count; i++) {
		var myValue = myValueArr[i];
		var caption = captionArr[i];
		if (caption != "" && myValue != ""){
			if (myValue == stationId){
				lineName += lineName==""? lineValueArr[i] : "," + lineValueArr[i];
				if(lineName.split(",").length>1){
					break;
				}
			}
		}
	}
	return lineName;
}

function mapStationName(stationId){
	var stationName="";
	for (var i = 0; i < all_station_row_count; i++) {
		var myValue = myValueArr[i];
		var caption = captionArr[i];
		if (caption != "" && myValue != "" ){
			if (myValue == stationId){
				stationName = caption;
				break;
			}
		}
	}
	return stationName;
}

function mapStationOption(stationId){
	var stationOption="";
	for (var i = 0; i < all_station_row_count; i++) {

		var myValue = myValueArr[i];
		if (myValue != "" ){
			if (myValue == stationId){
				stationOption = i;
				break;
			}
		}
	}
	return stationOption;
}

function setFrmstation(stationId){
	$('#stationCombo_from').val(stationId);
	$("#stationfs_ID").val( mapStationName(stationId) );
	$("#hideFromId").val(stationId);
};
	
function setTostation(stationId){
	$('#stationCombo_to').val(stationId);
	$("#stationto_ID").val( mapStationName(stationId) );
	$("#hideToId").val(stationId);
};

// Ticket Suggestion Phase 1
function mapLineNameWithLineCode(lineCode){
	var lineName = "";
	switch(lineCode){
		case "erline":
			lineName = $lang=="C"? "東鐵&#32171;" : "East Rail Line";
			break;
		case "ktline":
			lineName = $lang=="C"? "觀塘&#32171;" : "Kwun Tong Line";
			break;
		case "siline":
			lineName = $lang=="C"? "南港島&#32171;" : "South Island Line";
			break;
		case "isline":
			lineName = $lang=="C"? "港島&#32171;" : "Island Line";
			break;
		case  "twline":
			lineName = $lang=="C"? "荃灣&#32171;" : "Tsuen Wan Line";
			break;
		case "tkline":
			lineName = $lang=="C"? "將軍澳&#32171;" : "Tseung Kwan O Line";
			break;
		case "tcline":
			lineName = $lang=="C"? "東涌&#32171;" : "Tung Chung Line";
			break;
		case "drline":
			lineName = $lang=="C"? "迪士尼&#32171;" : "Disneyland Resort Line";
			break;
		case "tcline,drline":
			lineName = $lang=="C"? "東涌&#32171;及迪士尼&#32171;" : "Tung Chung Line & Disneyland Resort Line";
			break;
		case "moline":
			lineName = $lang=="C"? "馬鞍山&#32171;" : "Ma On Shan Line";
			break;
		case "wrline":
			lineName = $lang=="C"? "西鐵&#32171;" : "West Rail Line";
			break;
		case "tmline":
			lineName = $lang=="C"? "屯馬&#32171;" : "Tuen Ma Line";
			break;
		case "aeline":
			lineName = $lang=="C"? "機場快&#32171;" : "Airport Express";
			break;
		case "line1":
			lineName = $lang=="C"? "深圳一&#32171;" : "Line 1";
			break;
		case "line2":
			lineName = $lang=="C"? "深圳二&#32171;" : "Line 2";
			break;
		case "line3":
			lineName = $lang=="C"? "深圳三&#32171;" : "Line 3";
			break;
		case "line4":
			lineName = $lang=="C"? "深圳四&#32171;" : "Line 4";
			break;
		case "line5":
			lineName = $lang=="C"? "深圳五&#32171;" : "Line 5";
			break;
	}
	return lineName;
};


//------ For Service Hours (service_hours_search.php) - 20 June, 2016 -----
function serviceHoursInitialStation( station ){
	$(".home_pulldown").html( '' );
	var station = getQueryVariable('station');
	for (var i = 0; i < hk_station_row_count; i++) {
		var caption = captionArr[i];
		if (caption != ""){
			var myValue = myValueArr[i];
			// console.log( myValue + ' : ' + caption + ' : ' + (station==47) );
			if( $.inArray( "style" + i, styleArr) > -1 )
				$(".home_pulldown").append("<option style=\""+ eval('style' + i) +"\" value=\"\">" + caption + "</option>");
			else
				$(".home_pulldown").append("<option " + ( myValue==station ? "selected=\"selected\"" : "" ) + " value=\"" + myValue + "\">" + caption + "</option>");
			
			if( $( formatSelector('.js_station_' + myValue) ).html()=='-' ){
				$( formatSelector('.js_station_' + myValue) ).html( caption );
			}
			if( $( formatSelector('.js_station_' + myValue + '_ael') ).html()=='-' ){
				if( station==47 && myValue==56 ){
					caption = "<!--" + caption + "-->" + "AsiaWorld-Expo";
				}
				else if( myValue==44 || myValue==39 ){
					caption = "<!--" + caption + "-->" + "City";
				}
				else if( myValue==56 ){
					caption = "<!--" + caption + "-->" + "Airport / AsiaWorld-Expo";
				}
				$( formatSelector('.js_station_' + myValue + '_ael') ).html( caption );
			}
		}
	}
};
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  } 
  // alert('Query Variable ' + variable + ' not found');
};
//------ For Service Hours (service_hours_search.php) - 20 June, 2016 (End) -----


//------ For LR JP ------
function hrInitialStationList(fromOrTo){
	//Initialize station pull-down list
	eval('$'+fromOrTo+'_selectStationIdArray=new Array();');
	eval('$'+fromOrTo+'_selectStationNameArray=new Array();');
	$("#stationCombo_"+fromOrTo).html("");
	for (var i = 0; i < all_station_row_count; i++) {
		//console.log(caption);
		var caption = captionArr[i];
		if (caption != "" ){
			var myValue = myValueArr[i];
			if($.inArray(i,filterValueArr)<0){
				eval('$'+fromOrTo+'_selectStationIdArray').push(myValue);
				eval('$'+fromOrTo+'_selectStationNameArray').push(caption);
			}
			if( $.inArray( "style" + i, styleArr) > -1 )
				$("#stationCombo_"+fromOrTo).append("<option style=\""+ eval('style' + i) +"\" value=\"\">" + caption + "</option>");
			else
				$("#stationCombo_"+fromOrTo).append("<option value=\"" + myValue + "\">" + caption + "</option>");
				
		}
	}
	$("#stationCombo_"+fromOrTo).val("").change();
	($lang == "E")?  $("#station" + (fromOrTo=="from"? "fs" : "to") + "_ID").val("--Input or select--") : $("#station" + (fromOrTo=="from"? "fs" : "to") + "_ID").val("--輸入或選擇--");
};

function hr_setByStationList(fromOrTo){
	eval('$'+fromOrTo+'_selectStationIdArray=new Array();');
	eval('$'+fromOrTo+'_selectStationNameArray=new Array();');
	var optionhtmlStr = "<option value=\"\" selected>--Input or select--</option>";
	for(var i = 0 ; i < hr_byStationMyValueArr.length; i++){
		var myValue = hr_byStationMyValueArr[i];
		var caption = mapStationName(myValue);
		if($.inArray(i,filterValueArr)<0){
			eval('$'+fromOrTo+'_selectStationIdArray').push(myValue);
			eval('$'+fromOrTo+'_selectStationNameArray').push(caption);
		}
		optionhtmlStr += "<option value=\""+myValue+"\">"+caption+"</option>";
	}
	
	$("#stationCombo_"+fromOrTo).html(optionhtmlStr);
	$("#stationCombo_"+fromOrTo).val("").change();
	($lang == "E")?  $("#station" + (fromOrTo=="from"? "fs" : "to") + "_ID").val("--Input or select--") : $("#station" + (fromOrTo=="from"? "fs" : "to") + "_ID").val("--輸入或選擇--");
	
};
//------ END For LR JP ------
	

/* Journey Planner */
$(document).ready(function(){
	var linkRes =  window.location.href.match(/[/]lr_jp[/]/g);
	if( (linkRes != "/lr_jp/") ){
		$selectStationIdArr = new Array();
		$selectStationNameArray = new Array();
		$filteredStationNameArray = new Array();

		var getAutoC_value = "";
		var getAutoCTo_value = "";
		
		//Initialize station pull-down list
		for (var i = 0; i < all_station_row_count; i++) {
			//console.log(caption);
			var caption = captionArr[i];
			
			if (caption != "" ){
				var myValue = myValueArr[i];
				
				if( $.inArray( "style" + i, styleArr) > -1 )
					$("#stationCombo_from, #stationCombo_to").append("<option style=\""+ eval('style' + i) +"\" value=\"\">" + caption + "</option>");
				else
					$("#stationCombo_from, #stationCombo_to").append("<option value=\"" + myValue + "\">" + caption + "</option>");
					
				
				$selectStationIdArr.push(myValue);
				$selectStationNameArray.push(caption);
				if($.inArray(i,filterValueArr)<0){
					$filteredStationNameArray.push(caption);
				}
			}
		}
			 
		//////////////////////////////////////////////////////////////////////////////
		// 	1.Get user input for autocomplete when focus in the textbox
		//	2.Get textbox id and value when lose focus in the textbox
		//	3.Check the value whether equal location and which id need set select
		//////////////////////////////////////////////////////////////////////////////
		var value = 0;
		// Station Tab set select box function  
		function setPoint(p_accessID){
			for ( var i = 0; i < $selectStationNameArray.length; i++) 
			{	
				if( p_accessID == "stationfs_ID" || p_accessID == "stationto_ID" ){

					if( getAutoC_value == $selectStationNameArray[i] ) {
						if( p_accessID == "stationfs_ID" ) {
							$('select#stationCombo_from').val($selectStationIdArr[i]).change();
							break;
						} else {	
							$('select#stationCombo_to').val($selectStationIdArr[i]).change();
							break;
						}
					}
				} else {	
					if( p_accessID == "landmarkfs_ID") {
						if( $('#landmarkfs_ID').val() == $selectStationNameArray[i] ){
							$('select#landmarkCombo_from option').eq(i).prop('selected', true);
							break;
						} 
					} else {
						if( $('#landmarkto_ID').val() == $selectStationNameArray[i] ){
							$('select#landmarkCombo_to option').eq(i).prop('selected', true);
							break;
						}
					}
				}
			}
		}
		
		// LandMark Tab set select box function  
		function confirmAttractionPlace(p_accessID, p_whichArray, p_AcValue, type)
		{
			var comboBoxName = (type == 'from'? 'from' : 'to'),
				arrayName = ( type == 'from'? 'From' : 'To' ),
				inputFieldName = (type == 'from'? 'fs' : 'to'),
				gobalValAc = ( type == "from"? "" : "To");
				
			var tempOption = $(formatSelector('select#landmarkCombo_' + comboBoxName +' option')).filter(function(){ return $(this).html() == getAutoC_value }).val();
							
			$('#landmarkCombo_' + comboBoxName + ' option[value="'+ tempOption +'"]' ).prop('selected', true).change();		

				if ( $('#landmark'+ inputFieldName +'_ID').val() == '' ) { 
					$('#landmark'+ inputFieldName +'_ID').val('--Input or select--'); 
					$('#landmark'+ inputFieldName +'_ID').attr('color','#000000');
				} 	
		}
		
		$('#stationfs_ID, #stationto_ID, #landmarkfs_ID, #landmarkto_ID').click(function(){
			$(this).select();
		}); 
		
		// Station Tab "From, To" AutoComplete
		$('#stationfs_ID, #stationto_ID').autocomplete({
			minLength: 0,
			autoFocus: true,
			source: function( request, response ) {
			  var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
			  response( $.grep( $filteredStationNameArray, function( item ){
				  return matcher.test( item );
			  }) );
			},
			select: function( event, ui ) {
				$(this).val(ui.item.value);
				var accessID = this.id;
				var getCurrValue = $(this).val();
				getAutoC_value = $(this).val();
				setPoint(accessID);
				$("#stationCombo_"+(this.id=="stationfs_ID"?'from':'to')).focus();
			}
		});
		
		$('#stationfs_ID, #stationto_ID').focusout(function(){
			if($(this).val() ==""){
				var pathname = window.location.pathname;
				
				$("#stationCombo_"+(this.id=="stationfs_ID"?'from':'to')).val("");
				$("#stationCombo_"+(this.id=="stationfs_ID"?'from':'to')+" option").eq(0).prop('selected', true);
				if (pathname.indexOf("/jp/") != -1){
					initMap("");
					if($(this).attr("id") == "stationfs_ID"){
						$("#map_viewPort .point_begin").remove();
						setMapPointing($("#hideToId").val(), "to");	
					}else{
						$("#map_viewPort .point_terminal").remove();
						setMapPointing($("#hideFromId").val(), "from");
					}
					$(".journeyinfo").hide();
					$(".routeview").hide();
					hideResult = hideResult==1?2:0;//Use to avoid the collide of search and clear result action
				
				}
			}
		});
		
		// LandMark Tab "From & To" AutoComplete 
		$('#landmarkfs_ID, #landmarkto_ID').focusin(function(){ 
			var autoCompleteArr = this.id == "landmarkfs_ID"?$selectFromLandmarkNameArray:$selectToLandmarkNameArray;
			//$(this).setOptions({data: $selectFromLandmarkNameArray});
			$(this).autocomplete('option', 'source', function( request, response ) {
			  var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
			  response( $.grep( autoCompleteArr, function( item ){
				  return matcher.test( item );
			  }) );
			});
		});
		
		$('#landmarkfs_ID, #landmarkto_ID').autocomplete({
			minLength: 0,
			source: "",
			autoFocus: true,
			select: function( event, ui ) {
				$(this).val(ui.item.value);
				var accessID = this.id;
				getAutoC_value = $(this).val();
				if( $( '#cat_combobox_'+(this.id=="landmarkfs_ID"?'from':'to') ).val() == "mtr" ) {
					setPoint(accessID);
				} else {
					if(accessID=="landmarkfs_ID"){
						confirmAttractionPlace(accessID, $selectFromLandmarkNameArray, $('#landmarkfs_ID').val(), "from");
					}else{
						confirmAttractionPlace(accessID, $selectToLandmarkNameArray, $('#landmarkto_ID').val(), "to");
					}
				}
				$("#landmarkCombo_"+(this.id=="landmarkfs_ID"?'from':'to')).focus();
			}
		});
		
		$('#landmarkfs_ID, #landmarkto_ID').focusout(function(){
			if($(this).val() == ""){
				var pathname = window.location.pathname;
				
				$("#landmarkCombo_"+(this.id=="landmarkfs_ID"?'from':'to')).val("");
				$("#landmarkCombo_"+(this.id=="landmarkfs_ID"?'from':'to')+" option").eq(0).prop('selected', true);	
				
				$("#hide"+(this.id=="landmarkfs_ID"?'From':'To')+"Id").val("");
				if (pathname.indexOf("/jp/") != -1){
					initMap("");
					if($(this).attr("id") == "landmarkfs_ID"){
						$(".point_begin").remove();
						setMapPointing($("#hideToId").val(), "to");
					}else{
						$(".point_terminal").remove();
						setMapPointing($("#hideFromId").val(), "from");
					}
					$(".journeyinfo").hide();
					$(".routeview").hide();
					hideResult = hideResult==1?2:0;//Use to avoid the collide of search and clear result action
				}
			}
		});
		
		//////////////////////////////////////////////////////////////////////////////
		// 	1.Check input ID is which ID of the select box
		//	2.Get selected value for paste into textbox
		//////////////////////////////////////////////////////////////////////////////
		

		// Station Tab get select box value
		$('select#stationCombo_from, select#stationCombo_to').change(function(){
			var get_Text_Temp = $( formatSelector('select#' + this.id + ' option:selected')).text();
			if($( formatSelector('select#' + this.id + ' option:selected')).val()==""){
			$( formatSelector('select#' + this.id + ' option')).eq(0).prop('selected', true);
			get_Text_Temp = "--Input or select--";
		}
			
			if( this.id == "stationCombo_from" ){
				$("#stationfs_ID").val( get_Text_Temp );
			} else {
				$("#stationto_ID").val( get_Text_Temp );
			}
			
			var pathname = window.location.pathname;
		});
		
		$(".btn_findit").on("click", function(e){

			$(".closeBox").trigger("click");
			var pathname = window.location.pathname;
			
			if (pathname.indexOf("/jp/") != -1)
			{
				$(".jpFtLt ").hide();
				$(".journeyinfo").hide();
				$(".routeview").hide();
				planJourney();

			}else {
				var sId = "";
				var eId = "";
				var pointType = "";
				
				if($(".jptab1").hasClass("active")){
					sId = $("#stationCombo_from").val();
					eId = $("#stationCombo_to").val();
				}else {
					//sId = $("#landmarkCombo_from").val();
					//eId = $("#landmarkCombo_to").val();
					tempst = $("#landmarkCombo_from").val();
					tempet = $("#landmarkCombo_to").val();
					
					sId = tempst == null ? "" : tempst.split(",")[0];
					eId = tempet == null ? "" :  tempet.split(",")[0];
				}
				if ( sId== "" || eId == "" || sId === null || eId === null ){
					alert($lang=="C"? "請選擇起點終點。" : "Please select from and to location.");
					/*if(sId == ""){
						setTimeout(function(){
							if( $(".jptab1").hasClass("active") )
								document.getElementById('stationfs_ID').focus();
							else
								document.getElementById('cat_combobox_from').focus();
						},100);
					}else{
						setTimeout(function(){
							if( $(".jptab1").hasClass("active") )
								document.getElementById('stationto_ID').focus();
							else
								document.getElementById('cat_combobox_to').focus();
						},100);
					}*/
				}
				else if(sId == eId) {
					if($("#landmarkCombo_from").val()!="" && $("#landmarkCombo_to").val()!="" && $("#landmarkCombo_from").val()!=$("#landmarkCombo_to").val()){
						alert($lang=="C"? "這地標和景點於相同車站的附近。" : "The landmark and the attraction are located near the same MTR station.");
					}else {
						alert($lang=="C"? "請選擇不同的車站。" : "Please select different location.");
					}
				}	
				else {
					var attFrmCate = "";
					var attToCate = "";
					var attFrm = "";
					var attTo = "";
					if($(".jptab2").hasClass("active")){
						if($("#cat_combobox_from").val()!="mtr" && $("#cat_combobox_from").val()!="ImmigrationPorts"){
							attFrm = tempst.split(",")[1];
							sId = tempst.split(",")[0];
							attFrmCate = $("#cat_combobox_from").val();
						}
						else{
							attFrm = sId;
							attFrmCate = $("#cat_combobox_from").val();
						}
						if($("#cat_combobox_to").val()!="mtr" && $("#cat_combobox_to").val()!="ImmigrationPorts"){
							attTo = tempet.split(",")[1];
							eId = tempet.split(",")[0];
							attToCate = $("#cat_combobox_to").val();
						}
						else{
							attTo = eId;
							attToCate = $("#cat_combobox_to").val();
						}
					}
					
					var currentLink = window.location.href;
					var linkRes =  currentLink.match(/[/]jp[/]/g);
					var linkRes1 =  currentLink.match(/[/]jp1[/]/g);
					var linkRes2 =  currentLink.match(/[/]jp2[/]/g);
					var currentRes = linkRes1==null ? linkRes2==null ? '/jp/' : '/jp2/' : '/jp1/';
					// console.log( currentRes + ' = ' + linkRes + ' : ' + linkRes1 + ' : ' + linkRes2 );
					
					window.location=".." + currentRes + "index.php?sid=" + sId + "&eid=" + eId + 
					(attFrm==""? "" : "&attFrmCate=" + encodeURIComponent(attFrmCate) +"&attFrm=" + attFrm) + 
					(attTo==""? "" : "&attToCate=" + encodeURIComponent(attToCate) + "&attTo=" + attTo);
				}
			}
		});
		
	   // Station Tab change
	   $('#btn-change-station-fromto_ID').click(function(){
		$(".btn-change-fromto").hide();
			var tempLocation_from = $("#stationfs_ID").val();
			$("#stationfs_ID").val( $("#stationto_ID").val() );
			$("#stationto_ID").val( tempLocation_from );
			if($('#stationCombo_from').val() == ""){
				$("#stationCombo_to").val("");
				$("#hideToId").val("");
			}
			if($('#stationCombo_to').val() == "" ){
				$("#stationCombo_from").val("");
				$("#hideFromId").val("");
			}
			for ( var i = 0; i < $selectStationNameArray.length; i++) 
			{
				if( $("#stationfs_ID").val() == $selectStationNameArray[i] ){
					$('#stationCombo_from').val($selectStationIdArr[i]).change();
				}
				
				if( $("#stationto_ID").val() == $selectStationNameArray[i] ){
					$('#stationCombo_to').val($selectStationIdArr[i]).change();
				}
			}
			var currLink = window.location.href;
			if(currLink.indexOf("/jp/") != -1) {
				initMap("all");
			}
			else{
				if($("#stationCombo_from").val() == ""){
					$("#stationCombo_from option").eq(0).prop('selected', true);	
				}
				if($("#stationCombo_to").val() == ""){
					$("#stationCombo_to option").eq(0).prop('selected', true);	
				}
			}
			$(".btn-change-fromto").show();
			hideResult = hideResult==1?2:0;//Use to avoid the collide of search and clear result action
	   });
	   
	   //Update by Jason
		/*var stationFromId = myPreference.getUserPreference()==null? "" : myPreference.getUserPreference().home1;
		if( stationFromId!=null && stationFromId !=""){
			$("#stationCombo_from").val(stationFromId).change();
		}else{
			$("#stationCombo_from option").eq(0).prop('selected', true);	
		}*/
	}
});