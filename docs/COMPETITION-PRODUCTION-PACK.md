# QariAI Spatial — Competition Production Pack (v1.2)

## Quest performance

This branch reduces rendered starfield points to 42% and belt points to 900 during immersive VR, preserving all original desktop particles. XR framebuffer scale begins at 0.85. These are provisional optimization settings, not measured Quest performance.

Hardware checklist: run continuously for 3 minutes, test both hands, pinch and orbit repeatedly, enter and exit VR several times, check whether all letter dots remain legible, and watch for dropped frames, nausea, overheating, or WebGL errors. Adjust resolution according to hardware measurements.

## Arabic-letter fidelity

The isolated-letter sequence is **ك ل ف ي ف ل ك**, which is symmetric when the letters are read from either end. This is the unvocalized phrase **كل في فلك**, NOT the full Qur'anic verse and NOT the fully vowelled excerpt. Source context: al-Anbiya 21:33, **وَكُلٌّ فِي فَلَكٍ يَسْبَحُونَ**. The scene is a poetic visualization, not an astronomical interpretation claimed by the verse.

Check all seven glyphs, including Arabic presentation direction, baseline, thick/thin strokes, dot placement for ف and ي, and isolated ك legibility. Verify Amiri has loaded before baking glyph textures. Inspect clipping, halo blur, readability in Quest at native resolution, and whether the bright stars distract from the letters. Obtain an independent Arabic typography review.

The Harf Writer tracing geometry is illustrative, not stroke-order validated. Do not claim it is instructional or verified until the Android source stroke geometry has been inspected and ported.

## Three-minute demo storyboard

| Time | Visual | Narration or overlay | Evidence |
|---|---|---|---|
| 0:00–0:12 | Reach for ك and pinch; mirrored ك glows | “What if language lived in the space around us?” | Real Quest footage if available |
| 0:12–0:30 | Pinch spatial action, turn seven letters into an orbit | “Seven letters become a living orbit.” | Hands-only interaction |
| 0:30–0:55 | Reveal glowing fingertip cursor and tracking | “Reach. Pinch. Discover.” | Tracked hand inputs |
| 0:55–1:20 | Explore the planets and central Sun | “A spatial reflection on movement.” | Smooth VR rendering |
| 1:20–1:45 | Highlight mirrored pairs in sequence | “Symmetry becomes something you can explore.” | Letter selection |
| 1:45–2:12 | Demonstrate Harf Writer only as a prototype | “From observing letters to engaging with their form.” | Label illustrative tracing |
| 2:12–2:38 | Show QariAI Android beside spatial prototype | “A new spatial layer for the QariAI ecosystem.” | Do not claim live integration without proof |
| 2:38–3:00 | Final immersive orbit and project name | “Arabic. Space. Human interaction.” | URL and closing frame |

## Claims and release gate

Do not claim that the Android backend and spatial frontend communicate unless that secure connection has been implemented and demonstrated. Treat Quest hand input as unverified until hardware testing.

Do not merge v1.2 until TypeScript/Vite production build passes, hands-only navigation works on Quest, mirrored selection is reliable, text remains readable and the experience is comfortable. Keep main and the public deployment stable pending verification.
