# XR Stars / Belt point-size correction

Pinned base: PR #31, `f262034e6b6b0989db8824bf045092736d1830f2`. New isolated branch `fix/xr-particle-world-scale`; PR #31 remains unchanged.

## Narrow implementation

Only the production `Stars` and `Belt` functions in `src/App.tsx` change. Three's attenuated points shader transforms point positions with the model matrix, but does **not** multiply `PointsMaterial.size` by object scale. Living Orbit's installation is scaled to 0.014 in XR. The original desktop sizes consequently produce very large screen-aligned square sprites in XR.

Each existing frame callback now reads its actual object world scale into a reused Vector3, and sets material size to original size × maximum world-scale axis **only while XR is presenting**, following `CalligraphyDepthArt`'s existing compensation. No hardcoded 0.014 factor. Session exit restores the exact original desktop size; re-entry and dynamic/nonuniform scales are tested. Native menu inspection currently changes installation translation, not scale; distance attenuation remains Three's existing shader behavior.

No new geometry, materials, textures, shaders, draw calls or render loops. Original deterministic positions, particle counts/draw ranges, opacity, colors, size attenuation, animation and disposal remain unchanged. All other App code and every other tracked source/asset file are byte-identical to the base. All eight scripture records, native face masks, counters, marks and ring textures are untouched.

## Reproduction and evidence limits

The capture harness uses actual full Living Orbit rendering, IWER 2.1.0 Meta Quest 3, Chromium 154.0.8037.57 / SwiftShader, 1440×900, device pixel ratio 1, explicit texture relief. Both runs pause motion using the existing button before session entry; hands start disconnected. Actual application entry creates the XR session. Captures read the native canvas **inside the third actual XR render for each pose**, without an extra render outside the XR callback. Pose coordinates, headset matrix, installation matrix and paused planet positions accompany each image.

Normal viewer position is (0,1.6,0); nearer/farther viewer z is −0.45/+0.45 m. These are emulated physical viewer movements, not application-camera edits or new inspection controls. Geometry-scale changes are additionally tested directly through the production component callbacks.

Temporary harness-only changes: StrictMode becomes Fragment to avoid the development duplicate atlas bake, window RAF is held during preparation and restored for XR, and the remote optional Google UI font request is blocked; bundled Amiri loads normally. No artwork, rendering component implementation or shader is substituted. Images are untouched canvas PNGs, not fabricated artwork or physical Quest footage. The first baseline attempt changed pose before the first native capture; this harness sequencing failure prompted one corrected bounded comparison, rather than repeated application retries.

IWER's mono setting still supplies two views here, with a full-width left viewport and a zero-width right viewport; draw counters can therefore double. This does not validate real stereo framebuffers. GL state/error queries, diagnostic traversal and framebuffer readbacks can synchronize software rendering; interval and startup measurements are diagnostic samples, not neutral GPU benchmarks or headset FPS. RGBA8-with-mip estimates exclude driver overhead/compression, and geometry bytes count CPU typed arrays, not measured GPU allocation.

Shader-derived projected point diameters are estimates before hardware point-range clamping and clipping. Actual framebuffer sky-region pixel measurements are reported separately; overlapping sprites and fog prevent identifying every single point's diameter from a composite image.

## Checks and remaining hardware review

Focused tests exercise the actual production components with real Three geometry and test-only hooks: original desktop sizes, XR scale changes, nonuniform scale, exit reset, re-entry, exact position hashes, draw counts and byte-identical scope. Build/content/mask and interaction regression results and matched-image measurements accompany this report.

Physical Quest validation remains required: true stereo, fine Qur'anic marks/readability, sustained frame times with animation and both hands, cold-start duration, thermal/memory behavior, near/far inspection comfort, session loss/re-entry and navigation. No conclusion that an emulator defect is harmless on hardware is implied. Unrelated full-scene latency or visual defects must be investigated separately; this change does not optimize atlas baking or other rendering.

