# CSS / JS Class Contract Audit

Generated during the DOM renderer refactor.

## Summary

- CSS class selectors found: 199.
- JS-created/query class contracts found by static scan: 63.
- Direct HTML string rendering is intentionally absent in `js/`; classes are now applied through DOM builders and feature constants.

## Resolved JS / CSS Contract Gaps

The previous audit found two JS-created classes without dedicated CSS rules. Both are now intentional contracts:

- `mob-egg-link`: styled as the spawn egg image link inside mob cards and kept as a semantic hook.
- `tooltip-below`: styled as a tooltip positioning state and covered by interaction tests.

## CSS-Only / Static Classes

Many CSS classes are not created directly in JS because they come from:

- static `index.html`, for example disclaimer and panel layout classes;
- body state classes from config/mode helpers;
- CSS descendant selectors;
- asset classes applied by constants or data-driven section metadata;
- future/reserved UI classes.

Examples verified as expected:

- `disclaimer`, `disclaimer-text`: static HTML.
- `compare-mode`, `stats-mode`, `time-since-mode`, `material-groups-mode`: body mode classes.
- `show-borders`: config-driven body class.
- `time-since-card-*`: data-driven card type classes.
- `*-grid`: section metadata classes.

## Removed During Cleanup

The first cleanup pass removed old selectors that no longer had a JS, static HTML, config, or data-driven owner:

- `stats-link`
- `mob-card-header`
- `time-since-card-wiki`
- `compare-mode-toggle`
- `compare-mode-btn`
- `wiki-link`
- `detail-meta*`
- `detail-counts*`

## Test Coverage

Interaction coverage now includes:

- compare select change;
- material groups collapse toggle;
- statistics sort click;
- card section collapse state;
- tooltip health rendering and below-position state.

## Audit Caveat

This audit is intentionally conservative. Static class scans can over-count CSS descendant selectors and under-count dynamic class composition, so future cleanup should still validate behavior with unit tests and the browser smoke test.
