# Wait for the requested sculpture before entering inspection

Base: `1ba68c0b91357fea09f652ace96714c87b35386f`. Fixes the owner's cold completion-to-inspection screenshot: the inspection overlay was open for fāʾ, but the camera stayed wide with a permanent “still loading” error.

## Cause and fix

`KafAssets` builds the native sculpture collection in a provider effect and installs it through a later React state commit. The original `LetterInspection` effect attempted to construct its view once, before that sculptural child existed. Catching the missing-asset error did not schedule another attempt. Font readiness alone does not establish sculpture readiness.

The production inspector now stays pending until the **requested named letter** has its sculptural child. Its existing frame callback checks readiness and attaches the same view after normal scene-transform updates. It clears the loading status, fits the unchanged camera and enables Reset automatically. No Return/reopen action is required.

Loading is shown as a waiting state, with Reset disabled and Return available. After 30 seconds a one-time informational message explains that the letter is taking longer; it does not abandon attachment. An asset that arrives after that notice still opens automatically. Closing, changing the effect dependencies or starting XR cleans up the pending attachment and existing view. No background timer, duplicate asset bake, second scene or renderer is added.

The view's camera-fit formula, orientation, zoom limits, damping, reset and original-camera/control restoration code are byte-identical. Artwork, materials, geometry, glyph shapes, frame layout, Harf acceptance rules/feedback, routing, original ink and Bāʾ remain unchanged.

## Verification

[Actual production-component checks](browser.json) · [Native fāʾ capture in the small R3F fixture](fa-delayed-inspection.png) · [Source audit](source-audit.json).

The regression mounts the real `LetterInspection` React component and overlay in an actual React Three Fiber canvas, before the native fāʾ object is installed. It verifies:

- Initial pending state, normal camera, disabled Reset and explanatory loading text.
- Closing while pending prevents a later asset arrival from taking over the camera.
- Later React installation of the real native fāʾ automatically enters close-up inspection without reopening.
- The slow-loading notice remains informational; a controlled clock offset exercises this branch without waiting 30 seconds.
- Drag and Reset after attachment, unchanged geometry/material identities and stable GPU resource counts.
- Exact original camera/quaternion/control-target restoration after Escape, and normal manual-trigger focus restoration.
- Existing XR-start event closes inspection and restores controls (event simulation only).

The original fixture incorrectly expected a focused Inspect trigger after cold entry, where no such trigger had been used. That fixture failure is retained in [initial-fixture-focus.json](initial-fixture-focus.json); the corrected test distinguishes cold-entry focus release from manual-entry trigger restoration. The application overlay/focus code was not changed to obtain the pass.

The earlier inspector harness tested its controller and overlay with already-present assets. This new regression covers the previously missing production-hook/delayed-asset sequence. Its scene and lighting are intentionally small; the capture includes a fixture trigger and is not a full Living Orbit screenshot. No repeated heavy full-scene startup test or physical Quest claim is made. The earlier full-scene automation timeout remains unresolved.

Production build and integration scope checks pass. The Orbit chunk is about 457.43 kB minified / 149.82 kB gzip, previously 456.96 / 149.64. No new artwork or GPU resource allocations; the temporary inspection camera/controls are the existing view. The inherited shared-chunk advisory remains.

Existing isolated draft PR #35. No merge or production deployment.
