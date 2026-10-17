const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {workspaceOperatorNames}=require('./lib/line-workspaces');
test('joint line operators resolve from canonical source metadata and propagate edits',()=>{
 const a={id:'east',names:{ko:'동쪽',ja:'東',en:'East'}},b={id:'west',names:{ko:'서쪽',ja:'西',en:'West'}},w={line:{id:'joint',operatorId:'east',operatorIds:['east','west']},operator:a,context:{operators:new Map([['east',a],['west',b]])}};
 assert.equal(workspaceOperatorNames(w).ko,'동쪽 / 서쪽');b.names.ko='변경';assert.equal(workspaceOperatorNames(w).ko,'동쪽 / 변경');w.line.operatorIds=['west'];assert.throws(()=>workspaceOperatorNames(w));w.line.operatorIds=['east','absent'];assert.throws(()=>workspaceOperatorNames(w));
});
test('retired Toyama duplicate keeps legacy records on the surviving canonical route',()=>{
 const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/feature-flags.js'),'utf8').replace(/export /g,'')+';globalThis.canonicalTest=canonicalRouteId',c);
 assert.equal(c.canonicalTest('line-99422'),'line-toyama-city-3');assert.equal(c.canonicalTest('line-28002-honancho-branch'),'line-28002');assert.equal(c.canonicalTest('line-11302'),'line-11302');
});
