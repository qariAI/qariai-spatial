// Documentation-only integrity checks. Does not certify the appearance of vector calligraphy.
const fs=require('node:fs'),p=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,s=JSON.parse(fs.readFileSync(p.join(root,'source-snapshots.json'))),order=JSON.parse(fs.readFileSync(p.join(root,'reading-order.json'))),font=JSON.parse(fs.readFileSync(p.join(root,'font-provenance.json')));
const canonical=s.primary.words.join(' ');
assert.equal(canonical,s.secondary.verse);
assert.equal(crypto.createHash('sha256').update(canonical).digest('hex'),order.canonicalSha256);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.join(root,'UthmanicHafs-Ver09.woff2'))).digest('hex'),font.sha256);
assert.equal(order.words.length,18);assert.equal(order.words.map(w=>w.text).join(' '),canonical);
assert.deepEqual(order.words.filter(w=>w.pauseSign).map(w=>w.wordId),['w05','w12']);
assert.deepEqual(order.courses.map(c=>[c.firstWord,c.lastWord]),[[1,5],[6,12],[13,14],[15,18]]);
for(const file of ['composition-proof.svg','labelled-study.svg']){
 const svg=fs.readFileSync(p.join(root,file),'utf8');
 const courses=[...svg.matchAll(/<text[^>]+id="course-([1-4])"[^>]*>([^<]+)<\/text>/g)];
 assert.equal(courses.length,4);assert.equal(courses.map(m=>m[2]).join(' '),canonical);
 assert(!/<textPath|<clipPath|<mask|<image|<script|scale\(|rotate\(/.test(svg),'Do not bend, clip, rotate or raster-substitute the scripture');
 assert(svg.includes('direction="rtl"'));assert(svg.includes('Not bespoke Jali Thuluth'));
}
const report=JSON.parse(fs.readFileSync(p.join(root,'render-check.json')));
assert(report.fontLoaded&&report.allMarksWithinEnvelope&&report.courseBoundsDoNotOverlap);assert.deepEqual(report.pageErrors,[]);
console.log('PASS frozen-source/codepoint identity, all four complete courses, 18 words, both pause signs, unchanged font bits, no text warping/clipping/substitution and native 2D render checks');
