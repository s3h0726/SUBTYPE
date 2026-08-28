(function () {
  'use strict';

  const runtimeErrors = window.__TRT_RUNTIME_ERRORS__ = window.__TRT_RUNTIME_ERRORS__ || [];
  const updateErrorCount = () => { document.body.dataset.consoleErrors = String(runtimeErrors.length); };
  const recordRuntimeError = value => {
    const message = value instanceof Error ? `${value.name}: ${value.message}` : String(value || 'Unknown runtime error');
    runtimeErrors.push(message);
    updateErrorCount();
  };
  const nativeConsoleError = console.error.bind(console);
  console.error = (...args) => {
    recordRuntimeError(args.map(value => value instanceof Error ? value.message : String(value)).join(' '));
    nativeConsoleError(...args);
  };
  addEventListener('error', event => recordRuntimeError(event.error || event.message));
  addEventListener('unhandledrejection', event => recordRuntimeError(event.reason));
  updateErrorCount();

  const aliases = { play: 'rail-map', select: 'rail-map', setup: 'game-setup', custom: 'custom-list', stats: 'records' };
  const titles = { home: 'SUBTYPE — 일본 철도 타이핑', 'rail-map': '노선 선택 — SUBTYPE', 'game-setup': '운행 설정 — SUBTYPE', game: '운행 중 — SUBTYPE', 'custom-list': '나만의 노선 — SUBTYPE', 'custom-editor': '노선 만들기 — SUBTYPE', records: '운행 기록 — SUBTYPE', settings: '설정 — SUBTYPE', credits: '데이터 출처 — SUBTYPE', result: '운행 결과 — SUBTYPE' };
  const screens = () => Array.from(document.querySelectorAll('[data-screen]'));
  const normalize = name => aliases[name] || name || 'home';
  const exists = name => screens().some(screen => screen.dataset.screen === name);

  function showScreen(requested, options) {
    const settings = Object.assign({ history: 'push' }, options);
    const name = exists(normalize(requested)) ? normalize(requested) : 'home';
    screens().forEach(screen => {
      const active = screen.dataset.screen === name;
      screen.classList.toggle('active', active);
      screen.setAttribute('aria-hidden', String(!active));
    });
    document.body.dataset.currentScreen = name;
    document.title = titles[name] || 'SUBTYPE — 일본 철도 타이핑';
    if (settings.history !== 'none') {
      const method = settings.history === 'replace' ? 'replaceState' : 'pushState';
      try { history[method]({ screen: name }, '', `#${name}`); } catch (error) {
        // file:// and some embedded preview environments may reject History API URLs.
        try { location.hash = name; } catch {}
      }
    }
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.dispatchEvent(new CustomEvent('trt:screenchange', { detail: { name } }));
    return name;
  }

  function initialScreen() {
    const hash = location.hash.slice(1);
    return exists(normalize(hash)) ? normalize(hash) : 'home';
  }

  function bind() {
    if (document.documentElement.dataset.navigationBound) return;
    document.documentElement.dataset.navigationBound = 'true';
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-nav]');
      if (!trigger) return;
      event.preventDefault();
      showScreen(trigger.dataset.nav);
    });
    addEventListener('popstate', event => showScreen(event.state?.screen || location.hash.slice(1), { history: 'none' }));
    showScreen(initialScreen(), { history: 'replace' });
  }

  window.TRTNavigation = { showScreen, initialScreen };
  bind();
}());
