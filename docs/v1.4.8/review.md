# v1.4.8 artistic polish

Baseline: v1.4.7 commit `14aa5c8e04845a9fb7ace0020d1ee74a421377d7`. The remote baseline was fetched and confirmed to match before publishing.

## Artwork

The existing ink-derived stardust field now uses restrained warm-gold and turquoise palette regions and a stronger low-distance-detail emissive contribution. No readable inscription color leaks into the far representation: the original distance blend, thresholds, camera proximity calculation and temporal damping are retained. No new particles, bloom passes, textures, geometry or scene lights are added. The palette uses inexpensive arithmetic rather than transcendental shader functions.

Near detail gains narrow engraved shadow valleys surrounding raised letter faces, a stronger distance-scaled bump response, and a multi-stop metallic gradient aligned to the measured ink bounds. Gold and bronze finishes retain their band hierarchy. Geometric paired filigree arcs occupy measured empty gutters beside complete inscriptions. Slightly varied gutter spacing changes the composition without overlapping text. The hero course's ink-height limit is reduced by six atlas pixels to leave room for the relief contour and shadows. Native shaping, polar compensation, complete words and diacritics are preserved.

`src/calligraphy/content.ts` and the independently captured source word snapshots are byte-identical to v1.4.7. `node scripts/check-calligraphy-content.mjs` verifies all eight excerpts against those snapshots, including combining marks and pause marks. No sacred text has been retyped or normalized.

## Controls

CSS reserves separate bottom rows for the existing control bar, Quest status, and build note, including safe-area offsets. The existing wrapping controls and smaller-screen status visibility rules remain. The centered stage is raised where needed to clear wrapping controls; the desktop side panel retains its existing design. No new panel or interaction is introduced. App.tsx is byte-identical to the baseline, preserving choreography, two phases, planetary system, camera behavior and WebXR hand interactions.

## Budget and review requirements

Two RGBA 4096×1024 atlases with mipmaps remain approximately 42.67 MiB plus the existing 32×32 (4 KiB) glow map. Artwork stays at five draws / 10,800 triangles, with the existing 72 desktop / 36 XR decorative point draw ranges, anisotropy cap, device texture-size cap and disposal. Initial scene budget remains 57 draws / 23,698 triangles / 13 uploaded textures. No runtime service calls or dependencies are added.

The screenshots provide v1.4.7 before views and v1.4.8 far, medium and close views. The atlas image exposes the complete shaped text for typography review; its alpha channel contains LOD data. This is a focused polish of structured manuscript courses. Final artistic approval, qualified Arabic typography review, and Quest hardware legibility, frame-time and hand-interaction testing remain necessary. Desktop software rendering is not headset performance validation.

Validation commands: `npm run build`, `node scripts/check-calligraphy-content.mjs`, `git diff --check`, and `node scripts/calligraphy-desktop.cjs` (requires Playwright and Chromium in the test environment). Production builds retain the existing large-bundle warning. Detailed desktop and responsive-layout results accompany the screenshots.

## Completed checks

Production build, exact Arabic-content verification and whitespace checks pass. The existing large-bundle warning remains. Desktop Chromium passes pointer selection/mirrored highlights; Explore/Return camera endpoints; far/medium/near detail states; tracing and Escape; both phases; pause/resume controls; speed; all six planet-navigation states; reset; and desktop hand simulation. No page or shader errors were reported.

Control/status/build-note separation, stage-panel separation and button bounds pass at 1920×1080, 1440×900, 1100×760, 980×600, 900×600, 821×600, 820×600 and 390×760. `responsive-layout.json` records those actual DOM measurements. A separate fresh 390px viewport verifies Pause/Resume clicks and visible controls. `controls-390.png` is a focused control crop from that fresh viewport, with the 3D frame loop stopped only in the test harness. The initial rapid-resize software-rendered screenshot omitted the toolbar despite valid bounds; it is not used as evidence. Run this supplemental check with `LAYOUT_ONLY=1 node scripts/calligraphy-desktop.cjs`.

[Far](far.png) · [Medium](mid.png) · [Close](close.png) · [Before far](before-far.png) · [Before close](before-close.png) · [900px controls](controls-900.png) · [390px control crop](controls-390.png).
