const fs=require('node:fs');
const base='data/th/source/';
if(process.argv.includes('--nrail')){const html=fs.readFileSync(base+'nrail.html','utf8');console.log([...new Set([...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]))].filter(s=>!s.includes('_next')).join('\n'));console.log([...html.matchAll(/<script src="([^"]+)/g)].map(m=>m[1]).join('\n'));}
if(process.argv.includes('--stations')){const st=require('../data/th/source/stations.json').stations;console.log(st.map(s=>s.id+'|'+s.th+'|'+s.en).join('\n'));}
if(process.argv.includes('--urban')){for(const l of require('../data/th/source/bangkok-lines.json').lines){let x=0,y=0;const points=[];for(let i=0;i<l.legs.fwd.length;i+=3){x+=l.legs.fwd[i];y+=l.legs.fwd[i+1];points.push([y/1e6,x/1e6])}console.log(l.key,l.stations.map(s=>({name:s.en,point:points[Math.round(s.d/l.step)]})));}}
