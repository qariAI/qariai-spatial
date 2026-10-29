# Undo / Redo for ungraded Harf practice

Base: `c7ea4589954f5a7c3e8cfa1e21541bef6a23531c`. Existing isolated draft PR #35. Applies only to free practice for ك ل ف ي.

## Behavior

- **Undo last stroke** removes the latest complete or canceled partial stroke.
- **Redo** restores the exact original SVG stroke node and path in its original order. No resampling, smoothing or recoloring is introduced.
- A new stroke after Undo clears the redo branch. Drawing history remains independent of guide visibility.
- Both actions are disabled while a pointer stroke is active, and when their corresponding stack is empty. Cancellation disarms the pointer and makes its retained partial stroke undoable, preserving prior cancellation behavior.
- **Try again** clears the sheet and both histories. Existing pointer capture cleanup, gold pen parameters, uniform source placement and 12,000-sample sheet budget remain.
- Free practice remains explicitly ungraded. No correctness detection, completion badge, finish/reveal action or new 3D behavior is added. The owner chose to wait for reviewed correctness validation before a 3D completion reveal.

## Evidence

[Genuine page screenshot](fa-history.png) · [All-four browser report](browser.json) · [Source audit](source-audit.json) · [Validation](validation.json).

The actual desktop tests cover empty states; multiple Undo and Redo operations; exact path order and original node identity; redo invalidation by new drawing; disabled actions during drawing; pointer cancellation; guide independence; clearing both stacks; all four modes; narrow layout; and no history controls in Bāʾ mode. The screenshot's generic gold lines are synthetic input used to test history, not proposed source lettering or graded handwriting.

The entire existing source-form and ungraded presentation setup is byte-identical before the history controls are inserted. Source audits also preserve all approved outlines, 3D artwork, inspector, stars, Qur'anic content implementation, routing and Bāʾ validator/ink/session code. Production build, exact locked content, source scope, Harf logic/ink/session and integration checks pass. The shared-chunk size advisory is inherited.

## Cost and limits

History retains original SVG nodes and a sample count per stroke. Undo subtracts visible samples; Redo restores them; starting a new branch drops retained redo nodes. Visible plus redo-history samples remain bounded by the existing sheet budget. No new WebGL context, artwork geometry, material or texture. The free-practice chunk grows from ~4.77 to ~5.51 kB minified (~2.22 to ~2.46 kB gzip).

Desktop practice tests only. No new full-scene automation or physical Quest claim; the earlier full-scene startup timeout remains unresolved. No merge, main, production, Android or competition-footage changes. Stop for desktop visual review.
