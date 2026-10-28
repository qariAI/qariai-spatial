'use strict';

// Passive React DevTools inspection of the real production R3F store. No render,
// animation, camera, material, timing or input callbacks are replaced.
function installObserver() {
  const audit = window.__qariAcceptance = { version: 1, store: null, events: [],
    amiriReadyMs: null, completeSubmittedMs: null, candidateFrame: null, candidateRoot: null };
  const roots = new Set();
  const inspect = root => {
    if (!root?.current) return;
    const pending = [root.current];
    let visited = 0;
    while (pending.length && visited++ < 20000) {
      const fiber = pending.pop();
      for (const candidate of [fiber.memoizedProps?.value, fiber.stateNode?.__r3f?.root]) {
        if (typeof candidate?.getState !== 'function') continue;
        try {
          const state = candidate.getState();
          if (state?.gl?.domElement && state.scene?.isScene) audit.store = candidate;
        } catch { /* Unrelated React contexts are not R3F stores. */ }
      }
      if (fiber.child) pending.push(fiber.child);
      if (fiber.sibling) pending.push(fiber.sibling);
    }
  };
  let rendererId = 0;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true, renderers: new Map(),
    inject(renderer) { const id = ++rendererId; this.renderers.set(id, renderer); return id; },
    onCommitFiberRoot(_id, root) { roots.add(root); inspect(root); },
    onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}
  };
  const fontReady = () => [...document.fonts].some(face =>
    face.family.replace(/["']/g, '') === 'Amiri' && face.status === 'loaded');
  audit.snapshot = () => {
    const state = audit.store?.getState();
    if (!state?.scene || !state.gl) return { observerReady: false };
    const scene = state.scene;
    const calligraphy = scene.getObjectByName('calligraphy-depth-art');
    const atlasTextures = new Set();
    calligraphy?.traverse(object => {
      for (const material of [].concat(object.material || [])) {
        for (const key of ['map', 'bumpMap', 'roughnessMap']) {
          if (material[key]?.uuid) atlasTextures.add(material[key].uuid);
        }
      }
    });
    const letters = Array.from({ length: 7 }, (_, index) => {
      const object = scene.getObjectByName('qari-letter-' + index);
      let sculpture = null;
      const geometries = [];
      object?.traverse(child => {
        if (child.userData?.orbitArt) sculpture = child.userData.orbitArt;
        if (child.geometry?.uuid) geometries.push(child.geometry.uuid);
      });
      return { index, exists: !!object, letter: sculpture?.letter || null,
        scale: object?.scale.x ?? null, geometries };
    });
    const canvas = state.gl.domElement;
    const complete = !!calligraphy?.userData.textureProfile && fontReady() &&
      letters.every(letter => letter.exists && letter.letter);
    return { observerReady: true, complete, amiriLoaded: fontReady(),
      calligraphyId: calligraphy?.uuid || null, atlasTextures: [...atlasTextures].sort(),
      letters, frame: state.gl.info.render.frame, calls: state.gl.info.render.calls,
      triangles: state.gl.info.render.triangles, memory: { ...state.gl.info.memory },
      camera: { position: state.camera.position.toArray(), quaternion: state.camera.quaternion.toArray() },
      controlsEnabled: state.controls?.enabled ?? null,
      xrPresenting: state.gl.xr.isPresenting, xrSessionActive: !!state.gl.xr.getSession(),
      canvasVisible: canvas.clientWidth > 0 && canvas.clientHeight > 0 &&
        getComputedStyle(canvas).visibility !== 'hidden' };
  };
  const sample = () => {
    if (audit.amiriReadyMs === null && fontReady()) audit.amiriReadyMs = performance.now();
    if (!audit.store) roots.forEach(inspect);
    const snap = audit.snapshot();
    if (!snap.complete) { audit.candidateFrame = null; audit.candidateRoot = null; return; }
    if (audit.candidateRoot !== snap.calligraphyId) {
      audit.candidateRoot = snap.calligraphyId; audit.candidateFrame = snap.frame;
      audit.completeSubmittedMs = null;
    } else if (snap.frame > audit.candidateFrame && audit.completeSubmittedMs === null) {
      audit.completeSubmittedMs = performance.now();
    }
  };
  document.fonts.addEventListener('loadingdone', sample);
  setInterval(sample, 100);
  window.addEventListener('pagehide', event => {
    const entry = { type: 'pagehide', url: location.href, persisted: event.persisted, at: performance.now() };
    audit.events.push(entry);
    if (typeof window.qariLifecycle === 'function') window.qariLifecycle(entry).catch(() => {});
  });
}

module.exports = { installObserver };
