// Auxiliary lighting data only. This never writes, thresholds or resamples the
// authoritative native ink coverage, and never generates letter contours.
function distanceTo(alpha: Uint8Array, w: number, h: number, ink: boolean) {
  const d = new Float32Array(alpha.length), diagonal = Math.SQRT2;
  for (let i = 0; i < d.length; i++) d[i] = (!!alpha[i] === ink) ? 0 : 5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (x) d[i] = Math.min(d[i], d[i - 1] + 1);
    if (y) {
      d[i] = Math.min(d[i], d[i - w] + 1);
      if (x) d[i] = Math.min(d[i], d[i - w - 1] + diagonal);
      if (x + 1 < w) d[i] = Math.min(d[i], d[i - w + 1] + diagonal);
    }
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    if (x + 1 < w) d[i] = Math.min(d[i], d[i + 1] + 1);
    if (y + 1 < h) {
      d[i] = Math.min(d[i], d[i + w] + 1);
      if (x) d[i] = Math.min(d[i], d[i + w - 1] + diagonal);
      if (x + 1 < w) d[i] = Math.min(d[i], d[i + w + 1] + diagonal);
    }
  }
  return d;
}
const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
export function bakeTextureRelief(packed: Uint8ClampedArray, alpha: Uint8Array, width: number, height: number, top: number) {
  const start = performance.now();
  if (alpha.length !== width * height || packed.length < (top + height) * width * 4)
    throw Error('Texture relief requires complete aligned native coverage');
  const inside = distanceTo(alpha, width, height, false), outside = distanceTo(alpha, width, height, true);
  // Preserve original roughness through the hero lane and its empty gutters.
  // Neither supporting band's texels are touched. Padding protects mip edges.
  for (let y = top - 12; y < top + height + 12; y++) for (let x = 0; x < width; x++) {
    if (y < 0 || (y * width + x) * 4 + 3 >= packed.length) continue;
    const p = (y * width + x) * 4; packed[p + 3] = packed[p + 1];
  }
  let inkPixels = 0, modifiedPixels = 0;
  for (let i = 0; i < alpha.length; i++) {
    const p = (top * width + i) * 4, a = alpha[i] / 255;
    // B is the exact immutable native alpha; R/G are auxiliary shading only.
    packed[p + 3] = packed[p + 1]; // Original roughness for exact far-distance shading.
    packed[p + 2] = alpha[i];
    if (!a && outside[i] > 4) continue;
    modifiedPixels++;
    if (a) {
      inkPixels++;
      // Subpixel coverage controls the shoulder. Thin/faint marks keep their
      // source face and get a rounded peak, not an inflated opaque plateau.
      const shoulder = smooth((inside[i] - (1 - a)) / 1.6);
      packed[p] = Math.round(153 + 78 * shoulder);
      packed[p + 1] = Math.round(228 - 146 * smooth(a));
    } else {
      // A narrow lighting valley in immediately neighboring texels. The wider four-texel
      // reset removes the old wide text-shadow profile; it adds no new ink.
      const valley = Math.max(0, 1.65 - outside[i]) / .65;
      packed[p] = Math.round(153 - 10 * valley);
      packed[p + 1] = valley > 0 ? 242 : 228;
    }
  }
  return { inkPixels, modifiedPixels, bakeMs: performance.now() - start,
    addedTriangles: 0, addedGeometryBytes: 0, addedDraws: 0, addedTextures: 0,
    kind: 'lighting-only; no displacement, parallax or physical extrusion' };
}
