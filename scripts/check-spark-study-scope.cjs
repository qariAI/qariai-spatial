const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const baseline='ad10ee39ee0f16262e7b3654b24bad23a34351ff';
const names=execFileSync('git',['diff',baseline,'--name-only'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const allowed=n=>n.startsWith('public/spark-letter/')||n.startsWith('docs/spark-letter/')||['scripts/check-spark-study.cjs','scripts/check-spark-study-scope.cjs','scripts/extract-spark-letter.py','scripts/check-spark-crown.cjs'].includes(n);
assert(names.every(allowed),'Unexpected changes outside the study');
const manifest=JSON.parse(fs.readFileSync('public/spark-letter/vendor/provenance.json'));
for(const f of manifest.files){const bytes=fs.readFileSync(path.join('public/spark-letter/vendor',f.file));assert.equal(bytes.length,f.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256)}
const html=fs.readFileSync('public/spark-letter/index.html','utf8');assert(!/https?:\/\//.test(html),'Study entry must not depend on an external CDN');
const script=fs.readFileSync('public/spark-letter/study.js','utf8');assert(script.includes("const UNIT=4.4,STEP=2,LAYERS=4,MAX_SPLATS=12000"));assert(script.includes("letter:'ك'"));
console.log('PASS study-only paths; original app/dependencies untouched; vendored modules match checksums; no entry CDN; fixed letter and splat guard.');
