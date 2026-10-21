const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync,spawn}=require('node:child_process');
const {chromium}=require('playwright');
const base='c967786d590b4c0fdf4cab0378b1ae3f0c582932';
const original=f=>execFileSync('git',['show',base+':'+f],{encoding:'utf8'});
for(const f of ['src/harf-xr/tracing.ts','src/harf-xr/ink.ts','src/harf-xr/progress.ts','src/harf-xr/session.ts','src/harf-xr/letters/ba.json','src/harf-xr/letters/definition.ts','src/App.tsx','src/integration/routes.ts'])assert.equal(fs.readFileSync(f,'utf8'),original(f),f+' preserved');
let desktop=fs.readFileSync('src/harf-xr/desktop.ts','utf8').replace("import { orbitArtEnabled } from '../orbit-art/mode';\n",'').replace("import { installSapphireGuide } from './desktop-finish';\n",'').replace('if (orbitArtEnabled(location.search)) installSapphireGuide(board, body);\n','');
assert.equal(desktop,original('src/harf-xr/desktop.ts'),'SVG behavior exactly preserved');
let main=fs.readFileSync('src/harf-xr/main.ts','utf8').replace("import { orbitArtEnabled } from '../orbit-art/mode';\n",'').replace("import { satinSapphire } from './desktop-finish';\n",'').replace('const sapphire = orbitArtEnabled(location.search) ? satinSapphire(ctx) : null;\n','').replace("    const desktopFinish = sapphire !== null && !renderer.xr.isPresenting;\n    ctx.fillStyle=desktopFinish?sapphire!:trace.phase==='body'?'#355565':'#665b40';ctx.fill(bodyOutline);\n    ctx.strokeStyle=desktopFinish?'#7c9aad':'#91a9aa';ctx.lineWidth=1;ctx.stroke(bodyOutline);", "    ctx.fillStyle=trace.phase==='body'?'#355565':'#665b40';ctx.fill(bodyOutline);\n    ctx.strokeStyle='#91a9aa';ctx.lineWidth=1;ctx.stroke(bodyOutline);");
assert.equal(main,original('src/harf-xr/main.ts'),'XR, painting order, ink and interaction preserved outside explicit desktop fill/stroke');
const out='docs/orbit-art-v01/harf-finish-v01';
(async()=>{let browser;const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5324']);const errors=[],report={sourceIntegrity:'passed',variants:[],errors};
 const timeout=setTimeout(()=>{console.error('Bounded Harf test timeout');process.exit(1)},180000);
 try{await new Promise(r=>setTimeout(r,1400));browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 const ba=JSON.parse(fs.readFileSync('src/harf-xr/letters/ba.json','utf8'));
 for(const [name,query,enabled] of [['original','',false],['sapphire','?calligraphyRelief=texture&orbitArt=study',true],['invalid','?orbitArt=study&orbitArt=bad',false]]){
  await page.goto('http://127.0.0.1:5324/harf-studio.html'+query,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#board')?.dataset.letter==='ب');
  assert.equal(await page.locator('#bodyGlow').getAttribute('d'),ba.bodyOutline);assert.equal(await page.locator('#dotGuide').getAttribute('d'),ba.dotOutline);assert.equal(await page.locator('#clipBody').getAttribute('d'),ba.bodyOutline);
  assert.equal(await page.locator('#bodyGlow').getAttribute('fill'),enabled?'url(#sapphireGuide)':'#355565');
  if(name!=='invalid')await page.screenshot({path:out+'/'+name+'-guide.png',timeout:20000});
  const points=await page.evaluate(()=>{const g=document.querySelector('#bodyGuide'),b=document.querySelector('#board'),m=b.getScreenCTM();return Array.from({length:181},(_,i)=>{const p=g.getPointAtLength(g.getTotalLength()*i/180);return {x:m.a*p.x+m.c*p.y+m.e,y:m.b*p.x+m.d*p.y+m.f}})});
  await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();await page.evaluate(points=>{for(const p of points.slice(1))document.querySelector('#board').dispatchEvent(new PointerEvent('pointermove',{pointerId:1,buttons:1,clientX:p.x,clientY:p.y,bubbles:true}))},points);await page.mouse.up();
  await page.waitForFunction(()=>document.querySelector('#counter').textContent==='Body complete · Add the dot');
  const dot=await page.evaluate(()=>{const b=document.querySelector('#board'),p=b.createSVGPoint();p.x=Number(b.dataset.dotX);p.y=Number(b.dataset.dotY);const q=p.matrixTransform(b.getScreenCTM());return {x:q.x,y:q.y}});await page.mouse.click(dot.x,dot.y);
  assert.equal(await page.locator('#counter').innerText(),'Letter complete ✓');assert.equal(await page.locator('#dotDone').getAttribute('visibility'),'visible');
  if(name!=='invalid')await page.screenshot({path:out+'/'+name+'-complete.png',timeout:20000});
  const ink=await page.locator('#ink path').getAttribute('d');if(name==='original')report.ink=ink;else assert.equal(ink,report.ink,'gold ink shape identical');
  await page.locator('#reset').click();assert.equal(await page.locator('#counter').innerText(),'0% traced');await page.locator('#guideToggle').click();assert.equal(await page.locator('#bodyGlow').evaluate(e=>e.style.opacity),'0');await page.locator('#guideToggle').click();assert.equal(await page.locator('#bodyGlow').evaluate(e=>e.style.opacity),'1');
  report.variants.push({name,bodyDotResetGuide:'passed',exactPaths:'passed'});
 }
 delete report.ink;
 for(const [name,query] of [['original',''],['sapphire','?calligraphyRelief=texture&orbitArt=study']]){
  await page.goto('http://127.0.0.1:5324/harf-studio-xr.html'+query,{waitUntil:'domcontentloaded'});await page.waitForSelector('canvas');await page.waitForFunction(()=>document.querySelector('#enter').textContent.includes('desktop ready'));await page.screenshot({path:out+'/'+name+'-spatial-desktop.png',timeout:20000});
  const href=await page.locator('#desktop-practice').getAttribute('href');assert.equal(href,'/harf-studio.html'+query);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/checks.json',JSON.stringify(report,null,2));console.log('PASS exact outlines/validator/ink, original/opt-in/invalid SVG body-dot/reset/hide, desktop spatial captures and links; no browser errors');
 }finally{clearTimeout(timeout);await browser?.close();server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1});
