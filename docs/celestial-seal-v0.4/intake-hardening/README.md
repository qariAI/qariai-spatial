# PR #27 — future vector-intake safety hardening

Authorized starting head **10510f75c53e0de1ae6c53f6155014477151498b** was confirmed against PR #27 before any edit. Existing branch: `prototype/celestial-seal-v0.4-foundation`. This change is confined to the future intake gate, synthetic regression fixtures/harness and this documentation. No inscription loader is enabled. **No Arabic artwork is created, rendered or integrated.**

## Schema v2 and review integrity

`ApprovedVectorAsset` is now schema v2. An unversioned/legacy bundle fails closed; it must receive original component mappings and fresh reviews, not an automatic conversion.

- **Paths** retain their exact original `d`, fill rule, word/codepoint coverage, level and rigid-group identity. `body` paths contain base components only; `diacritic` and `pause` paths contain only their respective mark components. A `compound` path explicitly maps multiple components and can represent a ligature or a base with attached marks.
- **Components** identify their original zero-based moveto contour indices, base/diacritic/pause kind, exact canonical codepoints, glyph IDs and rigid group. Multiple components may map to multiple characters/glyphs. A shared contour requires a complete, explicit `sharedContours` record and specialist review reference. This permits genuinely integrated approved contours instead of requiring every mark to be a separate SVG path.
- **Glyphs** identify source word/codepoints, reciprocal component IDs, rigid group and approved geometric bounds. Their source clusters include all attached combining signs. A mark names its owner base component, glyph and exact base codepoint. Unicode cluster anchoring rejects swapped owners; rigid groups preserve attachment without forcing every glyph in a word onto the same depth plane. Bounds must agree with the actual assigned contour envelope, detecting movement outside the reviewed placement envelope.
- **Words** preserve all 18 exact tokens, four course assignments and half-open **Unicode codepoint** spans. These are not UTF-16 offsets or visual-paint-order indexes.
- **Paint order** lists every path exactly once and must match original SVG document order. Depth is explicit on rigid groups and paths. Every pair of intersecting path bounding boxes requires one authoritative front/back relation with a review reference, consistent with both paint order and depth. An upper path whose bounds intersect a lower mark/pause component's bounds is rejected even if the relation is declared. A declaration cannot authorize obscuring a sacred mark.

Both reviewer roles must identify **two digests**: SHA-256 of the untouched original SVG bytes, and SHA-256 of the reviewed metadata manifest. The latter covers source text/hash, SVG hash, paths, components, glyph placement, ownership, rigid groups, paint/overlap/shared-contour records, source references and rights. Only `manifestSha256` and `approvals` themselves are excluded to avoid circular hashing. `vectorManifestDigest` sorts object keys, preserves array order and requires JSON-compatible data. It performs **no Arabic normalization**. Altering mappings after approval therefore invalidates the manifest digest; updating only the SVG digest is insufficient.

Approval strings and record links are assertions, **not cryptographic identity verification or proof of qualifications**. Owner verification of the actual records and approved raster proofs is still mandatory before any future importer may use a bundle. The returned metadata is a defensive copy; future consumers must revalidate after any edits rather than treating modified data as approved.

## Strict SVG export contract

The original bytes are never sanitized, rewritten or returned as a substituted SVG. The gate accepts a self-contained SVG namespace with one root viewport, groups, closed paths and optional plain-text title/description/metadata. Only an explicit per-element attribute allowlist is accepted. Nested SVG viewports, dimensions that could hide/crop artwork, transforms, stylesheets/styles, fonts/text elements, images, use references, masks, clipping, filters, scripts, unknown attributes/namespaces and declarations are rejected.

Filled silhouettes must be opaque: optional `fill` is an opaque three/six-digit hex, black or white; opacity/fill-opacity must equal 1, visibility must be visible, display inline, and stroke absent or `none`. The same rules apply to ancestors. Every path needs its explicit approved fill rule. Stroke-only artwork and a stroke that changes the approved silhouette are rejected.

All original path bounds must lie inside the exact approved viewBox. Grammar/arity, finite coordinates, explicit closure, unique IDs and analysis budgets are checked. M/L/H/V/C/S/Q/T/A/Z and their relative forms are supported, including implicit coordinate groups after moveto. Source curves are preserved. For analysis only, initial relative moveto positions are resolved on temporary hidden measurement copies; these copies are disposed and never replace the original master.

