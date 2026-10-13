# v1.4.7 calligraphy review

This revision changes only the modular calligraphy component and its content data. App.tsx, choreography, camera, UI and XR code are byte-identical to v1.4.6.

## Text verification

The source is Quran.com / Quran Foundation's displayed Uthmani Arabic, checked 2026-10-13. References and inclusive word spans are stored in `src/calligraphy/content.ts`. Text is not Unicode-normalized or manually reversed. Native canvas Amiri shaping renders each complete excerpt in one operation. All excerpt codepoints exist in the bundled Amiri font. `source-words.json` preserves independently captured source word lists; `node scripts/check-calligraphy-content.mjs` checks every selected span byte-for-byte without a network request.

The Gemini file's four passages were checked against [36:38](https://quran.com/36/38), [39:5](https://quran.com/39/5), [24:35](https://quran.com/24/35), and [51:47](https://quran.com/51/47). Its simplified spelling and combining marks were replaced with the source's Uthmani form, including small letters, pause marks and the orthographic spelling in 51:47. Additional selections: [55:5](https://quran.com/55/5), [21:33](https://quran.com/21/33), [96:4](https://quran.com/96/4), and the light clause from 24:35. The non-text rub-el-hizb section ornament before 24:35 is omitted; no word or diacritic is omitted inside the selected word spans. No English translations are reproduced.

The invalid Gemini CSS shadow (`rgba(74, 192, 160, 0.28);`) is not imported. Shadow valleys use valid slate colors, and turquoise illumination uses valid existing colors. Complete inscriptions fit using measured width and actual ink ascent/descent, with polar aspect compensation and fixed clear course spacing. No arbitrary word breaks or fake diacritics are used.

## Distance detail

The color atlas alpha channel stores a sparse field sampled from the actual engraved ink. Minimum alpha is 128 to preserve canvas RGB precision. Opaque custom standard-material shading blends that field into the original complete inscription; the emissive contribution and bump strength follow the same smooth transition. No extra full-size texture or draw call is required. Ordinary alpha blending is disabled, so this encoding does not make the slab transparent.

Detail uses camera proximity to each annular surface, corrected for the elliptical world transform, with temporal damping. Full detail is reached at 35 scene units and stardust at 115. Under the existing .014 XR scale these are approximately .49 m and 1.61 m. These are implementation thresholds, not headset readability measurements. Detail continues changing when motion is paused. XR uses the XR camera; decorative points retain the existing reduced draw range and world-scale correction.

## Budget and verification

The inherited atlas budget is unchanged: two RGBA 4096×1024 textures with mipmaps, approximately 42.67 MiB, plus the existing 32×32 glow texture (4 KiB). Maximum device texture size and anisotropy cap remain enforced. Artwork: five draws and 10,800 triangles. Full initial desktop scene: 57 calls, 23,698 triangles, 13 uploaded textures. Geometry and texture disposal are retained; newly owned materials are disposed too. Generation occurs once per renderer, not per frame. Per frame adds only three small distance calculations and uniform updates.

Production build passes, with the existing large bundle warning. Desktop regressions passed Explore/Return camera endpoints, both phases, center selection, tracing/drawing/Escape, pause/resume controls, speed switching, all six planet navigation states, reset, desktop hand mode, and absence of page/shader errors. Additional checks passed pointer selection of the mirrored pair, free orbit dragging, and intermediate LOD (hero blend approximately 0.42 at the captured medium distance). `scripts/calligraphy-desktop.cjs` reproduces these checks when Playwright and `/usr/bin/chromium` are available. Desktop Chromium uses software rendering; timing is not representative of Quest. Far/close screenshots use the inherited camera endpoints. The atlas image also exposes the complete native-shaped passages for typography review (its alpha encodes LOD data). `before-*` images are v1.4.6; `far.png`, `mid.png`, and `close.png` are v1.4.7. The medium view uses a fixed diagnostic camera after verifying drag controls; App.tsx is not instrumented or edited.

## Artistic comparison and remaining review

The artwork borrows the reference's stepped slate/bronze architecture, golden inscription courses and restrained turquoise accents. It excludes the large verse banner and zoom inset. The composition is more varied than the prior identical phrase stamps, but remains structured manuscript courses rather than the reference's hand-drawn, tightly interwoven dome lettering. That artistic limitation should be judged in the screenshots, not hidden by extra geometry.

A qualified Arabic reader must review the rendered Uthmani diacritics, Amiri typography and curved viewing angles. Quest hardware testing must check binocular legibility, hand/controller interactions, thermal performance and frame timing at real reading distances before visual approval. No headset performance or final artistic approval is claimed.

Run `npm run build`, `node scripts/check-calligraphy-content.mjs`, and `git diff --check`. Browser checks: `node scripts/calligraphy-desktop.cjs`; the additional pointer/drag/medium capture can be run with `MID_ONLY=1 node scripts/calligraphy-desktop.cjs`.
