# Hands-first immersive menu v0.1

Base: PR #30 at `87a8a840e0044d5ed8b1f151b2d6558ac9e061d2`. New branch `prototype/hands-first-immersive-menu-v0.1`, targeting PR #30's branch. No change to the existing PR.

## Using the menu

Enter Quest VR through the existing browser entry. Open your hand, aim at **PINCH · MENU**, then pinch. The dark/gold/emerald panel is world-locked from the entry viewer pose, rather than attached to the moving headset. Its 9 cm-high targets support both near-fingertip and the existing hand-direction ray selection.

- **Pause / Resume orbit** shares the existing paused state.
- **Inspect calligraphy** temporarily pauses the existing installation. **Nearer / Farther** let the user move the entire XR installation in 15 cm increments, up to 60 cm, with a conservative initial distance limit and eased settling. No headset-camera transform is written. Geometry, local ring/planet/letter transforms, materials, text and choreography remain unchanged. Return restores the original XR placement and the pause state from before inspection. Close also leaves inspection safely.
- **Open Harf Studio** waits for the existing XR session's end promise and explicit end event, then navigates through the existing allowlisted route helper. An explicit single `calligraphyRelief=texture` survives; default remains default. As before, cross-page navigation ends immersive mode. The user must activate the new page's VR entry in the Quest browser; this is not a seamless shared XR session. Harf's existing spatial Return action brings the user back to Orbit's browser page with the same texture query.
- **Close menu** releases modal focus and requires fresh open-hand confirmation before a subsequent gesture.

Menu opening, actions, closing and interruptions reset the existing independent PR #30 pinch gates. Original 26/38 mm hysteresis and per-hand 350 ms cooldown are retained; a shared 350 ms menu barrier rejects same-frame/two-hand duplicate actions. While open/busy, the menu owns input, even when aiming outside its panel, so letters and the phase button behind it cannot activate. Missing joints rearm only after reopening. Session visibility interruptions/end/re-entry close focus and restore inspection state. Invisible menu ancestors cannot receive hits. Navigation failure keeps a recoverable message and retry state rather than navigating early.

No desktop control was added or changed. This is a menu/inspection adapter, not a third experience phase. No new sacred lettering or celestial object.

## Genuine visual evidence — read the labels

These are **actual WebGL captures of the production menu, HandTracking, letter and phase components driven by IWER joints in a lightweight component fixture**. They are not the full celestial scene, physical Quest captures, generated concepts, or composites. Images are native canvas readbacks; no editing was applied.

| State | Capture |
| --- | --- |
| Closed launcher | [IWER component fixture](01-launcher.png) |
| Open menu | [IWER component fixture](02-menu.png) |
| Inspection controls | [IWER component fixture](03-inspect.png) |
| User-requested nearer step | [IWER component fixture](04-nearer.png) |
| Left-hand reopening | [IWER component fixture](05-menu-left.png) |

**Full-scene XR emulation remains blocked.** A separate actual Living Orbit + IWER run produced [severe visual artifacts](full-scene-iwer-artifact.png), then exceeded a 12-second XR-frame wait. [Diagnostic](full-scene-emulation-diagnostic.json). Its cause is not established here; neither Quest compatibility nor an emulator-only cause is inferred. The artwork was not changed to make this test pass. The component fixture omits the costly celestial artwork explicitly; it validates interaction, not full-scene stereo rendering, performance or artistic fidelity. These screenshots support menu review only. The failed full-scene image is not an approved visual reference.

The initial harness also hit a page-screenshot timeout and an SDK-global exposure error; those are retained in `initial-harness-diagnostic.json`. The fixture's earlier navigation diagnostic requested an XR frame after the session correctly ended. The final test waits for the actual destination URL for that step, retaining all navigation/interaction assertions. `navigation-harness-diagnostic.json` preserves the earlier result. Harf desktop's first concurrent run exceeded its 15-second navigation limit; a standalone rerun passed without changing its checks.

## Validation

