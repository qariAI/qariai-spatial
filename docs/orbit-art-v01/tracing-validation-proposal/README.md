# Tracing validation and 3D reveal proposal

Status: proposed acceptance rules, not an enabled validator. The owner reported review and a pass for the current sheets, then delegated the next decision. No reviewed machine-readable practice paths or numerical tolerances have been supplied. Existing free practice remains unchanged.

## Recommended first release

Validate following the practice guide for ك، ل، ف، ي. Do not assess pen pressure, calligraphic mastery, stroke order or direction. Use the same approved outlines and existing 3D sculptures. Keep the Bāʾ exercise and its validator separate.

| Letter | Required semantic parts | Particular failure to reject |
| --- | --- | --- |
| ك | Main body; detached inner component | Body alone, or a bridge joining the detached component |
| ل | Main body | Missing upright or bowl |
| ف | Main body; upper dot | Missing dot, or ink crossing the open counter |
| ي | Main body; both lower dots | Missing either dot; a connecting stroke used as a substitute |

Semantic parts must be explicitly annotated. SVG contour count is not a part count: ف includes a counter contour; ي stores its dot pair in a compound source contour. Do not derive teaching strokes from those contour indices.

## Candidate measurement rules

These are starting values for calibration against accepted and rejected examples, not a claim of specialist approval:

- Express reviewed centreline paths and semantic part regions in the original glyph coordinate system. Reuse the board's existing uniform transform; never score in CSS pixels.
- Resample visible ink by arc length, with spacing at most 0.5% of glyph bounding-box diagonal. Repeated events or drawing over the same point must not increase coverage.
- For each body or detached curved part, cover at least 90% of the reviewed path length within a corridor of 2.5% of that diagonal. Require both reviewed endpoint regions; a missing terminal cannot hide inside the remaining 10%.
- At least 95% of total visible ink length must remain in the union of the allowed part corridors and dot regions. Check crossing segments, not just input-event points. No connecting bridge may cross a protected component gap or the ف counter.
- Treat each semantic dot separately. Require an intentional mark in its reviewed region; a tap is valid. A long stroke through two regions is not a substitute for two dots.
- Define the counter, component gaps, endpoints and dot regions explicitly per letter. Tolerances around their boundaries need example-based calibration; they must not silently shrink a counter or merge two parts.
- No deadline, required drawing speed, stroke-count constraint or direction score. Mouse, touch and stylus use the same normalized geometric criteria.

The required annotations are not present yet. Font silhouettes alone cannot establish centreline coverage or acceptable endpoint/dot regions. Keep validation disabled while any required annotation or calibrated threshold is missing.

## Completion and existing 3D artwork

After all criteria pass on a completed pointer stroke, show “Practice guide completed” and an “Inspect in 3D” action. Avoid “correct calligraphy” or a mastery badge. The action returns to the same selected Living Orbit letter and opens its existing inspector; it does not add a new section, duplicate a letter in the sequence, change geometry, or automatically move the camera while drawing.

Recompute from visible ink after Undo, Redo, new drawing and reset. An undone required part removes completion eligibility; Redo can restore it. A canceled active stroke cannot trigger completion. Hide/show guide does not affect the result. Clear resets completion. Source or rules mismatch keeps the sheet in ungraded mode. Do not enable this action before reviewed rules and their regression fixtures are available.

## Review fixtures required before activation

For every letter, supply accepted traces with normal mouse/touch/stylus variation and rejected traces for: blank sheet, isolated tap, missing body segment, missing required detached part/dot, wrong-position dot, scribble, shortcut chord, bridge across a component gap, and out-of-shape ink. Include ف counter crossings and ي with either dot missing. Pair each trace with the expected result and the relevant part or reason.

Check invariance under board resize, page scroll, device pixel ratio and event sampling rate. Exercise exact threshold boundaries, sparse long segments, Undo/Redo, canceled input, reset and source mismatch. Accepted examples must stay accepted and rejected examples rejected under those presentation changes. Freeze reviewed fixtures and a versioned rule set before connecting completion to 3D inspection.

## Source identity

All guides use Amiri Bold font SHA-256 `65e3e6fe6af66bb6d24959bd537a89ea35de14083f5a2e2290c246136c2b047b`.

| ID | Exact source path SHA-256 |
| --- | --- |
| kaf | `2c381807e055fc8a08b6e03f4e4c605e4279af6cbc26334e272763b862b8d8c4` |
| lam | `53c482d183e898a58f8cf983f20aeafb0db830b34600f7f14e04b8fc312c9a65` |
| fa | `a2b5545bbb9b7e2b61b924179f83e89258393d11a0529826890e1a399994ff92` |
| ya | `2605a72025fc298bb0081a93b8dd17d29ab5f46bf85e6b2a0411b23c590ee722` |

No application code, artwork, grading, reveal, deployment or merge changes accompany this proposal.

## Implementation follow-up

The owner approved this proposal. The [engine and completion integration](../guide-validation-v01/README.md) are implemented and tested with explicitly synthetic fixtures. The live sheets remain ungraded while per-letter annotations and calibration fixtures are absent.