Browser SVG bounds and original fill-rule queries supplement Three.js contour analysis. Bounded tessellation supplies interior candidate points, which must lie inside the browser's actual filled silhouette. This catches zero-area paths and coincident even-odd cancellation. **Each mapped component must also contain visible filled interior in its owning original path**: an otherwise valid compound cannot hide a mark in a zero-area contour or an unpainted hole. No canvas image, generated lettering or display artwork is involved.

## Deliberately conservative limitations

- Overlap detection uses axis-aligned bounding boxes, not an exact curved-path Boolean solver. It can flag physically disjoint silhouettes and reject a mark that is safely inside a neighbouring shape's hollow area. Such cases do **not** receive an automatic exception. An artist may need a different independently approved path decomposition or paint order, preserving the master geometry and receiving fresh SVG/manifest approval. Engineering must not silently rearrange it.
- Filled-interior analysis uses 32 curve subdivisions, a viewBox-relative minimum candidate area of `width × height × 1e-12`, and local interior probes. It is a conservative nondegeneracy preflight, not exact analytic area integration. Extremely small/complex contours may fail closed and require expert/tool review. Bounds are browser SVG geometry bounds; glyph-envelope comparisons allow `max(viewBox dimensions) × 1e-7` numerical error. ViewBox containment and overlap detection do not use that tolerance to waive off-canvas geometry or thin occlusion.
- Limits: original SVG ≤5 MB, ≤1,000 paths, ≤20,000 entries per mapping array, ≤12,000 analysis tokens/path, ≤2,000 contours/path, ≤4,096 sampled points/contour and ≤100,000 sampled contour points overall. These are intake-analysis limits, not a new sculpture or headset rendering budget. Large artist exports need preflight before commissioning final export.
- Metadata cannot prove that a contour spells Arabic, that a letter's own dots are correct, or that a mark is artistically attached within its approved glyph envelope. Unicode combining signs are distinguished from dot contours that belong to a base letter. Original calligrapher and Qur'anic-text review must inspect the actual artwork, word/glyph mappings, pauses, legibility, shared contours, interweaving and material-adapted proofs. Rights and reviewer identities must be checked externally.

The contract is intentionally stricter than general-purpose SVG. Existing artist exports may need an artist-produced, flattened, opaque, self-contained export and new asset-specific approvals. **Do not auto-migrate, flatten, reorder, recolour or normalize an approved master.** No original master is currently available, so this is a future compatibility requirement, not a change to existing sacred artwork.

## Locked scripture

The existing snapshot and `config.ts` are untouched. Exact complete Al-Mulk 67:3 remains 18 words / 137 Unicode codepoints, with SHA-256:

`fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc`

Both U+06D6 signs remain attached to words **5 and 12**, at zero-based codepoint offsets **41 and 92**. No extra pause token or end-of-ayah character is inserted. Tests protect every word's exact span, the saved primary/secondary equality, missing/separated pause rejection and byte-changing NFD/NFKC normalization rejection. Input is never normalized to make a failed hash pass. The saved authoritative-source citations remain the existing provenance; this implementation does not claim a new source retrieval.

## Actual tests and before/after comparison

[Standalone intake results](intake-check.json) contain **11 valid cases, 63 negative cases**, legacy-schema rejection and nine equivalent-payload comparisons with `10510f7`. Fictional reviewer/rights records are explicitly labelled **SYNTHETIC FIXTURE — NOT AN EXPERT**. Every displayed/tested contour is a square/rectangle or a simple nonscriptural curve; the verse is metadata only, never shaped or drawn.

| Equivalent synthetic payload | At 10510f7 | Hardened v2 |
| --- | --- | --- |
| Mark incorrectly labelled body | Accepted | Rejected: component/path role |
| Swapped glyph/base owner | Accepted | Rejected: owner mapping |
| Detached mark geometry | Accepted | Rejected: reviewed glyph bounds |
| Hidden path | Accepted | Rejected: presentation |
| Transparent ancestor | Accepted | Rejected: inherited presentation |
| Unpainted path | Accepted | Rejected: opaque fill requirement |
| Off-canvas path | Accepted | Rejected: viewBox bounds |
| Undeclared overlap | Accepted | Rejected: overlap declaration |
| Mismatched manifest approval | Accepted | Rejected: review digest |

