#!/usr/bin/env node
// Transplant the exact updated route selector sections from source into the checked-in bundle.
// Avoid rebuilding unrelated Korean geometry systems.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),target=path.join(root,'js/app.bundle.js');
let bundle=fs.readFileSync(target,'utf8');
const slices=[['const NETWORK_GROUPS=', 'function filteredRoutes()'],['function renderRoutes()', 'function renderSelected()'],['function renderSelected()', 'function throughRouteIds(']];
for(const [a,b] of slices){
 const begin=src.indexOf(a),end=src.indexOf(b,begin+1),dstBegin=bundle.indexOf(a),dstEnd=bundle.indexOf(b,dstBegin+1);
 if(begin<0||end<=begin||dstBegin<0||dstEnd<=dstBegin)throw Error('Cannot safely patch bundle section: '+a);
 bundle=bundle.slice(0,dstBegin)+src.slice(begin,end)+bundle.slice(dstEnd);
}
for(const required of ['JP_TRAM_NETWORKS','오카야마 전기궤도','히로시마 전철','refreshTramNetworkGroups'])if(!bundle.includes(required))throw Error('Missing selector group '+required);
fs.writeFileSync(target,bundle);console.log('Updated 6 city-tram group selectors in browser bundle.');