Stop for visual review. No merge or production deployment; no changes to PR #28–31, Harf, Android or competition footage.

## Matched full-scene XR results

| Measurement | PR #31 before | Corrected |
| --- | ---: | ---: |
| Normal-pose upper-sky pixels above threshold (of 432,000) | 432,000 | 937 |
| Largest connected sky component span, normal | 1,440 px | 7 px |
| Nearer/farther largest sky component span | 1,440 / 1,440 px | 4 / 6 px |
| Median instrumented XR interval | 2,147.5 ms (13 intervals) | 611.85 ms (14 intervals) |
| Maximum interval, including warm-up/readback | 8,064.8 ms | 6,877.6 ms |
| Median app callback CPU duration | 33.95 ms | 32.20 ms |
| Navigation → scene/atlas ready | 55,497 ms | 94,373 ms |
| XR draw submissions / triangles | 120 / 47,408 | 120 / 47,408 |
| Submitted points / unique visible-range points | 7,416 / 3,708 | 7,416 / 3,708 |
| Uploaded geometries / textures | 42 / 15 | 42 / 15 |
| Scene-referenced typed-array geometry | 1,382,172 bytes | 1,382,172 bytes |
| Scene texture RGBA8 + mip estimate | 52.09 MiB | 52.09 MiB |

The runs are sequential software samples, with differing Vite/module-cache preparation costs and sample counts. The longer corrected startup is retained honestly; no startup improvement or controlled cold-start regression is established. The point correction affects per-frame sizing, not the unchanged synchronous atlas baker. Interval numbers include diagnostic and readback interference, and must not be converted into a Quest FPS claim.

At the normal pose, shader-derived median diameters before → after are Stars 0.8: **82.38 → 1.15 px**, Stars 0.55: **90.83 → 1.27 px**, Belt: **55.61 → 0.78 px**, before clamping/clipping. Corrected material sizes are 0.0112 / 0.0077 / 0.0042 at scale 0.014. Existing calligraphy lights remain 0.0049 and approximately 0.92 projected px. Unlike those estimates, the sky table measures actual framebuffer pixels (max RGB > 30, top 300 rows, 8-connectivity); individual composite components can combine nearby points. Tiny square point sprites are still inherent to the original untextured material; the oversized overlapping mosaic disappears. No points were removed.

All three pairs have exactly equal head, headset matrix, installation matrix, paused planet positions, draw/primitive counts and resource records (`comparison.json`). Actual full-scene PNGs:

