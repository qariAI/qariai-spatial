// Production full-scene recovery test. Injection exists ONLY in a separate test
// build and browser network routes; the normal dist and application stay intact.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'recovery-results');fs.mkdirSync(out,{recursive:true});
const playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const chrome=process.env.CHROMIUM_PATH||(process.platform==='win32'?path.join(process.env.PROGRAMFILES||'C:\\Program Files','Google/Chrome/Application/chrome.exe'):'/usr/bin/chromium');
assert(fs.existsSync(chrome),'Set CHROMIUM_PATH to installed Google Chrome');
const report={success:false,platform:process.platform,injected:true,checks:[],screenshots:[],observedErrors:[],limits:'Isolated injected-error production build. Real full-scene rendering and untouched browser screenshots. Linux SwiftShader results are not Windows/Quest acceptance.'};
const save=()=>fs.writeFileSync(path.join(out,'recovery.json'),JSON.stringify(report,null,2)+'\n');let browser,server,normalServer;
const hard=setTimeout(()=>{report.timeout=true;save();browser?.close();process.exit(2)},360000);
const source=fs.readFileSync(path.join(root,'scripts/check-reset-view-browser.cjs'),'utf8');
const observe=new Function('return '+source.slice(source.indexOf('function observeProduction()'),source.indexOf('\nconst close=')))();
(async()=>{try{
 const vite=await import(pathToFileURL(path.join(root,'node_modules/vite/dist/node/index.js')).href);
 const diagnostic=path.join(out,'injected-dist');
 await vite.build({root,build:{outDir:diagnostic,emptyOutDir:true},plugins:[{name:'test-only-recovery-faults',enforce:'pre',transform(code,id){
  if(id.endsWith('/src/orbit-art/kafAsset.ts')){const needle=" const outline=letter==='ك'?kafOutline:outlines[letter];";assert(code.includes(needle));return code.replace(needle,` const fault=(globalThis as any).__reliabilityFault;if(fault){fault.builds++;if(fault.failures-->0)throw Error('TEST ONLY injected sculpture construction failure');}\n`+needle)}
  if(id.endsWith('/src/orbit-art/SculptedKaf.tsx')){assert(code.includes('},0);'));return code.replace('},0);','},(globalThis as any).__reliabilityFault?.delay||0);')}
 }}]});
 server=await vite.preview({root,build:{outDir:diagnostic},preview:{host:'127.0.0.1',port:0,strictPort:true}});const base='http://127.0.0.1:'+server.httpServer.address().port;
 browser=await playwright.chromium.launch({executablePath:chrome,headless:process.platform!=='win32',args:process.platform==='win32'?[]:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-accelerated-2d-canvas']});
 report.chrome=await browser.version();
 async function page(name,fault){const context=await browser.newContext({viewport:{width:1100,height:800},deviceScaleFactor:1});await context.addInitScript(observe);await context.addInitScript(f=>{window.__reliabilityFault={builds:0,...f}},fault);const p=await context.newPage();p.setDefaultTimeout(20000);p.setDefaultNavigationTimeout(30000);p.on('pageerror',e=>report.observedErrors.push({case:name,type:'pageerror',text:e.message}));p.on('console',m=>{if(m.type()==='error')report.observedErrors.push({case:name,type:'console',text:m.text()})});return{p,context}}
 const snap=p=>p.evaluate(()=>window.__resetProbe.snapshot());
 const ready=async p=>{await p.waitForFunction(()=>window.__resetProbe?.snapshot().ready&&window.__resetProbe.submitted,null,{timeout:120000,polling:100});return snap(p)};
 async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png'),timeout:20000});report.screenshots.push({file:name+'.png',genuine:true,injected:true});save()}
 const url=base+'/?calligraphyRelief=texture&orbitArt=study';
 // Genuine network failure: no FontFace/load monkeypatch or fallback atlas.
 {
  const{p,context}=await page('font',{failures:0,delay:0});let requests=0,block=true;
  await context.route('**/fonts/Amiri-Bold.ttf',async route=>{requests++;if(block)await route.abort('failed');else await route.continue()});
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'Retry Amiri font'}).waitFor();
  assert.equal((await snap(p)).art,undefined);assert.equal(await p.evaluate(()=>window.__reliabilityFault.builds),0);
  await shot(p,'injected-font-failed');const first=requests;
  await p.getByRole('button',{name:'Retry Amiri font'}).click();await p.getByRole('button',{name:'Retry Amiri font'}).waitFor();assert(requests>first,'Retry must make a NEW request');assert.equal((await snap(p)).art,undefined);
  block=false;
  // Hold only the next real font request to capture the visible loading state.
  let release;const gate=new Promise(r=>release=r);
  await context.unroute('**/fonts/Amiri-Bold.ttf');
  await context.route('**/fonts/Amiri-Bold.ttf',async route=>{requests++;await gate;await route.continue()});
  await p.getByRole('button',{name:'Retry Amiri font'}).click();await p.getByRole('status').filter({hasText:'Loading the original Amiri font'}).waitFor();await shot(p,'injected-font-retrying');release();
  const recovered=await ready(p);assert.deepEqual(recovered.letters.map(l=>l.letter),['ك','ل','ف','ي','ف','ل','ك']);assert.equal(await p.evaluate(()=>window.__reliabilityFault.builds),4);assert.equal(await p.locator('.asset-notice').count(),0);await shot(p,'injected-font-recovered');
  report.checks.push({name:'Font network rejection blocks all scene/atlas/sculpture construction; repeated Retry makes new requests, then original asset recovers once',pass:true,requests,resources:recovered.resources});await context.close();save();
 }
 {
  const{p,context}=await page('sculpture',{failures:2,delay:1500});
  await p.goto(url+'&practiceLetter=fa&inspect=2#inspect-letter-2',{waitUntil:'domcontentloaded'});
  // Use real selection/inspector controls even if incoming URL grammar changes.
  if(await p.getByRole('dialog').count()===0){await p.keyboard.press('3');await p.getByRole('button',{name:/Inspect letter/}).click()}
  await p.getByRole('button',{name:'Retry loading'}).waitFor({timeout:120000});
  assert.match(await p.getByRole('alert').innerText(),/could not be constructed/);assert(await p.getByRole('button',{name:'Return to Orbit',exact:true}).isEnabled());
  const failed=await snap(p);assert(failed.art);assert(failed.letters.every(l=>!l.letter));await shot(p,'injected-sculpture-failed');
  await p.getByRole('button',{name:'Retry loading'}).click();await p.getByRole('status').filter({hasText:/Loading the sculptural letter/}).waitFor();await shot(p,'injected-sculpture-retrying');
  await p.getByRole('button',{name:'Retry loading'}).waitFor();assert.equal(await p.evaluate(()=>window.__reliabilityFault.builds),2);
  // Return remains functional at terminal failure, and reopening retains it.
  await p.getByRole('button',{name:'Return to Orbit',exact:true}).click();await p.getByRole('dialog').waitFor({state:'detached'});await p.keyboard.press('3');await p.getByRole('button',{name:/Inspect letter/}).click();await p.getByRole('button',{name:'Retry loading'}).waitFor();
  await p.getByRole('button',{name:'Retry loading'}).click();
  // Close while retry is pending: recovery must not reopen/take over camera.
  await p.getByRole('button',{name:'Return to Orbit',exact:true}).click();await p.getByRole('dialog').waitFor({state:'detached'});const recovered=await ready(p);assert.equal(recovered.enabled,true);assert.equal(recovered.art,failed.art);assert.deepEqual(recovered.resources.atlas,failed.resources.atlas);assert.equal(await p.evaluate(()=>window.__reliabilityFault.builds),6);
  await p.keyboard.press('3');await p.getByRole('button',{name:/Inspect letter/}).click();await p.getByRole('button',{name:'Reset inspection',exact:true}).waitFor();await p.waitForFunction(()=>document.querySelector('button')&&window.__resetProbe.snapshot().enabled===false);assert(await p.getByRole('button',{name:'Reset inspection',exact:true}).isEnabled());assert.match(await p.locator('#inspection-title').innerText(),/ف/);await shot(p,'injected-sculpture-recovered-inspector');
  await p.getByRole('button',{name:'Return to Orbit',exact:true}).click();await p.waitForFunction(()=>window.__resetProbe.snapshot().enabled===true);
  report.checks.push({name:'Terminal sculpture failure preserves original art, repeated Retry/new attempts, Return during failure and pending retry, correct native fa inspector after recovery',pass:true,failed,recovered});await context.close();save();
 }
 // Additional focused normal-production guide regression: real registered data,
 // actual destination pages, no route interception and no guide substitution.
 normalServer=await vite.preview({root,build:{outDir:path.join(root,'dist')},preview:{host:'127.0.0.1',port:0,strictPort:true}});
 const normal='http://127.0.0.1:'+normalServer.httpServer.address().port;
 {
  const{p,context}=await page('normal-guides',{});
  const rules=JSON.parse(fs.readFileSync(path.join(root,'src/harf-xr/guide-validation/approved-guides.json')));
  report.guides=[];
  for(const mode of ['kaf','lam','fa','ya']){
   const query='?calligraphyRelief=texture&orbitArt=study&practice='+mode;
   await p.goto(normal+'/harf-studio.html'+query,{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>document.querySelector('#board')?.dataset.graded==='guide-following');
   const action=p.locator('#inspectCompleted');assert(await action.isHidden());
   for(const part of rules[mode].parts){
    const points=part.kind==='path'?part.points:[part.region.center];
    const positions=await p.locator('[data-practice-outline]').evaluate((el,points)=>points.map(q=>{const v=new DOMPoint(q.x,q.y).matrixTransform(el.getScreenCTM());return{x:v.x,y:v.y}}),points);
    await p.mouse.move(positions[0].x,positions[0].y);await p.mouse.down();for(const v of positions.slice(1))await p.mouse.move(v.x,v.y);await p.mouse.up();
   }
   assert.equal(await p.locator('#guideCompletion').innerText(),'Practice guide completed');assert(await action.isVisible());
   await p.locator('#undoStroke').click();assert(await action.isHidden());await p.locator('#redoStroke').click();assert(await action.isVisible());
   assert.equal(await action.getAttribute('href'),'/'+query+'#inspect-practice');
   report.guides.push({mode,registeredCompletion:true,undoRedoEligibility:true,realInspectorHref:true});save();
  }
  // Follow the last real completion destination; other native paths are covered
  // by the normal reset roundtrip (kaf) and recovered inspector above (fa).
  await p.locator('#inspectCompleted').click();await p.waitForURL(u=>u.pathname==='/'&&u.hash==='#inspect-practice');await ready(p);
  await p.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Reset inspection');return b&&!b.disabled});
  assert.match(await p.locator('#inspection-title').innerText(),/ي/);await p.screenshot({path:path.join(out,'normal-ya-inspector.png'),timeout:20000});report.screenshots.push({file:'normal-ya-inspector.png',genuine:true,injected:false});
  await p.getByRole('button',{name:'Return to Orbit',exact:true}).click();await p.waitForFunction(()=>window.__resetProbe.snapshot().enabled===true);await context.close();
  report.checks.push({name:'All four actual production Harf registered guides, Undo/Redo eligibility, real completion URLs and native ya completion/Return',pass:true,injected:false});
 }
 assert(!report.observedErrors.some(e=>e.case==='normal-guides'),'Normal guide/inspector path must have zero console/page errors');
 assert(!report.observedErrors.some(e=>e.type==='pageerror'),'No uncaught exceptions allowed, including injected runs');
 assert(report.observedErrors.every(e=>/Failed to load resource|TEST ONLY injected sculpture construction failure|Sculptural letters unavailable/.test(e.text)), 'Unexpected console error');report.success=true;
 }catch(e){report.failure=String(e.stack||e);throw e}finally{clearTimeout(hard);save();await browser?.close();await server?.httpServer.close();await normalServer?.httpServer.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
