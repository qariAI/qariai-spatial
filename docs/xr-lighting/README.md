# Living Orbit — XR installation lighting correction

Base: PR #32 at `cde9b8f2b7a042af8e864a9bd16422bcd206e1eb`. New isolated branch `fix/xr-installation-lighting`, targeting `fix/xr-particle-world-scale`. PR #32 and earlier PRs are unchanged.

## What changed

The three existing point lights inherit the installation's 0.014 XR position scale, but Three 0.160.1 does not scale their intensity or cutoff distance. The original implementation therefore multiplied incident illumination by thousands at corresponding model surfaces. The directional light's position followed the installation while its unparented target stayed at global origin, rotating its direction by roughly 60 degrees.

`src/xr/OrbitLighting.ts` adapts only those existing lights. Each tick uses actual world scale and the existing light decay: authored intensity × scale^decay and finite cutoff × scale in XR; exact authored values otherwise. Values are always derived from constants, never compounded. `WorldAnchor` calls it immediately **after its existing transform update**, before the normal renderer uploads lighting uniforms. This avoids a one-frame scale mismatch on entry/exit without changing frame priorities, camera code or adding a render loop. Three point lights and the directional light gain names solely for reference lookup.

| Light | Original intensity / cutoff | XR at 0.014 |
| --- | --- | --- |
| Sun | 160 / 160 | 0.03136 / 2.24 |
| Emerald | 20 / 200 | 0.00392 / 2.8 |
| Blue | 15 / 200 | 0.00294 / 2.8 |

The existing directional target remains unparented. Its authored desktop world position `(0,0,0)` corresponds to `(0,-15,0)` relative to the desktop anchor `(0,15,0)`. Mapping that point through the current anchor preserves the original direction `[-0.51018836, 0.69239849, 0.51018836]` in desktop and XR, including inspection translation. Simply targeting the installation origin would change the approved desktop lighting and was not used.

No new lights, target objects, meshes, textures, shaders, shadow maps or production dependencies. Ambient strength, exposure, ACES, sRGB output, material/emissive/roughness/metalness parameters, original geometry, calligraphy masks/atlases/UVs, seven-letter choreography, phases, menus, cameras, Harf and navigation are unchanged. `check-xr-lighting.cjs` normalizes the small allowed App additions and requires exact equality to the pinned App; all other tracked source/art is protected by the scope check.

## Attenuation validation

The exact Three physical shader function is `getDistanceAttenuation`: inverse distance^decay with denominator floor 0.01 and its finite-cutoff window. Scaling **both** strength and cutoff is required.

- Production WorldAnchor callback tests pass: desktop, first XR frame, translated inspection, effective uniform scales 0.007/0.014/0.028, exit, re-entry, exact restoration, unchanged decay and directional strength/target identity. The original baseline fails the first XR intensity assertion, retained in `baseline-negative.log`.
- 64 CPU equation comparisons pass with maximum relative error `3.59e-14` outside the floor.
- `gpu-attenuation.json`: the **unmodified Three shader function** is compiled into an isolated test-only WebGL2 float-readback kernel; 54 comparisons pass, maximum relative error **1.95e-5**. No production shader is replaced. The known floor failure is demonstrated explicitly (640 versus 3.136 in an intentionally too-close synthetic case).
- Actual captured geometry is checked using conservative lower bounds from every PBR triangle's AABB, including degenerate triangles: **60,264 source/triangle checks per pose**. Closest bounds in XR are emerald **0.80887**, blue **0.85329**, Sun **0.13750**, all above the decay-2 floor distance **0.1**. This covers the entire existing triangulated PBR surface, not just selected vertices; bump maps do not displace geometry.
- Actual captured light/position data reconstruct the corrected hero-ring point's attenuation equal to desktop within **6.67e-16 relative error** at all three XR poses. This is shader-equation analysis, not a final-pixel measurement; actual framebuffer measurements are separate below.

Limitations: exact equivalence cannot hold inside Three's floor using one scalar light power. Current geometry at 0.014 is safely outside it; a future uniformly smaller installation below approximately **0.0102** can enter it. Existing menu inspection translates the installation and keeps its scale at 0.014. Scale-value response is tested at 0.007, but full-surface equivalence is **not** promised there. Nonuniform scaling is also outside the validated relationship; the current installation is uniformly scaled. No shader/clamp changes or compensating material/exposure changes are included.

## Genuine matched captures

