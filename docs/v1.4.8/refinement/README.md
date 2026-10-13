# v1.4.8 hero-band refinement — pending visual approval

The resumed workspace retained the edits, bundled font, baseline fixture and prior screenshots. No assets were downloaded or recreated. The working source was validated and the existing v1.4.8 branch is updated; no new version, merge or production deployment is performed.

## Scope and validation

New bevel recolouring, stronger ridge relief, reduced roughness, near emissive lift and closed geometric gutter finials apply only to the hero band (index 1). Supporting bands retain their previous near treatment. The existing far stardust emission rises from 0.42 to 0.52 (approximately 24%) across the artwork, with unchanged proximity thresholds, damping and representation. No readable text is added to the far shader.

The helper recolours RGB in a native, fully shaped Amiri mask. Alpha is never rewritten. The final hero face uses one mask pass, avoiding duplicate fill coverage at antialiased edges. `check-hero-masks.cjs` tested all eight excerpts at 55, 100 and 190px: all 24 comparisons retain identical native alpha coverage, nonzero ink and actual RGB recolouring. This validates the mask before atlas baking; it does not replace expert Arabic typography review or test every UV sampling condition. The final atlas alpha still encodes the inherited LOD signal.

Production build passes, retaining the existing large-bundle warning. The Arabic-content check confirms all eight spans match independently captured source words, including diacritics and pause marks. `git diff --check` passes. App.tsx, CSS, content data, face/backing geometry and particle geometry are unchanged from commit 322841a. The unchanged application retains choreography, two phases, planets, UI actions, camera and WebXR hand code. The earlier v1.4.8 desktop interaction/layout results remain archived; a new full real-time desktop regression pass is not claimed for this refinement.

Commands:

- `npm run build`
- `node scripts/check-calligraphy-content.mjs`
- `node scripts/check-hero-masks.cjs` (local bundled font; no downloads)
- `git diff --check`

`validation.json` records scope and source hashes. `final-mask-verification.json` records all 24 mask checks.

## Screenshots and deterministic method

The retained [before far](before/far.png), [before close](before/close.png), [prototype far](after/far.png), and [prototype close](after/close.png) are archived earlier-session captures. Both close camera-state files show [0,26,78]. The fresh scenes were paused and unselected. The after images and atlas predate the final single-pass fill fix; **they are prototype evidence, not screenshots of the final committed source**. Some software-composited HUD layers are missing in the prototype images; App.tsx and CSS were not changed.

The deterministic method clicks the existing camera controls, runs the unchanged frame subscribers at fixed 50ms steps, suppresses intermediate GPU draws, then renders the settled final frame. It does not override camera positions or change App.tsx. WebGL canvas exports avoid HUD compositor artifacts, and state assertions check neutral selection, caption, camera and target equality. It cannot establish real-time smoothness, frame timing, GPU performance, binocular legibility or actual Quest hand interactions.

One final matched-pair attempt was limited to 90 seconds total using the intact committed baseline fixture. It exceeded that limit before completing the baseline, and its process group was stopped. No further lengthy capture was attempted. `final/capture-result.json` records the failure. **Reliable final before/after screenshots are unavailable in this environment.** Empty/partial final captures must not be treated as visual approval.

To reproduce on a suitable desktop, supply the unmodified 322841a baseline fixture:

`QARI_BASELINE_PROJECT=/path/to/baseline node scripts/capture-refinement-pair.cjs`

## Budget and limitations

The source budget remains two RGBA 4096×1024 atlases with mipmaps (approximately 42.67 MiB), the existing 4 KiB glow map, five artwork draws and 10,800 artwork triangles. Temporary glyph canvases are CPU baking resources and create no GPU textures. The earlier prototype measured 57 initial scene draws, 23,698 triangles and 13 textures; these are archived measurements, not a fresh final-source hardware measurement. Quest point reduction, texture/anisotropy caps and disposal remain intact.

The prototype has warmer, clearer ink edges, but its relief remains subtle at the preset grazing angle and does not establish the requested strongly sculpted architectural appearance. The treatment was not extended to supporting bands and no decorative geometry was added to hide that limitation. Final artistic approval, a reliable final desktop capture, expert Arabic typography review and Quest hardware validation remain outstanding.
