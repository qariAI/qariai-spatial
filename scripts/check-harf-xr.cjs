const assert=require('node:assert/strict'),{buildSync}=require('esbuild');
function load(file){const code=buildSync({entryPoints:[file],bundle:true,write:false,format:'cjs'}).outputFiles[0].text;const m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;}
const {Tracing,Pinch,GUIDE,DOT}=load('src/harf-xr/tracing.ts'),{SessionOwner}=load('src/harf-xr/session.ts');
(async()=>{
 const t=new Tracing();assert(!t.begin(DOT));assert.equal(t.progress,0);assert(t.begin(GUIDE[0]));assert(!t.begin(GUIDE[0]));
 t.move(GUIDE[100]);assert.equal(t.index,0,'reject tracking jumps');
 for(let i=1;i<80;i++)t.move(GUIDE[i]);t.end();assert(t.begin(GUIDE[79]),'resume after release');
 t.move(GUIDE[30]);assert.equal(t.index,79,'reject reversed movement');for(let i=80;i<GUIDE.length;i++)t.move(GUIDE[i]);
 assert.equal(t.phase,'dot');assert(!t.begin(GUIDE[0]));assert(t.begin(DOT));assert.equal(t.phase,'complete');assert(!t.begin(DOT));t.reset();assert.equal(t.strokes.length,0);assert.equal(t.phase,'body');
 const p=new Pinch();assert(!p.update(.01,0),'must open after tracking starts');assert(!p.update(.04,10));assert(!p.update(.04,101));assert(p.update(.016,102));assert(p.update(.025,150));assert(p.update(.04,151));assert(p.update(.04,200));assert(!p.update(.04,242));p.loseTracking();assert(!p.update(.01,250),'tracking recovery cannot resume held pinch');
 class FakeSession{listeners=new Set();ended=0;addEventListener(_,f){this.listeners.add(f)}removeEventListener(_,f){this.listeners.delete(f)}async end(){this.ended++;for(const f of [...this.listeners])f();}}
 let cleanup=0,attach=0;const s=new FakeSession(),owner=new SessionOwner(async()=>attach++,()=>cleanup++);
 assert(await owner.start(async()=>s));assert(!await owner.start(async()=>new FakeSession()));assert.equal(attach,1);await owner.stop();assert.equal(owner.current,null);assert.equal(s.listeners.size,0);assert.equal(cleanup,1);assert.equal(s.ended,1);
 const failed=new FakeSession(),bad=new SessionOwner(async()=>{throw Error('renderer attach failed')},()=>{});await assert.rejects(()=>bad.start(async()=>failed));assert.equal(bad.current,null);assert.equal(bad.starting,false);assert.equal(failed.listeners.size,0);assert.equal(failed.ended,1);
 let resolve;const delayed=new SessionOwner(async()=>{},()=>{}),start=delayed.start(()=>new Promise(r=>resolve=r));assert(!await delayed.start(async()=>new FakeSession()));resolve(new FakeSession());await start;await delayed.stop();
 console.log('PASS tracing direction/proximity/resume/body/dot/reset; pinch hysteresis/debounce/tracking loss; XR lifecycle duplicate/failed/delayed start and cleanup simulation');
})().catch(e=>{console.error(e);process.exitCode=1});