- `emulation-tests.json`: **passed on Linux Chromium/SwiftShader with IWER 2.1.0**, NOT on Windows or physical Quest. Production menu/gesture components receive actual emulated XRFrame joints, not synthetic select callbacks. Tests observe both-hand operation, Pause/Resume, modal letter blocking, inspection and unchanged headset matrix, Return restore, closed reconnection, close/reset, actual phase button 01→02→01, session exit/re-entry, real menu → Harf teardown/navigation and Harf's existing spatial pinch/hold Return. Both URLs preserve texture mode. Return is intercepted by the same labelled fixture; it is not a full celestial rerender claim.
- `logic-tests.json`: state transitions, limits, pause restoration, shared duplicate barrier, independent recovery gates, safe single navigation, default/texture selection and cancelled timeout.
- `target-tests.json`: real ray/near geometry, row bounds/gaps, invisible ancestors, busy rejection. Two plane geometries total **280 bytes of typed-array geometry and four triangles**; exactly one is visible at a time (two triangles / one UI draw). Two RGBA8 canvas textures estimate **4.33 MiB with mipmaps**, excluding driver overhead. No added lighting, shadows or bloom. This is a cost estimate, not Quest profiling.
- `desktop-orbit-tests.json`: actual texture-only Orbit desktop WebGL; Pause, exact Explore/Return endpoints, mirrored scales and exactly two phases passed. Wide render remains **57 draws / 23,698 triangles / 40 uploaded geometries / 13 textures**; menu meshes are hidden and their maps are not uploaded in desktop mode.
- `recovery-navigation-browser-tests.json`: existing actual HandTracking callback and link-adapter tests passed.
- `glyph-masks.json`: all eight excerpts at 55/100/190 px retain exact native alpha. Eight recorded Quran.com content spans pass separately. `scope.json` hashes prove all artwork, rings, mask/shader/texture bakers, font, Harf geometry/validators, original camera controls and desktop UI remain unchanged. Full atlas equality from the base is not represented as a new bake measurement.
- `harf/desktop-checks.json`: real pointer SVG/spatial body, separate dot, completion, reset, guide, denied-session fallback, narrow layout and cleanup passed; genuine desktop PNGs included.
- Production TypeScript/Vite build passed (inherited >500 kB chunk warning). Existing Harf tracing/pinch/session/ink and integration end-event/completion/failure/timeout regressions passed. All three built pages and bundled font return HTTP 200 (`built-routes.json`).

## Windows IWER reproduction

This is the Windows-runnable fixture path; Windows execution has **not** been claimed from the Linux cloud results. From a clone on this branch, install normal project dependencies and optional test tooling in a temporary directory:

```powershell
npm install
$menuTools = Join-Path $env:TEMP 'qariai-menu-test-tools'
npm install --prefix $menuTools --no-save playwright esbuild iwer@2.1.0
$env:NODE_PATH = Join-Path $menuTools 'node_modules'
$env:IWER_MODULE = Join-Path $menuTools 'node_modules\iwer\lib\index.js'
$env:CHROMIUM_PATH = Join-Path ${env:ProgramFiles} 'Google\Chrome\Application\chrome.exe'
$env:MENU_FIXTURE = '1'
$env:HEADED = '1'
node .\scripts\check-immersive-menu.cjs
```

Adjust `CHROMIUM_PATH` if Chrome is installed elsewhere. The fixture is served only through the test's Playwright interception; it is not a shipped route or scene. Reports/screenshots go to `docs/immersive-menu`. Keep them labelled **WEBXR HAND EMULATION — NOT QUEST** if recorded in OBS. Existing Display Capture can record the foreground test browser; use 1920×1080/30 FPS/cursor off if desired, and disclose that it is the component fixture. No OBS/competition-recorder code changes are included. Default test viewport is 1440×900; it is not advertised as submission-ready 1080p footage.

Without `MENU_FIXTURE=1`, the same script attempts the complete actual app. The cloud full-scene attempt is blocked as documented; do not repeatedly run lengthy capture attempts or use fixture success to claim that issue resolved.

## Remaining owner / physical Quest checks

1. In the branch preview, enter native Quest VR without IWER. Confirm launcher placement, target size, readability, both hands, open-before-pinch and no behind-menu actions.
2. Test missing thumb/index/wrist poses, two-hand switching, browser/system menu interruption and three exit/re-entry cycles. A recovered closed hand must do nothing.
3. Inspect the actual rings. Verify the user-controlled placement increments are comfortable, Return restores the entire installation and prior pause state, and the headset moves only with the wearer. Check every fine Qur'anic mark in stereo; source equality is not a substitute for visual review.
4. Open Harf with the menu, enter its VR session with a fresh browser user activation, trace its body and separate dot, use its existing spatial Return, re-enter Orbit and check texture mode.
5. Measure cold startup, real frame time, memory and thermal behavior. Resolve/triage the separate full-scene XR artifacts before claiming competition-ready headset rendering.

Stop for visual review. No merge, production deployment, other-PR changes, Android or competition-footage changes.
