import fs from 'node:fs';
import assert from 'node:assert/strict';
const source = JSON.parse(fs.readFileSync(new URL('../docs/v1.4.7/source-words.json', import.meta.url), 'utf8'));
const content = fs.readFileSync(new URL('../src/calligraphy/content.ts', import.meta.url), 'utf8');
const entries = [...content.matchAll(/surah: (\d+), ayah: (\d+), words: \[(\d+), (\d+)\].*?text: '([^']+)'/g)];
assert.equal(entries.length, 8);
for (const [, surah, ayah, start, end, text] of entries) {
  const verse = source[`${surah}:${ayah}`];
  assert(verse, `Missing independently captured source ${surah}:${ayah}`);
  assert.equal(text, verse.words.slice(Number(start) - 1, Number(end)).join(' '), `${surah}:${ayah}: wording/marks changed`);
  assert(!/[\u200e\u200f\u202a-\u202e]/u.test(text), 'Unexpected bidi control');
}
console.log('PASS: eight complete excerpts match Quran.com source word spans exactly.');
