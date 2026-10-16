// Test-only R3F fixture mounts the actual Orbit HandTracking and navigation
// adapter. Synthetic Three joint objects/session events are NOT WebXR or Quest.
const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='docs/quest-readiness';
(async()=>{let browser;const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5282'],{stdio:'ignore'});const report={success:false,method:'Actual HandTracking useFrame callback in minimal R3F fixture, synthetic joints/session events; actual Harf page links',cases:[],errors:[]};try{
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5282/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await browser.newPage();p.setDefaultTimeout(30000);p.on('pageerror',e=>report.errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.abort());
 await p.route('**/src/App.tsx',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nexport {HandTracking};'});});
 await p.route('**/__quest-fixture*',route=>route.fulfill({contentType:'text/html',body:`<div id="root"></div><a id="practice-calligraphy" href="/harf-studio-xr.html">Practice</a><script type="module" src="/__quest-entry.tsx"></script>`}));
 await p.route('**/__quest-entry.tsx',route=>route.fulfill({contentType:'application/javascript',body:`
 import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';const {createRoot}=ReactDOM;import {Canvas,useThree} from '/node_modules/.vite/deps/@react-three_fiber.js';import * as THREE from '/node_modules/.vite/deps/three.js';import {HandTracking} from '/src/App.tsx';import {OrbitPracticeLink} from '/src/integration/OrbitPracticeLink.tsx';
 window.events=[];const hover=()=>{};function Probe(){const s=useThree();React.useEffect(()=>{s.setFrameloop('never');window.state=s;window.ready=true},[]);return null}
 createRoot(document.getElementById('root')).render(React.createElement(Canvas,{frameloop:'never'},React.createElement(Probe),React.createElement(HandTracking,{onHover:hover,onPinch:i=>window.events.push('letter:'+i),onAction:()=>window.events.push('phase'),onDiagnostics:()=>{}}),React.createElement(OrbitPracticeLink)));
 window.THREE=THREE;
 `}));
 // Warm Vite's ordinary dependencies before using its test-only entry.
 await p.goto('http://127.0.0.1:5282/harf-studio-xr.html',{waitUntil:'domcontentloaded'});await p.locator('#surface canvas').waitFor();
 await p.goto('http://127.0.0.1:5282/__quest-fixture?calligraphyRelief=texture',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.ready&&window.state?.internal.subscribers.length);
 await p.evaluate(()=>{
  const s=window.state,T=window.THREE;window.time=1;window.session=new EventTarget();window.session.visibilityState='visible';window.session.end=async()=>window.session.dispatchEvent(new Event('end'));s.gl.xr.getSession=()=>window.session;s.gl.xr.isPresenting=true;s.gl.xr.dispatchEvent({type:'sessionstart'});
  for(let side=0;side<2;side++){const h=s.gl.xr.getHand(side);h.visible=true;for(const key of ['index-finger-tip','thumb-tip','wrist']){if(!h.joints[key]){const joint=new T.Object3D();h.joints[key]=joint;h.add(joint)}h.joints[key].visible=true;}}
  for(let i=0;i<7;i++){const o=new T.Group();o.name='qari-letter-'+i;o.position.set(10+i,1.3,-.6);s.scene.add(o)}const action=new T.Mesh(new T.PlaneGeometry(.6,.3),new T.MeshBasicMaterial({side:T.DoubleSide}));action.name='qari-action-primary';action.position.set(0,1.3,-1);s.scene.add(action);
  window.step=(side,distance,target='letter')=>{window.time+=.1;s.clock.elapsedTime=window.time;for(let j=0;j<2;j++){const h=s.gl.xr.getHand(j);h.visible=j===side;const tip=h.joints['index-finger-tip'];tip.position.set(target==='letter'?10:0,1.3,target==='letter'?-.6:-.9);h.joints['thumb-tip'].position.copy(tip.position).add(new T.Vector3(distance,0,0));h.joints.wrist.position.copy(tip.position).add(new T.Vector3(0,0,.2));}for(const sub of s.internal.subscribers)sub.ref.current(s,.1)};
 });
 for(const side of [0,1])for(const target of ['letter','phase']){
  const result=await p.evaluate(({side,target})=>{const s=window.state,h=s.gl.xr.getHand(side),expected=target==='letter'?'letter:0':'phase';let baseline=window.events.length;const closed=()=>{for(let i=0;i<4;i++)window.step(side,.02,target)};const open=()=>{window.step(side,.05,target);window.step(side,.05,target)};
   s.gl.xr.dispatchEvent({type:'sessionstart'});closed();if(window.events.length!==baseline)throw Error('closed startup action');open();closed();if(window.events.length!==baseline+1||window.events.at(-1)!==expected)throw Error('deliberate pinch did not activate target');
   for(const reason of ['index-finger-tip','thumb-tip','wrist','session','visibility','disconnect']){baseline=window.events.length;if(['index-finger-tip','thumb-tip','wrist'].includes(reason)){h.joints[reason].visible=false;window.step(side,.02,target);h.joints[reason].visible=true}else if(reason==='session'){s.gl.xr.dispatchEvent({type:'sessionend'});s.gl.xr.dispatchEvent({type:'sessionstart'})}else if(reason==='visibility'){window.session.visibilityState='visible-blurred';window.step(side,.02,target);window.session.visibilityState='visible'}else h.dispatchEvent({type:'disconnected'});
    closed();if(window.events.length!==baseline)throw Error(reason+' activated closed recovery');open();closed();if(window.events.length!==baseline+1)throw Error(reason+' did not recover after open');}
   return{side:side===0?'left-slot':'right-slot',target,passed:true};
  },{side,target});report.cases.push(result);
 }
 assert.equal(await p.locator('#practice-calligraphy').getAttribute('href'),'/harf-studio-xr.html?calligraphyRelief=texture');
 await p.locator('#practice-calligraphy').click();await p.waitForURL('**/harf-studio-xr.html?calligraphyRelief=texture');
 assert.equal(await p.locator('#return-orbit').getAttribute('href'),'/?calligraphyRelief=texture');await p.reload({waitUntil:'domcontentloaded'});await p.locator('#desktop-practice').click();await p.waitForURL('**/harf-studio.html?calligraphyRelief=texture');await p.waitForFunction(()=>document.querySelector('#board')?.dataset.letter==='ب');
 const back=p.getByRole('link',{name:/Return to Living Orbit/});assert.equal(await back.getAttribute('href'),'/?calligraphyRelief=texture');assert.equal(await p.getByRole('link',{name:/Open Quest hand practice/}).getAttribute('href'),'/harf-studio-xr.html?calligraphyRelief=texture');
 // Verify actual link destination without spending another software atlas bake.
 await p.route('http://127.0.0.1:5282/?calligraphyRelief=texture',route=>route.fulfill({contentType:'text/html',body:'<p>Navigation destination probe only</p>'}));await back.click();await p.waitForURL('http://127.0.0.1:5282/?calligraphyRelief=texture');
 await p.goto('http://127.0.0.1:5282/harf-studio-xr.html',{waitUntil:'domcontentloaded'});assert.equal(await p.locator('#return-orbit').getAttribute('href'),'/');assert.equal(await p.locator('#desktop-practice').getAttribute('href'),'/harf-studio.html');
 assert.deepEqual(report.errors,[]);report.navigation='Orbit adapter → Harf XR → reload → SVG → correct internal Orbit URL; no-mode default retained';report.success=true;
 }catch(e){report.error=String(e);process.exitCode=1}finally{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/browser-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser?.close();server.kill('SIGTERM')}})();
