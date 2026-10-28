const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),baseline='bfcad0fa452f43bef85c7b0be9e76bdc501d6dbc';
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const allowed=new Set(['src/App.tsx','src/orbit-art/SculptedKaf.tsx','src/orbit-art/LetterInspection.tsx','src/style.css']);let count=0;
for(const entry of git(['ls-tree','-r','-z',baseline]).split('\0').filter(Boolean)){
 const m=entry.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);if(!m||allowed.has(m[2]))continue;
 const bytes=fs.readFileSync(path.join(root,m[2]));const hash=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');assert.equal(hash,m[1],'Protected baseline file changed: '+m[2]);count++;
}
const old=git(['show',baseline+':src/App.tsx']),now=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
const span=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b));
for(const[a,b]of[['type Phase','function makeGlowTexture'],['function Stars','function OrbitalScene'],['/** Actual WebXR','export default function App']])assert.equal(span(now,a,b),span(old,a,b),'Protected App span changed: '+a);
assert.equal(span(now,'function makeGlowTexture','function Stars').trim(),span(old,'function makeGlowTexture','function useLoadedArabicFont').trim(),'Original letter texture changed');
assert.equal(span(now,'function OrbitalScene','/** Actual WebXR'),span(old,'function OrbitalScene','/** Actual WebXR').replace('<KafAssets enabled={ORBIT_ART}>','').replace('</KafAssets>',''),'Orbital scene may only move its asset-provider boundary');
const oldInspector=git(['show',baseline+':src/orbit-art/LetterInspection.tsx']),inspector=fs.readFileSync(path.join(root,'src/orbit-art/LetterInspection.tsx'),'utf8');
assert.equal(span(inspector,'export class LetterInspectionView','export function LetterInspection('),span(oldInspector,'export class LetterInspectionView','export function LetterInspection('),'Inspector camera/control behavior changed');
assert(fs.readFileSync(path.join(root,'src/style.css'),'utf8').startsWith(git(['show',baseline+':src/style.css'])),'Original style/art composition changed');
const report={success:true,baseline,unchangedBaselineFiles:count,checks:['All non-allowlisted baseline files byte-identical, including Quran, masks, artwork, geometry/material builders, XR, Harf, dependencies and favicon','Original letter textures; orbital scene except provider boundary; all XR/SceneRig/Reset camera/TracePanel code unchanged','Native inspector camera/control class and original CSS unchanged']};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
