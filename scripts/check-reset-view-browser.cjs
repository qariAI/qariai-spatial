// Actual production scenes, native frames and genuine PNGs. No artwork, shader,
// validator, camera callback, renderer or destination interception is installed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
let playwright;if(process.env.PLAYWRIGHT_MODULE)playwright=require(process.env.PLAYWRIGHT_MODULE);else{try{playwright=require('playwright')}catch{playwright=require('playwright-core')}}
const candidate=path.resolve(__dirname,'..'),baseline=process.argv[2]&&process.argv[2]!=='-'?path.resolve(process.argv[2]):null;
const out=path.resolve(process.argv[3]||'docs/reset-view-v01/browser');fs.mkdirSync(out,{recursive:true});
const timeout=Number(process.env.RESET_STAGE_MS||120000);assert(timeout>=10000&&timeout<=300000);
const chrome=process.env.CHROMIUM_PATH||(process.platform==='win32'?path.join(process.env.PROGRAMFILES||'C:\\Program Files','Google/Chrome/Application/chrome.exe'):'/usr/bin/chromium');
assert(fs.existsSync(chrome),'Set CHROMIUM_PATH to locally installed Chrome');
const report={success:false,baseline:'454c2f0e552583458ca02f23915a74987537a915',platform:process.platform,errors:[],runs:[],
 limits:'Production full scenes; one browser; native RAF and normal draws. UI Pause is clicked at first DOM commit for matched stationary captures. Linux uses CPU Canvas/SwiftShader; timings are not Windows or Quest measurements. No image editing or pixel-equivalence claim unless measured.'};
let browser;const servers=[];const save=()=>fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');
const hard=setTimeout(()=>{report.timeout=true;save();browser?.close();process.exit(2)},Number(process.env.RESET_TOTAL_MS||600000));

