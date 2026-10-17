#!/usr/bin/env node
// Rebuild the Japan workspace and nationwide browser catalogs from canonical data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,value)=>{const file=path.join(root,p),tmp=file+'.tmp';fs.writeFileSync(tmp,value);fs.renameSync(tmp,file)};
cp.execFileSync(process.execPath,[path.join(__dirname,'build-line-workspaces.js')],{stdio:'inherit'});
const index=JSON.parse(read('data/nationwide/index.json')),routes={};
for(const meta of index.routes||[]){
 const source=String(meta.lazySource||'').replace(/^\.\//,'');
 if(!source.startsWith('data/nationwide/routes/')||!source.endsWith('.json'))throw Error('Unsafe nationwide route source '+source);
 if(!fs.existsSync(path.join(root,source)))throw Error('Missing nationwide railway source '+source);
 routes[source]=JSON.parse(read(source));
}
const nationwide='window.TRT_EMBEDDED_NATIONWIDE='+JSON.stringify({index,routes})+';\n';
write('js/nationwide-data.js',nationwide);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
let html=read('index.html');
for(const [file,content] of [['line-workspace-data.js',read('js/line-workspace-data.js')],['nationwide-data.js',nationwide]]){
 const escaped=file.replace(/\./g,'\\.');
 const pattern=new RegExp('(\\.\\/js\\/'+escaped+')(?:\\?v=[^"\\x27]*)?','g');
 if(!pattern.test(html))throw Error('Missing browser script reference: '+file);
 html=html.replace(pattern,(_,source)=>source+'?v='+hash(content));
}
write('index.html',html);
const embedded=read('js/line-workspace-data.js');
for(const marker of ['"신쿠라시키"','"가고시마츄오"','"니가타"','"히가시니가타"'])
 if(!embedded.includes(marker))throw Error('Canonical station correction missing from browser catalog: '+marker);
for(const obsolete of ['"新倉敷","kana":"にいくらしき"','"鹿児島中央","kana":"かごしまちゅうおう","ko":"가고시마추오"'])
 if(embedded.includes(obsolete))throw Error('Stale station correction found: '+obsolete);
console.log(JSON.stringify({status:'PASS',nationwideSourceFiles:Object.keys(routes).length,appendedBrowserDataBytes:embedded.length,cacheBusted:true},null,2));
