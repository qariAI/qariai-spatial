import * as T from 'three';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import outlines from './outlines.json';
import layout from './layout.json';
export function makeSeal(){
 const root=new T.Group(),loader=new SVGLoader();const gold=new T.MeshStandardMaterial({color:'#c9c0a0',metalness:.72,roughness:.34}),bronze=new T.MeshStandardMaterial({color:'#705135',metalness:.72,roughness:.48}),dark=new T.MeshStandardMaterial({color:'#18212a',metalness:.52,roughness:.69});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!,pixels=c.createImageData(256,256);let seed=4837;for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=96+(seed>>>25);pixels.data.set([n,n,n,255],i);}c.putImageData(pixels,0,0);const grain=new T.CanvasTexture(canvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(4,4);dark.bumpMap=grain;dark.bumpScale=.025;dark.roughnessMap=grain;gold.bumpMap=grain;gold.bumpScale=.003;bronze.bumpMap=grain;bronze.bumpScale=.009;
 function mesh(geometry:T.BufferGeometry,material:T.Material|T.Material[],z=0){const m=new T.Mesh(geometry,material);m.position.z=z;m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
 const plateShape=new T.Shape();plateShape.absarc(0,0,4.58,0,Math.PI*2,false);
 // Three flowing openings in the backing: architectural negative space, not text.
 for(const [x,y,rotation] of [[-2.45,1.2,-.5],[2.4,.6,.45],[0,-.4,.1]]){
  const hole=new T.Path();hole.absellipse(x,y,.33,1.42,0,Math.PI*2,true,rotation);plateShape.holes.push(hole);
 }
 mesh(new T.ExtrudeGeometry(plateShape,{depth:.4,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,curveSegments:18}),[dark,bronze],-.45);
 // A single fine rim and incomplete, low architectural ribs support the sculpture.
 mesh(new T.TorusGeometry(4.44,.022,6,160),bronze,-.025);
 const ribs:T.BufferGeometry[]=[];
 for(const [radius,start,end] of [[4.12,.15,1.72],[3.95,2.05,3.55],[4.05,3.9,5.92]]){
  const points=Array.from({length:49},(_,i)=>{const a=start+(end-start)*i/48;return new T.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,-.008);});
  ribs.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,.012,5,false));
 }
 mesh(mergeGeometries(ribs),bronze);ribs.forEach(g=>g.dispose());
 const glyphs:T.BufferGeometry[]=[],backs:T.BufferGeometry[]=[];
 function glyph(data:{path:string;bounds:number[]},x:number,y:number,angle:number,size:number,fitWidth=false,z=.065){
  const [l,b,r,t]=data.bounds,s=size/(fitWidth?r-l:t-b);const paths=loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path fill="#fff" fill-rule="nonzero" d="${data.path}"/></svg>`).paths;
  for(const path of paths){const shapes=SVGLoader.createShapes(path);if(!shapes.length)continue;const g=new T.ExtrudeGeometry(shapes,{depth:.145,bevelEnabled:false,curveSegments:10,steps:1});g.translate(-(l+r)/2,-(b+t)/2,0);g.scale(s,s,1);g.rotateZ(angle);g.translate(x,y,z);glyphs.push(g);const back=new T.ExtrudeGeometry(shapes,{depth:.13,bevelEnabled:true,bevelSize:.003,bevelThickness:.008,bevelSegments:2,curveSegments:6});back.translate(-(l+r)/2,-(b+t)/2,0);back.scale(s,s,1);back.rotateZ(angle);back.translate(x,y,z-.015);backs.push(back);}
 }
 // Each isolated motif is transformed rigidly in XY; no invented joins or warped outlines.
 outlines.letters.forEach((data,i)=>{const p=layout.letters[i];glyph(data,p.x,p.y,p.angle,p.height,false,p.z);});
 const inscription=layout.excerpt;
 glyph(outlines.excerpt,inscription.x,inscription.y,0,inscription.width,true,inscription.z);
 // Material groups from extrusion distinguish native outline caps and bronze sides.
 // Consolidate all cap/side groups into two draws, preserving every triangle.
 for(const materialIndex of [0,1]){const positions:number[]=[],normals:number[]=[],uvs:number[]=[];for(const g of glyphs){for(const part of g.groups){if(part.materialIndex!==materialIndex)continue;for(let i=part.start;i<part.start+part.count;i++){const n=g.index?g.index.getX(i):i;positions.push(g.attributes.position.getX(n),g.attributes.position.getY(n),g.attributes.position.getZ(n));normals.push(g.attributes.normal.getX(n),g.attributes.normal.getY(n),g.attributes.normal.getZ(n));uvs.push(g.attributes.uv.getX(n),g.attributes.uv.getY(n));}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));mesh(g,materialIndex===0?gold:bronze);}
 glyphs.forEach(g=>g.dispose());mesh(mergeGeometries(backs),bronze);backs.forEach(g=>g.dispose());
 let geometryBytes=0,triangles=0;root.traverse(o=>{if(o instanceof T.Mesh){const g=o.geometry;for(const name of Object.keys(g.attributes))geometryBytes+=g.getAttribute(name).array.byteLength;if(g.index)geometryBytes+=g.index.array.byteLength;triangles+=(g.index?g.index.count:g.attributes.position.count)/3;}});root.userData.resources={geometryBytes,triangles,grainBytesWithMipmaps:256*256*4*4/3,shadowMapSize:512};
 root.userData.provenance={font:outlines.font.sha256,excerpt:outlines.excerpt.text,letters:outlines.letters.map(x=>x.text).join(' ')};
 return {root,dispose:()=>{root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});gold.dispose();bronze.dispose();dark.dispose();grain.dispose();}};
}