All PNGs are untouched native full-scene canvas readbacks, **not** generated art, composites, physical Quest captures or lightweight scene fixtures. Settings are identical between baseline and correction: Linux Chromium 154.0.8037.57 / SwiftShader, IWER 2.1.0 Meta Quest 3, 960×900, mono/IPD zero, XR FOV 90 degrees, hands disconnected, actual Pause button and no selected letters, `calligraphyRelief=texture`.

Matching means **baseline versus corrected at each pose within each modality**. Desktop retains its original FOV 43; XR retains diagnostic FOV 90, so desktop/XR are not claimed pixel-equivalent. Desktop states use actual existing controls: normal, Explore Calligraphy at `(-4,30,84)`, Return followed by three wheel retreat events. XR normal viewer is `(0,1.6,0)`; nearer viewer pose is derived from the existing Explore camera relative to the installation; farther viewer is `(0,1.6,0.45)`. Only the emulator viewer is positioned, never production camera code.

| State | PR #32 | Corrected |
| --- | --- | --- |
| Desktop normal | [Before](before/desktop-normal.png) | [After](after/desktop-normal.png) |
| Desktop near / Explore | [Before](before/desktop-nearer.png) | [After](after/desktop-nearer.png) |
| Desktop farther / wheel retreat | [Before](before/desktop-farther.png) | [After](after/desktop-farther.png) |
| XR normal | [Before](before/xr-normal.png) | [After](after/xr-normal.png) |
| XR nearer inspection | [Before](before/xr-nearer.png) | [After](after/xr-nearer.png) |
| XR farther inspection | [Before](before/xr-farther.png) | [After](after/xr-farther.png) |

**All three desktop pairs are pixel-identical: zero differing pixels.** Camera matrices/projections, installation transforms, submitted primitives, geometry bytes, texture estimates and uploaded resource counts match between before/after. Base materials and color pipeline match. XR detail/bump differences after settling are bounded by the analysis, not overridden or manually forced.

The corrected XR images restore Jupiter's bands, Saturn's tan color, dark slate recesses and gold script contrast. No new shadowing mode is enabled. The Sun remains visually prominent: its sampled opaque core is **pixel-identical at all three XR poses**. Example normal-view core RGB means: Jupiter **250/247/242 → 196/153/107**, Saturn **254/254/252 → 184/156/100**; Sun **227/220/196 unchanged** (`planet-sun-pixels.json`). These are actual framebuffer disk samples projected from the original paused object centers, not shader estimates. Near-view pixels with all RGB channels ≥230 drop from **28,980 to 53** across the full image; that whole-image statistic includes intentionally bright UI/strokes and is not an isolated-ring metric.

At native software resolution, tiny micro-script remains small by design. The close-up exposes gold strokes and marks with restored background contrast; full Arabic reading at realistic headset resolution and distances remains a physical Quest / qualified-reader check. Source/mask equality is not a substitute for that hardware visual review.

## Capture method and failed attempts — read before interpreting performance

The original fully rendered settling attempt exceeded its **65-second close-up deadline** after only 33 nearer frames; `full-render-settle-timeout.json` preserves actual full-render samples. A separate initial desktop harness attempt was stopped when React reconfigured its frame loop during a UI transition; `initial-capture-diagnostic.json` records it. The final harness reasserts deterministic desktop stepping and checks camera endpoints before accepting images.

To obtain settled XR screenshots without repeatedly waiting minutes on software draws, the final harness lets the **original native XR callbacks, delta timing, scene matrices and stock Three XR-camera update run with GPU draws suppressed during warmup**. It waits at least 40 callbacks and five successive per-band detail deltas below `1e-6`, then restores **three actual full-scene native renders before capture**, followed by at least five additional actual frames for timing. No detail uniform, mask, light, material, geometry or direct application-camera pose is altered by the harness. Settled detail values and callback counts are recorded for every image.

Warmup frames are tagged `fullyRendered:false` and **never used as performance evidence**. The interval analysis excludes warmup, initial upload frame, capture/readback and its following interval. Scene/atlas readiness was **113.7 s before / 110.6 s after** in these sequential development/software runs; startup was not optimized. StrictMode is temporarily Fragment in the served test entry to avoid duplicate development baking; the optional external UI-font request is blocked, bundled Amiri loads. Context snapshots/readbacks still perturb execution. IWER mono supplies two views, including a zero-width right viewport; this is not real stereo framebuffer validation.

## Resources and unresolved latency

