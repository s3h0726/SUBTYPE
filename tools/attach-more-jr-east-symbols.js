#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const rows=[
  ['data/lines/jr-east/nambusen','JN','https://commons.wikimedia.org/wiki/File:JR_JN_line_symbol.svg'],
  ['data/lines/jr-east/musashinosen','JM','https://commons.wikimedia.org/wiki/File:JR_JM_line_symbol.svg'],
  ['data/lines/jr-east/yokosuka-line','JO','https://commons.wikimedia.org/wiki/File:JR_JO_line_symbol.svg'],
  ['data/lines/jr-east/sobuhonsen','JO','https://commons.wikimedia.org/wiki/File:JR_JO_line_symbol.svg'],
  ['data/lines/jr-east/saikyo-line','JA','https://commons.wikimedia.org/wiki/File:JR_JA_line_symbol.svg'],
  ['data/lines/jr-east/shonan-shinjuku-line','JS','https://commons.wikimedia.org/wiki/File:JR_JS_line_symbol.svg']
];
for(const [folder,code,source] of rows){
  const lineFile=path.join(root,folder,'line.json');
  const line=JSON.parse(fs.readFileSync(lineFile,'utf8'));
  line.code=code;
  line.symbol={
    ...(line.symbol||{}),
    asset:'./symbol.svg',
    officialSymbolExists:true,
    source,
    verified:true,
    assetSource:'wikimedia',
    assetSourceUrl:source,
    licenseVerified:true
  };
  fs.writeFileSync(lineFile,JSON.stringify(line,null,2)+'\n');
}
console.log(JSON.stringify({updated:rows.map(([folder,code])=>({folder,code}))},null,2));
