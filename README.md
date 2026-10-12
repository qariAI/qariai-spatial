# QariAI Spatial v1.0 — Living Orbit

A React 18 / Vite / TypeScript / React Three Fiber conversion of the approved no-header, seven-letter Living Orbit design. Source design reference is `design-reference.html`.

## Start

`npm install`
`npm run dev`
`npm run build`

Deploy the Vite build to Vercel using `npm run build`, output `dist`.

## Current implementation

- No duplicate sacred Ayah header. The four unique Arabic glyphs appear in seven positions: ك ل ف ي ف ل ك.
- Two phases: static mirrored arrangement and revolving orbit.
- Pair selection highlights counterpart. Central ي highlights itself.
- Six stylized planetary bodies, sun, Saturn rings, asteroid belt, 5200+1400 stars, damped OrbitControls.
- Browser-generated Arabic calligraphy textures; requires Amiri font network load. Not extruded 3D glyph outlines yet.
- Letter-specific *free-tracing sandbox* for ك/ل/ف/ي, intentionally not presented as validated stroke pedagogy. True source-derived stroke guides are outstanding.
- WebXR immersive-vr entry point and sampled index-finger-tip/thumb-tip near pinch tracking, with fallback desktop interaction.

## WebXR — important limitations

Actual Quest operation is NOT YET DEVICE VERIFIED. Must test WebXR session initiation, hand model compatibility, hand coordinate space, interaction radius, pinch stability, controller-free UX, and performance with Quest hardware. WebXR available only on supported browsers and secure origin (HTTPS or localhost). The scene now switches to a provisional headset-size anchor (0.014 world scale, 2.4m forward); distance and accessibility MUST be calibrated with real Quest hardware. It is a foundation implementation, not a headset-approved build. There is not yet far-field pinch raycasting or two-handed scaling, and the in-headset HUD must be rebuilt as a true spatial UI rather than desktop overlays.

Android backend integration is not implemented. Do not claim it exists in Devpost until wired and tested. Current experience runs locally without API calls.

## Next mandatory milestone

Implement headset-scale stage anchoring (world scale), camera/headset origin, 3D spatial buttons, far-field raycasting, near-field hover, pinch state hysteresis, and hand tracking confirmation on actual Quest. Then verify original Android Harf Writer stroke paths.
