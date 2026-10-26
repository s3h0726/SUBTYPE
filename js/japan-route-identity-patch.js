/* Canonical JR line guard for deployed and previously cached Japanese catalogs.
 * Loaded after the lightweight catalog and before app.bundle.js.
 * Never remove a real through-service: only retire exact duplicate physical cards.
 */
(() => {
  'use strict';
  const retiredIds = new Set([
    'line-11301--tokaidohonsen-tokyo-atami',
    'line-11311--chuohonsen-tokyo-shiojiri'
  ]);
  const canonicalChuoId = 'line-11311';
  const chuoRouteSource = './data/generated/routes/line-11311.json?v=20261027-chuo-east-42';
  const purge = rows => Array.isArray(rows)
    ? rows.filter(route => !retiredIds.has(route?.id))
    : rows;
  function repairChuoLite(rows) {
    if (!Array.isArray(rows)) return;
    const matches = rows.filter(route => route?.id === canonicalChuoId);
    if (matches.length !== 1) {
      console.error('Chuo East canonical route count:', matches.length);
      return;
    }
    const line = matches[0];
    line.line = { ...(line.line || {}), ja:'中央東線', ko:'츄오토선', en:'Chuo East Line' };
    if (line.lazySource) {
      line.lazySource = chuoRouteSource;
      line.stationCount = 42;
      line.geometryReady = true;
      line.playable = true;
      if (Array.isArray(line.searchStations)) {
        const start = line.searchStations.indexOf('高尾');
        if (start >= 0) line.searchStations = line.searchStations.slice(start);
      }
    }
  }
  // A legacy published chunk may still describe Honancho as a separate
  // passenger line. It remains available internally for branch geometry only.
  function internalizeMarunouchiBranch(rows) {
    if (!Array.isArray(rows)) return;
    for (const line of rows) {
      if (line?.id !== 'line-28002-honancho-branch') continue;
      line.parentLineId = 'line-28002';
      line.visibility = 'internal';
      line.playable = false;
      line.legacyRouteAliasFor = 'line-28002';
    }
  }
  const lite = globalThis.TRT_JAPAN_LITE_INDEX;
  if (Array.isArray(lite?.routes)) {
    lite.routes = purge(lite.routes);
    internalizeMarunouchiBranch(lite.routes);
    repairChuoLite(lite.routes);
    if (lite.routes.filter(route => route.id === 'line-11301').length !== 1)
      console.error('JR East Tokaido canonical route count:', lite.routes.filter(route => route.id === 'line-11301').length);
  }
  const workspace = globalThis.TRT_EMBEDDED_LINE_WORKSPACES;
  if (Array.isArray(workspace?.routes)) {
    workspace.routes = purge(workspace.routes);
    internalizeMarunouchiBranch(workspace.routes);
  }
  if (Array.isArray(workspace?.index?.routes)) {
    workspace.index.routes = purge(workspace.index.routes);
    internalizeMarunouchiBranch(workspace.index.routes);
  }
  const nationwide = globalThis.TRT_EMBEDDED_NATIONWIDE;
  if (Array.isArray(nationwide?.index?.routes)) {
    nationwide.index.routes = purge(nationwide.index.routes);
    internalizeMarunouchiBranch(nationwide.index.routes);
    repairChuoLite(nationwide.index.routes);
  }
  if (nationwide?.routes && typeof nationwide.routes === 'object') {
    for (const [key, payload] of Object.entries(nationwide.routes))
      if (retiredIds.has((payload?.route || payload)?.id)) delete nationwide.routes[key];
  }
})();
