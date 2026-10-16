# Living Orbit raised calligraphy v0.2 — texture-only feasibility comparison

**Visual stop condition reached.** The treatment gives smoother ivory-gold faces without the physical prototype's wall stair-stepping, but the matched views do not establish a convincing improvement in perceived sculptural depth. Artistic implementation stops here. No geometry was added to compensate. This draft is evidence for owner review, not a claim that the visual objective passed.

Exact source: **dc95a7cc06c3194318e099b8a3802eb4ae8cc272**, PR #28. This is a new isolated branch; PR #28 and its artifacts remain unchanged. The existing three ring geometries, polar UVs, transforms, other-band data, camera/App, seven letters, exactly two phases, Harf modules, font and sacred text are unchanged (`scope.json`).

Open the branch preview with **`?calligraphyRelief=texture`**. The original route without a parameter and legacy `?raisedCalligraphy=1` remain available. There is no new scene or mandatory phase.

## What changed

Native mask recording is separate from physical construction. Texture mode never calls `buildRaisedRelief`, creates no lettering meshes/materials, and allocates **zero additional lettering triangles, geometry buffers or draw calls**. A test replaces the mesh builder with a throwing guard to verify this, and the actual runtime contains no physical relief group.

The exact original Amiri tiles, transforms and face atlas remain authoritative. A bounded distance field derived from native coverage controls auxiliary rounded shoulders and narrow valleys; it is never used to replace visibility or generate contours. The profile respects faint coverage, uses polished ink / matte slate roughness separation, and relights only the existing hero face. It does not rewrite words, reshape glyphs, move diacritics, fill counters or invent joins.

The existing packed texture carries **R: auxiliary height, G: near roughness, B: exact native coverage, A: original far roughness**. The unused A channel and twelve texels of empty hero gutters preserve far roughness through mip filtering. The two supporting bands' texels remain byte-identical, including their unused channels.

A Canvas2D packing attempt correctly failed the coverage assertion with 62,891 differing stored values: low-alpha premultiplication quantized B. The final version uploads exact RGBA bytes through **one replacement DataTexture**, explicitly reversing rows to preserve the existing UV convention. This replaces the existing height texture; it does not allocate another GPU texture. Mip generation, linear filtering, anisotropy cap and RGBA8 size are retained. The final comparison has zero stored-coverage differences.

This is **surface-lighting relief**, not extrusion. Geometry, silhouettes, geometric parallax and cast relief shadows remain flat. There is no UV displacement, parallax mapping, substitute font, new letter contour or extra particle/glow effect. Original distance thresholds/damping and camera choreography remain in use; only hero shading responds differently as detail resolves.

## Genuine matched visual evidence

| Camera state | A — Original | B — PR #28 physical | C — Texture v0.2 |
| --- | --- | --- | --- |
| Wide | [image](original/wide.png) | [image](physical/wide.png) | [image](texture/wide.png) |
| Existing Explore Calligraphy | [image](original/explore.png) | [image](physical/explore.png) | [image](texture/explore.png) |
| Oblique close-up | [image](original/oblique.png) | [image](physical/oblique.png) | [image](texture/oblique.png) |

All nine images are actual WebGL application renders, paused and unselected, with identical camera, target, letters and detail values within each row. They are full 972×800 artwork canvases in a 1280×800 browser viewport. They are not composites or generated concept art.

The harness loads the actual texture-mode application. Original and physical material factories are extracted from immutable PR #28 source; only the hero material and auxiliary texture lane are swapped for the controlled comparison. The physical comparator exists solely in the test harness. Its GPU buffers are disposed between views; the actual v0.2 runtime never constructs it. Other bands and the common original face atlas remain unchanged. Explicit row reversal and source-byte checks protect texture orientation.

Wide uses [0,98,169]; Explore uses the unchanged destination [-4,30,84] and target [0,-2.7,44]. The oblique pose [12,12,82], target [0,-2.7,44], is set through the existing OrbitControls state for inspection; application camera code is not changed. Test-only Fragment mounting avoids development StrictMode duplicate atlas baking. The established harness steps unchanged frame callbacks with a monotonic 50ms clock, renders actual final frames normally and uses timer readiness polling.

