import * as THREE from 'three';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
import kafOutline from './generated/kaf-outline.json';
import outlines from './generated/letter-outlines.json';
import {designLetterSurface} from './letterSurface';
export type OrbitLetter='ك'|'ل'|'ف'|'ي';
import {crownCap} from './generated/crowned-cap';
import {designSurface} from './generated/proof-surface-design';

// Same font curves, UV transform and physical construction as approved Finish 13.
// No Spark runtime or second Three.js installation enters the Living Orbit scene.
export function createKafAsset(renderer:THREE.WebGLRenderer,letter:OrbitLetter='ك',sharedEnvironment?:THREE.Texture){
 const outline=letter==='ك'?kafOutline:outlines[letter];
 const started=performance.now(),scale=.002990625;
 const metric=document.createElement('canvas').getContext('2d')!;metric.font='bold 174px Amiri, serif';metric.textBaseline='middle';const middle=metric.measureText(letter);metric.textBaseline='alphabetic';const baseline=132+metric.measureText(letter).actualBoundingBoxAscent-middle.actualBoundingBoxAscent;
 const tx=letter==='ك'?-.9824203125:-outline.advance*scale/2,ty=letter==='ك'?-.485546875:(128-baseline)*4.4/256;
 const hashes={'ك':'2c381807e055fc8a08b6e03f4e4c605e4279af6cbc26334e272763b862b8d8c4','ل':'53c482d183e898a58f8cf983f20aeafb0db830b34600f7f14e04b8fc312c9a65','ف':'a2b5545bbb9b7e2b61b924179f83e89258393d11a0529826890e1a399994ff92','ي':'2605a72025fc298bb0081a93b8dd17d29ab5f46bf85e6b2a0411b23c590ee722'};
 if(outline.fontSha256!==kafOutline.fontSha256||outline.letter!==letter||outline.pathSha256!==hashes[letter])throw Error('Letter provenance mismatch');
 const shapes=new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${outline.path}"/></svg>`).paths.flatMap(p=>SVGLoader.createShapes(p));
 const expected={'ك':2,'ل':1,'ف':2,'ي':2}[letter];if(shapes.length!==expected)throw Error('Letter component lost: '+letter);
 const surface=letter==='ك'?designSurface(outline,scale):designLetterSurface(outline,scale),[xmin,ymin,xmax,ymax]=outline.bounds;
 const gold=new THREE.MeshPhysicalMaterial({color:'#fff',map:surface.pigment,bumpMap:surface.relief,bumpScale:.5,roughnessMap:surface.relief,metalnessMap:surface.relief,metalness:1,roughness:1,clearcoat:.45,clearcoatRoughness:.6,clearcoatRoughnessMap:surface.relief,iridescence:.4,iridescenceIOR:1.3,iridescenceThicknessRange:[220,480],envMapIntensity:2.6,emissive:'#ffffff',emissiveMap:surface.pigment,emissiveIntensity:.45});
 // A bounded surface-only visibility floor reuses the existing pigment map.
 // No bloom, outline shell, new texture or scene illumination is introduced.
 gold.color.setRGB(1.6,1.6,1.6);
 const side=new THREE.MeshPhysicalMaterial({color:'#244d78',metalness:.42,roughness:.56,iridescence:.08,iridescenceThicknessRange:[240,360],envMapIntensity:1.6,emissive:'#244d78',emissiveIntensity:.18});
 const group=new THREE.Group(),geometries:THREE.BufferGeometry[]=[];let triangles=0,bytes=0;
 const uv={generateTopUV(_g:unknown,v:number[],a:number,b:number,c:number){return[a,b,c].map(i=>new THREE.Vector2((v[i*3]-xmin)/(xmax-xmin),(v[i*3+1]-ymin)/(ymax-ymin)))},generateSideWallUV(_g:unknown,v:number[],a:number,b:number,c:number,d:number){return[a,b,c,d].map(i=>new THREE.Vector2(v[i*3]*scale,v[i*3+2]*scale))}};
 for(const shape of shapes){const source=new THREE.ExtrudeGeometry(shape,{depth:.20/scale,steps:1,curveSegments:12,bevelEnabled:true,bevelThickness:.02/scale,bevelSize:.012/scale,bevelOffset:-.012/scale,bevelSegments:4,UVGenerator:uv});source.scale(scale,scale,scale);source.translate(tx,ty,-.10);const geometry=crownCap(source,shape,{scale,tx,ty,bevel:.012}).geometry as THREE.BufferGeometry;source.dispose();geometries.push(geometry);triangles+=geometry.attributes.position.count/3;bytes+=Object.values(geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(geometry.index?.array.byteLength||0);group.add(new THREE.Mesh(geometry,[gold,side]));}
 if(triangles>20000||bytes>2*1024*1024){geometries.forEach(g=>g.dispose());gold.dispose();side.dispose();surface.dispose();throw Error('Letter geometry budget exceeded: '+letter)}
 // Local material reflection only: do not change scene.environment or the light rig.
 let environment:THREE.WebGLRenderTarget|undefined;let reflection=sharedEnvironment;
 if(!reflection){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#131c29';ctx.fillRect(0,0,256,128);
 for(const[x,w,color]of [[25,45,'#b4bdc9'],[115,14,'#659caa'],[180,34,'#c2b398']] as const){const gradient=ctx.createLinearGradient(x,0,x+w,0);gradient.addColorStop(0,'#172131');gradient.addColorStop(.5,color);gradient.addColorStop(1,'#172131');ctx.fillStyle=gradient;ctx.fillRect(x,12,w,104)}
 const studio=new THREE.CanvasTexture(canvas);studio.colorSpace=THREE.SRGBColorSpace;studio.mapping=THREE.EquirectangularReflectionMapping;
 const pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromEquirectangular(studio);pmrem.dispose();studio.dispose();reflection=environment.texture;
 }
 gold.envMap=side.envMap=reflection;
 group.scale.setScalar(14/4.4); // Original 14-unit letter quad, same source baseline and proportions.
 const info={letter,baseline,holes:shapes.reduce((n,s)=>n+s.holes.length,0),materialRevision:2,visibility:{faceLinearGain:1.6,faceReflection:2.6,faceEmissionFloor:.45,selectedFaceEmission:.75,sideReflection:1.6,sideEmissionFloor:.18,selectedSideEmission:.32,emissionUsesExistingPigment:true,noBloom:true},pathHash:outline.pathSha256,fontHash:outline.fontSha256,components:shapes.length,triangles,geometryBytes:bytes,surface:surface.info,environment:{width:reflection.image.width,height:reflection.image.height,estimatedBytes:reflection.image.width*reflection.image.height*8,shared:!!sharedEnvironment},bumpScale:.5,displayScale:14/4.4,bakeMs:performance.now()-started,sharing:'one geometry/map set per unique letter, shared by its mirrored positions',limits:'Font-derived study. Native Three 0.160 renderer; local reflection adaptation, not identical standalone studio lighting. Quest hardware unvalidated.'};
 group.userData.orbitArt=info;
 return{group,gold,side,info,dispose(){geometries.forEach(g=>g.dispose());gold.dispose();side.dispose();surface.dispose();environment?.dispose()}};
}
export type KafAsset=ReturnType<typeof createKafAsset>;
