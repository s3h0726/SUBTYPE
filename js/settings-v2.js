/* Settings 2.0 enhancement: preview only; the existing app owns persistence. */
(() => {
  const form = document.getElementById('settings-form');
  if (!form) return;

  const status = document.getElementById('settings-save-state');
  const reset = document.getElementById('settings-reset');
  const appearance = window.matchMedia?.('(prefers-color-scheme: dark)');

  function previewTheme(theme) {
    if (!['dark', 'light', 'system'].includes(theme)) return;
    const resolved = theme === 'system' ? (appearance?.matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#07110e' : '#f5f4ef');
  }

  function announcePending(message = '변경사항이 있습니다. 변경사항 저장 버튼을 눌러 적용해 주세요.') {
    if (status) status.textContent = message;
  }

  form.addEventListener('change', event => {
    if (event.target?.name === 'theme') previewTheme(event.target.value);
    announcePending();
  });

  // Preserve the existing SUBTYPE save/initialization logic. This button
  // only stages the original default values for the existing save handler.
  reset?.addEventListener('click', () => {
    const fields = form.elements;
    fields.theme.value = 'dark';
    fields.stationAdvance.value = 'auto';
    fields.stationLabel.value = 'ja';
    fields.mapLabels.value = 'normal';
    fields.mapMode.value = 'geographic';
    fields.sound.checked = false;
    fields.motion.checked = true;
    fields.reducedMotion.checked = false;
    previewTheme('dark');
    announcePending('기본값을 선택했습니다. 변경사항 저장 버튼을 눌러 확정해 주세요.');
    document.getElementById('settings-appearance')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  });

  appearance?.addEventListener?.('change', () => {
    if (form.elements.theme.value === 'system') previewTheme('system');
  });
})();
