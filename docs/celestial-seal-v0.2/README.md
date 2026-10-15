# Celestial Seal v0.2 — composition study, awaiting visual approval

Isolated branch `prototype/celestial-seal-v0.2`, based on PR #25 head `c3bcddf37dc94baf9bbc3395b294a4c073979bbb`. Draft target: `prototype/celestial-seal-v0.1`. Optional `/celestial-seal.html` only. Phase 1 remains a visual study; no interactive illumination, transformation or additional phase.

## Composition changes

The seven evenly spaced radial markers become an asymmetric cluster, with long stems and bowls crossing at different physical elevations. `src/seal/layout.json` is the explicit placement table, in the existing XY plane / positive-Z relief coordinate system. The identity is still exactly **ك ل ف ي ف ل ك**, in source-data order; it is no longer encoded as a clockwise reading order. The repeated 14 bronze loops, 70 ticks and large central boss are removed. Three backing apertures, a single narrow rim and three incomplete low bronze ribs support the real glyph geometry. The open field is distributed between and behind strokes rather than concentrated in an empty center disc.

The complete excerpt is wider and set in a protected lower field. No lettering crosses it. A conservative rotated bounding-box clearance check includes the entire shaped run and all marks. Header space is reserved outside the canvas. The approach is deliberately restrained: a closer, near-frontal view of the whole composition and inscription, rather than a highly magnified crop through surrounding letters. Both camera views and drag-then-return behavior are checked.

## Arabic provenance and limits

Exact unnormalized Uthmani excerpt:

> كُلّٞ فِي فَلَكٖ يَسۡبَحُونَ

**Al-Anbiyāʾ, Qur’an 21:33, words 8–11; excerpt, not the complete verse.** Source: https://quran.com/21/33, approved word snapshot `docs/v1.4.7/source-words.json` (2026-10-13). The content checker compares every character with those word spans. No new text or remote transcription is introduced. All eight Living Orbit excerpts remain unchanged.

`src/seal/outlines.json`, bundled Amiri Bold font and font/shaping audit are byte-identical to PR #25. See `docs/celestial-seal/text-audit.json` and `scripts/generate-seal-outlines.py`. Amiri is SIL OFL 1.1; the original license remains bundled. Every motif receives only uniform XY scaling, whole-object rotation/translation, and Z elevation. The complete excerpt stays a single horizontal HarfBuzz-shaped RTL run, with its original contours, spacing, mark offsets and punctuation. Gold faces preserve the native contour; the existing bronze bevel is beneath them.

This is a **conservative font-derived sculptural composition**, not historically authenticated calligraphy. Layered motif intersections are spatial overlaps, not newly drawn Arabic joins or invented ligatures. Some isolated motif strokes intentionally pass behind other motifs. The Qur’anic inscription is separate and unobscured. A qualified Arabic calligrapher must review visual grouping, motif legibility and any future genuinely interwoven composition. No claim of expert approval is made.

## Before / after and capture evidence

- Before, unchanged v0.1: [`../celestial-seal/wide.png`](../celestial-seal/wide.png), [`../celestial-seal/close.png`](../celestial-seal/close.png).
- After, actual v0.2: [`wide.png`](wide.png), [`close.png`](close.png).
- Preview's comparison button shows the archived **v0.1 close view**, labelled explicitly; it is a DOM image and uses no second WebGL renderer.

Both after images are genuine 960×720 Chromium SwiftShader application renders, native CDP browser-view captures, without image editing or generated artwork. They show the actual final materials, geometry, inscription and camera states. The v0.1 images retain their original cameras and header overlay: these are version comparisons, **not identical camera/frustum comparisons**. The new close camera intentionally frames the entire sculpture. Small-resolution screenshots cannot certify fine diacritic readability on a headset; review the live desktop view as well.

Visual assessment: stronger shared silhouette and actual intersecting relief replace the separated clock arrangement. The sculpture remains recognizably assembled from Amiri font outlines; it does not achieve bespoke calligrapher-designed interweaving. The lower inscription is more integrated and the support ornament quieter. Artistic acceptance remains the owner's decision.

## Verification and budget

Run:

```sh
npm run build
node scripts/check-seal-content.cjs
node scripts/check-calligraphy-content.mjs
node scripts/check-harf-xr.cjs
node scripts/check-integration.cjs
HTTP_ONLY=1 node scripts/check-entry-pages.cjs
SEAL_CAPTURE_SMALL=1 SEAL_CAPTURE_BACKEND=view node scripts/check-seal-desktop.cjs
node scripts/check-seal-compare.cjs
```

The desktop reports contain actual renderer counters and camera/control checks. Final-geometry counters: **7 draw calls, 87,184 triangles, 6 geometries, 2 textures**, versus v0.1's 13 calls / 100,836 triangles / 12 geometries / 2 textures. Attribute/index storage **8,131,552 bytes (~7.75 MiB)** versus 8,644,240 bytes. Same 256² grain (~0.33 MiB with mipmaps) and 512² shadow; demand rendering, no particles, HDR maps, postprocessing or extra texture atlas. Driver allocation can differ. Idle browser RAF measurements are not scene FPS or headset performance.

The proven smaller native-view capture backend avoids the prior cloud large-surface capture timeouts. No Quest hardware, stereoscopic comfort, Windows GPU or sustained VR frame-budget validation was performed. Existing Living Orbit, Harf Studio, recorder, fonts and content modules are untouched. Build retains the existing large Three.js chunk warning. No production deployment or merge.
