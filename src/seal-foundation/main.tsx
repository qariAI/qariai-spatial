import {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {makeFoundation} from './sculpture';
import {makeStudioEnvironment} from './environment';
import {QUALITY,type Quality} from './config';
import './style.css';
type View='wide'|'close'|'tour';
type Snapshot={profile:Quality;drawCalls:number;triangles:number;textures:number;geometries:number;resources:Record<string,unknown>;environmentBytes:number;estimatedTextureBytes:number;contextLost:boolean};
type Measurement={status:string;sampleCount:number;cpuRenderMs:{mean:number;p95:number};renderSubmissionIntervalMs:{mean:number;p95:number};snapshot:Snapshot;limitations:string};
declare global {interface Window {foundationDiagnostics?:{snapshot:()=>Snapshot;measureFrames:(count?:number)=>Promise<Measurement>};}}
const wide=new T.Vector3(3.2,3.2,14.4),close=new T.Vector3(-1.4,.7,12);
const ease=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
function Camera({view,revision}:{view:View;revision:number}){
  const {camera,gl,invalidate}=useThree(),control=useMemo(()=>new OrbitControls(camera,gl.domElement),[camera,gl]);
  const motion=useRef({active:true,time:0,start:camera.position.clone(),target:new T.Vector3()});
  useEffect(()=>{control.enableDamping=true;control.dampingFactor=.065;control.minDistance=6;control.maxDistance=20;control.maxPolarAngle=Math.PI*.8;
    const cancel=()=>{motion.current.active=false;control.enableDamping=true;document.body.dataset.foundationTour='cancelled';};const change=()=>invalidate();
    control.addEventListener('start',cancel);control.addEventListener('change',change);
    return()=>{control.removeEventListener('start',cancel);control.removeEventListener('change',change);control.dispose();};},[control,invalidate]);
  useEffect(()=>{control.enableDamping=false;control.update();motion.current={active:true,time:performance.now(),start:camera.position.clone(),target:control.target.clone()};document.body.dataset.foundationSettled='false';document.body.dataset.foundationTour=view==='tour'?'running':'inactive';invalidate();},[view,revision,camera,control,invalidate]);
  useFrame(()=>{const m=motion.current,elapsed=(performance.now()-m.time)/1000,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let destination=view==='close'?close:wide;
    if(m.active){
      if(view==='tour'&&!reduced){
        if(elapsed<3)camera.position.copy(m.start).lerp(wide,ease(elapsed/3));
        else if(elapsed<9)camera.position.copy(wide).lerp(close,ease((elapsed-3)/6));
        else if(elapsed<13)camera.position.copy(close);
        else if(elapsed<19)camera.position.copy(close).lerp(wide,ease((elapsed-13)/6));
        else camera.position.copy(wide);
        control.target.copy(m.target).lerp(new T.Vector3(0,0,.02),ease(Math.min(1,elapsed/3)));
        document.body.dataset.foundationTourTime=elapsed.toFixed(2);destination=wide;
        if(elapsed>=21){m.active=false;document.body.dataset.foundationTour='complete';}
      }else {const t=reduced?1:ease(elapsed/4.2);camera.position.copy(m.start).lerp(destination,t);control.target.copy(m.target).lerp(new T.Vector3(0,0,.02),t);if(t===1){m.active=false;if(view==='tour'){document.body.dataset.foundationTour='reduced-motion';}}}
      if(m.active)invalidate();else control.enableDamping=true;
    }
    control.update();document.body.dataset.foundationSettled=String(!m.active&&camera.position.distanceTo(destination)<.025);
  });return null;
}
function Scene({profile}:{profile:Quality}){
  const {gl,scene,invalidate}=useThree(),seal=useMemo(()=>makeFoundation(profile),[profile]),envBytes=useRef(0);
  useEffect(()=>()=>seal.dispose(),[seal]);
  useEffect(()=>{const env=makeStudioEnvironment(gl,QUALITY[profile].environmentSize);scene.environment=env.texture;envBytes.current=env.bytes;invalidate();return()=>{scene.environment=null;env.dispose();};},[gl,scene,profile,invalidate]);
  const pending=useRef<{remaining:number;warmup:number;cpu:number[];interval:number[];last:number;resolve:(m:Measurement)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}|null>(null);
  useFrame(()=>{if(pending.current)invalidate();});
  useEffect(()=>{let began=0;const before=scene.onBeforeRender,after=scene.onAfterRender;
    const snapshot=():Snapshot=>({profile,drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,textures:gl.info.memory.textures,geometries:gl.info.memory.geometries,resources:{...seal.root.userData.resources,actualShadowTargets:scene.children.filter((o):o is T.DirectionalLight=>o instanceof T.DirectionalLight&&o.castShadow).map(o=>[o.shadow.map?.width??0,o.shadow.map?.height??0])},environmentBytes:envBytes.current,estimatedTextureBytes:seal.root.userData.resources.materialMapBytesWithMipmaps+seal.root.userData.resources.shadowTargetBytesEstimate+envBytes.current,contextLost:gl.getContext().isContextLost()});
    const stats=(a:number[])=>{const s=[...a].sort((a,b)=>a-b);return {mean:a.reduce((s,x)=>s+x,0)/Math.max(1,a.length),p95:s[Math.min(s.length-1,Math.floor(s.length*.95))]??0};};
    scene.onBeforeRender=()=>{began=performance.now();};
    scene.onAfterRender=()=>{
      if(gl.info.render.calls>0)document.body.dataset.foundationReady='true';
      const p=pending.current;if(!p)return;
      if(p.warmup>0){p.warmup--;p.last=began;return;}
      p.cpu.push(performance.now()-began);if(p.last)p.interval.push(began-p.last);p.last=began;
      if(--p.remaining===0){clearTimeout(p.timer);pending.current=null;p.resolve({status:'measured',sampleCount:p.cpu.length,cpuRenderMs:stats(p.cpu),renderSubmissionIntervalMs:stats(p.interval),snapshot:snapshot(),limitations:'CPU time inside WebGLRenderer scene callbacks and intervals between actual render submissions; NOT GPU timer measurements, not idle RAF and not Quest hardware performance.'});}
    };
    window.foundationDiagnostics={snapshot,measureFrames:(count=12)=>new Promise((resolve,reject)=>{if(pending.current){reject(new Error('Measurement already active'));return;}if(!Number.isInteger(count)||count<10||count>120){reject(new Error('Choose 10–120 actual rendered frames'));return;}const timer=setTimeout(()=>{const partial=pending.current;pending.current=null;if(partial&&partial.cpu.length>0)resolve({status:`partial-timeout (${partial.cpu.length}/${count} frames)`,sampleCount:partial.cpu.length,cpuRenderMs:stats(partial.cpu),renderSubmissionIntervalMs:stats(partial.interval),snapshot:snapshot(),limitations:'Partial actual-render sample: software renderer did not complete the requested frame count in 20 seconds. CPU callback duration and submission intervals only; NOT GPU timings or Quest performance.'});else reject(new Error('No measured rendered frames within 20 seconds; investigate rendering failure'));},20000);pending.current={remaining:count,warmup:3,cpu:[],interval:[],last:0,resolve,reject,timer};invalidate();})};
    return()=>{scene.onBeforeRender=before;scene.onAfterRender=after;delete window.foundationDiagnostics;if(pending.current){clearTimeout(pending.current.timer);pending.current.reject(new Error('Scene/profile disposed during measurement'));pending.current=null;}};
  },[gl,scene,seal,profile,invalidate]);
  return <primitive object={seal.root}/>;
}
function Lights({profile}:{profile:Quality}){const size=QUALITY[profile].shadowSize;return <><ambientLight intensity={.32} color="#9aafc1"/><directionalLight position={[-3,5,3.8]} intensity={4.2} color="#ffe0b5" castShadow shadow-mapSize={[size,size]} shadow-camera-left={-5.2} shadow-camera-right={5.2} shadow-camera-top={5.2} shadow-camera-bottom={-5.2} shadow-camera-near={.5} shadow-camera-far={25} shadow-bias={-.00012} shadow-normalBias={.004} shadow-radius={2.5}/><spotLight position={[5,1.5,6]} angle={.85} penumbra={1} intensity={68} color="#f3c78d" distance={24}/><pointLight position={[-4,-3,3]} intensity={6} color="#74b4b6" distance={15}/></>;}
function App(){
  const [profile,setProfile]=useState<Quality>(new URLSearchParams(location.search).get('quality')==='quest'?'quest':'desktop');
  const [view,setView]=useState<View>('wide'),[revision,setRevision]=useState(0),[report,setReport]=useState('No frame measurement requested.'),[measuring,setMeasuring]=useState(false);
  const choose=(v:View)=>{setView(v);setRevision(r=>r+1);};
  const measure=async()=>{setMeasuring(true);try{const m=await window.foundationDiagnostics?.measureFrames();setReport(JSON.stringify(m,null,2));}catch(e){setReport(String(e));}finally{setMeasuring(false);}};
  useEffect(()=>{document.body.dataset.foundationView=view;document.body.dataset.foundationQuality=profile;},[view,profile]);
  return <main><header><div><p className="eyebrow">QARIAI / CELESTIAL SEAL / v0.4</p><h1>Metal, light &amp; depth</h1><p className="subtitle">Standalone material and geometry foundation</p></div><strong className="notice">NONSCRIPTURAL GEOMETRY ONLY</strong></header>
    <section className="stage" aria-label="Nonscriptural bronze medallion"><Canvas frameloop="demand" shadows={{type:T.PCFSoftShadowMap}} dpr={[1,QUALITY[profile].dpr]} camera={{position:[3.2,3.2,14.4],fov:44,near:.1,far:50}} gl={{antialias:true,powerPreference:'high-performance'}}><color attach="background" args={['#080d13']}/><Lights key={profile} profile={profile}/><Scene profile={profile}/><Camera view={view} revision={revision}/></Canvas><span className="view-label">SEVEN SHALLOW CALIBRATION LEVELS · NO ARABIC ARTWORK LOADED</span></section>
    <footer><div><p>Original Al-Mulk 67:3 vectors are pending. These polygons are geometric placeholders.</p><small>Quest-conscious profile is a preparation setting; headset validation is pending.</small></div><nav aria-label="Foundation camera controls"><button id="wide" onClick={()=>choose('wide')}>Wide / Return</button><button id="close" onClick={()=>choose('close')}>Approach relief</button><button id="tour" onClick={()=>choose('tour')}>Camera study · 21s</button><label>Quality <select id="quality" value={profile} disabled={measuring} onChange={e=>{document.body.dataset.foundationReady='false';setProfile(e.target.value as Quality);}}><option value="desktop">Desktop</option><option value="quest">Quest-conscious</option></select></label></nav></footer>
    <details className="diagnostics"><summary>Technical measurements &amp; limitations</summary><button id="measure" disabled={measuring} onClick={()=>void measure()}>{measuring?'Measuring actual render submissions…':'Measure 12 rendered frames'}</button><pre>{report}</pre><p>Seven depth planes are technical slots and artistic symbolism, not a literal depiction of heavens. No approved inscription is represented here.</p></details>
  </main>;
}
createRoot(document.getElementById('foundation-root')!).render(<App/>);
