# Sculpted engraving, Arabic clarity and desktop framing

Continues commit 43044928 on the existing v1.4.8 branch. The relief atlas now contains a filtered, stepped rounded shoulder, raised ink face and recessed outer valley. Colour glyph coverage is not blurred. Stronger bump shading responds to existing scene lights; near emission is reduced so it does not flatten the shading. Roughness uses the existing relief texture's green channel: polished ink, matte slate and rough valleys. This adds a material texture sample but no GPU texture allocation, geometry or draw call.

Small courses have larger height allowances and nominal font sizes, wider complete-inscription gutters, and radial proportion compensation calculated separately for each course. The hero course retains the strongest hierarchy. All eight source excerpts and references are unchanged; native Amiri shaping and full ink-bound fitting remain in use. Geometry, UV handedness, LOD distance thresholds and damping are unchanged.

Only the desktop Explore Calligraphy destination changes in App.tsx, from [0,26,78] to [-4,30,84]. The target, return destination, transition, OrbitControls and XR early-return guard remain unchanged. The wider, higher framing reduces projected planetary prominence without modifying Jupiter or any planet transform. Jupiter moves, so an upper-right placement is not a fixed condition. Final framing and relief appearance require visual approval.

## Verification and limitations

- Final production build and exact Arabic source-span verification passed (existing bundle-size warning).
- Scope checks confirm App differs only by the authorized desktop close destination and comment, with exact content and geometry unchanged.
- All 24 native glyph-mask comparisons passed: eight excerpts at 55, 100 and 190px retain byte-identical alpha coverage.
- A Canvas2D atlas check exercises the actual baker and checks relief/roughness ranges, complete inscription bounds, inter-course separation and gutters. It timed out during browser startup at its 40-second deadline; these atlas assertions are not claimed as passed.
- One 90-second desktop regression/capture attempt timed out before startup completed (exit 137 after TERM/KILL deadline). No fresh reliable far/close images or completed desktop interaction results are available. No repeated screenshot attempts were made. Existing screenshots in ../refinement are historical and must not be presented as this source's appearance.

Deterministic captures pause motion, clear selection through existing controls, advance existing frame subscribers at fixed 50ms intervals while suppressing intermediate GPU draws, then render normally. This cannot validate real-time animation smoothness, hardware performance, binocular legibility or Quest hand interactions. The desktop regression expects the newly authorized close endpoint; a comparison with the previous revision necessarily has a different close camera, so it is not a perfectly matched framing comparison. Far framing is unchanged.

The budget stays at two RGBA 4096x1024 mipmapped atlases (~42.67 MiB), one existing 4 KiB glow texture, five artwork draws and 10,800 artwork triangles. Caps, reduced XR points and disposal remain intact. Canvas filtering and packed-channel generation happen only during baking. New GPU timing is unmeasured. Strongly sculpted visual acceptance, full desktop interaction regression, expert Arabic review and Quest hardware validation remain pending. No merge or production deployment is performed.
