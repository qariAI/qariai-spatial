# Selected kāf → Harf free practice

Base: `0e457d2d904f298dce788b4688c87a91f9e07b62`. Existing isolated draft PR #35. Desktop-only continuation; no new section or page.

## Review

In the opt-in Living Orbit preview, select either **ك** and choose **Practice kāf / Harf Studio**. The existing `/harf-studio.html` opens with `practice=kaf`, showing the exact approved source form for free drawing. Return to Orbit retains the treatment flags and selects the kāf mirrored pair. Other letter selections retain the existing Bāʾ destination for now.

Direct review: `/harf-studio.html?calligraphyRelief=texture&orbitArt=study&practice=kaf`.

## Text and teaching integrity

- Import the unchanged reviewed `kaf-outline.json` used by the sculpture. The displayed SVG path is **byte-identical**, including its two compound contours and detached component. Only a uniform scale, translation and y-axis conversion fit the source into the board. No substitute font, rewritten path, inferred centreline or component simplification.
- This is explicitly **free practice, ungraded**. No score, prescribed stroke order, direction animation or completion badge. The page does not initialize Bāʾ's validator in kāf mode.
- Gold user ink is independent of the source form; drawing outside it is permitted. A pointer tap leaves ink, separate strokes persist, cancel/lost capture disarms input, and Try again clears the sheet. Guide visibility changes presentation only.
- Graded kāf guidance requires a qualified calligrapher to review an authoritative centreline, stroke/component order, tolerances and teaching feedback. None is fabricated in this change.
- An explicit link opens existing Bāʾ guided practice. Its original source, validator, ink, progress, desktop/spatial handlers and session lifecycle are untouched.

## Navigation safety

`practice` accepts one exact allowlisted value, `kaf`. Invalid, duplicate, external and arbitrary parameters are excluded. It is retained only on the fixed Orbit/SVG routes, not implicitly applied to the Bāʾ XR surface. With no valid practice query, existing Harf Bāʾ behavior remains default.

The Orbit link reads the current letter at click time. The existing duplicate-click/VR-start gates and `endBeforeNavigation` ordering remain; selection changes cannot replace an already captured destination or create a second teardown/navigation. Return restores the logical kāf pair, not a saved camera/phase across document navigation. The inspector and its view restoration remain unchanged.

## Evidence

- [Guide](kaf-guide.png), [free ink](kaf-free-ink.png): genuine desktop Chromium captures of the actual Harf page.
- [Browser report](browser.json): exact compound source path; no score/grade UI; multiple strokes; pointer cancellation; clear/guide toggle; mobile layout; flag/selection return query; explicit Bāʾ fallback; malformed mode rejection. Actual OrbitPracticeLink callback also tests live selection, duplicate clicks and session-end ordering.
- [Existing Bāʾ browser regression](ba-regression.json): original SVG and spatial body/dot/retry, guide toggle, denied-session fallback, narrow layout and cleanup.
- [Source audit](source-audit.json), [validation](validation.json): source preservation, build and focused regressions.

No full-scene rendering attempt is repeated: the earlier automation startup timeout remains unresolved. These are desktop Harf and navigation results, not Quest or full-scene performance evidence. Owner desktop review remains required. No merge, production, Android, competition-footage or artwork changes.

## Cost

Kāf practice uses one SVG source path and bounded user-ink samples (12,000 per sheet), not another WebGL renderer or sculptural mesh. Its lazy practice module is about 4.2 kB minified / 1.85 kB gzip, plus the shared original outline (~1.0 kB / .62 kB gzip) and small shared palette/routing modules. Bāʾ code loads only in Bāʾ mode. Existing calligraphy resolution and 3D budgets are unchanged.
