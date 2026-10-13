# Harf Studio v0.2 — independent hands-first Quest experiment

Entry routes: `/harf-studio.html` for SVG pointer/touch/stylus practice and `/harf-studio-xr.html` for the separate spatial pointer/Quest experience. Both use the sourced Amiri Naskh Bāʾ definition. See [current letterform implementation, provenance, screenshot and results](ba/README.md) and [validation.json](validation.json).

## Hands-first flow

A 0.72 × 0.52 m plane is initially 0.55 m ahead and 0.16 m below the viewer's eye height, then fixed in local-floor space. Head motion does not relocate it or reset ink. These are unvalidated comfort assumptions.

Trace the body right-to-left, release, then place its separate dot. Visible joint markers represent both hands. Index-tip and thumb-tip poses are required; pinch within 6.5 cm of the board activates drawing (18 mm activation, 30 mm release, 90 ms release debounce). Open initially and after tracking loss. Only one source owns a stroke. Plane-local smoothing rejects jumps; tracing resumes near the last endpoint. Hidden sessions suppress input.

Spatial TRY AGAIN and LEAVE VR use a 400 ms pinch hold near the corresponding button; move away to cancel and open before another action. Desktop buttons remain. The Quest system menu is an exit fallback. Start/end listeners are centrally owned; duplicate entry and failed attachment are handled. Page exit ends the loop/session and disposes texture/graphics resources and resize observation.

One 900 × 650 RGBA canvas texture (~2.98 MiB including mipmaps), up to four draws and 50 low-poly hand-joint instances (~4,050 triangles) remain the source budget. Texture upload occurs on state changes. DPR ≤1.5; anisotropy ≤4. No measured Quest performance is claimed.

## Required Quest and educational acceptance

1. HTTPS/permissions and hand joint availability; session start/end/re-entry and missing-pose recovery.
2. Pinch thresholds, debounce, ownership and duplicate body/dot rejection; retry/exit without keyboard/controllers.
3. Comfortable reach standing/seated, stable ink during head translation/yaw/pitch, jitter and proximity tolerance.
4. Binocular guide/ink sharpness, marker occlusion, frame time, thermals and prolonged tracing upload cost.
5. Suspend/resume, system-menu exit and denied permissions without stale input or leaked resources.
6. Qualified Arabic calligrapher review: this is a genuine sourced Naskh typeface contour with a fitted practice centreline, not a certified penmanship exemplar.

Keep draft PR #15 against `prototype/harf-studio-v0.1`. No Living Orbit integration, main/Android changes, production deployment or merge.
