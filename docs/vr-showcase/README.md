# Three hands-first showcase takes — review before editing

Issue #22. Isolated branch `demo/vr-interactions-showcase-v1`, based **exactly** on PR #21 `be102fdc61429b48720166591c5e4b518ed3571a`. The existing competition recorder, approved video, canonical Living Orbit/Harf modules, artwork, source-verified Qur'anic content, two phases and gesture validators are unchanged. Three new HTML entries plus `src/showcase/` are capture-only helpers. No main, Android, merge or production operation.

## Entry points

- `/vr-showcase.html`: external short-take director; **not** another 2:54 recorder.
- `/showcase-orbit.html?showcase=1&emulate=1`: original Orbit rendered with pinned IWER 2.1.0 mono hand emulation.
- `/showcase-harf.html?showcase=1&emulate=1`: original Harf with same emulator.
- Omit `emulate=1` for explicitly labelled actual desktop fallbacks. Normal `/`, `/harf-studio-xr.html`, `/harf-studio.html`, `/competition-demo.html`, and existing recording scripts retain their original behavior.

Capture helper entry points reject hosts other than localhost/dev or isolated `-git-*.vercel.app` aliases; `?showcase=1` is required. Do not run the official emulator extension simultaneously with the embedded SDK. No Quest device is impersonated as a physical recording.

## What gestures actually do

**Clip 1 (10–12 seconds):** original hand handler receives real SDK index/thumb joints, resolves a ray using its actual wrist/tip direction and scene objects, then pinches to select existing letter index 1 (ل). Success requires the real `Mirrored pair: ل ↔ ل` caption **and** elevated render scales for both original letter objects (indices 1 and 5). It never writes selection state. Five-second cue countdown happens before the useful take. Show visible hand movement/pinch, then hold the highlight about six seconds. Missing hands/highlights or artifacts invalidate the take even if the UI observation passes.

**Clip 2 (10–12 seconds total):** a real emulated pinch on the existing spatial button advances the original scene from phase one to phase two. Success requires the actual `02` phase UI. This is a supported **spatial action**, not hand orbit, hand zoom, planet grabbing or arbitrary scene manipulation. Record 4–5 seconds of that hand action, then stop OBS. Separately exit XR and use the existing **desktop Explore Calligraphy** camera to record a legible 6–7-second engraved macro. The second portion retains `DESKTOP APP — NOT QUEST`; never describe this desktop camera as hand controlled. No new camera, scene gesture, artwork shader or choreography phase is added.

**Clip 3 (16–20 seconds):** original Harf board, source Amiri silhouette, original validator and gold broad-nib ink. Prepare before entering XR. The `Harf take` button runs a frame-acknowledged SDK fingertip body sweep with ≤4-pixel waypoint spacing; it waits for actual index/thumb joints rather than advancing on elapsed time. Body completion must actually be observed, then an open-hand release and a **separate** SDK dot pinch must produce `Letter complete ✓`. No state setter, validator replacement, fake joint getter or pointer substitution is used. During Harf playback, each waypoint requires at least two consecutive settled SDK-joint samples and a short dwell. Pinches ramp over eight samples while the fingertip stays fixed; open-hand release holds at least 220 ms. Joint settling still fails after 3.5 seconds, and a slow body fails a 30-second reliability budget. Slow machines may exceed the target short-clip length; report that instead of accelerating or weakening validation. FAILED means stop and discard the take, not edit it to suggest success. Body-only/dot-only buttons are for diagnosis/rehearsal; use `Harf take` for a continuous clean take.

All SDK gestures are scripted simulated poses. These are **not** physical Quest hand tracking. Original manually inferred practice stroke order still awaits qualified calligrapher review.

## Windows OBS — one take at a time

Keep the successful **Display Capture / Windows Graphics Capture / 1920×1080 / 30 FPS / cursor off** setup. This director does not change OBS configuration. Set an OBS global **Start/Stop Recording** hotkey (Settings → Hotkeys; choose an unused combination, e.g. Ctrl+Alt+F9). Do not use F11 as the recording hotkey. Turn on Windows Do not disturb, close video players and extra capture windows, and keep OBS/other apps behind fullscreen Chrome or on a different monitor.

