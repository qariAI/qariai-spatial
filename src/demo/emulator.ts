import {XRDevice,metaQuest3} from 'iwer';
import {oculusHandConfig} from 'iwer/lib/device/XRHandInput.js';
import {XRHandJoint} from 'iwer/lib/input/XRHand.js';
import type {Point} from '../harf-xr/letters/definition';
export let device:XRDevice|undefined;
let pinch=0,target:Point|undefined;
export async function installEmulator(){
 if(/OculusBrowser|Quest/i.test(navigator.userAgent))throw Error('Use native Quest mode, not the desktop emulator.');
 device=new XRDevice(metaQuest3,{stereoEnabled:false});device.primaryInputMode='hand';device.position.set(0,1.6,0);
 device.hands.left!.connected=true;device.hands.right!.connected=true;
 device.hands.left!.position.set(-.45,1.2,-.4);device.hands.right!.position.set(.3,1.3,-.4);
 device.hands.right!.poseId='point';device.hands.right!.quaternion.set(0,0,0,1);device.installRuntime();
}
export function moveEmulatedTip(point:Point){
 const hand=device?.hands.right;if(!hand)throw Error('Embedded IWER hand runtime is unavailable.');target=point;
 // SDK pose translations: right-hand mirror flips X. Move the wrist so the
 // simulator's real index-tip pose reaches the board; never replace XRFrame.
 const open=oculusHandConfig.poses.point.jointTransforms[XRHandJoint.IndexFingerTip].offsetMatrix;
 const closed=oculusHandConfig.poses.pinch.jointTransforms[XRHandJoint.IndexFingerTip].offsetMatrix;
 const x=-(open[12]*(1-pinch)+closed[12]*pinch),y=open[13]*(1-pinch)+closed[13]*pinch,z=open[14]*(1-pinch)+closed[14]*pinch;
 hand.position.set((point.x/900-.5)*.72-x,1.44+(.5-point.y/650)*.52-y,-.55-z);
}
export function setEmulatedPinch(value:number){if(!device?.hands.right)throw Error('No emulated hand');pinch=value;device.hands.right.updatePinchValue(value);if(target)moveEmulatedTip(target);}
