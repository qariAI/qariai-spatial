# Competition demo — 2:54 actual application capture

Branch: `demo/competition-capture-v1`, based exactly on PR #18 `b1521ea1149872debeb840b5a8c8d47c4558ca92`. No artwork, glyph, tracing, camera, choreography or canonical application modules changed. The new bootstrap loads original entry modules. Capture helpers require explicit opt-in on localhost or a `-git-*.vercel.app` branch alias. Production hosts reject the opt-in. A recording tab retains its choice through real navigation; **Exit capture mode** clears it. Closing the tab also ends this session-only choice.

## Windows recording — recommended XR emulation

1. Use current Chrome/Edge with hardware acceleration on. Open the preview's `/competition-demo.html`. Allow its popup, choose **Open XR-emulated app**. This embeds the pinned MIT Meta IWER **2.1.0** runtime; no browser extension is needed. Do not install/run another emulator in the same tab. The mono spectator view is simulated WebXR, **not a Quest recording**.
2. Warm up both experiences once, return to Orbit, and reload the capture window for the opening. In the director, choose **Enter emulated VR**. The capture window must visibly label **XR EMULATION … NOT QUEST**. Press F11 in that window. Keep the director on a second monitor, or use OBS hotkeys without minimizing the app; browser background throttling can invalidate the clock.
3. OBS: create a **Window Capture** source using Windows Graphics Capture and select `QariAI Spatial — Demo Capture`. Capture only that application window, not the director. Disable capture cursor. Canvas/output **1920×1080**, initially **30 fps**. Use 60 only after a smooth test recording on your actual PC; no Quest frame rate is claimed. Use hardware H.264 if available, MKV recording, then File → Remux Recordings → MP4. Mute desktop audio unless intentionally narrating. Keep the simulation badge visible.
4. Start OBS, then **Start 2:54 cue clock**. At **1:42**, the actual Harf link navigates; press **Enter emulated VR** in the director during the ten-second arrival chapter, before **1:52**. The body cue moves SDK hand poses and pinches through the actual app validator; the dot is a separate step. A FAILED state stops remaining cues instead of forcing completion. If frame stalls occur, stop, resolve them, rehearse once and record again; never substitute a completion overlay.
5. At **2:54**, stop OBS. Trim only warmup/slate time to deliver 2:50–2:59. Verify complete body, separate dot, `Letter complete ✓`, and real Return to Orbit on playback. Do not describe scripted hand poses as physical hand tracking.

The Explore Calligraphy chapter deliberately exits emulated XR and uses the existing **desktop** camera transition. The existing camera does not move a headset. Its on-screen label changes to DESKTOP APP. Re-enter emulation on Harf arrival. This mixed sequence must be described as **XR-emulator and desktop application footage**, never continuous Quest footage.

## Windows fallback — actual desktop application

Choose **Open desktop fallback**; use the same OBS settings and timing sheet. Do not enter VR. The real app renders every frame. During the body chapter manually mouse-drag from START on the right, along the guide to FINISH on the left; release, then click the separate diamond dot during its chapter. Body/dot cues only prompt manual action in this mode; they do not inject completion. The return cue clicks the actual navigation link. Keep DESKTOP APP / NOT QUEST visible. No generated images or pre-rendered replacement scene is used.

## Timing and screenshot-ready states

| Time | Shot / cue | Screenshot state |
|---|---|---|
| 0:00–0:12 | Seven letters | Paused, selection cleared, original seven mirrored letters |
| 0:12–0:30 | Mirrors | Existing selection keys 1–7; no extra phase |
| 0:30–0:52 | Living Orbit | Original second phase and planets |
| 0:52–1:28 | Engraved discovery | Exit emulated VR, pause, existing Explore Calligraphy close view |
| 1:28–1:42 | Return view | Existing Return to Orbit |
| 1:42–1:52 | Harf arrival | Enter emulated VR manually now |
| 1:52–2:04 | Guide / hands | Amiri reference, separate dot, open simulated hands |
| 2:04–2:38 | Body | 28-second simulated SDK hand sweep (or manual desktop drag) |
| 2:38–2:46 | Dot | Separate pinch or mouse click; Letter complete ✓ |
| 2:46–2:54 | Return | Spatial simulated pinch on Return button ends XR before real navigation |

