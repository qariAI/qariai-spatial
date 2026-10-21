# Desktop letter inspection inside Living Orbit

Base: `1cb99cb0ef6093523a832212b8423d3b63492fc5`. Opt-in `orbitArt=study`, existing draft PR #35. No new section or experience phase.

## Review

Select a letter (or press 1–7), then choose **Inspect letter**. Drag to orbit, scroll to zoom and use **Reset inspection** for the initial oblique framing. **Return to Orbit** or Escape restores the original view. Inspection is available for an existing selection in either phase; it keeps the selection, mirrored feedback and current phase.

## Implementation and preservation

- Render the **existing scene** through a temporary desktop PerspectiveCamera. No second scene, renderer, WebGL context, mesh, material, light or asset bake is created by the inspector. Exact source meshes, detached components, counters, geometry buffers, textures and reflections are reused by reference.
- While inspection is open, feed the existing scene its established paused flag. Keep the user's independent Pause/Resume state; resume its previous state on return. No choreography callbacks, letter arrangement, source artwork, ring inscriptions, shader, material or light changes.
- Disable the original desktop OrbitControls temporarily. Save and hold the original camera pose and control target, then restore these and the prior enabled flag on cleanup. The new controls operate only on the temporary camera.
- R3F's positive-priority callback replaces its default render while mounted, making one scene render per frame. Normal rendering resumes on unmount. The single existing canvas expands for inspection and returns to its original layout afterward.
- A separate drag surface prevents camera gestures on the overlay's buttons. Focus enters the Return button; Tab/Shift+Tab remain inside; Escape closes; focus returns to the invoking control. Overlay keys do not trigger behind-the-dialog phase/selection shortcuts. Existing scene controls are hidden/inert through visibility during inspection.
- Missing sculpture/bounds show a recoverable Return message; no synthetic fallback or new contour is fabricated.
- This is desktop-only. Active XR refuses inspection; session entry closes it and hands the renderer back. No headset camera is moved or tested.

## Genuine evidence and checks

[Native kāf inspection](kaf-inspection.png) · [Native fāʾ inspection](fa-inspection.png) · [Browser report](browser.json) · [Validation](validation.json).

These are genuine Chromium/SwiftShader captures of the production inspector controller and overlay with approved native assets in a **small isolated test scene**. The two small top-left buttons belong to the test fixture. They are not full Living Orbit captures. The fixture uses fixed lighting for asset visibility; the production inspector adds no lights and renders Living Orbit's existing lighting unchanged.

Actual drag, wheel zoom, reset, Escape, focus/Tab/return-focus, missing-asset recovery and camera/control restoration pass. Geometry, material and scene references stay identical; renderer geometry/texture counts stay unchanged through enter/exit. Kāf retains its detached component, and fāʾ retains its original dot and counter. The first fixture font load failed because its copied CSS font URL conflicted with the inlined local font; that harness failure is retained. Application font loading was not changed.

Source/scope, Arabic-content, Harf tracing/ink/session, navigation, menu and recovery regressions pass. The production build passes with the inherited shared-chunk advisory. Main selection/keyboard/phase callbacks, camera rigs, stars, belt, sculpture assets and Harf sources remain fixed.

## Resource implications and limits

- Extra artwork geometry, textures and draw passes: **zero**. One temporary camera and its event/controller objects exist only during inspection. No glyph copy or texture bake occurs in the application.
- The dedicated OrbitControls implementation adds about 17.5 kB minified / 4.9 kB gzip to the Orbit bundle compared with the prior desktop polish build. No new production dependency was added.
- The wider framebuffer and closer PBR surfaces can increase fragment cost. Scene draw calls may vary naturally with the inspection camera's frustum. No full-scene FPS or hardware cost claim is made from isolated captures.
- The earlier full-scene automation startup timeout remains unresolved. It was not retried in this pass; full-scene inspection requires owner desktop preview review. The owner's prior screenshot demonstrated successful startup on their desktop, not this new interaction.
- Physical Quest validation is deferred at the owner's request. Existing XR code remains unchanged; the inspection's desktop/XR guard is not hardware evidence.

No merge, production deployment, Android or competition-footage changes. Stop for visual review.
