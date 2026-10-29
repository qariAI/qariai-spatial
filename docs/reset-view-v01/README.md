# Reset View without scene reconstruction

Baseline: draft PR #37, exact `454c2f0e552583458ca02f23915a74987537a915`.

The old Reset View button clears the two exploration states and increments the React `key` on `SceneRig`. React then destroys/recreates the child resource owners: calligraphy atlas, native letter assets/material clones, controls and their handlers. The owner reports approximately **14.8 s initial readiness / 12.8 s reset readiness on Windows**, with changed atlas and sculpture identities. Those Windows measurements are owner-supplied; no new Windows result is claimed here.

The corrected button passes a reset revision into the **existing** camera rig. Its desktop-only effect cancels the Explore tween and calls a small in-place reset helper. Existing controls `reset()` drains pending damping with damping temporarily disabled, then restores the original position `(0,98,169)`, target `(0,0,0)`, Y-up orientation and zoom `1`. Damping and the controls' enabled/disabled ownership are retained. There is no new render loop, listener, scene, renderer, resource cache or GPU asset allocation.

The existing Explore/Return camera interpolation and its separate authored targets are unchanged. Reset View still clears Explore Calligraphy and planet exploration, while retaining selected letter, phase, pause and speed. The live orbital animation is not rewound by reconstructing its components. The XR-presenting guard performs no camera/target write, and a reset requested during XR is not deferred into exit. Letter-inspector ownership/Return logic, Harf routing, all artwork and normal unmount cleanup remain unchanged.

## Scope and evidence

- Production change: reset propagation/effect in `src/App.tsx`, plus `src/desktop/resetView.ts`.
- [Logic](logic.json): real Three OrbitControls with pending damping, 25 stable repeated resets, 20 production-hook resets, disabled-control ownership, cleanup and XR guard simulation. This is not physical XR evidence.
- [Scope](scope.json): all **604 other baseline files** byte-identical; the App is exactly equal after removing the narrowly enumerated reset delta. This covers native Arabic masks/bakers, calligraphic rings, letters, planets/lighting, textures/material definitions, Harf/validators/routes, XR code, CSS/config/dependencies and the favicon.
- [Native masks](glyph-masks.json): all eight Qur'anic excerpts retain exact alpha at 55/100/190 px. Existing source-text, Harf ink/tracing/session and integration checks pass. Production TypeScript/Vite build passes with the inherited shared-chunk advisory.
- [Timing comparison and provenance](timings.json), [baseline production observations](baseline-browser.json), and [corrected production observations](browser.json) contain genuine local measurements and resource identities. Timings include Playwright dispatch, native software-rendered frames and polling; screenshots are timed separately.

| Linux production Reset View observation | Baseline | Corrected |
| --- | ---: | ---: |
| Paired trial 1, same browser process | 11,771 ms | 497 ms |
| Paired trial 2, same browser process | 13,028 ms | 766 ms |
| Final candidate-only full regression | — | 472 ms |

The paired reset checks passed before later harness synchronization assertions failed; those diagnostics are retained below. The final candidate run passes all checks, including nine resets ranging from 204–1,702 ms under software-renderer scheduling, with no application-code change between trials. Final home position, quaternion, target, up and zoom exactly match the recorded baseline. Cold startup remains about 14 seconds locally; startup optimization is outside this change.

## Genuine screenshots

All captures are untouched browser screenshots of the real production pages, full artwork and original native font. Linux Chromium / SwiftShader uses CPU Canvas preparation, viewport 1100×800, DPR 1. The native UI Pause action is clicked at first DOM commit for stationary captures. No deterministic stepping, GPU draw suppression, source/shader substitution or intercepted navigation is used. These are not Windows/Quest screenshots or generated art.

| Capture | Baseline | Corrected |
| --- | --- | --- |
| Initial home | [Original](baseline-home.png) | [Retained scene](fixed-home.png) |
| Home after Explore → Reset | [Rebuilt](baseline-after-reset.png) | [In-place](fixed-after-reset.png) |
| Real Harf completion → native inspector | — | [Full-scene inspector](fixed-harf-native-inspection.png) |

The original camera framing is numerically checked. Screenshots can differ in normal LOD settling or live-animation pose and are not advertised as pixel-identical. Approved geometry, maps, masks and shader source remain exact. Stable Three resource identities and renderer memory counters establish reuse; they are not driver VRAM or Windows frame-rate measurements.

