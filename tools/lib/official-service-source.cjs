'use strict';
// Legacy official citations and JR East's explicitly typed timetable citations
// are different schemas. Timetable citations require a publisher-owned train
// URL and a real review date; arbitrary HTTPS links/types are not promoted.
function isOfficialServiceSource(source){
 if(source?.type==='official')return /^https:\/\//.test(source.url||'');
 if(source?.type!=='official-timetable')return false;
 let url;try{url=new URL(source.url)}catch{return false}
 const date=source.verifiedAt;
 return url.protocol==='https:'&&url.hostname==='timetables.jreast.co.jp'&&!url.port&&!url.username&&!url.password&&/^\/\d{4}\/train\/\d{3}\/\d+\.html$/.test(url.pathname)&&/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
}
module.exports={isOfficialServiceSource};
