// Optional test-only SDK: IWER_MODULE points to an installed IWER 2.1.0 entry.
// No emulator dependency or emulator code is shipped with the application.
const {buildSync}=require('esbuild'),{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{let browser;const report={success:false,kind:'IWER 2.1.0 emulated XRFrame joint poses, not physical Quest; recovery gate only; no stereo/render-performance claim',cases:[]};try{
 const modulePath=process.env.IWER_MODULE;if(!modulePath){report.status='unsupported: set IWER_MODULE to an installed IWER 2.1.0 entry';return;}
 const sdk=buildSync({entryPoints:[modulePath],bundle:true,write:false,format:'iife',globalName:'IWER'}).outputFiles[0].text;
 const gate=buildSync({entryPoints:['src/xr/OrbitPinch.ts'],bundle:true,write:false,format:'iife',globalName:'Recovery'}).outputFiles[0].text;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await browser.newPage();p.setDefaultTimeout(15000);
 // A localhost origin is needed for the WebXR API surface.
 await p.route('http://localhost:5284/**',r=>r.fulfill({contentType:'text/html',body:'<canvas></canvas><button id="enter">Enter emulated VR</button>'}));await p.goto('http://localhost:5284/');await p.addScriptTag({content:sdk});await p.addScriptTag({content:gate});
 await p.evaluate(()=>{
  window.device=new IWER.XRDevice(IWER.metaQuest3,{stereoEnabled:false});device.primaryInputMode='hand';device.installRuntime();device.position.set(0,1.6,0);
  window.gates={left:new Recovery.OrbitPinch(),right:new Recovery.OrbitPinch()};window.counts={left:0,right:0};window.frames=0;
  for(const side of ['left','right']){device.hands[side].connected=true;device.hands[side].poseId='point';device.hands[side].updatePinchValue(1)}
  window.start=async()=>{const session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor','hand-tracking']});window.session=session;Object.values(gates).forEach(g=>g.loseTracking());const gl=document.querySelector('canvas').getContext('webgl2');session.updateRenderState({baseLayer:new XRWebGLLayer(session,gl)});const reference=await session.requestReferenceSpace('local-floor');session.addEventListener('end',()=>Object.values(gates).forEach(g=>g.loseTracking()));
   const frame=(_,xrFrame)=>{window.frames++;for(const side of ['left','right']){const source=Array.from(session.inputSources).find(s=>s.handedness===side&&s.hand);const index=source&&xrFrame.getJointPose(source.hand.get('index-finger-tip'),reference),thumb=source&&xrFrame.getJointPose(source.hand.get('thumb-tip'),reference);if(!index||!thumb){gates[side].loseTracking();continue}const a=index.transform.position,b=thumb.transform.position;if(gates[side].update(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)))counts[side]++;}session.requestAnimationFrame(frame)};session.requestAnimationFrame(frame);window.started=true;};
  document.querySelector('#enter').onclick=()=>start();
 });
 const frames=async()=>{const before=await p.evaluate(()=>window.frames);await p.waitForFunction(n=>window.frames>=n+5,before,{polling:50});};
 await p.click('#enter');await p.waitForFunction(()=>window.started);await frames();assert.deepEqual(await p.evaluate(()=>counts),{left:0,right:0});
 for(const side of ['left','right']){
  const before=await p.evaluate(side=>counts[side],side);await p.evaluate(side=>device.hands[side].updatePinchValue(0),side);await frames();await p.evaluate(side=>device.hands[side].updatePinchValue(1),side);await frames();assert.equal(await p.evaluate(side=>counts[side],side),before+1);
  await p.evaluate(side=>device.hands[side].connected=false,side);await frames();await p.evaluate(side=>device.hands[side].connected=true,side);await frames();assert.equal(await p.evaluate(side=>counts[side],side),before+1,'closed reconnect blocked');
  await p.evaluate(side=>device.hands[side].updatePinchValue(0),side);await frames();await p.evaluate(side=>device.hands[side].updatePinchValue(1),side);await frames();assert.equal(await p.evaluate(side=>counts[side],side),before+2);report.cases.push({hand:side,openPinch:'passed',closedReconnect:'blocked',deliberateRecovery:'passed'});
 }
 const before=await p.evaluate(()=>({...counts}));await p.evaluate(()=>session.end());await p.evaluate(()=>window.started=false);await p.click('#enter');await p.waitForFunction(()=>window.started);await frames();assert.deepEqual(await p.evaluate(()=>counts),before,'closed session re-entry blocked');await p.evaluate(()=>session.end());report.success=true;report.status='passed';
 }catch(e){report.error=String(e);process.exitCode=1}finally{fs.mkdirSync('docs/quest-readiness',{recursive:true});fs.writeFileSync('docs/quest-readiness/emulation-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser?.close()}})();
