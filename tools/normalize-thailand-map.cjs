'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),{parse}=require('./fetch-thailand-map.cjs');
const [input,output,url]=process.argv.slice(2),xml=fs.readFileSync(input,'utf8');
const data=parse(xml);fs.writeFileSync(output,JSON.stringify({...data,provenance:{url,retrievedAt:new Date().toISOString(),license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',rawSha256:crypto.createHash('sha256').update(xml).digest('hex')}}));console.log('철도 객체 보존: '+data.elements.length);
