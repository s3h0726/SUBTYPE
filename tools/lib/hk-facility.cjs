const fs=require('node:fs'),crypto=require('node:crypto');
const {extractRelation}=require('./hk-geometry.cjs');
function buildFacility(file){const review=JSON.parse(fs.readFileSync(file,'utf8'));for(const source of review.sources)if(crypto.createHash('sha256').update(fs.readFileSync(source.file)).digest('hex')!==source.sha256)throw Error('Changed facility source '+source.file);
 const elements=JSON.parse(fs.readFileSync(review.sourceFile,'utf8')).elements,original=elements.find(e=>e.type==='relation'&&e.id===review.relationId);if(original?.version!==review.relationVersion)throw Error('Changed facility relation');
 const services=review.directions.map(d=>{const stops=d.stopIds.map(id=>review.stations.find(s=>s.id===id));if(stops.some(s=>!s))throw Error('Unknown facility stop');for(const id of d.wayIds)if(!original.members.some(m=>m.type==='way'&&m.ref===id))throw Error('Way outside source relation');
 const relation={...original,members:[...stops.map(s=>({type:'node',ref:s.sourceStopNodeId,role:'stop'})),...d.wayIds.map(id=>({type:'way',ref:id,role:''}))]};const candidate=extractRelation(relation,elements);candidate.sourceSnapshotDate=review.checkedAt;
 // Validate each one-way arm against the actual traversal, not the relation's mixed arm order.
 for(const id of d.wayIds){const w=elements.find(e=>e.type==='way'&&e.id===id);if(w.tags?.oneway!=='yes')continue;const geometry=candidate.segments.flatMap(s=>s.geometry);const node=e=>{const n=elements.find(x=>x.type==='node'&&x.id===e);return[n.lat,n.lon]};const index=e=>geometry.findIndex(p=>JSON.stringify(p)===JSON.stringify(node(e)));if(index(w.nodes[0])>=index(w.nodes.at(-1)))throw Error('Wrong direction on one-way railway '+id)}
 return{...d,candidate};});return{...review,services};}
module.exports={buildFacility};
