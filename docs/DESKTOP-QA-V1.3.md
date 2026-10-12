# QariAI Spatial v1.3 — Desktop QA

## Manual browser smoke test (Chrome/Edge)

1. Load the page over HTTPS; verify the Amiri Arabic font and gold glyphs appear and no blank canvas/error is shown.
2. Check visible order: ك ل ف ي ف ل ك. Verify ك / ل / ف / ي glyph shapes and the dots on ف and ي. Note: letters are individually isolated in the scene; the unvocalized phrase كل في فلك is symmetrical, not the full verse.
3. Click each of seven letters, including center ي. Verify the selected letter and its mirror illuminate, with center letter selecting itself.
4. Use number keys 1–7 to select the corresponding letters; Left Arrow returns to mirrored scene and Right Arrow starts orbit.
5. In mirrored phase select a letter, open Trace; draw a line using pointer; Try again clears; Esc closes; check disclaimer says illustrative, not stroke-order graded.
6. Space pauses and resumes planet movement. Speed button cycles 1× → 2× → 0.5× → 1×.
7. Hand Mode enables a simulated desktop cursor. Confirm ordinary mouse selection works; turn Hand Mode off and ensure the cursor indicator disappears.
8. Reset view and confirm the scene remains interactive. Check wide desktop and 980px breakpoint and narrow mobile viewport.
9. Enter VR button should appear only when immersive-vr support is advertised; desktop browsers should not misleadingly claim actual hand tracking.
10. Inspect developer console for font loading errors, WebGL warnings, event exceptions and asset failures.

## Automated gate

Vercel Preview build must pass the project's npm run build script (TypeScript no-emit + Vite production bundle). This document is a QA plan, NOT a record of executed browser tests.

## Quest-only gate

Real dual-hand XR tracking, direct finger pinch selection, mirrored selection, hands-only spatial action and comfortable immersive FPS must still be verified on headset. Do not merge v1.3 or claim headset certification based only on PC tests.
