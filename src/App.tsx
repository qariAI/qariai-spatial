import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Billboard, OrbitControls } from '@react-three/drei';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import * as THREE from 'three';
import { SpatialMenu, SpatialMenuHandle } from './xr/SpatialMenu';
import { OrbitPinch } from './xr/OrbitPinch';
import { OrbitPracticeLink } from './integration/OrbitPracticeLink';
import { CalligraphyDepthArt } from './CalligraphyDepthArt';

type Phase = 0 | 1;
type Letter = 'ك' | 'ل' | 'ف' | 'ي';
type Selection = number | null;
type PlanetName = 'Mercury' | 'Venus' | 'Earth' | 'Mars' | 'Jupiter' | 'Saturn';
interface PlanetSpec { name:PlanetName; distance:number; radius:number; speed:number; hue:string; initial:number }
interface OrbitProps { phase:Phase; speed:number; paused:boolean; selected:Selection; onSelect:(i:number)=>void; handTarget:number|null; exploringPlanet:PlanetName|null; onExplorePlanet:(planet:PlanetName)=>void }
const LETTERS = ['ك','ل','ف','ي','ف','ل','ك'] as const;
const PLANETS: PlanetSpec[] = [
  {name:'Mercury',distance:13,radius:1.0,speed:.38,hue:'#beb1a5',initial:2.2},
  {name:'Venus',distance:19,radius:1.65,speed:.30,hue:'#e0be8c',initial:4.3},
  {name:'Earth',distance:27,radius:2.0,speed:.23,hue:'#3974d8',initial:2.8},
  {name:'Mars',distance:36,radius:1.45,speed:.17,hue:'#c97459',initial:.9},
  {name:'Jupiter',distance:49,radius:4.0,speed:.11,hue:'#dcc1a0',initial:5.1},
  {name:'Saturn',distance:65,radius:3.75,speed:.075,hue:'#ddc58f',initial:4.0},
];
const Y=-9;
const ORBIT_X=81;
const ORBIT_Z=60;

function makeGlowTexture():THREE.CanvasTexture {
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d')!;
 const grd=ctx.createRadialGradient(64,64,1,64,64,64);
 grd.addColorStop(0,'rgba(255,251,221,1)');grd.addColorStop(.13,'rgba(255,214,134,.7)');grd.addColorStop(.42,'rgba(245,164,62,.13)');grd.addColorStop(1,'rgba(240,160,50,0)');
 ctx.fillStyle=grd;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}
function arabicTexture(letter:string):THREE.CanvasTexture {
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,256,256);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 174px Amiri, serif';
 ctx.shadowColor='#ffb957';ctx.shadowBlur=25;ctx.fillStyle='#fff0b5';ctx.fillText(letter,128,132);
 ctx.shadowBlur=0;ctx.lineWidth=1.4;ctx.strokeStyle='rgba(255,251,214,.85)';ctx.strokeText(letter,128,132);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function useLoadedArabicFont(){const [ready,setReady]=useState(false);useEffect(()=>{let mounted=true;const done=()=>{if(mounted)setReady(true)};document.fonts.load('700 100px Amiri').then(done).catch(done);return()=>{mounted=false}},[]);return ready}
