// Genuine application WebGL renders, not composited artwork. The baseline
// scene/atlases are unchanged (check-raised-scope/relief); toggle ONLY the added
// relief at each matched endpoint to avoid rebaking the native atlas twice.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { spawn } = require('node:child_process'), { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), output = path.join(root, 'docs/raised-calligraphy-v0.1');
const report = { method: 'Actual Living Orbit renderer at ?raisedCalligraphy=1; only added relief hidden for original views; RAF suspended before first frame; unchanged frame callbacks stepped monotonically at 50ms; final frames drawn normally',
  limitations: ['Test mounting uses React.Fragment instead of development StrictMode to avoid duplicate atlas baking; application files are unmodified by this harness.', 'Browser viewport is 1280x800; captures contain the actual 972x800 artwork canvas because the existing UI reserves sidebar space.', 'Static deterministic screenshots do not establish animation smoothness, hardware FPS, binocular legibility or Quest hand tracking.', 'Measured software-WebGL synchronous wall times are not hardware GPU timings.'],
  priorAttempt: 'Initial setup aborted at ~173s (RAF readiness conflict); corrected setup stopped after 8s when DOM canvas existed before R3F root. Final harness explicitly waits for the root and disables only accelerated Canvas2D; WebGL remains actual SwiftShader rendering. A rendered-frame attempt then stopped on an incorrect 1280px canvas assertion; the existing sidebar makes the canvas 972px. Corrected dimension validation is recorded here. Saved intermediate views then failed the close-endpoint check because Canvas restored frameloop=always after UI updates; each stepping batch now reasserts manual mode and monotonic time.', success: false, captures: [], errors: [] };
