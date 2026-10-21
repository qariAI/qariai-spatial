# Desktop polish: tracing, starfield and orientation

Base: `00dc02f3db814b06ee6b2daa00566b7fd0783356`. Owner requested all three desktop improvements and deferred Quest testing. Draft PR #35 stays isolated and unmerged.

## Visible changes

1. **Inline free tracing:** the existing Amiri-rendered ك ل ف ي guides use the same satin sapphire ramp as desktop Harf when `orbitArt=study` is selected. The original font, Unicode, detached components, text metrics and placement remain exact. Gold pointer ink, reset and close behavior remain unchanged. The heading now identifies free tracing, distinguishing it from Harf's validated Bāʾ practice surface. SVG text selection is disabled so dragging cannot cover the glyph with browser selection blue. This adds no letter contours or physical relief.
2. **Animated starfield:** desktop has restrained per-star brightness diversity, two slow low-amplitude twinkle frequencies and a smaller warm-accent fraction. Exact seeded positions, shell rotation rate, particle counts, circular footprint, 16px ceiling, opacity parameter and Pause/Resume are retained. No added texture, geometry or draw submission. XR selects the original color/pulse expression through a coherent uniform branch; scale compensation, viewport sizing, draw reduction and no-XR-drift behavior are unchanged. The desktop fragment path adds one sine calculation; it is not a performance optimization.
3. **Orientation/navigation copy:** the existing phase card explains click/1–7 selection, free versus guided tracing, and inspection controls. The practice link is labeled guided practice. The initial opt-in status explains desktop orbit/zoom instead of implying that a missing headset is an error. The note explains that Hand Mode uses the mouse and VR entry appears on a supported headset browser. No new phase, menu, camera behavior or section is added. Existing navigation paths/session teardown remain exact.

Without `orbitArt=study`, original scene presentation/copy is preserved; the drawing surface's prevention of accidental text selection also applies to the original guide.

## Evidence

- `inline-kaf.png`, `inline-ya.png`: genuine Chromium captures of the extracted, unmodified React TracePanel component with original local Amiri. Blank surrounding area is the component harness, not a fabricated full-scene capture.
- `panels.json`: native glyph metrics/mark placement, exact gold trail points, reset and return for all four unique letters in original and sapphire modes. Exact pointer handler and state source assertions; Harf and sculpture source byte checks.
- `browser.json`: the single current full-scene attempt timed out during initialization before any capture, with no recorded console errors. The exact blocking initialization stage was not established. Current full-scene visual/performance verification remains incomplete; no successful full-scene result is claimed. Previous all-seven scene evidence remains historical in `../letters-v03/`.
- `starfield-isolated.png` and the stars section of `panels.json`: actual source ShaderMaterial compiled and drawn separately in Chromium/SwiftShader, without the scene atlas. This establishes shader execution, not successful full-scene startup. Two submissions, 6,600 points, zero triangles, zero textures and 105,600 geometry bytes are checked.
- `validation.json`: build/content/input/navigation checks and resource comparison.

The first component captures exposed browser text selection; CSS was corrected and the captures regenerated. An initial isolated star harness omitted an HTML body and failed before drawing; `panels-harness-error.json` records it. The corrected isolated run passes with no browser or WebGL error. No artwork was changed to conceal the effect.

## Limits

The attempted full-scene run uses Chromium/SwiftShader with deterministic harness stepping. Its startup timeout remains unresolved; no emulator-only or harmless classification is inferred. It does not establish hardware frame rate, headset comfort, stereo throughput or physical Quest readiness. No physical Quest test is requested or claimed in this pass. The existing shader/chunk-size and Quest performance limitations remain. Calligraphy practice centreline and stroke order still require qualified review; free tracing remains explicitly ungraded.
