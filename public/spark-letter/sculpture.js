import * as THREE from 'three';
import {SVGLoader} from './vendor/SVGLoader.js';
// Convert the original font curves, not a raster tracing, into shallow solid relief.
export async function buildSculpture({fontHash,unit,mask,scene,renderer}){
 const outline=await (await fetch('./kaf-outline.json')).json();
 if(outline.fontSha256!==fontHash||outline.letter!=='ك'||outline.contourCount!==2)throw Error('Outline/font provenance mismatch');
 const scale=174/outline.unitsPerEm*unit/256;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font='bold 174px Amiri, serif';ctx.textAlign='center';ctx.textBaseline='middle';const m=ctx.measureText('ك');
 // Canvas text metrics use the font's conservative glyph bounds, not the
 // mathematical curve extrema. Convert baseline modes directly; using the
 // curve's y-max here would shift the sculpture by several raster pixels.
 ctx.textBaseline='alphabetic';const alphabetic=ctx.measureText('ك');
 const baseline=132+alphabetic.actualBoundingBoxAscent-m.actualBoundingBoxAscent;
 const tx=(128-outline.advance*174/outline.unitsPerEm/2-128)*unit/256,ty=(128-baseline)*unit/256;
 const data=new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="${outline.path}"/></svg>`);
 const shapes=data.paths.flatMap(p=>SVGLoader.createShapes(p));if(shapes.length!==2)throw Error('Detached kāf component or topology lost');
 const pixels=new Uint8Array(128*128*4);let seed=94;for(let i=0;i<128*128;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const rough=155+(seed%21);pixels.set([128,rough,128,255],i*4)}
 const roughness=new THREE.DataTexture(pixels,128,128);roughness.needsUpdate=true;roughness.wrapS=roughness.wrapT=THREE.RepeatWrapping;
 const gold=new THREE.MeshPhysicalMaterial({color:'#f0d9a5',metalness:.94,roughness:.31,roughnessMap:roughness,clearcoat:.28,clearcoatRoughness:.22,envMapIntensity:1.45});
 const bronze=new THREE.MeshStandardMaterial({color:'#89532d',metalness:.86,roughness:.35,envMapIntensity:.8});
 const group=new THREE.Group();group.name='font-derived-kaf-sculpture';const geometries=[];let triangles=0,bytes=0;
 const depth=.34,bevel=.007;
 const [xmin,ymin,xmax,ymax]=outline.bounds;
 const uv={generateTopUV(g,v,a,b,c){return[a,b,c].map(i=>new THREE.Vector2((v[i*3]-xmin)/(xmax-xmin),(v[i*3+1]-ymin)/(ymax-ymin)))},generateSideWallUV(g,v,a,b,c,d){return[a,b,c,d].map(i=>new THREE.Vector2(v[i*3]*scale,v[i*3+2]*scale))}};
 for(const shape of shapes){
  // Negative offset keeps the body contour at the source boundary. The narrow
  // bevel is cut inward; no outward stroke expansion or freehand replacement.
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:depth/scale,steps:1,curveSegments:12,bevelEnabled:true,bevelThickness:.012/scale,bevelSize:bevel/scale,bevelOffset:-bevel/scale,bevelSegments:3,UVGenerator:uv});
  geometry.scale(scale,scale,scale);geometry.translate(tx,ty,-.18);geometry.computeBoundingBox();geometries.push(geometry);triangles+=geometry.attributes.position.count/3;bytes+=Object.values(geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(geometry.index?.array.byteLength||0);
  const mesh=new THREE.Mesh(geometry,[gold,bronze]);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 }
 if(triangles>20000||bytes>2*1024*1024)throw Error('Single-letter geometry budget exceeded');
 // Bounded studio reflection map. Its light cards never appear as scene objects.
 const studio=new THREE.Scene();studio.background=new THREE.Color(.11,.14,.18);const cards=[];
 for(const [position,size,rgb] of [[[-3,3,4],[2,6],[5,4.5,3.7]],[[4,1,2],[1,5],[1.5,2.1,2.3]],[[0,5,-1],[5,1],[2.5,2.1,1.5]]]){const material=new THREE.MeshBasicMaterial();material.color.setRGB(...rgb);const card=new THREE.Mesh(new THREE.PlaneGeometry(...size),material);card.position.set(...position);card.lookAt(0,0,0);studio.add(card);cards.push(card)}
 const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(studio,.035,.1,50,{size:128});scene.environment=environment.texture;pmrem.dispose();cards.forEach(c=>{c.geometry.dispose();c.material.dispose()});
 const key=new THREE.DirectionalLight('#fff1d3',3.1);key.position.set(-3,4,5);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=key.shadow.camera.bottom=-6;key.shadow.camera.right=key.shadow.camera.top=6;key.shadow.normalBias=.012;key.shadow.bias=-.0002;scene.add(key,key.target);
 const rim=new THREE.PointLight('#8bc7b7',8,15,2);rim.position.set(3,1,2);scene.add(rim);scene.add(new THREE.HemisphereLight('#b2c2d5','#352a20',.5));
 // Shared dark receiving plane gives the solid letter a genuine cast shadow.
 const floorGeometry=new THREE.PlaneGeometry(20,12),floorMaterial=new THREE.MeshStandardMaterial({color:'#03080d',roughness:.9,metalness:0});
 const floor=new THREE.Mesh(floorGeometry,floorMaterial);floor.position.set(0,-1.05,-1.9);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const bounds=new THREE.Box3().setFromObject(group);
 const info={kind:'physical extrusion of original font vectors; not raster tracing',glyph:outline.glyph,pathHash:outline.pathSha256,fontHash,components:shapes.length,triangles,geometryBytes:bytes,depth,bevel,bevelDirection:'inward',bounds:[bounds.min.toArray(),bounds.max.toArray()],sourceBoundsWorld:[[xmin*scale+tx,ymin*scale+ty],[xmax*scale+tx,ymax*scale+ty]],uvTransform:{scale,tx,ty,baseline},environment:{width:environment.width,height:environment.height,type:environment.texture.type},shadowMap:[512,512],limits:'Curve tessellation is approximate. Font-derived geometry, not bespoke calligrapher artwork. Quest hardware untested.'};
 return{group,info,dispose(){geometries.forEach(g=>g.dispose());gold.dispose();bronze.dispose();roughness.dispose();floorGeometry.dispose();floorMaterial.dispose();environment.dispose();key.shadow.dispose()}};
}
