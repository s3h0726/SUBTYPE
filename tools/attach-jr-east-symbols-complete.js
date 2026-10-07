#!/usr/bin/env node
// trigger-version: 1
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');

const groups={
  JY:['data/lines/jr-east/yamanote'],
  JC:[
    'data/lines/jr-east/chuo-line-rapid',
    'data/lines/jr-east/omesen',
    'data/lines/jr-east/itsukaichisen'
  ],
  JB:['data/lines/jr-east/chuo-sobu'],
  JK:[
    'data/lines/jr-east/keihin-tohoku-line',
    'data/lines/jr-east/negishisen'
  ],
  JE:['data/lines/jr-east/keiyo-line'],
  JH:['data/lines/jr-east/yokohamasen'],
  JT:[
    'data/lines/jr-east/tokaidohonsen-tokyo-atami',
    'data/lines/jr-east/tokaidohonsen-tokyo-atami-2'
  ],
  JU:[
    'data/lines/jr-east/utsunomiyasen',
    'data/lines/jr-east/takasakisen'
  ],
  JJ:[
    'data/lines/jr-east/jobansen-ueno-totte',
    'data/lines/jr-east/jobansen-ueno-totte-2'
  ],
  JN:['data/lines/jr-east/nambusen'],
  JM:['data/lines/jr-east/musashinosen'],
  JO:[
    'data/lines/jr-east/yokosuka-line',
    'data/lines/jr-east/sobuhonsen'
  ],
  JA:['data/lines/jr-east/saikyo-line'],
  JS:['data/lines/jr-east/shonan-shinjuku-line'],
  JI:['data/lines/jr-east/tsurumisen']
};

for(const [code,folders] of Object.entries(groups)){
  const src=path.join(root,'assets','route-symbols',`jr-east-${code.toLowerCase()}.svg`);
  if(!fs.existsSync(src)) throw new Error('missing symbol asset '+src);
  for(const folder of folders){
    const dir=path.join(root,folder);
    const lineFile=path.join(dir,'line.json');
    if(!fs.existsSync(lineFile)) throw new Error('missing line '+lineFile);
    fs.copyFileSync(src,path.join(dir,'symbol.svg'));
    const line=JSON.parse(fs.readFileSync(lineFile,'utf8'));
    line.code=code;
    line.symbol={
      ...(line.symbol||{}),
      asset:'./symbol.svg',
      officialSymbolExists:true,
      source:'https://www.jreast.co.jp/press/2016/20160402.pdf',
      verified:true,
      identificationSource:'jr-east-official',
      identificationUrl:'https://www.jreast.co.jp/press/2016/20160402.pdf',
      identificationFamily:'official',
      identificationMethod:'route-code-crosscheck',
      identificationVerified:true,
      assetSource:'wikimedia-official-symbol',
      assetSourceUrl:`https://commons.wikimedia.org/wiki/File:JR_${code}_line_symbol.svg`
    };
    fs.writeFileSync(lineFile,JSON.stringify(line,null,2)+'\n');
  }
}
console.log(JSON.stringify({codes:Object.keys(groups),routes:Object.values(groups).flat().length},null,2));
