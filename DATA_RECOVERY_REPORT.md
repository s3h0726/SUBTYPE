# SUBTYPE Data Recovery Report

## Diagnosis

The railway source files were not deleted. Git commit `4dff800`, the current working tree, and the preserved recovery archive contain the same nationwide inventory. The deployed page also eventually reports 601 playable catalog entries; the apparent loss was a slow loading/visibility issue, not an empty dataset replacement.

## Inventory

| Scope | Operators | Lines | Canonical stations | Line-station relations |
|---|---:|---:|---:|---:|
| Last known good (`4dff800`) | 164 | 596 | 8,824 | 10,590 |
| Recovered/current nationwide source | 164 | 596 | 8,824 | 10,590 |
| Curated embedded source | 25 | 103 | 2,760 | 1,835 |

Missing lines: **0**  
Missing relations: **0**  
Unexplained data loss: **0**

## Preservation and safety

- Broken/current snapshot: `recovery-broken-current-state-20260825.zip`
- Build baseline: `data/RECOVERY_BASELINE.json`
- Recovery audit: `node tools/audit-data-recovery.js`
- Static build is blocked if operators, lines, or line-station relations fall by more than 10%.
- Generated files are written through a temporary file and replaced only after source validation passes.

## Deployment observation

On 2026-08-25 the live GitHub Pages page loaded **601 catalog entries** after a long initial wait and produced no console errors during the check. This proves the production loader can reach the data, but does not by itself approve deployment of the current local working tree.

The distributable also embeds the nationwide index and all 596 route detail files in `js/nationwide-data.js`. Therefore opening the extracted `index.html` no longer falls back to only the 103 curated routes when JSON `fetch()` is unavailable.
