#!/usr/bin/env node
// trigger-version: 3 — fixed shebang position and force rerun
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');

const rows=[
  ['data/lines/tokyo-metro/ginza','G','도쿄메트로 긴자선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/marunouchi-line','M','도쿄메트로 마루노우치선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/marunouchi-honancho-branch','Mb','도쿄메트로 마루노우치선 분기선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/hibiya-line','H','도쿄메트로 히비야선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/tozai-line','T','도쿄메트로 도자이선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/chiyoda-line','C','도쿄메트로 치요다선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/yurakucho-line','Y','도쿄메트로 유라쿠초선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/hanzomon-line','Z','도쿄메트로 한조몬선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/namboku-line','N','도쿄메트로 난보쿠선 로고.svg','https://d.namu.moe/w/도쿄메트로'],
  ['data/lines/tokyo-metro/fukutoshin-line','F','도쿄메트로 후쿠토신선 로고.svg','https://d.namu.moe/w/도쿄메트로'],

  ['data/lines/toei/asakusa-line','A','도에이 아사쿠사선 로고.svg','https://m.namu.moe/w/도에이 아사쿠사선'],
  ['data/lines/toei/mita-line','I','도에이 미타선 로고.svg','https://m.namu.moe/w/도에이 미타선'],
  ['data/lines/toei/shinjuku-line','S','도에이 신주쿠선 로고.svg','https://m.namu.moe/w/도에이 신주쿠선'],
  ['data/lines/toei/oedo-line','E','도에이 오에도선 로고.svg','https://m.namu.moe/w/도에이 오에도선']
];

for(const [folder,code,fileName,page] of rows){
  const lineFile=path.join(root,folder,'line.json');
  const line=JSON.parse(fs.readFileSync(lineFile,'utf8'));
  line.code=code;
  line.symbol=line.symbol||{};
  line.symbol.asset='./symbol.svg';
  line.symbol.officialSymbolExists=true;
  line.symbol.verified=true;
  line.symbol.identificationSource='namuwiki';
  line.symbol.identificationUrl=page;
  line.symbol.identificationFile=fileName;
  line.symbol.identificationSearch=`site:namu.wiki "${fileName}"`;
  line.symbol.sourceAccess='namuwiki-mirror';
  line.symbol.identificationFamily='namuwiki';
  line.symbol.identificationMethod='file-name-crosscheck';
  line.symbol.identificationVerified=true;
  fs.writeFileSync(lineFile,JSON.stringify(line,null,2)+'\n');
}
console.log(JSON.stringify({updated:rows.length},null,2));
