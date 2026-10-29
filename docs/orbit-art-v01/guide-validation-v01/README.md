# Guide validation foundation and completion inspection

Base: `1758fb42180ce94d327c797d07f6a4b3e146ba1c`. Implements the engine and integration from the [approved proposal](../tracing-validation-proposal/README.md), without inventing reviewed Arabic practice paths.

## Current live behavior

All four existing sheets remain ungraded, with **No score**, their exact original guides and existing Undo/Redo. The review registry contains `null` for ك، ل، ف، ي because source-coordinate centrelines, endpoint/dot regions, protected gaps/counters and calibrated acceptance fixtures have not been supplied. The user's reported review of the sheets and approval of the proposal are recorded; neither supplies those missing machine-readable annotations.

There is no new finish shortcut, success badge or enabled completion reveal. No URL/storage setting can supply reviewed rules. Bāʾ's existing validator is untouched.

## Implemented engine

`src/harf-xr/guide-validation/engine.ts` evaluates source-coordinate visible ink against versioned, source-bound reviewed annotations. Required paths use length-weighted coverage and both endpoint regions. Each dot requires its own finished, confined stroke. Segment checks reject crossing protected polygons, including sparse leaps between input events. Extra ink is measured by length, not event count. Repeated samples do not increase target coverage. Stroke order, direction, speed and pressure are not graded.

Rules require annotation and fixture approval records, matching source identity, valid bounded coordinates/parts and thresholds at least as strict as the proposed 90% coverage / 95% inside length. Sampling is at most 0.5% of glyph diagonal; the declared corridor must accommodate that spacing. Target and ink scoring have bounded budgets. Missing data, mismatch or excessive annotation size keeps validation unavailable.

Harf stores normalized source points alongside the unchanged original SVG paths. Eligibility recomputes on finished strokes, Undo, Redo and clear; an active/canceled stroke cannot trigger completion. Canceled partial ink remains visible and undoable but cannot supply required parts. Guide visibility is independent.

When a letter has valid reviewed data and passes, the integration shows **Practice guide completed** and **Inspect in 3D**. This opens the existing letter inspector via an internal, allowlisted selection and `#inspect-practice` intent. The intent is navigation, not a correctness credential. No new sculpture, scene, WebGL context, experience section, phase, geometry or texture is created. Inspection waits for the existing font readiness before mounting its renderer bridge. Return/Escape uses existing behavior.

## Evidence and limits

- [Engine checks](engine.json): synthetic geometry exercises coverage and inside-length boundaries; source/review rejection; missing parts/endpoints; separate dots; canceled/active input; protected crossings; sparse/dense and uniformly scaled input; extreme/invalid/over-budget ink; and strict inspection routing.
- [Actual Harf page checks](browser.json): synthetic annotations are intercepted in the test harness only. For each letter: completion control, internal 3D intent, canceled input, Undo/Redo eligibility, extra ink, reset, guide independence. Removing interception restores the actual ungraded production registry. Bāʾ stays isolated. These are not reviewed Arabic traces or full-scene 3D renders.
- [Existing history browser regression](history-regression.json): exact original stroke nodes/path order, new-branch invalidation, cancellation, clear, guide independence and narrow layout pass for all four real sheets.
- [Protected-source audit](source-audit.json): approved artwork, all outlines/font files and original Bāʾ modules match the base byte-for-byte.

Production build and focused integration, Harf ink/session and exact Arabic content checks pass. The inherited shared-chunk advisory remains. No current full-scene automation or Quest claim; the earlier full-scene startup timeout remains unresolved and was not retried. Physical Quest testing remains deferred by the owner.

The completion controls are tested infrastructure, not a claim that any Arabic sheet now checks correctness. Activation still requires the per-letter reviewed annotations and accepted/rejected calibration fixtures described in the proposal. The free-practice chunk is now about 12.71 kB minified / 5.18 kB gzip (previously 5.51 / 2.46); normalized ink points stay within the existing 12,000-point sheet budget. No GPU allocations are added. No merge or production deployment.
