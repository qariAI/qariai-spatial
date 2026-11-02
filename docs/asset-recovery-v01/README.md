# Authoritative Amiri and sculpture recovery

Candidate parent: PR #38, `bfcad0fa452f43bef85c7b0be9e76bdc501d6dbc`. This isolated draft targets `fix/reset-view-in-place-v0.1`; it does not change that PR.

The font hook previously used `.catch(done)`, which opened the scene gate after rejection. It now exposes loading/ready/failed states and only opens the scene after a loaded, matching Amiri face. Empty matches and a 30-second deadline also fail closed. Loading and failure messages use accessible status/alert roles. Retry fetches the unchanged `/fonts/Amiri-Bold.ttf` with cache reload and loads a fresh `FontFace`: repeating `.load()` on a rejected face would retain its rejected promise. Pending duplicate clicks are guarded; canceled, timed-out and unmounted attempts cannot install a stale face or update state. No fallback lettering is baked.

The sculpture provider previously logged construction failures without reporting a terminal state. Inspection kept polling forever. The provider now reports loading/ready/failed, schedules cancelable construction, disposes completed partial collections, and publishes only a complete collection. The provider boundary encloses the existing scene and inspector without changing either scene content or resource ownership. Failure retains the original letter artwork. The inspector stops polling on terminal failure, offers Retry and retains Return to Orbit. Retry schedules a new collection attempt without remounting the scene or calligraphy. Closing inspection during a retry does not reopen it when construction finishes. Existing XR session-start close/cleanup remains active, including failure.

## Scope and preservation

Five production files: `src/App.tsx`, `src/desktop/useLoadedArabicFont.ts`, `src/orbit-art/SculptedKaf.tsx`, `src/orbit-art/LetterInspection.tsx`, and an appended notice style in `src/style.css`. The geometry/material builders, Arabic font assets, calligraphy bakers/content/masks, Harf and validators, XR modules, dependencies/configuration and favicon are byte-identical. All 619 non-allowlisted baseline files pass the strict source guard. Original App artwork/texture functions, SceneRig, XR handlers, camera/reset implementation, native inspector camera class and original CSS also pass exact comparisons.

New tooling: three focused CJS regression scripts and one Windows PowerShell wrapper. Existing acceptance scripts and PASS requirements are unchanged. Injected tests retain and explicitly account for their intentional errors; normal production tests require zero console/page errors.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript and Vite production build | PASS | [Regression report](regression.json); inherited large-chunk advisory only |
| Normal full production scene | PASS | [Raw browser report](normal/browser.json), [home](normal/fixed-home.png), [native Kaf inspector](normal/fixed-harf-native-inspection.png) |
| Seven mirrored letters; exactly two phases; inspection/Return; real Harf roundtrip | PASS | Same normal production run, native draws and real destination navigation |
| Nine Reset View operations | PASS | Scene, atlas, geometry/material/texture/control identities, memory counters, listeners and frame subscribers stable; camera framing/state restored |
| Actual font network rejection, repeated new requests and recovery | PASS | [Injected report](injected/recovery.json): zero art/atlas/sculpture before readiness; four sculptures once after recovery |
| Sculpture terminal failure, repeated Retry, Return during failure/pending retry, correct native Fa recovery | PASS | Same injected report; original artwork and atlas identities preserved |
| All four registered Harf guides and Undo/Redo eligibility | PASS | `guides` in same report; real production pages and registry, no substituted validators; Ya completion follows real inspector/Return |
| Async cancellation/unmount, timeout, empty font match, partial collection disposal | PASS | [Deterministic lifecycle tests](lifecycle.json); production code with fake scheduling/dependencies, **not browser/visual evidence** |
| Qur'anic source and native alpha | PASS | Eight exact source spans; [24 native alpha comparisons](native-alpha.json) at 55/100/190px, zero alpha differences |
| Guide engine, ink, session/pinch and navigation cleanup | PASS | 83 guide cases and existing unit checks; [regression report](regression.json) |
| Windows Chrome and physical Quest | PENDING | Owner execution / physical hardware required; no emulator footage claim |

Linux production Chromium/SwiftShader with CPU Canvas was used here. Native rendering/draws, artwork, source resolutions and shaders were retained. Browser timings include software rendering and scheduling; concurrent bounded browser checks introduce contention, so these are reliability observations, not performance benchmark claims. The final normal run recorded startup 17,035 ms and nine resets 803–2,351 ms. The first earlier normal run recorded startup 14,281 ms and reset-from-explore 592 ms; no application regression was observed. No Windows speedup is asserted.