| Viewer distance | Before | Corrected |
| --- | --- | --- |
| Normal | [PR #31](before/normal.png) | [Corrected](after/normal.png) |
| Nearer, −0.45 m viewer z | [PR #31](before/nearer.png) | [Corrected](after/nearer.png) |
| Farther, +0.45 m viewer z | [PR #31](before/farther.png) | [Corrected](after/farther.png) |

**Unresolved:** Full-scene latency remains severe despite the point-size improvement. Frames progressed in both bounded runs rather than stopping permanently, but neither run approaches a usable headset frame budget. The rings and several planets also remain overbright under this emulated XR setup; these surfaces were already visibly wrong in the baseline. Their source and materials have not changed, and this is not presented as an approved full-scene visual result. Root cause/Quest impact of the remaining illumination and scheduling behavior is not established by this patch. No unrelated lighting, fog, atlas or performance changes were attempted.

## Desktop and regression evidence

- Native desktop wide canvas: **zero differing pixels**. Explore canvas: **2,374 / 777,600 pixels differ, maximum one 8-bit channel step (1/255)**. Exact camera matrices, particle sizes and submitted counts match. The initial strict bitwise Explore assertion failed; the analysis records the raw result rather than claiming exact equality, and accepts at most one channel step with exact metadata checks. No geometry displacement or visible artwork change was found on inspection. Both scripts use deterministic frame steps, identical controls and no selected letters.
- [Wide before](before/desktop-wide.png) / [wide corrected](after/desktop-wide.png); [Explore before](before/desktop-explore.png) / [Explore corrected](after/desktop-explore.png). These are 972×800 native WebGL canvases inside a 1280×800 desktop viewport, without DOM overlays.
- Production TypeScript/Vite build passed; inherited >500 kB chunk warning remains.
- Eight complete excerpts match their recorded Quran.com word spans. Fresh native-alpha checks for all eight at 55/100/190 px report **zero differences** (`glyph-masks.json`), covering fine marks, openings and counters without changing their coverage. Source/asset scope equality also protects the v0.2 baker, original masks, font and shaders; this is not a new independent full-atlas byte comparison.
- `point-tests.json`: actual production component callbacks pass world-scale/exit/re-entry/geometry assertions. `baseline-negative-test.log` demonstrates the pinned original fails the first XR size assertion (0.8 versus expected 0.0112); the corrected source passes.
- Existing Orbit control regressions pass on both versions: Pause, exact Explore/Return endpoints, mirrored-pair scales, two phases, texture-mode Harf URL, no physical hero relief and actual WebGL rendering (`before/desktop-tests.json`, `after/desktop-tests.json`).
- Existing Harf tracing, direction/resume, body/dot/reset, pinch/loss, session lifecycle, ink smoothing and integration completion/teardown logic checks pass. Actual Harf desktop SVG and spatial-pointer body→dot→completion/reset, feature-denial fallback, narrow layout and pagehide cleanup pass (`harf/desktop-checks.json`).
- Actual production HandTracking callback browser regression passes for both hands, letter/phase targets, missing joints, disconnection, visibility interruption and session recovery; actual default/texture internal navigation links also pass (`browser-tests.json`). These use synthetic joint objects, not physical hand tracking.
- Existing menu state/target tests pass: independent gates, modal focus, duplicate barrier, pause restoration, bounds, close/reset and safe navigation.
- All three built pages and bundled Amiri return HTTP 200. No new production dependencies.

To repeat the focused check: `node scripts/check-xr-points.cjs`. Optional `POINT_TEST_BASELINE=1` must fail. Existing browser checks require Playwright and an installed Chromium. To repeat captures, supply test-only IWER 2.1.0 via `IWER_MODULE`, Chromium via `CHROMIUM_PATH` (default `/usr/bin/chromium`), and run:

```sh
node scripts/capture-xr-points.cjs /absolute/path/to/baseline-worktree before /absolute/path/to/output/before
node scripts/capture-xr-points.cjs /absolute/path/to/corrected-worktree after /absolute/path/to/output/after
# Run from each respective worktree, using the corrected branch's harness path:
POINT_CAPTURE_OUT=/absolute/path/to/output/before node /path/to/corrected/scripts/check-xr-points-desktop.cjs
POINT_CAPTURE_OUT=/absolute/path/to/output/after node /path/to/corrected/scripts/check-xr-points-desktop.cjs
# From corrected worktree, default report directory:
python3 scripts/compare-xr-points.py
```

The first two commands use the same fixed port; run sequentially. Each XR run has a 200-second host cap, per-stage deadlines and no automatic retries. Analysis needs Pillow, NumPy and SciPy, used offline only. Run captures before other heavy browser tests to avoid competing software-renderer load. Browser-free checks use esbuild and Three already in the development dependency tree. These tools do not ship to WebXR or change application routes.

The existing IWER menu regression also **passed** (`menu-emulation.json`): both-hand targeting, modal letter blocking, pause/resume, bounded inspection and unchanged headset matrix, Return, closed-hand reconnection, close/reopen, 01→02→01, session exit/re-entry and real safe Orbit→Harf→Orbit navigation with texture mode preserved. This is the explicitly labelled lightweight production-component fixture; it does not establish full-scene interaction performance. Its temporary screenshots were not retained here; the independent full-scene PNGs above are the visual evidence for this correction. Software-only tests do not establish Windows execution or Quest tracking reliability.
