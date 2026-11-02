'use strict';
const zlib=require('node:zlib');
const decode=payload=>payload?.encoding==='subtype-route-gzip-v1'?JSON.parse(zlib.gunzipSync(Buffer.from(payload.data,'base64'))):payload;
const encode=route=>{if(!route.id.startsWith('kr-bus-ts-bis-'))return{route};const bytes=zlib.gzipSync(Buffer.from(JSON.stringify({route})));bytes[9]=255;return{encoding:'subtype-route-gzip-v1',routeId:route.id,data:bytes.toString('base64')}};
module.exports={encode,decode};
