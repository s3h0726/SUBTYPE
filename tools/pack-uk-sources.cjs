'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto'),root=path.resolve(__dirname,'../data/uk/source');
const previous=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),entries=[];
for(const kind of ['osm','tfl','tfl-current'])for(const name of fs.readdirSync(path.join(root,kind)).sort()){
 const file=path.join(root,kind,name);if(!/\.json(?:\.gz)?$/.test(name))continue;
 const bytes=name.endsWith('.gz')?zlib.gunzipSync(fs.readFileSync(file)):fs.readFileSync(file),packed=file.replace(/\.gz$/,'')+'.gz';
 if(!name.endsWith('.gz')){fs.writeFileSync(packed,zlib.gzipSync(bytes,{level:9}));fs.unlinkSync(file)}
 const id=name.replace(/\.json(?:\.gz)?$/,'');entries.push({path:'data/uk/source/'+kind+'/'+path.basename(packed),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,url:kind==='osm'?'https://api.openstreetmap.org/api/0.6/relation/'+id+'/full.json':id==='lines'?'https://api.tfl.gov.uk/Line/Mode/tube,overground,dlr,tram,elizabeth-line':'https://api.tfl.gov.uk/Line/'+id+'/Route/Sequence/all?serviceTypes=Regular&excludeCrowding=true'});
}
for(const entry of entries){const old=previous.entries.find(e=>e.path===entry.path&&e.sha256===entry.sha256);entry.fetchedAt=old?(old.fetchedAt||previous.fetchedAt):'2026-11-10'}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({fetchedAt:'2026-11-10',entries},null,2)+'\n');console.log('Packed',entries.length,'source snapshots.');
