'use strict';

// Verify deployed bytes independently of gameplay and HTML cache-key metadata.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const base = process.env.FRANCE_PUBLIC_URL || 'https://s3h0726.github.io/SUBTYPE/';
const indexPath = 'data/fr/generated/index.json';
const index = JSON.parse(fs.readFileSync(path.join(root,indexPath),'utf8'));
let files = [...new Set([indexPath,'js/app.bundle.js','js/france-network.js','css/france-rail.css',
  'editor/index.html','reports/korean-names/editor.html',
  ...index.routes.flatMap(route => [route.lazySource,...route.geometryFiles])])];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {status:'PENDING',verifiedAt:new Date().toISOString(),base,catalogLines:index.routes.length,
  expectedSource:'Committed Git blobs, avoiding Windows checkout line-ending conversion',
  sourceRef:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  directions:index.routes.reduce((total,line) => total+line.serviceCount,0),files:[],errors:[]};
if (process.argv.includes('--retry-failed')) {
  const prior = JSON.parse(fs.readFileSync(path.join(root,'reports/fr/production-assets.json'),'utf8'));
  if (prior.sourceRef !== report.sourceRef || prior.base !== base) throw Error('Cannot reuse verification from a different source or site');
  report.files = prior.files.filter(row => row.status === 'PASS' && files.includes(row.file));
  const done = new Set(report.files.map(row => row.file));
  files = files.filter(file => !done.has(file));
  report.reusedVerification = {verifiedAt:prior.verifiedAt,files:done.size,sourceRef:prior.sourceRef};
}
let next = 0;
async function worker() {
  while (next < files.length) {
    const file = files[next++];
    try {
      let response;
      for (let attempt=0;attempt<3;attempt++) {
        response = await fetch(new URL(file+'?fr_asset_verify='+Date.now(),base), {signal:AbortSignal.timeout(60000)});
        if (response.ok || ![429,500,502,503,504].includes(response.status) || attempt===2) break;
        await response.body?.cancel();
        await new Promise(resolve => setTimeout(resolve,1000*(attempt+1)));
      }
      if (!response.ok) throw Error('HTTP '+response.status);
      const actual = Buffer.from(await response.arrayBuffer());
      const expectedHash = hash(execFileSync('git',['show','HEAD:'+file.replace(/^\.\//,'')],{cwd:root,maxBuffer:128*1024*1024}));
      if (hash(actual) !== expectedHash) throw Error('Deployed bytes differ from the verified checkout');
      report.files.push({file,sha256:expectedHash,bytes:actual.length,status:'PASS'});
    } catch(error) {
      report.errors.push({file,reason:error.message});
    }
  }
}
Promise.all(Array.from({length:4},worker)).then(() => {
  report.files.sort((a,b) => a.file.localeCompare(b.file));
  report.status = report.errors.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(root,'reports/fr/production-assets.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,files:report.files.length,errors:report.errors}));
  if (report.status !== 'PASS') process.exitCode = 1;
}).catch(error => {console.error(error);process.exitCode=1;});
