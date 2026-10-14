import type {DemoMode} from './mode';
import {GUIDE,DOT} from '../harf-xr/tracing';
const CHANNEL='qari-competition-capture-v1';
const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
function button(pattern:RegExp){const b=[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>pattern.test(b.textContent||''));if(!b)throw Error('Control unavailable: '+pattern);b.click();}
async function until(check:()=>boolean,timeout=10000){const end=performance.now()+timeout;while(!check()){if(performance.now()>end)throw Error('App state did not settle; no completion is forced.');await delay(100);}}
export async function connectCapture(mode:DemoMode){
 document.title='QariAI Spatial — Demo Capture';
 const badge=document.createElement('div');badge.id='capture-truth-label';badge.style.cssText='position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#06101fe8;color:#edd7aa;font:12px system-ui;padding:8px 12px;border:1px solid #887650;border-radius:8px;pointer-events:none';document.body.append(badge);
 const channel=new BroadcastChannel(CHANNEL);let busy=false,cancelled=false;
 const emulator=mode.emulate?await import('./emulator'):null;
 const publish=(state:string)=>channel.postMessage({type:'state',state,path:location.pathname,emulated:!!emulator?.device?.activeSession});
 const label=setInterval(()=>{badge.textContent=emulator?.device?.activeSession?'XR EMULATION · automated cues / simulated hands · NOT QUEST':'DESKTOP APP · pointer / UI simulation · NOT QUEST';},200);
 async function handsBody(){
  if(!emulator?.device?.activeSession||location.pathname!=='/harf-studio-xr.html')throw Error('Enter embedded emulated Harf VR first. No pointer substitute is used.');
  emulator.setEmulatedPinch(0);emulator.moveEmulatedTip(GUIDE[0]);await delay(350);emulator.moveEmulatedTip(GUIDE[0]);
  emulator.setEmulatedPinch(1);await delay(250);emulator.moveEmulatedTip(GUIDE[0]);
  const began=performance.now(),duration=28000;
  while(performance.now()-began<duration&&!cancelled){const t=Math.min(1,(performance.now()-began)/duration)*(GUIDE.length-1),i=Math.floor(t),a=GUIDE[i],b=GUIDE[Math.min(i+1,GUIDE.length-1)],f=t-i;emulator.moveEmulatedTip({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f});await delay(33);}
  emulator.setEmulatedPinch(0);await delay(250);
  await until(()=>document.querySelector('#status')?.textContent?.includes('Body complete')===true);
 }
 async function settleHands(){const session=emulator?.device?.activeSession;if(!session)throw Error('No emulated XR session');await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('XR frames stalled; capture stopped')),5000);let count=0;const frame=()=>{if(++count===16){clearTimeout(timer);resolve();}else session.requestAnimationFrame(frame);};session.requestAnimationFrame(frame);});}
 async function handsDot(){if(!emulator?.device?.activeSession)throw Error('No emulated XR session');emulator.setEmulatedPinch(0);emulator.moveEmulatedTip(DOT);await settleHands();await delay(150);emulator.setEmulatedPinch(1);await delay(200);emulator.moveEmulatedTip(DOT);await delay(350);emulator.setEmulatedPinch(0);await until(()=>document.querySelector('#status')?.textContent?.includes('Letter complete')===true);}
 async function cue(name:string){
  if(name==='stop'){cancelled=true;emulator?.setEmulatedPinch(0);if(emulator?.device?.activeSession)await emulator.device.activeSession.end();sessionStorage.removeItem('qari-competition-demo');location.assign('/?competitionDemo=0');return;}
  if(name==='enter-xr'){const b=document.querySelector<HTMLButtonElement>('#enter-xr')||document.querySelector<HTMLButtonElement>('#enter');if(!b||b.disabled||b.hidden)throw Error('XR entry unavailable');b.click();await until(()=>!!emulator?.device?.activeSession);return;}
  if(name==='exit-xr'){if(emulator?.device?.activeSession){button(/^(Exit VR|Leave VR)$/);await until(()=>!emulator.device?.activeSession);}return;}
  if(name==='seven'){button(/Reset view/);window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft'}));if([...document.querySelectorAll('button')].some(b=>/Pause motion/.test(b.textContent||'')))button(/Pause motion/);return;}
  if(name==='mirrors'){for(let i=1;i<=7&&!cancelled;i++){window.dispatchEvent(new KeyboardEvent('keydown',{key:String(i)}));await delay(2100);}return;}
  if(name==='orbit'){button(/Bring the letters into orbit/);if([...document.querySelectorAll('button')].some(b=>/Resume motion/.test(b.textContent||'')))button(/Resume motion/);return;}
  if(name==='macro'){await cue('exit-xr');button(/Reset view/);await delay(400);if([...document.querySelectorAll('button')].some(b=>/Pause motion/.test(b.textContent||'')))button(/Pause motion/);button(/Explore Calligraphy/);return;}
  if(name==='return'){button(/Return to Orbit/);return;}
  if(name==='studio'){document.querySelector<HTMLAnchorElement>('#practice-calligraphy')?.click();return;}
  if(name==='guide'){button(/Try again/);return;}
  if(name==='body'){await handsBody();return;}
  if(name==='dot'){await handsDot();return;}
  if(name==='finish'){
   if(emulator?.device?.activeSession){emulator.setEmulatedPinch(0);emulator.moveEmulatedTip({x:650,y:580});await delay(400);emulator.setEmulatedPinch(1);await delay(200);emulator.moveEmulatedTip({x:650,y:580});await delay(650);}else{document.querySelector<HTMLAnchorElement>('#return-orbit')?.click();}return;
  }
  throw Error('Unknown cue');
 }
 channel.onmessage=async event=>{if(event.data?.type!=='cue'||typeof event.data.name!=='string')return;if(event.data.name==='stop')cancelled=true;else if(busy){publish('Busy — wait for the current cue');return;}busy=true;try{await cue(event.data.name);publish('Ready: '+event.data.name);}catch(error){publish('FAILED: '+(error instanceof Error?error.message:String(error)));}finally{busy=false;}};
 publish('Capture connected; renderer and validators unchanged');
 window.addEventListener('pagehide',()=>{cancelled=true;clearInterval(label);channel.close();emulator?.device?.hands.right?.updatePinchValue(0);},{once:true});
}
