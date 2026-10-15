# Windows one-command competition recording

**Cloud capture was stopped:** the single real Living Orbit 1920×1080 probe timed out before application readiness. See `docs/competition-recording/orbit-check.json`. No MP4 was produced here. This is the explicitly requested Windows fallback, not a claim of completed footage. Windows GPU/OBS execution still requires rehearsal.

This recorder leaves all application source and artwork untouched. It opens the actual application in headed Chrome, uses original capture cues for mirror selection/two phases/camera, follows real navigation, mouse-traces the authoritative Bāʾ centreline through the original validator, clicks the separate dot, requires `Letter complete ✓`, and returns using the actual link. No tracing state writes, fake gesture success, synthetic imagery or headset claims. Continuous OBS footage is exported with short opening/closing fades and the application's existing smooth camera transition. The persistent disclosure reads **DESKTOP APP · pointer / UI simulation · NOT QUEST**; this Windows fallback deliberately uses the more reliable desktop input, not the incomplete XR-dot workflow from PR #20.

## One-time setup (Windows)

Requirements: Node.js 20+; Chrome installed; OBS Studio 28+ with your existing recording scene; FFmpeg/ffprobe on PATH. For FFmpeg, `winget install --id Gyan.FFmpeg -e` then reopen PowerShell. Verify `ffmpeg -version` and `ffprobe -version`.

1. Check out **`demo/competition-recording-v1`** separately from any active work. From an existing repository:

   ```powershell
   git fetch origin demo/competition-recording-v1
   git worktree add ../qariai-demo-recording origin/demo/competition-recording-v1
   cd ../qariai-demo-recording/tools/competition-recorder
   npm ci
   ```

2. OBS → Tools → WebSocket Server Settings → Enable WebSocket server, port **4455**, authentication enabled. Copy/use its password locally. Do not expose that port to the Internet. Your script never logs the password.
3. OBS → Settings → Video: **Base 1920×1080**, **Output 1920×1080**, **30 FPS**. Use MKV and your existing hardware encoder recording profile. Mute audio (export is intentionally silent). Windows display resolution **1920×1080**, scaling **100%**; Chrome zoom **100%**.
4. Keep your successful **Display Capture** source: **Windows Graphics Capture**, cursor off, selected monitor at **1920×1080**. In the current program scene it must be the only enabled source; disabled old sources may remain. Right-click it → Transform → Fit to screen. Do not add Window Capture. Fullscreen Chrome with **F11** on the captured monitor. Put OBS and PowerShell on a second monitor, or leave them completely behind fullscreen Chrome. Turn on Windows Do not disturb to prevent notification overlays. Confirm the application and disclosure fill OBS preview. No OBS source, profile, scene or monitor setting is changed by the script.

## Run (PowerShell, recorder folder)

The existing PR #20 Ready preview works without a new deployment:

```powershell
$env:DEMO_URL='https://qariai-spatial-git-demo-competition-capture-v1-qariais-projects.vercel.app'
$env:OBS_PASSWORD=[System.Net.NetworkCredential]::new('', (Read-Host 'OBS WebSocket password' -AsSecureString)).Password
npm run record
Remove-Item Env:OBS_PASSWORD
```

If Chrome is unavailable but Edge is installed, set `$env:BROWSER_CHANNEL='msedge'`. Default browser is installed Chrome; no Playwright browser download is needed. OBS must already be open and not recording.

There are **two confirmations**, no manual tracing:

- First: press F11 in the opened Chrome window, check your existing OBS Display Capture, then press Enter in PowerShell. The script brings Chrome back to the foreground, checks the exact viewport, and runs a full body/dot/navigation/camera rehearsal before starting OBS. Diagnostic stills are optional and disabled by default; validator checks still run.
- Second: after rehearsal passes, confirm OBS preview and press Enter. The script brings Chrome to the foreground, starts the Windows fullscreen/focus guard and checks the Display Capture source method/cursor settings. It saves and compares a browser screenshot with the **whole OBS program scene** at 1920×1080; a wrong monitor, obstruction, overlay, crop or scale mismatch stops before recording. Then it starts OBS, performs the whole **2:54** sequence, stops OBS, checks original duration/resolution with ffprobe and exports `recordings/<timestamp>/qariai-competition-2m54s.mp4`. Keep Chrome fullscreen and leave mouse/keyboard alone; do not Alt-Tab or open OBS/PowerShell over the captured monitor. A foreground/fullscreen loss or stale guard stops the take and prevents MP4 export. The guard attempts to restore Chrome focus but does not conceal the failed take. No gestures, dot placement or navigation need manual execution on a successful run. Watch OBS's rendering/encoding lag during rehearsal; lower other system load rather than claim 30 unique rendered frames on a stalling GPU.

