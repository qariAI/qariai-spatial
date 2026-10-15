# The Celestial Seal v0.1 — Phase 1 visual review

Standalone `/celestial-seal.html`, optional route only. Branch `prototype/celestial-seal-v0.1`, based exactly on approved integrated PR #18 `b1521ea1149872debeb840b5a8c8d47c4558ca92`. No change to `/`, seven-letter choreography, two phases, Harf, Quest entry routes, competition recorder or existing competition film. No discovery link, illumination, selectable letter behavior or sculptural-to-orbit transformation has been implemented.

## Design and authenticity boundary

An original openwork circular medallion: seven source-font isolated Arabic motifs, dark stone, blackened bronze sides, raised pale silver-gold faces, narrow bevel underlayers and engraved architectural interlace. Seven tapered cut-through voids give actual negative space; glyph sides and cast shadows give physical depth. A seeded fine grain texture changes roughness and bump, not wording. Raking cool light and warm reflected color harmonize with Living Orbit; a faint turquoise edge is restrained. No reference photograph was traced, reproduced or rasterized.

The whole Arabic glyphs remain intact and uniformly scaled in XY. Each isolated motif is rotated as a whole around the circle. The original OpenType outlines and the center excerpt retain their native shapes and diacritics. Letter faces use no bevel that changes the face contour; a separate bronze bevel sits below them. The decorative interlace is **non-text geometry beneath the lettering**, not invented letter joins, additional diacritics, random Arabic or a claim of historic circular calligraphy. This is a **font-derived sculptural study pending a qualified Arabic calligrapher's composition/legibility review**, not certified custom calligraphy. More complex interwoven letter ligatures are deliberately deferred rather than fabricated. The center excerpt is complete and unbroken within an unobstructed circular core.

Seven clockwise motifs, starting at twelve o'clock: **ك ل ف ي ف ل ك**. This conceptual seven-letter anchor is not the whole verse and is not presented as one. Their circular rotation invites approaching and viewing each sector; it does not reverse or mirror the source glyphs.

## Text audit / source

Visible central excerpt, exact unnormalized Uthmani characters:

> كُلّٞ فِي فَلَكٖ يَسۡبَحُونَ

