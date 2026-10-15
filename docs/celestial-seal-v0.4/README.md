# Celestial Seal v0.4 — nonscriptural material and geometry foundation

Standalone opt-in route: **`/celestial-seal-foundation.html`**. Branch `prototype/celestial-seal-v0.4-foundation`, based exactly on PR #26 head `c4d5362c177c22983380637eedfa7c65cb311412`. Draft target: `prototype/celestial-seal-v0.2`. All existing Living Orbit, Harf Studio, previous seal studies, recorder, fonts and competition footage remain unchanged. The earlier `/celestial-seal.html` is a historical study; it is not the new v0.4 route.

**NONSCRIPTURAL GEOMETRY ONLY. No approved calligraphy is loaded or represented.** The original Al-Mulk 67:3 vector master is still missing. No Arabic text is rendered in this prototype, no font outlines are generated, no AI image is projected onto the object, and no script-shaped placeholder is used. The eightfold polygons are calibration/architectural geometry. They do not purport to reproduce the missing artwork, seven letters, a verse, or a literal depiction of heavens.

## Geometry / material foundation

- Machined blackened-bronze body with a custom lathed architectural rim, recessed slate-blue field, narrow metallic crown and restrained turquoise tesserae/inlay.
- Subtle straight-edge eightfold filigree and four hollow polygonal calibration contours. These replace no approved vector artwork; their arrangement does not dictate the future calligraphic composition.
- Seven nominal shallow front-face slots: **−0.12, −0.08, −0.04, 0, +0.04, +0.08, +0.12** scene units. The slate, fine filigree and four positive contours expose the levels. Rim shoulders and bevels are continuous geometry outside this calibration contract; seven slots do not mean every vertex must occupy one of seven Z coordinates.
- Materials use shared procedural **tangent-space normal** and **packed roughness/metalness** maps. Normal/ORM textures stay in linear/non-color space, with repeat and mipmaps. Seeded shallow grain and fine machining scratches vary reflections without changing geometry.
- A small analytic studio cubemap is prefiltered with PMREM for metallic reflections. This is generated lighting radiance, not an artwork image or scripture texture. No HDR download, bloom, heavy particles or per-frame texture generation.
- PCF soft shadow filtering uses actual geometry and light-space depth occlusion. Raking cool light, restrained warm reflection and a low turquoise accent retain PR #26's material direction. Normal detail supplements physical relief; it is not claimed as displaced geometry.
- Four consolidated material batches reduce the static medallion to four main-render draw calls. CPU-created staging geometries and PMREM scratch targets are disposed; profile changes dispose old geometry/maps/environment and remount the shadow-casting light so its actual shadow target is resized.

## Camera and controls

Wide / Return and Approach relief retain PR #26's demand-rendered, time-based camera interpolation and OrbitControls behavior. An opt-in **21-second camera study** provides wide → approach → close hold → return → wide hold. The medallion never animates or transforms. This adds no Living Orbit choreography phase and does not control an XR headset pose. Manual orbit cancels the programmed camera movement. Repeated Return works after manual exploration. Reduced-motion preference skips camera travel.

The header/footer keep the NONSCRIPTURAL disclosure visible in both captures. No banner, magnifier, sacred inscription or new main-app panel is introduced. Technical measurements live in a collapsible section of the optional foundation page only.

## Quality profiles and resources

| Setting | Desktop | Quest-conscious preparation |
| --- | --- | --- |
| Normal + ORM | 2 × 256² RGBA8, mipmapped | 2 × 128² RGBA8, mipmapped |
| Studio cubemap source | 64² per face | 32² per face |
| Prefiltered environment | Small RGBA16F CubeUV | Smaller RGBA16F CubeUV |
| Actual shadow target | 512² | 256² |
| Rim radial segments | 160 | 96 |
| Bevel segments | 3 | 2 |
| DPR cap | 1.4 | 1.0 |
| Rendering | On demand | On demand |

The Quest-conscious profile is a bounded starting configuration, **not headset validation, an automatic device claim, or a guarantee of a VR frame budget**. The optional page does not introduce an XR session, hand tracking or controllers. Existing WebXR experiences are untouched.

`desktop-check.json` contains measured main-render calls/triangles, actual shadow target sizes, renderer texture/geometry counts and geometry attribute bytes. `estimatedTextureBytes` sums the two material-map allocations (including mipmaps), the live prefiltered environment and an estimated eight bytes per shadow pixel for color/depth. Estimates exclude driver padding, framebuffer/program overhead and transient PMREM generation. They are not a GPU memory query. Main-render draw-call counts are not a separate accounting of every shadow/PMREM pass.

### Measured resource counts

Final browser report at 480×720 (actual captures remain 960×720):

| Metric | Desktop | Quest-conscious software profile |
| --- | --- | --- |
| Main-render draw calls | 4 | 4 |
| Rendered triangles | 9,578 | 6,274 |
| Renderer geometries / textures | 4 / 4 | 4 / 4 |
| Geometry attribute storage | 919,488 bytes | 602,304 bytes |
| Estimated persistent maps + environment + shadow color/depth | 3,484,331 bytes (~3.32 MiB) | 1,043,115 bytes (~0.99 MiB) |
| Verified actual shadow target | 512×512 | 256×256 |

The test completed intake/mark/rights rejection cases, real render readiness, approach/return, manual orbit/return, the 21-second camera study, profile switching, reduced motion and mobile-width overflow checks with no page errors. All five built entry pages and the original font returned HTTP 200 in the local built-file smoke test. Production build passed with the existing shared Three.js chunk warning; original calligraphy-content, Harf tracing/session and integration simulations passed.

