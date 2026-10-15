const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict');
const report={kind:'Nonscriptural material/geometry foundation',renderer:'Chromium SwiftShader software WebGL',viewport:process.env.FOUNDATION_SMALL?[480,720]:[960,720],headsetValidation:false};
const out='docs/celestial-seal-v0.4';
(async()=>{const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5294','--strictPort'],{stdio:'ignore'});let browser;try{
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5294/celestial-seal-foundation.html')).ok)break;}catch{}if(i===59)throw Error('Local fixture server did not become ready in 15s');await new Promise(r=>setTimeout(r,250));}browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await browser.newPage({viewport:{width:report.viewport[0],height:report.viewport[1]}});p.setDefaultTimeout(20000);const errors=report.pageErrors=[];p.on('pageerror',e=>errors.push(e.message));
  report.stage='navigation';
  await p.goto('http://127.0.0.1:5294/celestial-seal-foundation.html',{waitUntil:'commit',timeout:45000});
  // Bounded allowance for cold SwiftShader/shader compilation; same actual-render assertion.
  report.startupBudgetMs=45000;report.stage='actual-render-readiness';
  await p.waitForFunction(()=>document.body.dataset.foundationReady==='true'&&document.body.dataset.foundationSettled==='true',{},{timeout:report.startupBudgetMs});
  assert(await p.locator('body').innerText().then(s=>s.includes('NONSCRIPTURAL GEOMETRY ONLY')));
  assert(!/[\u0600-\u06ff]/u.test(await p.locator('body').innerText()),'No Arabic inscription should be rendered');
  const source=JSON.parse(fs.readFileSync(`${out}/locked-source-snapshots.json`));
  report.stage='synthetic-intake';
  report.intake=await p.evaluate(async source=>{
    const api=await import('/src/seal-foundation/vectorIntake.ts');
    const {runIntakeRegression}=await import('/scripts/fixtures/seal-intake.mjs');
    return runIntakeRegression(source,api);
  },source);
  async function capture(name){if(process.env.FOUNDATION_CAPTURE==='off'){(report.captureStatus??={})[name]=fs.existsSync(`${out}/${name}.png`)?'Existing actual capture retained; diagnostics-only changes since successful capture':'Not captured: further cloud capture attempts disabled after timeout';return;}const cdp=await p.context().newCDPSession(p);let timer;try{const r=await Promise.race([cdp.send('Page.captureScreenshot',{format:'png',fromSurface:false}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native capture timeout; do not keep retrying')),10000);})]);fs.writeFileSync(`${out}/${name}.png`,Buffer.from(r.data,'base64'));}finally{clearTimeout(timer);await cdp.detach();}}
  report.stage='camera-and-profiles';
  report.desktopWide=await p.evaluate(()=>window.foundationDiagnostics.snapshot());
  await capture('wide');
  await p.locator('#close').click();await p.waitForFunction(()=>document.body.dataset.foundationView==='close'&&document.body.dataset.foundationSettled==='true');await capture('close');
  report.desktopMeasurement=await p.evaluate(()=>window.foundationDiagnostics.measureFrames(12));
  await p.locator('#wide').click();await p.waitForFunction(()=>document.body.dataset.foundationSettled==='true'&&document.body.dataset.foundationView==='wide');
  const box=await p.locator('canvas').boundingBox();const x=box.x+box.width*.5,y=box.y+box.height*.5;await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+70,y+20,{steps:6});await p.mouse.up();await p.waitForFunction(()=>document.body.dataset.foundationSettled==='false');
  await p.locator('#wide').click();await p.waitForFunction(()=>document.body.dataset.foundationSettled==='true');report.dragAndReturn='passed';
  await p.locator('#tour').click();await p.waitForFunction(()=>document.body.dataset.foundationTour==='complete',{},{timeout:32000});report.cinematicWideCloseReturn='passed (21-second desktop camera study)';
  await p.locator('#quality').selectOption('quest');await p.waitForFunction(()=>document.body.dataset.foundationQuality==='quest'&&document.body.dataset.foundationReady==='true');
  report.questProfileMeasurement=await p.evaluate(()=>window.foundationDiagnostics.measureFrames(12));await capture('quest-profile');
  assert.deepEqual(report.desktopWide.resources.depthLevels,[-.12,-.08,-.04,0,.04,.08,.12]);
  assert(report.questProfileMeasurement.snapshot.estimatedTextureBytes<report.desktopWide.estimatedTextureBytes,'Quest profile should use less texture memory');
  assert(report.questProfileMeasurement.snapshot.triangles<report.desktopWide.triangles,'Quest profile should use less geometry');
  assert(!report.questProfileMeasurement.snapshot.contextLost);
  assert.deepEqual(report.desktopWide.resources.actualShadowTargets,[[512,512]]);assert.deepEqual(report.questProfileMeasurement.snapshot.resources.actualShadowTargets,[[256,256]]);
  // Actual reduced-motion preference must skip tour travel, without changing artwork.
  await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#tour').click();await p.waitForFunction(()=>document.body.dataset.foundationTour==='reduced-motion');report.reducedMotion='passed';
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.mobileNoHorizontalOverflow=true;
  assert.deepEqual(errors,[]);report.pageErrors=errors;report.stage='complete';report.result='functional-checks-passed';report.performanceComplete=[report.desktopMeasurement.status,report.questProfileMeasurement.status].every(s=>s==='measured');
}catch(e){report.result='failed';report.error=String(e);process.exitCode=1;}finally{const reportPath=process.env.FOUNDATION_REPORT??`${out}/desktop-check.json`;fs.mkdirSync(require('node:path').dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await browser?.close();server.kill('SIGTERM');}})();
