const {loadMaps}=require('./lib/thailand-osm.cjs'),m=loadMaps('data/th/source','map-maeklong');
console.log('선로 수',m.ways.length,'노드 수',m.adj.size);
console.log('역',m.stationNodes.map(n=>({id:n.id,name:n.tags.name,lat:n.lat,lon:n.lon,track:m.adj.has(n.id)})));
console.log('끝점',[...m.adj].filter(([id,adj])=>adj.size===1).map(([id])=>{const n=m.nodes.get(id);return{id,lat:n.lat,lon:n.lon,tags:n.tags}}));
