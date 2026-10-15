# Celestial Seal v0.3 — 2D composition proof for review

**Provisional source-font layout, not completed bespoke Jali Thuluth. No 3D sculpture.**

This original layout study follows the approved four-course framework for the **complete Al-Mulk 67:3**. It replaces the superseded three-band hypothesis. It uses no Living Orbit palindrome or Qur’an 21:33 excerpt. The application and PR #26 remain unchanged; all new files are documentation/review assets on `design/celestial-seal-v0.3-proof`, based on `c4d5362c177c22983380637eedfa7c65cb311412`. No new PR, app route, sculpture, interaction, production deployment or competition-film change is part of this proof.

## Review images

- [Labelled composition study](labelled-study.png): four full phrase courses, protected text bounds, right-to-left course labels and explicit return-to-right arrows.
- [Unannotated type/spacing proof](composition-proof.png): the same complete shaped phrases with editorial bounds/arrows removed. The dotted circular envelope is a layout boundary, not an engraved rim.
- [Word-by-word reading guide](reading-guide.png): complete course plus individually numbered words. Numbers and guide labels are editorial metadata.
- Editable review sources: [labelled SVG](labelled-study.svg), [composition SVG](composition-proof.svg), [guide SVG](reading-guide.svg). These contain live text using an embedded, unmodified proof font. They are **not calligrapher-produced outline paths**. GitHub's SVG sanitization may suppress embedded fonts; the PNGs are the actual Chromium-rendered review reference.

## What this proof establishes — and what remains unresolved

The four courses retain complete, naturally shaped phrases and a clear top-to-bottom reading hierarchy inside one proposed circular envelope. Whole courses share one font size and upright proportions. The shorter imperative phrase forms an inward pause before the closing question. No glyph, dot, diacritic or pause sign is individually repositioned; no text-path bending, synthesized join, manual tatweel, rotation or anisotropic scaling is used. Gold and bronze tones are flat 2D study colors, not a new material implementation.

**The lettering does not yet form the requested dense, organically interwoven Jali Thuluth silhouette.** The circle is a proposed envelope rather than a claim that the present typesetting is a completed circular masterpiece. Interweaving is intentionally unresolved: adding arbitrary flourishes or overlapping live-font words would pretend to solve the central calligraphic problem. This study is suitable for reviewing text, hierarchy and reserved space, and for briefing a qualified calligrapher. It is not ready for sculptural implementation.

Jali Thuluth is the primary commission reference: an integrated circular body built from broad bowls, coherent stem rhythms and carefully negotiated negative space. It is **not the typeface shown here**. A qualified Arabic calligrapher must draw and approve the authentic word relationships, any bespoke joins or permitted elongations, and mark placement. Their first revision should replace this conservative typesetting with original vector calligraphy while keeping the same verse and documented reading order. No claim of historical authentication, specialist review or custom Thuluth authorship is made.

## Locked text and reading order

