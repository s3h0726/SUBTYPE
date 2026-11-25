/* SUBTYPE · non-invasive controls for the redesigned journey screens.
 * All movement, typing validation, routing, search and saving remain owned
 * by the existing application controllers. */
(() => {
  'use strict';

  const typingInput = document.getElementById('typing-input');
  const signWriteZone = document.querySelector('#station-sign .nameplate-write-zone');
  if (typingInput && signWriteZone) {
    // The blank cells, not a separate textbox, are the visible writing surface.
    // Keep the real input untouched for native Korean IME composition.
    signWriteZone.addEventListener('click', (event) => {
      if (event.target === typingInput || typingInput.disabled) return;
      if (!document.getElementById('screen-game')?.classList.contains('active')) return;
      typingInput.focus({ preventScroll: true });
    });
  }

  const stationSelect = document.getElementById('free-drive-start-station');
  const stationSearch = document.getElementById('free-drive-start-query');
  const stationSuggestions = document.getElementById('free-drive-start-matches');
  if (!stationSelect || !stationSearch || !stationSuggestions) return;

  const normalize = (value) => String(value || '')
    .normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

  let cachedStations = [];
  const refreshSuggestions = () => {
    cachedStations = Array.from(stationSelect.options)
      .filter((option) => option.value !== '' && option.textContent.trim())
      .map((option) => ({ label: option.textContent.trim(), value: option.value }));
    const unique = new Set();
    const suggestions = document.createDocumentFragment();
    for (const station of cachedStations) {
      if (unique.has(station.label)) continue;
      unique.add(station.label);
      const suggestion = document.createElement('option');
      suggestion.value = station.label;
      suggestions.appendChild(suggestion);
    }
    stationSuggestions.replaceChildren(suggestions);
  };

  const applyExactSearch = () => {
    const wanted = normalize(stationSearch.value);
    if (!wanted) return;
    // A datalist selection is an exact station name. Do not move the train
    // while users are merely entering a partial station name.
    const found = cachedStations.find((station) => normalize(station.label) === wanted);
    if (!found) return;
    if (stationSelect.value !== found.value) {
      stationSelect.value = found.value;
      stationSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  stationSearch.addEventListener('change', applyExactSearch);
  stationSearch.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const wanted = normalize(stationSearch.value);
    const exact = cachedStations.find((station) => normalize(station.label) === wanted);
    const candidates = exact ? [exact] : cachedStations.filter((station) => normalize(station.label).includes(wanted));
    if (wanted && candidates.length === 1) {
      event.preventDefault();
      stationSearch.value = candidates[0].label;
      applyExactSearch();
    }
  });
  stationSelect.addEventListener('change', () => {
    const selected = stationSelect.selectedOptions[0];
    if (selected) stationSearch.value = selected.textContent.trim();
  });
  // The native selector is populated asynchronously by the existing
  // FreeDrive controller. Keep the autocomplete in sync without mutating
  // option values or their original route indices.
  const observer = new MutationObserver(refreshSuggestions);
  observer.observe(stationSelect, { childList: true, subtree: true, characterData: true });
  refreshSuggestions();
})();