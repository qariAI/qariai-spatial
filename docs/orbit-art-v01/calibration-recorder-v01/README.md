# Local tracing calibration recorder

Open [recorder.html](recorder.html) in a browser. It is a self-contained developer review artifact with all four original outlines and candidate path data embedded. It has no external assets, upload endpoint, grading engine or application activation control. If a browser blocks local file pages, serve this directory on localhost and open `recorder.html` there.

## Record an example

1. Select ك، ل، ف or ي. Draw with mouse, touchscreen or stylus over the exact source form. Candidate paths can be hidden independently.
2. Choose the expected result after reviewing the trace. The tool does not infer or preselect an outcome. Add the review reference and observations as appropriate.
3. Export trace JSON. Capture clean traces and deliberate missing components/dots, shortcuts, protected-region crossings and extra ink. Keep expected outcomes tied to the actual exported trace.

Each letter retains its current recording and labels while switching letters. Undo removes the last stroke; Clear resets that letter's recording and labels. Export is disabled while drawing, for empty recordings, or before an expected outcome is chosen. Recording is limited to 12,000 source-coordinate points per letter. Canceled partial strokes retain their cancellation marker.

Exports include exact path/font identity, candidate revision, original glyph coordinates (x right, y up), pointer type, strokes/cancellation flags and reviewer-entered expected outcome/reference/notes. Labels are explicitly marked user-supplied and not independently verified by the tool. Exporting does not mark annotation approval, certify teaching correctness, enable completion, or unlock 3D.

## Review and activation record

Automatic approval review initially rejected enabling live completion because the earlier pass did not establish qualified review and real-handwriting calibration. Those first uncommitted activation edits were restored, and this recorder was built independently.

The owner subsequently explicitly confirmed qualified review and real-handwriting testing of the four-letter paths and tolerances. That new attestation supports the [separate completion activation](../guide-completion-v01/REVIEW.md). Reviewer identity and raw handwriting recordings were not supplied; they are not invented or represented by the automated recorder tests.

This recorder remains independent of activation. Its user-entered labels and exported recordings do not automatically approve rules or modify the live registry. The source silhouettes and candidate annotation geometry remain unchanged.

## Reproduce checks

`python scripts/build-calibration-recorder.py` rebuilds the self-contained artifact from the fixed original sources and existing draft annotation JSON. `node scripts/check-calibration-recorder.cjs` serves that one artifact over loopback and exercises real browser pointer events and downloads. It checks source identity, normalized coordinate export, explicit manual labels, cancellation, per-letter retention, Undo/Clear, guide visibility, narrow layout and absence of external requests.

Browser-generated test traces are synthetic test inputs, not collected human handwriting or qualified-review evidence. The screenshot shows the recorder with a labeled synthetic partial trace. The environment disallows `file:` browser navigation, so automation uses localhost; it does not claim a successful local-file navigation test.