Sources checked 15 October 2026: [Quran.com 67:3](https://quran.com/67/3) Uthmani word-text entries and [QuranEnc 67:3](https://quranenc.com/ar/browse/arabic_mokhtasar/67/3) complete verse heading. Captured text and extraction method are in [source-snapshots.json](source-snapshots.json). Quran.com's 18 entries joined by U+0020 match QuranEnc character-for-character: **137 code points, 257 UTF-8 bytes, 58 combining marks, 17 spaces, two U+06D6 pause signs**. Those signs remain attached to words 05 and 12, at zero-based canonical character indices 41 and 92. The verse number ٣ and Surah citation are metadata, not extra words in the hashed text. No Basmala is added.

SHA-256, UTF-8 without trailing newline: `fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc`.

This locks the selected sources' Unicode Uthmani representation. Ordinary normalized/Imla’i quotations, stripped diacritics, font-specific display encodings and NFC/NFKC-normalized strings are **not substitutes** for that canonical string. Matching source text is not proof of identical font appearance; both require review. The audit concerns extracted source text, not a raw HTTP-payload checksum or an independent theological certification.

| Course | Words | Phrase function | Reading |
| --- | --- | --- | --- |
| C1 | 01–05 | Opening / creation of seven heavens | Start at right; read to left; retain pause on W05 |
| C2 | 06–12 | Middle clause | Return to right on next course; read to left; retain pause on W12 |
| C3 | 13–14 | Imperative / return of the gaze | Return to right; read the complete two-word phrase to left |
| C4 | 15–18 | Final question | Return to right; read to left; verse ends after W18 |

These are spatial/course divisions, not newly prescribed recitation stops. No counter-clockwise/circular reading direction is assumed. [reading-order.json](reading-order.json) records course/word order and source character spans; [WORD-GUIDE.md](WORD-GUIDE.md) lists every word. Editorial arrows must not become sacred ornament or automatic illumination in the application. Eventual unnumbered vector proofs must be read correctly by independent Arabic readers before construction.

## Font and rendering provenance

The proof uses **KFGQPC Uthmanic Script HAFS, version 0.09**, for the Qur’anic signs in this selected source encoding. It is a provisional Qur’anic typography proof, not Jali Thuluth. The unmodified WOFF2 was obtained from the documented Nuqayah font mirror; [font-provenance.json](font-provenance.json) records URL, date and checksum. [FONT-LICENSE.txt](FONT-LICENSE.txt) reproduces its embedded notices. The license grants use/copy/distribution subject to its conditions and restricts alteration/extraction; this package uses live font text and does **not** extract or modify the font into paths. It does not authorize using this font as the future 3D sculpture's vector master. Commissioned original artwork needs its own rights grant.

PNGs are actual Chromium 2D rendering of the SVG/live text, with loaded embedded font, no WebGL, image-generation model, generated Arabic imagery or paint-over. Source SVG text is preserved as Unicode with native browser Arabic shaping; the display-font version, runtime Chromium version and bounding-box checks are recorded. These checks establish loaded font, source identity, absence of course-bound collisions and complete phrase bounds inside the envelope; they do **not** certify calligraphic authenticity, exact recitation-mark appearance or expert legibility approval.

## Calligrapher handoff — original paths are essential here

1. Produce an original Jali Thuluth-led circular composition, not a trace/copy of the supplied reference. Keep the four courses and all 18 words in logical order; agree any revised path before drawing. Include both source pause marks and every attached mark. Provide annotated and unnumbered reading proofs.
2. Supply editable original artwork plus a clean SVG with explicit viewBox/units, closed filled contours, preserved counters and winding/fill rule. No embedded images, font dependency, clipping-away of text, scripted elements, masks hiding glyph portions or unrelated ornament resembling dots/diacritics. State SVG Y-down/front-plane orientation so later conversion uses one declared coordinate transform.
3. Group complete word shapes and their marks under stable IDs (`word-01`…`word-18`). Multi-character ligatures must map to their exact canonical character spans; one-path-per-character is not required. Include course IDs, reading index, source text, source hash, code-point spans and mark ownership. Any connection spanning words must be explicitly reviewed, not invented by engineering.
4. Provide clearances around marks, punctuation and counters. No crossing may obscure a word or shift a mark's apparent owner. Approve the front view and the intended shallow oblique close view. Mark any proposed overlap that cannot remain readable; revise it before 3D.
5. Have the calligrapher approve proportions, joins, stroke direction and mark placement. A qualified Qur’anic text reviewer separately verifies the full vector inscription against the locked source. Metadata equality alone cannot prove drawn paths spell the verse correctly. Record reviewer names, date, approved file hashes and revisions.
6. Obtain written rights for original work, public GitHub/source distribution, web/WebXR embedding, 2D/3D technical adaptation, screenshots, competition films and commercial exhibition, with agreed attribution. Confirm any font/reference rights separately. No assumption of exclusivity or transfer of copyright.

## Seven shallow planes — retained framework, not implemented

The approved seven-depth symbolism remains a future shallow relief plan: three restrained backing/under-relief strata beneath four slightly staggered inscription strata, one per complete course. Seven planes do not require seven words, seven rings or seven copies of the verse. Each word and all its attached marks remain one rigid group. No detached elevated diacritics, hidden counters or foreground crossings obscuring words. Depth is artistic symbolism, not a literal depiction of heavens. Final assignment and millimetre scale need an approved vector master and visibility review.

The existing blackened bronze, metallic relief, controlled lights and smooth approach camera are retained as the intended later technical foundation. They have not been applied to this proof. Future geometry must be measured against PR #26's 7 draw calls / 87,184 triangles / 2 textures; no current claim that custom calligraphy will meet those counts or Quest performance.

## Reproduce the documentation checks

From this directory:

```sh
python3 audit.py
node check-proof.cjs
node render-proof.cjs
```

The first two use standard-library Python/Node only. The capture script additionally needs Playwright and Chromium at `/usr/bin/chromium`. It performs font loading and native 2D SVG rendering; no application build is involved. The offline audit reproduces the frozen-source comparison and allocation, writes [character-audit.csv](character-audit.csv) and [audit-result.json](audit-result.json), and rejects a changed canonical hash. To refresh sources, retrieve both cited pages independently and review the selected word/heading extracts; do not replace them with a quotation from this README or normalize away discrepancies.

A separate [30-second cinematography plan](STORYBOARD.md) retains the earlier planning request; it is documentation only and changes no camera or film.

## Approval gate

Review [AUTHENTICITY-CHECKLIST.md](AUTHENTICITY-CHECKLIST.md). The present proof can be approved as a conservative text/spacing study and calligrapher commission brief. **It must not be approved as completed bespoke calligraphy or as ready for sculpture.** Original interwoven vector paths, independent text/legibility review and explicit approval of that artwork remain outstanding. Stop at 2D review.
