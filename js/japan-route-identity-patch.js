/* JR East Tokaido Tokyo–Atami canonical route guard.
 * Runs after Japan catalog scripts, before app.bundle.js. This also cleans
 * stale prebuilt catalogs while the source-derived assets are republished.
 * Never alters stations, geometry, or through-service definitions. */
(() => {
  'use strict';
  const duplicateId = 'line-11301--tokaidohonsen-tokyo-atami';
  const canonicalId = 'line-11301';
  const purge = value => Array.isArray(value) ? value.filter(route => route?.id !== duplicateId) : value;
  const lite = globalThis.TRT_JAPAN_LITE_INDEX;
  if (Array.isArray(lite?.routes)) {
    lite.routes = purge(lite.routes);
    const count = lite.routes.filter(route => route.id === canonicalId).length;
    if (count !== 1) console.error('JR East Tokaido canonical route count:', count);
  }
  const ws = globalThis.TRT_EMBEDDED_LINE_WORKSPACES;
  if (Array.isArray(ws?.routes)) ws.routes = purge(ws.routes);
  if (Array.isArray(ws?.index?.routes)) ws.index.routes = purge(ws.index.routes);
  const nationwide = globalThis.TRT_EMBEDDED_NATIONWIDE;
  if (Array.isArray(nationwide?.index?.routes)) nationwide.index.routes = purge(nationwide.index.routes);
  if (nationwide?.routes && typeof nationwide.routes === 'object') {
    for (const [key, payload] of Object.entries(nationwide.routes))
      if ((payload?.route || payload)?.id === duplicateId) delete nationwide.routes[key];
  }
})();
