import {Vector3} from 'three';
import {_roots} from '@react-three/fiber';
import {device} from '../demo/emulator';
import {GUIDE,DOT} from '../harf-xr/tracing';
import {boardPoint,nextGuideIndex,poseForTip} from './poses';
const channelName='qari-short-hand-showcase-v1';
const delay=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
function text(selector:string){return document.querySelector(selector)?.textContent||'';}
function click(pattern:RegExp){const b=[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>pattern.test(b.textContent||''));if(!b||b.disabled)throw Error('Unavailable control '+pattern);b.click();}
export async function connect(emulated:boolean){
 const channel=new BroadcastChannel(channelName),evidence:{at:string;cue:string;result:string;detail:unknown}[]=[];let busy=false,cancelled=false;
 const badge=document.createElement('div');badge.id='showcase-disclosure';badge.style.cssText='position:fixed;bottom:12px;right:12px;z-index:2147483647;padding:8px 12px;background:#06121fec;color:#efdbb2;border:1px solid #a58855;font:12px system-ui;border-radius:8px;pointer-events:none';document.body.append(badge);document.title='QariAI Spatial — Hand Showcase';
 function xr(){const session=device?.activeSession;if(!emulated||!session)throw Error('Enter embedded emulated VR first. No pointer substitute is used.');return session;}
 function publish(cue:string,result:string,detail:unknown){const row={at:new Date().toISOString(),cue,result,detail};evidence.push(row);channel.postMessage({type:'result',...row,path:location.pathname,input:device?.activeSession?'WEBXR HAND EMULATION — NOT QUEST':'DESKTOP APP — NOT QUEST'});}
 function hand(tip:Vector3,pinch:number,direction?:Vector3){xr();const h=device!.hands.right!;const pose=poseForTip(tip,pinch,direction);h.quaternion.set(pose.rotation.x,pose.rotation.y,pose.rotation.z,pose.rotation.w);h.position.set(pose.position.x,pose.position.y,pose.position.z);h.updatePinchValue(pinch);}
 async function frames(minFrames=4,minMs=180,timeout=3500){const session=xr();await new Promise<void>((resolve,reject)=>{const start=performance.now();let count=0,id=0;const timer=setTimeout(()=>{session.cancelAnimationFrame(id);reject(Error('XR frames stalled; stop take, no interaction forced.'));},timeout);const tick=()=>{if(cancelled){clearTimeout(timer);reject(Error('Cancelled'));return;}if(++count>=minFrames&&performance.now()-start>=minMs){clearTimeout(timer);resolve();}else id=session.requestAnimationFrame(tick);};id=session.requestAnimationFrame(tick);});}
 async function observed(check:()=>boolean,label:string,timeout=2500){const end=performance.now()+timeout;while(!check()){if(cancelled)throw Error('Cancelled');if(performance.now()>end)throw Error(label+' not observed: '+text('#status')+' '+text('.xr-diagnostics'));await delay(100);}}
 function world(name:string){const canvas=document.querySelector('canvas');const scene=canvas&&_roots.get(canvas)?.store.getState().scene;if(!scene)throw Error('Read-only R3F scene observation unavailable');const obj=scene.getObjectByName(name);if(!obj)throw Error('Existing target not rendered: '+name);scene.updateMatrixWorld(true);return obj.getWorldPosition(new Vector3());}
 async function pinchAt(target:Vector3){const tip=new Vector3(.35,1.3,-.7),direction=target.clone().sub(tip);if(direction.length()>2.9)throw Error('Target outside existing hand ray range');hand(tip,0,direction);await frames();hand(tip,1,direction);await frames(3,150);hand(tip,0,direction);await frames();}
 async function cue(name:string):Promise<Record<string,unknown>>{
  if(name==='prepare'){cancelled=false;if(device?.activeSession)throw Error('Exit VR before preparing a fresh take.');if(document.body.dataset.appEntry==='orbit'){click(/Reset view/);document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));const pause=[...document.querySelectorAll('button')].find(b=>/Pause motion/.test(b.textContent||''));pause?.click();await delay(1000);}else click(/Try again/);return {prepared:true};}
  if(name==='enter'){const b=document.querySelector<HTMLButtonElement>('#enter-xr')||document.querySelector<HTMLButtonElement>('#enter');if(!emulated||!b||b.disabled||b.hidden)throw Error('Emulator entry unavailable');b.click();await observed(()=>!!device?.activeSession,'XR session');await frames();return {session:true};}
  if(name==='exit'){if(device?.activeSession){click(/^(Exit VR|Leave VR)$/);await observed(()=>!device?.activeSession,'XR exit');}return {exited:true};}
  if(name==='select'){
   xr();if(!text('.step').includes('01'))throw Error('Prepare phase one first');await pinchAt(world('qari-letter-1'));await observed(()=>text('.stage-ui p').includes('Mirrored pair: ل ↔ ل'),'Mirrored selection');await delay(600);
   // Read observable render scales; do not write selection or transform values.
   const canvas=document.querySelector('canvas')!,scene=_roots.get(canvas)?.store.getState().scene;const scales=[1,5].map(i=>scene?.getObjectByName('qari-letter-'+i)?.scale.x||0);if(scales.some(s=>s<1.15))throw Error('Both mirrored letter highlights not visibly raised');return {caption:text('.stage-ui p'),mirrorScales:scales,diagnostics:text('.xr-diagnostics')};
  }
  if(name==='spatial'){
   xr();if(!text('.step').includes('01'))throw Error('Prepare phase one first');await pinchAt(world('qari-action-primary'));await observed(()=>text('.step').includes('02'),'Original spatial phase transition');return {phase:text('.step'),diagnostics:text('.xr-diagnostics'),supported:'pinch spatial action, no hand zoom'};
  }
  if(name==='macro'){if(device?.activeSession)throw Error('Exit XR before desktop macro; no headset camera manipulation.');if(document.body.dataset.appEntry!=='orbit')throw Error('Orbit only');click(/Reset view/);await delay(400);if([...document.querySelectorAll('button')].some(b=>/Pause motion/.test(b.textContent||'')))click(/Pause motion/);click(/Explore Calligraphy/);await observed(()=>[...document.querySelectorAll('button')].some(b=>/Return to Orbit/.test(b.textContent||'')),'Explore control');await delay(3500);return {input:'DESKTOP APP — NOT QUEST',camera:'existing Explore Calligraphy; inspect inscription quality manually'};}
  if(name==='harf-take'){const body=await cue('body');await delay(400);const dot=await cue('dot');await delay(1200);return {body,dot};}
  if(name==='body'){
   if(document.body.dataset.appEntry!=='harf-xr')throw Error('Harf only');xr();hand(boardPoint(GUIDE[0]),0);await frames();hand(boardPoint(GUIDE[0]),1);await frames();let index=0,last=performance.now(),start=last;
   while(index<GUIDE.length-1&&!text('#status').includes('Body complete')){await frames(1,0);const now=performance.now();if(now-start>15000)throw Error('Body exceeded short-take budget; no completion forced');index=nextGuideIndex(index,(now-last)/1000,GUIDE.length);last=now;const i=Math.floor(index),a=GUIDE[i],b=GUIDE[Math.min(i+1,GUIDE.length-1)],f=index-i;hand(boardPoint({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}),1);}
   hand(boardPoint(GUIDE.at(-1)!),0);await frames();await observed(()=>text('#status').includes('Body complete'),'Body completion');return {status:text('#status'),input:'SDK hand joints through unchanged validator'};
  }
  if(name==='dot'){
   if(!text('#status').includes('Body complete'))throw Error('Complete body first; dot is a separate step');hand(boardPoint(DOT),0);await frames();hand(boardPoint(DOT),1);await frames();await observed(()=>text('#status').includes('Letter complete ✓'),'Separate dot completion');hand(boardPoint(DOT),0);await frames();return {status:text('#status'),separateDot:true};
  }
  if(name==='stop'){cancelled=true;device?.hands.right?.updatePinchValue(0);await device?.activeSession?.end();return {stopped:true};}
  throw Error('Unknown showcase cue');
 }
 const labels=setInterval(()=>{badge.textContent=emulated&&device?.activeSession?'WEBXR HAND EMULATION — NOT QUEST · scripted poses':'DESKTOP APP — NOT QUEST';},150);
 channel.onmessage=async e=>{if(e.data?.type!=='cue')return;const name=String(e.data.name);if(name==='report'){channel.postMessage({type:'evidence',evidence});return;}if(busy&&name!=='stop'){publish(name,'blocked','Another cue is running; no action taken');return;}busy=true;try{const result=await cue(name);publish(name,'observed',result);}catch(error){device?.hands.right?.updatePinchValue(0);publish(name,'FAILED',{error:String(error),status:text('#status'),phase:text('.step'),diagnostics:text('.xr-diagnostics')});}finally{busy=false;}};
 window.addEventListener('pagehide',()=>{cancelled=true;clearInterval(labels);device?.hands.right?.updatePinchValue(0);channel.close();},{once:true});
 publish('ready','loaded',{emulated,kind:document.body.dataset.appEntry,verification:'No clip quality approval implied'});
}
