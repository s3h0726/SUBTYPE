const fs=require('fs');
const query='[out:json][timeout:90];node(21.8,119.8,25.4,122.1)[railway~"^(station|halt|tram_stop|stop)$"];out body;';
(async()=>{const url='https://maps.mail.ru/osm/tools/overpass/api/interpreter?data='+encodeURIComponent(query);const r=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();fs.writeFileSync('data/tw/source/osm-stations.json',JSON.stringify(data)+'\n');console.log(data.elements.length)})().catch(e=>{console.error(e.message);process.exitCode=1});
