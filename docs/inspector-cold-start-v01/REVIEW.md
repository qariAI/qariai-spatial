# Cold inspector rendering

On the Windows OBS recording, all four genuine Harf completion links showed an empty 3D viewport while Reset inspection was already enabled. The saved Chrome screenshot and browser report eventually showed the correct sculpture, with no page/console errors.

A local production profile reproduced premature readiness: the UI was ready at ~1.34s, but the first observed native render frame was ~12.1s. Profiling identified the background atlas's relief Canvas2D readback as the dominant synchronous task (~9s on this Linux/SwiftShader setup). This is a reproduced contributor; Windows/OBS timing still needs owner verification.

The fix keeps the original native atlas baker unchanged. After the first bake it stores the exact colour pixels and already-packed relief bytes in a bounded browser CacheStorage record. Full-document Harf returns reuse those bytes, rebuilding fresh textures for the new renderer. The key includes the content-hashed module URL, authoritative font hash, browser/raster settings, and texture capabilities. The complete record has a SHA-256 integrity check and strict dimensions. Missing, corrupt, unavailable, or quota-rejected storage falls back to the original baker; no cache can supply a correctness credential.

Only one ~32 MiB atlas record is retained per origin. The first uncached visit still performs the original bake. The video runner's preflight warms this before recording. Cache hits still incur font/sculpture/context setup; this does not promise instantaneous navigation.

Inspection now waits for the background atlas and two completed native draws before enabling Reset. A central loading status remains visible during preparation. Return remains available. Original geometry, Amiri font, source Arabic content, native baker, camera framing class, guide validation, and XR gesture code are unchanged.

Validation: TypeScript and production build; production browser cache hits for the four entries, corrupt-record fallback, and Reset resource retention; full native colour/relief hashes match the frozen baseline. Representative fresh cached entries took 3.86–5.19s locally versus 14.27s uncached. The same-document Kāf timing in the first microbenchmark is excluded from this comparison. Genuine mouse tracing, Undo/Redo, completion links, visible 3D inspector and Return passed for all four guides in one production-browser run; see guide-check.json. No Windows or Quest validation of this fix is claimed.

Run `scripts/check-inspector-cold-start.cjs` after building, using PLAYWRIGHT_MODULE and CHROMIUM_PATH for local Chrome. The test compares cached pixels against its own first native bake, rather than assuming identical font rasterization across operating systems. HEADFUL=1 enables visible Chrome. No footage is edited.
