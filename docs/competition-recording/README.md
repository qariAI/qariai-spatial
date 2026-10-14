# Recording handoff — PR #20 base

Branch `demo/competition-recording-v1`, parent `133db2d482908016280bf8bfe4c1b4634f989989`. Application artwork and source modules are unchanged.

A single bounded Chromium SwiftShader capture at **1920×1080** failed waiting for Living Orbit readiness. No full cloud take, 1080p Orbit screenshot or final MP4 exists. Per the user's explicit fallback instruction, cloud capture stopped; no further GPU capture attempts were made. `orbit-check.json` is the real diagnostic record.

[Windows automation and exact OBS instructions](../../tools/competition-recorder/README.md). It reuses the existing PR #20 preview, controls OBS locally, rehearses real body/dot completion first and exports a 174-second H.264 MP4 only after the full actual desktop sequence succeeds. The Windows path is script/logic checked here, but Windows GPU/OBS and full take execution are unverified. No fabricated recording assets are included. Inherited PR #20 captures remain in their original directory and are not relabelled as new evidence.

New checks: `node --test tools/competition-recorder/test.mjs`, `node scripts/check-recording-data.cjs`, syntax checks and unchanged application production build. Normal application validation from PR #20 remains applicable; no application implementation changed in this branch.
