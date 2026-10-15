// Actual browser rendering; bounded native captures, no artwork synthesis or image enhancement.
const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const out='docs/celestial-seal-v0.4/polish',report={checkedAt:new Date().toISOString(),renderer:'Chromium SwiftShader software WebGL',viewport:[960,720],headsetValidation:false,captures:{}};
(async()=>{let browser;const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5295'],{stdio:'ignore'});fs.mkdirSync(out,{recursive:true});
try{
  for(let n=0;n<60;n++){try{if((await fetch('http://127.0.0.1:5295/celestial-seal-foundation.html')).ok)break;}catch{}if(n===59)throw Error('Vite not ready within 15 seconds');await new Promise(r=>setTimeout(r,250));}
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await browser.newPage({viewport:{width:960,height:720}});p.setDefaultTimeout(30000);const errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
  await p.goto('http://127.0.0.1:5295/celestial-seal-foundation.html',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.body.dataset.foundationReady==='true'&&document.body.dataset.foundationSettled==='true',{},{timeout:40000});
  assert((await p.locator('body').innerText()).includes('NONSCRIPTURAL GEOMETRY ONLY'));assert(!/[\u0600-\u06ff]/u.test(await p.locator('body').innerText()));
  async function capture(name){const cdp=await p.context().newCDPSession(p);let timer;try{
    const r=await Promise.race([cdp.send('Page.captureScreenshot',{format:'png',fromSurface:false}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native screenshot timed out after 10s; no retry')),10000);})]);
    const bytes=Buffer.from(r.data,'base64');fs.writeFileSync(`${out}/${name}.png`,bytes);report.captures[name]={result:'captured',sha256:createHash('sha256').update(bytes).digest('hex'),method:'CDP Page.captureScreenshot, native browser view, fromSurface:false; no rescaling or enhancement'};
  }catch(e){report.captures[name]={result:'unavailable',error:String(e)};report.captureLimitation='Capture timeout: no lengthy retries. Functional checks remain independent.';}finally{clearTimeout(timer);await cdp.detach();}}
  report.desktopWide=await p.evaluate(()=>window.foundationDiagnostics.snapshot());await capture('wide');
  await p.locator('#close').click();await p.waitForFunction(()=>document.body.dataset.foundationView==='close'&&document.body.dataset.foundationSettled==='true');
  report.desktopClose=await p.evaluate(()=>window.foundationDiagnostics.snapshot());if(!report.captureLimitation)await capture('close');
  // Shrink only after matched evidence; performance is explicitly at this smaller viewport.
  await p.setViewportSize({width:480,height:720});report.performanceViewport=[480,720];
  report.desktopMeasurement=await p.evaluate(()=>window.foundationDiagnostics.measureFrames(12));
  await p.locator('#wide').click();await p.waitForFunction(()=>document.body.dataset.foundationView==='wide'&&document.body.dataset.foundationSettled==='true');report.approachAndReturn='passed';
  await p.locator('#tour').click();await p.waitForFunction(()=>document.body.dataset.foundationTour==='complete',{},{timeout:36000});report.wideCloseWideTour='passed';
  await p.locator('#quality').selectOption('quest');await p.waitForFunction(()=>document.body.dataset.foundationQuality==='quest'&&document.body.dataset.foundationReady==='true');
  report.questMeasurement=await p.evaluate(()=>window.foundationDiagnostics.measureFrames(12));
  for(const s of [report.desktopWide,report.desktopClose,report.questMeasurement.snapshot]){assert.equal(s.drawCalls,4);assert(!s.contextLost);assert.deepEqual(s.resources.depthLevels,[-.12,-.08,-.04,0,.04,.08,.12]);}
  assert.equal(report.desktopWide.triangles,9578);assert.equal(report.questMeasurement.snapshot.triangles,6274);
  assert.deepEqual(report.desktopWide.resources.actualShadowTargets,[[512,512]]);assert.deepEqual(report.questMeasurement.snapshot.resources.actualShadowTargets,[[256,256]]);
  await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#tour').click();await p.waitForFunction(()=>document.body.dataset.foundationTour==='reduced-motion');report.reducedMotion='passed';
  await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.mobileOverflow='passed';
  assert.deepEqual(errors,[]);assert(!requests.some(u=>/\.(svg|woff2?|ttf|otf)(\?|$)/.test(u)));report.noArabicVectorOrFontRequests=true;report.pageErrors=errors;report.result='passed';
}catch(e){report.result='failed';report.error=String(e);process.exitCode=1;}finally{fs.writeFileSync(`${out}/browser-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await browser?.close();server.kill('SIGTERM');}
})();