Physical and original wide PNGs are byte-identical. C differs from A at **17 pixels, maximum one 8-bit channel level**. This is reported as bounded far-render quantization, not byte identity or source-mask change. The initial capture harness stopped on an over-strict byte-identity assertion after saving all nine images. `evidence-validation.json` independently validates the saved files and measurements without modifying or regenerating screenshots. The corrected reproducible harness records and bounds this difference explicitly.

## Resource and startup comparison

| Measurement | A — Original | B — Physical | C — Texture |
| --- | ---: | ---: | ---: |
| Wide draws / triangles | 57 / 23,698 | 57 / 23,698 | 57 / 23,698 |
| Explore draws / triangles | 22 / 18,458 | 24 / 163,182 | 22 / 18,458 |
| Oblique draws / triangles | 36 / 22,186 | 38 / 166,910 | 36 / 22,186 |
| Extra lettering geometry bytes | 0 | 13,893,504 | **0** |
| Uploaded geometries at close view | 40 | 42 | 40 |
| Uploaded textures | 13 | 13 | 13 |
| Estimated scene textures with mips | 47.75 MiB | 47.75 MiB | 47.75 MiB |

The auxiliary profile bake measured **291 ms**. A single source-comparison run measured ~47.7s for the original atlas + physical mesh and ~45.8s for atlas + texture profile in this software environment. These are noisy single samples, not a claimed startup speedup. Native atlas baking remains expensive here. Texture-mode startup still needs target-browser measurement.

Raw browser samples are in `resources.json`. Comparison first frames include lane uploads and shader changes; warm samples are noisy synchronous software wall times, not GPU timer queries. No sustained FPS, Quest performance or stereo readability claim is made. Texture mode removes vertex/upload costs but adds a coverage texture read and fragment arithmetic; Quest fill rate and shader cost still require hardware profiling.

## Integrity, regressions and reproduction

`integrity.json` verifies:

- Entire original face atlas and native masks: zero differing bytes/pixels.
- Packed native coverage: zero differences after exact upload normalization.
- Both other band lanes: zero differing RGBA bytes.
- All 145,179 supported pixels, 2,188 components, nine components of four pixels or fewer, 57,131 faint pixels and 331 detected closed openings remain represented.
- Synthetic faint points, holes and protected empty gaps retain exact coverage; auxiliary writes stay within their designated data region.
- A throwing mesh-builder guard passes and texture mode returns no physical geometry.

Topology checks are coverage tests, not semantic identification of individual sacred marks. Qualified Arabic review of the rendered result remains necessary. The eight excerpts and references remain in `src/calligraphy/content.ts`; exact recorded Quran.com source spans and bundled Amiri bytes are checked without fresh source retrieval or normalization.

The environment supplies Playwright, `/usr/bin/chromium` and esbuild. No package configuration or runtime dependency changed.

```sh
npm run build
node scripts/check-calligraphy-content.mjs
node scripts/check-texture-scope.cjs
timeout 210s node scripts/check-texture-relief.cjs
timeout 250s node scripts/capture-texture-relief.cjs
node scripts/check-texture-evidence.cjs
TEXTURE_REGRESSION_ONLY=1 timeout 180s node scripts/capture-texture-relief.cjs
node scripts/check-harf-xr.cjs
node scripts/check-harf-ink.cjs
node scripts/check-integration.cjs
HARF_ARTIFACTS=/tmp/relief-v02-harf node scripts/check-harf-desktop.cjs
HTTP_ONLY=1 node scripts/check-entry-pages.cjs
```

Build/content/scope checks, original Harf tracing/pinch/session/ink simulations, Harf real desktop body + separate dot/reset/guide/session-denial/narrow-layout/cleanup checks, integration navigation/completion simulations and all three built entries plus the bundled font pass. The separate texture-only runtime report records rendered camera/selection/phase checks. Capture limitations and individual results remain explicit in their JSON reports.

## Review boundary

The technical resource and integrity objective passes. **The perceived-depth objective is not approved and is not claimed as achieved.** Faces are smoother and more legible than the pixel-wall study, but at these existing camera states the result still reads predominantly as surface shading. No additional geometry, displacement, lighting change or camera change was used to disguise that limitation.

Stop for owner visual review. Qualified Arabic visual review, real Quest startup/memory/frame-time/legibility and hand-interaction validation remain pending. No changes to Living Orbit interactions, Harf Studio, competition footage, Android, main or production; no merge or production deployment.
