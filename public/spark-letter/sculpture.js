import * as THREE from 'three';
import {SVGLoader} from './vendor/SVGLoader.js';
import {crownCap} from './crowned-cap.js';
import {designSurface} from './surface-design.js';
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
 const surface=designSurface(outline,scale);
 const gold=new THREE.MeshPhysicalMaterial({color:'#fff',map:surface.pigment,bumpMap:surface.relief,bumpScale:.005,roughnessMap:surface.relief,metalnessMap:surface.relief,metalness:1,roughness:1,clearcoat:.45,clearcoatRoughness:.6,clearcoatRoughnessMap:surface.relief,iridescence:.4,iridescenceIOR:1.3,iridescenceThicknessRange:[220,480],envMapIntensity:1.1});
 const bronze=new THREE.MeshPhysicalMaterial({color:'#244d78',metalness:.42,roughness:.56,iridescence:.08,iridescenceThicknessRange:[240,360],envMapIntensity:1});
 const group=new THREE.Group();group.name='font-derived-kaf-sculpture';const geometries=[];let triangles=0,bytes=0;
 const depth=.20,bevel=.012;
 const [xmin,ymin,xmax,ymax]=outline.bounds;
 const uv={generateTopUV(g,v,a,b,c){return[a,b,c].map(i=>new THREE.Vector2((v[i*3]-xmin)/(xmax-xmin),(v[i*3+1]-ymin)/(ymax-ymin)))},generateSideWallUV(g,v,a,b,c,d){return[a,b,c,d].map(i=>new THREE.Vector2(v[i*3]*scale,v[i*3+2]*scale))}};
 for(const shape of shapes){
  // Negative offset keeps the body contour at the source boundary. The narrow
  // bevel is cut inward; no outward stroke expansion or freehand replacement.
  let geometry=new THREE.ExtrudeGeometry(shape,{depth:depth/scale,steps:1,curveSegments:12,bevelEnabled:true,bevelThickness:.02/scale,bevelSize:bevel/scale,bevelOffset:-bevel/scale,bevelSegments:4,UVGenerator:uv});
  geometry.scale(scale,scale,scale);geometry.translate(tx,ty,-.10);const crown=crownCap(geometry,shape,{scale,tx,ty,bevel});geometry.dispose();geometry=crown.geometry;geometry.computeBoundingBox();geometries.push(geometry);triangles+=geometry.attributes.position.count/3;bytes+=Object.values(geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(geometry.index?.array.byteLength||0);
  const mesh=new THREE.Mesh(geometry,[gold,bronze]);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 }
 if(triangles>20000||bytes>2*1024*1024)throw Error('Single-letter geometry budget exceeded');
 // Bounded studio reflection map. Its light cards never appear as scene objects.
 const studio=new THREE.Scene();studio.background=new THREE.Color(.035,.045,.055);const cards=[];
 for(const [position,size,rgb] of [[[-2,2,4],[3,5],[2.8,2.9,3.1]],[[3,1,3],[1,3],[.4,.9,1.1]],[[0,5,-1],[5,1],[2,1.7,1.2]],[[0,1,-4],[5,4],[1.6,1.9,2.2]],[[-3,-1,3],[.5,4],[1.4,1.6,2]]]){const material=new THREE.MeshBasicMaterial();material.color.setRGB(...rgb);const card=new THREE.Mesh(new THREE.PlaneGeometry(...size),material);card.position.set(...position);card.lookAt(0,0,0);studio.add(card);cards.push(card)}
 const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(studio,.035,.1,50,{size:128});scene.environment=environment.texture;pmrem.dispose();cards.forEach(c=>{c.geometry.dispose();c.material.dispose()});
 const key=new THREE.DirectionalLight('#fff1d3',2.4);key.position.set(-3,4,5);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=key.shadow.camera.bottom=-6;key.shadow.camera.right=key.shadow.camera.top=6;key.shadow.normalBias=.012;key.shadow.bias=-.0002;scene.add(key,key.target);
 const rim=new THREE.PointLight('#8bc7b7',8,15,2);rim.position.set(3,1,2);scene.add(rim);scene.add(new THREE.HemisphereLight('#b2c2d5','#352a20',.5));
 // Floating presentation: no floor or decorative backing object.
 const bounds=new THREE.Box3().setFromObject(group);
 const info={kind:'physical extrusion of original font vectors; not raster tracing',glyph:outline.glyph,pathHash:outline.pathSha256,fontHash,components:shapes.length,triangles,geometryBytes:bytes,depth,bevel,crown:{height:.004,width:.055,xyUnchanged:true},finish:'designed sapphire perimeter with localized amber/coral/turquoise highlights and restrained iridescent sheen',surface:surface.info,floatingPresentation:true,bevelDirection:'inward',bounds:[bounds.min.toArray(),bounds.max.toArray()],sourceBoundsWorld:[[xmin*scale+tx,ymin*scale+ty],[xmax*scale+tx,ymax*scale+ty]],uvTransform:{scale,tx,ty,baseline},environment:{width:environment.width,height:environment.height,type:environment.texture.type},shadowMap:[512,512],limits:'Curve tessellation is approximate. Font-derived geometry, not bespoke calligrapher artwork. Quest hardware untested.'};
 return{group,info,dispose(){geometries.forEach(g=>g.dispose());gold.dispose();bronze.dispose();surface.dispose();environment.dispose();key.shadow.dispose()}};
}
