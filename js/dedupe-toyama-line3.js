/* Keep only the official Toyama Tram Route 3 operating service in the playable list.
   The legacy physical line 99422 remains in source GIS for shared track segments. */
(function(){
  const data=globalThis.TRT_EMBEDDED_LINE_WORKSPACES;
  if(!data||!Array.isArray(data.routes))return;
  const old='line-99422',canonical='line-toyama-city-3';
  if(!data.routes.some(route=>route.id===canonical))return;
  data.routes=data.routes.filter(route=>route.id!==old);
  if(Array.isArray(data.index?.routes))data.index.routes=data.index.routes.filter(route=>route.id!==old);
  const kept=data.routes.find(route=>route.id===canonical);
  if(kept?.geometryReady!==true)console.error('Toyama Route 3: canonical service is not geometry-ready');
})();
