/* SUBTYPE: user-defined per-line badges from the Korean name editor.
 * Presentation-only: this decorates existing route cards without touching
 * the gameplay data, click targets, route ordering, or generated app bundle.
 */
(() => {
  'use strict';
  const VALID_COLOR = /^#[0-9a-fA-F]{6}$/;
  const DEFAULT_COLOR = '#2676BA';
  const MAX_LABEL_LENGTH = 30;
  const byRoute = new Map();
  const byFamily = new Map();

  function text(value) {
    return typeof value === 'string' ? value.trim().slice(0, MAX_LABEL_LENGTH) : '';
  }
  function foreground(background) {
    const components = [1, 3, 5].map(i => parseInt(background.slice(i, i + 2), 16) / 255)
      .map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return components[0] * 0.2126 + components[1] * 0.7152 + components[2] * 0.0722 > 0.179
      ? '#142337' : '#FFFFFF';
  }
  function readLabels(source) {
    byRoute.clear();
    byFamily.clear();
    for (const [id, data] of Object.entries(source?.lines || {})) {
      const label = text(data?.label);
      if (!label) continue;
      const color = VALID_COLOR.test(data?.labelColor || '') ? data.labelColor.toUpperCase() : DEFAULT_COLOR;
      byRoute.set(id, {label, color, foreground: foreground(color)});
    }

    // A few countries show one card for multiple operating directions.
    // Resolve a label set on a member route to its visible family card.
    for (const catalog of [globalThis.TRT_KOREA_INDEX, globalThis.TRT_HONG_KONG_INDEX]) {
      for (const route of catalog?.routes || []) {
        const item = byRoute.get(route.id);
        if (!item) continue;
        for (const family of [route.passengerLineId, route.canonicalLineId]) {
          if (family && !byRoute.has(family) && !byFamily.has(family)) byFamily.set(family, item);
        }
      }
    }
  }
  function badgeFor(card) {
    const id = card.getAttribute('data-route');
    if (id) return byRoute.get(id);
    const krFamily = card.getAttribute('data-kr-family');
    if (krFamily) return byRoute.get(krFamily) || byFamily.get(krFamily);
    const hkFamily = card.getAttribute('data-hk-line-family');
    if (hkFamily) return byRoute.get(hkFamily) || byFamily.get(hkFamily);
    if (card.hasAttribute('data-hk-tram-family'))
      return byRoute.get('hk-tramway') || byFamily.get('hk-tramway');
    return null;
  }
  function decorate(grid) {
    for (const card of grid.querySelectorAll(':scope > .line-card')) {
      const badge = badgeFor(card);
      let node = card.querySelector(':scope > .route-user-label');
      if (!badge) { if (node) node.remove(); continue; }
      if (!node) {
        node = document.createElement('span');
        node.className = 'route-user-label';
        node.setAttribute('aria-label', '노선 라벨');
        card.prepend(node);
      }
      node.textContent = badge.label;
      node.style.setProperty('--route-label-bg', badge.color);
      node.style.setProperty('--route-label-fg', badge.foreground);
    }
  }
  function init() {
    const grid = document.getElementById('route-grid');
    if (!grid) return;
    const refresh = () => decorate(grid);
    // The route chooser rebuilds the grid on search, filtering, country change and selection.
    // Observing only the grid's immediate children avoids self-triggering on badge insertion.
    new MutationObserver(refresh).observe(grid, {childList: true});
    fetch(new URL('data/editor-overrides.json', document.baseURI), {cache: 'no-store'})
      .then(response => { if (!response.ok) throw Error('HTTP ' + response.status); return response.json(); })
      .then(source => { readLabels(source); refresh(); })
      .catch(error => console.warn('Route card labels unavailable:', error));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
