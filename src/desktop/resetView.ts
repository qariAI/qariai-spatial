import type * as THREE from 'three';

export interface ResetViewControls {
  target: THREE.Vector3;
  enableDamping: boolean;
  reset(): void;
  update(): unknown;
}

// Desktop only; the caller keeps XR and the letter inspector's camera ownership.
// Reuse the camera and controls, including their existing listeners and buffers.
export function resetDesktopView(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  controls: ResetViewControls | undefined,
) {
  const damping = controls?.enableDamping;
  try {
    if (controls) {
      // reset() ends an active controls gesture. With damping off its update also
      // drains pending rotation/pan/zoom before restoring the authored framing.
      controls.enableDamping = false;
      controls.reset();
    }
    camera.up.set(0, 1, 0);
    camera.position.set(0, 98, 169);
    camera.zoom = 1;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls?.target.set(0, 0, 0);
    controls?.update();
  } finally {
    if (controls && damping !== undefined) controls.enableDamping = damping;
  }
}
