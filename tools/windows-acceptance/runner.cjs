'use strict';
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { installObserver } = require('./observer.cjs');
const { preparationTimingPlugin } = require('./instrumentation.cjs');

const BASELINE = '876486dac91db528a5b438609a48f2c77c3eb3a4';
const FLAGS = '?calligraphyRelief=texture&orbitArt=study';
const MODES = [['kaf', '\u0643', 0], ['lam', '\u0644', 1], ['fa', '\u0641', 2], ['ya', '\u064a', 3]];
const STEPS = ['prepare-checkout', 'build-production', 'start-preview', 'chrome-environment',
  'orbit-startup', 'seven-letters', 'both-phases', 'reset-view',
  ...MODES.flatMap(([mode]) => ['open-harf', 'complete-guide', 'history', 'native-inspection', 'return-orbit']
    .map(step => mode + ':' + step)),
  'reload-orbit', 'desktop-document-cleanup', 'preparation-diagnostics', 'source-integrity'];
const OWNER_CHECKS = ['scene-artwork-and-arabic', 'all-four-inspections', 'camera-and-reset',
  'readability-and-loading', 'chrome-gpu-status'];

function options(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i];
    if (['--summarize', '--worker'].includes(name)) values[name.slice(2)] = true;
    else {
      if (!['--repository', '--dependencies', '--playwright', '--chrome', '--report', '--stage-seconds', '--run-minutes', '--options'].includes(name)) throw Error('Unknown option: ' + name);
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw Error('Missing value: ' + name);
      values[name.slice(2)] = argv[++i];
    }
  }
  return values;
}
function aggregate(report, review) {
  const steps = Object.values(report.steps || {});
  const automation = report.globalTimeout || report.interrupted || (report.workerExitCode !== undefined && report.workerExitCode !== 0) ||
    steps.some(step => step.status === 'FAIL') || report.browserErrors?.length ||
    report.consoleErrors?.length || report.httpErrors?.length || report.requestFailures?.length
    ? 'FAIL' : steps.length !== STEPS.length || steps.some(step => step.status !== 'PASS') ? 'BLOCKED' : 'PASS';
  const owner = OWNER_CHECKS.some(key => review?.checks?.[key]?.status === 'FAIL') ? 'FAIL' :
    OWNER_CHECKS.every(key => review?.checks?.[key]?.status === 'PASS') &&
      !!review?.reviewer?.trim() && Number.isFinite(Date.parse(review?.reviewedAt)) ? 'PASS' : 'BLOCKED';
  const hardware = report.environment?.hardwareAcceleration === 'confirmed' ? 'PASS' : 'BLOCKED';
  const windows = report.environment?.platform === 'win32' ? 'PASS' : 'BLOCKED';
  const overall = [automation, owner].includes('FAIL') ? 'FAIL' :
    automation === 'PASS' && owner === 'PASS' && hardware === 'PASS' && windows === 'PASS' ? 'PASS' : 'BLOCKED';
  return { automation, ownerVisual: owner, hardwareAcceleration: hardware, windowsExecution: windows, overall,
    decision: overall === 'PASS' ? 'GO for this Windows desktop run only; no Quest claim' : 'NO-GO for Windows acceptance sign-off',
    nativeXRSessionCleanup: 'BLOCKED: no physical XR session is created by this desktop runner' };
}
function writeJson(file, value) {
  const temp = file + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temp, file);
}
function summarize(folder) {
  const report = JSON.parse(fs.readFileSync(path.join(folder, 'report.json'), 'utf8'));
  const reviewPath = path.join(folder, 'owner-review.json');
  const review = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath, 'utf8')) : null;
  report.summary = aggregate(report, review);
  writeJson(path.join(folder, 'report.json'), report);
  const lines = ['QariAI Windows local acceptance', 'Baseline: ' + report.baseline,
    'Overall: ' + report.summary.overall, 'Automation: ' + report.summary.automation,
    'Owner visual checks: ' + report.summary.ownerVisual, report.summary.decision, '',
    ...Object.entries(report.steps).map(([name, step]) => `${step.status.padEnd(7)} ${name}${step.error ? ': ' + step.error : ''}`),
    '', report.summary.nativeXRSessionCleanup,
    'Timings are document-relative milliseconds unless explicitly stated otherwise.',
    'Diagnostic preparation spans are separate from pristine acceptance timings.',
    'Share report.json, owner-review.json, logs and genuine PNGs; do not share the temporary Chrome profile.'];
  fs.writeFileSync(path.join(folder, 'SUMMARY.txt'), lines.join('\n') + '\n');
  return report.summary;
}
function killTree(pid) {
  if (process.platform === 'win32') spawn('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  else { try { process.kill(pid, 'SIGKILL'); } catch {} }
}
function command(executable, args, { cwd, timeoutMs = 120000, log, allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, windowsHide: true, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', settled = false;
    const append = bytes => { output += bytes; if (log) fs.appendFileSync(log, bytes); };
    child.stdout.on('data', append); child.stderr.on('data', append);
    const timer = setTimeout(() => {
      if (settled) return; settled = true; killTree(child.pid);
      reject(Error(path.basename(executable) + ' exceeded ' + timeoutMs + ' ms'));
    }, timeoutMs);
    child.once('error', error => { if (!settled) { settled = true; clearTimeout(timer); reject(error); } });
    child.once('close', code => {
      if (settled) return; settled = true; clearTimeout(timer);
      if (code !== 0 && !allowFailure) reject(Error(path.basename(executable) + ' exited ' + code + ': ' + output.slice(-2500)));
      else resolve({ code, output: output.trim() });
    });
  });
}
async function bounded(work, ms, name) {
  let timer;
  try { return await Promise.race([Promise.resolve().then(work), new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error(name + ' exceeded ' + ms + ' ms')), ms);
  })]); } finally { clearTimeout(timer); }
}
function modulePath(name, search) {
  try { return require.resolve(name, { paths: search }); } catch { return null; }
}
function chromePath(explicit) {
  const choices = explicit ? [explicit] : [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]
    .filter(Boolean).map(root => path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  const result = choices.find(file => fs.existsSync(file) && path.basename(file).toLowerCase() === 'chrome.exe');
  if (!result) throw Error('Google Chrome not found. Install Chrome yourself or supply -ChromePath "C:\\...\\chrome.exe". No browser is downloaded.');
  return path.resolve(result);
}
async function preflight(input) {
  if (process.platform !== 'win32') throw Error('Actual Windows is required; Linux/Chromium substitution is prohibited.');
  if (Number(process.versions.node.split('.')[0]) < 20) throw Error('Node.js 20+ is required. Install it yourself and reopen PowerShell.');
  try { await command('git.exe', ['--version'], { timeoutMs: 10000 }); }
  catch { throw Error('Git for Windows is required on PATH. Install it yourself, reopen PowerShell, then rerun. Nothing was installed.'); }
  const repository = path.resolve(input.repository || path.join(__dirname, '..', '..'));
  const dependencies = path.resolve(input.dependencies || path.join(repository, 'node_modules'));
  for (const name of ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', 'typescript', 'vite', 'esbuild']) {
    if (!fs.existsSync(path.join(dependencies, name, 'package.json'))) {
      throw Error(`Missing ${name} in ${dependencies}. Prepare project dependencies manually as described in README.md; the runner never installs packages.`);
    }
  }
  const search = [repository, path.join(__dirname, '..', '..'), process.cwd()];
  let playwright;
  if (input.playwright) {
    const supplied = path.resolve(input.playwright);
    playwright = fs.existsSync(supplied) && fs.statSync(supplied).isDirectory()
      ? createRequire(path.join(supplied, 'package.json')).resolve('./') : supplied;
  } else playwright = modulePath('playwright', search) || modulePath('playwright-core', search);
  if (!playwright || !fs.existsSync(playwright)) throw Error('Playwright is missing. Install playwright or playwright-core yourself in a tooling directory, then supply -PlaywrightPath to that package directory. No browser install is needed.');
  if (!require(playwright).chromium?.launch) throw Error('The supplied Playwright package does not expose chromium.launch.');
  const stageSeconds = Number(input['stage-seconds'] || 180);
  const runMinutes = Number(input['run-minutes'] || 30);
  if (!Number.isInteger(stageSeconds) || stageSeconds < 30 || stageSeconds > 300 ||
      !Number.isInteger(runMinutes) || runMinutes < 5 || runMinutes > 60) throw Error('Invalid timeout bounds.');
  return { repository, dependencies, playwright, chrome: chromePath(input.chrome), stageSeconds, runMinutes };
}

async function build(candidate, pristine, diagnostic) {
  const { build: viteBuild } = await import(pathToFileURL(path.join(candidate, 'node_modules/vite/dist/node/index.js')).href);
  const common = { root: candidate, configFile: path.join(candidate, 'vite.config.ts'),
    cacheDir: path.join(candidate, 'node_modules/.vite-acceptance') };
  await viteBuild({ ...common, build: { outDir: pristine, emptyOutDir: false } });
  await viteBuild({ ...common, plugins: [preparationTimingPlugin(candidate)],
    build: { outDir: diagnostic, emptyOutDir: false } });
}

async function worker(settings, folder) {
  const reportPath = path.join(folder, 'report.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const save = () => { report.summary = aggregate(report, null); writeJson(reportPath, report); };
  const max = settings.stageSeconds * 1000;
  let browser, context, pristineServer, diagnosticServer, candidate, acceptancePage;
  let acceptanceComplete = false;
  const log = path.join(folder, 'setup.log');
  const step = async (name, action, timeoutMs = max) => {
    const started = Date.now();
    report.steps[name] = { status: 'RUNNING', startedAt: new Date(started).toISOString() }; save();
    console.log('RUN ' + name);
    try {
      const evidence = await bounded(action, timeoutMs, name);
      report.steps[name] = { status: 'PASS', wallMs: Date.now() - started, evidence: evidence ?? null }; save();
      console.log('PASS ' + name); return evidence;
    } catch (error) {
      report.steps[name] = { status: error.blocked ? 'BLOCKED' : 'FAIL', wallMs: Date.now() - started, error: String(error) }; save();
      console.error(report.steps[name].status + ' ' + name + ': ' + error); throw error;
    }
  };
  try {
    await step('prepare-checkout', async () => {
      report.temporaryRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'qariai-windows-acceptance-'));
      candidate = path.join(report.temporaryRoot, 'candidate'); await fsp.mkdir(candidate);
      await command('git.exe', ['init', candidate], { log });
      const local = await command('git.exe', ['-C', candidate, 'fetch', '--no-tags', '--depth=1', settings.repository, BASELINE], { log, allowFailure: true });
      if (local.code !== 0) await command('git.exe', ['-C', candidate, 'fetch', '--no-tags', '--depth=1', 'https://github.com/qariAI/qariai-spatial.git', BASELINE], { log });
      await command('git.exe', ['-C', candidate, 'checkout', '--detach', 'FETCH_HEAD'], { log });
      const head = (await command('git.exe', ['-C', candidate, 'rev-parse', 'HEAD'])).output;
      assert.equal(head, BASELINE);
      const clean = (await command('git.exe', ['-C', candidate, 'status', '--porcelain=v1'])).output;
      assert.equal(clean, '', 'Temporary checkout must initially be completely clean');
      await fsp.cp(settings.dependencies, path.join(candidate, 'node_modules'), { recursive: true, dereference: true,
        filter: source => !['.vite', '.cache'].includes(path.basename(source)) });
      report.dependencies = {};
      for (const name of ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', 'typescript', 'vite']) {
        report.dependencies[name] = JSON.parse(fs.readFileSync(path.join(candidate, 'node_modules', name, 'package.json'))).version;
      }
      report.fontSHA256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(candidate, 'public/fonts/Amiri-Bold.ttf'))).digest('hex');
      assert.equal(report.fontSHA256, '65e3e6fe6af66bb6d24959bd537a89ea35de14083f5a2e2290c246136c2b047b');
      return { head, detached: true, initiallyClean: true, dependencyCopy: 'Existing packages copied; no install or upgrade', candidate };
    }, 300000);
    const pristineDist = path.join(report.temporaryRoot, 'pristine-dist');
    const diagnosticDist = path.join(report.temporaryRoot, 'diagnostic-dist');
    await step('build-production', async () => {
      await command(process.execPath, [path.join(candidate, 'node_modules/typescript/bin/tsc'), '--noEmit', '--project', path.join(candidate, 'tsconfig.json')], { cwd: candidate, log });
      await command(process.execPath, [__filename, '--build', candidate, pristineDist, diagnosticDist], { cwd: candidate, timeoutMs: 180000, log });
      return { pristine: 'Original candidate production Vite build', diagnostic: 'Separate production build with two preparation timing wrappers only', log: 'setup.log' };
    }, 310000);
    const { preview } = await import(pathToFileURL(path.join(candidate, 'node_modules/vite/dist/node/index.js')).href);
    const bases = await step('start-preview', async () => {
      const launch = dist => preview({ root: candidate, configFile: path.join(candidate, 'vite.config.ts'), build: { outDir: dist },
        preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } });
      pristineServer = await launch(pristineDist); diagnosticServer = await launch(diagnosticDist);
      const urls = [pristineServer, diagnosticServer].map(server => 'http://127.0.0.1:' + server.httpServer.address().port);
      assert.notEqual(urls[0], urls[1]);
      for (const entry of ['/', '/harf-studio.html', '/harf-studio-xr.html', '/fonts/Amiri-Bold.ttf']) {
        const response = await fetch(urls[0] + entry, { signal: AbortSignal.timeout(10000) });
        assert.equal(response.status, 200, entry); await response.arrayBuffer();
      }
      return { pristine: urls[0], diagnostic: urls[1], entryStatus: 200 };
    }, 30000);
    const base = bases.pristine;
    const playwright = require(settings.playwright);
    await step('chrome-environment', async () => {
      browser = await playwright.chromium.launch({ executablePath: settings.chrome, headless: false, timeout: 30000 });
      const browserCDP = await browser.newBrowserCDPSession();
      const version = await browserCDP.send('Browser.getVersion');
      const system = await browserCDP.send('SystemInfo.getInfo');
      assert.match(version.product, /^Chrome\//, 'Must be Google Chrome, not a bundled Chromium substitute');
      const win = await command('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        'Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber | ConvertTo-Json -Compress'], { timeoutMs: 15000 });
      const gpu = system.gpu;
      const renderer = gpu.auxAttributes?.glRenderer || '';
      const software = /swiftshader|llvmpipe|software|basic render|\bwarp\b/i.test(renderer);
      const accelerated = !software && !!renderer && gpu.featureStatus?.gpu_compositing === 'enabled';
      report.environment = { platform: process.platform, windows: JSON.parse(win.output), chromePath: settings.chrome,
        chrome: version, gpu, hardwareAcceleration: accelerated ? 'confirmed' : 'unconfirmed',
        node: process.version, playwrightEntry: settings.playwright,
        browserLaunches: 1, headed: true, viewport: { width: 1440, height: 1000 },
        launchPolicy: 'Local Google Chrome; fresh Playwright profile; no custom GPU, draw, resolution or sandbox flags' };
      await browserCDP.detach(); return report.environment;
    }, 65000);
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await context.exposeBinding('qariLifecycle', (_source, event) => { report.lifecycle.push(event); save(); });
    await context.addInitScript(installObserver);
    const page = await context.newPage();
    acceptancePage = page;
    page.setDefaultTimeout(Math.min(max, 15000)); page.setDefaultNavigationTimeout(Math.min(max, 30000));
    page.on('pageerror', error => { report.browserErrors.push({ url: page.url(), message: String(error) }); save(); });
    page.on('console', message => { if (message.type() === 'error') { report.consoleErrors.push({ url: page.url(), message: message.text() }); save(); } });
    page.on('requestfailed', request => { report.requestFailures.push({ url: request.url(), error: request.failure() }); save(); });
    page.on('response', response => { if (response.status() >= 400) { report.httpErrors.push({ url: response.url(), status: response.status() }); save(); } });
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) {
      report.documentNavigations = (report.documentNavigations || 0) + 1; save();
    } });
    const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
    const snapshot = () => page.evaluate(() => window.__qariAcceptance.snapshot());
    const flags = (url, pathname, practice) => {
      const value = new URL(url); assert.equal(value.pathname, pathname);
      assert.deepEqual(value.searchParams.getAll('calligraphyRelief'), ['texture']);
      assert.deepEqual(value.searchParams.getAll('orbitArt'), ['study']);
      if (practice) assert.deepEqual(value.searchParams.getAll('practice'), [practice]);
      assert.equal(value.origin, base, 'Navigation must remain on the actual local preview');
    };
    async function ready(oldRoot) {
      await page.waitForFunction(prior => {
        const audit = window.__qariAcceptance, state = audit?.snapshot();
        return state?.complete && state.canvasVisible && audit.completeSubmittedMs !== null &&
          (!prior || state.calligraphyId !== prior);
      }, oldRoot || null, { timeout: max, polling: 200 });
      const state = await snapshot();
      assert.deepEqual(state.letters.map(letter => letter.letter), ['\u0643', '\u0644', '\u0641', '\u064a', '\u0641', '\u0644', '\u0643']);
      assert.equal(state.xrPresenting, false); assert.equal(state.xrSessionActive, false);
      return state;
    }
    async function timings() {
      const entries = await page.evaluate(() => ({ timeOrigin: performance.timeOrigin,
        observedAtMs: performance.now(), navigation: performance.getEntriesByType('navigation').map(entry => entry.toJSON()),
        resources: performance.getEntriesByType('resource').slice(0, 500).map(entry => entry.toJSON()),
        amiriReadyMs: window.__qariAcceptance.amiriReadyMs,
        completeSceneSubmittedMs: window.__qariAcceptance.completeSubmittedMs }));
      const metrics = await cdp.send('Performance.getMetrics');
      entries.chromeMetrics = Object.fromEntries(metrics.metrics.map(metric => [metric.name, metric.value]));
      entries.scriptDurationMs = (entries.chromeMetrics.ScriptDuration || 0) * 1000;
      entries.definition = 'ScriptDuration is cumulative script execution at this checkpoint, not an exact app-initialization span. Scene time is first observed complete scene followed by a native render submission, not proof of first display scanout.';
      return entries;
    }
    async function screen(name) {
      const started = Date.now();
      const file = name + '.png';
      await page.screenshot({ path: path.join(folder, file), timeout: 15000, fullPage: false, animations: 'allow' });
      const entry = { file, url: page.url(), captureWallMs: Date.now() - started,
        sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(folder, file))).digest('hex'),
        completedDocumentMs: await bounded(() => page.evaluate(() => performance.now()), 2000, 'capture timestamp').catch(() => null),
        completedAt: new Date().toISOString(), genuine: true, source: 'Unmodified production page, browser screenshot' };
      report.screenshots.push(entry); save(); return entry;
    }
    await step('orbit-startup', async () => {
      const start = Date.now();
      await page.goto(base + '/' + FLAGS, { waitUntil: 'domcontentloaded' });
      flags(page.url(), '/'); const scene = await ready();
      const timing = await timings(); report.startup = timing;
      return { navigationWallMs: Date.now() - start, scene, timing };
    });
    await step('seven-letters', async () => {
      const selections = [];
      for (let index = 0; index < 7; index++) {
        const start = Date.now(); await page.keyboard.press(String(index + 1));
        await page.waitForFunction(index => {
          const state = window.__qariAcceptance.snapshot();
          return state.letters.every((letter, j) => j === index || j === 6 - index
            ? letter.scale > 1.3 : Math.abs(letter.scale - 1) < .01);
        }, index, { timeout: Math.min(max, 15000), polling: 100 });
        selections.push({ index, mirror: 6 - index, input: 'Automated keyboard shortcut', wallMs: Date.now() - start });
        if (index === 0) report.firstUsableInteraction = { selectionWallMs: selections[0].wallMs,
          confirmedDocumentMs: await page.evaluate(() => performance.now()) };
        if (index === 0) {
          report.startup.firstCompleteSceneCapture = await screen('01-orbit-ready');
          report.startup.visibleCompleteness = 'OWNER_REQUIRED: first genuine capture is an upper bound, not first display scanout';
        }
      }
      return selections;
    });
    await step('both-phases', async () => {
      await page.getByRole('button', { name: /Bring the letters into orbit/ }).click();
      await page.waitForFunction(() => document.querySelector('.step')?.textContent.includes('02 / 02'));
      await screen('02-orbital-phase');
      await page.getByRole('button', { name: /Explore letters again/ }).click();
      await page.waitForFunction(() => document.querySelector('.step')?.textContent.includes('01 / 02'));
      return { transition: '01 -> 02 -> 01 through real controls', scene: await ready() };
    });
    await step('reset-view', async () => {
      const before = await snapshot(); const start = Date.now();
      await page.getByRole('button', { name: /Reset view/ }).click();
      const after = await ready(before.calligraphyId);
      const wallMsToReady = Date.now() - start;
      await screen('03-after-reset');
      return { wallMsToReady, before, after,
        sceneRemounted: before.calligraphyId !== after.calligraphyId,
        atlasTexturesReconstructed: JSON.stringify(before.atlasTextures) !== JSON.stringify(after.atlasTextures),
        sculptureGeometryReconstructed: JSON.stringify(before.letters.map(x => x.geometries)) !== JSON.stringify(after.letters.map(x => x.geometries)) };
    });
    const rules = JSON.parse(fs.readFileSync(path.join(candidate, 'src/harf-xr/guide-validation/approved-guides.json')));
    const outlines = JSON.parse(fs.readFileSync(path.join(candidate, 'src/orbit-art/generated/letter-outlines.json')));
    const kaf = JSON.parse(fs.readFileSync(path.join(candidate, 'src/orbit-art/generated/kaf-outline.json')));
    for (const [mode, letter, index] of MODES) {
      await step(mode + ':open-harf', async () => {
        await page.keyboard.press(String(index + 1));
        const link = page.locator('#practice-calligraphy');
        await page.waitForFunction(letter => document.querySelector('#practice-calligraphy')?.dataset.practiceLetter === letter, letter);
        await link.click();
        await page.waitForURL(url => url.pathname === '/harf-studio.html', { waitUntil: 'domcontentloaded' });
        flags(page.url(), '/harf-studio.html', mode);
        await page.waitForFunction(() => document.querySelector('#board')?.dataset.graded === 'guide-following');
        assert.equal(await page.locator('[data-practice-outline]').getAttribute('d'), (mode === 'kaf' ? kaf : outlines[letter]).path);
        assert.equal(await page.locator('#inspectCompleted').isHidden(), true);
        return { url: page.url(), actualDestinationDocument: true, guideParts: rules[mode].parts.length };
      });
      await step(mode + ':complete-guide', async () => {
        const parts = rules[mode].parts;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i], points = part.kind === 'path' ? part.points : [part.region.center];
          const positions = await page.locator('[data-practice-outline]').evaluate((element, points) => {
            const matrix = element.getScreenCTM();
            return points.map(point => { const p = new DOMPoint(point.x, point.y).matrixTransform(matrix); return { x: p.x, y: p.y }; });
          }, points);
          await page.mouse.move(positions[0].x, positions[0].y); await page.mouse.down();
          for (const position of positions.slice(1)) await page.mouse.move(position.x, position.y);
          await page.mouse.up();
          if (i < parts.length - 1) assert.equal(await page.locator('#inspectCompleted').isHidden(), true, 'All registered parts must remain required');
        }
        assert.equal(await page.locator('#guideCompletion').innerText(), 'Practice guide completed');
        assert.equal(await page.locator('#inspectCompleted').isVisible(), true);
        await screen(mode + '-guide-completed');
        return { input: 'Synthetic Playwright mouse traces following registered source coordinates',
          validator: 'Original production guide validator, unchanged; no completion state injected', parts: parts.length };
      });
      await step(mode + ':history', async () => {
        await page.locator('#undoStroke').click(); assert.equal(await page.locator('#inspectCompleted').isHidden(), true);
        await page.locator('#redoStroke').click(); assert.equal(await page.locator('#inspectCompleted').isVisible(), true);
        return { undoRevokes: true, redoRestores: true };
      });
      let inspectionCamera;
      await step(mode + ':native-inspection', async () => {
        const start = Date.now(); await page.locator('#inspectCompleted').click();
        await page.waitForURL(url => url.pathname === '/' && url.hash === '#inspect-practice', { waitUntil: 'domcontentloaded' });
        flags(page.url(), '/', mode); await ready();
        await page.waitForFunction(() => {
          const reset = [...document.querySelectorAll('.letter-inspection button')].find(button => button.textContent === 'Reset inspection');
          return reset && !reset.disabled && window.__qariAcceptance.snapshot().controlsEnabled === false;
        }, null, { timeout: max, polling: 200 });
        const navigationToInspectionWallMs = Date.now() - start;
        assert.equal(await page.locator('#inspection-title').innerText().then(text => text.startsWith(letter)), true);
        inspectionCamera = (await snapshot()).camera;
        const drag = await page.locator('.inspection-drag').boundingBox(); assert(drag);
        await page.mouse.move(drag.x + drag.width * .55, drag.y + drag.height * .5);
        await page.mouse.down(); await page.mouse.move(drag.x + drag.width * .6, drag.y + drag.height * .52, { steps: 8 }); await page.mouse.up();
        await page.getByRole('button', { name: 'Reset inspection', exact: true }).click();
        await screen(mode + '-native-inspection');
        return { navigationToInspectionWallMs, url: page.url(), scene: await snapshot(), timing: await timings(),
          evidence: 'Real full-scene production document; native sculpture; active inspector; drag and reset', cameraVisualCheck: 'OWNER_REQUIRED' };
      });
      await step(mode + ':return-orbit', async () => {
        await page.getByRole('button', { name: 'Return to Orbit', exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('.letter-inspection') && window.__qariAcceptance.snapshot().controlsEnabled === true);
        flags(page.url(), '/', mode); const scene = await ready();
        for (const key of ['position', 'quaternion']) assert(scene.camera[key].every((value, index) =>
          Math.abs(value - inspectionCamera[key][index]) < 1e-6), 'Inspector must restore original camera within 1e-6');
        return { url: page.url(), controlsRestored: true, cameraRestored: true, scene };
      });
    }
    await step('reload-orbit', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' }); flags(page.url(), '/', 'ya'); await ready();
      await page.waitForFunction(() => document.querySelector('.letter-inspection') &&
        [...document.querySelectorAll('.letter-inspection button')].some(button => button.textContent === 'Reset inspection' && !button.disabled),
      null, { timeout: max, polling: 200 });
      await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('.letter-inspection'));
      return { retainedHashReopensInspection: true, escapeCloses: true, sourceBehavior: 'Closing inspection leaves #inspect-practice in the URL' };
    });
    await step('desktop-document-cleanup', async () => {
      const scene = await snapshot(); assert.equal(scene.xrSessionActive, false); assert.equal(scene.xrPresenting, false);
      assert(report.documentNavigations >= 10, 'Expected initial entry, eight real guide-flow navigations and reload');
      assert.equal(context.pages().length, 1, 'No extra acceptance tabs should remain');
      return { documentNavigations: report.documentNavigations, pagehideEvents: report.lifecycle, desktopXRSessionActive: false,
        limits: 'Observed real page departures and no active desktop XR session; not proof of immersive end-promise/end-event teardown or driver memory reclamation' };
    });
    acceptanceComplete = true;
    // No timing transform is ever served to the acceptance page above.
    await step('preparation-diagnostics', async () => {
      await page.close();
      const diagnosticContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
      try {
        await diagnosticContext.addInitScript(installObserver);
        const diagnosticPage = await diagnosticContext.newPage();
        diagnosticPage.on('pageerror', error => { report.diagnosticErrors.push(String(error)); save(); });
        await diagnosticPage.goto(bases.diagnostic + '/' + FLAGS, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await diagnosticPage.waitForFunction(() => window.__qariAcceptance?.completeSubmittedMs !== null &&
          window.__qariAcceptance?.snapshot().complete && globalThis.__qariPreparationSpans?.filter(span => span.stage === 'sculpture').length >= 4,
        null, { timeout: max, polling: 200 });
        const spans = await diagnosticPage.evaluate(() => globalThis.__qariPreparationSpans.map(span => ({ ...span, durationMs: span.end - span.start })));
        assert.equal(spans.filter(span => span.stage === 'atlas').length, 1, 'Production diagnostic must bake one atlas on initial entry');
        assert.equal(spans.filter(span => span.stage === 'sculpture').length, 4);
        assert.deepEqual(report.diagnosticErrors, []);
        return { build: 'Separate timing-only production build, not pristine acceptance', spans,
          limits: 'Constructor spans include CPU surface generation, geometry and any constructor GPU preparation; not GPU execution time. No diagnostic screenshots.' };
      } finally { await bounded(() => diagnosticContext.close(), 5000, 'diagnostic context close').catch(() => {}); }
    });
    await step('source-integrity', async () => {
      const diff = await command('git.exe', ['-C', candidate, 'diff', '--exit-code', 'HEAD', '--']);
      const status = await command('git.exe', ['-C', candidate, 'status', '--porcelain=v1', '--untracked-files=no']);
      assert.equal(diff.output, ''); assert.equal(status.output, '');
      return { trackedCandidateFilesUnchanged: true, originalCheckoutWrites: 'none; only read as an optional local fetch/dependency source' };
    }, 15000);
  } catch (error) {
    report.failure = String(error);
    if (acceptancePage && !acceptancePage.isClosed()) {
      try {
        report.failureObservation = await bounded(() => acceptancePage.evaluate(() => ({
          url: location.href, atMs: performance.now(), observer: window.__qariAcceptance?.snapshot(),
          visibleStatus: document.querySelector('[role="status"]')?.textContent,
          amiriReadyMs: window.__qariAcceptance?.amiriReadyMs,
          completeSubmittedMs: window.__qariAcceptance?.completeSubmittedMs
        })), 2000, 'failure observation');
      } catch (captureError) { report.failureObservationError = String(captureError); }
      try {
        await acceptancePage.screenshot({ path: path.join(folder, 'failure.png'), timeout: 5000, animations: 'allow' });
        report.failureScreenshot = { file: 'failure.png', genuine: true,
          sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(folder, 'failure.png'))).digest('hex') };
      } catch (captureError) { report.failureScreenshotError = String(captureError); }
    }
    if (!acceptanceComplete) report.notes.push('Stopped after the first failed prerequisite/acceptance stage; later journeys are BLOCKED rather than retried or replaced by fixtures.');
  } finally {
    for (const step of Object.values(report.steps)) if (step.status === 'RUNNING') { step.status = 'FAIL'; step.error = 'Interrupted'; }
    if (candidate && report.steps['source-integrity'].status !== 'PASS') {
      try {
        const result = await command('git.exe', ['-C', candidate, 'diff', '--exit-code', 'HEAD', '--'], { timeoutMs: 10000 });
        assert.equal(result.output, '');
        report.steps['source-integrity'] = { status: 'PASS', evidence: { trackedCandidateFilesUnchanged: true } };
      } catch (error) { report.steps['source-integrity'] = { status: 'FAIL', error: String(error) }; }
    }
    save();
    await bounded(() => context?.close(), 5000, 'acceptance context close').catch(() => {});
    await bounded(() => browser?.close(), 5000, 'Chrome close').catch(() => {});
    for (const server of [pristineServer, diagnosticServer]) if (server) await bounded(() => new Promise(resolve => server.httpServer.close(resolve)), 5000, 'preview close').catch(() => {});
    report.finishedAt = new Date().toISOString(); save(); summarize(folder);
    // Keep the isolated checkout for reproducibility; never delete owner files.
  }
}