function Stars({count,radius,opacity,size,seed}:{count:number;radius:number;opacity:number;size:number;seed:number}){
 const points=useRef<THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>>(null);
 const worldScale=useMemo(()=>new THREE.Vector3(),[]);
 const geometry=useMemo(()=>{let x=seed>>>0;const rand=()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296};const arr=new Float32Array(count*3);for(let i=0;i<count;i++){const theta=rand()*Math.PI*2,u=rand()*2-1,r=radius*(.48+rand()*.52),h=Math.sqrt(1-u*u);arr[i*3]=r*h*Math.cos(theta);arr[i*3+1]=r*u*.7;arr[i*3+2]=r*h*Math.sin(theta)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));return g},[count,radius,seed]);useEffect(()=>()=>geometry.dispose(),[geometry]);const {gl}=useThree();useFrame(()=>{geometry.setDrawRange(0,gl.xr.isPresenting?Math.min(count,Math.ceil(count*.42)):count);
 // Points attenuation scales positions, but not sprite size: match the installation in XR.
 if(points.current){points.current.getWorldScale(worldScale);points.current.material.size=size*(gl.xr.isPresenting?Math.max(worldScale.x,worldScale.y,worldScale.z):1)}
 });return <points ref={points} geometry={geometry}><pointsMaterial size={size} color="#c8d9eb" opacity={opacity} transparent depthWrite={false} sizeAttenuation /></points>
}
function OrbitLine({radius,opacity=.22,color='#d6ad67'}:{radius:number;opacity?:number;color?:string}){
 const geometry=useMemo(()=>{const pts=Array.from({length:257},(_,i)=>{const a=i/256*Math.PI*2;return new THREE.Vector3(Math.cos(a)*radius,Y,Math.sin(a)*radius*.74)});return new THREE.BufferGeometry().setFromPoints(pts)},[radius]);useEffect(()=>()=>geometry.dispose(),[geometry]);return <lineLoop geometry={geometry}><lineBasicMaterial color={color} transparent opacity={opacity} /></lineLoop>
}
function LivingRing(){const geometry=useMemo(()=>{const p=Array.from({length:321},(_,i)=>{const a=i/320*Math.PI*2;return new THREE.Vector3(Math.cos(a)*ORBIT_X,Y+1,Math.sin(a)*ORBIT_Z)});return new THREE.BufferGeometry().setFromPoints(p)},[]);useEffect(()=>()=>geometry.dispose(),[geometry]);return <><lineLoop geometry={geometry}><lineBasicMaterial color="#e9bd73" opacity={.7} transparent /></lineLoop><lineLoop geometry={geometry} position={[0,.3,0]}><lineBasicMaterial color="#b88942" opacity={.3} transparent /></lineLoop></>}
function Sun(){const glow=useMemo(makeGlowTexture,[]);useEffect(()=>()=>glow.dispose(),[glow]);return <group position={[0,Y,0]}><mesh><sphereGeometry args={[6,48,32]}/><meshBasicMaterial color="#ffedb7" /></mesh><sprite scale={[40,40,1]}><spriteMaterial map={glow} blending={THREE.AdditiveBlending} transparent depthWrite={false}/></sprite><pointLight color="#ffd28d" intensity={160} distance={160} decay={2}/></group>}
function PlanetTexture({kind}:{kind:'earth'|'jupiter'}){
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d')!;let seed=17;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};if(kind==='jupiter'){for(let y=0;y<256;y++){const bands=['#b38668','#e5cdb0','#bfa28b','#e7d2b4','#a87e68'];c.fillStyle=bands[Math.floor(y/14+Math.sin(y*.06))%bands.length];c.fillRect(0,y,512,1)}c.fillStyle='#bc8265';c.beginPath();c.ellipse(380,145,44,19,-.1,0,Math.PI*2);c.fill()}else{c.fillStyle='#0e5aa0';c.fillRect(0,0,512,256);for(let i=0;i<90;i++){c.fillStyle=i%3===0?'#b6a36f':'#63865c';c.beginPath();c.ellipse(rand()*512,rand()*256,9+rand()*29,4+rand()*12,rand()*3,0,Math.PI*2);c.fill()}for(let i=0;i<50;i++){c.fillStyle='rgba(248,247,241,.45)';c.beginPath();c.ellipse(rand()*512,rand()*256,8+rand()*32,2+rand()*5,0,0,Math.PI*2);c.fill()}}const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t},[kind]);useEffect(()=>()=>texture.dispose(),[texture]);return texture
}
function Planet({planet,paused,speed,active,onExplore}:{planet:PlanetSpec;paused:boolean;speed:number;active:boolean;onExplore:(planet:PlanetName)=>void}){
 const ref=useRef<THREE.Group>(null);const moon=useRef<THREE.Mesh>(null);const phase=useRef(planet.initial);const earth=PlanetTexture({kind:'earth'});const jupiter=PlanetTexture({kind:'jupiter'});
 useFrame((_,dt)=>{if(!paused)phase.current+=Math.min(dt,.05)*planet.speed*speed;const a=phase.current;if(ref.current)ref.current.position.set(Math.cos(a)*planet.distance,Y,Math.sin(a)*planet.distance*.74);if(moon.current)moon.current.position.set(3.7*Math.cos(a*9),.25,3.7*Math.sin(a*9))});
 const material=planet.name==='Earth'?<meshStandardMaterial map={earth} roughness={.9}/>:planet.name==='Jupiter'?<meshStandardMaterial map={jupiter} roughness={.88}/>:<meshStandardMaterial color={planet.hue} roughness={.87}/>;
 return <group ref={ref} name={'qari-planet-'+planet.name}><mesh onClick={e=>{e.stopPropagation();onExplore(planet.name)}}><sphereGeometry args={[planet.radius,32,24]}/>{material}</mesh>{active&&<mesh raycast={()=>null}><sphereGeometry args={[planet.radius*1.22,24,16]}/><meshBasicMaterial color="#ffe2a2" wireframe transparent opacity={.20} depthWrite={false}/></mesh>}{planet.name==='Earth'&&<mesh ref={moon}><sphereGeometry args={[.4,12,12]}/><meshStandardMaterial color="#c4c3bb"/></mesh>}{planet.name==='Saturn'&&<group rotation={[.72,.22,.15]}><mesh><ringGeometry args={[planet.radius*1.25,planet.radius*1.94,96]}/><meshStandardMaterial color="#bda681" side={THREE.DoubleSide} transparent opacity={.65} roughness={1} depthWrite={false}/></mesh><mesh><ringGeometry args={[planet.radius*1.55,planet.radius*1.78,96]}/><meshBasicMaterial color="#ead29f" side={THREE.DoubleSide} transparent opacity={.55} depthWrite={false}/></mesh></group>}</group>
}
function Belt(){
 const points=useRef<THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>>(null);
 const worldScale=useMemo(()=>new THREE.Vector3(),[]);
 const geometry=useMemo(()=>{const points=new Float32Array(1800*3);let seed=55;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};for(let i=0;i<1800;i++){const a=rand()*Math.PI*2,r=41+rand()*5;points[i*3]=r*Math.cos(a);points[i*3+1]=Y+(rand()-.5);points[i*3+2]=r*.74*Math.sin(a)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(points,3));return g},[]);useEffect(()=>()=>geometry.dispose(),[geometry]);const {gl}=useThree();useFrame(()=>{geometry.setDrawRange(0,gl.xr.isPresenting?900:1800);
 if(points.current){points.current.getWorldScale(worldScale);points.current.material.size=.3*(gl.xr.isPresenting?Math.max(worldScale.x,worldScale.y,worldScale.z):1)}
 });return <points ref={points} geometry={geometry}><pointsMaterial color="#bb9b79" size={.3} transparent opacity={.55}/></points>}
