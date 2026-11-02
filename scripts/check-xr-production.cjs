// Production bundle smoke check. IWER is test-only and never bundled into the app.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{buildSync}=require('esbuild'),{chromium}=require(process.argv[2]);
(async()=>{let server,browser;const out=process.argv[4],report={success:false,renderer:'production Vite bundle + IWER WebXR hands',errors:[],cases:[]};fs.mkdirSync(out,{recursive:true});try{
 const {preview}=await import(path.resolve('node_modules/vite/dist/node/index.js'));server=await preview({root:process.cwd(),preview:{host:'127.0.0.1',port:0}});const base='http://127.0.0.1:'+server.httpServer.address().port;
 const sdk=buildSync({entryPoints:[process.env.IWER_MODULE],bundle:true,write:false,format:'iife',globalName:'IWER'}).outputFiles[0].text;
 browser=await chromium.launch({headless:true,executablePath:process.argv[3],args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-accelerated-2d-canvas']});const p=await browser.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>report.errors.push(e.message));
 await p.addInitScript({content:sdk+`;window.device=new IWER.XRDevice(IWER.metaQuest3,{stereoEnabled:false});device.primaryInputMode='hand';device.position.set(0,1.6,0);for(const [side,x]of [['left',-.2],['right',.2]]){device.hands[side].connected=true;device.hands[side].poseId='point';device.hands[side].position.set(x,1.3,-.4)}device.installRuntime();`});
 for(const [name,url,button]of [['orbit','/?calligraphyRelief=texture&orbitArt=study','Enter Quest VR'],['guide','/harf-studio-xr.html?calligraphyRelief=texture&orbitArt=study&practice=ya','Enter Quest hand-tracking VR']]){
  await p.goto(base+url,{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:button,exact:true}).click({timeout:120000});await p.waitForFunction(()=>device.activeSession);await p.waitForTimeout(1500);
  if(name==='orbit'){assert.equal(await p.locator('.stage-ui').evaluate(e=>getComputedStyle(e).visibility),'hidden');await p.locator('#enter-xr').evaluate(e=>e.click());await p.waitForFunction(()=>!device.activeSession);assert.equal(await p.locator('.stage-ui').evaluate(e=>getComputedStyle(e).visibility),'visible');}
  else{assert.equal(await p.locator('canvas[data-practice]').getAttribute('data-practice'),'ya');assert.equal(await p.locator('canvas[data-practice]').getAttribute('data-guide-complete'),'false');await p.screenshot({path:path.join(out,'production-ya.png')});}
  report.cases.push({name,entered:true});
 }
 assert.deepEqual(report.errors,[]);report.success=true;
 }catch(e){report.error=String(e);process.exitCode=1}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser?.close();await new Promise(resolve=>server?server.httpServer.close(resolve):resolve())}})();
