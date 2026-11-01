import * as THREE from 'three';
import { GUIDE, Tracing, Pinch, type Point } from './tracing';
import { SessionOwner } from './session';
import './style.css';
import { endBeforeNavigation } from '../integration/navigation';
import { experienceHref, preserveExperienceLinks } from '../integration/routes';
import {progressDisplay} from './progress';
import { inkPath, GOLD_STOPS } from './ink';
import { BA } from './letters/definition';
import { orbitArtEnabled } from '../orbit-art/mode';
import {GuidePractice,GUIDE_IDS} from './guide-practice';
import {PRACTICES} from '../integration/practice';
import {requestedPractice} from '../integration/routes';
import {createKafAsset,type KafAsset} from '../orbit-art/kafAsset';
import {JointHandVisual} from '../xr/JointHandVisual';
import { satinSapphire } from './desktop-finish';
preserveExperienceLinks(document, location.search);
const bodyOutline=new Path2D(BA.bodyOutline), dotOutline=new Path2D(BA.dotOutline);
const host = document.querySelector<HTMLDivElement>('#surface')!, status = document.querySelector<HTMLParagraphElement>('#status')!;
const enter = document.querySelector<HTMLButtonElement>('#enter')!, leave = document.querySelector<HTMLButtonElement>('#leave')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
host.append(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#08131f');
const camera = new THREE.PerspectiveCamera(45, 1, .01, 20);
camera.position.set(0, 0, .85);
const mode=requestedPractice(location.search);
const guide=mode?new GuidePractice(mode):null;
const trace=guide??new Tracing(),board=new THREE.Group();board.name='qari-guide-board';
let inspecting=false,sculpture:KafAsset|null=null,inspectionRevision=0;
const sculptureRoot=new THREE.Group();board.add(sculptureRoot);
scene.add(new THREE.AmbientLight('#dae6ff',2));const keyLight=new THREE.DirectionalLight('#ffdfae',3);keyLight.position.set(1,2,3);scene.add(keyLight);
const handVisual=new JointHandVisual();scene.add(handVisual.root);
if(guide){document.querySelector('h1')!.textContent='Follow the same source-backed guides in VR.';document.querySelector('h1 + p')!.textContent='Shape following only. Stroke order, pressure and mastery are not graded.'}
scene.add(board);
const canvas = document.createElement('canvas');
canvas.width = 900;
canvas.height = 650;
const ctx = canvas.getContext('2d')!, texture = new THREE.CanvasTexture(canvas);
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
const gold=ctx.createLinearGradient(0,106,0,494);
for(const [position,color] of GOLD_STOPS)gold.addColorStop(position,color);
const sapphire = orbitArtEnabled(location.search) ? satinSapphire(ctx) : null;
const geometry = new THREE.PlaneGeometry(.72, .52), material = new THREE.MeshBasicMaterial({ map: texture });
const surface = new THREE.Mesh(geometry, material);
board.add(surface);
const jointGeometry = new THREE.SphereGeometry(1, 8, 6), jointMaterial = new THREE.MeshBasicMaterial({ color: '#9bd7cb' });
const hands = [0, 1].map(() => { const mesh = new THREE.InstancedMesh(jointGeometry, jointMaterial, 25); mesh.frustumCulled = false; mesh.visible = false; if(!guide)scene.add(mesh); return mesh; });
const markerGeometry = new THREE.RingGeometry(.005, .008, 24), markerMaterial = new THREE.MeshBasicMaterial({ color: '#91dac6', depthTest: false });
const cursor = new THREE.Mesh(markerGeometry, markerMaterial);
cursor.visible = false;
cursor.renderOrder = 2;
board.add(cursor);
let handStatus = '', dirty = true, placed = false, owner: XRInputSource | null = null, pointer: number | null = null, disposed = false, lastTime = 0;
const gates = new Map<XRInputSource, {
    pinch: Pinch;
    previous: boolean;
    filtered: Point | null;
    action: string | null;
    actionSince: number;
}>();
function setStatus() {
 if(guide){renderer.domElement.dataset.practice=guide.mode;renderer.domElement.dataset.guideComplete=String(guide.phase==='complete');renderer.domElement.dataset.inspecting=String(inspecting);status.textContent=handStatus||guide.feedback;return}
 status.textContent = trace.phase==='body'?trace.feedback:progressDisplay(trace).label; }
function reset() { closeSculpture();trace.reset(); owner = null; pointer = null; gates.forEach(g => { g.pinch.loseTracking(); g.previous = false; g.filtered = null; g.action = null; }); dirty = true; setStatus(); }
function closeSculpture(){inspectionRevision++;inspecting=false;sculpture?.dispose();sculpture=null;sculptureRoot.clear();sculptureRoot.rotation.set(0,0,0);sculptureRoot.scale.setScalar(1)}
async function inspectGuide(){
 if(!guide||guide.phase!=='complete')return;
 try{
  closeSculpture();const revision=inspectionRevision;guide.feedback='Loading the original Amiri sculpture…';dirty=true;
  const faces=await document.fonts.load('700 100px Amiri','ك ل ف ي');if(!faces.length)throw Error('Original Amiri font unavailable');
  if(disposed||revision!==inspectionRevision||guide.phase!=='complete')return;
  sculpture=createKafAsset(renderer,PRACTICES[guide.mode].letter);const object=sculpture.group;object.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(object),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const fit=.23/Math.max(size.x,size.y);const holder=new THREE.Group();holder.add(object);holder.scale.setScalar(fit);object.position.sub(center);
  sculptureRoot.add(holder);sculptureRoot.position.set(0,.03,.04);inspecting=true;guide.feedback='Original Amiri sculpture ready · use the rotation controls';dirty=true;
 }catch(e){closeSculpture();guide.feedback='Sculpture could not load. Return to the guide and retry.';console.error(e)}
}
function guideAction(action:string){
 if(!guide)return;
 if(action.startsWith('guide:')){closeSculpture();guide.select(GUIDE_IDS[Number(action.slice(6))]);}
 else if(action==='next'){closeSculpture();guide.select(GUIDE_IDS[(GUIDE_IDS.indexOf(guide.mode)+1)%GUIDE_IDS.length]);}
 else if(action==='undo'){guide.undo()}
 else if(action==='redo'){guide.redo()}
 else if(action==='inspect'){void inspectGuide()}
 else if(action==='left')sculptureRoot.rotation.y-=Math.PI/8;
 else if(action==='right')sculptureRoot.rotation.y+=Math.PI/8;
 else if(action==='fit'){sculptureRoot.rotation.set(0,0,0)}
 else if(action==='guide'){closeSculpture();guide.feedback='Practice guide completed'}
 else if(action==='reset'){reset()}
 else if(action==='exit'){void navigateFromStudio('/')}
 const query=new URLSearchParams(location.search);query.set('practice',guide.mode);history.replaceState(null,'','?'+query);preserveExperienceLinks(document,location.search);
 dirty=true;setStatus();
}
function paint() {
    ctx.fillStyle = '#102a3c';
    ctx.fillRect(0, 0, 900, 650);
    if(guide){
     guide.paint(ctx);
     if(handStatus){ctx.fillStyle='#102a3c';ctx.fillRect(0,620,900,30);ctx.fillStyle='#b6d3cc';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText(handStatus,450,637,850)}
     if(inspecting){
      ctx.fillStyle='#102a3c';ctx.fillRect(0,130,900,345);ctx.fillStyle='#97e2cf';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('Original Amiri sculpture · inspect with the buttons below',450,155);
      for(const [i,label]of ['Rotate left','Rotate right','Reset view','Back to guide'].entries()){ctx.fillStyle='#263f50';ctx.fillRect(35+i*212,480,195,46);ctx.fillStyle='#f4dfad';ctx.fillText(label,132+i*212,510)}
     }
     texture.needsUpdate=true;dirty=false;setStatus();return;
    }
    ctx.strokeStyle = '#284656';
    ctx.lineWidth = 1;
    for (let x = 0; x < 900; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 90);
        ctx.lineTo(x, 510);
        ctx.stroke();
    }
    for (let y = 105; y < 530; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(900, y);
        ctx.stroke();
    }
    ctx.fillStyle = '#eed6a1';
    ctx.font = 'bold 27px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HARF STUDIO / BĀʾ', 35, 40);
    ctx.fillStyle = '#a9c5cc';
    ctx.font = '18px sans-serif';
    ctx.fillText('Amiri Naskh · sourced form, practice stroke pending expert review', 35, 72);
    const desktopFinish = sapphire !== null && !renderer.xr.isPresenting;
    ctx.fillStyle=desktopFinish?sapphire!:trace.phase==='body'?'#355565':'#665b40';ctx.fill(bodyOutline);
    ctx.strokeStyle=desktopFinish?'#7c9aad':'#91a9aa';ctx.lineWidth=1;ctx.stroke(bodyOutline);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#bad0cb';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 13]);
    ctx.beginPath();
    GUIDE.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.save();ctx.clip(bodyOutline);
    ctx.fillStyle = gold;
    ctx.fill(new Path2D(inkPath(trace.strokes)));
    ctx.restore();
    const disc = (p: Point, r: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); };
    disc(GUIDE[0], 14, trace.phase === 'body' ? '#94dbc9' : '#627882');
    disc(GUIDE[GUIDE.length - 1], 10, '#e3c68d');
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#b9e3d8';
    ctx.fillText('START', GUIDE[0].x, GUIDE[0].y-28);
    ctx.fillStyle = '#d5bf97';
    ctx.fillText('FINISH', GUIDE.at(-1)!.x, GUIDE.at(-1)!.y-28);
    ctx.fillStyle=trace.phase==='complete'?gold:trace.phase==='dot'?'#a68e59':'#355565';
    ctx.fill(dotOutline);ctx.strokeStyle='#a9b9ae';ctx.lineWidth=1;ctx.stroke(dotOutline);
    ctx.fillStyle = '#d7e5df';
    ctx.font = '20px sans-serif';
    ctx.fillText(trace.phase === 'body' ? `Body · ${Math.round(trace.progress * 100)}% · right → left` : progressDisplay(trace).label, 450, 510);
    ctx.font = '17px sans-serif';
    ctx.fillStyle = '#a7c8ca';
    ctx.fillText(renderer.xr.isPresenting ? 'Index tip near surface + pinch · hold buttons briefly' : 'Drag from START · release to pause', 450, 535);
    for (const [x, text] of [[110, 'TRY AGAIN'], [510, 'RETURN TO ORBIT']] as const) {
        ctx.fillStyle = '#263f50';
        ctx.fillRect(x, 550, 280, 62);
        ctx.strokeStyle = '#b2935f';
        ctx.strokeRect(x, 550, 280, 62);
        ctx.fillStyle = '#f1d69d';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(text, x + 140, 590);
    }
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#b6d3cc';
    ctx.fillText(handStatus || trace.feedback, 450, 636);
    texture.needsUpdate = true;
    dirty = false;
}
const ownerSession = new SessionOwner<XRSession>(async (session) => { if (disposed) throw Error('Writing surface was closed'); pointer = null; guide?guide.cancel():trace.end(); await renderer.xr.setSession(session); placed = false; enter.disabled = true; leave.disabled = false; status.textContent = 'Open your hands. Bring your index fingertip near START and pinch to trace.'; }, () => { board.position.set(0, 0, 0); board.quaternion.identity(); board.updateMatrixWorld(true); placed = false; owner = null; gates.clear(); handStatus = ''; hands.forEach(h => h.visible = false); cursor.visible = false; guide?guide.cancel():trace.end(); enter.disabled = false; leave.disabled = true; dirty = true; status.textContent = 'VR ended. Your tracing remains available; drag to continue or try again.'; });
enter.onclick = async () => { enter.disabled = true; try {
    if (!navigator.xr)
        throw Error('WebXR unavailable');
    await ownerSession.start(() => navigator.xr!.requestSession('immersive-vr', { requiredFeatures: ['local-floor', 'hand-tracking'] }));
}
catch (e) {
    status.textContent = `Could not enter hand-tracking VR: ${e instanceof Error ? e.message : String(e)}. Desktop practice remains available.`;
    enter.disabled = false;
} };
let navigating=false;
async function navigateFromStudio(path:'/'|'/harf-studio.html'){
 if(navigating)return;
 if(ownerSession.starting){status.textContent='VR is starting. Wait before leaving the page.';return;}
 navigating=true;
 try{await endBeforeNavigation(ownerSession.current,()=>location.assign(experienceHref(path,location.search)));}
 catch(error){trace.feedback=error instanceof Error?error.message:String(error);status.textContent=trace.feedback;dirty=true;}
 finally{navigating=false;}
}
document.querySelector<HTMLAnchorElement>('#return-orbit')!.onclick=event=>{event.preventDefault();void navigateFromStudio('/');};
document.querySelector<HTMLAnchorElement>('#desktop-practice')!.onclick=event=>{event.preventDefault();void navigateFromStudio('/harf-studio.html');};
leave.onclick = () => void ownerSession.stop().catch(() => { status.textContent = 'Use the Quest system menu to leave VR if the browser cannot end the session.'; });
document.querySelector<HTMLButtonElement>('#retry')!.onclick = reset;
async function support() { try {
    const supported = !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr');
    enter.disabled = !supported;
    enter.textContent = supported ? 'Enter Quest hand-tracking VR' : 'VR unavailable · desktop ready';
}
catch {
    enter.textContent = 'VR unavailable · desktop ready';
} }
void support();
const ray = new THREE.Raycaster(), uv = new THREE.Vector2(), scratch = new THREE.Vector3(), thumb = new THREE.Vector3(), matrix = new THREE.Matrix4(), jointObject = new THREE.Object3D();
function pointerPoint(e: PointerEvent): Point | null { const r = renderer.domElement.getBoundingClientRect(); uv.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(uv, camera); const hit = ray.intersectObject(surface)[0]; return hit?.uv ? { x: hit.uv.x * 900, y: (1 - hit.uv.y) * 650 } : null; }
function actionAt(p: Point) {
 if(guide){
  if(p.y>=84&&p.y<=126&&p.x>=35&&p.x<866){const i=Math.floor((p.x-35)/212);return p.x-35-i*212<=195?'guide:'+i:null}
  if(p.y>=480&&p.y<=526&&p.x>=35&&p.x<866){const i=Math.floor((p.x-35)/212);if(p.x-35-i*212>195)return null;
   if(inspecting)return ['left','right','fit','guide'][i];
   return [guide.canUndo?'undo':null,guide.canRedo?'redo':null,'reset',guide.phase==='complete'?'inspect':null][i];
  }
  if(p.y>=550&&p.y<=612)return p.x>=110&&p.x<=390?'next':p.x>=510&&p.x<=790?'exit':null;
  return null;
 }
 return p.y >= 550 && p.y <= 612 ? (p.x >= 110 && p.x <= 390 ? 'reset' : p.x >= 510 && p.x <= 790 ? 'exit' : null) : null; }
