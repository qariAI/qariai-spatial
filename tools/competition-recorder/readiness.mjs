// Each failure identifies the exact check and observed state. Longer warmup is
// permitted before recording only; a timed shot still has its original budget.
export function readinessBudget(recording){return recording?4000:60000;}
export async function waitForCheck(page,report,{name,predicate,arg=null,timeout}){
 const check={name,timeoutMs:timeout,startedAt:new Date().toISOString()};report.checks??=[];report.checks.push(check);report.stage=name;console.log('[check] '+name+' (max '+timeout+'ms)');const started=performance.now();
 try{await page.waitForFunction(predicate,arg,{timeout,polling:100});check.result='passed';}
 catch(error){check.result='failed';check.elapsedMs=Math.round(performance.now()-started);check.cause=String(error);check.causeStack=error?.stack;
  let timer;try{check.observed=await Promise.race([page.evaluate(()=>({url:location.href,readyState:document.readyState,fontStatus:document.fonts.status,status:document.querySelector('#status')?.textContent||null,phase:document.querySelector('.step')?.textContent||null,captureLabel:document.querySelector('#capture-truth-label')?.textContent||null,canvasCount:document.querySelectorAll('canvas').length,visibility:document.visibilityState})),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Page diagnostics unresponsive')),2000);})]);}catch(diagnostic){check.diagnosticError=String(diagnostic);}finally{clearTimeout(timer);}
  throw Error(name+' failed after '+check.elapsedMs+'ms: '+String(error),{cause:error});
 }finally{check.elapsedMs=Math.round(performance.now()-started);}
}
export function orbitReady(){const canvas=document.querySelector('canvas'),bounds=canvas?.getBoundingClientRect();return !!document.querySelector('#capture-truth-label')&&!!document.querySelector('#practice-calligraphy')&&document.fonts.status==='loaded'&&!!bounds&&bounds.width>0&&bounds.height>0&&canvas.width>0&&canvas.height>0;}
export function bodyComplete(){return document.querySelector('#status')?.textContent?.includes('Body complete · Add the dot')===true;}
export function letterComplete(){return document.querySelector('#status')?.textContent?.includes('Letter complete ✓')===true;}
