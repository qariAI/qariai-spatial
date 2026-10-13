# Harf Studio v0.1 — standalone exploration

Entry point: `/harf-studio.html` in a Vite/Vercel deployment of this branch.

## Scope
A dependency-free HTML/SVG teaching prototype for Arabic letter tracing. It is deliberately **not** wired to Living Orbit's `src/App.tsx`, gameplay phases, camera, UI, or deployment.

## Included
- Letter ب (Bāʾ), simple illustrative body stroke, dot completion.
- Pointer, touch, stylus drawing on an SVG guide.
- Direction/proximity-based basic progress, reset, guide visibility and demonstration.
- Responsive desktop and mobile layout.

## Explicit limitations
- The SVG stroke is an **illustrative learner path**, not a verified professional Arabic calligraphy exemplar; source authentic stroke paths with qualified calligrapher review before educational use.
- No WebXR, 25-joint hands, pinch interaction, headset performance or 3D scoring in v0.1.
- Proximity/coverage is an interaction exercise, not a handwriting quality assessment.
- This prototype does not contain sacred passages; no Qur'anic text is used in tracing exercises.
- No build, browser test or Quest test is claimed by this GitHub-only initial commit.

## Next acceptance gates
1. Confirm standalone preview loads and SVG tracing works on Windows Chrome and Android touch.
2. Obtain an authentic Arabic teaching letterform and path order for ب.
3. Implement Quest-facing spatial drawing plane and XR hand input in separate, isolated prototype changes.
4. Test real Meta Quest: index-tip accuracy, pinch debounce, depth stability, accessibility, frame rate, and comfort.
5. Only after sign-off consider integrating a Harf Studio entry point into Living Orbit; preserve its two phases untouched.