let server, browser; const started = Date.now();
function save() { fs.mkdirSync(output, { recursive: true }); report.elapsedMs = Date.now() - started; fs.writeFileSync(path.join(output, 'capture-report.json'), JSON.stringify(report, null, 2)); }
const hardDeadline = setTimeout(() => { report.error = '180-second capture budget exceeded; capture unavailable'; save(); server?.kill('SIGTERM'); void browser?.close(); setTimeout(() => process.exit(1), 1000); }, 180000);
(async () => { try {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5274'], { cwd: root, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { if ((await fetch('http://127.0.0.1:5274/')).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-accelerated-2d-canvas'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000); let fiber;
  const wait = (fn, arg, options = {}) => page.waitForFunction(fn, arg, { ...options, polling: 100 });
  page.on('response', r => { if (r.url().includes('@react-three_fiber.js')) fiber = r.url(); });
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && /THREE|shader|WebGL/i.test(m.text())) report.errors.push(m.text()); });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/src/main.tsx', async route => {
    const response = await route.fetch(); const body = (await response.text()).replaceAll('React.StrictMode', 'React.Fragment');
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 1; window.cancelAnimationFrame = () => {}; });
  await page.goto('http://127.0.0.1:5274/?raisedCalligraphy=1', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await wait(() => document.querySelector('.tools') && document.querySelector('canvas'), null, { timeout: 90000 });
  assert(fiber, 'R3F module not found');
  await page.evaluate(async url => {
    const m = await import(url); window.__state = () => m._roots.get(document.querySelector('canvas')).store.getState();
    for (let i=0; !m._roots.get(document.querySelector('canvas')) && i<300; i++) await new Promise(r=>setTimeout(r,50));
    if (!m._roots.get(document.querySelector('canvas'))) throw Error('R3F root did not initialize');
    window.__state().setFrameloop('never'); window.__state().setDpr(1); window.__time = 0;
    window.__step = () => {
      const s = window.__state(), original = s.gl.render;
      // Canvas.configure may restore `always` after a UI state update.
      // Reassert manual mode for EACH batch, retaining monotonic test time.
      s.setFrameloop('never'); s.clock.elapsedTime = window.__time;
      s.gl.render = () => {};
      try { for (let i = 0; i < 180; i++) { window.__time += .05; s.advance(window.__time, true); } }
      finally { s.gl.render = original; }
    };
    window.__button = text => {
      const b = Array.from(document.querySelectorAll('.tools button')).find(b => b.textContent.includes(text));
      if (!b) throw Error('Missing control: ' + text); b.click();
    };
    window.__button('Pause motion');
  }, fiber);
  await wait(() => document.querySelector('.tools').textContent.includes('Resume motion'));
  await wait(() => window.__state().scene.getObjectByName('hero-native-mask-relief'), null, { timeout: 90000 });
  console.log('READY', Date.now() - started);
  for (const shot of ['wide', 'close']) {
    if (shot === 'close') {
      await page.evaluate(() => window.__button('Explore Calligraphy'));
      await wait(() => document.querySelector('.tools').textContent.includes('Return to Orbit'));
    }
    await page.evaluate(() => window.__step());
    for (const mode of ['before', 'after']) {
      const image = await page.evaluate(({ shot, mode }) => {
        const s = window.__state(), art = s.scene.getObjectByName('calligraphy-depth-art'), relief = art.getObjectByName('hero-native-mask-relief');
        relief.visible = shot === 'close' && mode === 'after';
        s.scene.updateMatrixWorld(true); s.camera.updateMatrixWorld(true);
        const times = [];
        for (let i = 0; i < 3; i++) { const t = performance.now(); s.gl.render(s.scene, s.camera); s.gl.getContext().finish(); times.push(performance.now() - t); }
        const png = s.gl.domElement.toDataURL('image/png');
        const letters = Array.from({length:7}, (_,i) => { const o = s.scene.getObjectByName('qari-letter-' + i); return { position:o.position.toArray(),scale:o.scale.toArray() }; });
        const textures = new Set(); s.scene.traverse(o => { for (const mat of (o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [])) for (const v of Object.values(mat)) if (v?.isTexture) textures.add(v); });
        const textureBytesEstimate = Array.from(textures).reduce((n,t) => n + (t.image?.width||0)*(t.image?.height||0)*4*(t.generateMipmaps?4/3:1),0);
        return { png, camera:s.camera.position.toArray(),target:s.controls.target.toArray(),letters,caption:document.querySelector('.stage-ui p').textContent,
          detail:art.children.filter(o=>o.material?.userData.detail).map(o=>o.material.userData.detail.value),
          render:JSON.parse(JSON.stringify(s.gl.info.render)),memory:{...s.gl.info.memory},textureBytesEstimate,
          softwareRenderWallMs:times,relief:relief.userData.measurement,reliefVisible:relief.visible,canvas:[s.gl.domElement.width,s.gl.domElement.height],
          renderer:s.gl.getContext().getParameter(s.gl.getContext().RENDERER) };
      }, { shot, mode });
      assert(image.caption.includes('Select a letter') && image.letters.every(l=>l.scale[0]<=1.02), 'Selected letters in capture');
      assert(image.canvas[0] > 900 && image.canvas[0] <= 1280 && image.canvas[1] === 800, 'Actual CSS artwork canvas dimensions invalid');
      const directory=path.join(output,mode);fs.mkdirSync(directory,{recursive:true});
      fs.writeFileSync(path.join(directory,shot+'.png'),Buffer.from(image.png.split(',')[1],'base64'));delete image.png;
      fs.writeFileSync(path.join(directory,shot+'.json'),JSON.stringify(image,null,2));report.captures.push({mode,shot,...image});save();
      console.log(mode,shot,JSON.stringify({camera:image.camera,calls:image.render.calls,triangles:image.render.triangles,times:image.softwareRenderWallMs}));
    }
  }
  const close=report.captures.at(-1);assert(Math.abs(close.camera[2]-84)<.01&&close.detail[1]>.85);
  await page.evaluate(()=>window.__button('Return to Orbit'));await wait(()=>document.querySelector('.tools').textContent.includes('Explore Calligraphy'));
  await page.evaluate(()=>window.__step());assert(await page.evaluate(()=>Math.abs(window.__state().camera.position.z-169)<.01));
  await page.keyboard.press('1');await wait(()=>document.querySelector('.stage-ui p').textContent.includes('Mirrored pair'));await page.evaluate(()=>window.__step());
  assert(await page.evaluate(()=>[0,6].every(i=>window.__state().scene.getObjectByName('qari-letter-'+i).scale.x>1.15)));
  await page.keyboard.press('ArrowRight');await wait(()=>document.querySelector('.step').textContent.includes('02 / 02'));
  await page.keyboard.press('ArrowLeft');await wait(()=>document.querySelector('.step').textContent.includes('01 / 02'));
  for(const shot of ['wide','close']){
    const a=report.captures.find(c=>c.mode==='before'&&c.shot===shot),b=report.captures.find(c=>c.mode==='after'&&c.shot===shot);
    for(const key of ['camera','target','letters','detail','textureBytesEstimate'])assert.deepEqual(a[key],b[key],key);
    assert.equal(a.memory.textures,b.memory.textures);assert.equal(b.render.calls-a.render.calls,shot==='close'?2:0);
    assert.equal(b.render.triangles-a.render.triangles,shot==='close'?b.relief.triangles:0);
  }
  assert.deepEqual(report.errors,[]);report.success=true;report.regressions='Explore/Return endpoints, matched unselected views, mirrored pair, exactly two phases passed';
} catch(error){report.error=error.stack;process.exitCode=1;}
finally{clearTimeout(hardDeadline);save();await browser?.close();server?.kill('SIGTERM');console.log(report.success?'PASS matched captures and desktop regressions':report.error);} })();
