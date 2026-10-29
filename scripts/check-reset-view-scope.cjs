const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base='454c2f0e552583458ca02f23915a74987537a915';
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const old=git(['show',base+':src/App.tsx']);let source=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
source=source.replace("\nimport {resetDesktopView,type ResetViewControls} from './desktop/resetView';",'')
 .replace('function CameraExploreRig({active,resetRevision}:{active:boolean;resetRevision:number}){','function CameraExploreRig({active}:{active:boolean}){')
 .replace(' const handledReset=useRef(resetRevision);\n','')
 .replace(` useEffect(()=>{
  if(handledReset.current===resetRevision)return;
  handledReset.current=resetRevision;
  if(gl.xr.isPresenting)return;
  moving.current=false;previous.current=active;
  resetDesktopView(camera,(controls??undefined) as ResetViewControls|undefined);
 },[active,camera,controls,gl,resetRevision]);
`,'')
 .replace('exploringPlanet,onExplorePlanet,exploreCalligraphy,resetRevision}:{phase:','exploringPlanet,onExplorePlanet,exploreCalligraphy}:{phase:')
 .replace('onExplorePlanet:(p:PlanetName)=>void;exploreCalligraphy:boolean;resetRevision:number}){','onExplorePlanet:(p:PlanetName)=>void;exploreCalligraphy:boolean}){')
 .replace('<CameraExploreRig active={exploreCalligraphy} resetRevision={resetRevision}/>','<CameraExploreRig active={exploreCalligraphy}/>')
 .replace('[resetRevision,setResetRevision]','[resetKey,setResetKey]')
 .replace('<SceneRig resetRevision={resetRevision}','<SceneRig key={resetKey}')
 .replace('setResetRevision(n=>n+1)','setResetKey(n=>n+1)');
assert.equal(source,old,'App may change only reset revision propagation and its guarded desktop effect');
let count=0;
for(const entry of git(['ls-tree','-r','-z',base]).split('\0').filter(Boolean)){
 const match=entry.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);if(!match)continue;
 const [,sha,file]=match;if(file==='src/App.tsx')continue;
 const bytes=fs.readFileSync(path.join(root,file));const hash=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 assert.equal(hash,sha,'Protected baseline file changed: '+file);count++;
}
const report={success:true,baseline:base,unchangedBaselineFiles:count,
 app:'Exact equality after removing only reset propagation/effect delta',
 preserved:'All other baseline files including artwork, Qur’anic content/masks/bakers, sculpture assets, Harf/validators/routes, XR lighting/gestures/menu/session code, CSS, dependencies/config and favicon'};
const out=process.argv[2];if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report,null,2));
