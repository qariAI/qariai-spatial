# Experimental finish 12 — channel profile and finish separation

Continuation from finish 11 at `e1df929f4e45ee4b717bd8fce3f1f0a471ac15c5`, following owner review of genuine front/oblique screenshots. The satin highlights had improved, but fine engraving was barely readable. This revision keeps the experiment behind the single exact `finish=proof` selection. Default Surface 08 remains unchanged.

Preview: https://qariai-spatial-git-prototype-spark-lett-805d90-qariais-projects.vercel.app/spark-letter/index.html?mode=hybrid&view=close&finish=proof

The header must read **EXPERIMENTAL FINISH · 12**. Inspect Close and Oblique, then drag slowly to assess reflection changes.

## Focused changes

- Retain all existing ornament centre paths and widths. Give their auxiliary height profile a more defined valley and symmetric shoulders. Existing scene lighting determines the slope highlight as the camera orbits; no fixed directional white stripe is painted into the panel.
- Keep the reduced pigment darkness from finish 11. Its very small shoulder tint follows the symmetric profile; existing palette and metalness values are unchanged.
- Separate panel roughness more clearly: amber/polished 82/255, turquoise/satin 143/255, coral/fine engraved 168/255. Channels add 18 encoded roughness levels, while shoulders subtract up to 20 for a restrained moving glint. Fine grain remains bounded and sparse ornament remains unchanged.
- Keep both shoulders gated by the existing panel and original glyph interior. No outline inflation, new colour regions, geometry, maps, glow, exposure changes or new lights.

These are texture-derived shading channels, not physical incisions. No new authentic-calligraphy or Gaussian asset claim. The font-derived Arabic silhouette and detached component are untouched.

## Genuine rendering and honest visual assessment

[Close native render](close.png) and [Oblique native render](oblique.png) were obtained directly from the application canvas in the bounded SwiftShader run. No retouching, synthetic footage or texture-only illustration is presented as 3D evidence.

![Finish 12 — actual Close rendering](close.png)

The satin highlight is visible on amber at Oblique; the sculpture remains dark sapphire with unchanged silhouette and separated component. Channel detail remains faint at the standard framing. **The screenshots do not establish a substantial artistic improvement over finish 11**, for which no matching native PNG was obtained. This is a controlled incremental profile experiment, not a claim of reaching the Spark reference's surface richness. No geometry, glow or extra colour is added to mask that limitation. Owner review is still required before promoting this finish.

## Integrity and resources

[Source audit](source-audit.json) records exact byte comparisons with finish 11 for the source vectors, default maps, sculpture construction, sidewall/face material configuration, lights, cameras, inspection code, ornament definitions and entry page. The study script only changes its experimental revision label.

The fixed letter remains 11,940 triangles / 1,146,240 geometry bytes; two 384×576 RGBA8 surface maps use 1,769,472 raw bytes, estimated 2,359,296 with mipmaps. No meshes, texture allocations, shaders or draw structure are added. Auxiliary sampling work during the bake grows by three neighbour lookups per texel; no new per-frame loop is added. CPU bake timing depends on the execution environment and is not a Quest/Windows performance claim.

See [browser report](report.json) and [validation](validation.json) for actual check/capture results. Capture success and visual approval are separate from integrity assertions; historical images are not evidence of finish 12. Small ornament may still soften at the fixed texture resolution. Physical Quest testing and owner visual approval remain outstanding.

Reproduce with Vite on port 5316, then `node scripts/check-spark-bake.cjs`. Font, cap/counter, content, scope and build checks are recorded separately.

No Living Orbit, Harf, competition footage, Android, main or production changes. No merge or production deployment. Stop for visual review.
