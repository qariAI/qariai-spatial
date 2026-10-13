# Sourced Naskh Bāʾ practice

Only Harf Studio on `prototype/harf-studio-v0.2-xr` is changed. The previous illustrative curve is replaced by the **actual isolated U+0628 outline from Amiri Bold 1.002**, a Naskh Arabic typeface by the Amiri Project Authors. The body and dot are retained as separate contours under one uniform 0.6 scale and coordinate-system translation/reflection. This reflection converts font Y-up to board Y-down; it does not reverse Arabic lettering. Neither glyph contour is stretched, embellished or substituted with Latin cursive. Font outline copyright and SIL OFL 1.1 terms accompany the derivative paths in [OFL-Amiri.txt](OFL-Amiri.txt).

The source glyph's real stroke-width variation and diamond dot define the visible letter. A manually fitted practice centreline runs from the right entry down into the bowl, sweeps left, and finishes at the left terminal. Its 505 checked points and the dot target lie inside the original glyph. That establishes geometric correspondence, **not certified penmanship or stroke order**. Amiri is a typeface, not an authored teaching exemplar. Nib angle, pressure, lifting conventions and educational stroke sequence still require qualified Arabic calligrapher review.

## Shared definition and desktop access

`src/harf-xr/letters/ba.json` contains the original body/dot outlines, cubic practice path, checkpoints, dot target, copy, source project/pinned asset URLs and font checksum. `definition.ts` creates the SVG path and arc-length-resampled centreline; `tracing.ts` uses the same 181 samples for both desktop and XR. Arc-length sampling prevents short terminals from counting disproportionately toward progress. No runtime font download, shaping dependency, new GPU texture, geometry or particle effect is added.

The SVG page stays at `/harf-studio.html`. Its HTML moves from `public/` to a Vite HTML entry so a small SVG-only module can import the **same** definition and tracing state as XR. It does not import Three.js or require WebGL. Existing desktop controls, body/dot completion, guide visibility and demonstration remain. The demo is cancellable by Try Again. Root `/` remains Living Orbit; its source is untouched.

The spatial page stays at `/harf-studio-xr.html`. Slate ink surface, fine ruled lines, restrained gold trail and high-contrast dotted centreline expose the authentic contour. Ink is clipped to the body contour; clipping applies to practice marks, never to the source outline or sacred wording (none is present). The real diamond dot appears only as completed ink after the body and separate placement step. Progress labels are moved below its full bounds. START/FINISH positions come from the definition.

Hand pose acquisition, plane placement, pinch/release debounce, two-hand ownership, Try Again / Leave VR, XR session lifecycle and resource disposal retain their prior behavior. GPU resources and board dimensions are unchanged. Desktop and XR still provide basic proximity/direction feedback rather than a quality score.

## Results

- Production build and TypeScript pass; inherited large Three.js chunk warning remains.
- Existing tracing/pinch/session simulations pass on the new path.
- Desktop SVG body/dot/reset/guide and spatial pointer body/dot/retry pass.
- Denied-hand-feature session fallback, narrow viewport and page-exit browser smoke check pass with no JS errors.
- [Actual spatial desktop capture](desktop-complete.png) shows the pointer-completed body and dot. The screenshot was taken after simulated denied XR entry and desktop tracing; **it is not a headset capture**.
- [Provenance check](provenance-check.json) confirms exact source outline transform, 505 interior centreline samples, dot target and font checksum. Reproduce with `python3 scripts/verify-harf-outline.py /path/to/unmodified/Amiri-Bold.ttf` (fontTools development dependency). No source font binary is bundled into the new runtime.
- `node scripts/check-harf-xr.cjs` and `node scripts/check-harf-desktop.cjs` remain reproducible. Browser movement is batched through actual pointer handlers with real down/up events; this tests state transitions, not real-time motion fidelity.

Real Quest joint availability, pinch ergonomics, comfortable reach, binocular lettering sharpness, frame timing, suspend/resume and hand-operated exit remain untested. The existing headset acceptance checklist applies. A live Vercel branch preview URL has not been verified; use the PR's deployment checks if automation supplies a preview. No manual deployment, production change or merge is performed.
