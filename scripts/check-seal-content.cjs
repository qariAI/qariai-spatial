const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const data = JSON.parse(fs.readFileSync('src/seal/outlines.json'));
const source = JSON.parse(fs.readFileSync('docs/v1.4.7/source-words.json'))['21:33'];
const layout = JSON.parse(fs.readFileSync('src/seal/layout.json'));

// Pin PR #25's original contours, glyph IDs, mark offsets and bounds, not just its text.
assert.equal(hash('src/seal/outlines.json'), '7d8f6726f155218b1bed9cc9a9993eeb99a9a8cd9833a989450288227ca753b4');
assert.equal(data.excerpt.text, source.words.slice(7, 11).join(' '));
assert.equal(data.excerpt.source, source.source);
assert.equal(data.letters.map(x => x.text).join(''), 'كلفيفلك');
assert.equal(data.font.sha256, hash('public/fonts/Amiri-Bold.ttf'));
assert.equal(data.shaper.direction, 'rtl');
assert(data.excerpt.citation.includes('excerpt'));
for (const part of [...data.letters, data.excerpt]) {
  assert(part.glyphs.every(g => g.gid > 0));
  assert(part.path.length > 10);
  assert(part.bounds.every(Number.isFinite));
  assert(!/[\u200e\u200f\u202a-\u202e]/u.test(part.text));
}
assert.equal(layout.letters.length, 7);
const e = layout.excerpt, b = data.excerpt.bounds;
assert(e.width > 0 && e.clearance >= .14);
const scale = e.width / (b[2] - b[0]);
const halfHeight = (b[3] - b[1]) * scale / 2;
// Conservative rotated bounds protect every inscription stroke, punctuation and mark.
// Isolated conceptual motifs can overlap one another; none may cross this full run.
for (let i = 0; i < 7; i++) {
  const p = layout.letters[i], g = data.letters[i].bounds;
  assert(Object.values(p).every(Number.isFinite));
  assert(p.height > 0 && p.z >= .065 && p.z <= .4);
  const h = p.height, w = h * (g[2] - g[0]) / (g[3] - g[1]);
  const rx = (Math.abs(Math.cos(p.angle)) * w + Math.abs(Math.sin(p.angle)) * h) / 2;
  const ry = (Math.abs(Math.sin(p.angle)) * w + Math.abs(Math.cos(p.angle)) * h) / 2;
  assert(Math.abs(p.x - e.x) > rx + e.width / 2 + e.clearance ||
    Math.abs(p.y - e.y) > ry + halfHeight + e.clearance,
    `Motif ${i + 1} must not obscure the complete inscription`);
}
assert(Math.hypot(Math.abs(e.x) + e.width / 2, Math.abs(e.y) + halfHeight) < 4.58,
  'All inscription bounds must remain inside the backing');
console.log('PASS exact Uthmani excerpt/source, seven motifs, unchanged Amiri outlines/marks, font hash, RTL shaping and protected inscription clearance');
