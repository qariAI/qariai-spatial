const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {buildSync}=require('esbuild'),THREE=require('three'),{OrbitControls}=require('three-stdlib');
const root=path.resolve(__dirname,'..'),out=process.argv[2];
const load=file=>{const m={exports:{}};new Function('module','exports',buildSync({entryPoints:[file],bundle:true,write:false,format:'cjs'}).outputFiles[0].text)(m,m.exports);return m.exports};
const {resetDesktopView}=load(path.join(root,'src/desktop/resetView.ts'));
const camera=new THREE.PerspectiveCamera(43,1.5,.1,1000);camera.position.set(0,98,169);
const controls=new OrbitControls(camera);controls.enableDamping=true;controls.minPolarAngle=.4;controls.maxPolarAngle=1.45;controls.update();
const expected={position:camera.position.clone(),quaternion:camera.quaternion.clone()};
const checkHome=()=>{assert(camera.position.distanceTo(expected.position)<1e-8);assert(camera.quaternion.angleTo(expected.quaternion)<1e-7);assert.equal(camera.zoom,1);assert.deepEqual(camera.up.toArray(),[0,1,0]);assert.deepEqual(controls.target.toArray(),[0,0,0]);assert.equal(controls.enableDamping,true)};
const start=()=>{};controls.addEventListener('start',start);const listeners=controls._listeners.start;
for(let i=0;i<25;i++){
 controls.target.set(7,-3,11);camera.position.set(-25,39,79);camera.zoom=1.8;camera.updateProjectionMatrix();
 controls.setAzimuthalAngle(1.4);controls.setPolarAngle(.9); // Leave real controls damping pending.
 resetDesktopView(camera,controls);checkHome();
 for(let frame=0;frame<20;frame++)controls.update();checkHome();
 assert.equal(controls._listeners.start,listeners);assert.equal(listeners.length,1);
}
controls.enabled=false;resetDesktopView(camera,controls);assert.equal(controls.enabled,false,'do not steal inspector control ownership');
const noControls=new THREE.PerspectiveCamera(43,1.5,.1,1000);resetDesktopView(noControls,undefined);assert(noControls.position.distanceTo(expected.position)<1e-8);
const throwing={target:new THREE.Vector3(),enableDamping:true,reset(){throw Error('fixture')},update(){}};
assert.throws(()=>resetDesktopView(camera,throwing),/fixture/);assert.equal(throwing.enableDamping,true);

// Run the actual production camera hook with deterministic hook bookkeeping.
// No geometry fixture, synthetic XR session or headset performance claim.
const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
assert(!/<SceneRig\s+key=/.test(app),'SceneRig must stay mounted');
const snippet=app.slice(app.indexOf('function CameraExploreRig('),app.indexOf('function SceneRig('));
const code=buildSync({stdin:{contents:"import{useMemo,useRef,useEffect}from'react';import{useFrame,useThree}from'@react-three/fiber';import*as THREE from'three';import{resetDesktopView,type ResetViewControls}from'./src/desktop/resetView';const Y=-9;"+snippet+';export{CameraExploreRig}',loader:'tsx',resolveDir:root},bundle:true,write:false,format:'cjs',external:['react','@react-three/fiber','three']}).outputFiles[0].text;
let slot=0,frame;const slots=[],pending=[];const gl={xr:{isPresenting:false}};
controls.enabled=true;
const hooks={useRef(value){const i=slot++;return slots[i]??(slots[i]={current:value})},useMemo(fn,deps){const i=slot++;return(slots[i]??(slots[i]={value:fn(),deps})).value},useEffect(fn,deps){const i=slot++,prior=slots[i];if(!prior||deps.some((v,j)=>v!==prior.deps[j]))pending.push(()=>{prior?.cleanup?.();slots[i]={deps,cleanup:fn()}})}};
const m={exports:{}};new Function('require','module','exports',code)(id=>id==='react'?hooks:id==='@react-three/fiber'?{useThree:()=>({camera,controls,gl}),useFrame:fn=>{frame=fn}}:require(id),m,m.exports);
function render(active,resetRevision){slot=0;m.exports.CameraExploreRig({active,resetRevision});pending.splice(0).forEach(fn=>fn())}
render(false,0);const hookedListeners=controls._listeners.start.length;
render(true,0);for(let i=0;i<40;i++)frame({},.05);assert(camera.position.distanceTo(expected.position)>20);
render(false,1);for(let i=0;i<40;i++)frame({},.05);checkHome(); // No stale Explore->homeTarget(0,6,0) tween.
for(let revision=2;revision<22;revision++){render(false,revision);frame({},.05);checkHome();assert.equal(controls._listeners.start.length,hookedListeners)}
gl.xr.isPresenting=true;camera.position.set(2,3,4);const xrPosition=camera.position.clone(),xrTarget=controls.target.clone();
render(false,22);frame({},.05);assert(camera.position.equals(xrPosition));assert(controls.target.equals(xrTarget));
gl.xr.isPresenting=false;render(false,22);frame({},.05);assert(camera.position.equals(xrPosition),'do not defer a desktop reset into XR exit');
for(const value of slots)value?.cleanup?.();assert.equal(controls._listeners.start.length,1,'camera hook listener cleaned on unmount');
controls.dispose();
const report={success:true,checks:['25 real OrbitControls resets with pending damping and post-reset stability','authored camera position/orientation/zoom/target','control and listener identity retained','disabled inspector controls preserved','damping restored on failure','real camera hook cancels Explore tween','20 hook resets without listener accumulation','XR guard leaves camera and target untouched and does not defer reset','unmount cleanup'],limits:'Real Three controls plus deterministic production-hook logic; not Windows or physical XR execution'};
if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report,null,2));