| Resource | Before → after |
| --- | --- |
| Desktop normal draws / submitted triangles | 57 / 23,698 → identical |
| Desktop near draws / submitted triangles | 22 / 18,458 → identical |
| XR normal/far draws / submitted triangles | 120 / 47,408 → identical |
| XR near draws / submitted triangles | 112 / 47,392 → identical |
| XR submitted points | 7,416 → identical (3,708 unique active-range points; two IWER views) |
| Uploaded geometries / textures, XR | 42 / 15 → identical |
| Scene-referenced typed geometry arrays | 1,382,172 bytes → identical |
| Scene texture RGBA8+mip estimate | 52.09 MiB → identical |

Counters and CPU typed-array sizes are measured; texture storage is an estimate excluding driver overhead/compression. Actual GPU VRAM allocation cannot be established through this browser API. The light helper adds CPU references/two reused Vector3 objects, no GPU resources.

Severe XR latency remains **unresolved**. Small fully rendered diagnostic samples, excluding warmup/readbacks, give:

| Pose | Before median interval | Corrected median interval |
| --- | ---: | ---: |
| Normal | 789.5 ms (7 samples) | 912.7 ms (7 samples) |
| Nearer | 1,503.9 ms (6 samples) | 1,919.7 ms (4 samples) |
| Farther | 954.2 ms (4 samples) | 738.3 ms (6 samples) |

The corrected maximum sampled near interval is **4.30 s**. These sparse, bursty software samples are not hardware FPS, proof of a performance regression, or a latency improvement claim. Lighting compensation changes neither the scene's raster workload nor XR scheduling; no unrelated optimization was attempted. Native Quest sustained stereo performance, startup, memory and thermal measurements are still blockers for a competition-readiness claim.

## Checks and reproduction

- Production TypeScript/Vite build passes, with the inherited >500 kB chunk warning (`build.log`).
- Eight recorded Qur'anic source spans pass; fresh native-alpha checks for all eight at 55/100/190 px have zero differences (`glyph-masks.json`). Every other source/art asset is unchanged; no independent new full-atlas byte-comparison claim.
- Existing tracing/direction/resume/body/dot/reset, pinch/loss/session, ink, integration completion/navigation teardown, recovery and menu logic/target regressions pass (`regressions.json`). Browser regression results accompany this report.

From this branch, with normal dependencies, Playwright/Chromium and test-only IWER 2.1.0 available:

```sh
node scripts/check-xr-lighting.cjs
node scripts/check-xr-lighting-gpu.cjs
# XR_LIGHTING_BASELINE=1 node scripts/check-xr-lighting.cjs must fail.
# Supply IWER_MODULE and optionally CHROMIUM_PATH for captures; run sequentially:
node scripts/capture-xr-lighting.cjs /absolute/baseline/worktree before /absolute/output/before
node scripts/capture-xr-lighting.cjs /absolute/corrected/worktree after /absolute/output/after
python3 scripts/compare-xr-lighting.py
python3 scripts/measure-xr-lighting-pixels.py
```

The analysis expects the default `docs/xr-lighting/{before,after}` folders and uses Pillow/NumPy offline. Each final capture was externally bounded to 240 seconds, with per-stage deadlines and no automatic retries. Browser capture is not a Windows or physical Quest execution claim. Historical scope scripts pinning older App versions remain unchanged; the new lighting scope guard checks this approved delta against PR #32.

Physical Quest review remains required: both eyes, brightness/white balance, fine marks and counters at normal/near/far distances, Sun balance, both hands/menu/inspection, exit/re-entry and safe Harf navigation. No merge, production deployment, earlier-PR changes, Android or competition-film changes. Stop for owner visual review.

Final browser results: `orbit-tests.json` passes actual texture-only desktop Pause, exact Explore/Return endpoints, mirrored-pair scales, exactly two phases and texture-mode Harf link; `browser-tests.json` passes both hands' letter/phase recovery gates and actual default/texture navigation adapters; `harf/desktop-checks.json` passes actual SVG and spatial-pointer body/dot/completion/retry, denied-feature fallback, narrow layout and cleanup. `menu-emulation.json` passes the existing **lightweight production-component** IWER fixture: both hands, modal blocking, pause/resume, inspection with unchanged headset matrix, close/reconnection, phase transitions, exit/re-entry and real safe Orbit→Harf→Orbit navigation. Its temporary menu screenshots are not retained in this report; full-scene visual evidence is the separate native capture table above. These tests do not imply hardware hand-tracking success. Three built pages and bundled Amiri return HTTP 200 (`built-routes.json`). `scope.json` records byte equality for 25 protected source/assets and verifies captured App/light-adapter hashes match the committed implementation.
