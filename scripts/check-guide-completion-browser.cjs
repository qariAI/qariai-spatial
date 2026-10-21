const assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const sources={kaf:require('../src/orbit-art/generated/kaf-outline.json'),...Object.fromEntries(Object.entries(require('../src/orbit-art/generated/letter-outlines.json')).map(([k,v])=>[{'ل':'lam','ف':'fa','ي':'ya'}[k],v]))};
const point=(x,y)=>({x,y}),disk=(x,y)=>({center:point(x,y),radius:8});
const path=(id,x,y)=>({kind:'path',id,points:[point(x,y),point(x+60,y)],endpoints:[disk(x,y),disk(x+60,y)]});
const dot=(id,x,y)=>({kind:'dot',id,region:disk(x,y)});
const fixture=mode=>({version:'browser-fixture-only',sourceHash:sources[mode].pathSha256,review:{reference:'synthetic fixture: not a reviewed Arabic guide',annotationsApproved:true,fixturesApproved:true},diagonal:1000,corridor:25,spacing:5,coverage:.9,inside:.95,parts:[path('body',100,100),...(mode==='kaf'?[path('detached',250,100)]:mode==='fa'?[dot('dot',250,100)]:mode==='ya'?[dot('left dot',250,100),dot('right dot',300,100)]:[])],forbidden:[]});
const out=process.env.GUIDE_BROWSER_ARTIFACTS||'/tmp/guide-completion-browser';fs.mkdirSync(out,{recursive:true});
(async()=>{let browser;const report={success:false,errors:[],cases:[],scope:'Actual Harf UI with intercepted synthetic annotations only; no Arabic calibration or 3D rendering claim.'};const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5329','--strictPort']);const hard=setTimeout(()=>{server.kill();process.exit(2)},90000);try{
 await new Promise(r=>setTimeout(r,1400));browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1100,height:900}});p.setDefaultTimeout(10000);p.on('pageerror',e=>report.errors.push(e.message));
 for(const mode of ['kaf','lam','fa','ya']){
  await p.route('**/src/harf-xr/guide-validation/reviews.ts*',route=>route.fulfill({contentType:'text/javascript',body:'export const REVIEWED_GUIDES='+JSON.stringify({[mode]:fixture(mode)})}));
  await p.goto('http://127.0.0.1:5329/harf-studio.html?calligraphyRelief=texture&orbitArt=study&practice='+mode,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('#board').dataset.graded==='guide-following');
  const action=p.locator('#inspectCompleted');assert(await action.isHidden());
  async function screen(q){return p.locator('[data-practice-outline]').evaluate((el,q)=>{const p=new DOMPoint(q.x,q.y).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}},q)}
  async function draw(points,cancel=false){const a=await screen(points[0]);await p.mouse.move(a.x,a.y);await p.mouse.down();assert(await action.isHidden());for(const point of points.slice(1)){const b=await screen(point);await p.mouse.move(b.x,b.y,{steps:5})}if(cancel)await p.locator('#board').dispatchEvent('pointercancel',{pointerId:1});await p.mouse.up()}
  const parts=fixture(mode).parts;
  await draw(parts[0].points,true);assert(await action.isHidden(),'cancel cannot complete guide');await p.locator('#reset').click();
  for(const part of parts)await draw(part.kind==='path'?part.points:[part.region.center]);
  assert(await action.isVisible());assert.equal(await p.locator('#guideCompletion').innerText(),'Practice guide completed');
  assert.equal(await action.getAttribute('href'),'/?calligraphyRelief=texture&orbitArt=study&practice='+mode+'#inspect-practice');
  await p.locator('#guideToggle').click();assert(await action.isVisible());await p.locator('#guideToggle').click();
  await p.locator('#undoStroke').click();assert(await action.isHidden());await p.locator('#redoStroke').click();assert(await action.isVisible());
  await draw([point(350,250),point(500,250)]);assert(await action.isHidden(),'extra ink revokes eligibility');await p.locator('#undoStroke').click();assert(await action.isVisible());
  await p.locator('#reset').click();assert(await action.isHidden());assert.equal(await p.locator('#freeInk path').count(),0);
  await p.unroute('**/src/harf-xr/guide-validation/reviews.ts*');
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForSelector('#undoStroke');assert.equal(await p.locator('#board').getAttribute('data-graded'),'false');assert.equal(await action.count(),0,'no completion control without reviewed annotations');assert.equal(await p.locator('#counter').innerText(),'No score');
  report.cases.push({mode,syntheticCompletion:'passed',cancel:'passed',undoRedoRevocation:'passed',extraInkRevocation:'passed',reset:'passed',guideIndependent:'passed',realRegistryUngraded:'passed'});
 }
 await p.goto('http://127.0.0.1:5329/harf-studio.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('#board').dataset.letter==='ب');assert.equal(await p.locator('#inspectCompleted').count(),0);assert.equal(await p.locator('#undoStroke').count(),0);assert.deepEqual(report.errors,[]);report.success=true;console.log('PASS actual Harf completion controls with synthetic rules, four ungraded production fallbacks and Bāʾ isolation');
 }finally{clearTimeout(hard);fs.writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
