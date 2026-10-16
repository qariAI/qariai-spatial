// Actual application WebGL. Immutable PR28 factories provide comparison-only
// materials/mesh; only the hero material and its auxiliary texture lane change.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const {SOURCE,baselineBundle}=require('./relief-v02-helpers.cjs'),root=path.resolve(__dirname,'..'),out=path.join(root,'docs/raised-calligraphy-v0.2',process.env.TEXTURE_REGRESSION_ONLY?'runtime-regression':'');
const report={source:SOURCE,success:false,errors:[],captures:[],method:'Actual Living Orbit WebGL with immutable PR28 comparison factories; shared unchanged face atlas; hero auxiliary lane/material swapped; test-only mesh for physical comparison; all views paused/unselected with identical camera/target/detail',limitations:['Software WebGL and deterministic 50ms stepping do not establish real-time smoothness, stereo legibility or Quest performance.','Test-only Fragment mounting avoids development StrictMode duplicate baking. Physical comparator CPU buffers exist only in the harness, never in the v0.2 runtime.','First frame samples include comparison texture uploads/compilation; warm samples are noisy synchronous browser wall times, not hardware GPU timers.']};
let server,browser;const start=Date.now();function save(){fs.mkdirSync(out,{recursive:true});report.elapsedMs=Date.now()-start;fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(report,null,2));}
const deadline=require.main===module?setTimeout(()=>{report.error='Single 240-second capture budget exceeded; no repeated lengthy captures';save();server?.kill();void browser?.close();setTimeout(()=>process.exit(1),1000)},240000):null;
if(require.main===module)(async()=>{try{
 const oldCode=baselineBundle(root);server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5276'],{cwd:root,stdio:'ignore'});
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:5276/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-accelerated-2d-canvas']});
 const p=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});p.setDefaultTimeout(20000);let fiber;
 const wait=(fn,arg,options={})=>p.waitForFunction(fn,arg,{...options,polling:100});
 p.on('response',r=>{if(r.url().includes('@react-three_fiber.js'))fiber=r.url()});p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/i.test(m.text()))report.errors.push(m.text())});
 await p.route('https://fonts.googleapis.com/**',r=>r.abort());await p.route('**/src/main.tsx',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replaceAll('React.StrictMode','React.Fragment')})});
 await p.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{}});
 await p.goto('http://127.0.0.1:5276/?calligraphyRelief=texture',{waitUntil:'domcontentloaded',timeout:60000});
 await wait(()=>document.querySelector('.tools')&&document.querySelector('canvas'),null,{timeout:120000});assert(fiber);
 await p.evaluate(async url=>{const m=await import(url);for(let i=0;!m._roots.get(document.querySelector('canvas'))&&i<300;i++)await new Promise(r=>setTimeout(r,50));window.__state=()=>m._roots.get(document.querySelector('canvas')).store.getState();window.__time=0;
  window.__step=()=>{const s=window.__state(),render=s.gl.render;s.setFrameloop('never');s.clock.elapsedTime=window.__time;s.gl.render=()=>{};try{for(let i=0;i<180;i++){window.__time+=.05;s.advance(window.__time,true)}}finally{s.gl.render=render}};
  window.__button=text=>{const b=Array.from(document.querySelectorAll('.tools button')).find(b=>b.textContent.includes(text));if(!b)throw Error('Missing control '+text);b.click()};window.__state().setFrameloop('never');window.__state().setDpr(1);window.__button('Pause motion');
 },fiber);
 await wait(()=>document.querySelector('.tools').textContent.includes('Resume motion'));
 await wait(()=>window.__state().scene.getObjectByName('calligraphy-depth-art')?.userData.textureProfile,null,{timeout:120000});
 report.runtime=await p.evaluate(()=>{window.__step();const s=window.__state(),art=s.scene.getObjectByName('calligraphy-depth-art');s.gl.render(s.scene,s.camera);s.gl.getContext().finish();return{profile:art.userData.textureProfile,physicalGroupPresent:!!art.getObjectByName('hero-native-mask-relief'),render:{...s.gl.info.render},memory:{...s.gl.info.memory}}});
 assert(!report.runtime.physicalGroupPresent);assert.equal(report.runtime.profile.addedTriangles,0);console.log('TEXTURE RUNTIME READY',Date.now()-start);save();
 if(process.env.TEXTURE_REGRESSION_ONLY){
  await p.evaluate(()=>window.__button('Explore Calligraphy'));await wait(()=>document.querySelector('.tools').textContent.includes('Return to Orbit'));await p.evaluate(()=>window.__step());assert(await p.evaluate(()=>Math.abs(window.__state().camera.position.z-84)<.01));
  await p.evaluate(()=>window.__button('Return to Orbit'));await wait(()=>document.querySelector('.tools').textContent.includes('Explore Calligraphy'));await p.evaluate(()=>window.__step());assert(await p.evaluate(()=>Math.abs(window.__state().camera.position.z-169)<.01));
  await p.keyboard.press('1');await wait(()=>document.querySelector('.stage-ui p').textContent.includes('Mirrored pair'));await wait(()=>{window.__step();return [0,6].every(i=>window.__state().scene.getObjectByName('qari-letter-'+i).scale.x>1.15)},null,{timeout:20000});
  await p.keyboard.press('ArrowRight');await wait(()=>document.querySelector('.step').textContent.includes('02 / 02'));await p.keyboard.press('ArrowLeft');await wait(()=>document.querySelector('.step').textContent.includes('01 / 02'));
  await p.evaluate(()=>{const s=window.__state();window.__step();s.gl.render(s.scene,s.camera);s.gl.getContext().finish()});assert.deepEqual(report.errors,[]);report.success=true;report.method='Actual texture-only runtime: rendered Explore/Return, mirrored pair and exactly two phases; no physical comparator created';report.regressions='passed';return;
 }
 await p.addScriptTag({content:oldCode});
 report.comparator=await p.evaluate(()=>{const s=window.__state(),art=s.scene.getObjectByName('calligraphy-depth-art'),band=art.children[1],maps={map:band.material.map,bump:band.material.bumpMap};
  const begin=performance.now(),old=PR28.engravedAtlas(1,4096,true),oldBakeMs=performance.now()-begin;
  const pixels=c=>{if(!c.data)return c.getContext('2d').getImageData(0,344,4096,336);const d=new Uint8ClampedArray(4096*336*4);for(let y=0;y<336;y++)d.set(c.data.subarray((1023-344-y)*4096*4,(1024-344-y)*4096*4),y*4096*4);return new ImageData(d,4096,336);};
  const texturePixels=pixels(maps.bump.image),originalPixels=pixels(old.bump.image);
  const details=art.children.filter(o=>o.material?.userData.detail).map(o=>o.material.userData.detail);
  maps.raised=old.raised;const originals=PR28.comparisonMaterials(maps,details),physicalMaterials=PR28.comparisonRaisedMaterials(maps,details),physical=PR28.comparisonGroup(old.raised,physicalMaterials);physical.visible=false;physical.name='comparison-only-physical-relief';art.add(physical);
  window.__putLane=pixels=>{if(maps.bump.image.data){for(let y=0;y<336;y++)maps.bump.image.data.set(pixels.data.subarray(y*4096*4,(y+1)*4096*4),(1023-344-y)*4096*4);}else maps.bump.image.getContext('2d').putImageData(pixels,0,344);maps.bump.needsUpdate=true;};
  window.__comparison={art,band,maps,textureMaterial:band.material,originalMaterial:originals[1],texturePixels,originalPixels,physical,measurement:old.raised.measurement,details};old.map.dispose();old.bump.dispose();return{oldBakeMs,physical:old.raised.measurement};
 });console.log('COMPARATOR READY',Date.now()-start);
 for(const view of ['wide','explore','oblique']){
  if(view==='explore'){await p.evaluate(()=>window.__button('Explore Calligraphy'));await wait(()=>document.querySelector('.tools').textContent.includes('Return to Orbit'))}
  if(view==='oblique')await p.evaluate(()=>{const s=window.__state();s.controls.dispatchEvent({type:'start'});s.camera.position.set(12,12,82);s.controls.target.set(0,-2.7,44);s.controls.update()});
  await p.evaluate(()=>window.__step());
  for(const variant of ['original','texture','physical']){
   const frame=await p.evaluate(({view,variant})=>{const s=window.__state(),c=window.__comparison,d=c.details[1].value;
    c.band.material=variant==='texture'?c.textureMaterial:c.originalMaterial;c.originalMaterial.bumpScale=.82*d;
    window.__putLane(variant==='texture'?c.texturePixels:c.originalPixels);
    c.physical.visible=variant==='physical'&&d>.15;c.physical.scale.z=Math.max(.00001,d);c.physical.position.z=.48*(1-d);
    s.scene.updateMatrixWorld(true);s.camera.updateMatrixWorld(true);const times=[];for(let i=0;i<3;i++){const t=performance.now();s.gl.render(s.scene,s.camera);s.gl.getContext().finish();times.push(performance.now()-t)}
    const textureSet=new Set();s.scene.traverse(o=>{for(const m of(o.material?(Array.isArray(o.material)?o.material:[o.material]):[]))for(const t of Object.values(m))if(t?.isTexture)textureSet.add(t)});
    const textureBytesEstimate=Array.from(textureSet).reduce((n,t)=>n+(t.image?.width||0)*(t.image?.height||0)*4*(t.generateMipmaps?4/3:1),0);
    const result={png:s.gl.domElement.toDataURL('image/png'),camera:s.camera.position.toArray(),target:s.controls.target.toArray(),detail:c.details.map(o=>o.value),letters:Array.from({length:7},(_,i)=>{const o=s.scene.getObjectByName('qari-letter-'+i);return{position:o.position.toArray(),scale:o.scale.toArray()}}),caption:document.querySelector('.stage-ui p').textContent,render:{...s.gl.info.render},memory:{...s.gl.info.memory},textureBytesEstimate,softwareRenderWallMs:times,canvas:[s.gl.domElement.width,s.gl.domElement.height],addedGeometryBytes:variant==='physical'?c.measurement.bufferBytes:0};
    if(variant==='physical'){c.physical.visible=false;c.maps.raised.faces.dispose();c.maps.raised.walls.dispose()}return result;
   },{view,variant});
   const folder=path.join(out,variant);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,view+'.png'),Buffer.from(frame.png.split(',')[1],'base64'));delete frame.png;fs.writeFileSync(path.join(folder,view+'.json'),JSON.stringify(frame,null,2));report.captures.push({view,variant,...frame});save();
   assert(frame.caption.includes('Select a letter')&&frame.letters.every(l=>l.scale[0]<=1.02));console.log(view,variant,JSON.stringify({camera:frame.camera,calls:frame.render.calls,triangles:frame.render.triangles,times:frame.softwareRenderWallMs}));
  }
 }
 for(const view of ['wide','explore','oblique']){
  const frames=report.captures.filter(c=>c.view===view),a=frames[0];for(const c of frames){for(const k of['camera','target','detail','letters','textureBytesEstimate'])assert.deepEqual(c[k],a[k],view+' '+k);assert.equal(c.memory.textures,a.memory.textures)}
  const texture=frames.find(c=>c.variant==='texture'),physical=frames.find(c=>c.variant==='physical');assert.equal(texture.render.calls,a.render.calls);assert.equal(texture.render.triangles,a.render.triangles);assert.equal(texture.addedGeometryBytes,0);assert.equal(physical.render.triangles-a.render.triangles,view==='wide'?0:report.comparator.physical.triangles);
 }
 assert(Math.abs(report.captures.find(c=>c.view==='explore').camera[2]-84)<.01);
 report.farQuantization=await compareFarPngs(p,out);
 await p.evaluate(()=>{const c=window.__comparison;c.band.material=c.textureMaterial;window.__putLane(c.texturePixels);window.__button('Return to Orbit')});await wait(()=>document.querySelector('.tools').textContent.includes('Explore Calligraphy'));await p.evaluate(()=>window.__step());assert(await p.evaluate(()=>Math.abs(window.__state().camera.position.z-169)<.01));
 await p.keyboard.press('1');await wait(()=>document.querySelector('.stage-ui p').textContent.includes('Mirrored pair'));await wait(()=>{window.__step();return [0,6].every(i=>window.__state().scene.getObjectByName('qari-letter-'+i).scale.x>1.15)},null,{timeout:20000});
 await p.keyboard.press('ArrowRight');await wait(()=>document.querySelector('.step').textContent.includes('02 / 02'));await p.keyboard.press('ArrowLeft');await wait(()=>document.querySelector('.step').textContent.includes('01 / 02'));
 assert.deepEqual(report.errors,[]);report.success=true;report.regressions='Explore/Return, mirror pair, exactly two phases; unchanged matched camera states and zero geometry/draw/texture additions in texture mode';
}catch(e){report.error=e.stack;process.exitCode=1}finally{clearTimeout(deadline);save();await browser?.close();server?.kill('SIGTERM');console.log(report.success?(process.env.TEXTURE_REGRESSION_ONLY?'PASS texture-only runtime regressions':'PASS three-way matched comparison'):report.error)}})();

async function compareFarPngs(page,directory){
 const images=Object.fromEntries(['original','texture','physical'].map(v=>[v,fs.readFileSync(path.join(directory,v,'wide.png')).toString('base64')]));
 const stats=await page.evaluate(async images=>{
  const read=async s=>{const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const c=canvas.getContext('2d');c.drawImage(bitmap,0,0);return c.getImageData(0,0,canvas.width,canvas.height).data};
  const a=await read(images.original),result={};for(const v of ['texture','physical']){const b=await read(images[v]);let changedPixels=0,maxChannelDelta=0;for(let i=0;i<a.length;i+=4){let changed=false;for(let k=0;k<4;k++){const d=Math.abs(a[i+k]-b[i+k]);if(d)changed=true;maxChannelDelta=Math.max(maxChannelDelta,d)}if(changed)changedPixels++}result[v]={changedPixels,maxChannelDelta}}return result;
 },images);
 assert.equal(stats.physical.changedPixels,0,'physical far view changed');
 assert(stats.texture.maxChannelDelta<=1&&stats.texture.changedPixels<=100,'far change exceeds explicitly bounded one-level render quantization');return stats;
}
module.exports={compareFarPngs};