function observeProduction(){
 const probe=window.__resetProbe={store:null,readyFrame:null,readyRoot:null,submitted:false};let id=0;
 const ids=new WeakMap();let next=0;const identity=object=>object?(ids.has(object)?ids.get(object):(ids.set(object,++next),next)):null;
 const find=root=>{const queue=[root.current];let visited=0;while(queue.length&&visited++<20000){const f=queue.pop();if(!f)continue;const value=f.memoizedProps?.value||f.stateNode?.__r3f?.root;if(typeof value?.getState==='function'){const s=value.getState();if(s?.gl?.domElement&&s?.scene?.isScene)probe.store=value}if(f.child)queue.push(f.child);if(f.sibling)queue.push(f.sibling)}};
 window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,renderers:new Map(),inject(value){this.renderers.set(++id,value);return id},onCommitFiberRoot(_id,root){find(root)},onCommitFiberUnmount(){},onPostCommitFiberRoot(){}};
 const pause=()=>{const button=[...document.querySelectorAll('.tools button')].find(b=>b.textContent.includes('Pause motion'));if(button){button.click();return true}return false};
 const pauseObserver=new MutationObserver(()=>{if(pause())pauseObserver.disconnect()});pauseObserver.observe(document,{childList:true,subtree:true});
 probe.snapshot=()=>{
  const s=probe.store?.getState();if(!s)return{ready:false};
  const art=s.scene.getObjectByName('calligraphy-depth-art'),geometries=new Set(),materials=new Set(),textures=new Set(),atlas=new Set();
  s.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry.uuid);for(const m of [].concat(o.material||[])){materials.add(m.uuid);for(const v of Object.values(m))if(v?.isTexture)textures.add(v.uuid)}});
  art?.traverse(o=>{for(const m of [].concat(o.material||[]))for(const key of ['map','bumpMap'])if(m[key])atlas.add(m[key].uuid)});
  const letters=Array.from({length:7},(_,i)=>{const o=s.scene.getObjectByName('qari-letter-'+i);let letter=null;const geometry=[];o?.traverse(c=>{if(c.userData.orbitArt)letter=c.userData.orbitArt.letter;if(c.geometry)geometry.push(c.geometry.uuid)});return{index:i,letter,scale:o?.scale.x,geometry}});
  const listeners=object=>Object.fromEntries(Object.entries(object?._listeners||{}).map(([key,value])=>[key,value.length]).sort(([a],[b])=>a.localeCompare(b)));
  return{ready:!!art?.userData.textureProfile&&letters.every(l=>l.letter),frame:s.gl.info.render.frame,scene:s.scene.uuid,art:art?.uuid,
   resources:{atlas:[...atlas].sort(),geometries:[...geometries].sort(),materials:[...materials].sort(),textures:[...textures].sort()},letters,
   actionTexture:s.scene.getObjectByName('qari-action-primary')?.material?.map?.uuid,
   controls:identity(s.controls),controlListeners:listeners(s.controls),xrListeners:listeners(s.gl.xr),subscribers:s.internal.subscribers.length,
   memory:{...s.gl.info.memory},camera:{position:s.camera.position.toArray(),quaternion:s.camera.quaternion.toArray(),up:s.camera.up.toArray(),zoom:s.camera.zoom,target:s.controls?.target.toArray()},
   enabled:s.controls?.enabled,xr:s.gl.xr.isPresenting,phase:document.querySelector('.step')?.textContent,paused:document.querySelector('.tools')?.textContent.includes('Resume motion'),
   speed:[...document.querySelectorAll('.tools button')].find(b=>b.textContent.includes('Speed'))?.textContent,selected:document.querySelector('#practice-calligraphy')?.dataset.practiceLetter};
 };
 setInterval(()=>{const s=probe.snapshot();if(!s.ready)return;if(probe.readyRoot!==s.art){probe.readyRoot=s.art;probe.readyFrame=s.frame;probe.submitted=false}else if(s.frame>probe.readyFrame)probe.submitted=true},100);
}
const close=(a,b)=>a.every((value,index)=>Math.abs(value-b[index])<1e-6);
function home(s){return close(s.camera.position,[0,98,169])&&close(s.camera.target,[0,0,0])&&s.camera.zoom===1}
async function start(root){const{preview}=await import(pathToFileURL(path.join(root,'node_modules/vite/dist/node/index.js')).href);const server=await preview({root,configFile:path.join(root,'vite.config.ts'),build:{outDir:path.join(root,'dist')},preview:{host:'127.0.0.1',port:0,strictPort:true}});servers.push(server);return'http://127.0.0.1:'+server.httpServer.address().port}
async function exercise(root,label){
 const base=await start(root),context=await browser.newContext({viewport:{width:1100,height:800},deviceScaleFactor:1});await context.addInitScript(observeProduction);
 const p=await context.newPage();p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(30000);
 const run={label,root,checks:[],resets:[],screenshots:[],errors:[]};report.runs.push(run);save();
 p.on('pageerror',e=>{run.errors.push(String(e));save()});p.on('console',m=>{if(m.type()==='error'){run.errors.push(m.text());save()}});
 const cdp=await context.newCDPSession(p);
 const snap=()=>p.evaluate(()=>window.__resetProbe.snapshot());
 async function ready(){await p.waitForFunction(()=>window.__resetProbe?.snapshot().ready&&window.__resetProbe.submitted,null,{timeout,polling:100});return snap()}
 async function shot(name){await p.mouse.move(5,5);const file=label+'-'+name+'.png';const start=Date.now();await p.screenshot({path:path.join(out,file),timeout:20000,animations:'allow'});run.screenshots.push({file,captureMs:Date.now()-start,genuine:true});save()}
 async function domListeners(){const values={};for(const expression of ['document','document.querySelector("canvas")']){const r=await cdp.send('Runtime.evaluate',{expression,objectGroup:'reset-listeners'});const result=await cdp.send('DOMDebugger.getEventListeners',{objectId:r.result.objectId});values[expression]=result.listeners.map(v=>v.type+':'+v.useCapture).sort()}await cdp.send('Runtime.releaseObjectGroup',{objectGroup:'reset-listeners'});return values}
 async function reset(name){
  const before=await snap(),listeners=await domListeners(),start=Date.now();await p.getByRole('button',{name:/Reset view/}).click();
  await p.waitForFunction(({old,fixed})=>{const probe=window.__resetProbe,s=probe.snapshot();return s.ready&&probe.submitted&&s.frame>old.frame&&
   (fixed?s.art===old.art:s.art!==old.art)&&Math.abs(s.camera.position[0])<1e-6&&Math.abs(s.camera.position[1]-98)<1e-6&&Math.abs(s.camera.position[2]-169)<1e-6&&
   s.camera.target.every(v=>Math.abs(v)<1e-6)&&s.camera.zoom===1}, {old:before,fixed:label==='fixed'},{timeout,polling:50});
  const ms=Date.now()-start,after=await snap();assert(home(after));
  const attempt={name,ms,before,after,domListenersBefore:listeners,domListenersAfter:await domListeners(),success:false};run.resets.push(attempt);save();
  if(label==='fixed'){
   assert.equal(after.scene,before.scene);assert.equal(after.art,before.art);assert.equal(after.controls,before.controls);assert.deepEqual(after.resources,before.resources);
   assert.deepEqual(after.letters.map(l=>l.geometry),before.letters.map(l=>l.geometry));assert.deepEqual(after.memory,before.memory);
   assert.deepEqual(after.controlListeners,before.controlListeners);assert.deepEqual(after.xrListeners,before.xrListeners);assert.equal(after.subscribers,before.subscribers);
   assert.deepEqual(await domListeners(),listeners);assert.equal(after.paused,before.paused);assert.equal(after.speed,before.speed);assert.equal(after.phase,before.phase);assert.equal(after.selected,before.selected);
  }else{assert.notEqual(after.art,before.art);assert.notDeepEqual(after.resources.atlas,before.resources.atlas);assert.notDeepEqual(after.letters[0].geometry,before.letters[0].geometry)}
  attempt.success=true;save();return after;
 }
 try{
  const t=Date.now();await p.goto(base+'/?calligraphyRelief=texture&orbitArt=study',{waitUntil:'domcontentloaded'});run.initial=await ready();run.startupMs=Date.now()-t;
  assert(run.initial.paused,'Matched capture must begin with native UI Pause');assert.deepEqual(run.initial.letters.map(l=>l.letter),['ك','ل','ف','ي','ف','ل','ك']);await shot('home');
  await p.getByRole('button',{name:/Explore Calligraphy/}).click();await p.waitForFunction(()=>Math.abs(window.__resetProbe.snapshot().camera.position[2]-84)<.01,null,{timeout,polling:100});
  await reset('from-explore');await shot('after-reset');run.checks.push('original home framing restored after Explore; genuine matched-pose screenshots');
  if(label==='fixed'){
   for(let i=0;i<5;i++){
    await p.mouse.move(500,220);await p.mouse.down();await p.mouse.move(570,250,{steps:4});await p.mouse.up();await p.mouse.wheel(0,-120);
    const after=await reset('drag-wheel-'+(i+1));const frame=after.frame;
    await p.waitForFunction(f=>window.__resetProbe.snapshot().frame>=f+5,frame,{timeout,polling:100});assert(home(await snap()),'no residual damping/tween drift after reset');
   }
   for(let index=0;index<7;index++){await p.keyboard.press(String(index+1));await p.waitForFunction(index=>window.__resetProbe.snapshot().letters.every((l,j)=>j===index||j===6-index?l.scale>1.3:Math.abs(l.scale-1)<.01),index,{timeout:15000,polling:100})}
   run.checks.push('all seven keyboard selections and mirror/centre scales');
   const phaseOne=await snap();
   await p.getByRole('button',{name:'1× Speed',exact:true}).click();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>document.querySelector('.step').textContent.includes('02 / 02'));
   // The DOM phase label and native R3F tree commit separately. Wait for the
   // actual primary-action texture replacement before taking reset identities.
   await p.waitForFunction(old=>{const s=window.__resetProbe.snapshot();return s.actionTexture!==old.actionTexture&&s.frame>old.frame+2},phaseOne,{timeout,polling:100});
   await reset('phase-two-paused-selected-speed-two');
   await p.getByRole('button',{name:/Resume motion/}).click();await p.waitForFunction(()=>document.querySelector('.tools').textContent.includes('Pause motion'));
   await reset('phase-two-moving-selected-speed-two');
   await p.getByRole('button',{name:/Pause motion/}).click();await p.waitForFunction(()=>document.querySelector('.tools').textContent.includes('Resume motion'));
   const before=await snap();await p.getByRole('button',{name:/Inspect letter/}).click();await p.getByRole('button',{name:'Reset inspection',exact:true}).waitFor();
   await p.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Reset inspection').disabled,null,{timeout});
   await p.getByRole('button',{name:'Return to Orbit',exact:true}).click();
   await p.waitForFunction(()=>!document.querySelector('.letter-inspection')&&window.__resetProbe.snapshot().enabled===true,null,{timeout,polling:100});
   const after=await snap();run.inspectionReturn={before,after};save();
   assert(close(before.camera.position,after.camera.position));assert(close(before.camera.quaternion,after.camera.quaternion));assert.equal(after.enabled,true);assert.equal(after.paused,true);assert.equal(after.speed,before.speed);
   run.checks.push('native same-document inspection/Return camera, controls, pause and speed');
   await p.keyboard.press('ArrowLeft');await p.waitForFunction(()=>document.querySelector('.step').textContent.includes('01 / 02'));await p.keyboard.press('1');
   await p.waitForFunction(()=>document.querySelector('#practice-calligraphy').dataset.practiceLetter==='ك');await p.locator('#practice-calligraphy').click();
   await p.waitForURL(url=>url.pathname==='/harf-studio.html');assert.equal(new URL(p.url()).searchParams.get('orbitArt'),'study');assert.equal(new URL(p.url()).searchParams.get('calligraphyRelief'),'texture');
   await p.waitForFunction(()=>document.querySelector('#board')?.dataset.graded==='guide-following');
   const rules=JSON.parse(fs.readFileSync(path.join(root,'src/harf-xr/guide-validation/approved-guides.json'))).kaf;
   for(const part of rules.parts){const points=part.kind==='path'?part.points:[part.region.center];const positions=await p.locator('[data-practice-outline]').evaluate((el,points)=>points.map(q=>{const v=new DOMPoint(q.x,q.y).matrixTransform(el.getScreenCTM());return{x:v.x,y:v.y}}),points);await p.mouse.move(positions[0].x,positions[0].y);await p.mouse.down();for(const v of positions.slice(1))await p.mouse.move(v.x,v.y);await p.mouse.up()}
   assert.equal(await p.locator('#guideCompletion').innerText(),'Practice guide completed');await p.locator('#inspectCompleted').click();await p.waitForURL(url=>url.pathname==='/'&&url.hash==='#inspect-practice');await ready();
   await p.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Reset inspection');return b&&!b.disabled},null,{timeout});await shot('harf-native-inspection');
   await p.getByRole('button',{name:'Return to Orbit',exact:true}).click();await p.waitForFunction(()=>!document.querySelector('.letter-inspection')&&window.__resetProbe.snapshot().enabled===true,null,{timeout,polling:100});
   // A cold close-up has not uploaded every wide-scene object yet. Let the
   // actual wide view render before comparing GPU counters across Reset.
   const returnedFrame=(await snap()).frame;
   await p.waitForFunction(frame=>window.__resetProbe.snapshot().frame>=frame+3,returnedFrame,{timeout,polling:100});
   await reset('after-harf-return');
   run.checks.push('real Harf registered kaf guide and completion-to-full-scene inspection/Return; flags retained; reset works after navigation');
  }
  assert.deepEqual(run.errors,[]);run.success=true;
 }catch(e){run.failure=String(e);run.failureStack=e.stack;try{await shot('failure')}catch(capture){run.captureFailure=String(capture)}throw e}
 finally{save();await context.close()}
}
(async()=>{try{
 browser=await playwright.chromium.launch({executablePath:chrome,headless:process.platform!=='win32',args:process.platform==='win32'?[]:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-accelerated-2d-canvas']});
 const cdp=await browser.newBrowserCDPSession();report.chrome=await cdp.send('Browser.getVersion');report.gpu=await cdp.send('SystemInfo.getInfo');await cdp.detach();
 if(baseline)await exercise(baseline,'baseline');await exercise(candidate,'fixed');
 if(baseline){const a=report.runs[0].resets[0].after,b=report.runs[1].resets[0].after;assert(close(a.camera.position,b.camera.position));assert(close(a.camera.quaternion,b.camera.quaternion));assert.deepEqual(a.camera.target,b.camera.target);assert.equal(a.camera.zoom,b.camera.zoom);report.sameHomeFraming=true}
 report.success=true;
}catch(e){report.failure=String(e);process.exitCode=1}finally{save();clearTimeout(hard);await browser?.close();for(const server of servers)await new Promise(resolve=>server.httpServer.close(resolve));console.log(JSON.stringify({success:report.success,failure:report.failure,runs:report.runs.map(r=>({label:r.label,startupMs:r.startupMs,resets:r.resets.map(v=>({name:v.name,ms:v.ms})),errors:r.errors}))},null,2))}})();
