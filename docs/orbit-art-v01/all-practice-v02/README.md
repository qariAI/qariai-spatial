# Selection-aware free practice: ك ل ف ي

Base: `e46013ee024c41c9a475c73568e4239e0780b9f1`. Extends the reviewed kāf flow to the other three existing Orbit forms on isolated draft PR #35. No new page, experience phase, grade or artwork.

## Review

Select any Orbit letter with `orbitArt=study`, then use **Practice [letter] / Harf Studio**. The existing Harf page displays its approved outline for free drawing. Returning preserves the treatment flags and selects the corresponding mirrored pair, or centre yāʾ.

| Form | Fixed query | Return selection | Evidence |
| --- | --- | --- | --- |
| ك Kāf | `practice=kaf` | 0 / 6 | Existing kāf regression retained |
| ل Lām | `practice=lam` | 1 / 5 | [Guide](lam-guide.png) |
| ف Fāʾ | `practice=fa` | 2 / 4 | [Guide](fa-guide.png) |
| ي Yāʾ | `practice=ya` | 3 | [Guide](ya-guide.png) |

Each query uses `/harf-studio.html?calligraphyRelief=texture&orbitArt=study&practice=...`.

## Integrity

The shared free-practice module imports the **unchanged** approved kāf outline and `letter-outlines.json` used by the existing sculptural assets. Every source path is reused byte-for-byte, including all winding, contours, detached marks and counters. The only placement operation is the same uniform scale, translation and y-axis conversion already used by kāf practice.

- Lām retains its original single contour.
- Fāʾ retains all three source contours: body, dot and counter. An explicit browser fill test verifies the counter remains open.
- Yāʾ retains the original body and compound dot-pair contour. Its two dots are not split, regenerated or repositioned.
- Kāf's path, detached component and free drawing behavior remain unchanged.

The drawing/pointer implementation is shared with the reviewed kāf mode. There is no score, inferred centreline, stroke-order animation or completion badge. Calligrapher review remains required before any graded guidance. Bāʾ's original validator, ink, definitions, desktop/spatial handlers, session lifecycle and explicit guided-practice link are unchanged.

## Routing

A fixed registry maps only `kaf`, `lam`, `fa` and `ya` to the four source-backed logical selections. Duplicate combinations, unsupported aliases, prototype names and external values are rejected. No query forwards an arbitrary path or asset. The existing XR Bāʾ route does not inherit these desktop practice modes. With no selection or no opt-in artwork mode, Orbit retains its established Bāʾ practice destination.

The existing OrbitPracticeLink still reads the live selection at click time and retains its duplicate, VR-start and session-end gates. Return preserves logical selection and flags; it does not add storage of a camera pose or phase across documents.

## Validation

[Browser checks](browser.json) cover all four actual Harf pages: exact paths, 480 source-fill comparisons per letter, all source bounds inside the board, explicit open fāʾ counter, ungraded multi-stroke drawing, cancellation, clear/guide toggles, mobile layout, correct return selections and invalid-mode Bāʾ fallback. Screenshots are genuine Chromium page captures.

[Kāf regression](kaf-regression.json) also checks actual live navigation callback selection changes, duplicate prevention and XR teardown ordering. [Bāʾ regression](ba-regression.json) passes original SVG/spatial body-dot/retry, denied-session fallback and cleanup.

Production build, exact Amiri extraction/hash checks, eight locked Qur'anic excerpt checks, scope, unchanged selection/phase/inspection logic, Harf ink/session, navigation, menu and recovery tests pass. See [source audit](source-audit.json) and [validation](validation.json). The shared-chunk advisory is inherited.

The previous full-scene automation startup timeout remains unresolved and was not retried. These results are desktop Harf/routing evidence, not Quest or full-scene performance evidence. Physical Quest work remains deferred by the owner. No merge, main, production, Android or competition-footage changes.

## Compatibility and cost

Existing `practice=kaf` URLs remain valid. One renamed/generalized free-practice module serves all four modes; no per-letter drawing implementations or new 3D assets are created. The current free-practice chunk is ~4.77 kB minified / 2.22 kB gzip, with a shared original outline chunk ~4.76 kB / 2.20 kB gzip. No WebGL renderer, geometry buffer or texture is allocated by this SVG extension. All 3D artwork, shader, lighting and inspection sources stay fixed.

Stop for owner desktop visual review.
