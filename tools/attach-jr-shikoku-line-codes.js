#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const mapping={
  'data/lines/jr-shikoku/kotokusen/line.json':'T',
  'data/lines/jr-shikoku/mugisen/line.json':'M',
  'data/lines/jr-shikoku/narutosen/line.json':'N',
  'data/lines/jr-shikoku/san-uchikosen/line.json':'U',
  'data/lines/jr-shikoku/shimantogurinrain/line.json':'G',
  'data/lines/jr-shikoku/yoshinokawabururain/line.json':'B'
};
const badgesPath=path.join(root,'data','line-badges.json');
const badges=JSON.parse(fs.readFileSync(badgesPath,'utf8'));
badges.routeCodes=badges.routeCodes||{};
badges.operatorStyles=badges.operatorStyles||{};
badges.operatorStyles['jr-shikoku']={style:'jr-shikoku',source:'https://www.jr-shikoku.co.jp/global/en/trainbus/st_number.html'};
for(const [rel,code] of Object.entries(mapping)){
  const file=path.join(root,rel),line=JSON.parse(fs.readFileSync(file,'utf8'));
  line.code=code;
  line.sources=line.sources||{};
  line.sources.lineCode={source:'JR Shikoku official station numbering',url:'https://www.jr-shikoku.co.jp/global/en/trainbus/st_number.html',verifiedDate:'2026-10-07',verified:true};
  fs.writeFileSync(file,JSON.stringify(line,null,2)+'\n');
  badges.routeCodes[line.id]=code;
}
badges.verifiedDate='2026-10-07';
fs.writeFileSync(badgesPath,JSON.stringify(badges,null,2)+'\n');
console.log(JSON.stringify({updated:Object.keys(mapping).length},null,2));
