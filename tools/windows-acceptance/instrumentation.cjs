'use strict';
const path = require('node:path');
const { createRequire } = require('node:module');

// Used ONLY for the separate diagnostic build. Acceptance uses the original
// production build. Wrap existing function bodies with try/finally spans;
// never change returned data, masks, geometry, shaders, validators or rendering.
function preparationTimingPlugin(candidate) {
  const requireCandidate = createRequire(path.join(candidate, 'package.json'));
  const ts = requireCandidate('typescript');
  const targets = new Map([
    ['src/CalligraphyDepthArt.tsx', ['engravedAtlas', 'atlas']],
    ['src/orbit-art/kafAsset.ts', ['createKafAsset', 'sculpture']]
  ]);
  const found = new Set();
  return {
    name: 'qari-acceptance-diagnostic-spans', enforce: 'pre',
    transform(code, id) {
      const relative = path.relative(candidate, id.split('?')[0]).replaceAll('\\', '/');
      const target = targets.get(relative);
      if (!target) return null;
      const file = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true,
        id.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const functions = file.statements.filter(statement =>
        ts.isFunctionDeclaration(statement) && statement.name?.text === target[0] && statement.body);
      if (functions.length !== 1) throw Error('Timing target changed: ' + relative);
      const body = functions[0].body;
      const prefix = 'const __qariTimingStart=performance.now();try{';
      const extra = target[1] === 'sculpture' ? ',letter' : '';
      const suffix = `}finally{(globalThis.__qariPreparationSpans??=[]).push({stage:${JSON.stringify(target[1])},start:__qariTimingStart,end:performance.now()${extra}})}`;
      found.add(relative);
      return { code: code.slice(0, body.getStart(file) + 1) + prefix +
        code.slice(body.getStart(file) + 1, body.end - 1) + suffix + code.slice(body.end - 1), map: null };
    },
    buildEnd(error) {
      if (!error && found.size !== targets.size) throw Error('Not all preparation timing targets were instrumented');
    }
  };
}
module.exports = { preparationTimingPlugin };
