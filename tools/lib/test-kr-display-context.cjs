const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=context=>{const source=fs.readFileSync(path.resolve(__dirname,'../../js/utils.js'),'utf8');vm.runInContext(source.slice(source.indexOf('export const koreanStationDisplayName'),source.indexOf('export const normalize')).replace(/export /g,''),context)};
