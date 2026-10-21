import {useEffect,useRef,type RefObject} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

type SceneControls={enabled:boolean;target?:THREE.Vector3};

// Assets are installed by a provider effect after the initial scene commit.
// The named letter can therefore exist while its sculpture is still absent.
export function findInspectionSculpture(scene:THREE.Scene,index:number){
 let sculpture:THREE.Object3D|undefined;
 scene.getObjectByName('qari-letter-'+index)?.traverse(o=>{if(o.userData.orbitArt)sculpture=o});
 return sculpture;
}

// A second camera, not a second scene, renderer, asset bake or WebGL context.
export class LetterInspectionView {
 readonly camera:THREE.PerspectiveCamera;
 readonly controls:OrbitControls;
 private position:THREE.Vector3;
 private quaternion:THREE.Quaternion;
 private target?:THREE.Vector3;
 private enabled?:boolean;
 constructor(readonly scene:THREE.Scene,readonly original:THREE.Camera,private originalControls:SceneControls|undefined,surface:HTMLElement,index:number,aspect:number){
  const sculpture=findInspectionSculpture(scene,index);
  if(!sculpture)throw Error('This sculptural letter is still loading. Return to Orbit and try again.');
  scene.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(sculpture),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const radius=size.length()/2;
  if(!Number.isFinite(radius)||radius<=0)throw Error('Letter bounds are unavailable. Return to Orbit and try again.');
  this.position=original.position.clone();this.quaternion=original.quaternion.clone();
  this.target=originalControls?.target?.clone();this.enabled=originalControls?.enabled;
  const orientation=sculpture.getWorldQuaternion(new THREE.Quaternion());
  this.camera=new THREE.PerspectiveCamera(40,aspect,.01,2000);
  this.camera.up.set(0,1,0).applyQuaternion(orientation);
  const distance=radius/Math.sin(THREE.MathUtils.degToRad(20))*1.35/Math.min(1,aspect);
  this.camera.position.copy(center).add(new THREE.Vector3(.35,.12,1).normalize().applyQuaternion(orientation).multiplyScalar(distance));
  this.controls=new OrbitControls(this.camera,surface);
  this.controls.target.copy(center);this.controls.enablePan=false;this.controls.enableDamping=true;this.controls.dampingFactor=.08;
  this.controls.minDistance=radius*1.1;this.controls.maxDistance=distance*2.5;this.controls.autoRotate=false;
  this.controls.update();this.controls.saveState();
  if(originalControls)originalControls.enabled=false;
 }
 restoreOriginal(){this.original.position.copy(this.position);this.original.quaternion.copy(this.quaternion);if(this.target&&this.originalControls?.target)this.originalControls.target.copy(this.target);this.original.updateMatrixWorld();}
 render(renderer:THREE.WebGLRenderer,aspect:number){
  // Existing desktop camera callbacks may still run; hold their view for exact return.
  this.restoreOriginal();
  if(this.camera.aspect!==aspect){this.camera.aspect=aspect;this.camera.updateProjectionMatrix()}
  this.controls.update();renderer.render(this.scene,this.camera);
 }
 reset(){const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.reset();this.controls.enableDamping=damping;}
 dispose(){this.controls.dispose();this.restoreOriginal();if(this.originalControls&&this.enabled!==undefined)this.originalControls.enabled=this.enabled;}
}

export function LetterInspection({index,surface,onClose,onReady}:{index:number;surface:RefObject<HTMLDivElement>;onClose:()=>void;onReady:(reset:(()=>void)|null,error?:string)=>void}){
 const {scene,camera,gl,controls}=useThree();const view=useRef<LetterInspectionView|null>(null);
 const pending=useRef(false),started=useRef(0),slowNotice=useRef(false);
 useEffect(()=>{
  if(gl.xr.isPresenting){onClose();return}
  pending.current=true;started.current=performance.now();slowNotice.current=false;
  onReady(null,'Loading the sculptural letter. Inspection will open automatically.');
  gl.xr.addEventListener('sessionstart',onClose);
  return()=>{pending.current=false;gl.xr.removeEventListener('sessionstart',onClose);view.current?.dispose();view.current=null;};
 },[scene,camera,gl,controls,index,surface,onClose,onReady]);
 // Bind after the asset provider's later React commit, with the original scene
 // transforms updated by their normal frame callbacks. No asset copies/rebakes.
 useFrame(state=>{
  if(!gl.xr.isPresenting&&pending.current){
   if(surface.current&&findInspectionSculpture(scene,index)){
    pending.current=false;
    try{view.current=new LetterInspectionView(scene,camera,(controls??undefined) as unknown as SceneControls|undefined,surface.current,index,state.size.width/state.size.height);onReady(()=>view.current?.reset());}
    catch(error){onReady(null,error instanceof Error?error.message:String(error))}
   }else if(!slowNotice.current&&performance.now()-started.current>30000){
    slowNotice.current=true;onReady(null,'This letter is taking longer to load. It will open automatically when ready. You can return to Orbit at any time.');
   }
  }
  if(gl.xr.isPresenting||!view.current)gl.render(scene,camera);else view.current.render(gl,state.size.width/state.size.height);
 },1);
 return null;
}

export function LetterInspectionOverlay({letter,surface,onClose,onReset,error}:{letter:string;surface:RefObject<HTMLDivElement>;onClose:()=>void;onReset:()=>void;error:string}){
 const close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;close.current?.focus();return()=>previous?.focus()},[]);
 return <div className="letter-inspection" role="dialog" aria-modal="true" aria-labelledby="inspection-title" onKeyDown={event=>{
  event.stopPropagation();
  if(event.key==='Escape'){event.preventDefault();onClose()}
  if(event.key==='Tab'){
   const buttons=event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');const first=buttons[0],last=buttons[buttons.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
 }}><div ref={surface} className="inspection-drag" aria-hidden="true"/><header><div><small>LETTER INSPECTION</small><h2 id="inspection-title">{letter} <span>· Original Amiri sculpture</span></h2></div><button ref={close} onClick={onClose}>Return to Orbit</button></header><div className="inspection-tools"><p role="status">{error||'Drag to orbit the letter · Scroll to zoom · Escape to return'}</p><button disabled={!!error} onClick={onReset}>Reset inspection</button></div></div>;
}
