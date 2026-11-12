'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
function apply(base=path.join(root,'data/uk')){
 const config=read(path.join(base,'source/timetables/uk-56-service-day-rules.json'));
 for(const rule of config.rules){
  const file=path.join(base,'generated/routes',rule.routeId+'.json');
  const route=read(file);assert.equal(route.id,rule.routeId);
  route.officialServiceDayRule={...rule,gameTimeEnforcement:false};
  for(const pattern of route.patterns) {
   pattern.officialServiceDayRule=route.officialServiceDayRule;
   const service=route.services.find(s=>s.id===pattern.id);
   assert(service);service.officialServiceDayRule=route.officialServiceDayRule;
  }
  fs.writeFileSync(file,JSON.stringify(route)+'\n','utf8');
 }
 return {changed:config.rules.length};
}
module.exports={apply};
if(require.main===module)console.log(JSON.stringify(apply()));
