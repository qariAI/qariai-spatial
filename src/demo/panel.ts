import {allowedDemoHost} from './mode';
import {SHOTS} from './sequence';
const status=document.querySelector('#status')!,channel=new BroadcastChannel('qari-competition-capture-v1');
let timers:ReturnType<typeof setTimeout>[]=[];let emulate=true;
function halt(){timers.forEach(clearTimeout);timers=[];}
function send(name:string){if(!emulate&&['body','dot','enter-xr'].includes(name)){status.textContent='Desktop fallback: perform '+name+' manually in the actual app.';return;}channel.postMessage({type:'cue',name});status.textContent='Sent cue: '+name;}
function launch(xr:boolean){emulate=xr;if(!allowedDemoHost(location.hostname,import.meta.env.DEV)){status.textContent='Capture helpers run only on localhost or branch preview aliases.';return;}const url=new URL('/',location.origin);url.searchParams.set('competitionDemo','1');if(emulate)url.searchParams.set('xrEmulator','1');window.open(url,'qari-demo-capture','popup,width=1920,height=1080');}
document.querySelector<HTMLButtonElement>('#launch-xr')!.onclick=()=>launch(true);
document.querySelector<HTMLButtonElement>('#launch-desktop')!.onclick=()=>launch(false);
const time=(s:number)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
for(const shot of SHOTS){const li=document.createElement('li'),b=document.createElement('button');b.textContent=`${time(shot.at)}–${time(shot.end)} · ${shot.name}`;b.onclick=()=>send(shot.cue);li.append(b,document.createTextNode(shot.note));document.querySelector('#shots')!.append(li);}
document.querySelectorAll<HTMLButtonElement>('[data-cue]').forEach(b=>b.onclick=()=>send(b.dataset.cue!));
document.querySelector<HTMLButtonElement>('#start')!.onclick=()=>{halt();for(const shot of SHOTS)timers.push(setTimeout(()=>send(shot.cue),shot.at*1000));timers.push(setTimeout(()=>{status.textContent='2:54 complete — stop OBS. No video file is created by the cue clock.';},174000));};
document.querySelector<HTMLButtonElement>('#halt')!.onclick=()=>{halt();status.textContent='Cue clock stopped. App footage is not fabricated or replaced.';};
channel.onmessage=e=>{if(e.data?.type==='state'){status.textContent=`${e.data.state} · ${e.data.path} · ${e.data.emulated?'XR emulation':'desktop'}`;if(/^FAILED|Busy/.test(e.data.state))halt();}};
window.addEventListener('pagehide',()=>{halt();channel.close();},{once:true});
