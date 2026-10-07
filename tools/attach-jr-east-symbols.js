#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const rows=[
  ['data/lines/jr-east/tokaidohonsen-tokyo-atami','JT','jr-east-jt.svg','https://commons.wikimedia.org/wiki/File:JR_JT_line_symbol.svg'],
  ['data/lines/jr-east/yokohamasen','JH','jr-east-jh.svg','https://commons.wikimedia.org/wiki/File:JR_JH_line_symbol.svg'],
  ['data/lines/jr-east/utsunomiyasen','JU','jr-east-ju.svg','https://commons.wikimedia.org/wiki/File:JR_JU_line_symbol.svg'],
  ['data/lines/jr-east/jobansen-ueno-totte','JJ','jr-east-jj.svg','https://commons.wikimedia.org/wiki/File:JR_JJ_line_symbol.svg']
];
for(const [folder,code,asset,source] of rows){
  const dir=path.join(root,folder);
  const lineFile=path.join(dir,'line.json');
  const src=path.join(root,'assets','route-symbols',asset);
  const dest=path.join(dir,'symbol.svg');
  if(!fs.existsSync(src))throw new Error('missing '+src);
  fs.copyFileSync(src,dest);
  const line=JSON.parse(fs.readFileSync(lineFile,'utf8'));
  line.code=code;
  line.symbol={
    ...(line.symbol||{}),
    asset:'./symbol.svg',
    officialSymbolExists:true,
    source,
    verified:true,
    assetSource:'repository-official-symbol',
    assetSourceUrl:source,
    licenseVerified:true
  };
  fs.writeFileSync(lineFile,JSON.stringify(line,null,2)+'\n');
}
console.log(JSON.stringify({attached:rows.map(r=>r[1])},null,2));
