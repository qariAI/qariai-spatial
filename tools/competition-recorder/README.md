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
4. Your current OBS scene needs a **Window Capture** source set to the Chrome window titled **QariAI Spatial — Demo Capture**, Windows Graphics Capture, **client area**, cursor off. The script pauses after opening Chrome so you can select it. Fullscreen that browser with **F11**. Do not capture PowerShell/OBS/director. Confirm that the application and disclosure fill the OBS preview, with no browser chrome or desktop. Enable capture priority that tolerates title changes if your OBS version requires it; every navigated opt-in page restores the same title. No new OBS profile/scene is created or overwritten by the script.

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

- First: press F11 in the opened Chrome window, select/check its OBS Window Capture, then press Enter in PowerShell. The script brings Chrome back to the foreground, checks the exact viewport, and runs a full body/dot/navigation/camera rehearsal before starting OBS. Review the rehearsal screenshot if needed.
- Second: after rehearsal passes, confirm OBS preview and press Enter. The script starts OBS, performs the whole **2:54** sequence, stops OBS, checks original duration/resolution with ffprobe and exports `recordings/<timestamp>/qariai-competition-2m54s.mp4`. Keep Chrome visible and leave mouse/keyboard alone. No gestures, dot placement or navigation need manual execution on a successful run. Watch OBS's rendering/encoding lag during rehearsal; lower other system load rather than claim 30 unique rendered frames on a stalling GPU.

Outputs are local to the recorder folder: MP4, real screenshots, and `report.json` (actual validator success/timing and OBS stats). The original OBS MKV stays in your configured OBS recording directory. `-n` prevents overwriting an MP4. No frames are padded, interpolated or synthesized. The script refuses a recording shorter than 174 seconds or wrong resolution; errors stop the script-owned recording and preserve an incomplete original, with no submission MP4. It will not interrupt another recording already active in OBS.

The exported 30 FPS is an output format; it does not prove the application produced 30 distinct frames each second. Review OBS dropped/render-skipped frame counters (cumulative session stats are written), visual motion, Arabic clarity, body/dot separation, completion and final return before submission. The camera transitions are original application behavior. Navigation remains real page navigation, not hidden behind fabricated footage. Only light opening/closing fades are added; there is no narration or large caption overlay.

### Local app instead of preview

In another PowerShell at the repository root: `npm ci; npm run dev`. Keep that server running. Set `$env:DEMO_URL='http://localhost:5173'` in the recorder terminal, then run the same command. This needs no Vercel deployment. Production domains are rejected by the recorder.

### Failure behavior / remaining manual work

On browser load, viewport, validator, navigation, OBS or timing failures, inspect `report.json`. The script never sets completion directly and never packages a partial take as a success. If the app still cannot render on your Windows GPU, **no usable automation take exists**: OBS manual recording and machine/browser diagnosis remain necessary. No Windows execution or actual Quest tracking has been validated from this cloud environment. Physical Quest footage is a separate optional hardware task, not required or substituted by this desktop submission workflow.

## Repeatability checks

`npm test` validates timing, OBS configuration rejection, coordinate bounds/direction and MP4 export safeguards. At repository root, `node scripts/check-recording-data.cjs` verifies all stored guide points and dot against the unchanged authoritative application definition, and checks the desktop projection camera assumption. The generated `trace-data.json` is a recording input fixture, not a new letter definition; changing app geometry requires regenerating and checking it.
