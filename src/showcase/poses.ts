import {Quaternion,Vector3} from 'three';
import {oculusHandConfig} from 'iwer/lib/device/XRHandInput.js';
import {XRHandJoint} from 'iwer/lib/input/XRHand.js';
export function poseForTip(tip:Vector3,pinch:number,direction=new Vector3(0,0,-1)){
 const joint=(name:XRHandJoint)=>{const a=oculusHandConfig.poses.point.jointTransforms[name].offsetMatrix,b=oculusHandConfig.poses.pinch.jointTransforms[name].offsetMatrix;return new Vector3(-(a[12]*(1-pinch)+b[12]*pinch),a[13]*(1-pinch)+b[13]*pinch,a[14]*(1-pinch)+b[14]*pinch);};
 const index=joint(XRHandJoint.IndexFingerTip),wrist=joint(XRHandJoint.Wrist);
 const rotation=new Quaternion().setFromUnitVectors(index.clone().sub(wrist).normalize(),direction.clone().normalize());
 return {rotation,position:tip.clone().sub(index.applyQuaternion(rotation))};
}
export function boardPoint(p:{x:number;y:number}){return new Vector3((p.x/900-.5)*.72,1.44+(.5-p.y/650)*.52,-.55);}
export function nextGuideIndex(index:number,dt:number,count:number){return Math.min(count-1,index+Math.min(Math.max(0,dt),.05)*(count-1)/11);}