async function main(argv) {
  if (argv[0] === '--build') { await build(argv[1], argv[2], argv[3]); return; }
  const input = options(argv);
  if (input.worker) {
    if (process.platform !== 'win32') throw Error('The acceptance worker requires actual Windows.');
    const settings = JSON.parse(fs.readFileSync(input.options, 'utf8'));
    await worker(settings, input.report); return;
  }
  if (input.summarize) {
    if (!input.report) throw Error('-Summarize requires -ReportFolder.');
    const summary = summarize(path.resolve(input.report)); console.log(JSON.stringify(summary, null, 2));
    process.exitCode = summary.overall === 'PASS' ? 0 : summary.overall === 'FAIL' ? 1 : 2; return;
  }
  if (process.platform !== 'win32') throw Error('Actual Windows is required; no browser was launched.');
  const folder = input.report ? path.resolve(input.report) : path.join(os.homedir(), 'Documents',
    'QariAI-Acceptance-' + new Date().toISOString().replace(/[:.]/g, '-'));
  if (fs.existsSync(folder)) throw Error('Report folder already exists; choose a new folder. Existing reports are never overwritten by a new run.');
  fs.mkdirSync(folder, { recursive: true });
  const report = { schemaVersion: 1, evidenceKind: 'OWNER_WINDOWS_LOCAL_RUN', baseline: BASELINE,
    toolingSHA256: Object.fromEntries(['runner.cjs', 'observer.cjs', 'instrumentation.cjs', 'Run-Acceptance.ps1'].map(name =>
      [name, crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, name))).digest('hex')])),
    startedAt: new Date().toISOString(), steps: Object.fromEntries(STEPS.map(name => [name, { status: 'BLOCKED', reason: 'Not yet executed' }])),
    browserErrors: [], consoleErrors: [], requestFailures: [], httpErrors: [], diagnosticErrors: [],
    screenshots: [], lifecycle: [], notes: ['No Windows acceptance exists until this runner completes on Windows and owner visual checks are supplied.',
      'Automated handwriting is synthetic pointer input through original validators.', 'No physical Quest or native immersive-session claim.'] };
  writeJson(path.join(folder, 'report.json'), report);
  writeJson(path.join(folder, 'owner-review.json'), { reviewer: '', reviewedAt: '',
    instructions: 'After inspecting genuine screenshots and the headed browser run, replace PENDING with PASS or FAIL and explain each decision. Do not mark unseen stages PASS.',
    checks: Object.fromEntries(OWNER_CHECKS.map(name => [name, { status: 'PENDING', notes: '' }])) });
  let settings;
  try { settings = await preflight(input); }
  catch (error) {
    report.preflightError = String(error); writeJson(path.join(folder, 'report.json'), report); summarize(folder);
    console.error(String(error) + '\nBLOCKED report: ' + folder); process.exitCode = 2; return;
  }
  const settingsPath = path.join(folder, 'run-options.json'); writeJson(settingsPath, settings);
  const stream = fs.openSync(path.join(folder, 'runner.log'), 'a');
  const child = spawn(process.execPath, [__filename, '--worker', '--options', settingsPath, '--report', folder],
    { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false });
  for (const output of [child.stdout, child.stderr]) output.on('data', bytes => { fs.writeSync(stream, bytes); process.stdout.write(bytes); });
  let timedOut = false, interrupted = false;
  const timer = setTimeout(() => { timedOut = true; killTree(child.pid); }, settings.runMinutes * 60000);
  const stop = () => { interrupted = true; killTree(child.pid); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  clearTimeout(timer); fs.closeSync(stream);
  process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
  const current = JSON.parse(fs.readFileSync(path.join(folder, 'report.json')));
  current.workerExitCode = exit; current.globalTimeout = timedOut; current.interrupted = interrupted;
  for (const step of Object.values(current.steps)) if (step.status === 'RUNNING') {
    step.status = 'FAIL'; step.error = timedOut ? 'Global run timeout' : interrupted ? 'Owner interrupted run' : 'Worker terminated unexpectedly';
  }
  writeJson(path.join(folder, 'report.json'), current);
  const summary = summarize(folder);
  console.log('\nReport: ' + folder + '\n' + summary.decision + '\nOwner checks: edit owner-review.json, then rerun with -Summarize -ReportFolder.');
  process.exitCode = summary.overall === 'PASS' ? 0 : summary.overall === 'FAIL' ? 1 : 2;
  if (exit !== 0 && summary.overall === 'PASS') process.exitCode = 1;
}
module.exports = { BASELINE, STEPS, OWNER_CHECKS, aggregate, options, bounded, preflight, build, worker };
if (require.main === module) main(process.argv.slice(2)).catch(error => { console.error(error.stack || error); process.exitCode = 2; });