Compatibility word-owner annotations let the old validator reach the audited condition. Both validators receive the same payload and bytes. Separate v2 tests exercise each new invariant; results do not rely solely on the new schema-version gate. Other negatives cover malformed/reciprocal mappings, component contour coverage, hidden ancestors, unsupported attributes, nested viewports, cancelled fills, invisible compound marks, undeclared/contradictory depth and paint order, thin occlusion, wrong rights and changed bytes/metadata. Critical tests assert the intended rejection reason.

Valid cases cover separated marks, compound and shared-contour groups, many-to-many ligature mappings, independently layered glyphs in one word, visible marks above bases, reviewed body interweaving, cubic/quadratic/arc contours, relative commands and even-odd holes. These establish schema behaviour, **not authentication of actual calligraphy**.

```sh
node scripts/check-seal-intake.cjs
npm run build
FOUNDATION_SMALL=1 FOUNDATION_CAPTURE=off \
  FOUNDATION_REPORT=docs/celestial-seal-v0.4/intake-hardening/foundation-check.json \
  node scripts/check-seal-foundation.cjs
node scripts/check-calligraphy-content.mjs
node scripts/check-harf-xr.cjs
node scripts/check-integration.cjs
```

The full foundation harness imports the same synthetic suite; it continues to check actual rendering, camera approach/return, manual orbit/return, the complete camera study, both quality/shadow profiles, reduced motion and mobile overflow. Screenshots remain disabled because artwork is byte-identical to the approved polished head; the genuine existing captures remain unchanged. Software timing remains separate from functional success and cannot establish Quest performance.

The old `check-seal-materials.cjs` and polish reports remain historical evidence of the material pass relative to `b3752db`; its old assertion that vector intake is unchanged is intentionally not a current intake-migration assertion. [Scope preservation](scope-check.json) instead verifies all tracked files outside this explicitly authorized intake/test/documentation scope against `10510f7`, including all sculpture, UV/material/light/camera/quality sources, locked scripture, Living Orbit, Harf, public assets and recorder files.

Stop for owner review. No merge, manual/production deployment, artwork integration, competition-film change or Android change.

## Exact changed files

- `src/seal-foundation/vectorIntake.ts` — schema, source/mapping/ownership/depth/approval/rights gate.
- `src/seal-foundation/vectorIntakeGeometry.ts` — SVG allowlist, bounds, filled-component, paint-order and conservative occlusion preflight.
- `scripts/fixtures/seal-intake.mjs` — nonscriptural valid/negative fixtures and paired baseline probes.
- `scripts/check-seal-intake.cjs` — isolated browser runner and retained before/after results.
- `scripts/check-seal-foundation.cjs` — imports the shared synthetic fixture suite; supports a separate report destination and bounded server/navigation/render diagnostics. Functional assertions are preserved.
- `docs/celestial-seal-v0.4/README.md` — replaces the superseded intake description with the v2 reference.
- `docs/celestial-seal-v0.4/intake-hardening/README.md` — this report and artist-export compatibility guide.
- `docs/celestial-seal-v0.4/intake-hardening/intake-check.json` — actual synthetic suite and baseline comparisons.
- `docs/celestial-seal-v0.4/intake-hardening/foundation-check.json` — final full foundation browser results.
- `docs/celestial-seal-v0.4/intake-hardening/foundation-initial-timeout.json` — retained initial 20-second render-readiness failure.
- `docs/celestial-seal-v0.4/intake-hardening/foundation-navigation-timeout.json` — retained separate 20-second DOMContentLoaded navigation failure.
- `docs/celestial-seal-v0.4/intake-hardening/scope-check.json` — scope/source-byte preservation and other suite results.

The initial failures happened before synthetic intake execution. The harness now waits for an explicit local-server response, bounds navigation to commit and actual-render readiness at 45 seconds each, and records the failed stage/page errors. Reaching DOMContentLoaded alone is not treated as render success; the original `foundationReady` AND settled-camera check remains mandatory. Both startup failures are retained rather than relabelled passes. No screenshots were retried or modified.

Final validation: **production build, standalone intake, full foundation functional browser suite, original calligraphy-content verification, Harf tracing/pinch/session simulations and integration simulations all passed**. The final foundation run completed all functional assertions with no page errors. Its desktop timing sample completed 12/12 frames; the Quest-conscious software sample remained explicitly partial at 10/12. This is not Quest hardware validation. Both resource snapshots exactly match the prior polished report: four main calls, 9,578 / 6,274 triangles and unchanged texture/geometry allocations. The scope guard confirms 161 protected tracked files unchanged against the authorized starting head. No screenshots or visual-source files changed.
