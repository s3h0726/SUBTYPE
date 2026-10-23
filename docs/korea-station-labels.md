# Korean game station labels

Official station records, IDs, codes, coordinates, geometry, calling orders and release statuses remain unchanged. `koreanStationDisplayName` in `js/utils.js` formats Korean UI names only: NFC, then remove one final 역. Names such as 역삼 and 서울역사 are retained. 서울역 is retained for subway/commuter rail; conventional/high-speed rail displays 서울. Non-Korean names are returned unchanged.

Game labels, default typing targets, progress, map labels, service endpoint labels, free-drive options, CUSTOM views and records use this presentation policy. Original suffixed answers remain accepted by the typing controller. Progress, combo and input metrics use the short default answer. Source-editing fields retain explicitly labelled official names; no automatic display transformation is saved into those fields or source records.

The historical 시청 transfer whitelist retains its source citation. Later Line 1 integration replaces the old section IDs with 23 research-backed choices; the current browser check confirms TAB does not invent a transfer to the retired ID. Individual Line 1↔2 transfer validation remains pending.

Tests distinguish unit/controller tests, local instrumented browser tests, unmodified deployed-site UI tests and OS IME tests. The production browser regression checks displayed names against primary typing targets at every stop across all 13 legacy routes and 95 previews, plus custom journeys and free drive/TAB. Desktop and mobile refer to browser viewport/touch emulation. Actual operating-system IME and physical device tests are NOT_TESTED.

Korean card, Line 1 and Line 3 validation workflows retain generation and functional tests, require generated assets to match the source commit, and upload artifacts. They no longer rebase/autostash or independently push partial generated files into main. The existing Pages deployment remains responsible for publishing committed files. National railway release approval remains independent and INCOMPLETE.

The source-candidate browser diagnostic compares both visible station labels and the primary answer with the presentation policy, while continuing to type the original official suffixed name. Target IDs, stopping order, geometry and terminal completion assertions are retained. This tests backward-compatible input without treating official source spelling as the game display contract.

After Line 1 integration, the browser regression waits for research mode, loading completion, the complete preview index count and research contracts before traversing candidates. It exercises every operating choice (including integrated direction IDs), and verifies that refresh returns to the default selector while only explicitly integrated Line 1 research entries may appear there. This prevents reading a previous mode’s list during asynchronous loading.