Outputs are local to the recorder folder: MP4, mandatory preflight images, optional diagnostic stills if enabled, and `report.json` (actual validator success/timing and OBS stats). The original OBS MKV stays in your configured OBS recording directory. `-n` prevents overwriting an MP4. No frames are padded, interpolated or synthesized. The script refuses a recording shorter than 174 seconds or wrong resolution; errors stop the script-owned recording and preserve an incomplete original, with no submission MP4. It will not interrupt another recording already active in OBS.

The exported 30 FPS is an output format; it does not prove the application produced 30 distinct frames each second. Review OBS dropped/render-skipped frame counters (cumulative session stats are written), visual motion, Arabic clarity, body/dot separation, completion and final return before submission. The camera transitions are original application behavior. Navigation remains real page navigation, not hidden behind fabricated footage. Only light opening/closing fades are added; there is no narration or large caption overlay.

### Local app instead of preview

In another PowerShell at the repository root: `npm ci; npm run dev`. Keep that server running. Set `$env:DEMO_URL='http://localhost:5173'` in the recorder terminal, then run the same command. This needs no Vercel deployment. Production domains are rejected by the recorder.

### Failure behavior / remaining manual work

On browser load, viewport, validator, navigation, OBS or timing failures, inspect `report.json`. The script never sets completion directly and never packages a partial take as a success. If the app still cannot render on your Windows GPU, **no usable automation take exists**: OBS manual recording and machine/browser diagnosis remain necessary. The native Windows guard and actual OBS setup have not been executed in this Linux cloud environment. Its checks are sampled every 250 ms, not an absolute guarantee against transient toast overlays or OS screens; preflight image checks and final footage review remain required. The guard uses RemoteSigned policy only for its child PowerShell process; it does not change system execution policy. Organizational policy can still block it, in which case recording will not start. No actual Quest tracking has been validated here. Physical Quest footage is a separate optional hardware task, not required or substituted by this desktop submission workflow.

## Repeatability checks

`npm test` validates timing, OBS/Display source rejection, full program-image comparisons (including wrong/blank display and wrong dimensions), coordinate bounds/direction and MP4 export safeguards. At repository root, `node scripts/check-recording-data.cjs` verifies all stored guide points and dot against the unchanged authoritative application definition, and checks the desktop projection camera assumption. The generated `trace-data.json` is a recording input fixture, not a new letter definition; changing app geometry requires regenerating and checking it.

### Rehearsal keyboard fix

The recorder uses Playwright's real keyboard input for ArrowLeft and mirror keys 1–7. It does not send those cues through the older demo client's Window-dispatched synthetic events, whose Window target caused `.closest is not a function` errors in the editable-field checks. Application handlers and fatal browser-error checks are unchanged. `node check-keyboard.mjs` reproduces the old failure and verifies the new element-targeted input in actual Chromium without running the GPU scene.

### Named readiness diagnostics

`report.json` now records recorder version, current stage, individual check names, timeout budgets, elapsed times, original stacks, and observed URL/document/font/status/canvas/visibility on failure. Closed/crashed browser events are recorded too. Console names each check. A reported four-second `waitForFunction` in the previous code can only refer to Harf body-complete or letter-complete waits, both **after** the first fullscreen confirmation; `shots: []` also applies throughout rehearsal. The old generic report cannot identify which one or establish whether graphics delay, input validation or another failure caused it. There is no evidence that this exact timeout was an initial Orbit readiness wait. The new report removes that ambiguity instead of asserting an unsupported cause.

Pre-recording Orbit navigation/readiness gets up to 60 seconds for capture UI, fonts and positive canvas dimensions, followed by the existing five-second settle. These are UI/rendering prerequisites, not proof of a fully rendered artwork or 30 FPS; original OBS image comparison and final visual review remain required. Rehearsal body/dot waits allow 15 seconds for the actual validator's existing completion presentation to settle. No gesture is retried or completion injected. Recorded validator/Orbit waits remain four seconds and the original shot budgets remain enforced. Browser errors still fail startup/rehearsal; stalled, absent or unvalidated states still fail with diagnostics.

`node check-readiness.mjs` tests an actual Chromium DOM that becomes ready after 4.5 seconds, plus a body that never completes: delayed warmup passes, genuine missing completion fails and reports its exact observed status. This lightweight fixture is not application footage. Native Windows GPU/OBS execution still requires Windows testing.

### Optional rehearsal screenshots

Diagnostic/rehearsal stills are now disabled by default so they cannot stop the return rehearsal. To request best-effort rehearsal stills, set `$env:RECORDER_SCREENSHOTS='1'` before running. These have a one-second timeout: a Playwright screenshot timeout is logged as a warning in `report.screenshots` and the recorder continues without changing any validation result. Other failures (including a closed browser) still stop the run. Optional stills are always skipped during recording so they cannot consume shot time. OBS program-image comparison and its required screenshot remain mandatory, as do all navigation, body/dot completion, browser error, fullscreen, foreground, rendering/capture, timing and recording safeguards. Windows end-to-end testing remains required.
