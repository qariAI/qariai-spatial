const fs=require('fs'),assert=require('assert/strict'),{execFileSync}=require('child_process'),{buildSync}=require('esbuild');
const base='7980a3e1cd2e3de4f2af073ae9a1000b4d14e454';
const names=execFileSync('git',['diff',base,'--name-only','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const allowed=n=>n.startsWith('src/orbit-art/')||n.startsWith('docs/orbit-art-v01/')||['harf-studio.html','src/harf-xr/desktop-entry.ts','src/harf-xr/kaf-practice.ts','scripts/check-kaf-practice.cjs','src/integration/OrbitPracticeLink.tsx','src/App.tsx','src/style.css','scripts/check-desktop-polish.cjs','scripts/check-letter-inspection.cjs','src/integration/routes.ts','src/harf-xr/desktop.ts','src/harf-xr/main.ts','src/harf-xr/desktop-finish.ts','scripts/check-harf-finish.cjs','scripts/check-orbit-art.cjs','scripts/check-orbit-art-browser.cjs','scripts/check-orbit-art-xr.cjs','scripts/extract-orbit-letters.py'].includes(n);
assert(names.every(allowed),'Unexpected changes outside integration scope');
for(const f of ['proof-surface-design','engraving-design','crowned-cap']){
 const original=fs.readFileSync('public/spark-letter/'+f+'.js','utf8').replace("from './engraving-design.js'","from './engraving-design'");
 const copy=fs.readFileSync('src/orbit-art/generated/'+f+'.ts','utf8').split('\n').slice(2).join('\n');assert.equal(copy,original,f+' is exact source copy');
}
assert.equal(fs.readFileSync('src/orbit-art/generated/kaf-outline.json','utf8'),fs.readFileSync('public/spark-letter/kaf-outline.json','utf8'));
const code=buildSync({entryPoints:['src/integration/routes.ts'],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);
for(const path of ['/','/harf-studio.html','/harf-studio-xr.html']){
 assert.equal(m.exports.experienceHref(path,'?calligraphyRelief=texture&orbitArt=study'),path+'?calligraphyRelief=texture&orbitArt=study');
 for(const query of ['orbitArt=bad','orbitArt=Study','orbitArt=study&orbitArt=study','orbitArt=study&orbitArt=bad','orbitArt=//evil.test'])assert.equal(m.exports.experienceHref(path,'?'+query),path);
 assert.equal(m.exports.experienceHref(path,'?orbitArt=study&return=https://evil.test'),path+'?orbitArt=study');
}
assert.throws(()=>m.exports.experienceHref('//evil.test','?orbitArt=study'));
let href=m.exports.experienceHref('/harf-studio-xr.html','?calligraphyRelief=texture&orbitArt=study');href=m.exports.experienceHref('/',new URL(href,'https://test.local').search);assert.equal(href,'/?calligraphyRelief=texture&orbitArt=study');
const before=execFileSync('git',['show',base+':src/App.tsx'],{encoding:'utf8'}),after=fs.readFileSync('src/App.tsx','utf8');
const fn=(s,name)=>{const start=s.indexOf('function '+name+'(');assert(start>=0);let end=s.indexOf('\nfunction ',start+1);if(end<0)end=s.length;return s.slice(start,end)};
for(const n of ['Stars','Belt','Planet','HandTracking','SpatialActions','ImmersiveButton','WorldAnchor','CameraExploreRig','SceneRig'])assert.equal(fn(after,n),fn(before,n),n+' preserved');
const frame=s=>fn(s,'LetterObject').split('\n').find(l=>l.includes('useFrame'));assert.equal(frame(after),frame(before),'exact choreography/selection scale');
assert(after.includes("const LETTERS = ['ك','ل','ف','ي','ف','ل','ك'] as const"));
console.log('PASS integration scope; exact original helpers/contours; strict navigation opt-in; unchanged seven-letter choreography, camera, XR recovery/menu, planets, default stars and belt.');
