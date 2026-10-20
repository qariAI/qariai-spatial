import * as THREE from 'three';
import {SparkRenderer,SplatMesh} from '@sparkjsdev/spark';
import {arabicTexture,samplingMask} from './source-letter.js';
const started=performance.now(),stage=document.querySelector('#stage'),status=document.querySelector('#status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const params=new URLSearchParams(location.search);let mode=['original','hybrid'].includes(params.get('mode'))?params.get('mode'):'compare',view=['close','oblique'].includes(params.get('view'))?params.get('view'):'wide',breathing=false;
const UNIT=4.4,STEP=2,LAYERS=4,MAX_SPLATS=12000;let renderer,spark,mesh,face,materials=[],disposed=false,frames=[],captureUntil=0;
const report={kind:'isolated font-derived Spark letter study; NOT Quest validated',letter:'ك',codepoints:['U+0643'],baseline:'ad10ee39ee0f16262e7b3654b24bad23a34351ff',spark:'2.3.1',three:THREE.REVISION,mode,view,breathing:false,ready:false,errors:[]};
window.letterStudy={report};
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
function failure(error){report.errors.push(String(error));status.textContent='Study unavailable';const box=document.querySelector('#failure');box.hidden=false;box.textContent='The Spark study could not render. Living Orbit has not been changed. '+String(error)}
try{
 const font=await document.fonts.load('700 174px Amiri');if(!font.length||!document.fonts.check('700 174px Amiri'))throw Error('Bundled Amiri did not load; refusing fallback lettering');
 renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#03090e');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;stage.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,60),target=new THREE.Vector3(),cameraGoal=new THREE.Vector3();
 const original=new THREE.Group(),hybrid=new THREE.Group();scene.add(original,hybrid);
 const nativeFace=arabicTexture('ك'),source=nativeFace.image.getContext('2d').getImageData(0,0,256,256),mask=samplingMask('ك');
 // Freeze the original canvas readback once. Canvas GPU/CPU readback paths can
 // round faint glow differently on repeated reads; an immutable RGBA upload
 // keeps the exact first snapshot authoritative for both treatments.
 face=new THREE.DataTexture(new Uint8Array(source.data),256,256,THREE.RGBAFormat);face.colorSpace=THREE.SRGBColorSpace;face.flipY=true;face.generateMipmaps=true;face.minFilter=THREE.LinearMipmapLinearFilter;face.magFilter=THREE.LinearFilter;face.needsUpdate=true;nativeFace.dispose();
 report.faceHash=await hash(source.data);report.maskHash=await hash(mask.data);report.fontHash=await hash(await (await fetch('/fonts/Amiri-Bold.ttf')).arrayBuffer());
 const plane=new THREE.PlaneGeometry(UNIT,UNIT),faceMaterial=new THREE.MeshBasicMaterial({map:face,transparent:true,depthWrite:false,side:THREE.DoubleSide});materials.push(faceMaterial);
 for(const group of [original,hybrid]){const f=new THREE.Mesh(plane,faceMaterial);f.position.z=.13;f.renderOrder=10;group.add(f)}
 spark=new SparkRenderer({renderer,maxStdDev:Math.sqrt(5),enableLod:false,maxPixelRadius:24});scene.add(spark);
 const center=new THREE.Vector3(),scale=new THREE.Vector3(),quaternion=new THREE.Quaternion(),color=new THREE.Color();const coverage=(x,y)=>x<0||y<0||x>=256||y>=256?0:mask.data[(y*256+x)*4+3];
 let count=0,boundarySamples=0;const positions=[];let minY=256,maxY=0,minX=256,maxX=0;for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(coverage(x,y)>=128){minY=Math.min(minY,y);maxY=Math.max(maxY,y);minX=Math.min(minX,x);maxX=Math.max(maxX,x)}const centerY=(128-(minY+maxY)/2)/256*UNIT;report.inkBounds=[minX,minY,maxX,maxY];
 mesh=new SplatMesh({enableLod:false,constructSplats:splats=>{
  for(let y=0;y<256;y+=STEP)for(let x=0;x<256;x+=STEP){
   if(coverage(x,y)<230)continue;const interior=Math.min(coverage(x-1,y),coverage(x+1,y),coverage(x,y-1),coverage(x,y+1))>220;
   // Edge splats are smaller so their support does not bridge counters or thin gaps.
   const r=UNIT/256*(interior?.49:.2),wave=Math.sin(x*.041+y*.053);
   for(let layer=0;layer<LAYERS;layer++){
    if(count>=MAX_SPLATS)throw Error('Splat budget exceeded');
    const z=.095-layer*.105;
    center.set((x-128)/256*UNIT,(128-y)/256*UNIT,z);scale.set(r,r,.04);
    const turquoise=!interior&&((x*7+y*3)%17===0);
    color.set(turquoise?'#70b9a8':layer===0?'#e9d4a0':layer===1?'#bd9454':layer===2?'#8f6539':'#533c2b');
    color.multiplyScalar(1+wave*.045);
    splats.pushSplat(center,scale,quaternion,interior?.82:.5,color);positions.push([x,y,layer]);count++;
   }
   if(!interior)boundarySamples++;
  }
 }});await mesh.initialized;hybrid.add(mesh);
 report.splats=count;report.packedUsedBytes=count*16;report.packedCapacityBytes=mesh.packedSplats?.packedArray?.byteLength??null;report.boundarySamples=boundarySamples;report.depthRange=[-.22,.095];report.sourceHashAfterConstruction=await hash(face.image.data);report.samplingCentersInMask=positions.every(([x,y])=>coverage(x,y)>=230);report.faceSharedIdentity=original.children[0].material===hybrid.children[0].material;
 // A small deterministic, non-text star field. It is shared by both treatments.
 const stars=new Float32Array(260*3);let seed=72;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};for(let i=0;i<260;i++){stars[i*3]=(random()-.5)*24;stars[i*3+1]=(random()-.5)*12;stars[i*3+2]=-4-random()*6}
 const starsGeometry=new THREE.BufferGeometry();starsGeometry.setAttribute('position',new THREE.BufferAttribute(stars,3));const starsMaterial=new THREE.PointsMaterial({color:'#8daaa6',size:.012,transparent:true,opacity:.37});materials.push(starsMaterial);scene.add(new THREE.Points(starsGeometry,starsMaterial));
 function setState(nextMode=mode,nextView=view,instant=false){mode=nextMode;view=nextView;report.mode=mode;report.view=view;original.visible=mode!=='hybrid';hybrid.visible=mode!=='original';original.position.x=mode==='compare'?-2.35:0;hybrid.position.x=mode==='compare'?2.35:0;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  const labels=document.querySelector('#labels');labels.classList.toggle('single',mode!=='compare');labels.lastElementChild.textContent=mode==='original'?'01 / ORIGINAL':mode==='hybrid'?'02 / SPARK + ORIGINAL FACE':'02 / SPARK + ORIGINAL FACE';
  const width=stage.clientWidth,height=stage.clientHeight,aspect=width/height;
  const distance=mode==='compare'?Math.max(12,9/aspect):Math.max(7,5/aspect);
  cameraGoal.set(view==='oblique'?2.8:0,centerY+(view==='oblique'?.35:0),view==='wide'?distance:view==='close'?(mode==='compare'?10:6.4):(mode==='compare'?10:5.8));
  if(instant)camera.position.copy(cameraGoal);target.set(0,centerY,0);report.settled=false;
 }
 const resize=()=>{renderer.setSize(stage.clientWidth,stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();setState(mode,view,true)};resize();window.addEventListener('resize',resize);
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setState(b.dataset.mode,view)));document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setState(mode,b.dataset.view)));
 document.querySelector('#motion').addEventListener('click',e=>{breathing=!breathing;report.breathing=breathing;e.currentTarget.textContent=breathing?'Pause breathing light':'Enable breathing light';e.currentTarget.setAttribute('aria-pressed',String(breathing))});
 let previous=null,previousFrame=null;renderer.setAnimationLoop(time=>{if(disposed)return;const now=performance.now(),delta=previous===null?0:Math.min((now-previous)/1000,.25);previous=now;
  camera.position.lerp(cameraGoal,reduced?1:1-Math.exp(-delta*7));camera.lookAt(target);report.settled=camera.position.distanceTo(cameraGoal)<.001;
  mesh.recolor.setScalar(breathing?1+.035*Math.sin(time*.0009):1);
  const start=performance.now();renderer.render(scene,camera);const end=performance.now();
  if(report.ready&&now>=captureUntil&&report.settled){frames.push({intervalMs:previousFrame===null?null:now-previousFrame,submitMs:end-start});if(frames.length>180)frames.shift()}previousFrame=now;
  report.render={...renderer.info.render};report.memory={...renderer.info.memory};report.frameSamples=frames.length;
 });
 window.letterStudy.setState=(m,v,instant=false)=>{frames=[];setState(m,v,instant)};
 window.letterStudy.measure=()=>({report:{...report},camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),projection:camera.projectionMatrix.toArray()},frames:[...frames],textures:collectTextures(scene),sparkResources:{active:spark.activeSplats,capacity:spark.maxSplats,accumulators:spark.accumulators.map(a=>({capacity:a.maxSplats,count:a.numSplats})),geometryBytes:[...new Set([plane,starsGeometry,spark.geometry])].reduce((n,g)=>n+Object.values(g.attributes).reduce((a,b)=>a+b.array.byteLength,0)+(g.index?.array.byteLength||0),0)}});
 window.letterStudy.capture=()=>{captureUntil=performance.now()+2000;renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png')};
 window.letterStudy.faceBytes=()=>Array.from(source.data);window.letterStudy.maskBytes=()=>Array.from(mask.data);window.letterStudy.currentFaceBytes=()=>Array.from(face.image.data);
 report.ready=true;report.readyMs=performance.now()-started;status.textContent=`Ready · ${count.toLocaleString()} splats · Original letter face retained · Desktop study`;
 window.addEventListener('pagehide',()=>{disposed=true;renderer.setAnimationLoop(null);mesh.dispose();spark.dispose();face.dispose();plane.dispose();starsGeometry.dispose();materials.forEach(m=>m.dispose());renderer.dispose()},{once:true});
 renderer.domElement.addEventListener('webglcontextlost',()=>failure('WebGL context lost; reload to retry'));
 function collectTextures(s){const textures=new Set([mesh.packedSplats?.source,spark.orderingTexture,...spark.accumulators.flatMap(a=>a.getTextures())].filter(Boolean));s.traverse(o=>{for(const mat of [].concat(o.material||[]))for(const t of Object.values(mat))if(t?.isTexture)textures.add(t)});return [...textures].map(t=>({width:t.image?.width,height:t.image?.height,depth:t.image?.depth,type:t.type,format:t.format,mips:t.generateMipmaps,estimatedBytes:(t.image?.width||0)*(t.image?.height||0)*(t.image?.depth||1)*(t.format===THREE.RGFormat||t.format===THREE.RGIntegerFormat?2:t.format===THREE.RedFormat||t.format===THREE.RedIntegerFormat?1:4)*(t.type===THREE.UnsignedByteType?1:t.type===THREE.HalfFloatType?2:4)*(t.generateMipmaps?4/3:1)}));}
}catch(error){failure(error);console.error(error)}
