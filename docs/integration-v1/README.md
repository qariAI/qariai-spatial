# Living Orbit + Harf Studio integration candidate

Issue #17. Branch `integration/living-orbit-harf-v1` starts at exact Living Orbit v1.4.8 `b7e9772b283a3b7b76c88f9a49f32f22863494b7`. Standalone Harf files are copied from complete v0.3 head `2eb0bc2a0fd804e7d74de393b4ef14fdbb46c945`; its v0.1/v0.2 dependency chain is included as the final file tree. No broad merge or replacement of Orbit App.tsx/style.css is performed. Prior branches/PRs remain available for rollback.

## Entries and navigation

- `/`: Living Orbit first. An optional browser-HUD “Practice Calligraphy / Harf Studio” link opens `/harf-studio-xr.html`. This is page navigation, not a third choreography phase or a letter-selection action.
- `/harf-studio-xr.html`: existing Quest-ready broad-nib Bāʾ practice and pointer fallback. Header links expose SVG practice and Return to Living Orbit. The spatial board's former Leave VR target becomes RETURN TO ORBIT; the separate DOM Leave VR control still ends a session without navigating.
- `/harf-studio.html`: SVG pointer/touch/stylus practice with a visible Return to Living Orbit link, including narrow viewports.

Active XR sessions must resolve both `end()` and the explicit `end` event before page navigation. Failure or a five-second event timeout cancels navigation. Navigation is blocked during pending VR entry; duplicate Orbit entry is guarded. Harf also intercepts its SVG-practice link while immersive. Return links retain normal href fallback if WebGL/module startup is unavailable. No headset camera is manipulated. Page navigation exits immersive mode; entry into the next VR experience is explicit, not automatic.

The retained Harf page-exit graphics cleanup and back/forward-cache reload guard remain. Route pages have isolated CSS/runtime entry graphs. A single Vite build outputs all three pages and the bundled Arabic font. No Vercel production configuration is changed.

## Completion fix

Raw coverage is unchanged (e.g. 94%). Presentation follows learning state: accepted body → “Body complete · Add the dot”; completed dot → “Letter complete ✓”, with a full completion bar. Both SVG and spatial board/status use the shared presentation helper. This is learning-step completion, not a certified handwriting-quality score.

## Preserved baselines

Orbit's CalligraphyDepthArt, verified eight Qur'anic excerpts/source references, bump/roughness maps, gold/bronze/slate architecture, distance-aware LOD, geometry and font are byte-identical to v1.4.8. Seven mirrored letters, exactly two phases, Sun, six planets, Moon, Saturn rings, Explore/Return camera, pause/speed/reset, selected-letter tracing and hand architecture retain their existing behavior/code. App changes are limited to navigation wiring/header and a pending-entry guard. Existing CSS is retained with one scoped navigation addition.

Harf's authoritative Amiri body/dot data, manual centreline, broad-nib renderer, direction/proximity validator, pinch handling and session owner are retained. Font-derived geometry is distinguished from inferred teaching stroke order; no additional letters/haptics or quality claims.

## Validation and visual evidence

- Final Vite/TypeScript build passes (inherited large Three.js chunk warning).
- All three built routes and bundled Amiri font return HTTP 200 on the same local preview server.
- Eight exact Qur'anic source spans and all 24 native glyph masks pass.
- Engraved atlas range/roughness-channel, inscription bounds, gutters and course separation pass without WebGL.
- Bāʾ source outline/dot and 505 interior centreline samples pass.
- Existing tracing/pinch/session and broad-nib/native-SVG-point checks pass.
- New navigation simulations pass: wait for end event, cancel on failure/timeout, clean listeners; completion labels preserve raw scores.
- Both Harf pages pass pointer body/dot/reset, completion label, guide/retry, denied-session fallback, narrow layout and page-exit smoke checks. [SVG capture](harf/svg-complete.png) / [spatial desktop capture](harf/spatial-complete.png) are actual integrated-page screenshots.

**Orbit runtime limitation:** one 90-second full desktop/capture attempt timed out before completing startup; fresh normal/Explore screenshots and a complete Orbit interaction regression are unavailable. A navigation smoke run and a draw-suppressed test also stalled at Orbit startup. A bounded diagnostic surfaced no application JS error before its timeout (the expected blocked optional Google-font request was logged). These attempts do not establish either a new application defect or successful GPU rendering. No more expensive screenshot retries were made. Root visual/navigation validation on a real desktop GPU remains outstanding; historical baseline images are not relabelled as integrated captures.

Commands: `npm run build`; `node scripts/check-calligraphy-content.mjs`; `node scripts/check-hero-masks.cjs`; `node scripts/check-engraved-atlas.cjs`; `node scripts/check-harf-xr.cjs`; `node scripts/check-harf-ink.cjs`; `node scripts/check-integration.cjs`; `node scripts/check-harf-desktop.cjs`; `HTTP_ONLY=1 node scripts/check-entry-pages.cjs`; `python3 scripts/verify-harf-outline.py public/fonts/Amiri-Bold.ttf`.

GPU resource budgets are unchanged in either experience. Harf is not rendered alongside Orbit: only one page/runtime is active. New route controls/navigation helpers allocate no GPU resources and add no per-frame Orbit work. Real sustained performance remains unmeasured.

## Headset blockers before release

Immersive entry/permissions; tracked hand/index/thumb availability; bilateral pinch and duplicate prevention; writing-plane reach/comfort; Arabic engraving/diacritic and ink binocular legibility; session exit plus browser navigation/back/re-entry; sustained Quest FPS/thermal behavior and prolonged tracing. Qualified Arabic calligrapher approval of proportions, pen angle and inferred teaching stroke order also remains required. No headset PASS is claimed.

Preview URL/status is recorded only after Vercel reports this integration commit Ready. Preview publication is through the repository's existing GitHub integration; no manual production deployment or production/main changes. Keep the integration PR draft against `codex-calligraphy-v1.4.8`; do not merge.