Manual shot buttons let you rehearse and hold each state for screenshots. Use OBS screenshot hotkey on the actual rendering; save state-named PNGs with input mode and viewport in their captions. No permanent magnifier, new scene phase or decorative visual is introduced.

## Emulator sources and limitations

Meta's [Immersive Web Emulator](https://github.com/meta-quest/immersive-web-emulator) documents Chromium WebXR hand-input emulation; [IWER](https://github.com/meta-quest/immersive-web-emulation-runtime) supplies SDK hands. Optional extension: [Chrome](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik), [Edge](https://microsoftedge.microsoft.com/addons/detail/immersive-web-emulator/hhlkbhldhffpeibcfggfndbkfohndamj). For extension-only manual tests, open **normal** app URLs without embedded-emulator query, use its developer-tools pose controls, and add a truthful OBS text label. That extension workflow is not the automated cue workflow and is not tested here. Meta's extension does not emulate DOM overlay; the director stays external.

Embedded capture URLs: `/?competitionDemo=1&xrEmulator=1`, `/harf-studio-xr.html?competitionDemo=1&xrEmulator=1`. Desktop fallback: `/?competitionDemo=1`. `/harf-studio.html` remains the SVG fallback (no runtime installed there).

The emulator cannot verify physical tracking, occlusion, real pinch jitter, headset comfort, Quest browser lifecycle or on-device GPU performance. Windows OBS and a full 2:54 take still require operator rehearsal. Real Quest recording remains a separate hardware task. The Amiri silhouette is sourced; manually inferred practice stroke order still awaits qualified calligrapher review.

## Validation in this environment

Production build/typecheck and content/engine checks are recorded separately from rendering checks. Eight Qur'anic excerpts match their source spans exactly; all 24 native glyph-mask comparisons and atlas bounds/course gutters pass. The Amiri outline check passes all 505 centreline samples. Tracing direction/proximity, broad-nib smoothing, session cleanup, completion presentation and bidirectional navigation logic pass. All original three built pages and the font return HTTP 200. Normal SVG and spatial desktop body/dot/reset checks pass; their screenshots are actual application rendering at 1100×900, **pointer input with a deliberately denied mock XR session**, not emulator or Quest footage.

The embedded IWER guide/hands screenshot is actual mono WebXR application rendering at 1280×720. The automated body passed the original validator. The dot did **not** validate in this software-rendered run: the first timed placement failed to settle; the corrected cue waited for real XR frames and hit its five-second frame-stall guard. It remains an explicitly unverified Windows GPU rehearsal item. No completion was forced and no XR-complete screenshot is supplied. The bounded automated test writes `xr-check.json`; rerun locally with `node scripts/check-demo-xr.cjs` after installing Playwright/Chromium or adapting the executable path for Windows. These test scripts' `/usr/bin/chromium` path is a Linux CI assumption, not required by the Windows OBS workflow.

`xr-guide.png`, `desktop/svg-complete.png`, and `desktop/spatial-complete.png` are the real captures obtained here. Do not infer a full three-minute video or successful complete XR take from them. A single bounded Orbit capture is attempted; any timeout is reported in `orbit-check.json` or the PR instead of repeated expensive capture attempts. Windows GPU capture, OBS, optional extension emulation and actual Quest validation remain pending. No artificial rendering substitutes were used.

Resource impact: IWER is lazy loaded only for explicit embedded emulation (about 149 KB / 41 KB gzip); capture client about 6 KB / 2 KB gzip. Entry bootstrap/mode are small. Existing GPU texture allocations, artwork and Quest scene budgets are unchanged. The emulator adds its CPU simulation only in opted-in desktop capture mode. Production rejects its activation. Vite's existing large Three.js chunk warning remains.
