#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),p=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const refs=[...new Set(Object.values(p.scripts).join(' ').match(/tools\/[\w.-]+\.(?:js|mjs|cjs)/g))];
const missing=refs.filter(f=>!fs.existsSync(path.join(root,f)));
console.log(JSON.stringify({referencedScripts:refs.length,missing},null,2));if(missing.length)process.exitCode=1;