**Al-Anbiyāʾ / Qur’an 21:33, words 8–11, excerpt.** Source: [Quran.com / Quran Foundation](https://quran.com/21/33), independently captured word data already audited in the approved baseline at `docs/v1.4.7/source-words.json` (checked 2026-10-13). The new audit compares every character against that authoritative cached word span and the existing approved content. It does not claim a new live publisher fetch; that destination is restricted by this cloud network policy. No normalization, mark replacement, abbreviation, word splitting or reversal. No new Qur'anic passage was invented or selected by visual similarity. See `text-audit.json` for exact content and source hashes.

Font: bundled **Amiri Bold**, The Amiri Project Authors, SIL OFL 1.1. Original font and license remain at `public/fonts/Amiri-Bold.ttf` and `public/fonts/OFL-Amiri.txt`. HarfBuzz shapes Arabic RTL with `arab` script / `ar` language. The checked-in `src/seal/outlines.json` records glyph IDs, clusters, advances/mark offsets, exact text and the font SHA-256. All characters have glyph coverage; no `.notdef` substitutions. FontTools extracts the actual positioned contours; Three SVGLoader tessellates them into relief. There is no AI-generated Arabic image or font fallback in the sculpture. The excerpt is a single shaped run, preserving connections, spacing and diacritics. The baseline font is used for the footer; the sculpture itself needs no runtime font fallback.

## Camera and comparison

- **Wide / Return** frames the entire seal.
- **Approach inscription** moves to a readable central macro; return reverses the approach.
- Drag to inspect; wheel to move closer/farther within bounds. Pressing either view button restarts its approach even after a manual orbit. There is no new application choreography phase.
- The prototype uses the same exponential easing family as existing desktop exploration, with its own scale-appropriate camera targets. Elapsed-time easing and a 3.6-second settle avoid endless camera motion on slow software rendering. It honors reduced-motion preference. It does not change the main camera rig or move an XR headset.
- **Compare historical engraving** shows the live seal beside the genuine `docs/v1.4.8/refinement/after/close.png` archive already present in the approved baseline. The pane is explicitly labelled **historical / before final sculpted revision**. It is not a fresh render of current baseline material or camera framing. The original capture state is stored beside that archive. **Live Living Orbit** opens the actual existing route for a current-source comparison on the owner's hardware. A live second-canvas comparison was attempted but stalled the cloud browser; it was removed rather than shipped as a reliable feature. This lightweight historical comparison uses no second WebGL context or extra engraving atlas.

## Genuine captures and limitations

`wide.png` and `close.png` are **actual Chromium SwiftShader renders**, 960×720, captured from Chrome's native browser-view backend. They show the same final sculpture, materials and text. No post-capture image editing, image generation or synthesized imagery was used. `compare.png`, if supplied, is the actual prototype UI with its explicitly historical reference pane, not a fresh baseline capture. `desktop-check.json` reports the capture route state, geometry counters, successful approach/return and empty page-error list. The final control-only change makes repeated view-button clicks restart the same transition; artwork/camera target positions in the images are unchanged.

Initial larger 1920×1080 / 1440×1000 surface captures timed out on the close view. Draw-group consolidation reduced font cap/side rendering to two draws, and demand rendering now stops GPU work when the seal is idle. The smaller native-view capture passed. This is **not** a 30/72 FPS performance claim: the recorded idle browser RAF callback rate do not measure the now-idle scene's rendering FPS. No physical Quest, stereoscopic comfort, headset camera or Windows GPU validation was performed. Main and Harf modules are byte-identical to the specified base; prior cloud limitations of their full scenes still apply. The attempted live reference comparison was terminated after stalling and is not claimed as passed; the historical-image fallback is separately checked. The screenshot/test limitations are kept rather than claiming full hardware support.

## Resource budget

Actual standalone renderer counters from capture: **13 draw calls, 100,836 rendered triangles, 12 geometries and two textures** (grain + shadow). This is intentionally bounded, but requires hardware validation before any Quest integration. The checked-in outline JSON is ~29 KB. Grain is 256×256 RGBA, ~0.35 MB with mipmaps; one 512×512 shadow target/depth buffer is roughly 2 MB, implementation-dependent. There is no HDR environment, bloom, postprocessing, per-frame texture painting, glyph animation or particle field. Main geometry is static and shared by material; the renderer works on demand during camera/controls/state changes and idles otherwise. The measured vertex/index attribute storage is 8,644,240 bytes (~8.24 MiB); geometry byte count is exposed via `window.sealStats.resources`; actual driver allocation may differ. Main experience texture budgets are untouched. Comparison adds only the archived image in the DOM, not the original ~45 MB engraving atlases or another renderer. The historical pane remains a desktop review aid, not a Quest mode.

## Reproduce / verify

```sh
npm install
npm run build
node scripts/check-seal-content.cjs
node scripts/check-calligraphy-content.mjs
```

The generated outlines are bundled; normal builds need no Python tools. For source regeneration only, use an isolated Python environment with `scripts/seal-font-requirements.txt`, then `python scripts/generate-seal-outlines.py`. To reproduce the proven capture backend on Linux with Playwright and `/usr/bin/chromium`:

```sh
SEAL_CAPTURE_SMALL=1 SEAL_CAPTURE_BACKEND=view node scripts/check-seal-desktop.cjs
```

It verifies render readiness, settled wide/close camera states, actual screenshots, resource counters, return and browser errors. It does not bypass rendering with CSS, replace artwork or force a success flag. The full-size Playwright surface backend remains an available diagnostic, not a claim that it works in this cloud.

## Phase boundary / competition tradeoff

This is a nice-to-have original visual study, not a blocker for submitting the existing verified competition experience. Stop at **Phase 1** for the owner's visual review. No lighting selection, hand mapping, XR controls, discovery trigger, dissolve, transformation, new main phase, production change or merge is authorized/implemented. A calligrapher-led revision could turn the conservative font-derived arrangement into a more organically interwoven Arabic composition after approval; no such typographic changes are implied by this draft. The owner's image review and text legibility review decide whether to continue.

Historical comparison provenance: the source image and `capture-state.json` already exist in PR #18's baseline under `docs/v1.4.8/refinement/after/`. Its camera was [0,26,78], before the final sculpted revision's [-4,30,84] framing and later material refinement. The baseline's `docs/v1.4.8/sculpted/README.md` explicitly warns these historical images must not be presented as final-source appearance. The prototype follows that warning in its visible caption, alt text and this audit. No archive file was edited.
