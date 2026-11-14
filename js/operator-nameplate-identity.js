/* SUBTYPE operator nameplate identity layer.
 * Complements, never replaces, documented station-sign templates.
 * Designs generated here are SUBTYPE originals, NOT replicas of official signs.
 * Important: do not write into typing inputs or station-name nodes.
 */
(() => {
  'use strict';
  const sign = document.getElementById('station-sign');
  if (!sign || typeof MutationObserver === 'undefined') return;

  const jpFallbackStyles = new Set([
    'operator-private', 'operator-metro', 'operator-local',
    'operator-tram', 'operator-monorail', 'operator-new-transit',
    'local', 'tram', 'monorail'
  ]);
  // Only shared templates are customized outside Japan. Dedicated national /
  // company nameplates remain under their existing country-specific CSS.
  const sharedStyles = new Set([
    'kr-generic-rail', 'uk-national-rail', 'uk-tram', 'uk-metro',
    'fr-sncf', 'hk-mtr', 'hk-tram', 'hk-funicular', 'hk-light-rail',
    'hk-hsr', 'taiwan', 'thailand', 'local', 'tram', 'monorail',
    ...jpFallbackStyles
  ]);
  const palette = [
    { face: '#fffdf9', footer: '#253540' },
    { face: '#f6fafd', footer: '#17374c' },
    { face: '#fcf8fa', footer: '#3c2d39' },
    { face: '#f8fbf5', footer: '#293d36' },
    { face: '#faf9f5', footer: '#383833' }
  ];
  const stripe = [
    'var(--route-color,#2677a1)',
    'linear-gradient(90deg,var(--route-color,#2677a1) 0 82%,#e9edf0 82%)',
    'linear-gradient(90deg,#e9edf0 0 9%,var(--route-color,#2677a1) 9%)',
    'linear-gradient(90deg,var(--route-color,#2677a1) 0 48%,#e9edf0 48% 51%,var(--route-color,#2677a1) 51%)',
    'linear-gradient(90deg,var(--route-color,#2677a1) 0 67%,color-mix(in srgb,var(--route-color,#2677a1) 44%,white) 67%)',
    'linear-gradient(90deg,color-mix(in srgb,var(--route-color,#2677a1) 58%,white) 0 18%,var(--route-color,#2677a1) 18%)',
    'linear-gradient(90deg,var(--route-color,#2677a1) 0 25%,#f2f2f2 25% 28%,var(--route-color,#2677a1) 28%)',
    'linear-gradient(90deg,var(--route-color,#2677a1) 0 89%,#c7d5dc 89% 92%,var(--route-color,#2677a1) 92%)'
  ];
  const allOperators = window.TRT_JAPAN_LITE_INDEX?.operators || [];
  const ids = [...new Set(allOperators.map(item => String(item?.id || '')).filter(Boolean))].sort();
  const japaneseOrdinal = new Map(ids.map((id, index) => [id, index]));
  const keys = ['--jp-board-face', '--jp-board-footer', '--jp-board-line-bg'];

  const operatorHash = value => {
    let hash = 2166136261;
    for (const character of value) {
      hash = Math.imul(hash ^ character.codePointAt(0), 16777619);
    }
    return hash >>> 0;
  };
  const clear = () => {
    delete sign.dataset.operatorDesign;
    delete sign.dataset.operatorLayout;
    delete sign.dataset.operatorEdge;
    delete sign.dataset.operatorStripe;
    for (const key of keys) sign.style.removeProperty(key);
  };
  const update = () => {
    const country = document.documentElement.dataset.country || '';
    const id = String(sign.dataset.operatorId || '').trim();
    const style = String(sign.dataset.signStyle || '').trim();
    const japan = country === 'jp';
    const applicable = id && !sign.hasAttribute('data-photo-sign') &&
      id !== 'nishinihontetsudo' &&
      (japan ? jpFallbackStyles.has(style) : sharedStyles.has(style));
    if (!applicable) { clear(); return; }

    // Sorted roster indices guarantee distinct design combinations for the
    // currently registered Japan operators (up to 200), without hand-coded IDs.
    // For non-Japan or future operators, the stable ID hash supplies a fallback.
    const index = japan && japaneseOrdinal.has(id)
      ? japaneseOrdinal.get(id)
      : operatorHash(country + ':' + id) % 200;
    const layout = index % 5;
    const edge = Math.floor(index / 5) % 5;
    const band = Math.floor(index / 25) % 8;
    sign.dataset.operatorDesign = 'subtype';
    sign.dataset.operatorLayout = String(layout);
    sign.dataset.operatorEdge = String(edge);
    sign.dataset.operatorStripe = String(band);
    if (japan) {
      sign.style.setProperty('--jp-board-face', palette[layout].face);
      sign.style.setProperty('--jp-board-footer', palette[layout].footer);
      sign.style.setProperty('--jp-board-line-bg', stripe[band]);
    } else {
      for (const key of keys) sign.style.removeProperty(key);
    }
  };

  // Game.applyActiveBrand updates these fields on each actual operator change,
  // including through-services and free drive. Ignore our own dataset writes.
  new MutationObserver(update).observe(sign, {
    attributes: true,
    attributeFilter: ['data-operator-id', 'data-sign-style', 'data-route-id', 'data-photo-sign']
  });
  new MutationObserver(update).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-country']
  });
  update();
})();
