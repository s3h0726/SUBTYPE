'use strict';
// Import evidence stays in Git. Pages contains the application and lazy public
// payloads, so nationwide source archives do not consume the published site limit.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'_site');
if(fs.existsSync(out))throw Error('_site already exists; use a fresh staging directory');
const excluded=['.git','.github','.cache','node_modules','_site','tools','reports','data/kr/canonical','data/kr/v2','data/uk/source','data/th/source','data/th/normalized','data/th/cache'];
const options={recursive:true,filter:source=>{
 const rel=path.relative(root,source).split(path.sep).join('/');
 return !excluded.some(p=>rel===p||rel.startsWith(p+'/'));
}};
fs.mkdirSync(out);
for(const name of fs.readdirSync(root))if(name!=='_site')fs.cpSync(path.join(root,name),path.join(out,name),options);
// Publish only the Korean-name editor inventory from reports. Other evidence
// reports remain excluded from the lightweight Pages runtime.
const editorReport=path.join(root,'reports/korean-names');
if(fs.existsSync(editorReport))fs.cpSync(editorReport,path.join(out,'reports/korean-names'),{recursive:true});
for(const name of ['index.html','js/app.bundle.js','data/kr/generated/index.json'])if(!fs.existsSync(path.join(out,name)))throw Error('Missing public asset '+name);
const publicHtml=fs.readFileSync(path.join(out,'index.html'),'utf8');
const korailCss='css/korail-nameplate.css';
const publicGame=fs.readFileSync(path.join(out,'js/app.bundle.js'),'utf8');
if(!publicHtml.includes('./'+korailCss+'?v='))throw Error('Korail nameboard stylesheet not linked in published HTML');
if(!fs.existsSync(path.join(out,korailCss)))throw Error('Korail nameboard CSS omitted from Pages staging');
if(!publicGame.includes('applyKorailNameplateNames(')||!publicGame.includes('isKorailOperatedRoute('))throw Error('Published game bundle omits Korail sign renderer');
console.log('KORAIL nameboard CSS, DOM, and game bundle are present in Pages staging.');

console.log('Pages runtime assets staged; source evidence remains available in the repository.');
