'use strict';
// Import evidence stays in Git. Pages contains the application and lazy public
// payloads, so nationwide source archives do not consume the published site limit.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'_site');
if(fs.existsSync(out))throw Error('_site already exists; use a fresh staging directory');
const excluded=['.git','.github','node_modules','_site','tools','reports','data/kr/canonical','data/kr/v2'];
const options={recursive:true,filter:source=>{
 const rel=path.relative(root,source).split(path.sep).join('/');
 return !excluded.some(p=>rel===p||rel.startsWith(p+'/'));
}};
fs.mkdirSync(out);
for(const name of fs.readdirSync(root))if(name!=='_site')fs.cpSync(path.join(root,name),path.join(out,name),options);
for(const name of ['index.html','js/app.bundle.js','data/kr/generated/index.json'])if(!fs.existsSync(path.join(out,name)))throw Error('Missing public asset '+name);
console.log('Pages runtime assets staged; source evidence remains available in the repository.');
