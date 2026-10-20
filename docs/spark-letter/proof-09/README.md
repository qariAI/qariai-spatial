# Surface 09 — original 2D material-design proof

**For design approval only. The running Surface 08 sculpture is unchanged.**

- [Labelled composition and enlarged details](labelled-proof.png)
- [Unlabelled face proof](face-proof.png)
- Editable vectors: [labelled SVG](labelled-proof.svg), [face SVG](face-proof.svg)

These images illustrate a proposed finish. They are not application screenshots, physical engraving, a PBR-rendering result, or headset evidence.

## Proposed design

Keep the exact Amiri kāf and detached component, with the three existing panel footprints. A quiet satin sapphire field carries the silhouette. Amber uses controlled polished-metal tonal variation; turquoise stays satin; coral carries selective fine engraving. Existing geometry, camera framing, sidewall profile, lighting and region colours remain the foundation.

Within the existing regions, use a hierarchy of one flowing primary incision, unequal secondary branches and a few hairline accents. Leave visible unengraved space. Dark valleys and restrained warm edge lines provide contrast without emissive glow. The curves are original nonscriptural surface ornament, not new Arabic strokes, letters, ligatures or punctuation. No butterfly asset or concept image is reused.

The SVG uses illustrative gradients and grain to communicate the intended material separation. Those tones are not a promise of identical appearance in the physical renderer; future view-dependent reflections must be checked separately.

## Exact-shape provenance

The proof copies the original `public/spark-letter/kaf-outline.json` path verbatim, with both contours. Only uniform scale, translation and the ordinary font-Y-up to SVG-Y-down conversion are used. There is no horizontal reversal, outline tracing, simplification, displacement or redesign. All surface ornament is clipped to the original glyph; region-specific engraving is also clipped to the existing panel paths.

- Letter: ك, U+0643; Amiri `uni0643`, version 1.002, original bundled OFL font.
- Font SHA-256: `65e3e6fe6af66bb6d24959bd537a89ea35de14083f5a2e2290c246136c2b047b`.
- Glyph-path SHA-256: `2c381807e055fc8a08b6e03f4e4c605e4279af6cbc26334e272763b862b8d8c4`.
- All three panel paths are copied exactly from Surface 08 `surface-design.js`.
- The single font-derived letter is not a Qur'anic passage or bespoke/calligrapher-authenticated Thuluth composition.

`build-proof.py` reproduces the documentation SVGs. `audit.json` records source checks and output hashes. PNGs were rendered from those SVG documents in Chromium; no Three.js application or generated-image model was used.

## Resolution and implementation gate

Some illustrated hairlines are **narrower than one texel** in the current 384×576 surface maps. The proof must not be taken as evidence that all detail survives the existing texture budget. If the design is approved, first test a bounded texture bake using the existing maps: retain the main courses and selected branches, and reject unstable/aliased details. Do not silently increase textures, add geometry, simplify the Arabic, or claim shading is physical extrusion.

Before any 3D change, review the full-letter balance, engraving hierarchy, empty areas and material distinction. Future acceptance also requires exact contour/mask checks, unchanged geometry/framing/regions, filtered close/oblique/side captures, resource comparison and honest hardware limitations. The current geometry, framing, rendering code and performance envelope are untouched by this documentation-only step.
