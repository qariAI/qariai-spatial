# Letter / Light — real sculptural depth

Updated isolated draft PR #34 on `prototype/spark-letter-study-v0.1`. Baseline Living Orbit remains PR #33 at `ad10ee39ee0f16262e7b3654b24bad23a34351ff`. Opt-in page: `/spark-letter/index.html`. No new link is added inside Orbit or Harf.

## What changed after visual review

The first Spark shell remained visually flat because its original opaque face covered most depth. It is preserved in [phase1](phase1/README.md) and commit `0ee06b3eb8cf20b34121efa9433d4d1b932d7c5b`.

The current **Sculpture** treatment has genuine shallow 3D solids from the bundled Amiri kāf's exact vector curves. It removes the face-image overlay from that treatment. Gold metallic caps, bronze walls, a narrow inward bevel, studio environment reflections, directional/point lighting and a receiving plane make thickness and cast shadows visible. A sparse, secondary Spark light fringe replaces the former four-layer shell. **Original** still shows the original native face for A/B comparison.

The single letter is **ك / U+0643**. This is a font-derived material study, not original commissioned Thuluth, a Qur'anic verse, an invented ligature or a historically authenticated calligraphic composition. It does not create a new object or phase inside Living Orbit.

## Text and contour integrity

- Font is the unchanged bundled `public/fonts/Amiri-Bold.ttf`, version 1.002, SHA-256 `65e3e6fe6af66bb6d24959bd537a89ea35de14083f5a2e2290c246136c2b047b`. Existing OFL remains in `public/fonts/OFL-Amiri.txt`.
- `scripts/extract-spark-letter.py` uses fontTools `SVGPathPen` directly on U+0643 / glyph `uni0643`. No raster tracing, resampling, simplification, stretching or manual redrawing. `--check` reconstructs and compares the complete path, bounds, component count and provenance.
- `kaf-outline.json` locks exact original curve commands and SHA-256 `2c381807e055fc8a08b6e03f4e4c605e4279af6cbc26334e272763b862b8d8c4`. There are two contours and both become separate meshes, retaining the detached inner component.
- Extrusion is uniform in depth. A 0.007-unit bevel cuts inward; the body boundary remains at the source contour. Runtime tests require the complete XY geometry bounds to remain inside the transformed source bounds (0.004 numerical tolerance). Curve tessellation is approximate, at 12 segments per curve; the original analytic path stays unchanged in the asset.
- Registration uses Canvas's actual conversion from middle to alphabetic baseline, not the curve's maximum Y. An initial test caught a several-pixel registration error caused by mixing true curve extrema with conservative font metrics; it was corrected before final screenshots.
- Native font filling and unhinted vector filling differ at antialiased edges. Tests report intersection/union and require zero lost native stroke-interior pixels and zero filled native gap-interior pixels, using a one-pixel edge neighbourhood at the original 256px raster scale. Exact source-path verification is separate. Final native/vector raster intersection-over-union is 0.97154, with zero lost stroke-core and zero filled gap-core pixels; this is reported rather than claiming identical antialiasing. This is **not** a claim that a lit, tessellated 3D sculpture has the same pixels as a glowing 2D image.
- Original-mode face pixels still match an independently evaluated original `src/App.tsx` drawing routine byte-for-byte within the controlled browser. They are frozen once into RGBA storage. Platform-dependent rasterization is not normalized or asserted universal.
- The shadow-free native sampling mask is used only for secondary light samples. Gaussian tails are soft; they are not the authoritative letter representation.

## Genuine matched evidence

| View | Original face | Solid sculpture |
| --- | --- | --- |
| Wide | [Original](original-wide.png) | [Sculpture](hybrid-wide.png) |
| Close | [Original](original-close.png) | [Sculpture](hybrid-close.png) |
| Oblique | [Original](original-oblique.png) | [Sculpture](hybrid-oblique.png) |

![Matched wide comparison](compare-wide.png)
![Native sculpture canvas](sculpture-native-oblique.png)

The image immediately above is a direct, uncomposited WebGL canvas capture. Some full-page SwiftShader screenshots omit portions of HTML text because of the software compositor; the native canvas avoids that capture artifact. It does not retouch or reconstruct the object.

These are actual 1600×1000 browser captures, not generated images or composites. A/B endpoints/projections are identical within each view. The capture API moves to fixed study-camera endpoints; it never skips rendering. Timing samples precede screenshots. The page UI uses smooth camera transitions and respects reduced motion. Breathing light starts off and affects only secondary splat tint.

**Assessment:** the gold/bronze thickness now reads clearly in the oblique view, with real shadows and crisp source-derived edges. The gold face responds to lighting rather than carrying a baked glow. It remains a relatively simple extruded font study, not the complex interwoven calligraphy of the longer-term reference. The lighting/environment and inward bevel are approximations for this proof; close specular aliasing and sustained headset quality still require review. Do not expand or integrate without owner approval.

## Resource envelope

- Source-derived physical geometry: **8,312 triangles / 797,952 bytes (~0.761 MiB)** of typed vertex arrays. Guard: 20,000 triangles and 2 MiB. These are real stored contour solids, unlike splat quads.
- Physical depth: 0.34 study units, plus 0.012 bevel thickness at each end. This is a desktop study scale, not a headset comfort claim.
- Secondary Spark samples: runtime report records the renderer/platform-dependent count (19 in the controlled final configuration), compared with 4,516 in phase 1. Source-mask sampling can vary with rasterization. Original contours do not vary with that sampling.
- One 512×512 shadow map and one bounded HDR studio environment, generated once. Generated environment dimensions/types and enumerated textures appear in `browser-report.json`. Enumerated texture sums are approximately 3.02–3.06 MiB in this run. They are uncompressed estimates, not measured driver VRAM, and exclude unobservable overhead.
- Runtime draw/triangle counts, shader-ready timing, texture dimensions and sparse frame intervals are recorded separately per view. They include the retained comparison engine, lighting and receiving plane. They do not predict integrated Orbit overhead or real Quest FPS.
- Main application sources, font, package.json and Vite configuration remain unchanged. Existing eight built application JS/CSS assets remain byte-identical to the baseline. Only the opt-in page loads the separate Three 0.180.0/Spark 2.3.1 modules.

## Checks and reproduction

```sh
python scripts/extract-spark-letter.py --check
node scripts/check-spark-study-scope.cjs
node scripts/check-spark-study.cjs
npm run build
```

Extraction/checking requires development-only fontTools; runtime does not. Browser checks use Playwright/Chromium as with existing project checks; CHROMIUM_PATH selects an installed browser. The supplied capture script explicitly uses SwiftShader for reproducibility. That is not a Windows hardware or Quest validation claim.

Existing Arabic content, Harf body/dot/direction/pinch/session, ink/smoothing, integration navigation/completion, menu state and independent pinch-recovery regressions also run. The production build retains its inherited >500 kB chunk warning. No source shader, artwork, lighting or camera inside Living Orbit is changed.

The renderer and its SVGLoader are unmodified published Three distribution modules. Source URLs, checksums, versions and MIT licenses are in `public/spark-letter/vendor/`. The bundled Amiri remains under its original OFL. Nothing was generated as sacred lettering, and no external CDN or AI image is placed on the object.

## Review boundary

Open **Sculpture → Close → Oblique**, then switch to **Original**. This page is desktop-first and adds no immersive entry or gesture behavior. Physical Quest performance/stereo/comfort and any future application integration remain pending. Living Orbit, Harf Studio, competition footage, earlier PRs, main, Android and production are unchanged. No merge or production deployment. Stop for owner visual approval.
