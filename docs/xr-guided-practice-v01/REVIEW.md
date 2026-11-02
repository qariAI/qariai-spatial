# Immersive source-backed practice

Base: merged demo commit `a44879aea9e37fdad32c2f470bd25f7fe6280472`.
Branch: `feat/xr-guided-practice-v0.1`. No merge to PR35, main, or production.

## Behavior

The Orbit XR menu opens the selected source-backed letter (Kāf by default). The XR board offers all four guides, Undo/Redo, retry, next guide, and Return to Orbit. Completion uses the existing reviewed guide engine, source identities and thresholds. Missing dots, detached components, canceled ink, extra ink and protected gaps keep the same meaning as desktop. It checks shape following, not stroke order, pressure or mastery.

After a guide completes, Inspect in 3D displays the original letter sculpture within the same XR session. World-space buttons rotate it, reset the view, and return to the guide. The original Amiri face must load before construction; a font failure leaves the guide available and reports the failure. Selection changes, disposal, and retry invalidate pending inspection.

Orbit XR framing is larger, closer and tilted toward the viewer. The desktop world transform is retained. Tracked joints and bones render locally using WebXR poses, without downloading a hand model. No synthetic hands are shipped: the IWER runtime is installed only by test/recording tooling.

## Validation and limits

TypeScript and the production build pass, along with 83 existing guide-engine cases, navigation integration and all four adapter tests. The production bundle smoke check passes immersive entry, desktop-control restoration on exit, and the source-backed Yāʾ board with blank ink rejected. Browser checks drive the actual renderer with IWER hand joints; they do not set guide completion flags or invoke drawing methods to bypass input.

The source contours, sculpture builder, fonts, guide rules and desktop practice are unchanged. Automated input is geometric emulator evidence, not human handwriting or physical Quest comfort/performance certification. Session entry across separate pages still uses the browser's user-activation button; in-headset browser activation must be validated separately. Production contains no emulator dependency.

The approved desktop recording and first XR rehearsal remain untouched. New Windows evidence must identify the new feature commit, not the previous merged demo commit. This change is for review before integration into the demo branch.

## Recording

`scripts/run-xr-guided-video.ps1` runs from an isolated source archive. It reuses the owner's saved Playwright/Chrome paths, installs the test-only IWER 2.1.0 dependency in a fresh Documents folder, and starts `scripts/check-xr-guides.cjs` in video mode. The test driver holds at READY and at the end; OBS remains owned by the user. Keep the browser open until OBS is stopped.

Video mode draws all four guides through joint poses and opens each sculpture. It shows Undo/Redo on the first guide. Verification mode also exercises invalid taps and tracking loss; those negative checks are omitted from the recording sequence. The driver keeps a single window title across navigations and selects a free localhost port. Neither the browser extension nor a controller is needed in this isolated browser.

The renderer runs from the frozen source archive on localhost; this is not a recording of a new production deployment. Public preview status, Windows execution and video review are tracked separately. PNG screenshots from local checks are retained as workspace artifacts, outside Git.

The full browser verification passed all four guide completions, Undo/Redo invalidation/restoration, same-session inspection and return, tracking-loss cancellation, closed reconnect protection, and return to Orbit retaining Yāʾ selection. No uncaught application errors were reported. A final copy-only follow-up restores the completed-guide footer after inspection and adds a pinch/hold instruction to the board; TypeScript and production build were repeated after that follow-up.
