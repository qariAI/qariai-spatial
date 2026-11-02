# Clearer guide-following feedback

Base: `e1fd18fc9b660337c5f99f90b39eaf3dd0c0152f`. Presentation-only follow-up to the passed completion flow. Accepted rule data, validation decisions, thresholds, original silhouettes, 3D artwork, source/ink transforms, navigation and Bāʾ remain fixed.

The existing Harf side panel now lists the current letter's semantic guide parts with text states: **To trace**, **Traced**, or **Check ink first**. Completed parts' practice overlays dim; unresolved parts retain their original emphasis. The original letter artwork and ink do not dim. Guide visibility still hides the whole source/overlay independently.

Feedback identifies what remains: the main path and endpoint markers, kāf's detached inner stroke, fāʾ's upper dot, or either/both lower yāʾ dots. It explains separate dot placement without prescribing stroke order or direction. Extra ink prompts Undo or Try again. Protected-region crossings explain the applicable gap, counter or dot separator. Canceled partial strokes are identified as not contributing toward required coverage.

Part states only use information supplied by the unchanged engine. When that engine stops early for a protected-region or input error, the UI marks parts unchecked rather than inferring coverage from an empty missing-parts array. During an active stroke, the last checked part states remain visible and the completion action stays hidden; states update at the existing stroke/Undo/Redo/reset checks. No new score, mastery claim, validation tolerance, guide path, grading activation or experience section is introduced.

The live status communicates the actionable message. The separate part list is labeled as checked after finished strokes and uses text as well as opacity. Reassigning the unchanged static disclaimer is avoided to reduce redundant live-region updates.

Focused verification extends the actual four-letter Harf browser harness for missing-part messages, part/overlay states, Undo/Redo and extra-ink guidance. It still covers completion, strict opt-in/source fallbacks, reset/reload, narrow layout, navigation intent and original Bāʾ isolation. Browser traces are synthetic; no new qualified-review or handwriting-calibration claim. No repeated full-scene or Quest testing.

No merge or production deployment. Existing draft PR #35 only.

## Evidence and limits

[Combined completed browser cases](combined-browser.json) · [Original partial run and navigation timeout](browser-navigation-timeout.json) · [Targeted remaining cases](remaining-cases/browser.json) · [Missing-dot screenshot](remaining-cases/fa-awaiting-dot.png) · [Completed-guide screenshot](remaining-cases/fa-completed.png) · [Protected-source audit](source-audit.json) · [Validation](validation.json).

The extended run completed kāf/lām, then hit a 10-second navigation timeout returning to the fāʾ document. No page errors were recorded; the exact blocking request/cause is not established. Only the remaining fāʾ/yāʾ cases were rerun, and both passed. The combined report retains completed evidence from both runs and does not present it as a single-run pass. No assertion or application navigation behavior was changed to obtain the result.

Production build passes. Forty-eight protected sources, including accepted engine/rules, font/outline/artwork, placement, ink, routes and original Bāʾ implementation, remain byte-identical. The free-practice chunk is about 21.52 kB minified / 7.82 kB gzip (previously 18.25 / 6.70). No WebGL resources are added. The inherited shared-chunk advisory remains.
