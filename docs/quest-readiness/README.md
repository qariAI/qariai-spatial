# Windows-first Quest readiness fixes

Base: PR #29, exact `6f4fd70a19ae6914d2035752413467867845de0b`.
Branch: `fix/quest-pinch-recovery-texture-navigation`. This draft targets PR #29's branch; it does not update PR #29.

## Behavior

Living Orbit now maintains an independent recovery gate for each hand. Both gates begin disarmed. Missing index, thumb or wrist poses, a hidden hand, a disconnected/replaced source, interrupted session visibility, session end and session start disarm the relevant gate. Two consecutive valid samples at or above the existing 38 mm release distance confirm an open hand. Closed recovery and a single noisy open sample cannot generate an action. After arming, existing 26 mm pinch / 38 mm release hysteresis and 350 ms per-hand action cooldown remain unchanged. Hover and fingertip markers are cleared during session interruptions. No changes to targeting geometry, selection radius, phases, artwork or camera behavior.

An explicit, single `calligraphyRelief=texture` selection is carried in the URL from Orbit to Harf XR, through desktop SVG practice if used, and back to Orbit. Reloads retain it. Both normal anchors and the spatial Return to Orbit action use the same allowlisted route helper. Absent, invalid or duplicate modes do not opt in. Only `/`, `/harf-studio-xr.html` and `/harf-studio.html` are accepted destinations; unrelated query parameters, external return URLs and the legacy physical experiment are never forwarded. There is no persistent preference that could alter a later default visit.

Existing `endBeforeNavigation` and Harf session ownership are untouched. Navigation still requires both the session end promise and end event, and cancels on failure or timeout.

## Evidence and limitations

- `focused-tests.json`: threshold boundaries, jitter, cooldown, independent gates, both hand/target combinations, closed recovery, route validation, default behavior and session-safe navigation.
- `browser-tests.json`: actual Orbit HandTracking frame callback and Orbit navigation adapter in a minimal R3F browser fixture; left/right slots, letter and phase targets, missing joints, session restart, visibility and disconnect. Actual Harf page links, reload and SVG detour tested. The final Orbit URL is intercepted by a destination probe to avoid another atlas bake; actual Orbit rendering is tested separately.
- `emulation-tests.json`: test-only IWER 2.1.0 runtime supplies actual emulated XRFrame joint poses through immersive session APIs. Both hands reject closed reconnection, recover after opening, and remain disarmed on closed session re-entry. This checks the shared recovery gate, not an end-to-end rendered Quest session. IWER is not a production dependency and no emulator code ships with the app.
- `texture-integrity.json`: exact original face/native mask/packed coverage and supporting-band equality; faint pixels, tiny components, counters and openings retained; texture mode allocates no physical lettering geometry.
- `glyph-masks.json`: all eight excerpts at 55/100/190 px retain native alpha coverage.
- `scope.json`: all other source/assets/configuration byte-identical to the base; Orbit outside its HandTracking function and one import byte-identical.
- `harf/desktop-checks.json` and genuine desktop PNGs: real SVG/spatial pointer body → separate dot → completion, reset, guide, denied-session fallback, narrow layout and cleanup.
- `orbit-tests.json`: actual texture-only Orbit WebGL, Pause, exact Explore/Return endpoints, mirrored scales and two-phase controls. The bounded harness waits for artwork and separate R3F commits before assertions.
- `built-routes.json`: all three production entry pages and the bundled Amiri font return HTTP 200.

All browser results here are Linux Chromium/SwiftShader, not Windows execution or physical Quest evidence. An initial sandbox launch failed before tests ran; browser tests were then run with the necessary process permissions. The first minimal test fixture was corrected for Vite's ReactDOM CommonJS import and external-asset load waiting. `orbit-interrupted-diagnostic.json` preserves an unsuccessful Orbit run overlapping source edits/hot reload; it is not presented as a passing run. `orbit-pause-readiness-diagnostic.json` records the legacy 20-second Pause wait timing out without application errors. `orbit-camera-commit-diagnostic.json` records the first separated-readiness harness asserting a camera endpoint before the R3F update committed. The final test polls the same exact endpoint tolerances while advancing frames; no application validator or endpoint tolerance was weakened.

Software rendering and deterministic stepping do not establish sustained FPS, stereo quality, headset startup time, memory/thermal behavior, or tracking quality. Source/mask equality is not a substitute for qualified review of rendered Qur'anic marks.

## Reproduction

With the existing development dependencies, plus Playwright available for browser scripts:

```sh
npm run build
node scripts/check-calligraphy-content.mjs
node scripts/check-quest-readiness.cjs
node scripts/check-quest-scope.cjs
node scripts/check-quest-browser.cjs
node scripts/check-quest-orbit.cjs
node scripts/check-hero-masks.cjs
node scripts/check-texture-relief.cjs
node scripts/check-harf-xr.cjs
node scripts/check-harf-ink.cjs
node scripts/check-integration.cjs
HARF_ARTIFACTS=docs/quest-readiness/harf node scripts/check-harf-desktop.cjs
HTTP_ONLY=1 node scripts/check-entry-pages.cjs
```

The existing and focused browser scripts use `/usr/bin/chromium`. These are the cloud reproduction commands, not a claim that they run unmodified on Windows. The optional emulation script accepts `CHROMIUM_PATH` and `IWER_MODULE` pointing to a separately installed IWER 2.1.0 entry; it reports unsupported when no SDK is supplied. Existing test scripts write their historical report locations; copy fresh results into this directory and restore historical artifacts before committing.

## Windows / Quest owner acceptance

1. In Windows Chrome, open the branch preview with `?calligraphyRelief=texture`. Open Harf, reload, open desktop SVG practice, then Return to Living Orbit. Check the texture query remains at every step. Repeat from `/` without a query; it must remain the default. No OBS setup changes are required.
2. On the physical Quest, enable hands and open the HTTPS preview. Enter VR with hands already pinched: neither letters nor the phase action should activate. Open each hand fully, then pinch deliberately on each target. Verify mirrored selection and both phase directions.
3. For each hand, hide the index/thumb, move the hand out of view, and recover while pinched over a letter and over the phase action. No action should occur until reopening and deliberately pinching. Repeat around the system menu and session exit/re-entry three times.
4. Confirm Harf still traces the body through its existing validator, requires the separate dot, reaches Letter complete, and resets. Exit to browser controls to navigate from Orbit to Harf; this PR does not add an immersive Orbit menu. Harf's spatial Return action must end XR before navigation and retain the texture query.
5. Run the actual demonstration continuously for three minutes. Record Quest model/browser version, cold-start duration, refresh rate/frame timings, frame drops and stereo readability of fine marks. These remain hardware gates.

## Boundaries

No new artwork, lighting, camera, immersive menu, geometry, texture, tracing-validator or choreography changes. PR #28, PR #29, main, Android, competition footage and production remain untouched. Optional Orbit hand features, DOM-only Orbit navigation/controls, headset performance/readability and an authentic physical Quest demonstration remain outstanding. Stop for review; no merge or production deployment.
