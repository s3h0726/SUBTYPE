const sharedGeometry=new Map();
async function geometryDigest(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')}
export async function expandKoreanPatternGeometry(route,loadJson){
 if(route?.provisionalContract!=='kr-published-pattern-v1')return route;
 const ref=route.geometryRef;if(!ref||!/^data\/kr\/provisional\/geometry\/[a-f0-9]{64}\.json$/.test(ref.url)||ref.url.split('/').at(-1)!==ref.fullSha256+'.json'||!Array.isArray(ref.range)||ref.range.length!==2||!ref.range.every(Number.isInteger)||ref.range[0]<0||ref.range[1]<=ref.range[0])throw Error('INVALID_PROVISIONAL_GEOMETRY_REFERENCE');
 if(!sharedGeometry.has(ref.url))sharedGeometry.set(ref.url,(async()=>{const payload=await loadJson(ref.url);if(!Array.isArray(payload.geometry)||await geometryDigest(payload.geometry)!==ref.fullSha256)throw Error('SHARED_RAILWAY_GEOMETRY_HASH_MISMATCH');return payload.geometry})().catch(e=>{sharedGeometry.delete(ref.url);throw e}));
 const full=await sharedGeometry.get(ref.url);if(ref.range[1]>=full.length)throw Error('PROVISIONAL_GEOMETRY_RANGE');const geometry=full.slice(ref.range[0],ref.range[1]+1);if(await geometryDigest(geometry)!==ref.sha256)throw Error('PROVISIONAL_GEOMETRY_HASH_MISMATCH');
 const stations=route.stations,directedSegments=stations.slice(0,-1).map((s,i)=>({fromStationId:s.id,toStationId:stations[i+1].id,geometry:geometry.slice(s.geometryIndex,stations[i+1].geometryIndex+1),geometryStatus:'ready'}));return{...route,geometry,directedSegments};
}
