'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { aggregate, options, bounded, STEPS, OWNER_CHECKS, preflight } = require('./runner.cjs');
const { preparationTimingPlugin } = require('./instrumentation.cjs');

function passingReport() {
  return { steps: Object.fromEntries(STEPS.map(name => [name, { status: 'PASS' }])),
    environment: { platform: 'win32', hardwareAcceleration: 'confirmed' } };
}
function passingReview() {
  return { reviewer: 'Test fixture only', reviewedAt: '2026-10-28T12:00:00Z',
    checks: Object.fromEntries(OWNER_CHECKS.map(name => [name, { status: 'PASS' }])) };
}
test('automation cannot manufacture owner visual acceptance', () => {
  const summary = aggregate(passingReport(), null);
  assert.equal(summary.automation, 'PASS'); assert.equal(summary.overall, 'BLOCKED');
});
test('missing stages, hardware confirmation and Windows execution block acceptance', () => {
  for (const change of [report => { delete report.steps['reset-view']; },
    report => { report.environment.hardwareAcceleration = 'unconfirmed'; },
    report => { report.environment.platform = 'linux'; }]) {
    const report = passingReport(); change(report);
    assert.equal(aggregate(report, passingReview()).overall, 'BLOCKED');
  }
});
test('errors, stage failures and owner rejection cannot be hidden by successful stages', () => {
  for (const key of ['browserErrors', 'consoleErrors', 'httpErrors', 'requestFailures']) {
    const report = passingReport(); report[key] = [{ message: 'fixture failure' }];
    assert.equal(aggregate(report, passingReview()).overall, 'FAIL');
  }
  const report = passingReport(); report.steps['orbit-startup'].status = 'FAIL';
  assert.equal(aggregate(report, passingReview()).overall, 'FAIL');
  const review = passingReview(); review.checks['camera-and-reset'].status = 'FAIL';
  assert.equal(aggregate(passingReport(), review).overall, 'FAIL');
  for (const extra of [{ globalTimeout: true }, { interrupted: true }, { workerExitCode: 2 }]) {
    assert.equal(aggregate({ ...passingReport(), ...extra }, passingReview()).overall, 'FAIL');
  }
});
test('GO requires completed Windows automation plus identified owner review', () => {
  assert.equal(aggregate(passingReport(), passingReview()).overall, 'PASS');
  const review = passingReview(); review.reviewer = '';
  assert.equal(aggregate(passingReport(), review).overall, 'BLOCKED');
});
test('stage deadlines reject stalled work', async () => {
  await assert.rejects(bounded(() => new Promise(() => {}), 15, 'fixture stage'), /fixture stage exceeded/);
});
test('CLI rejects unknown or incomplete parameters', () => {
  assert.throws(() => options(['--install']), /Unknown/);
  assert.throws(() => options(['--chrome']), /Missing/);
  assert.deepEqual(options(['--chrome', 'C:\\Google Chrome\\chrome.exe']), { chrome: 'C:\\Google Chrome\\chrome.exe' });
});
test('non-Windows execution fails before prerequisites or browser launch', async t => {
  if (process.platform === 'win32') return t.skip('This guard test is for a non-Windows host');
  await assert.rejects(preflight({}), /Actual Windows is required/);
});
test('diagnostic transformation preserves function returns and runs finally on failure', t => {
  const candidate = process.env.QARIAI_TEST_CANDIDATE || path.resolve(__dirname, '..', '..');
  if (!fs.existsSync(path.join(candidate, 'node_modules/typescript/package.json'))) return t.skip('Supply QARIAI_TEST_CANDIDATE with existing TypeScript dependencies');
  const plugin = preparationTimingPlugin(candidate);
  const source = 'export function engravedAtlas(value:number){if(value<0)throw Error("fixture");return {value};}';
  const result = plugin.transform(source, path.join(candidate, 'src/CalligraphyDepthArt.tsx')).code;
  const ts = require(path.join(candidate, 'node_modules/typescript'));
  const js = ts.transpileModule(result, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }, global = {};
  new Function('exports', 'globalThis', 'performance', js)(module.exports, global, { now: () => 10 });
  assert.deepEqual(module.exports.engravedAtlas(7), { value: 7 });
  assert.throws(() => module.exports.engravedAtlas(-1), /fixture/);
  assert.equal(global.__qariPreparationSpans.length, 2);
  assert.throws(() => plugin.buildEnd(), /Not all/);
  assert.throws(() => plugin.transform('export const engravedAtlas=1;', path.join(candidate, 'src/CalligraphyDepthArt.tsx')), /Timing target changed/);
});