renderer.domElement.addEventListener('pointerdown', e => { if (renderer.xr.isPresenting || pointer !== null)
    return; e.preventDefault(); const p = pointerPoint(e); if (!p)
    return; const action = actionAt(p);if(guide&&action){guideAction(action);return}if(inspecting)return; if (action === 'reset') {
    reset();
    return;
} if (action === 'exit') {
    status.textContent = 'You are already outside VR.';
    return;
} pointer = e.pointerId; renderer.domElement.setPointerCapture(e.pointerId); trace.begin(p); dirty = true; setStatus(); });
renderer.domElement.addEventListener('pointermove', e => { if (pointer !== e.pointerId)
    return; e.preventDefault(); const p = pointerPoint(e); if (p) {
    trace.move(p);
    dirty = true;
    setStatus();
} });
const release = (e: PointerEvent) => { if (pointer !== e.pointerId)
    return; pointer = null;if(guide&&e.type!=='pointerup')guide.cancel();else trace.end();dirty=true;setStatus(); if (renderer.domElement.hasPointerCapture(e.pointerId))
    renderer.domElement.releasePointerCapture(e.pointerId); };
renderer.domElement.addEventListener('pointerup', release);
renderer.domElement.addEventListener('pointercancel', release);
renderer.domElement.addEventListener('lostpointercapture', release);
function resize() { const { width, height } = host.getBoundingClientRect(); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); }
const observer = new ResizeObserver(resize);
observer.observe(host);
resize();
renderer.setAnimationLoop((time, frame) => {
    if (disposed)
        return;
    const dt = Math.min(.05, Math.max(.001, (time - lastTime) / 1000));
    lastTime = time;
    const reference = renderer.xr.getReferenceSpace();
    handVisual.update(frame,reference,renderer.xr.isPresenting&&ownerSession.current?.visibilityState!=='hidden'?Array.from(ownerSession.current?.inputSources??[]):[]);
    cursor.visible = false;
    hands.forEach(h => h.visible = false);
    if (frame && reference && renderer.xr.isPresenting) {
        if (!placed) {
            const viewer = frame.getViewerPose(reference);
            if (viewer) {
                const t = viewer.transform;
                board.position.set(t.position.x, t.position.y - (guide?.04:.16), t.position.z);
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(t.orientation.x, t.orientation.y, t.orientation.z, t.orientation.w));
                forward.y = 0;
                if (forward.lengthSq() < .01)
                    forward.set(0, 0, -1);
                forward.normalize();
                board.position.addScaledVector(forward, .55);
                board.rotation.set(0, Math.atan2(-forward.x, -forward.z), 0);
                board.updateMatrixWorld(true);
                placed = true;
                dirty = true;
            }
        }
        const hidden = ownerSession.current?.visibilityState === 'hidden';
        const sources = hidden ? [] : Array.from(ownerSession.current?.inputSources ?? []).filter(s => s.hand).slice(0, 2);
        for (const source of gates.keys())
            if (!sources.includes(source)) {
                gates.delete(source);
                if (owner === source) {
                    guide?guide.cancel():trace.end();
                    owner = null;
                }
            }
        let tracked = 0;
        sources.forEach((source, handIndex) => {
            let g = gates.get(source);
            if (!g) {
                g = { pinch: new Pinch(), previous: false, filtered: null, action: null, actionSince: 0 };
                gates.set(source, g);
            }
            const indexSpace = source.hand!.get('index-finger-tip'), thumbSpace = source.hand!.get('thumb-tip');
            const index = indexSpace && frame.getJointPose?.(indexSpace, reference), thumbPose = thumbSpace && frame.getJointPose?.(thumbSpace, reference);
            let count = 0;
            for (const space of source.hand!.values()) {
                const pose = frame.getJointPose?.(space, reference);
                if (!pose)
                    continue;
                const p = pose.transform.position;
                jointObject.position.set(p.x, p.y, p.z);
                jointObject.scale.setScalar(Math.min(.012, Math.max(.004, pose.radius ?? .007)));
                jointObject.updateMatrix();
                hands[handIndex].setMatrixAt(count++, jointObject.matrix);
            }
            hands[handIndex].count = count;
            hands[handIndex].visible = count > 0;
            hands[handIndex].instanceMatrix.needsUpdate = true;
            if (!index || !thumbPose || !placed) {
                g.pinch.loseTracking();
                g.previous = false;
                g.filtered = null;
                g.action = null;
                if (owner === source) {
                    guide?guide.cancel():trace.end();
                    owner = null;
                }
                dirty=true;return;
            }
            tracked++;
            const ip = index.transform.position, tp = thumbPose.transform.position;
            scratch.set(ip.x, ip.y, ip.z);
            thumb.set(tp.x, tp.y, tp.z);
            const down = g.pinch.update(scratch.distanceTo(thumb), time);
            matrix.copy(board.matrixWorld).invert();
            scratch.applyMatrix4(matrix);
            const near = Math.abs(scratch.z) < .065 && Math.abs(scratch.x) < .37 && Math.abs(scratch.y) < .27;
            const raw = { x: (scratch.x / .72 + .5) * 900, y: (.5 - scratch.y / .52) * 650 };
            if (!near) {
                g.filtered = null;
                g.action = null;
                if (owner === source) {
                    guide?guide.cancel():trace.end();
                    owner = null;dirty=true;
                }
            }
            else {
                const a = 1 - Math.exp(-dt * 35);
                g.filtered = g.filtered ? { x: g.filtered.x + (raw.x - g.filtered.x) * a, y: g.filtered.y + (raw.y - g.filtered.y) * a } : raw;
                const p = g.filtered;
                if (owner === null || owner === source) {
                    cursor.position.set((p.x / 900 - .5) * .72, (.5 - p.y / 650) * .52, .002);
                    cursor.visible = true;
                    markerMaterial.color.set(down ? '#efd089' : '#91dac6');
                }
                const action = actionAt(p);
                if (down && !g.previous && owner === null) {
                    if (action) {
                        g.action = action;
                        g.actionSince = time;
                    }
                    else {
                        if (!inspecting&&trace.begin(p))
                            owner = source;
                        dirty = true;
                    }
                }
                if (down && g.action) {
                    if (action !== g.action)
                        g.action = null;
                    else if (time - g.actionSince >= 400) {
                        const chosen = g.action;
                        g.action = null;
                        g.pinch.loseTracking();
                        if(guide){guideAction(chosen);owner=null;g.previous=false;return}
                        if (chosen === 'reset')
                            reset();
                        else
                            void navigateFromStudio('/');
                    }
                }
                if (down && owner === source) {
                    const before = `${trace.strokes.at(-1)?.length}:${trace.phase}:${trace.feedback}`;
                    trace.move(p);
                    dirty ||= before !== `${trace.strokes.at(-1)?.length}:${trace.phase}:${trace.feedback}`;
                }
            }
            if (!down && g.previous) {
                g.action = null;
                if (owner === source) {
                    trace.end();dirty=true;
                    owner = null;
                }
            }
            g.previous = down;
        });
        // Never connect strokes across missing joints or headset visibility loss.
        if (ownerSession.current?.visibilityState === 'hidden') {
            owner = null;
            guide?guide.cancel():trace.end();
            gates.forEach(g => { g.pinch.loseTracking(); g.previous = false; g.filtered = null; g.action = null; });
        }
        const nextStatus = !tracked ? 'Open hands in view · index/thumb joints unavailable' : '';
        if (handStatus !== nextStatus) {
            handStatus = nextStatus;
            dirty = true;
        }
        if (!tracked)
            status.textContent = 'No index/thumb joints available. Open hands in view; controllers are not used.';
        else
            setStatus();
    }
    if(guide&&!guide.active&&owner){owner=null;dirty=true}
    if(guide&&guide.active&&inspecting)closeSculpture();
    if (dirty)
        paint();
    renderer.render(scene, camera);
});
function dispose() { if (disposed)
    return; disposed = true; void ownerSession.stop().catch(() => { }); observer.disconnect(); renderer.setAnimationLoop(null); closeSculpture();handVisual.dispose();texture.dispose(); geometry.dispose(); material.dispose(); jointGeometry.dispose(); jointMaterial.dispose(); markerGeometry.dispose(); markerMaterial.dispose(); renderer.dispose(); gates.clear(); }
window.addEventListener('pagehide', dispose, { once: true });
// A disposed canvas cannot resume from the browser's back/forward cache.
window.addEventListener('pageshow', event => { if (event.persisted && disposed)
    location.reload(); });