### Performance measurement method and limits

The diagnostics force a bounded sample of **actual rendered frames**, after warmup. They measure CPU time between WebGLRenderer scene callbacks and the interval between render submissions. These are **not GPU timestamp measurements, idle browser RAF FPS, motion-to-photon latency, or Quest frame rate**. Demand rendering idles between interactions.

Cloud images use Chromium SwiftShader at 960×720; final functional/timing checks use 480×720, with no physical GPU/headset claim. Initial continuous samples exceeded the 20-second deadline; the smaller profile also produced a partial sample during development. The final diagnostics explicitly report `partial-timeout (n/12 frames)` with observed timings if some frames were measured. Zero observed frames remains an error. Incomplete samples are never relabelled complete, and cannot establish target performance. Final desktop timing was explicitly partial (9/12 frames); the Quest-conscious software sample completed 12/12. Mean CPU callback durations were about 2.39 ms / 5.88 ms, while mean render-submission intervals were about 1,480 ms / 828 ms. These slow software timings, small samples and differing runtime load cannot establish a hardware comparison or VR suitability. JSON reports retain status/limitations; hardware testing must use the intended headset/browser with repeated longer runs.

## Future vector intake — independent asset still required

`src/seal-foundation/vectorIntake.ts` defines a reusable, asynchronous **validation contract**, not a font-to-art generator or a connected artwork loader. The current renderer cannot load an inscription. It accepts original SVG bytes plus:

- Locked complete verse text and SHA-256; exact 18-word logical order and four course spans **01–05 / 06–12 / 13–14 / 15–18**.
- Original asset SHA-256, source URL, viewBox and explicit SVG Y-down coordinate convention.
- Stable closed-path IDs, exact `d` values/fill rules, word IDs, canonical Unicode-codepoint mappings, body/diacritic/pause roles, mark-owner IDs and one of seven nominal depth slots.
- Separate calligrapher and Qur'anic-text approval records tied to the exact original SVG hash, and an explicit rights record for WebXR, technical 3D adaptation, public-source distribution and film use.

The intake checks the raw-byte digest, rejects font-text/external/scripted SVG content, requires a flattened self-contained path master (no transforms/styles to resolve), compares actual SVG path strings and fill rules with metadata, verifies reciprocal word/path mapping and canonical character coverage, and keeps marks at their owner's depth. Both source pause signs must be identified on W05/W12. No automatic normalization, contour rewriting, invented joins or glyph mirroring is performed. Coordinates/curve strings stay untouched; no approved vector asset is present.

**Approval/rights fields are assertions to inspect, not identity authentication or legal verification.** An automated validator cannot prove that the drawn curves spell the verse or that a referenced approval is genuine. Qualified reviewers and the owner must inspect original artwork, check source/font/art rights, compare raster proofs and approve file hashes before a future contour-to-relief adapter is enabled. The strict SVG subset is intentional; any flattened export needs its own recorded approval rather than engineering silently changing the artist's master.

The browser regression uses explicitly labelled **synthetic geometric schema fixtures** to exercise the contract. Their fictional approvals/rights are test data, not a claim of actual expert approval. No fixture is loaded into the displayed sculpture. Failures cover changed sacred text, asset hash, missing approval/rights, displaced or misidentified marks, reading order, path mismatch, missing pause and incomplete mapping.

## Verification / reproduce

```sh
npm run build
FOUNDATION_SMALL=1 FOUNDATION_CAPTURE=off node scripts/check-seal-foundation.cjs
node scripts/check-calligraphy-content.mjs
node scripts/check-harf-xr.cjs
node scripts/check-integration.cjs
HTTP_ONLY=1 node scripts/check-entry-pages.cjs
```

The successful capture viewport is 960×720. Final functional checks use an explicitly reported smaller viewport when `FOUNDATION_SMALL=1`, because later large-viewport software runs timed out. Preserved `initial-performance-check.json`, `large-viewport-check.json` and `capture-limitation.json` show those observations without converting them to passes. `FOUNDATION_CAPTURE=off` retains the existing genuine images and makes no new capture attempts.

The foundation browser check requires Playwright and `/usr/bin/chromium`. It verifies the visible NONSCRIPTURAL label and absence of Arabic text in the rendered page, intake rejection cases, real render readiness, wide/close images, approach/return, drag/return, normal camera tour, profile switching with actual shadow allocation, reduced motion and mobile overflow. Capture uses bounded native CDP view screenshots, not generated imagery. The genuine 960×720 [wide](wide.png) and [close](close.png) views show the same nonscriptural material study. No Quest-conscious profile image is supplied: further cloud image capture was stopped after the native screenshot timeout. The two existing desktop captures were retained; [screenshot-provenance.json](screenshot-provenance.json) records their hashes and scope.

The locked verse snapshot exists only as intake/test provenance. Its canonical SHA-256 remains `fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc`. [Quran.com 67:3](https://quran.com/67/3) / [QuranEnc 67:3](https://quranenc.com/ar/browse/arabic_mokhtasar/67/3), checked 15 October 2026. No new wording or Arabic geometry is derived from it.

## Outstanding review

Original calligrapher-produced vectors, word/mark mapping and recorded asset-specific approvals/rights remain outstanding. No sacred artwork is approved by this technical prototype. Quest hardware frame time, stereo comfort, mobile thermal behavior, physical relief readability, map aliasing and actual WebXR integration remain untested. The production build retains its existing large shared Three.js chunk warning.

Stop for owner review of the foundation. No merge, production deployment, Android change or competition-video edit.
