import {Vector3} from 'three';
import {XRReferenceSpaceType} from 'iwer/lib/spaces/XRReferenceSpace.js';
import {XRHandJoint} from 'iwer/lib/input/XRHand.js';
import {device} from '../demo/emulator';
import {boardPoint,poseForTip} from './poses';
import type {Point} from '../harf-xr/tracing';

// Geometry is unchanged: only subdivide existing guide segments for playback.
export function waypoints(guide:readonly Point[],maxStep=4):Point[]{
 const out=[{...guide[0]}];for(let i=1;i<guide.length;i++){const a=guide[i-1],b=guide[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/maxStep));for(let j=1;j<=n;j++)out.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});}return out;
}
export function jointSettled(tip:Vector3,thumb:Vector3,target:Vector3,pinch:number|null){const gap=tip.distanceTo(thumb);return tip.distanceTo(target)<=.0015&&(pinch===null||(pinch===0?gap>=.030:gap<=.018));}
export function harfMotion(cancelled:()=>boolean){
 if(!device?.activeSession)throw Error('Enter emulated Harf VR first');const session=device.activeSession!,hand=device.hands.right!;
 const reference=session.requestReferenceSpace(XRReferenceSpaceType.LocalFloor);let initialized=false,lastTip=boardPoint({x:700,y:180}),lastPinch=0;
 const samples:{maxTipErrorMeters:number;frames:number}={maxTipErrorMeters:0,frames:0};
 function command(tip:Vector3,pinch:number){const pose=poseForTip(tip,pinch);hand.quaternion.set(pose.rotation.x,pose.rotation.y,pose.rotation.z,pose.rotation.w);hand.position.set(pose.position.x,pose.position.y,pose.position.z);hand.updatePinchValue(pinch);lastTip=tip;lastPinch=pinch;}
 async function settle(tip:Vector3,pinch:number|null,minMs=45,minFrames=2){
  const space=await reference;
  await new Promise<void>((resolve,reject)=>{let consecutive=0,id=0;const began=performance.now();const timer=setTimeout(()=>{session.cancelAnimationFrame(id);reject(Error('Harf joint settling stalled; no waypoint or completion skipped'));},3500);
   const tick=(_time:number,frame:Parameters<Parameters<typeof session.requestAnimationFrame>[0]>[1])=>{
    if(cancelled()){clearTimeout(timer);reject(Error('Cancelled'));return;}
    const source=Array.from(session.inputSources).find(s=>s.handedness==='right'&&s.hand),index=source?.hand?.get(XRHandJoint.IndexFingerTip),thumb=source?.hand?.get(XRHandJoint.ThumbTip);
    const ip=index&&frame.getJointPose(index,space),tp=thumb&&frame.getJointPose(thumb,space);
    if(ip&&tp){const a=new Vector3(ip.transform.position.x,ip.transform.position.y,ip.transform.position.z),b=new Vector3(tp.transform.position.x,tp.transform.position.y,tp.transform.position.z);samples.frames++;samples.maxTipErrorMeters=Math.max(samples.maxTipErrorMeters,a.distanceTo(tip));consecutive=jointSettled(a,b,tip,pinch)?consecutive+1:0;}else consecutive=0;
    if(consecutive>=minFrames&&performance.now()-began>=minMs){clearTimeout(timer);resolve();}else id=session.requestAnimationFrame(tick);
   };id=session.requestAnimationFrame(tick);
  });
 }
 async function initialize(){if(initialized)return;const space=await reference;await new Promise<void>((resolve,reject)=>{let id=0;const timer=setTimeout(()=>{session.cancelAnimationFrame(id);reject(Error('Initial hand joints unavailable'));},3500);id=session.requestAnimationFrame((_time,frame)=>{clearTimeout(timer);const source=Array.from(session.inputSources).find(s=>s.handedness==='right'&&s.hand),joint=source?.hand?.get(XRHandJoint.IndexFingerTip),pose=joint&&frame.getJointPose(joint,space);if(!pose||cancelled()){reject(Error('Initial hand joints unavailable/cancelled'));return;}lastTip=new Vector3(pose.transform.position.x,pose.transform.position.y,pose.transform.position.z);lastPinch=hand.pinchValue;initialized=true;resolve();});});}
 async function ramp(tip:Vector3,to:number){const from=lastPinch;for(let i=1;i<=8;i++){command(tip,from+(to-from)*i/8);await settle(tip,null,0,1);}await settle(tip,to,to===0?220:100,3);}
 return {
  samples,
  async openAt(point:Point){await initialize();await ramp(lastTip,0);const target=boardPoint(point),from=lastTip.clone(),steps=Math.max(1,Math.ceil(from.distanceTo(target)/.008));for(let i=1;i<=steps;i++){const tip=from.clone().lerp(target,i/steps);command(tip,0);await settle(tip,0,0,1);}await settle(target,0,220,3);},
  async close(){await ramp(lastTip,1);},
  async move(point:Point){const target=boardPoint(point);command(target,1);await settle(target,1);},
  async release(){await ramp(lastTip,0);},
 };
}
