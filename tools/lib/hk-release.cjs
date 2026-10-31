const crypto=require('node:crypto');
function gameplayFingerprint(route){return crypto.createHash('sha256').update(JSON.stringify({id:route.id,direction:route.direction,stations:route.stations.map(s=>({id:s.id,ko:s.ko,ja:s.ja,en:s.romaji,position:[s.latitude,s.longitude],code:s.officialCode})),geometry:route.geometry,ways:route.directedSegments.map(s=>s.sourceWayIds)})).digest('hex')}
function reviewedGameplay(route,review){
 const proof=review.services[route.id];
 if(!(proof?.status==='PASS'&&proof.fingerprint===gameplayFingerprint(route)&&(!route.operatingConditionFingerprint||proof.conditionFingerprint===route.operatingConditionFingerprint)))return false;
 if(proof.method==='automated-game-completion'){
  const p=proof.completion,ids=route.stations.map(s=>s.id);
  return p?.status==='PASS'&&p.started===true&&p.routeIntegrity===true&&p.terminalReached===true&&p.errors===0&&p.completed===ids.length&&p.terminalStationId===ids.at(-1)&&JSON.stringify(p.typedStationIds)===JSON.stringify(ids)&&JSON.stringify(p.visitedStationIds)===JSON.stringify(ids.slice(1))&&p.engineFingerprint===require('./hk-game-completion.cjs').engineFingerprint();
 }
 return true;
}
module.exports={gameplayFingerprint,reviewedGameplay};
