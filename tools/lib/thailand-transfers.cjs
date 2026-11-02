'use strict';
// 운영 노선도의 명시적 환승역만 결합한다. 승강장 좌표는 노선별로 유지한다.
const pairs=[
 ['bts-sukhumvit-N8','bem-blue-BL13'],['bts-sukhumvit-N9','bem-blue-BL14'],
 ['bts-sukhumvit-E4','bem-blue-BL22'],['bts-silom-S2','bem-blue-BL26'],
 ['bts-silom-S12','bem-blue-BL34'],['bts-silom-S7','bts-gold-G1'],
 ['bts-sukhumvit-N2','aera1-arl-A8'],['bem-purple-PP11','nbm-pink-PK01'],
 ['bem-blue-BL10','bem-purple-PP16'],['bem-blue-BL15','ebm-yellow-YL01'],
 ['bts-sukhumvit-E15','ebm-yellow-YL23'],['bts-sukhumvit-N17','nbm-pink-PK16'],
 ['srtet-darkred-RN06','nbm-pink-PK14'],['aera1-arl-A4','ebm-yellow-YL11','srt-3010'],
 ['aera1-arl-A6','bem-blue-BL21'],['srtet-darkred-RN01','srtet-lightred-RN01','bem-blue-BL11','srt-1000','srt-1007'],
 ['srtet-lightred-RW02','bem-purple-PP15'],['srtet-darkred-RN10','srt-1021'],['srtet-darkred-RN08','srt-1017'],
 ['bts-silom-S10','srt-5036','srt-5002']
].map(group=>group.map(id=>'th-'+id));
function applyTransfers(routes){
 const all=routes.flatMap(r=>[...(r.stations||[]),...(r.patterns||[]).flatMap(p=>p.stations)].map(s=>({s,r})));
 for(const group of pairs){const members=all.filter(({s})=>group.includes(s.station_id)),key='th-transfer-'+group[0];for(const {s,r}of members){s.thTransferKey=key;s.transfers=[...new Set(members.filter(x=>x.r.id!==r.id).map(x=>x.r.id))]}}
}
module.exports={pairs,applyTransfers};
