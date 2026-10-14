import {chromium} from 'playwright';
import OBSWebSocket from 'obs-websocket-js';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {verifyArrangement} from './display.mjs';
import {SHOTS,projectedPoint,verifyVideo,ffmpegArgs} from './core.mjs';
const origin=new URL(process.env.DEMO_URL||'http://localhost:5173');
if(origin.protocol!=='https:'&&origin.hostname!=='localhost'&&origin.hostname!=='127.0.0.1')throw Error('Use HTTPS preview or localhost.');
if(!['localhost','127.0.0.1'].includes(origin.hostname)&&!(origin.hostname.includes('-git-')&&origin.hostname.endsWith('.vercel.app')))throw Error('Only isolated branch preview aliases or localhost are supported; never production.');
const {guide,dot}=JSON.parse(await readFile(new URL('./trace-data.json',import.meta.url)));
const out=resolve('recordings',new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(out,{recursive:true});
const report={mode:'Actual desktop application; automated pointer/UI input, NOT Quest hand tracking',resolution:'1920x1080',fps:30,shots:[],success:false};
const sleep=async ms=>{const end=performance.now()+ms;do{if(focusError)throw focusError;if(recording)checkGuard();await new Promise(r=>setTimeout(r,Math.min(200,Math.max(0,end-performance.now()))));}while(performance.now()<end);};
const obs=new OBSWebSocket();let browser,page,guard,focusError,guardTick=0,recording=false,ownsRecording=false;
const consent=createInterface({input:process.stdin,output:process.stdout});
async function connect(){await obs.connect(process.env.OBS_URL||'ws://127.0.0.1:4455',process.env.OBS_PASSWORD||'');verifyVideo(await obs.call('GetVideoSettings'));if((await obs.call('GetRecordStatus')).outputActive)throw Error('OBS already recording. Stop your recording first; this script will not interrupt it.');}
async function captureReady(){await page.waitForSelector('#capture-truth-label');await page.getByRole('link',{name:/Practice Calligraphy/}).waitFor();await page.evaluate(()=>document.fonts.ready);await sleep(5000);}
async function cue(name){
 await page.evaluate(()=>{if(!window.qariRecordingChannel){window.qariRecordingStates=[];window.qariRecordingChannel=new BroadcastChannel('qari-competition-capture-v1');window.qariRecordingChannel.onmessage=e=>window.qariRecordingStates.push(e.data);}});
 if(recording){checkGuard();await page.bringToFront();}
 const before=await page.evaluate(()=>window.qariRecordingStates.length);
 await page.evaluate(name=>window.qariRecordingChannel.postMessage({type:'cue',name}),name);
 await page.waitForFunction(({before,name})=>window.qariRecordingStates.slice(before).some(x=>x.state==='Ready: '+name||/^FAILED|Busy/.test(x.state||'')),{before,name},{timeout:20000});
 const state=await page.evaluate(()=>window.qariRecordingStates.at(-1));if(state.state!=='Ready: '+name)throw Error(state.state);
}
async function canvas(){return await page.locator('canvas').first().evaluate(c=>{const r=c.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});}
async function body(){const rect=await canvas();const points=guide.map(p=>projectedPoint(p,rect));await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();const start=performance.now();for(let i=1;i<points.length;i++){if(recording)checkGuard();await page.mouse.move(points[i].x,points[i].y);const due=start+24000*i/(points.length-1);await sleep(Math.max(0,due-performance.now()));}await page.mouse.up();await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Body complete · Add the dot'),null,{timeout:4000});}
async function placeDot(){const p=projectedPoint(dot,await canvas());await page.mouse.click(p.x,p.y);await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Letter complete ✓'),null,{timeout:4000});}
async function studio(){if(recording)checkGuard();await page.getByRole('link',{name:/Practice Calligraphy/}).click();await page.waitForURL(u=>u.pathname==='/harf-studio-xr.html'&&u.searchParams.get('competitionDemo')==='1');await page.waitForSelector('#capture-truth-label');await page.locator('#retry').waitFor();await sleep(1200);}
async function finish(){if(recording)checkGuard();await page.getByRole('link',{name:/Return to Living Orbit/}).click();await captureReady();}
async function screenshot(name){await page.screenshot({path:resolve(out,name+'.png'),timeout:8000});}
function checkGuard(){if(focusError)throw focusError;if(!guard||performance.now()-guardTick>2000)throw Error('Windows foreground guard unavailable or stale.');}
async function startGuard(){if(process.platform!=='win32')throw Error('Display foreground guard requires Windows.');guard=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','RemoteSigned','-File',fileURLToPath(new URL('./foreground.ps1',import.meta.url))],{windowsHide:true});let pending='';guard.stdout.on('data',b=>{pending+=b.toString();let i;while((i=pending.indexOf('\n'))>=0){const line=pending.slice(0,i).trim();pending=pending.slice(i+1);try{const state=JSON.parse(line);if(state.error)focusError=Error(state.error);else if(state.foreground&&state.fullscreen)guardTick=performance.now();}catch{}}});guard.on('error',e=>focusError=e);guard.on('exit',()=>{if(recording)focusError=Error('Foreground guard exited');});const deadline=performance.now()+8000;while(!guardTick){if(performance.now()>deadline)throw Error('Foreground guard startup failed. Check PowerShell policy; no recording started.');await sleep(100);}checkGuard();}
async function viewport(){const size=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));if(size.width!==1920||size.height!==1080||size.dpr!==1)throw Error(`Browser must be fullscreen 1920×1080 at 100% Windows scaling; got ${JSON.stringify(size)}`);}
try{
 await connect();
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:false,args:['--start-maximized','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const context=await browser.newContext({viewport:null,deviceScaleFactor:1});page=await context.newPage();page.setDefaultTimeout(15000);
 page.on('pageerror',e=>{report.pageErrors??=[];report.pageErrors.push(e.message);});
 const url=new URL('/',origin);url.searchParams.set('competitionDemo','1');await page.goto(url.href,{waitUntil:'domcontentloaded'});await captureReady();
 console.log('Keep your existing Display Capture (Windows Graphics Capture, cursor off). Select the Chrome monitor, fit source to 1920×1080. F11 Chrome fullscreen; OBS/terminal must be on another monitor or fully covered behind Chrome. Keep disclosure visible.');
 await consent.question('Press Enter here once OBS preview shows only the 1920×1080 application. ');await page.bringToFront();await viewport();
 // Full warmup/rehearsal before OBS: actual body/dot validators, navigation and camera.
 await studio();await body();await placeDot();await screenshot('rehearsal-letter-complete');await finish();await cue('seven');await cue('macro');await sleep(5000);await cue('return');await sleep(4000);await cue('seven');await screenshot('ready-seven');
 if(report.pageErrors?.length)throw Error('Browser errors occurred during rehearsal; inspect report.');
 await consent.question('Rehearsal passed. Check OBS preview and press Enter to record automatically for 2:54. ');await page.bringToFront();await viewport();await sleep(1500);
 await startGuard();report.captureArrangement=await verifyArrangement(obs,page,out,writeFile);checkGuard();verifyVideo(await obs.call('GetVideoSettings'));if((await obs.call('GetRecordStatus')).outputActive)throw Error('OBS is now recording; abort without stopping your recording.');await obs.call('StartRecord');recording=true;ownsRecording=true;const started=performance.now();
 for(const shot of SHOTS){await sleep(Math.max(0,shot.at*1000-(performance.now()-started)));if(performance.now()-started>shot.at*1000+2500)throw Error('Shot timing slipped; abort rather than claim a repeatable 2:54 take.');
  console.log(`${shot.at}s ${shot.name}`);const entry={name:shot.name,startMs:performance.now()-started};report.shots.push(entry);
  if(shot.cue==='studio')await studio();else if(shot.cue==='body')await body();else if(shot.cue==='dot'){await placeDot();await screenshot('recorded-letter-complete');}else if(shot.cue==='finish')await finish();else await cue(shot.cue);
  entry.readyMs=performance.now()-started;if(entry.readyMs>shot.end*1000)throw Error('Shot exceeded its budget: '+shot.name);
 }
 await sleep(Math.max(0,174000-(performance.now()-started)));checkGuard();const result=await obs.call('StopRecord');recording=false;report.obsFile=result.outputPath;
 const stats=await obs.call('GetStats');report.obsStats=stats;if(report.pageErrors?.length)throw Error('Browser errors occurred during the take.');
 if(stats.outputSkippedFrames>0||stats.renderSkippedFrames>0)console.warn('OBS reports skipped frames (session cumulative); review footage and report.');
 // Verify actual file length before packaging. Never pad/freeze imagery to hide stalls.
 const probe=spawnSync(process.env.FFPROBE||'ffprobe',['-v','error','-show_entries','format=duration:stream=width,height','-of','json',result.outputPath],{encoding:'utf8'});if(probe.status!==0)throw Error('OBS recording saved, but ffprobe unavailable or failed. Install FFmpeg; report contains the original file path.');const info=JSON.parse(probe.stdout);report.input=info;
 if(Number(info.format.duration)<174||!info.streams.some(s=>s.width===1920&&s.height===1080))throw Error('Recording too short or wrong resolution; do not manufacture missing frames.');
 const mp4=resolve(out,'qariai-competition-2m54s.mp4');const assembled=spawnSync(process.env.FFMPEG||'ffmpeg',ffmpegArgs(result.outputPath,mp4),{stdio:'inherit'});if(assembled.status!==0)throw Error('FFmpeg failed; original OBS file is preserved.');
 report.mp4=mp4;report.success=true;console.log('Saved: '+mp4+' — review before submission.');
}catch(error){report.error=String(error);console.error('STOPPED: '+report.error);if(recording&&ownsRecording){try{const stopped=await obs.call('StopRecord');report.incompleteOBSFile=stopped.outputPath;}catch(e){report.stopError=String(e);}}process.exitCode=1;
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));guard?.kill();consent.close();await obs.disconnect().catch(()=>{});await browser?.close();}
