# Harf Studio v0.2 — independent hands-first Quest experiment

Issue #14. Branch `prototype/harf-studio-v0.2-xr`, based on `prototype/harf-studio-v0.1` at `66cd927`. No Living Orbit source or Android repository changes.

## Access

- `/harf-studio.html`: original, byte-identical dependency-free SVG pointer/touch/stylus fallback.
- `/harf-studio-xr.html`: independent Three.js writing surface; desktop pointer access and Quest immersive hand input.
- Run `npm run dev`. Quest requires an HTTPS preview, compatible Meta Quest Browser, hand tracking enabled and permission for `local-floor` and `hand-tracking`. No controller fallback is required or used.
- Vercel preview: use the child branch's preview deployment, if repository automation creates one, and append the entry route. No preview deployment is manually requested and no production deployment is performed. A live preview URL has not been verified here; the draft PR's deployment checks are the source of truth. Do not present an assumed URL as tested.

## Interaction state

The plane is 0.72 × 0.52 m, initially 0.55 m ahead and 0.16 m below the viewer's eye height, using initial horizontal gaze only. It is fixed in local-floor space after placement; head motion never relocates the plane or resets ink. These dimensions are initial comfort assumptions, not hardware-validated ergonomics.

The right-to-left body guide and its dot reproduce the illustrative v0.1 exercise. Complete the body using direction/proximity coverage, release, then pinch at the dot. This is not certified calligraphy assessment or a professional Bāʾ exemplar. No sacred text is used.

Both hands are represented by visible joint markers (up to 25 each). Only a hand with index-tip and thumb-tip poses can draw. Bring the index tip within 6.5 cm of the plane and pinch: 18 mm activation, 30 mm release and 90 ms release debounce. Open the hand initially and after tracking loss. A single input source owns a stroke; the other cannot duplicate it. Board-local fingertip samples are exponentially smoothed, and jumps/backward movement are rejected. Ink stays in plane coordinates when the headset moves. Opening the hand pauses; tracing can resume near the previous endpoint.

TRY AGAIN and LEAVE VR are on the spatial board. Pinch near a button for 400 ms, then open before another action. Moving off the button cancels its hold. DOM buttons also support desktop access. Use the Quest system menu as an exit fallback if the browser fails to end a session. Missing joints and tracking recovery never connect a held pinch to an old stroke; hidden sessions suppress input.

## Implementation and resources

Separate Vite HTML entry and modules under `src/harf-xr`; no App.tsx integration. A single 900 × 650 RGBA canvas texture (~2.98 MiB including mipmaps) draws calm slate, fine ruled guide and restrained gold ink. Texture repaint/upload occurs on state changes, not unconditionally each frame. Two instanced hand meshes share low-poly joint geometry/material; one plane and one optional cursor. Maximum four scene draw calls; 50 low-poly joint instances (~4,050 triangles with cursor). DPR is capped at 1.5 and anisotropy at 4. These are source estimates, not measured Quest timing. A roughness/lighting-based sculpted effect is not claimed for this ink exercise.

Session ownership prevents duplicate entry and tears down listeners on end/failure; start/end preserve completed ink but end active drawing. Page exit stops the loop, ends the session, disconnects resize observation and disposes texture, geometries, materials and renderer. A disposed back/forward-cache restoration reloads safely.

## Reproducible checks

- `npm run build`: TypeScript and multi-entry production bundle, retaining the inherited Three.js bundle warning.
- `node scripts/check-harf-xr.cjs`: direction/proximity, tracking-jump rejection, stroke resume, body-to-dot state, completion/reset, pinch hysteresis/debounce/rearm, duplicate/delayed session entry, end cleanup and failed-renderer attachment. Session simulation uses a fake lifecycle and renderer-attachment callback; it is not an immersive renderer or joint-pose hardware test.
- `node scripts/check-harf-desktop.cjs`: original SVG pointer body/dot/reset/guide, new plane pointer body/dot/retry, denied hand-feature session fallback, narrow viewport and page-exit smoke check. Uses Playwright and system Chromium available in this environment; these are not application dependencies.

Recorded results and screenshot availability are in `validation.json`. No fabricated headset PASS outcomes. Desktop screenshot, if generated, is the actual pointer-completed scene and cannot establish binocular sharpness or hand interaction. Browser software rendering is not a Quest performance proxy.

## Required real Quest acceptance tests

1. HTTPS entry/permission acceptance, both hands and index/thumb joint availability; verify session end/re-entry and missing-pose recovery.
2. Pinch thresholds, release debounce and two-hand ownership; reject duplicate body/dot input and accidental button activation.
3. Plane reach and vertical comfort while standing/seated; stable ink during head translation/yaw/pitch; proximity tolerance and jitter filtering.
4. Complete Bāʾ body then dot; direction/proximity feedback visible in-headset; TRY AGAIN and LEAVE VR usable without keyboard/controllers.
5. Binocular guide/ink sharpness and marker occlusion, frame time at supported Quest refresh rates, thermal behavior and allocation/upload cost during prolonged tracing.
6. Suspend/resume, hand tracking loss, system-menu exit and failed permissions without stale input or leaked resources.
7. Qualified Arabic calligraphy specialist review of form, stroke order and educational feedback before educational or Living Orbit integration.

Stop at draft PR review. No merge, production deployment or integration into Living Orbit.

## Results from this environment

Production build and tracing/pinch/session lifecycle simulations passed; final TypeScript verification is run after teardown guards. The original desktop SVG pointer body, dot, reset and guide controls passed in the final deterministic browser run. The 60-second run then timed out navigating to the spatial entry before its checks or screenshot. Earlier attempts exposed a test-coordinate serialization error (fixed), then per-event IPC delay. No spatial pointer PASS, denied-session browser PASS, fresh desktop screenshot, headset outcome or verified Vercel preview is claimed. No more browser retries were attempted after the bounded final timeout. Batched movement is synthetic PointerEvent input through production handlers with real pointer down/up; this verifies state transitions, not real-time input smoothness.
