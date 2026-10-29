# Desktop Harf sapphire guide

Continuation of draft PR #35 after desktop approval of all seven Living Orbit letters.

The existing Harf Bāʾ guide gains a static satin sapphire gradient and restrained pale rim when `orbitArt=study` is explicitly selected. The same gradient is used by the SVG desktop practice page and the spatial practice canvas outside XR. Gold ink, the completion dot and all tracing logic remain original. This is 2D guide shading, not physical relief or view-dependent reflection.

## Review

- `/harf-studio.html?calligraphyRelief=texture&orbitArt=study`: SVG practice.
- `/harf-studio-xr.html?calligraphyRelief=texture&orbitArt=study`: existing spatial surface in desktop mode.
- Omit `orbitArt` for the original presentation. Duplicate/invalid values do not enable it.
- This does not change Orbit's illustrative free-tracing panel, which is distinct from the validated body-and-dot Harf surface.

## Integrity and scope

`check-harf-finish.cjs` compares the source against c967786. The Bāʾ outline, separate dot, centreline, validator, ink, progress, session, Orbit application and navigation are byte-identical. The existing desktop handlers are identical after removing the explicit presentation installation. Spatial runtime changes are limited to an opt-in cached CanvasGradient and fill/stroke selection gated by `!renderer.xr.isPresenting`.

No new paths, layers, filters, meshes, draw submissions, image textures, lights or animation are added. SVG adds one gradient definition; the existing canvas reuses its unchanged 900×650 texture and dirty painting schedule. No Quest performance or visual validation is claimed. Existing Orbit resources and artwork are untouched.

## Validation

Production build, exact Arabic excerpt checks, integration scope, Harf tracing/ink/lifecycle, navigation and immersive-menu logic regressions pass. The inherited shared-chunk size advisory remains. Browser evidence and matched images are adjacent to this document.

The first browser capture timed out at the completion screenshot while a production build was running concurrently; a single bounded sequential rerun was used. Local subprocess checks required the managed environment's elevated execution mode; no application changes were made to work around the sandbox.