1. Open the preview's `/vr-showcase.html` in Chrome/Edge with hardware acceleration. Allow the popup. Choose **Open Orbit emulation**. One capture window at a time: close it before switching to Harf or a fallback.
2. In the director choose **Prepare fresh take**, then **Enter emulated VR**. Wait for each `observed` result. Fullscreen the capture window with F11. Check visible hands and artwork; correct label is **WEBXR HAND EMULATION — NOT QUEST · scripted poses**. If gray/white artifacts, unreadable scene or missing hands appear, stop here—there is no approved workaround or usable XR clip yet.
3. For clip 1, click **Pinch letter / mirror** in the director. It arms a five-second countdown and attempts to focus the capture popup. Ensure the capture is foreground fullscreen, then use the OBS recording hotkey during the countdown. Do not allow the director, taskbar or OBS UI into the take. Observe the pinch and both highlights; after a six-second hold stop OBS via hotkey. If focus is not restored, do not record; restart the cue after correcting window focus. No automated OBS start/stop or native foreground guard is claimed for this manual short-take workflow.
4. Clip 2: start a fresh Orbit take (exit XR first, prepare, re-enter). Arm **Pinch spatial action**, record via hotkey, verify the actual transition, stop. Exit XR, choose **Desktop engraving macro**, wait until camera settles, then record its 6–7-second hold separately. Keep the desktop label. If XR rendering is unusable, provide only the labelled macro and document that the hand action clip is blocked.
5. Clip 3: close Orbit capture, choose **Open Harf emulation**, prepare, enter XR, inspect the guide and hands, fullscreen. Arm **Harf take: body → separate dot**, record via hotkey during the five-second countdown, then leave all controls alone. Stop after the actual completed gold Bāʾ and diamond dot are held about two seconds. Confirm `Letter complete ✓` in the downloaded evidence. If stalled, stop the take; do not repeatedly rerun a failing software GPU sequence. Rehearse **Body only** then **Dot only** once to inspect a specific blocker if useful.
6. After stopping recording, download the director's evidence JSON. It contains received observations, route and source origin, but does **not** certify image quality. Record the exact PR commit from the PR alongside it. Do not label any clip usable until you have watched its OBS file. Nothing edits or replaces the existing competition film automatically.

The single cloud Harf attempt stopped during the body cue on `XR frames stalled`; the dot was not attempted after that failure. No usable new footage or screenshot was captured. See `cloud-harf-check.json`; it is explicitly not a pass. Do not repeat cloud acquisition based on this PR.

### Transparent fallback

If a full hand take fails, choose **Open Harf desktop fallback**, fullscreen, record actual mouse dragging along the body from START right-to-left, release and click the separate diamond. Require actual completion. Keep `DESKTOP APP — NOT QUEST`. Do not intercut desktop completion with the failed XR dot to imply the hand gesture succeeded. The existing Windows pointer recorder remains untouched; no full-film rerun is required.

## Artifacts / emulator assessment

Earlier software-GPU Orbit capture repeatedly failed readiness. We deliberately do not repeat lengthy Orbit captures here. Source inspection: IWER 2.1.0 mono mode uses a null/default WebGL framebuffer; Three r160 falls back to XRWebGLLayer because that SDK's render state has no `layers` property. There is no demonstrated projection-layer or material correction to apply. We retain the existing mono configuration and **do not claim the gray/white artifact is fixed**. No normal-app tone mapping, engraving, geometry, letter sizes, texture budgets or shader changes were made to disguise it. Windows must inspect the actual emulated frame before acquisition; desktop macro is the approved truthful fallback.

Harf's prior dot stall was linked to waiting for 16 XR frames within five seconds on a slow software renderer. The new smaller frame-settling window still uses actual SDK poses, open/pinch distances, minimum release duration and original validation. It is a narrowly scoped capture helper change, not proof that every GPU will complete it.

No full 2:54 video is generated by this PR. Cloud check results, if present, are diagnostics at their recorded viewport and are not 1080p/30fps capture certification. No clip is claimed until actual OBS video and quality review exist. `cloud-harf-check.json` records the single bounded emulator attempt. Screenshots are included only if genuinely captured and their limitations remain explicit.

## Review evidence for each OBS file

