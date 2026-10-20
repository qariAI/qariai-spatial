import * as THREE from 'three';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
import outline from './generated/kaf-outline.json';
import {crownCap} from './generated/crowned-cap';
import {designSurface} from './generated/proof-surface-design';

// Same font curves, UV transform and physical construction as approved Finish 13.
// No Spark runtime or second Three.js installation enters the Living Orbit scene.
export function createKafAsset(renderer:THREE.WebGLRenderer){
 const started=performance.now(),scale=.002990625,tx=-.9824203125,ty=-.485546875;
 if(outline.pathSha256!=='2c381807e055fc8a08b6e03f4e4c605e4279af6cbc26334e272763b862b8d8c4'||outline.contourCount!==2)throw Error('Kaf provenance mismatch');
 const shapes=new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${outline.path}"/></svg>`).paths.flatMap(p=>SVGLoader.createShapes(p));
 if(shapes.length!==2)throw Error('Kaf component lost');
 const surface=designSurface(outline,scale),[xmin,ymin,xmax,ymax]=outline.bounds;
 const gold=new THREE.MeshPhysicalMaterial({color:'#fff',map:surface.pigment,bumpMap:surface.relief,bumpScale:.5,roughnessMap:surface.relief,metalnessMap:surface.relief,metalness:1,roughness:1,clearcoat:.45,clearcoatRoughness:.6,clearcoatRoughnessMap:surface.relief,iridescence:.4,iridescenceIOR:1.3,iridescenceThicknessRange:[220,480],envMapIntensity:1.1});
 const side=new THREE.MeshPhysicalMaterial({color:'#244d78',metalness:.42,roughness:.56,iridescence:.08,iridescenceThicknessRange:[240,360],envMapIntensity:1});
 const group=new THREE.Group(),geometries:THREE.BufferGeometry[]=[];let triangles=0,bytes=0;
 const uv={generateTopUV(_g:unknown,v:number[],a:number,b:number,c:number){return[a,b,c].map(i=>new THREE.Vector2((v[i*3]-xmin)/(xmax-xmin),(v[i*3+1]-ymin)/(ymax-ymin)))},generateSideWallUV(_g:unknown,v:number[],a:number,b:number,c:number,d:number){return[a,b,c,d].map(i=>new THREE.Vector2(v[i*3]*scale,v[i*3+2]*scale))}};
 for(const shape of shapes){const source=new THREE.ExtrudeGeometry(shape,{depth:.20/scale,steps:1,curveSegments:12,bevelEnabled:true,bevelThickness:.02/scale,bevelSize:.012/scale,bevelOffset:-.012/scale,bevelSegments:4,UVGenerator:uv});source.scale(scale,scale,scale);source.translate(tx,ty,-.10);const geometry=crownCap(source,shape,{scale,tx,ty,bevel:.012}).geometry as THREE.BufferGeometry;source.dispose();geometries.push(geometry);triangles+=geometry.attributes.position.count/3;bytes+=Object.values(geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(geometry.index?.array.byteLength||0);group.add(new THREE.Mesh(geometry,[gold,side]));}
 if(triangles>20000||bytes>2*1024*1024){geometries.forEach(g=>g.dispose());gold.dispose();side.dispose();surface.dispose();throw Error('Kaf geometry budget exceeded')}
 // Local material reflection only: do not change scene.environment or the light rig.
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#131c29';ctx.fillRect(0,0,256,128);
 for(const[x,w,color]of [[25,45,'#b4bdc9'],[115,14,'#659caa'],[180,34,'#c2b398']] as const){const gradient=ctx.createLinearGradient(x,0,x+w,0);gradient.addColorStop(0,'#172131');gradient.addColorStop(.5,color);gradient.addColorStop(1,'#172131');ctx.fillStyle=gradient;ctx.fillRect(x,12,w,104)}
 const studio=new THREE.CanvasTexture(canvas);studio.colorSpace=THREE.SRGBColorSpace;studio.mapping=THREE.EquirectangularReflectionMapping;
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(studio);pmrem.dispose();studio.dispose();gold.envMap=side.envMap=environment.texture;
 group.scale.setScalar(14/4.4); // Original 14-unit letter quad, same source baseline and proportions.
 const info={pathHash:outline.pathSha256,fontHash:outline.fontSha256,components:2,triangles,geometryBytes:bytes,surface:surface.info,environment:{width:environment.width,height:environment.height,estimatedBytes:environment.width*environment.height*8},bumpScale:.5,displayScale:14/4.4,bakeMs:performance.now()-started,sharing:'one geometry/map set for both mirrored kafs',limits:'Font-derived study. Native Three 0.160 renderer; local reflection adaptation, not identical standalone studio lighting. Quest hardware unvalidated.'};
 group.userData.orbitArt=info;
 return{group,gold,side,info,dispose(){geometries.forEach(g=>g.dispose());gold.dispose();side.dispose();surface.dispose();environment.dispose()}};
}
export type KafAsset=ReturnType<typeof createKafAsset>;
