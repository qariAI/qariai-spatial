# Experimental finish 11 — satin response and shallow channel shading

Owner-directed continuation from bake 10, baseline `2d2bd8f077197fc1305a25aca1c6d460079d940b`. Only the explicit single `finish=proof` selection loads this candidate. Default Surface 08 remains unchanged. Preview:

https://qariai-spatial-git-prototype-spark-lett-805d90-qariais-projects.vercel.app/spark-letter/index.html?mode=hybrid&view=close&finish=proof

The header must read **EXPERIMENTAL FINISH · 11**. Compare Close and Oblique, then drag to inspect reflections. No new user controls.

## Focused changes

The previous channel map combined a strong pigment-darkening multiplier, dark-blue blend and bump valley. This could produce drawn-looking lines. This revision reduces pigment darkening from 0.52 to 0.12, engraving dark-blue blending from 0.62 to 0.08, and the ivory shoulder blend from 0.48 to 0.10. The height valley is shallower (48 rather than 84 encoded levels) with a restrained shoulder. These are texture-derived shading channels, not new physical cuts.

The existing packed roughness/metalness maps now balance diffuse and reflected light: base metalness 112/255 (previously 177/255), amber 157/255 (195), turquoise 133/255 (184), coral 118/255 (164). Amber roughness rises from 80/255 to 102/255 for a broader satin reflection; turquoise and coral become moderately less rough. Local pigment palettes, three panel boundaries and all 13 ornament paths remain identical. No added colour regions, emissive/glow, lights or exposure changes. Sidewalls retain their existing satin sapphire material.

The goal is more readable satin surfaces and light-responsive channel edges. **This is an unapproved visual hypothesis, not a verified artistic improvement.** The original glyph silhouette and detached component are preserved.

## Validation and evidence

[Browser report](report.json): interaction-free study initialization and Close/Oblique state checks passed, no page errors. Source face comparison found **zero different bytes**. Original mask/font/path hashes, two components, bounds, panel sample counts and fixed GPU-map/geometry budgets passed. [Source audit](source-audit.json) verifies exact unchanged default finish, source vectors, geometry construction, cameras, inspection, lighting, sidewall material, palette/ornament definition and entry page. Only the experimental header changes outside the experimental map factory.

Both optional native PNG readbacks exceeded their 10-second budgets. There are **no new screenshots** from this revision. The report's `success: true` applies to its assertions, not successful visual capture. Old Surface 08 or bake 10 images must not be presented as finish 11. No further lengthy capture retry was made. Owner hardware-browser visual review is outstanding; Quest is untested.

Font extraction, projected cap/counter integrity, eight-excerpt Arabic content verification, study-scope guard and production build are recorded in the validation report. No full Harf/XR interaction rerun is claimed for these isolated map-value changes; their source remains untouched.

## Resource limits

| Resource | Bake 10 | Finish 11 |
| --- | ---: | ---: |
| Letter triangles | 11,940 | 11,940 |
| Letter geometry buffers | 1,146,240 bytes | 1,146,240 bytes |
| Surface maps | 2 × 384×576 RGBA8 | unchanged |
| Surface raw bytes | 1,769,472 | 1,769,472 |
| Estimated surface bytes incl. mipmaps | 2,359,296 | 2,359,296 |
| Additional meshes / draw submissions | 0 | 0 |

No geometry, material count, GPU texture count or shader change. The snapshot lists 5 renderer geometries and 10 textures. `renderer.info.render` is the last pass after Spark's internal resets, **not total scene draw calls**. Equal total draw cost is inferred from unchanged draw structure; a new whole-frame GPU trace was not obtained. Actual map bake elapsed 3,080.9 ms under concurrent software-renderer/build load; this is not a controlled startup comparison or Quest/Windows performance estimate. No hardware speed claim.

Reproduce with Vite at port 5316, then `node scripts/check-spark-bake.cjs`. It saves this revision's report without overwriting historical bake 10 evidence.

No Living Orbit, Harf, competition footage, Android, main or production changes. No merge or production deployment. Stop for visual review.
