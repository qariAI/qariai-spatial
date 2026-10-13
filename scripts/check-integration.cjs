const assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const load=file=>{const code=buildSync({entryPoints:[file],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;};
const {endBeforeNavigation}=load('src/integration/navigation.ts'),{progressDisplay}=load('src/harf-xr/progress.ts');
(async()=>{
 const score={phase:'dot',progress:.94};assert.deepEqual(progressDisplay(score),{label:'Body complete · Add the dot',percent:100});score.phase='complete';assert.equal(progressDisplay(score).label,'Letter complete ✓');assert.equal(score.progress,.94,'underlying score retained');score.phase='body';assert.equal(progressDisplay(score).percent,94);
 class Session{listeners=new Set();addEventListener(_,fn){this.listeners.add(fn)}removeEventListener(_,fn){this.listeners.delete(fn)}async end(){setTimeout(()=>{for(const fn of this.listeners)fn()},10)}}
 const s=new Session();let navigated=0;const pending=endBeforeNavigation(s,()=>navigated++,100);assert.equal(navigated,0);await pending;assert.equal(navigated,1);assert.equal(s.listeners.size,0);
 const stuck=new Session();stuck.end=async()=>{};await assert.rejects(()=>endBeforeNavigation(stuck,()=>navigated++,20));assert.equal(navigated,1);assert.equal(stuck.listeners.size,0);
 const fail=new Session();fail.end=()=>{throw Error('end failure')};await assert.rejects(()=>endBeforeNavigation(fail,()=>navigated++,20));assert.equal(navigated,1);assert.equal(fail.listeners.size,0);
 await endBeforeNavigation(null,()=>navigated++);assert.equal(navigated,2);
 console.log('PASS completion presentation preserves raw score; navigation waits for end event and cancels on failure/timeout; listeners cleaned');
})().catch(error=>{console.error(error);process.exitCode=1});
