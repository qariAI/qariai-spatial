import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {SpatialMenuState,type MenuAction} from './SpatialMenuState';
export {SpatialMenuState};
const W=.56,H=.68;
export const MENU_ROWS:[MenuAction,number][]=[['pause',.205],['inspect',.09],['harf',-.025],['close',-.20]];
const INSPECT_ROWS:[MenuAction,number][]=[['nearer',.205],['farther',.09],['return',-.025],['close',-.20]];
export class SpatialMenuHandle {
  state:SpatialMenuState;
  panel:THREE.Mesh|null=null;
  launcher:THREE.Mesh|null=null;
  direction=new THREE.Vector3(0,0,1);
  offset=new THREE.Vector3();
  private local=new THREE.Vector3();
  private eye=new THREE.Vector3();
  private lastInspection=false;
  constructor(getPaused:()=>boolean,setPaused:(v:boolean)=>void){this.state=new SpatialMenuState(getPaused,setPaused)}
  hit(ray:THREE.Raycaster,finger:THREE.Vector3):MenuAction|null{
    const s=this.state,mesh=s.open?this.panel:this.launcher;if(!mesh||s.busy)return null;
    for(let node:THREE.Object3D|null=mesh;node;node=node.parent)if(!node.visible)return null;
    const hit=ray.intersectObject(mesh,false)[0];
    this.local.copy(finger);mesh.worldToLocal(this.local);
    const near=Math.abs(this.local.z)<.055;
    const x=hit?.uv?(hit.uv.x-.5)*(s.open?W:.24):this.local.x;
    const y=hit?.uv?(hit.uv.y-.5)*(s.open?H:.075):this.local.y;
    if(!hit&&!near)return null;
    if(!s.open)return Math.abs(x)<.12&&Math.abs(y)<.0375?'open':null;
    if(Math.abs(x)>.24)return null;
    return (s.inspecting?INSPECT_ROWS:MENU_ROWS).find(([,cy])=>Math.abs(y-cy)<.045)?.[0]??null;
  }
  prepareInspection(view:THREE.Camera){
    view.getWorldPosition(this.eye);
    if(this.state.inspecting&&!this.lastInspection){
      this.direction.copy(this.eye).sub(new THREE.Vector3(0,1.45,-2.4));this.direction.y=0;
      const distance=this.direction.length();
      this.direction.normalize();this.state.limit=Math.max(0,Math.min(.6,distance-1.8));
    }
    this.lastInspection=this.state.inspecting;
  }
  step(dt:number){this.offset.lerp(this.direction.clone().multiplyScalar(this.state.advance),1-Math.exp(-Math.min(dt,.05)*7))}
}
function menuTexture(width:number,height:number){const c=document.createElement('canvas');c.width=width;c.height=height;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function paint(texture:THREE.CanvasTexture,s:SpatialMenuState,launcher=false){
 const c=texture.image as HTMLCanvasElement,ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);
 ctx.fillStyle='#071720';ctx.strokeStyle='#b49a62';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(3,3,c.width-6,c.height-6,24);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';
 if(launcher){ctx.font='600 30px sans-serif';ctx.fillStyle=s.hover==='open'?'#9ee0c8':'#edd9ad';ctx.fillText('PINCH · MENU',c.width/2,c.height/2);texture.needsUpdate=true;return}
 const px=(y:number)=>c.height*(.5-y/H);
 ctx.fillStyle='#d7be87';ctx.font='600 25px sans-serif';ctx.fillText(s.inspecting?'CALLIGRAPHY · INSPECT':'LIVING ORBIT · HAND MENU',c.width/2,px(.295));
 for(const [action,y]of(s.inspecting?INSPECT_ROWS:MENU_ROWS)){
  const selected=s.hover===action,disabled=s.busy||(action==='nearer'&&s.advance>=s.limit-.001)||(action==='farther'&&s.advance<=.001);
  ctx.fillStyle=selected?'#1c4b44':'#102a35';ctx.strokeStyle=selected?'#97d7b6':'#586357';ctx.globalAlpha=disabled?.5:1;
  ctx.beginPath();ctx.roundRect(c.width*.075,px(y+.045),c.width*.85,c.height*.09/H,14);ctx.fill();ctx.stroke();
  ctx.font='500 30px sans-serif';ctx.fillStyle='#f1dfb7';const labels:Record<MenuAction,string>={open:'Menu',pause:s.getPaused()?'Resume orbit':'Pause orbit',inspect:'Inspect calligraphy',harf:'Open Harf Studio',close:'Close menu',nearer:'Nearer · 15 cm',farther:'Farther · 15 cm',return:'Return to orbit'};
  ctx.fillText(labels[action],c.width/2,px(y));ctx.globalAlpha=1;
 }
 ctx.font='21px sans-serif';ctx.fillStyle='#a8c7bd';
 const lines=s.message?[s.message]:s.inspecting?['Headset stays in your control.','Move the installation gently; Return restores it.']:['Aim your fingertip, then pinch.','Open your hand before the next action.'];
 lines.forEach((line,i)=>ctx.fillText(line,c.width/2,px(-.282-i*.025),c.width*.94));texture.needsUpdate=true;
}
export function SpatialMenu({menu}:{menu:SpatialMenuHandle}){
 const {gl}=useThree(),root=useRef<THREE.Group>(null),initialized=useRef(false);
 const textures=useMemo(()=>[menuTexture(768,1024),menuTexture(512,128)],[]);
 const position=useMemo(()=>new THREE.Vector3(),[]),quaternion=useMemo(()=>new THREE.Quaternion(),[]),rotation=useMemo(()=>new THREE.Euler(0,0,0,'YXZ'),[]);
 const last=useRef('');
 useEffect(()=>()=>textures.forEach(t=>t.dispose()),[textures]);
 useFrame((_,dt,frame)=>{
  if(!root.current)return;
  const session=gl.xr.getSession(),visible=gl.xr.isPresenting&&session?.visibilityState==='visible';root.current.visible=!!visible;
  if(!visible){if(initialized.current){menu.state.interrupt();menu.offset.set(0,0,0)}initialized.current=false;return}
  if(!initialized.current){
   const reference=gl.xr.getReferenceSpace(),pose=frame&&reference?frame.getViewerPose(reference):null;
   if(!pose){root.current.visible=false;return}
   const t=pose.transform;position.set(t.position.x,t.position.y,t.position.z);quaternion.set(t.orientation.x,t.orientation.y,t.orientation.z,t.orientation.w);
   rotation.setFromQuaternion(quaternion,'YXZ');root.current.position.copy(position);root.current.rotation.set(0,rotation.y,0);initialized.current=true;
  }
  menu.prepareInspection(gl.xr.getCamera());menu.step(dt);
  if(menu.panel)menu.panel.visible=menu.state.open;
  if(menu.launcher)menu.launcher.visible=!menu.state.open;
  const key=[menu.state.revision,menu.state.hover,menu.state.getPaused()].join('/');
  if(last.current!==key){last.current=key;paint(textures[0],menu.state);paint(textures[1],menu.state,true)}
 });
 return <group ref={root} visible={false} name="qari-xr-spatial-menu">
  <mesh ref={m=>{menu.panel=m}} name="qari-xr-menu-panel" position={[.27,-.10,-.78]} renderOrder={100}>
   <planeGeometry args={[W,H]}/><meshBasicMaterial map={textures[0]} transparent depthTest={false} toneMapped={false}/>
  </mesh>
  <mesh ref={m=>{menu.launcher=m}} name="qari-xr-menu-launcher" position={[.32,-.25,-.72]} renderOrder={100}>
   <planeGeometry args={[.24,.075]}/><meshBasicMaterial map={textures[1]} transparent depthTest={false} toneMapped={false}/>
  </mesh>
 </group>;
}
