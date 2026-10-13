process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
// Requires Playwright and Chromium in the development/test environment.
const { chromium } = require('playwright'), fs = require('fs'), assert = require('assert'), path = require('path');
const project = path.resolve(__dirname, '..');
const artifacts = path.join(project, 'docs/v1.4.8');
(async () => { let browser; const server = require('child_process').spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5258'], { cwd: project }); try {
    await new Promise(r => setTimeout(r, 2000));
    browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const p = await browser.newPage({ viewport: { width: process.env.LAYOUT_ONLY ? 390 : 1100, height: 760 } });
    p.setDefaultTimeout(120000);
    let fiber;
    const errors = [];
    p.on('response', r => { if (r.url().includes('@react-three_fiber.js'))
        fiber = r.url(); });
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && /THREE|shader|WebGL/i.test(m.text()))
        errors.push(m.text()); });
    await p.route('https://fonts.googleapis.com/**', r => r.abort());
    await p.goto('http://127.0.0.1:5258', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForFunction(() => document.querySelector('canvas'), null, { timeout: 120000 });
    await p.evaluate(async (url) => { const m = await import(url); window.__state = () => m._roots.get(document.querySelector('canvas')).store.getState(); window.__qari = () => { const s = window.__state(); const art = s.scene.getObjectByName('calligraphy-depth-art'); return { camera: s.camera.position.toArray(), info: JSON.parse(JSON.stringify(s.gl.info.render)), memory: s.gl.info.memory, detail: art?.children.filter(o => o.material?.userData.detail).map(o => o.material.userData.detail.value) }; }; }, fiber);
    await p.waitForFunction(() => window.__qari().detail?.length === 3, null, { timeout: 120000 });
    console.log('READY', await p.evaluate(() => window.__qari()));
    if (process.env.LAYOUT_ONLY) {
        fs.mkdirSync(artifacts,{recursive:true});
        await p.evaluate(()=>window.__state().setFrameloop('never'));
        await p.getByRole('button',{name:/Pause motion/}).click();
        await p.getByRole('button',{name:/Resume motion/}).waitFor();
        await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await p.locator('.tools').screenshot({path:path.join(artifacts,'controls-390.png'),timeout:120000});
        assert.deepStrictEqual(errors,[]);
        console.log('PASS fresh narrow viewport renders clickable controls');
        return;
    }
    await p.getByRole('button', { name: /Pause motion/ }).click();
    await p.waitForFunction(() => Array.from({ length: 7 }, (_, i) => window.__state().scene.getObjectByName('qari-letter-' + i)).every(Boolean), null, { timeout: 60000 });
    const screen = await p.evaluate(() => { const s = window.__state(), rect = document.querySelector('canvas').getBoundingClientRect(), v = s.camera.position.clone(); s.scene.getObjectByName('qari-letter-0').getWorldPosition(v); v.project(s.camera); return [rect.x + (v.x + 1) * rect.width / 2, rect.y + (1 - v.y) * rect.height / 2]; });
    await p.mouse.click(...screen);
    await p.waitForFunction(() => [0, 6].every(i => window.__state().scene.getObjectByName('qari-letter-' + i).scale.x > 1.15), null, { timeout: 60000 });
    console.log('PASS pointer selection and mirrored pair');
    await p.getByRole('button', {name: /Reset view/}).click();
    await p.waitForFunction(() => window.__qari().detail?.length === 3, null, {timeout: 120000});
    fs.mkdirSync(artifacts, { recursive: true });
    if (process.env.MID_ONLY) {
        await p.mouse.move(420, 280);
        await p.mouse.down();
        await p.mouse.move(480, 310, { steps: 5 });
        await p.mouse.up();
        await p.waitForFunction(() => Math.abs(window.__qari().camera[0]) > 1, null, { timeout: 60000 });
        console.log('PASS desktop orbit drag');
        await p.evaluate(() => { const s = window.__state(); s.controls.dispatchEvent({ type: 'start' }); s.controls.enableDamping = false; s.controls.update(); s.camera.position.set(0, 48, 103); s.controls.target.set(0, 3, 25); s.controls.update(); });
        await p.waitForFunction(() => window.__qari().detail[1] > .2 && window.__qari().detail[1] < .8, null, { timeout: 60000 });
        await p.screenshot({ path: path.join(artifacts, 'mid.png'), timeout: 120000 });
        const mid = await p.evaluate(() => window.__qari());
        console.log('MID', mid);
        fs.writeFileSync(path.join(artifacts, 'medium-detail.json'), JSON.stringify(mid, null, 2));
        assert.deepStrictEqual(errors, []);
        return;
    }
    await p.screenshot({ path: path.join(artifacts, 'far.png'), timeout: 120000 });
    await p.getByRole('button', { name: /Explore Calligraphy/ }).click();
    await p.waitForFunction(() => Math.abs(window.__qari().camera[2] - 78) < 2, null, { timeout: 180000 });
    await p.waitForFunction(() => window.__qari().detail[1] > .85, null, { timeout: 120000 });
    await p.screenshot({ path: path.join(artifacts, 'close.png'), timeout: 120000 });
    console.log('CLOSE', await p.evaluate(() => window.__qari()));
    const atlas = await p.evaluate(() => window.__state().scene.getObjectByName('calligraphy-depth-art').children[0].material.map.image.toDataURL());
    fs.writeFileSync(path.join(artifacts, 'atlas.png'), Buffer.from(atlas.split(',')[1], 'base64'));
    if (process.env.PREVIEW)
        return;
    await p.getByRole('button', { name: /Return to Orbit/ }).click();
    await p.waitForFunction(() => Math.abs(window.__qari().camera[2] - 169) < 2, null, { timeout: 180000 });
    const normal = await p.evaluate(() => window.__qari());
    assert(normal.detail.every(v => v < .1));
    await p.evaluate(() => { const s = window.__state(); s.controls.dispatchEvent({ type: 'start' }); s.controls.enableDamping = false; s.controls.update(); s.camera.position.set(0, 48, 103); s.controls.target.set(0, 3, 25); s.controls.update(); });
    await p.waitForFunction(() => window.__qari().detail[1] > .2 && window.__qari().detail[1] < .8, null, { timeout: 60000 });
    await p.screenshot({ path: path.join(artifacts, 'mid.png'), timeout: 120000 });
    const mid = await p.evaluate(() => window.__qari());
    console.log('MID', mid);
    fs.writeFileSync(path.join(artifacts, 'medium-detail.json'), JSON.stringify(mid, null, 2));
    await p.getByRole('button', { name: /Reset view/ }).click();
    await p.waitForFunction(() => Math.abs(window.__qari().camera[2] - 169) < 2, null, { timeout: 120000 });
    await p.keyboard.press('4');
    await p.getByRole('button', { name: /Trace/ }).click();
    const svg = p.locator('.trace-panel svg');
    const box = await svg.boundingBox();
    await p.mouse.move(box.x + box.width * .4, box.y + box.height * .4);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width * .6, box.y + box.height * .6, { steps: 4 });
    await p.mouse.up();
    assert.equal(await p.locator('.trace-panel polyline').count(), 1);
    await p.keyboard.press('Escape');
    await p.locator('.trace-panel').waitFor({ state: 'detached' });
    await p.keyboard.press('ArrowRight');
    assert((await p.locator('.step').innerText()).includes('02'));
    await p.getByRole('button', { name: /Resume motion/ }).click();
    await p.getByRole('button', { name: '1× Speed' }).click();
    await p.getByRole('button', { name: '2× Speed' }).waitFor();
    await p.getByRole('button', { name: /Explore planets/ }).click();
    for (const name of ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn']) {
        assert((await p.locator('.stage-ui').innerText()).includes(name));
        await p.getByRole('button', { name: new RegExp(name + ' · Next planet') }).click();
    }
    await p.getByRole('button', { name: /Reset view/ }).click();
    await p.keyboard.press('ArrowLeft');
    await p.getByRole('button', { name: '◎ Hand Mode', exact: true }).click();
    assert.equal(await p.locator('.finger').count(), 1);
    assert.deepStrictEqual(errors, []);
    const report = await p.evaluate(() => window.__qari());
    fs.writeFileSync(path.join(artifacts, 'render-budget.json'), JSON.stringify(report, null, 2));
    const layout = [];
    for (const [width, height] of [[1920,1080],[1440,900],[1100,760],[980,600],[900,600],[821,600],[820,600],[390,760]]) {
        await p.setViewportSize({width,height});
        await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const boxes = await p.evaluate(() => {
            const rect = selector => {const el=document.querySelector(selector),r=el.getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,visible:getComputedStyle(el).display!=='none'};};
            return {tools:rect('.tools'),status:rect('.xr-diagnostics'),note:rect('.build-note'),stage:rect('.stage-ui'),buttons:Array.from(document.querySelectorAll('.tools button')).filter(b=>!b.hidden).map(b=>{const r=b.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom};})};
        });
        const overlap=(a,b)=>a.x<b.right&&b.x<a.right&&a.y<b.bottom&&b.y<a.bottom;
        if(boxes.status.visible) assert(!overlap(boxes.tools,boxes.status), `Controls overlap Quest status at ${width}x${height}`);
        if(boxes.note.visible) assert(!overlap(boxes.tools,boxes.note), `Controls overlap build note at ${width}x${height}`);
        assert(!overlap(boxes.tools,boxes.stage), `Controls overlap stage at ${width}x${height}`);
        for(const button of boxes.buttons) assert(button.x>=0&&button.right<=width+.5&&button.y>=0&&button.bottom<=height+.5, `Button offscreen at ${width}x${height}`);
        layout.push({width,height,...boxes});
        if(width===900) await p.screenshot({path:path.join(artifacts,'controls-900.png'),timeout:120000});
    }
    fs.writeFileSync(path.join(artifacts,'responsive-layout.json'),JSON.stringify(layout,null,2));
    console.log('PASS responsive control/status separation at eight viewport sizes');
    console.log('PASS camera transitions, phases, speed, planets, reset, desktop hand mode, no page errors');
}
finally {
    await browser?.close();
    server.kill();
} })().catch(e => { console.error(e); process.exitCode = 1; });
