import * as THREE from 'three';

// A native-mask feasibility mesh, not reconstructed Arabic font/vector outlines.
// Every nonzero mask texel is retained, including faint marks. Only adjacent
// filled rectangles / collinear boundary runs are merged; no simplification.
export const RELIEF_LIMITS = { triangles: 160000, bufferBytes: 16 * 1024 * 1024, draws: 2 } as const;
export const RELIEF_HEIGHT = .20;
export interface ReliefBand { inner: number; outer: number; elevation: number; top: number; bottom: number }
export interface ReliefMask { width: number; height: number; alpha: Uint8Array }
export interface ReliefRect { x: number; y: number; width: number; height: number }
export interface ReliefMeasurement {
  inkPixels: number; coveredPixels: number; faceRectangles: number; wallRuns: number;
  triangles: number; bufferBytes: number; buildMs: number; components: number;
}
export function buildRaisedRelief(mask: ReliefMask, band: ReliefBand, atlasHeight: number) {
  const started = performance.now(), { width: w, height: h, alpha } = mask;
  if (w !== 4096 || h !== band.bottom - band.top || alpha.length !== w * h)
    throw Error('Relief requires the complete native-resolution hero mask; resampling is forbidden');
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && alpha[y * w + x] !== 0;
  const seen = new Uint8Array(w * h), rectangles: ReliefRect[] = [];
  const facePositions: number[] = [], faceUv: number[] = [], wallPositions: number[] = [], wallUv: number[] = [];
  const world = (x: number, y: number, z: number) => {
    const a = x / w * Math.PI * 2, r = band.inner + y / h * (band.outer - band.inner);
    return [r * Math.cos(a), r * Math.sin(a), z];
  };
  let emittedTriangles = 0;
  const quad = (positions: number[], uv: number[], corners: number[][], samples = corners) => {
    emittedTriangles += 2;
    if (emittedTriangles > RELIEF_LIMITS.triangles || emittedTriangles * 3 * 8 * 4 > RELIEF_LIMITS.bufferBytes)
      throw Error('Relief budget exceeded during construction; no mask simplification permitted');
    for (const i of [0, 1, 2, 0, 2, 3]) {
      positions.push(...world(corners[i][0], corners[i][1], corners[i][2]));
      uv.push(samples[i][0] / w, 1 - (band.top + samples[i][1]) / atlasHeight);
    }
  };
  let inkPixels = 0, coveredPixels = 0, wallRuns = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!at(x, y)) continue;
    inkPixels++;
    if (seen[y * w + x]) continue;
    let width = 1, height = 1;
    // Eight angular texels bound chord deviation below .0003 scene units.
    while (width < 8 && at(x + width, y) && !seen[y * w + x + width]) width++;
    outer: while (y + height < h) {
      for (let dx = 0; dx < width; dx++)
        if (!at(x + dx, y + height) || seen[(y + height) * w + x + dx]) break outer;
      height++;
    }
    for (let dy = 0; dy < height; dy++) seen.fill(1, (y + dy) * w + x, (y + dy) * w + x + width);
    coveredPixels += width * height; rectangles.push({ x, y, width, height });
    const z = band.elevation + RELIEF_HEIGHT;
    quad(facePositions, faceUv, [[x, y, z], [x, y + height, z], [x + width, y + height, z], [x + width, y, z]]);
  }
  if (!inkPixels || coveredPixels !== inkPixels) throw Error('Native mask coverage was lost');
  const wall = (ax: number, ay: number, bx: number, by: number, nx: number, ny: number) => {
    const z = band.elevation + .001, top = band.elevation + RELIEF_HEIGHT;
    const a = [ax, ay, z], b = [bx, by, z];
    const sample = (p: number[]) => [p[0] + nx * .5, p[1] + ny * .5];
    // Sample half a native texel INSIDE the ink; outside-edge filtering must
    // never make an opaque wall for a faint antialiased mark.
    quad(wallPositions, wallUv, [a, [ax, ay, top], [bx, by, top], b], [sample(a), sample(a), sample(b), sample(b)]);
    wallRuns++;
  };
  for (let y = 0; y < h; y++) for (const direction of [-1, 1]) {
    for (let x = 0; x < w;) {
      if (!at(x, y) || at(x, y + direction)) { x++; continue; }
      const start = x; x++;
      while (x - start < 8 && x < w && at(x, y) && !at(x, y + direction)) x++;
      if (direction === -1) wall(start, y, x, y, 0, 1);
      else wall(x, y + 1, start, y + 1, 0, -1);
    }
  }
  for (let x = 0; x < w; x++) for (const direction of [-1, 1]) {
    for (let y = 0; y < h;) {
      if (!at(x, y) || at(x + direction, y)) { y++; continue; }
      const start = y; y++;
      while (y < h && at(x, y) && !at(x + direction, y)) y++;
      if (direction === -1) wall(x, y, x, start, 1, 0);
      else wall(x + 1, start, x + 1, y, -1, 0);
    }
  }
  // Count ALL native 4-connected components; this includes one-texel specks.
  seen.fill(0); let components = 0;
  const queue = new Int32Array(w * h);
  for (let i = 0; i < alpha.length; i++) if (alpha[i] && !seen[i]) {
    components++; let head = 0, tail = 1; queue[0] = i; seen[i] = 1;
    while (head < tail) {
      const j = queue[head++], x = j % w, y = Math.floor(j / w);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        const k = ny * w + nx;
        if (at(nx, ny) && !seen[k]) { seen[k] = 1; queue[tail++] = k; }
      }
    }
  }
  const triangles = (facePositions.length + wallPositions.length) / 9;
  const bufferBytes = (facePositions.length + wallPositions.length) * 4 * 2 + (faceUv.length + wallUv.length) * 4;
  if (triangles > RELIEF_LIMITS.triangles || bufferBytes > RELIEF_LIMITS.bufferBytes)
    throw Error(`Relief budget exceeded (${triangles} triangles, ${bufferBytes} bytes); no mask simplification permitted`);
  const geometry = (positions: number[], uv: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    g.computeBoundingBox(); g.computeBoundingSphere(); return g;
  };
  const faces = geometry(facePositions, faceUv), walls = geometry(wallPositions, wallUv);
  // Smooth ONLY the side-lighting normals using the native coverage gradient.
  // Native pixel support, top faces, counters and every alpha value are intact.
  // Without this, alternating axis-aligned pixel walls produce a sawtooth glint.
  const normal = walls.getAttribute('normal'), wallUV = walls.getAttribute('uv');
  const sample = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h ? 0 : alpha[y * w + x] / 255;
  for (let i = 0; i < normal.count; i++) {
    const u = wallUV.getX(i) * w, v = (1 - wallUV.getY(i)) * atlasHeight - band.top;
    const x = Math.floor(u), y = Math.floor(v);
    let gx = 0, gy = 0;
    for (let j = -1; j <= 1; j++) {
      const weight = j === 0 ? 2 : 1;
      gx += weight * (sample(x + 1, y + j) - sample(x - 1, y + j));
      gy += weight * (sample(x + j, y + 1) - sample(x + j, y - 1));
    }
    const angle = u / w * Math.PI * 2, radius = band.inner + v / h * (band.outer - band.inner);
    gx /= radius * Math.PI * 2 / w; gy /= (band.outer - band.inner) / h;
    const nx = gx * Math.sin(angle) - gy * Math.cos(angle);
    const ny = -gx * Math.cos(angle) - gy * Math.sin(angle), length = Math.hypot(nx, ny);
    if (length > 1e-6) normal.setXYZ(i, nx / length, ny / length, 0);
  }
  const measurement: ReliefMeasurement = { inkPixels, coveredPixels, faceRectangles: rectangles.length,
    wallRuns, triangles, bufferBytes, buildMs: performance.now() - started, components };
  return { faces, walls, rectangles, measurement };
}
