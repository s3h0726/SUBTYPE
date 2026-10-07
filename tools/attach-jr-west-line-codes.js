#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const mapping={
  'data/lines/jr-west/biwakosen/line.json':'A',
  'data/lines/jr-west/kyotosen/line.json':'A',
  'data/lines/jr-west/kobesen-osaka-kobe/line.json':'A',
  'data/lines/jr-west/kobesen-kobe-himeji/line.json':'A',
  'data/lines/jr-west/akosen/line.json':'A',
  'data/lines/jr-west/koseisen/line.json':'B',
  'data/lines/jr-west/kusatsusen/line.json':'C',
  'data/lines/jr-west/narasen/line.json':'D',
  'data/lines/jr-west/osakahigashisen/line.json':'F',
  'data/lines/jr-west/takarazukasen/line.json':'G',
  'data/lines/jr-west/fukuchiyamasen-sasayamaguchi-fukuchiyama/line.json':'G',
  'data/lines/jr-west/tozaisen/line.json':'H',
  'data/lines/jr-west/gakkentoshisen/line.json':'H',
  'data/lines/jr-west/kakogawasen/line.json':'I',
  'data/lines/jr-west/bantansen/line.json':'J',
  'data/lines/jr-west/kishinsen-himeji-sayo/line.json':'K',
  'data/lines/jr-west/maizurusen/line.json':'L',
  'data/lines/jr-west/osakakanjosen/line.json':'O',
  'data/lines/jr-west/yumesakisen/line.json':'P',
  'data/lines/jr-west/yamatorosen/line.json':'Q',
  'data/lines/jr-west/hanwasen-tennoji-wakayama/line.json':'R',
  'data/lines/jr-west/kansaikukosen/line.json':'S',
  'data/lines/jr-west/wakayamasen/line.json':'T',
  'data/lines/jr-west/manyomahorobasen/line.json':'U',
  'data/lines/jr-west/kansaihonsen-kameyama-kamo/line.json':'V',
  'data/lines/jr-west/kinokunisen/line.json':'W'
};
const badgesPath=path.join(root,'data','line-badges.json');
const badges=JSON.parse(fs.readFileSync(badgesPath,'utf8'));
badges.routeCodes=badges.routeCodes||{};
badges.operatorStyles=badges.operatorStyles||{};
badges.operatorStyles['jr-west']={style:'jr-west',source:'https://www.westjr.co.jp/global/en/timetable/pdf/ubn_en.pdf'};
for(const [rel,code] of Object.entries(mapping)){
  const file=path.join(root,rel),line=JSON.parse(fs.readFileSync(file,'utf8'));
  line.code=code;
  line.sources=line.sources||{};
  line.sources.lineCode={source:'JR West official station number route map',url:'https://www.westjr.co.jp/global/en/timetable/pdf/ubn_en.pdf',verifiedDate:'2026-10-07',verified:true};
  fs.writeFileSync(file,JSON.stringify(line,null,2)+'\n');
  badges.routeCodes[line.id]=code;
}
badges.verifiedDate='2026-10-07';
fs.writeFileSync(badgesPath,JSON.stringify(badges,null,2)+'\n');
console.log(JSON.stringify({updated:Object.keys(mapping).length},null,2));