Save these Windows-generated assets outside Git until review: `01-mirror-hand.mkv`, `02a-spatial-action-hand.mkv`, `02b-engraving-desktop.mkv`, `03-ba-hand.mkv` (or clearly named `03-ba-desktop-fallback.mkv`), plus the director JSON and a manifest containing exact preview origin/commit, route, input, actual duration/resolution/FPS, observed result, visible-hand verification, no gray/white artifact confirmation and reviewer decision. These are **requested filenames, not existing files**. Do not submit stalled or partial gestures as completed. Actual Quest hardware validation remains pending.

## Concrete replacement plan — do not apply until approval

Keep the approved 2:54 master unchanged. After all usable assets pass review, replace **38 seconds**, rather than append:

| Existing master interval | Replacement | Length |
|---|---|---:|
| 0:14–0:24 | Clip 1: pinch selects mirrored pair | 10 s |
| 0:40–0:52 | Clip 2: spatial pinch 5 s + separately labelled desktop macro 7 s | 12 s |
| 2:30–2:46 | Clip 3: body, separate dot, actual completion | 16 s |

Shorten/review clip 3 only if the authentic successful take contains all steps inside 16 seconds; otherwise choose another equally sized replacement interval (up to 20 seconds) before edit approval. No gesture speed-up or freezing is required or assumed. Keep total **2:54**, ≤2:59. Minimal captions: “Pinch to discover a mirrored pair”, “A spatial action changes the scene”, “Trace the body, then place the dot”. Preserve visible input disclosure across transitions. If an XR clip remains blocked, retain the existing approved desktop material and state the limitation. This table is an edit proposal, not an executed edit or permission to alter the competition video.

## Checks

`npm run build`; `node scripts/check-showcase.cjs`; existing content, tracing, ink and integration checks. The pose test verifies placement/aim against public SDK pose data and native open/pinch distances; the app's validators remain authoritative for success. Orbit capture targets are read from existing rendered scene objects through R3F's exported `_roots` store, **read-only**, to avoid estimated positions; a missing/changed store fails explicitly. Canonical application files and existing competition recorder are unchanged from the stated base. Full Windows/OBS and actual Quest tests remain pending.

## Harf movement fix after the Windows 37% warning

The prior follower advanced by elapsed time without confirming the actual XR fingertip had arrived, and changed pinch pose in one step. That could allow commanded movement to outrun consumed/filtered input; the supplied warning alone does not prove the exact cause at 37%. The showcase now subdivides the same guide segments (≤4 pixels, no letter-geometry change), waits for two stable native SDK joint observations within 1.5 mm and the original open/closed pinch-distance limits, and ramps pinch gradually with position compensation. It initializes from the actual right fingertip and approaches the dot with an open hand in ≤8 mm steps. A validator rejection stops the cue; no trace score, validation threshold, geometry or completion state is edited.

Body and dot remain independently testable. `check-harf-showcase-motion.cjs` runs the original validator/pinch/filter model at 15, 30 and 72 FPS. Its results are simulations, not footage. `check-harf-sdk-frames.cjs` uses actual IWER frame joints and the unchanged engine in a tiny 64×64 test-only WebGL fixture, not the full application render; it tests body, separate dot and the combined sequence. Full application results are recorded separately in `cloud-harf-motion-check.json`. Windows full-scene confirmation remains required, even if lower-level checks pass. Existing cloud artifacts and the competition film are unchanged.

Observed fix results: actual IWER-frame/unchanged-engine tests passed body alone (phase `dot`, raw coverage 0.9392265), separate dot (phase `complete`), and complete body-plus-dot sequence, with zero tracking-jump warnings. Maximum measured fingertip-target error was about 0.000000112 m. See `sdk-motion-check.json`. Filter/validator simulations passed at 15/30/72 FPS with maximum commanded step 3.703 px and body durations 23.53/11.87/9.83 seconds respectively (`motion-regression.json`). These figures do not certify full-scene FPS or a finished clip. The full application attempt did not reach showcase startup disclosure within ten seconds, so its body/dot/full UI checks could not run (`cloud-harf-motion-check.json`). No new application footage exists; Windows scene testing remains pending. Stop/discard a stalled or overlong take, and keep the competition master unchanged.
