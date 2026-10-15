const {chromium}=require('playwright'),{spawn,execFileSync}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{let browser;const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5297'],{stdio:'ignore'});
try{
 const baseline=execFileSync('git',['show','10510f75c53e0de1ae6c53f6155014477151498b:src/seal-foundation/vectorIntake.ts'],{encoding:'utf8'}).replace("'./config'","'/src/seal-foundation/config.ts'");
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:5297/src/seal-foundation/config.ts')).ok)break;}catch{}if(i===79)throw Error('Local server readiness timeout');await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/__baseline-intake.ts',r=>r.fulfill({contentType:'application/javascript',body:require('typescript').transpileModule(baseline,{compilerOptions:{module:require('typescript').ModuleKind.ESNext,target:require('typescript').ScriptTarget.ES2022}}).outputText}));
 await p.route('**/intake-audit-blank',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic geometry schema tests only</title>'}));
 await p.goto('http://127.0.0.1:5297/intake-audit-blank');
 const source=JSON.parse(fs.readFileSync('docs/celestial-seal-v0.4/locked-source-snapshots.json'));
 const result=await p.evaluate(async source=>{const api=await import('/src/seal-foundation/vectorIntake.ts'),{runIntakeRegression}=await import('/scripts/fixtures/seal-intake.mjs'),old=await import('/__baseline-intake.ts');return runIntakeRegression(source,api,old.validateVectorIntake);},source);
 assert.deepEqual(errors,[]);result.pageErrors=errors;result.baseline='10510f75c53e0de1ae6c53f6155014477151498b';result.checkedAt=new Date().toISOString();
 const out='docs/celestial-seal-v0.4/intake-hardening';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(`${out}/intake-check.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.kill('SIGTERM');}})();
