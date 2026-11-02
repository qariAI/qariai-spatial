// Actual Living Orbit + production menu + IWER hands. Emulator is test-only.
// Windows: set IWER_MODULE to IWER 2.1.0's lib/index.js; optionally CHROMIUM_PATH.
const {chromium}=require(process.argv[2]),{buildSync,transformSync}=require('esbuild'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.argv[4];fs.mkdirSync(out,{recursive:true});const rl=require('node:readline/promises').createInterface({input:process.stdin,output:process.stdout});const hold=message=>process.env.QARIAI_XR_CHECK==='1'?Promise.resolve():rl.question(message);const dwell=()=>new Promise(r=>setTimeout(r,400));
(async()=>{let browser,server;const report={candidate:process.env.QARIAI_XR_COMMIT||'feat/xr-guided-practice-v0.1 (working tree)',success:false,mode:process.env.QARIAI_VIDEO==='1'?'video':'verification',platform:process.platform,input:'IWER 2.1.0 WEBXR HAND EMULATION — NOT PHYSICAL QUEST',renderer:process.env.MENU_FIXTURE==='1'?'production menu/hand/letter/phase components in lightweight WebXR fixture; NOT full celestial rendering':'actual full application WebGL',events:[],errors:[],screenshots:[],warnings:[]};try{
 const sdkPath=process.env.IWER_MODULE;if(!sdkPath)throw Error('IWER_MODULE must point to test-only IWER 2.1.0 lib/index.js');
 const sdk=buildSync({stdin:{contents:`export * from ${JSON.stringify(sdkPath)};export {oculusHandConfig} from ${JSON.stringify(path.join(path.dirname(sdkPath),'device/XRHandInput.js'))};`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',globalName:'IWER'}).outputFiles[0].text;
 const port=await new Promise((resolve,reject)=>{const probe=require('node:net').createServer();probe.on('error',reject);probe.listen(0,'127.0.0.1',()=>{const n=probe.address().port;probe.close(()=>resolve(n))})});const origin='http://127.0.0.1:'+port;
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--strictPort','--port',String(port)],{stdio:'ignore'});
 for(let i=0;i<100;i++){try{if((await fetch(origin+'/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:process.env.QARIAI_XR_CHECK==='1',executablePath:process.argv[3],args:['--start-maximized','--disable-accelerated-2d-canvas',...(process.env.QARIAI_XR_CHECK==='1'?['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])]});
 const p=await browser.newPage({viewport:{width:1280,height:900}});p.setDefaultTimeout(30000);p.on('pageerror',e=>report.errors.push(e.message));let fiber;
 p.on('response',r=>{if(r.url().includes('@react-three_fiber.js'))fiber=r.url()});
 await p.route('**/src/main.tsx',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replaceAll('React.StrictMode','React.Fragment')})});
 await p.addInitScript({content:sdk+`;window.IWER=IWER;window.device=new IWER.XRDevice(IWER.metaQuest3,{stereoEnabled:false});device.primaryInputMode='hand';device.position.set(0,1.6,0);for(const side of ['left','right']){device.hands[side].connected=false;device.hands[side].poseId='point';device.hands[side].quaternion.set(0,0,0,1)}device.installRuntime();document.addEventListener('DOMContentLoaded',()=>{const keep=()=>{if(document.title!=='QariAI XR GUIDED DEMO')document.title='QariAI XR GUIDED DEMO'};keep();new MutationObserver(keep).observe(document.querySelector('title'),{childList:true,subtree:true,characterData:true})});`});

 await p.route('**/src/harf-xr/main.ts',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nexport {board,renderer,guide};'});});
 const wait=async(fn,arg,timeout=30000)=>p.waitForFunction(fn,arg,{polling:100,timeout});
 const ready=async()=>{await wait(()=>document.querySelector('.tools')&&document.querySelector('canvas'),null,120000);assert(fiber);await p.evaluate(async url=>{const m=await import(url);window.orbit=()=>m._roots.get(document.querySelector('canvas'))?.store.getState();},fiber);await wait(name=>window.orbit()?.scene.getObjectByName(name),process.env.MENU_FIXTURE==='1'?'qari-xr-menu-launcher':'calligraphy-depth-art',120000)};
 const frames=async(n=4)=>p.evaluate(n=>new Promise((resolve,reject)=>{const session=orbit().gl.xr.getSession();if(!session)return reject(Error('No active XR session'));let count=0;const timer=setTimeout(()=>reject(Error('Emulated frame budget exceeded')),60000);const tick=()=>{if(++count>=n){clearTimeout(timer);resolve()}else session.requestAnimationFrame(tick)};session.requestAnimationFrame(tick)}),n);
 const point=async(name,y=0)=>p.evaluate(({name,y})=>{const s=orbit(),m=s.scene.getObjectByName(name);if(!m)throw Error('Missing '+name);s.scene.updateMatrixWorld(true);const vector=m.position.clone().set(0,y,.018);m.localToWorld(vector);return vector.toArray()},{name,y});
 const move=async(side,target,pinch,expectNavigation=false)=>{await p.evaluate(({side,target,pinch})=>{const hand=device.hands[side];hand.connected=true;hand.poseId='point';hand.updatePinchValue(pinch);const form=IWER.oculusHandConfig.poses[pinch?'pinch':'point'].jointTransforms['index-finger-tip'].offsetMatrix;hand.position.set(target[0]-(side==='right'?-form[12]:form[12]),target[1]-form[13],target[2]-form[14]);},{side,target,pinch});if(!expectNavigation)await frames(5)};
 const press=async(name,y=0,side='right',expectNavigation=false)=>{const target=await point(name,y);await move(side,target,0);await p.waitForTimeout(360);await move(side,target,1,expectNavigation);report.events.push({input:side,target:name,row:y});};
 const capture=async(name)=>{console.log('STAGE: '+name);await dwell();
  try{
   const png=await p.screenshot({timeout:30000});
   fs.writeFileSync(out+'/'+name+'.png',png);report.screenshots.push(name+'.png');console.log('CAPTURE',name);
  }catch(e){report.warnings.push('Canvas screenshot '+name+': '+String(e))}
 };
 await p.goto(origin+'/?calligraphyRelief=texture&orbitArt=study',{waitUntil:'domcontentloaded',timeout:60000});await ready();await p.evaluate(()=>document.title='QariAI XR GUIDED DEMO');console.log('Select QariAI XR GUIDED DEMO in OBS Window Capture. Start Recording, then return here.');await hold('READY — press ENTER only after OBS is recording: ');await p.getByRole('button',{name:'Enter Quest VR',exact:true}).click();await wait(()=>orbit()?.gl.xr.isPresenting);await frames(6);
 await capture('01-launcher');

 await press('qari-xr-menu-launcher');await frames();assert(await p.evaluate(()=>orbit().scene.getObjectByName('qari-xr-menu-panel').visible));await capture('02-hand-menu');
 await press('qari-xr-menu-panel',.205);await wait(()=>document.querySelector('.tools').textContent.includes('Resume motion'));await capture('03-paused');
 await press('qari-xr-menu-panel',.09);await capture('04-inspect-menu');
 await press('qari-xr-menu-panel',.205);await frames(15);await capture('05-nearer');
 await press('qari-xr-menu-panel',-.025);await frames(18);await capture('06-return-orbit');
 await press('qari-xr-menu-panel',-.20);await frames();
 await press('qari-letter-0');await wait(()=>document.querySelector('.stage-ui p').textContent.includes('Mirrored pair'));await capture('07-letter-selected');
 await press('qari-action-primary');await wait(()=>document.querySelector('.step').textContent.includes('02 / 02'));await capture('08-living-orbit');
 await press('qari-action-primary');await wait(()=>document.querySelector('.step').textContent.includes('01 / 02'));
 await press('qari-xr-menu-launcher');await frames();
 await press('qari-xr-menu-panel',-.025,'right',true);await p.waitForURL('**/harf-studio-xr.html*',{timeout:30000});

 await p.evaluate(async()=>window.studio=await import('/src/harf-xr/main.ts'));
 await p.getByRole('button',{name:'Enter Quest hand-tracking VR',exact:true}).click();await wait(()=>device.activeSession);await p.waitForTimeout(800);
 const ticks=async(n=3)=>p.evaluate(n=>new Promise(resolve=>{let i=0;const step=()=>{if(++i>=n)resolve();else device.activeSession.requestAnimationFrame(step)};device.activeSession.requestAnimationFrame(step)}),n);
 const boardPoint=async(x,y)=>p.evaluate(({x,y})=>{const b=studio.board;b.updateMatrixWorld(true);const v=b.position.clone().set((x/900-.5)*.72,(.5-y/650)*.52,.012);b.localToWorld(v);return v.toArray()},{x,y});
 const tip=async(x,y,pinch)=>{const target=await boardPoint(x,y);await p.evaluate(({target,pinch})=>{const hand=device.hands.right;hand.connected=true;hand.poseId='point';hand.updatePinchValue(pinch);const f=IWER.oculusHandConfig.poses[pinch?'pinch':'point'].jointTransforms['index-finger-tip'].offsetMatrix;hand.position.set(target[0]+f[12],target[1]-f[13],target[2]-f[14]);},{target,pinch});await ticks(4)};
 const button=async(x,y)=>{await tip(x,y,0);await p.waitForTimeout(180);await tip(x,y,1);await p.waitForTimeout(500);if(!p.url().includes('harf-studio-xr.html'))return;await tip(x,y,0);await p.waitForTimeout(180)};
 const snapshot=()=>p.evaluate(()=>({mode:studio.guide.mode,state:studio.guide.result.state,missing:studio.guide.result.missing,feedback:studio.guide.feedback,strokes:studio.guide.strokes.length,active:studio.guide.active,inspecting:studio.renderer.domElement.dataset.inspecting}));
 for(const [i,id]of ['kaf','lam','fa','ya'].entries()){
  if(i)await button(132+i*212,106);
  assert.equal((await snapshot()).mode,id);assert.notEqual((await snapshot()).state,'complete');
  if(process.env.QARIAI_VIDEO!=='1'){
  // A tap cannot complete a path, and Undo restores a clean sheet.
  await tip(450,280,0);await p.waitForTimeout(180);await tip(450,280,1);await tip(450,280,0);await p.waitForTimeout(180);assert.notEqual((await snapshot()).state,'complete');await button(132,503);
  }
  const strokes=await p.evaluate(()=>studio.guide.rules.parts.map(part=>(part.kind==='path'?part.points:[part.region.center]).map(p=>studio.guide.toBoard(p))));
  for(const points of strokes){
   const first=points[0];await tip(first.x,first.y,0);await p.waitForTimeout(180);await tip(first.x,first.y,1);
   for(let j=1;j<points.length;j++){
    const a=points[j-1],b=points[j],steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/4));
    for(let k=1;k<=steps;k++)await tip(a.x+(b.x-a.x)*k/steps,a.y+(b.y-a.y)*k/steps,1);
   }
   const last=points.at(-1);await tip(last.x,last.y,0);await p.waitForTimeout(180);
  }
  const result=await snapshot();console.log('GUIDE',id,result);report.events.push({guide:id,...result});assert.equal(result.state,'complete',JSON.stringify(result));await tip(880,640,0);await capture('guide-'+id+'-completed');assert(await p.evaluate(()=>studio.board.parent.getObjectByName('qari-tracked-hand-joints').visible));
  if(process.env.QARIAI_VIDEO!=='1'||i===0){await button(132,503);assert.notEqual((await snapshot()).state,'complete');await button(344,503);assert.equal((await snapshot()).state,'complete');}
  await button(768,503);await wait(()=>studio.renderer.domElement.dataset.inspecting==='true');await tip(880,640,0);await capture('guide-'+id+'-sculpture');await button(132,503);await button(344,503);await button(556,503);await button(768,503);assert.equal((await snapshot()).inspecting,'false');
 }
 if(process.env.QARIAI_VIDEO!=='1'){
 // Tracking loss cancels ink and closed reconnect cannot start another stroke.
 await button(556,503);await tip(450,280,0);await p.waitForTimeout(180);await tip(450,280,1);await p.evaluate(()=>device.hands.right.connected=false);await ticks(5);assert.equal((await snapshot()).active,false);assert.notEqual((await snapshot()).state,'complete');
 await p.evaluate(()=>device.hands.right.connected=true);await ticks(5);assert.equal((await snapshot()).active,false);await tip(450,280,0);await p.waitForTimeout(180);
 }
 await button(650,580);await p.waitForURL(origin+'/?**',{timeout:20000});await ready();
 assert.equal(new URL(p.url()).searchParams.get('practice'),'ya');
 await p.getByRole('button',{name:'Enter Quest VR',exact:true}).click();await wait(()=>orbit().gl.xr.isPresenting);await frames(8);await capture('10-orbit-return');
 assert.equal(report.errors.length,0,'Application errors occurred; inspect report');report.success=true;report.limits='Actual full application driven through IWER 2.1.0 WebXR hand joints; four guides, Undo/Redo completion, same-session sculptures. Tracking recovery is exercised in verification mode; video mode omits negative tests. Browser entry buttons use automated clicks. Not physical Quest hardware, human handwriting, stereo comfort or performance certification';
 }catch(e){report.error=String(e);process.exitCode=1;console.error('STOP OBS — rehearsal failed: '+e.message)}finally{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));console.log(report.success?'SEQUENCE COMPLETE — STOP OBS RECORDING NOW.':'STOP OBS — keep report.json for diagnosis.');await hold('After OBS is stopped, press ENTER to close the test browser: ');await browser?.close();server?.kill('SIGTERM');rl.close()}})();
