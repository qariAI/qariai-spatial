// Deterministic lifecycle tests execute the actual hooks/providers with fake
// scheduling and dependencies. No fixture screenshots or browser claims.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const root=path.resolve(__dirname,'..');const checks=[];
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function harness(){
 let slots=[],effects=[],cursor=0,pending=[],mounted=true,writes=0;const timers=new Map();let next=0;
 const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{if(!mounted)throw Error('State written after unmount');slots[i]=typeof value==='function'?value(slots[i]):value;writes++}]},useRef(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial})},useCallback(fn,deps){const i=cursor++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j]))slots[i]={fn,deps};return slots[i].fn},useEffect(fn,deps){const i=cursor++;if(!effects[i]||deps.some((d,j)=>d!==effects[i].deps[j]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()}})},createContext(){return{Provider:()=>null}},useContext(){return new Map()}};
 return{hooks,timers,setTimeout(fn,ms){const id=++next;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},tick(ms){for(const[id,t]of[...timers])if(t.ms===ms){timers.delete(id);t.fn()}},render(fn){cursor=0;const result=fn();for(const fn of pending.splice(0))fn();return result},unmount(){for(const e of effects)e?.cleanup?.();mounted=false},get writes(){return writes}};
}
function load(file,h,deps={}){const code=buildSync({entryPoints:[path.join(root,file)],bundle:false,write:false,format:'cjs',jsx:'automatic'}).outputFiles[0].text;const m={exports:{}};new Function('module','exports','require','setTimeout','clearTimeout',code)(m,m.exports,id=>id==='react'?h.hooks:id==='react/jsx-runtime'?{jsx:()=>null}:deps[id]||require(id),h.setTimeout,h.clearTimeout);return m.exports}
(async()=>{
 const original={document:global.document,fetch:global.fetch,FontFace:global.FontFace};
 try{
  // Reject, empty face list, repeated Retry, pending double-click and success.
  const h=harness(),requests=[],loads=[],added=[];global.document={fonts:{load(){const d=deferred();loads.push(d);return d.promise},add(face){added.push(face)}}};
  global.fetch=(_url,options)=>{assert.equal(_url,'/fonts/Amiri-Bold.ttf');assert.equal(options.cache,'reload');const d=deferred();requests.push({d,options});return d.promise};
  let faceLoads=[];global.FontFace=class{constructor(family,bytes,options){assert.equal(family,'Amiri');assert.equal(options.weight,'700');this.status='loaded'}load(){const d=deferred();faceLoads.push(d);return d.promise}};
  const{useLoadedArabicFont}=load('src/desktop/useLoadedArabicFont.ts',h);let state=h.render(useLoadedArabicFont);assert.equal(state.state,'loading');loads[0].reject(Error('network'));await flush();state=h.render(useLoadedArabicFont);assert.equal(state.state,'failed');
  state.retry();state.retry();state=h.render(useLoadedArabicFont);assert.equal(requests.length,1);requests[0].d.reject(Error('network'));await flush();state=h.render(useLoadedArabicFont);assert.equal(state.state,'failed');assert.equal(added.length,0);
  state.retry();state=h.render(useLoadedArabicFont);requests[1].d.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});await flush();assert.equal(faceLoads.length,1);faceLoads[0].resolve({status:'loaded'});await flush();state=h.render(useLoadedArabicFont);assert.equal(state.state,'ready');assert.equal(added.length,1);h.unmount();
  checks.push('Rejection cannot become ready; fresh original-asset Retry; duplicate pending clicks cause one attempt; repeated failure and recovery');
  // Late successful original face after timeout/unmount must not change state.
  for(const ending of ['timeout','unmount']){const h=harness(),d=deferred();global.document={fonts:{load:()=>d.promise,add(){throw Error('Unexpected add')}}};const{useLoadedArabicFont}=load('src/desktop/useLoadedArabicFont.ts',h);h.render(useLoadedArabicFont);if(ending==='timeout')h.tick(30000);else h.unmount();const writes=h.writes;d.resolve([{family:'Amiri',status:'loaded'}]);await flush();assert.equal(h.writes,writes);if(ending==='timeout'){assert.equal(h.render(useLoadedArabicFont).state,'failed');h.unmount()}}
  checks.push('Font timeout and unmount ignore late original-font success');
  // A retry can finish decoding after navigation: never install stale faces.
  {const h=harness();global.document={fonts:{load:async()=>[],add(){throw Error('Stale FontFace installed')}}};const{useLoadedArabicFont}=load('src/desktop/useLoadedArabicFont.ts',h);let s=h.render(useLoadedArabicFont);await flush();s=h.render(useLoadedArabicFont);assert.equal(s.state,'failed');s.retry();h.render(useLoadedArabicFont);const r=requests.at(-1);r.d.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});await flush();h.unmount();assert.equal(r.options.signal.aborted,true);faceLoads.at(-1).resolve({status:'loaded'});await flush()}
  checks.push('Empty font match is failure; unmounted Retry aborts fetch and cannot install a late decoded face');
  // Collection failures dispose all completed assets; canceled timers never run.
  const h2=harness(),states=[],assets=[];let builds=0,failAt=2;const gl={};
  const factory=()=>{builds++;if(builds===failAt)throw Error('injected collection failure');const a={gold:{envMap:{}},info:{triangles:1,geometryBytes:1},disposed:0,dispose(){this.disposed++}};assets.push(a);return a};
  const{KafAssets}=load('src/orbit-art/SculptedKaf.tsx',h2,{'@react-three/fiber':{useThree:()=>({gl})},'./kafAsset':{createKafAsset:factory}});const onState=s=>states.push(s);const render=revision=>h2.render(()=>KafAssets({enabled:true,children:null,retryRevision:revision,onState}));
  const consoleError=console.error;console.error=()=>{};
  try{render(0);assert.equal(builds,0);h2.tick(0);assert.equal(states.at(-1),'failed');assert.equal(assets[0].disposed,1);render(1);render(2);assert.equal(h2.timers.size,1);h2.tick(0);assert.equal(states.at(-1),'ready');assert.equal(builds,6);render(2);assert.equal(h2.timers.size,0);h2.unmount();assert(assets.every(a=>a.disposed===1))}finally{console.error=consoleError}
  const h3=harness();const{KafAssets:Canceled}=load('src/orbit-art/SculptedKaf.tsx',h3,{'@react-three/fiber':{useThree:()=>({gl})},'./kafAsset':{createKafAsset(){throw Error('Canceled construction ran')}}});h3.render(()=>Canceled({enabled:true,children:null}));h3.unmount();h3.tick(0);
  checks.push('Partial collection disposal; terminal state; canceled/replaced retries; one collection on success; no duplicate/disposal on rerender; unmount cleanup');
  const report={success:true,checks,limits:'Actual production hook/provider code with deterministic React bookkeeping, fake font/construction dependencies and scheduling. Production browser tests reported separately.'};if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{Object.assign(global,original)}
})().catch(e=>{console.error(e);process.exitCode=1});
