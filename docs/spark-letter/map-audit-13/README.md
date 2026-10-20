# Finish 12 map/shader diagnosis

These are actual baked UV-map data visualizations, **not scene screenshots**. Alpha is the original font silhouette solely for inspecting the UV sheet; no text or geometry was generated from these images.

- [Pigment](pigment.png): original localized colour.
- [Height R](height.png): fine channels are present, range 157–231/255 inside the glyph.
- [Roughness G](roughness.png): distinct panel responses, range 62–190/255.
- [Metalness B](metalness.png): range 112–157/255.

The unmodified vendored Three.js shader (`public/spark-letter/vendor/three.module.js`, `bumpmap_pars_fragment`) reads **R**, multiplied by `bumpScale`, and computes forward screen-space differences before `perturbNormalArb`. Roughness correctly reads **G**, metalness **B**, and the packed data texture has no sRGB conversion. There is no missing-map/wrong-channel explanation.

The face material used `bumpScale: .005`. On a flat, orthogonal surface, the shader's normalized surface derivatives reduce its bump tilt to approximately `atan(scale * hypot(deltaHeightX, deltaHeightY))`. Using one-texel finite differences of the actual map, sampling only glyph-interior gradients larger than 0.01, gave 14,183 samples: median **0.0151°**, p95 **0.0483°**, max **0.0898°**. At scale .5 these estimates are **1.511°**, **4.821°**, **8.905°**.

These are **source-map shader estimates**, not measured framebuffer normals or physical groove depths. Perspective, crown normals, pixel footprint, interpolation and mipmaps change the actual per-pixel response. Narrow, 1–2 texel decorative branches still soften at standard framing. The small bump multiplier is a concrete attenuation mechanism; visual usefulness of its correction must be assessed in actual scene captures.

[Raw measurements and assumptions](report.json). Run `node docs/spark-letter/map-audit-13/audit-maps.cjs` with Vite on 5316 and the existing Playwright installation. This CPU-only harness loads the map factory, never starts the application/WebGL render loop, and has a 45-second overall bound. It writes these four visualizations and the report. It applies no new outlines, normalization, palette or geometry changes.
