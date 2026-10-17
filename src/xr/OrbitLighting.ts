import * as THREE from 'three';

// Authored values from the existing Living Orbit installation, not a new light rig.
export const ORBIT_POINT_LIGHTS = [
  { name: 'qari-light-sun', intensity: 160, distance: 160, decay: 2 },
  { name: 'qari-light-emerald', intensity: 20, distance: 200, decay: 2 },
  { name: 'qari-light-blue', intensity: 15, distance: 200, decay: 2 },
] as const;

/** Sync after WorldAnchor's existing transform update, before light uniforms upload.
 * The installation uses uniform positive scaling. Three does not scale point-light
 * intensity/cutoff with its parent. This preserves authored inverse-square lighting
 * where Three's 0.01 attenuation denominator floor is inactive (validated surfaces).
 */
export class OrbitLighting {
  private anchor: THREE.Object3D | null = null;
  private points: (THREE.PointLight | undefined)[] = [];
  private directional: THREE.DirectionalLight | undefined;
  private readonly worldScale = new THREE.Vector3();
  private readonly target = new THREE.Vector3();

  update(anchor: THREE.Object3D, presenting: boolean) {
    if (anchor !== this.anchor || this.points.some(light => !light) || !this.directional) {
      this.anchor = anchor;
      this.points = ORBIT_POINT_LIGHTS.map(spec => {
        const light = anchor.getObjectByName(spec.name);
        return light instanceof THREE.PointLight ? light : undefined;
      });
      const light = anchor.getObjectByName('qari-light-directional');
      this.directional = light instanceof THREE.DirectionalLight ? light : undefined;
    }
    anchor.updateWorldMatrix(true, false);
    this.points.forEach((light, index) => {
      if (!light) return;
      const spec = ORBIT_POINT_LIGHTS[index];
      light.getWorldScale(this.worldScale);
      const scale = presenting ? Math.max(this.worldScale.x, this.worldScale.y, this.worldScale.z) : 1;
      // Always derive from authored values, never accumulate compensation.
      light.intensity = presenting ? spec.intensity * Math.pow(scale, light.decay) : spec.intensity;
      light.distance = presenting ? spec.distance * scale : spec.distance;
    });
    if (this.directional) {
      // Desktop anchor=(0,15,0), original unparented target=(0,0,0).
      // Its anchor-local position is (0,-15,0), NOT the installation origin.
      // Keep the existing target unparented; update only its world position.
      this.target.set(0, -15, 0);
      anchor.localToWorld(this.target);
      this.directional.target.position.copy(this.target);
      this.directional.target.updateMatrixWorld();
    }
  }
}
