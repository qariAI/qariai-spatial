import * as THREE from 'three';
const CHAINS=[['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'],...['index','middle','ring','pinky'].map(f=>['wrist',`${f}-finger-metacarpal`,`${f}-finger-phalanx-proximal`,`${f}-finger-phalanx-intermediate`,`${f}-finger-phalanx-distal`,`${f}-finger-tip`])];
/** Local joint/bone rendering: no external hand-model download is required. */
export class JointHandVisual {
 readonly root=new THREE.Group();
 private sphere=new THREE.SphereGeometry(1,8,6);
 private cylinder=new THREE.CylinderGeometry(1,1,1,6);
 private material=new THREE.MeshBasicMaterial({color:'#9cdece',transparent:true,opacity:.9,depthTest:false,depthWrite:false});
 private joints=new THREE.InstancedMesh(this.sphere,this.material,50);
 private bones=new THREE.InstancedMesh(this.cylinder,this.material,50);
 private object=new THREE.Object3D();
 private up=new THREE.Vector3(0,1,0);
 constructor(){this.joints.renderOrder=this.bones.renderOrder=200;this.root.name='qari-tracked-hand-joints';this.joints.frustumCulled=this.bones.frustumCulled=false;this.root.add(this.joints,this.bones);this.root.visible=false}
 update(frame:XRFrame|undefined,reference:XRReferenceSpace|null,sources:readonly XRInputSource[]){
  this.root.visible=false;if(!frame||!reference)return;
  let j=0,b=0;
  for(const source of sources.filter(s=>s.hand).slice(0,2)){
   const positions=new Map<string,THREE.Vector3>();
   for(const [name,space]of source.hand!.entries()){
    const pose=frame.getJointPose?.(space,reference);if(!pose)continue;
    const p=pose.transform.position,v=new THREE.Vector3(p.x,p.y,p.z);positions.set(name,v);
    this.object.position.copy(v);this.object.quaternion.identity();this.object.scale.setScalar(Math.max(.0035,Math.min(.008,pose.radius||.005)));this.object.updateMatrix();this.joints.setMatrixAt(j++,this.object.matrix);
   }
   for(const chain of CHAINS)for(let i=1;i<chain.length;i++){
    const a=positions.get(chain[i-1]),c=positions.get(chain[i]);if(!a||!c)continue;
    const direction=c.clone().sub(a),length=direction.length();if(length<.001)continue;
    this.object.position.copy(a).add(c).multiplyScalar(.5);this.object.quaternion.setFromUnitVectors(this.up,direction.normalize());this.object.scale.set(.0025,length,.0025);this.object.updateMatrix();this.bones.setMatrixAt(b++,this.object.matrix);
   }
  }
  this.joints.count=j;this.bones.count=b;this.joints.instanceMatrix.needsUpdate=this.bones.instanceMatrix.needsUpdate=true;this.root.visible=j>0;
 }
 dispose(){this.sphere.dispose();this.cylinder.dispose();this.material.dispose();this.root.removeFromParent()}
}
