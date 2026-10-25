const crypto=require('node:crypto');
function gameplayFingerprint(route){return crypto.createHash('sha256').update(JSON.stringify({id:route.id,direction:route.direction,stations:route.stations.map(s=>({id:s.id,ko:s.ko,ja:s.ja,en:s.romaji,position:[s.latitude,s.longitude],code:s.officialCode})),geometry:route.geometry,ways:route.directedSegments.map(s=>s.sourceWayIds)})).digest('hex')}
function reviewedGameplay(route,review){const proof=review.services[route.id];return proof?.status==='PASS'&&proof.fingerprint===gameplayFingerprint(route)&&(!route.operatingConditionFingerprint||proof.conditionFingerprint===route.operatingConditionFingerprint)}
module.exports={gameplayFingerprint,reviewedGameplay};
