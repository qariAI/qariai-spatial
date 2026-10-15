const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { buildSync } = require('esbuild'), { chromium } = require('playwright');
const project = path.resolve(__dirname, '..'), output = path.join(project, 'docs/raised-calligraphy-v0.1');
const bundle = options => buildSync({ ...options, bundle: true, write: false, format: 'iife' }).outputFiles[0].text;
(async () => { let browser; try {
  const baseline = require('node:child_process').execFileSync('git', ['show', 'b1521ea1149872debeb840b5a8c8d47c4558ca92:src/CalligraphyDepthArt.tsx'], { cwd: project, encoding: 'utf8' });
  const oldCode = bundle({ stdin: { contents: baseline + '\nexport { engravedAtlas };', resolveDir: path.join(project, 'src'), loader: 'tsx' }, globalName: 'BeforeArt' });
  const newCode = bundle({ entryPoints: [path.join(project, 'src/CalligraphyDepthArt.tsx')], globalName: 'AfterArt' });
  const meshCode = bundle({ entryPoints: [path.join(project, 'src/calligraphy/raisedRelief.ts')], globalName: 'Relief' });
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage(); page.setDefaultTimeout(30000);
  await page.setContent(`<style>@font-face{font-family:Amiri;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(project, 'public/fonts/Amiri-Bold.ttf')).toString('base64')});font-weight:700}</style>`);
  await page.evaluate(() => document.fonts.load('700 100px Amiri'));
  for (const code of [oldCode, newCode, meshCode]) await page.addScriptTag({ content: code });
  console.log('Browser ready; comparing the actual native atlas bakers (bounded externally).');
  const proof = await page.evaluate(() => {
    const start = performance.now(), calls = [], native = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (this.canvas.width === 4096 && this.canvas.height === 1024)
        calls.push({ destination: this.canvas, source: args[0], x: args[1], y: args[2], transform: this.getTransform() });
      return native.apply(this, args);
    };
    let before;
    try { before = BeforeArt.engravedAtlas(1, 4096); }
    finally { CanvasRenderingContext2D.prototype.drawImage = native; }
    const reference = document.createElement('canvas'); reference.width = 4096; reference.height = 1024;
    const ref = reference.getContext('2d'); let phrases = 0;
    for (const call of calls) if (call.destination === before.map.image) {
      ref.setTransform(call.transform); ref.drawImage(call.source, call.x, call.y); phrases++;
    }
    const after = AfterArt.engravedAtlas(1, 4096, true);
    const pixels = canvas => canvas.getContext('2d').getImageData(0, 0, 4096, 1024).data;
    const a = pixels(before.map.image), b = pixels(after.map.image), oldHeight = pixels(before.bump.image), newHeight = pixels(after.bump.image);
    const expectedMask = pixels(reference), actualMask = pixels(after.heroMask);
    let colorDifferences = 0, heightRoughnessDifferences = 0, otherBandDifferences = 0, maskDifferences = 0, packedMaskDifferences = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) colorDifferences++;
      if ((i % 4 === 0 || i % 4 === 1) && oldHeight[i] !== newHeight[i]) heightRoughnessDifferences++;
      const row = Math.floor(i / 4 / 4096);
      if ((row < 344 || row >= 680) && oldHeight[i] !== newHeight[i]) otherBandDifferences++;
      if (i % 4 === 3 && expectedMask[i] !== actualMask[i]) maskDifferences++;
      if (row >= 344 && row < 680 && i % 4 === 2 && newHeight[i] !== actualMask[i + 1]) packedMaskDifferences++;
    }
    const alpha = new Uint8Array(4096 * 336);
    for (let i = 0; i < alpha.length; i++) alpha[i] = actualMask[(344 * 4096 + i) * 4 + 3];
    const geometry = Relief.buildRaisedRelief({ width: 4096, height: 336, alpha }, { inner: 52.9, outer: 64.2, elevation: .48, top: 344, bottom: 680 }, 1024);
    const covered = new Uint8Array(alpha.length);
    for (const r of geometry.rectangles) for (let dy = 0; dy < r.height; dy++) for (let dx = 0; dx < r.width; dx++) covered[(r.y + dy) * 4096 + r.x + dx]++;
    let missingPixels = 0, filledOpenings = 0, duplicateCoverage = 0;
    for (let i = 0; i < alpha.length; i++) {
      if (alpha[i] && !covered[i]) missingPixels++;
      if (!alpha[i] && covered[i]) filledOpenings++;
      if (covered[i] > 1) duplicateCoverage++;
    }
    // Synthetic nonscriptural fixture: tiny faint point, disconnected mark,
    // counter, one-texel gap, and full support touching the atlas edge.
    const synthetic = new Uint8Array(4096 * 8);
    for (let y = 1; y < 6; y++) for (let x = 1; x < 7; x++) if (x === 1 || x === 6 || y === 1 || y === 5) synthetic[y * 4096 + x] = 255;
    synthetic[7 * 4096 + 9] = 1; synthetic[0] = 2; synthetic[3 * 4096 + 8] = 100;
    const fixture = Relief.buildRaisedRelief({ width: 4096, height: 8, alpha: synthetic }, { inner: 10, outer: 11, elevation: 0, top: 0, bottom: 8 }, 8);
    const raster = new Uint8Array(synthetic.length);
    for (const r of fixture.rectangles) for (let y = r.y; y < r.y + r.height; y++) raster.fill(1, y * 4096 + r.x, y * 4096 + r.x + r.width);
    let syntheticDifferences = 0;
    for (let i = 0; i < synthetic.length; i++) if (!!synthetic[i] !== !!raster[i]) syntheticDifferences++;
    let downsampleRejected = false;
    try { Relief.buildRaisedRelief({ width: 2048, height: 8, alpha: new Uint8Array(2048 * 8) }, { inner: 10, outer: 11, elevation: 0, top: 0, bottom: 8 }, 8); } catch { downsampleRejected = true; }
    const finiteGeometry = [geometry.faces, geometry.walls, fixture.faces, fixture.walls].every(g => ['position', 'normal', 'uv'].every(key => g.attributes[key].array.every(Number.isFinite)));
    return { phrases, colorDifferences, heightRoughnessDifferences, otherBandDifferences, maskDifferences, packedMaskDifferences,
      missingPixels, filledOpenings, duplicateCoverage, syntheticDifferences, downsampleRejected, finiteGeometry,
      measurement: after.raised.measurement, syntheticComponents: fixture.measurement.components, totalMs: performance.now() - start,
      limits: Relief.RELIEF_LIMITS, method: 'Actual baseline baker tile/transform replay versus recorded native alpha; exact per-texel mesh-support comparison' };
  });
  fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, 'integrity.json'), JSON.stringify(proof, null, 2));
  for (const field of ['colorDifferences','heightRoughnessDifferences','otherBandDifferences','maskDifferences','packedMaskDifferences','missingPixels','filledOpenings','duplicateCoverage','syntheticDifferences']) assert.equal(proof[field], 0, field);
  assert(proof.phrases > 0 && proof.downsampleRejected && proof.finiteGeometry); assert.equal(proof.syntheticComponents, 4);
  assert(proof.measurement.triangles <= proof.limits.triangles && proof.measurement.bufferBytes <= proof.limits.bufferBytes);
  console.log('PASS', JSON.stringify(proof));
} finally { await browser?.close(); } })().catch(error => { console.error(error); process.exitCode = 1; });