function LetterObject({letter,index,phase,paused,speed,selected,handTarget,onSelect}:{letter:string;index:number;phase:Phase;paused:boolean;speed:number;selected:Selection;handTarget:number|null;onSelect:(index:number)=>void}){
 const group=useRef<THREE.Group>(null);const angle=useRef(-Math.PI/2+index*Math.PI*2/7);const texture=useMemo(()=>arabicTexture(letter),[letter]);useEffect(()=>()=>texture.dispose(),[texture]);
 const active=selected===index||selected===6-index||handTarget===index||handTarget===6-index;
 useFrame((_,dt)=>{if(!group.current)return;if(phase===1){if(!paused)angle.current+=Math.min(dt,.04)*.22*speed}else angle.current=THREE.MathUtils.damp(angle.current,-Math.PI/2+index*Math.PI*2/7,3,dt);const a=angle.current;const x=ORBIT_X*Math.cos(a),z=ORBIT_Z*Math.sin(a);group.current.position.set(x,Y+2+Math.sin(a*2)*.6,z);const target=active?1.32:1;const scale=THREE.MathUtils.damp(group.current.scale.x,target,5,dt);group.current.scale.setScalar(scale)});
 const select=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onSelect(index)};
 return <group ref={group} name={`qari-letter-${index}`}><Billboard follow lockX={false} lockY={false} lockZ={false}><mesh onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}} onClick={select}><planeGeometry args={[14,14]}/><meshBasicMaterial map={texture} transparent opacity={active?1:.89} depthWrite={false} side={THREE.DoubleSide} /></mesh><mesh onClick={select}><planeGeometry args={[10,10]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh><sprite scale={[active?21:16,active?21:16,1]}><spriteMaterial map={texture} transparent opacity={active?.33:.11} blending={THREE.AdditiveBlending} depthWrite={false}/></sprite></Billboard></group>
}
function OrbitalScene(props:OrbitProps){return <><color attach="background" args={['#010611']}/><fog attach="fog" args={['#010611',180,650]}/><ambientLight intensity={1.1} color="#cdd9e5"/><directionalLight position={[-70,80,70]} intensity={2.4} color="#ffd28d"/><pointLight position={[-90,35,45]} intensity={20} distance={200} color="#4ac0a0"/><pointLight position={[85,40,-45]} intensity={15} distance={200} color="#5c8fff"/><Stars count={5200} radius={620} opacity={.83} size={.8} seed={184}/><Stars count={1400} radius={290} opacity={.45} size={.55} seed={603}/><Sun/><CalligraphyDepthArt paused={props.paused} speed={props.speed}/><Belt/>{PLANETS.map(p=><group key={p.name}><OrbitLine radius={p.distance}/><Planet planet={p} paused={props.paused} speed={props.speed} active={props.exploringPlanet===p.name} onExplore={props.onExplorePlanet}/></group>)}<LivingRing/>{LETTERS.map((l,i)=><LetterObject key={i} letter={l} index={i} phase={props.phase} paused={props.paused} speed={props.speed} selected={props.selected} handTarget={props.handTarget} onSelect={props.onSelect}/>)}</>}

