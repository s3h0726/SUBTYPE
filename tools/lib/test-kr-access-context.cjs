'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function loadAccessPolicy(context){
 for(const name of ['korean-access-data','korean-access-policy']){
  const source=fs.readFileSync(path.resolve(__dirname,'../../js/'+name+'.js'),'utf8');
  vm.runInContext(source.replace(/^import[^\n]*\n/gm,'').replace(/export /g,''),context);
 }
};
