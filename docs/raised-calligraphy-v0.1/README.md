# Living Orbit — one-ring raised calligraphy feasibility study

This isolated opt-in prototype starts at the approved integrated baseline **b1521ea1149872debeb840b5a8c8d47c4558ca92** (PR #18). Open the branch preview with `?raisedCalligraphy=1`. Without that parameter the existing rendering path is retained. Use the existing **Pause motion**, **Explore Calligraphy** and **Return to Orbit** controls. No separate scene, celestial object or experience phase is added.

## Scope and construction

Only the middle hero band receives additional relief. Its inner/outer radii **52.9 / 64.2**, elevation **0.48**, original face/backing geometry, position, orientation and motion are unchanged. Supporting bands, scene lights, seven mirrored letters, planets, camera controls, tracing and Harf Studio remain unchanged. `scope.json` records byte comparisons and source hashes against the baseline.

The original native-shaped **Amiri Bold** tiles are copied with their exact existing transforms into a temporary coverage canvas. There is **no new text shaping, font-outline extraction, contour tracing, synthetic Arabic, substitution, word reordering, threshold erosion or minimum-component deletion**. The font and its OFL license remain in `public/fonts`. All eight source-verified excerpts and citations remain in `src/calligraphy/content.ts`; exact word-span verification uses `docs/v1.4.7/source-words.json`. That check verifies the existing recorded Quran.com representation; it is not a fresh external text audit.

`raisedRelief.ts` builds shallow pixel-support faces and complete sidewalls. Adjacent filled rectangles and collinear wall runs are merged without deleting any nonzero-alpha texel, including alpha=1. Short angular spans bound chord deviation below 0.0003 scene units. Top faces remain at a uniform **0.20 scene units** above the existing band. This is roughly 2.8 mm under the existing XR world scale, not a validated headset readability measurement.

Faces use ivory-gold metallic shading and existing roughness/grain. Sidewalls use warm bronze. Coverage-derived side normals soften alternating pixel-wall glints without moving geometry or changing masks. The original packed height texture's unused **B channel**, in the hero lane only, stores exact coverage. Its R relief / G roughness channels, the entire original colour atlas and all other band data remain byte-identical. There is no additional GPU texture, glow, particle layer, environment map or shadow map. Physical wall normals, depth testing and existing baked valleys provide depth cues; cast soft shadows are not added or claimed.

New relief opacity and elevation follow the existing continuous distance detail value. Far views draw no relief. No existing camera or XR headset pose is manipulated. The new meshes do not intercept interaction rays. The temporary full-size mask and rectangle ledger are released by the live component after construction; geometries/materials are disposed on unmount.

## Matched visual evidence

Actual application WebGL renders, with paused motion and no selected letters:

| View | Original | Raised prototype |
| --- | --- | --- |
| Wide | [wide](before/wide.png) | [wide](after/wide.png) |
| Existing Explore Calligraphy endpoint | [close](before/close.png) | [close](after/close.png) |

Wide PNGs are byte-identical. Camera, target, letter transforms and detail values match for each pair. The close endpoint is **[-4, 30, 84]**, with the existing target **[0, -2.7, 44]**. These are complete **972×800 artwork-canvas captures** from a 1280×800 browser viewport; the unchanged UI reserves the remaining sidebar width. They are not crops enlarged to simulate detail.

The harness loads the actual application and hides **only the added relief group** for original views. The underlying scene, colour atlas and original geometry were independently checked against the baseline. It mounts with React.Fragment instead of development StrictMode to avoid duplicate atlas baking. It suspends browser RAF, uses timer-based readiness polling, reasserts R3F manual frame mode after each UI update, advances the unchanged callbacks at 50 ms steps, and renders final frames normally. Software Canvas2D acceleration is disabled; WebGL uses SwiftShader. Initial readiness/dimension/manual-clock harness failures are recorded in `capture-report.json`; intermediate views were not accepted as final endpoint evidence.

This method verifies static scene rendering and callback endpoints. It does **not** validate real-time transition smoothness, sustained frame rate, binocular legibility, headset hand tracking or hardware GPU cost.

## Measured resources and hard stops

| Measurement | Original | Raised prototype |
| --- | ---: | ---: |
| Wide scene draw calls | 57 | 57 |
| Wide submitted triangles | 23,698 | 23,698 |
| Close scene draw calls | 22 | 24 |
| Close submitted triangles | 18,458 | 163,182 |
| Uploaded geometries after close draw | 40 | 42 |
| Uploaded textures | 13 | 13 |
| Estimated uncompressed scene textures including mips | 47.75 MiB | 47.75 MiB |
| Added geometry buffers | — | 13,893,504 bytes / 13.25 MiB |

The mesh contains **33,262 face triangles + 111,462 wall triangles = 144,724 added triangles**, preserving **145,179 supported pixels / 2,188 connected components** across 66 phrase placements. Final isolated geometry construction measured about **633 ms** in the software test environment. Raw synchronous frame samples and estimates are in `resources.json`; shader compilation/upload creates a cold-frame spike. Two warm software samples are insufficient to infer a speedup, sustained FPS or hardware GPU duration.

Engineering guards: **160,000 additional triangles, 16 MiB vertex buffers and two relief draws**. Native 4096px texture capability is required. Downsampling, an empty mask or exceeding the geometry cap fails closed; the implementation never simplifies sacred coverage to fit a budget. These caps are a desktop feasibility choice, **not Quest acceptance thresholds**. The triangle increase is substantial and must be profiled on the target headset before integration.

## Validation and reproducibility

The test environment supplies Playwright, Chromium at `/usr/bin/chromium`, and esbuild through Vite. No runtime dependency or package configuration was changed.

```sh
npm run build
node scripts/check-calligraphy-content.mjs
node scripts/check-raised-scope.cjs
node scripts/check-raised-budget.cjs
timeout 180s node scripts/check-raised-relief.cjs
timeout 190s node scripts/capture-raised-relief.cjs
node scripts/check-integration.cjs
node scripts/check-harf-xr.cjs
node scripts/check-harf-ink.cjs
HARF_ARTIFACTS=/tmp/raised-harf-checks node scripts/check-harf-desktop.cjs
HTTP_ONLY=1 node scripts/check-entry-pages.cjs
```

Passed: production build (existing bundle-size warning), eight exact source spans, baseline isolation, byte-identical native alpha/colour/R/G comparisons, per-texel coverage/opening checks, finite geometry, faint/disconnected/holed synthetic masks, fail-closed geometry budgets, real desktop Explore/Return + mirrored selection + exactly two phases, Harf SVG/spatial pointer body/dot/reset, session-denial fallback, narrow layout/cleanup, tracing/pinch/session/ink simulations, and HTTP checks for all three built entries plus the local font. See `validation.json`, `integrity.json`, `budget-regressions.json` and `harf-desktop-checks.json`.

## Visual assessment and review boundary

This proves that real shallow faces and bronze sidewalls can be added without rewriting the established text or disturbing the original rings. The close view has lighter faces and visible depth edges, but the native raster support still produces pixel-scale stepping, and smaller lettering retains the original atlas's resolution limits. It is a conservative font-derived relief study, not a claim of bespoke sculptural calligraphy or final artistic approval. No geometry was increased beyond the guard to hide these limitations.

Owner visual approval, qualified Arabic review of the rendered relief, actual Quest legibility, sustained stereo frame timing, memory/upload behaviour and hand-interaction validation remain pending. No merge, production deployment or integration approval is implied.