/** Actual WebXR hand joints, not desktop emulation. For WebXR-compatible Quest browser only. */
/* World-space hit targets are resolved from the same transformed objects rendered by R3F. */
function SpatialActions({phase,onAdvance,onBack}:{phase:Phase;onAdvance:()=>void;onBack:()=>void}){
 const {gl}=useThree();const root=useRef<THREE.Group>(null);
 useFrame(()=>{if(root.current)root.current.visible=gl.xr.isPresenting});
 const label=phase===0?'BRING LETTERS INTO ORBIT':'EXPLORE LETTERS AGAIN';
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#061724';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#d9ae66';ctx.lineWidth=9;ctx.strokeRect(5,5,1014,246);ctx.fillStyle='#ffdf9b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 53px sans-serif';ctx.fillText(label,512,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t},[label]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group ref={root} visible={false} position={[0,Y+35,-42]} name="qari-spatial-controls">
   <mesh name="qari-action-primary" onClick={phase===0?onAdvance:onBack}>
    <planeGeometry args={[52,13]}/><meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent/>
   </mesh>
 </group>;
}
function HandTracking({menu,onHover,onPinch,onAction,onDiagnostics}:{menu?:SpatialMenuHandle;onHover:(i:number|null)=>void;onPinch:(i:number)=>void;onAction:()=>void;onDiagnostics:(state:string)=>void}){
 const {gl,scene}=useThree();
 const hands=useRef<THREE.Group[]>([]);
 const markers=useRef<THREE.Mesh[]>([]);
 const pinchGates=useMemo(()=>[new OrbitPinch(),new OrbitPinch()],[]);
 const lastHover=useRef<number|null>(null);
 const lastReport=useRef('');
 const cooldown=useRef([0,0]);
 const lastActionAt=useRef(0);
 const lastActionLabel=useRef('');
 useEffect(()=>{
  gl.xr.enabled=true;
  const factory=new XRHandModelFactory();
  const groups=[gl.xr.getHand(0),gl.xr.getHand(1)];
  const mesh=groups.map(hand=>{
   hand.add(factory.createHandModel(hand,'mesh'));scene.add(hand);
   const m=new THREE.Mesh(new THREE.RingGeometry(.018,.028,32),new THREE.MeshBasicMaterial({color:'#ffcf79',side:THREE.DoubleSide,transparent:true,opacity:.95,depthTest:false}));
   m.visible=false;scene.add(m);return m;
  });
  hands.current=groups;markers.current=mesh;
  const disarm=()=>{
   pinchGates.forEach(g=>g.loseTracking());
   mesh.forEach(m=>m.visible=false);
   if(lastHover.current!==null){lastHover.current=null;onHover(null)}
  };
  if(menu)menu.state.resetInput=disarm;
  const interrupt=()=>{disarm();menu?.state.interrupt()};
  let session:XRSession|null=null;
  const sessionChanged=()=>{
   interrupt();
   session?.removeEventListener('visibilitychange',interrupt);
   session=gl.xr.getSession();
   session?.addEventListener('visibilitychange',interrupt);
  };
  const handChanged=groups.map((hand,side)=>{
   const reset=()=>pinchGates[side].loseTracking();
   hand.addEventListener('connected',reset);
   hand.addEventListener('disconnected',reset);
   return reset;
  });
  gl.xr.addEventListener('sessionstart',sessionChanged);
  gl.xr.addEventListener('sessionend',sessionChanged);
  sessionChanged();
  return()=>{
   session?.removeEventListener('visibilitychange',interrupt);
   gl.xr.removeEventListener('sessionstart',sessionChanged);
   gl.xr.removeEventListener('sessionend',sessionChanged);
   interrupt();
   if(menu)menu.state.resetInput=()=>{};
   groups.forEach((h,i)=>{
    h.removeEventListener('connected',handChanged[i]);
    h.removeEventListener('disconnected',handChanged[i]);
    scene.remove(h);
   });
   mesh.forEach(m=>{scene.remove(m);m.geometry.dispose();(m.material as THREE.Material).dispose()});
  };
 },[gl,scene,pinchGates,onHover,menu]);
 useFrame((state)=>{
  if(!gl.xr.isPresenting||gl.xr.getSession()?.visibilityState!=='visible'){
   pinchGates.forEach(g=>g.loseTracking());
   markers.current.forEach(m=>m.visible=false);
   if(lastHover.current!==null){lastHover.current=null;onHover(null)}
   return;
  }
  const now=state.clock.elapsedTime;
  let hovered:number|null=null,best=Infinity,visible=0;
  let menuHover:ReturnType<SpatialMenuHandle['hit']>=null;
  scene.updateMatrixWorld(true);
  hands.current.forEach((hand,side)=>{
   const joints=(hand as THREE.Group & {joints?:Record<string,THREE.Object3D>}).joints;
   const tip=joints?.['index-finger-tip'],thumb=joints?.['thumb-tip'],wrist=joints?.['wrist'];
   const marker=markers.current[side];
   if(!hand.visible||!tip||!thumb||!wrist||!tip.visible||!thumb.visible||!wrist.visible){if(marker)marker.visible=false;pinchGates[side].loseTracking();return}
   visible++;
   const finger=new THREE.Vector3(),thumbPos=new THREE.Vector3(),wristPos=new THREE.Vector3();
   tip.getWorldPosition(finger);thumb.getWorldPosition(thumbPos);
   const pinchDistance=finger.distanceTo(thumbPos);
   const pressed=pinchGates[side].update(pinchDistance);
   const isPinching=pinchGates[side].pinching;
   if(marker){marker.visible=true;marker.position.copy(finger);marker.quaternion.copy(state.camera.quaternion);marker.scale.setScalar(isPinching?1.55:1)}
   const aim=new THREE.Vector3(0,0,-1);
   if(wrist){wrist.getWorldPosition(wristPos);aim.copy(finger).sub(wristPos).normalize()}
   const ray=new THREE.Raycaster(finger,aim,0,3);
   const menuHit=menu?.hit(ray,finger);
   if(menu&&(menuHit||menu.state.blocksScene)){
    if(menuHit)menuHover=menuHit;
    if(pressed&&now>cooldown.current[side]&&menuHit){
     if(menuHit==='harf')void menu.state.navigate(gl.xr.getSession(),location.search,path=>location.assign(path),now);
     else menu.state.dispatch(menuHit,now);
     cooldown.current[side]=now+.35;
    }
    return;
   }
   let targetIndex:number|null=null,targetAction=false,targetScore=Infinity;
   // Use actual world positions and world scale, never estimated orbit coordinates.
   for(let i=0;i<7;i++){
    const obj=scene.getObjectByName('qari-letter-'+i);if(!obj)continue;
    const pos=new THREE.Vector3();obj.getWorldPosition(pos);
    const sphereRadius=.13;const direct=pos.distanceTo(finger);
    const projected=pos.clone().sub(finger).dot(aim);
    const lateral=projected>.04&&projected<3?ray.ray.distanceToPoint(pos):Infinity;
    const score=direct<sphereRadius?direct:lateral<sphereRadius?lateral+.13:Infinity;
    if(score<targetScore){targetScore=score;targetIndex=i;targetAction=false}
   }
   const action=scene.getObjectByName('qari-action-primary');
   // True plane intersection uses the button's full geometry, not its center.
   if(action&&action.visible&&action.parent?.visible){
    const hits=ray.intersectObject(action,false);
    const direct=new THREE.Vector3();action.getWorldPosition(direct);
    const near=direct.distanceTo(finger)<.18;
    if(hits.length||near){const score=hits.length > 0 ? 0.09 : direct.distanceTo(finger);if(score<targetScore){targetScore=score;targetIndex=null;targetAction=true}}
   }
   if(targetIndex!==null&&targetScore<best){best=targetScore;hovered=targetIndex}
   if(pressed&&now>cooldown.current[side]&&targetScore<Infinity){
    if(targetAction){onAction();lastActionAt.current=now;lastActionLabel.current='spatial action activated'}
    else if(targetIndex!==null){onPinch(targetIndex);lastActionAt.current=now;lastActionLabel.current='selected '+LETTERS[targetIndex]}
    cooldown.current[side]=now+.35;
   }
  });
  if(menu){menu.state.hover=menuHover;if(menu.state.blocksScene)hovered=null}
  if(hovered!==lastHover.current){lastHover.current=hovered;onHover(hovered)}
  const report='Quest XR · tracked hands: '+visible+' · hover: '+(hovered===null?'none':LETTERS[hovered])+(now-lastActionAt.current<2.5?' · last pinch: '+lastActionLabel.current:'');
  if(report!==lastReport.current){lastReport.current=report;onDiagnostics(report)}
 });
 return null;
}
function ImmersiveButton(){const {gl}=useThree();const [available,setAvailable]=useState(false);const [inSession,setInSession]=useState(false);useEffect(()=>{let on=true;const xr=(navigator as Navigator & {xr?:{isSessionSupported:(mode:string)=>Promise<boolean>;requestSession:(mode:string,options:object)=>Promise<any>}}).xr;if(!xr)return;xr.isSessionSupported('immersive-vr').then(v=>{if(on)setAvailable(v)}).catch(()=>{});const onStart=()=>setInSession(true),onEnd=()=>setInSession(false);gl.xr.addEventListener('sessionstart',onStart);gl.xr.addEventListener('sessionend',onEnd);return()=>{on=false;gl.xr.removeEventListener('sessionstart',onStart);gl.xr.removeEventListener('sessionend',onEnd)}},[gl]);useEffect(()=>{const btn=document.getElementById('enter-xr') as HTMLButtonElement|null;if(!btn)return;btn.hidden=!available;btn.textContent=inSession?'Exit VR':'Enter Quest VR';btn.onclick=async()=>{if(btn.dataset.xrStarting==='true')return;try{if(gl.xr.isPresenting){await gl.xr.getSession()?.end();return}btn.dataset.xrStarting='true';const session=await (navigator as Navigator & {xr:{requestSession:(mode:string,options:object)=>Promise<any>}}).xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']});gl.xr.setFramebufferScaleFactor(0.85);await gl.xr.setSession(session)}catch(e){console.error('WebXR session failed',e);window.alert('Unable to enter VR. Use HTTPS in a supported Quest browser and enable hand tracking.')}finally{delete btn.dataset.xrStarting}};return()=>{btn.onclick=null}},[gl,available,inSession]);return null}
function WorldAnchor({children,menu}:{children:React.ReactNode;menu?:SpatialMenuHandle}){const {gl}=useThree();const group=useRef<THREE.Group>(null);useFrame(()=>{if(!group.current)return;if(gl.xr.isPresenting){group.current.position.set(0,1.45,-2.4).add(menu?.offset??new THREE.Vector3());group.current.scale.setScalar(.014)}else{group.current.position.set(0,15,0);group.current.scale.setScalar(1)}});return <group ref={group} name="qari-world-anchor">{children}</group>}
function CameraExploreRig({active}:{active:boolean}){
 const {camera,gl,controls}=useThree();
 const home=useMemo(()=>new THREE.Vector3(0,98,169),[]);
 // Desktop calligraphy framing: slightly wider and higher; planet transforms stay intact.
 const close=useMemo(()=>new THREE.Vector3(-4,30,84),[]);
 const homeTarget=useMemo(()=>new THREE.Vector3(0,Y+15,0),[]);
 const closeTarget=useMemo(()=>new THREE.Vector3(0,-2.7,44),[]);
 const moving=useRef(false);
 const previous=useRef(false);
 useEffect(()=>{
  const orbit=controls as unknown as {target?:THREE.Vector3;update?:()=>void;addEventListener?:(type:string, fn:()=>void)=>void;removeEventListener?:(type:string, fn:()=>void)=>void};
  if(!gl.xr.isPresenting){camera.position.copy(home);orbit?.target?.set(0,0,0);orbit?.update?.()}
  const cancel=()=>{moving.current=false};
  orbit?.addEventListener?.("start",cancel);
  return()=>orbit?.removeEventListener?.("start",cancel);
 },[camera,controls,gl,home]);
 useFrame((_,dt)=>{
  if(gl.xr.isPresenting){moving.current=false;previous.current=active;return}
  if(previous.current!==active){previous.current=active;moving.current=true}
  if(!moving.current)return;
  const destination=active?close:home;
  const target=active?closeTarget:homeTarget;
  camera.position.lerp(destination,1-Math.exp(-Math.min(dt,.05)*2.7));
  const orbit=controls as {target?:THREE.Vector3;update?:()=>void}|undefined;
  if(orbit?.target){orbit.target.lerp(target,1-Math.exp(-Math.min(dt,.05)*2.7));orbit.update?.()}
  else camera.lookAt(target);
  if(camera.position.distanceTo(destination)<.06){camera.position.copy(destination);orbit?.target?.copy(target);orbit?.update?.();moving.current=false}
 });
 return null;
}
function SceneRig({phase,speed,paused,onPaused,selected,onSelect,handTarget,onHover,onAdvance,onBack,onDiagnostics,exploringPlanet,onExplorePlanet,exploreCalligraphy}:{phase:Phase;speed:number;paused:boolean;onPaused:(v:boolean)=>void;selected:Selection;onSelect:(i:number)=>void;handTarget:number|null;onHover:(i:number|null)=>void;onAdvance:()=>void;onBack:()=>void;onDiagnostics:(s:string)=>void;exploringPlanet:PlanetName|null;onExplorePlanet:(p:PlanetName)=>void;exploreCalligraphy:boolean}){
 const pauseRef=useRef(paused);pauseRef.current=paused;
 const menu=useMemo(()=>new SpatialMenuHandle(()=>pauseRef.current,onPaused),[onPaused]);
 return <><SpatialMenu menu={menu}/><WorldAnchor menu={menu}><OrbitalScene exploringPlanet={exploringPlanet} onExplorePlanet={onExplorePlanet} phase={phase} speed={speed} paused={paused} selected={selected} onSelect={onSelect} handTarget={handTarget}/><SpatialActions phase={phase} onAdvance={onAdvance} onBack={onBack}/></WorldAnchor><HandTracking menu={menu} onHover={onHover} onPinch={onSelect} onAction={phase===0?onAdvance:onBack} onDiagnostics={onDiagnostics}/><ImmersiveButton/><OrbitPracticeLink/><CameraExploreRig active={exploreCalligraphy}/><OrbitControls makeDefault enableDamping dampingFactor={.06} minDistance={18} maxDistance={255} maxPolarAngle={1.45} minPolarAngle={.4} enablePan={false}/></>}

const traceGuides:Record<Letter,{name:string;instruction:string}>= {
 'ك':{name:'Kāf',instruction:'Illustrative study guide. Verify the source stroke order before educational use.'},
 'ل':{name:'Lām',instruction:'Illustrative study guide. Verify the source stroke order before educational use.'},
 'ف':{name:'Fāʼ',instruction:'Trace the curved body, then place the dot above. Illustrative geometry.'},
 'ي':{name:'Yāʼ',instruction:'Illustrative study guide. Verify the source stroke order before educational use.'},
};
function TracePanel({letter,onClose}:{letter:Letter;onClose:()=>void}){const [strokes,setStrokes]=useState<{x:number;y:number}[]>([]);const drawing=useRef(false);const svg=useRef<SVGSVGElement>(null);const guide=traceGuides[letter];const loc=(e:React.PointerEvent<SVGSVGElement>)=>{const r=svg.current!.getBoundingClientRect();return {x:(e.clientX-r.left)*320/r.width,y:(e.clientY-r.top)*280/r.height}};const move=(e:React.PointerEvent<SVGSVGElement>)=>{if(drawing.current)setStrokes(v=>[...v,loc(e)])};return <aside className="trace-panel"><header><div><small>HARF WRITER · SPATIAL STUDY</small><h2>Trace {guide.name} · <span lang="ar">{letter}</span></h2></div><button aria-label="Close tracing" onClick={onClose}>✕</button></header><p>{guide.instruction}</p><svg ref={svg} viewBox="0 0 320 280" onPointerDown={e=>{drawing.current=true;e.currentTarget.setPointerCapture(e.pointerId);setStrokes([loc(e)])}} onPointerMove={move} onPointerUp={()=>drawing.current=false} onPointerCancel={()=>drawing.current=false}><rect width="320" height="280" rx="20" fill="transparent"/><text x="160" y="178" textAnchor="middle" fontFamily="Amiri,serif" fontWeight="bold" fontSize="190" fill="#e2c58b" opacity=".17">{letter}</text>{strokes.length>1&&<polyline points={strokes.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#ffd183" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>}</svg><div className="trace-actions"><button onClick={()=>setStrokes([])}>↺ Try again</button><button onClick={onClose}>Return to orbit →</button></div><small className="trace-disclaimer">Free tracing prototype: not stroke-order graded. Import original verified Android Harf Writer geometry for teaching accuracy.</small></aside>}
export default function App(){const fontReady=useLoadedArabicFont();const [phase,setPhase]=useState<Phase>(0);const [selected,setSelected]=useState<Selection>(null);const [handTarget,setHandTarget]=useState<number|null>(null);const [trace,setTrace]=useState<Letter|null>(null);const [paused,setPaused]=useState(false);const [speed,setSpeed]=useState(1);const [handMode,setHandMode]=useState(false);const [cursor,setCursor]=useState({x:-100,y:-100});const [resetKey,setResetKey]=useState(0);const [xrDiagnostics,setXrDiagnostics]=useState("Quest XR · awaiting headset");const [exploringPlanet,setExploringPlanet]=useState<PlanetName|null>(null);const [exploreCalligraphy,setExploreCalligraphy]=useState(false);
 const select=useCallback((i:number)=>setSelected(i),[]);
 const closeTrace=()=>setTrace(null);
 // Accessible desktop shortcuts; do not capture keys while typing in controls.
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   const element=e.target as HTMLElement|null;
   if(element?.closest('input,textarea,select,[contenteditable="true"]'))return;
   if(e.key==='Escape'){setTrace(null);return}
   if(e.key===' '){e.preventDefault();setPaused(v=>!v);return}
   if(e.key==='ArrowRight'){setPhase(1);return}
   if(e.key==='ArrowLeft'){setPhase(0);setSelected(null);return}
   if(/^[1-7]$/.test(e.key)){setPhase(0);setSelected(Number(e.key)-1)}
  };
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[]);
const exploreNext=()=>setExploringPlanet(current=>current===null?PLANETS[0].name:PLANETS[(PLANETS.findIndex(p=>p.name===current)+1)%PLANETS.length].name);const selectedLetter=selected===null?null:LETTERS[selected];const mirror=selected===null?null:LETTERS[6-selected];const caption=selectedLetter?(selected===3?'ي is the center of the mirrored sequence.':`Mirrored pair: ${selectedLetter} ↔ ${mirror}`):'Select a letter to illuminate its mirror.';
 return <main className="app" onPointerMove={e=>{if(handMode)setCursor({x:e.clientX,y:e.clientY})}}><div className="canvas"><Canvas camera={{position:[0,98,169],fov:43,near:.1,far:1000}} dpr={[1,1.7]} gl={{antialias:true,alpha:false}}><Suspense fallback={null}>{fontReady&&<SceneRig key={resetKey} phase={phase} speed={speed} paused={paused||trace!==null} onPaused={setPaused} selected={selected} onSelect={select} handTarget={handTarget} onHover={setHandTarget} onAdvance={()=>setPhase(1)} onBack={()=>{setPhase(0);setSelected(null)}} onDiagnostics={setXrDiagnostics} exploringPlanet={exploringPlanet} onExplorePlanet={setExploringPlanet} exploreCalligraphy={exploreCalligraphy}/>}</Suspense></Canvas></div><div className="vignette"/><header className="top"><div><strong>QARI<span>AI</span> / SPATIAL</strong><small>THE LIVING ORBIT · REACT / WEBXR</small></div><div className="orbit-links"><div className="top-tag">✧ The letters lead · The universe responds</div><a id="practice-calligraphy" className="practice-link" href="/harf-studio-xr.html">✎ Practice Calligraphy / Harf Studio</a></div></header><section className="stage-ui" aria-live="polite"><div className="step">✧ {phase===0?'MIRRORED LETTERS':'THE LIVING ORBIT'} &nbsp; {phase===0?'01':'02'} / 02</div><p>{exploringPlanet?`Exploring ${exploringPlanet} · Click a planet or select Next planet to discover another.`:phase===0?caption:'The letters awaken — a continuous, luminous celestial dance.'}</p><div className="primary-actions">{phase===0?<><button className="gold" onClick={()=>setPhase(1)}>◎ Bring the letters into orbit →</button>{selectedLetter&&<button onClick={()=>setTrace(selectedLetter)}>✎ Trace {selectedLetter} →</button>}</>:<><button className="gold" onClick={()=>{setPhase(0);setSelected(null)}}>↺ Explore letters again</button></>}</div></section><nav className="tools" aria-label="Scene controls"><button onClick={()=>{setExploreCalligraphy(false);setExploringPlanet(null);setResetKey(n=>n+1)}}>↺ Reset view</button><button onClick={()=>setExploreCalligraphy(v=>!v)}>{exploreCalligraphy?"↩ Return to Orbit":"✧ Explore Calligraphy"}</button><button onClick={exploreNext}>{exploringPlanet?`◎ ${exploringPlanet} · Next planet`:"◎ Explore planets"}</button><button onClick={()=>setPaused(v=>!v)}>{paused?'▶ Resume motion':'Ⅱ Pause motion'}</button><button onClick={()=>setSpeed(v=>v===1?2:v===2?.5:1)}>{speed}× Speed</button><button aria-pressed={handMode} onClick={()=>setHandMode(v=>!v)}>{handMode?'◉ Hand Mode On':'◎ Hand Mode'}</button><button id="enter-xr" hidden>Enter Quest VR</button></nav>{handMode&&<><div className="hand-hint">Desktop hand simulation · click a letter · keys 1–7 select · Space pauses · Esc closes</div><div className="finger" style={{left:cursor.x,top:cursor.y}} /></>}{trace&&<><div className="trace-shade" onClick={closeTrace}/><TracePanel key={trace} letter={trace} onClose={closeTrace}/></>}<div className="xr-diagnostics" aria-live="off">{xrDiagnostics}</div><div className="build-note">Quest hand tracking requires HTTPS, a supported headset browser, and enabled hand input. Desktop mode is mouse simulation.</div></main>
}
