#!/usr/bin/env node
// Protected logo identity audit. Fails whenever a logo mapping or its source disappears.
const fs=require('fs'),assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8');
const badges=read('js/line-badge.js'),operators=read('js/asset-renderer.js'),build=read('tools/build-static.js');
const must=[
 ['Osaka Metro Midosuji',badges,"'line-99618':'Osaka Metro Midosuji line symbol.svg'"],
 ['Osaka Metro Tanimachi',badges,"'line-99619':'Osaka Metro Tanimachi line symbol.svg'"],
 ['Osaka Metro Yotsubashi',badges,"'line-99620':'Osaka Metro Yotsubashi line symbol.svg'"],
 ['Osaka Metro Chuo',badges,"'line-99621':'Osaka Metro Chuo line symbol.svg'"],
 ['Osaka Metro Sennichimae',badges,"'line-99622':'Osaka Metro Sennichimae line symbol.svg'"],
 ['Osaka Metro Sakaisuji',badges,"'line-99623':'Osaka Metro Sakaisuji line symbol.svg'"],
 ['Osaka Metro Nagahori',badges,"'line-99624':'Osaka Metro Nagahori Tsurumi-ryokuchi line symbol.svg'"],
 ['Osaka Metro Imazatosuji',badges,"'line-99652':'Osaka Metro Imazatosuji line symbol.svg'"],
 ['Seibu Yamaguchi',badges,"'line-22006':'SeibuYamaguchi.svg'"],
 ['Tobu Isesaki',badges,"'line-21002':'Tobu_Isesaki_Line_(TI)_symbol.svg'"],
 ['Tobu Nikko',badges,"'line-21003':'Tobu_Nikko_Line_(TN)_symbol.svg'"],
 ['Tobu Noda',badges,"'line-21004':'Tobu_Noda_Line_(TD)_symbol.svg'"],
 ['Tobu Tojo',badges,"'line-21001':'Tobu_Tojo_Line_(TJ)_symbol.svg'"],
 ['Seibu Ikebukuro',badges,"'line-22001':'SeibuIkebukuro.svg'"],
 ['Seibu Shinjuku',badges,"'line-22007':'SeibuShinjuku.svg'"],
 ['Seibu Kokubunji',badges,"'line-22010':'SeibuKokubunji.svg'"],
 ['Seibu Tamako',badges,"'line-22011':'SeibuTamako.svg'"],
 ['Seibu Tamagawa',badges,"'line-22012':'SeibuTamagawa.svg'"],
 ['Sendai N',badges,"'line-99214':"],
 ['Sendai T',badges,"'line-99218':"],
 ['Sendai original priority',badges,'Original SM-N/SM-T assets outrank locally reconstructed lookalikes'],
 ['Nishitetsu operator',operators,'Nishitetsu_logo_N.svg'],
 ['Source fallback',badges,'if(!asset)asset=railDataRepository.getLineSymbolAsset'],
 ['Build regression guard',build,'preservedLogoMarkers']
];
let failures=[];for(const [name,src,marker] of must){if(!src.includes(marker))failures.push(name)}
// Confirm line IDs still represent the intended lines, not another service.
const routeChecks=[
 ['tobu/tojo-line','line-21001'],['seibu/ikebukuro-line','line-22001'],
 ['seibu/seibushinjukusen','line-22007'],['seibu/seibukokubunjisen','line-22010'],
 ['seibu/seibutamakosen','line-22011'],['seibu/seibutamagawasen','line-22012'],
 ['sendaishikotsukyoku/sendaishieichikatetsunambokusen','line-99214'],
 ['sendaishikotsukyoku/sendaishieichikatetsutozaisen','line-99218']
];
for(const [dir,id] of routeChecks){let p='data/lines/'+dir+'/line.json';try{if(JSON.parse(read(p)).id!==id)failures.push(id+' identity changed')}catch{failures.push(p+' missing')}}
const result={status:failures.length?'FAIL':'PASS',checked:must.length+routeChecks.length,failures};console.log(JSON.stringify(result,null,2));if(failures.length)process.exitCode=1;