The normal home PNG and the font-recovered PNG are byte-identical to PR #38's recorded home capture: SHA-256 `fb46a319211e1e94dce5511de05b07ff799c09501af80d1682e4202f03f82894`. This is a measured comparison for those stationary screenshots, not a claim of general frame determinism. Calligraphy bakers, resolution and original font asset remain unchanged.

### Genuine injected-error screenshots

These are untouched browser captures of the full application. A test-only build adds a construction fault/count and a 1.5-second construction scheduling delay; font errors come from real aborted font requests. No production flag, fault API, source edit, fabricated geometry, render suppression or synthetic screenshot is shipped. The injected build is separate from `dist/` and never deployed.

- Amiri: [failed](injected/injected-font-failed.png), [Retry/loading](injected/injected-font-retrying.png), [recovered](injected/injected-font-recovered.png).
- Sculptures: [terminal failure with original artwork](injected/injected-sculpture-failed.png), [Retry/loading](injected/injected-sculpture-retrying.png), [recovered native Fa inspector](injected/injected-sculpture-recovered-inspector.png).
- Separate normal production [Ya guide-completion inspector](injected/normal-ya-inspector.png).

The injected report records exactly two expected font network console failures and two expected sculpture construction console failures, with no uncaught page errors. Normal scene and normal guide/inspection paths report zero console/page errors. These intentional failures must not be treated as a normal-path acceptance pass.

`SHA256SUMS` records the published evidence bytes. Earlier local attempts that could not launch Chromium under the shell sandbox stopped before application execution. The existing historical practice-history script requires an unavailable historical Git object, and IWER was not configured; neither is claimed as passing here. Equivalent scoped preservation is covered by exact hashes, real registered-guide Undo/Redo, native navigation and the unchanged XR code plus existing session/pinch unit checks. Historical evidence files were restored exactly after legacy scripts attempted to write them; the final strict source guard passes.

## Focused Windows recheck

Use Windows 10, existing Google Chrome/Node/Git and the dependencies from the successful PR #36 test. No install or system-policy change is performed. The wrapper reads the old `report.json` and optional `run-options.json` to find existing dependencies, Playwright and Chrome. If those saved paths no longer exist, it reports BLOCKED with instructions; restore the existing paths before continuing.

Download `scripts/Verify-AssetRecovery.ps1` from the **exact new draft commit** supplied in the PR/owner handoff, then run:

```powershell
& 'C:\path\Verify-AssetRecovery.ps1' -CandidateCommit '<exact-new-draft-commit>' -PreviousReport 'C:\path\original-PR36-report-folder'
```

The runner creates a fresh detached checkout beneath `%TEMP%`, checks both the exact candidate and PR #38 parent, copies existing dependencies, builds production, runs lifecycle/source guards, then reuses the existing focused Reset View browser test and the new recovery test. It uses local Windows Chrome with normal production rendering. Each browser run is bounded (normal 10 minutes; recovery 6 minutes, with per-stage limits), and the recovery test reuses one browser process. It does **not** rerun the full 32-step acceptance suite. Existing checkouts, dependencies and reports are read only. No branches/PRs, production sites, Android or footage are changed.

New results go to `Documents\QariAI-Recovery-<id>`: `SUMMARY.txt`, `normal/browser.json`, `recovery/recovery.json`, screenshots and lifecycle/scope reports. Failed browser stages preserve diagnostic JSON and available captures. The temporary checkout is retained for inspection. The PowerShell wrapper has been reviewed statically here; it has not been executed on Windows.

Owner visual checks, separate from automated actions:

1. Review the normal home and native inspectors: approved Arabic/artwork and camera framing must match; drag, Reset and Return must feel usable.
2. Review the separately labelled injected font and sculpture loading/error/recovery captures. Confirm messages and Retry/Return are readable and usable. No sacred calligraphy may appear while Amiri has failed.
3. Return the new report folder and owner visual PASS/FAIL. Do not label the run Windows acceptance until its genuine results are available.

For a quick manual normal-path review, use the PR's Vercel preview with `?calligraphyRelief=texture&orbitArt=study`. The injected sculpture check requires the isolated tooling build; it cannot be toggled in the production preview.