Early harness attempts are retained in [diagnostics](harness-diagnostics.json). They sampled a DOM phase change before the R3F phase-button texture commit, DOM inspector removal before native control cleanup, and cold close-up GPU counts before the first restored wide frames. The test now waits for those existing native commits/renders. No application change or relaxed identity assertion was used to obtain passing observations.

## Focused Windows comparison

Use **new** baseline and corrected checkouts, leaving the owner's checkout and existing reports untouched. Windows Git, Node and locally installed Chrome/Playwright must already be available. Nothing is installed automatically. Clone with `-c core.autocrlf=false` in these new repositories so the byte-integrity guard measures the original Git bytes; this does not change global Git settings.

```powershell
$base = Join-Path $env:TEMP ('qariai-reset-base-' + [guid]::NewGuid().ToString('N'))
$fixed = Join-Path $env:TEMP ('qariai-reset-fixed-' + [guid]::NewGuid().ToString('N'))
git clone -c core.autocrlf=false --no-checkout https://github.com/qariAI/qariai-spatial.git $base
if ($LASTEXITCODE -ne 0) { throw 'Baseline clone failed' }
git -C $base checkout --detach 454c2f0e552583458ca02f23915a74987537a915
if ($LASTEXITCODE -ne 0) { throw 'Baseline checkout failed' }
git clone -c core.autocrlf=false --single-branch --branch fix/reset-view-in-place-v0.1 https://github.com/qariAI/qariai-spatial.git $fixed
if ($LASTEXITCODE -ne 0) { throw 'Corrected clone failed' }

# Existing Windows acceptance dependencies; copy, never clean/link/modify them.
$deps = 'C:\path\to\acceptance\candidate\node_modules'
Copy-Item -LiteralPath $deps -Destination (Join-Path $base 'node_modules') -Recurse
Copy-Item -LiteralPath $deps -Destination (Join-Path $fixed 'node_modules') -Recurse
Push-Location $base
try { npm run build; if ($LASTEXITCODE -ne 0) { throw 'Baseline build failed' } } finally { Pop-Location }
Set-Location $fixed
git rev-parse HEAD # Record this exact corrected commit in the returned report.
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Corrected build failed' }
node scripts/check-reset-view.cjs
if ($LASTEXITCODE -ne 0) { throw 'Reset logic failed' }
node scripts/check-reset-view-scope.cjs
if ($LASTEXITCODE -ne 0) { throw 'Protected-file scope failed' }
$env:CHROMIUM_PATH = Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'
$env:PLAYWRIGHT_MODULE = 'C:\path\to\tooling\node_modules\playwright-core'
$out = Join-Path $env:USERPROFILE ('Documents\QariAI-Reset-' + [guid]::NewGuid().ToString('N'))
node scripts/check-reset-view-browser.cjs $base $out
```

The focused script launches one local Chrome process and actual production previews. It compares the baseline once and exercises the corrected branch with repeated drag/wheel resets, seven selections, both phases, paused/moving 2× state, native inspection/Return and one real registered Kāf guide/completion roundtrip. All scene/atlas/geometry/material/texture/control identities, memory counters, DOM/control/XR listener counts and frame-subscriber counts must remain stable across corrected resets. It does not create an immersive session or bypass guide validation.

Default bounds are 120 seconds per readiness wait, 30 seconds per navigation, 20 seconds per screenshot and 10 minutes total. `RESET_STAGE_MS` may be set up to `300000` for slower hardware. Any error/timeout is retained; there is no fixture or emulator fallback. If only a corrected recheck is needed, pass `-` instead of `$base`; the report then explicitly omits a new baseline run.

Return the new `browser.json` and PNGs, record Windows/Chrome/GPU versions from the environment report, and visually compare final framing, Arabic detail, both phases, selection/pause/speed, inspection/Return and Harf. Keep the previous acceptance report unchanged. PR #36's runner pins the older candidate and explicitly waits for remounting, so it cannot measure this new in-place contract without a separately reviewed tooling change; it is not modified by this PR.

No Windows performance improvement or physical Quest readiness is claimed until the owner supplies genuine results. No merge, production deployment, existing-PR update, Android or competition-footage change. Stop for review.
