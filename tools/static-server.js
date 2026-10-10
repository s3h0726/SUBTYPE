#!/usr/bin/env node
'use strict';
const http=require('http');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..'),port=Number(process.argv[2]||8765),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname),relative=pathname==='/'?'index.html':pathname.replace(/^\/+/,''),target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)){response.writeHead(403).end('Forbidden');return}
  fs.stat(target,(error,stat)=>{
    const file=!error&&stat.isDirectory()?path.join(target,'index.html'):target;
    fs.readFile(file,(readError,data)=>{if(readError){response.writeHead(404).end('Not found');return}response.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});response.end(data)});
  });
}).listen(port,'127.0.0.1',()=>console.log(`SUBTYPE static server: http://127.0.0.1:${port}`));
