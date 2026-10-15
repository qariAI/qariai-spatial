const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict');
const report={kind:'Nonscriptural material/geometry foundation',renderer:'Chromium SwiftShader software WebGL',viewport:process.env.FOUNDATION_SMALL?[480,720]:[960,720],headsetValidation:false};
const out='docs/celestial-seal-v0.4';
(async()=>{const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5294'],{stdio:'ignore'});let browser;try{
  await new Promise(r=>setTimeout(r,1800));browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await browser.newPage({viewport:{width:report.viewport[0],height:report.viewport[1]}});p.setDefaultTimeout(20000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5294/celestial-seal-foundation.html',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.body.dataset.foundationReady==='true'&&document.body.dataset.foundationSettled==='true');
  assert(await p.locator('body').innerText().then(s=>s.includes('NONSCRIPTURAL GEOMETRY ONLY')));
  assert(!/[\u0600-\u06ff]/u.test(await p.locator('body').innerText()),'No Arabic inscription should be rendered');
  const source=JSON.parse(fs.readFileSync(`${out}/locked-source-snapshots.json`));
  report.intake=await p.evaluate(async source=>{
    const {validateVectorIntake}=await import('/src/seal-foundation/vectorIntake.ts');
    // Deliberately geometric schema fixtures; names/records are synthetic, not expert approvals.
    const paths=[{id:'geometric-body',d:'M0 0L10 0L10 10L0 10Z',fillRule:'nonzero',role:'body',wordIds:Array.from({length:18},(_,i)=>i+1),sourceCodepoints:Array.from(source.primary.words.join(' ')).flatMap((c,i)=>c===' '?[]:[i]),level:3},... [5,12].map(n=>({id:`geometric-pause-${n}`,d:`M${n*10} 0l5 5l-5 0z`,fillRule:'nonzero',role:'pause',wordIds:[n],ownerWordId:n,sourceCodepoints:[n===5?41:92],level:3}))];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${paths.map(p=>`<path id="${p.id}" fill-rule="${p.fillRule}" d="${p.d}"/>`).join('')}</svg>`;
    const bytes=new TextEncoder().encode(svg),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const fixture={kind:'approved-original-calligraphy',assetSha256:hash,canonicalText:source.primary.words.join(' '),sourceSha256:'fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc',sourceUrl:source.primary.url,viewBox:[0,0,200,200],coordinates:'svg-y-down',paths,words:source.primary.words.map((text,i)=>({id:i+1,text,course:i<5?1:i<12?2:i<14?3:4,pathIds:paths.filter(p=>p.wordIds.includes(i+1)).map(p=>p.id)})),approvals:['calligrapher','quran-text'].map(role=>({role,reviewer:'SYNTHETIC FIXTURE, NOT AN EXPERT',date:'2000-01-01',assetSha256:hash,record:'synthetic:test-only'})),rights:{holder:'SYNTHETIC FIXTURE',grantRecord:'synthetic:test-only',webXR:true,technical3DAdaptation:true,publicSourceDistribution:true,film:true}};
    await validateVectorIntake(fixture,bytes);const passed=[];
    for(const [name,change] of [
      ['missing original bundle',a=>{a.kind='font-proof';}],['altered verse',a=>{a.canonicalText+=' ';}],['wrong asset hash',a=>{a.assetSha256='0'.repeat(64);}],['missing approval',a=>{a.approvals=[];}],['missing rights',a=>{a.rights.technical3DAdaptation=false;}],['nonboolean rights',a=>{a.rights.technical3DAdaptation='false';}],['displaced mark',a=>{a.paths[1].level=6;}],['wrong path',a=>{a.paths[0].d='M0 0L12 0L10 10Z';}],['wrong reading order',a=>{[a.words[0],a.words[1]]=[a.words[1],a.words[0]];}],['missing mapped pause',a=>{a.paths[1].role='body';}],['wrong mark identity',a=>{a.paths[1].sourceCodepoints=[0];}],['mismatched word mapping',a=>{a.words[0].pathIds=[];}],
    ]){const a=structuredClone(fixture);change(a);let rejected=false;try{await validateVectorIntake(a,bytes);}catch{rejected=true;}if(!rejected)throw Error(`Intake did not reject ${name}`);passed.push(name);}
    const liveFontBytes=new TextEncoder().encode('<svg><text>NONScriptural test</text></svg>');const fontHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',liveFontBytes))).map(b=>b.toString(16).padStart(2,'0')).join('');const fontFixture=structuredClone(fixture);fontFixture.assetSha256=fontHash;fontFixture.approvals.forEach(a=>a.assetSha256=fontHash);let blocked=false;try{await validateVectorIntake(fontFixture,liveFontBytes);}catch{blocked=true;}if(!blocked)throw Error('Font-text SVG accepted');
    return {syntheticGeometricSchemaFixtureAccepted:true,rejections:passed,fontProofRejected:true,limitations:'Schema/digest gate only. Synthetic fixtures are not actual Arabic art, rights grants or expert approvals; external records require human inspection.'};
  },source);
  async function capture(name){if(process.env.FOUNDATION_CAPTURE==='off'){(report.captureStatus??={})[name]=fs.existsSync(`${out}/${name}.png`)?'Existing actual capture retained; diagnostics-only changes since successful capture':'Not captured: further cloud capture attempts disabled after timeout';return;}const cdp=await p.context().newCDPSession(p);let timer;try{const r=await Promise.race([cdp.send('Page.captureScreenshot',{format:'png',fromSurface:false}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Native capture timeout; do not keep retrying')),10000);})]);fs.writeFileSync(`${out}/${name}.png`,Buffer.from(r.data,'base64'));}finally{clearTimeout(timer);await cdp.detach();}}
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
  assert.deepEqual(errors,[]);report.pageErrors=errors;report.result='functional-checks-passed';report.performanceComplete=[report.desktopMeasurement.status,report.questProfileMeasurement.status].every(s=>s==='measured');
}catch(e){report.result='failed';report.error=String(e);process.exitCode=1;}finally{fs.writeFileSync(`${out}/desktop-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await browser?.close();server.kill('SIGTERM');}})();
