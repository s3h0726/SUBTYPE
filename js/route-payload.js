// Large route payloads remain independent lazy assets. Decompression restores
// the exact canonical JSON; it never simplifies or approximates geometry.
export async function decodeRoutePayload(payload){
 if(payload?.encoding!=='subtype-route-gzip-v1')return payload;
 const bytes=Uint8Array.from(atob(payload.data),c=>c.charCodeAt(0));
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 const decoded=await new Response(stream).json();
 if(decoded?.route?.id!==payload.routeId||decoded.route.countryId!=='kr')throw Error('한국 노선 압축 파일 식별자 불일치');
 return decoded;
}
