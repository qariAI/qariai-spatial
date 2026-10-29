# Owner-accepted guide completion and 3D inspection

Base: `ddaf0e5e3ad1de1553b3db499bbd7737f08f5b01`. The owner explicitly confirmed qualified review and real-handwriting testing of the four-letter paths and tolerances. See the [attestation and evidence limits](REVIEW.md). This enables the previously built completion adapter in the existing opt-in draft experience.

## Behavior

Open `/harf-studio.html?calligraphyRelief=texture&orbitArt=study&practice=kaf` (or `lam`, `fa`, `ya`). The existing exact source guide gains a separate dashed practice-path overlay with undirected endpoint markers and dot regions. The original source path, detached components, counters, placement transform and 3D artwork are unchanged. The existing Hide guide action hides the source and overlay together.

The registered rules are geometrically identical to the four-letter candidate review pack. Only their version and review metadata change. Required path coverage, both endpoint regions, all semantic parts/dots, extra-ink limits and protected regions use the existing validation engine. Stroke order, direction, speed, pressure and calligraphic mastery are not scored.

After a completed stroke passes the guide-following rules, the sheet displays **Practice guide completed** and **Inspect in 3D**. That explicit action navigates to the same letter in Living Orbit and opens its existing inspector. It adds no letter, renderer, phase, scene or new Letter/Light section. Inspection navigation remains an intent, not a correctness credential or persistent completion badge.

Undo removes eligibility when a required part is removed; Redo recomputes and can restore it. Extra ink and active/canceled strokes suppress the action. Clear and reload start a new sheet. Guide visibility is independent of completion. No automatic camera move happens during drawing.

Activation requires the single supported `orbitArt=study` opt-in and a source-matching registered guide. Without the opt-in or with missing/mismatched review data, the existing ungraded sheet remains available. Original Bāʾ SVG/spatial tracing, ink and session handling are unchanged.

## Evidence

[Actual Harf browser report](browser.json) · [Completion screenshot](fa-completed.png) · [Engine checks](engine.json) · [History regression](history/browser.json) · [Protected sources](source-audit.json) · [Validation summary](validation.json).

- `scripts/check-approved-guide-browser.cjs` checks that registered geometry exactly matches the reviewed candidate data and reruns all 47 geometric fixture cases. Its browser checks use actual Harf pages and the registered rules, including all required parts, completion, cancellation, Undo/Redo, extra ink, guide toggle, reset/reload, narrow layout, non-opt-in/source-mismatch fallback and original Bāʾ isolation.
- The completion anchor is actually clicked. Only its destination document is intercepted to verify internal selection/hash navigation without re-running the heavy full-scene startup. This is not a new full-scene inspector-render or Quest test.
- `scripts/check-practice-history.cjs` verifies original SVG node/path restoration and current completion reset behavior for all four sheets.
- `scripts/check-guide-validation.cjs` keeps the 83 engine cases and source/review guards.
- Protected source audit pins the original artwork, outline/font and Bāʾ files byte-for-byte to the passed base. Exact Arabic excerpt and integration scope checks remain in force.

Automated traces are synthetic pointer input. The qualified-review/handwriting pass is the owner’s explicit attestation, not independently captured review logs. The local [calibration recorder](../calibration-recorder-v01/README.md) can retain future trace evidence separately.

The earlier full-scene automated startup timeout remains unresolved and was not retried. No new hardware performance or Quest claim. No merge, main, production, Android or competition-footage changes.

The first end-to-end harness reached the fāʾ completion capture before its 150-second global deadline. That run is retained in [browser-timeout.json](browser-timeout.json). Batching source-to-screen coordinate conversion per stroke and removing duplicate interpolation reduced fixture overhead; the subsequent run passed all four cases under the same bound with the same assertions. This was a Harf SVG harness change, not a repeated full-scene rendering attempt.

Production build and focused checks pass. The free-practice chunk is about 18.25 kB minified / 6.70 kB gzip (previously 12.71 / 5.18), including registered annotation data and its SVG overlay. No new WebGL resources are introduced. The existing shared-chunk build advisory remains.
