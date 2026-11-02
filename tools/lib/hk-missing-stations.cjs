// The only permitted baseline station metadata extension in this release:
// include the newly documented 507P call in Tin King's existing interchange.
// Every other byte of the parsed station record must still match the baseline.
function with507PTransfer(stations){return stations.map(s=>s.transferReview?.stationId==='hk-lr-140'?{...s,transferReview:{...s.transferReview,lineIds:[...s.transferReview.lineIds,'hk-light-rail-507p']}}:s)}
module.exports={with507PTransfer};
